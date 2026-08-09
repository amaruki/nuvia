/**
 * UI-41 / Phase 8 guardrail 8 — route-auth coverage through the middleware.
 *
 * The Stripe webhook authenticates the caller by Stripe-Signature, not by
 * session (ADR-0015 §4, docs/api-specs/webhooks.md), so `isPublicEndpoint`
 * in src/proxy.ts must exempt `/api/v1/webhooks/stripe`. The gap survived
 * CI because the existing webhook tests call the handler directly (they
 * bypass src/proxy.ts entirely) and tests/auth-route-coverage.test.ts
 * regex-matches source text. These tests exercise the real request path
 * instead: proxy() runs first, and the route handler runs only when the
 * middleware lets the request through — exactly Next.js's dispatch order.
 *
 * Gateway selection: bun test shares one module registry across every file
 * in a run, and src/lib/env.ts parses process.env exactly once at first
 * import — long before this file necessarily loads — so selecting the
 * Stripe gateway through PAYMENT_GATEWAY is not reliably possible here.
 * Instead the adapter's documented test seams are used:
 *  - mock.module points resolvePaymentGateway() at a real StripeGateway
 *    (restored in afterAll so later files get the env-driven resolver);
 *  - StripeGatewayOptions injects the signing secret and the SDK surface
 *    (src/lib/payments/stripe/client.ts), the same seam fixtures.ts uses.
 * The handler itself is untouched: the route, its verification call chain,
 * and its response contract all run for real.
 *
 * Crypto note: Bun resolves stripe's worker build (package exports "bun"
 * condition), whose default crypto provider is async-only — the sync
 * webhooks.constructEvent would throw. Production (Node, CJS build) is not
 * affected. We therefore instantiate the SDK's NodeCryptoProvider by
 * absolute path (the exports map hides it) and pass it explicitly to the
 * SDK's own generateTestHeaderString / constructEvent — real Stripe HMAC
 * verification, just with the provider named instead of defaulted.
 */

import { afterAll, describe, expect, mock, test } from "bun:test";
import { dirname, join } from "node:path";
import { NextRequest } from "next/server";
import Stripe from "stripe";
import { testIp } from "./helpers";
import { POST } from "@/app/api/v1/webhooks/stripe/route";
import * as gatewayModule from "@/lib/payments/gateway";
import { StripeGateway } from "@/lib/payments/stripe";
import type { StripeClientSurface } from "@/lib/payments/stripe/client";
import { proxy } from "@/proxy";

const WEBHOOK_PATH = "/api/v1/webhooks/stripe";

/** Generated signing secret; signature headers below are computed against it. */
const WEBHOOK_SECRET = `whsec_test_${crypto.randomUUID().replace(/-/g, "")}`;

/** The SDK's node:crypto-backed provider — sync-capable under Bun. */
const { NodeCryptoProvider } = require(
  join(dirname(require.resolve("stripe")), "crypto", "NodeCryptoProvider.js"),
) as { NodeCryptoProvider: new () => Stripe.CryptoProvider };
const cryptoProvider = new NodeCryptoProvider();

/**
 * Real SDK client with the provider made explicit (the worker-build default
 * is async-only). Only signature verification touches it in these tests; the
 * money members throw loudly if anything unexpected calls them.
 */
const stripeClient = new Stripe(`sk_test_${crypto.randomUUID().replace(/-/g, "")}`);
const clientSurface: StripeClientSurface = {
  checkout: {
    sessions: {
      create: () => {
        throw new Error("UI-41 middleware test never creates checkout sessions");
      },
    },
  },
  paymentIntents: {
    retrieve: () => {
      throw new Error("UI-41 middleware test never retrieves payment intents");
    },
  },
  charges: {
    retrieve: () => {
      throw new Error("UI-41 middleware test never retrieves charges");
    },
  },
  webhooks: {
    constructEvent: (payload, header, secret) =>
      stripeClient.webhooks.constructEvent(payload, header, secret, undefined, cryptoProvider),
  },
};

const stripeGateway = new StripeGateway({
  apiKey: `sk_test_${crypto.randomUUID().replace(/-/g, "")}`,
  webhookSecret: WEBHOOK_SECRET,
  client: clientSurface,
});

const originalGatewayExports = { ...gatewayModule };

mock.module("@/lib/payments/gateway", () => ({
  ...originalGatewayExports,
  resolvePaymentGateway: () => stripeGateway,
}));

afterAll(() => {
  // Leave the shared registry exactly as found — later test files get the
  // real, env-driven resolver back (including its resolution cache).
  mock.module("@/lib/payments/gateway", () => ({ ...originalGatewayExports }));
});

/** Mirrors Next.js dispatch: middleware first, handler only on pass-through. */
async function dispatch(request: NextRequest): Promise<Response> {
  const middlewareResult = await proxy(request);
  // NextResponse.next() signals pass-through via this internal header.
  if (middlewareResult.headers.get("x-middleware-next") !== "1") {
    return middlewareResult; // middleware blocked the request
  }
  return POST(request);
}

function webhookRequest(body: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost:3000${WEBHOOK_PATH}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      // Unique source IP per request: the generic /api/** rate limit bucket
      // is keyed by client IP (ADR-0003).
      "x-forwarded-for": testIp(),
      ...headers,
    },
    body,
  });
}

/** Success envelope for the route's documented 200 "ignored" answer. */
interface IgnoredEventBody {
  data?: { received?: boolean; ignored?: boolean };
}

/** RFC 9457 problem body for the route's 400 verification rejection. */
interface ProblemBody {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
}

/**
 * A well-formed Stripe event whose type the adapter deliberately does not
 * map (the default case in src/lib/payments/stripe/webhook.ts). A valid
 * signature on it exercises the full verification path and lands on the
 * route's documented 200 `{received: true, ignored: true}` — proof the
 * handler ran, without touching the payment service or the database.
 */
const IGNORED_EVENT_PAYLOAD = JSON.stringify({
  id: "evt_middleware_coverage",
  object: "event",
  api_version: "2025-11-17.acacia",
  created: 1_700_000_000,
  data: { object: { id: "cu_middleware_coverage", object: "customer" } },
  livemode: false,
  type: "customer.created",
});

/** The stripe SDK's documented test-header helper against our secret. */
function signPayload(payload: string): string {
  return Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: WEBHOOK_SECRET,
    cryptoProvider,
  });
}

describe("proxy() lets the Stripe webhook through (UI-41)", () => {
  test("an anonymous callback with a valid signature reaches the handler", async () => {
    const res = await dispatch(
      webhookRequest(IGNORED_EVENT_PAYLOAD, {
        "stripe-signature": signPayload(IGNORED_EVENT_PAYLOAD),
      }),
    );

    // The middleware must not answer the session-401; the handler's own
    // documented response for a valid-but-unmapped event type is this 200.
    expect(res.status).toBe(200);
    const body = (await res.json()) as IgnoredEventBody;
    expect(body.data).toEqual({ received: true, ignored: true });
  });

  test("an anonymous callback with an INVALID signature gets the handler's 400, not a session-401", async () => {
    const signature = `t=${Math.floor(Date.now() / 1000)},v1=${"f".repeat(64)}`;

    const res = await dispatch(
      webhookRequest(IGNORED_EVENT_PAYLOAD, { "stripe-signature": signature }),
    );

    // Signature verification failed INSIDE the handler — the request got
    // that far. A middleware session-401 would surface as status 401.
    expect(res.status).toBe(400);
    const body = (await res.json()) as ProblemBody;
    expect(body.title).toBe("Webhook verification failed");
    expect(body.status).toBe(400);
    expect(body.type?.endsWith("/problems/webhook-verification-failed")).toBe(true);
  });

  test("an anonymous callback with NO signature gets the handler's 400, not a session-401", async () => {
    const res = await dispatch(webhookRequest(IGNORED_EVENT_PAYLOAD));

    expect(res.status).toBe(400);
    const body = (await res.json()) as ProblemBody;
    expect(body.title).toBe("Webhook verification failed");
    expect(body.type?.endsWith("/problems/webhook-verification-failed")).toBe(true);
  });

  test("proxy() itself passes the webhook path through for anonymous callers", async () => {
    const middlewareResult = await proxy(
      webhookRequest(IGNORED_EVENT_PAYLOAD, {
        "stripe-signature": signPayload(IGNORED_EVENT_PAYLOAD),
      }),
    );

    expect(middlewareResult.status).not.toBe(401);
    expect(middlewareResult.headers.get("x-middleware-next")).toBe("1");
  });

  test("the allow-list entry did not leak to neighbouring API paths", async () => {
    // The parent prefix must stay session-gated: the exemption is the exact
    // webhook path, not a /api/v1/webhooks wildcard.
    const parent = await proxy(
      new NextRequest("http://localhost:3000/api/v1/webhooks", {
        method: "POST",
        headers: { "x-forwarded-for": testIp() },
      }),
    );
    expect(parent.status).toBe(401);

    // An unrelated protected API path keeps its session gate too.
    const members = await proxy(
      new NextRequest("http://localhost:3000/api/v1/members", {
        headers: { "x-forwarded-for": testIp() },
      }),
    );
    expect(members.status).toBe(401);
  });
});
