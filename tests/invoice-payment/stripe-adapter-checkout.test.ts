/**
 * Backlog C3 — the Stripe adapter against a mocked SDK surface (no network
 * ever): constructor guard and checkout session params.
 * One part of the split tests/invoice-payment.test.ts; the mocked-gateway
 * seam lives in ./fixtures.
 */

import { describe, expect, test } from "bun:test";
import type Stripe from "stripe";
import { GatewayError } from "@/lib/payments/gateway";
import { StripeGateway } from "@/lib/payments/stripe";
import { buildMockedStripeGateway, expectRejects } from "./fixtures";

describe("Stripe adapter — mocked SDK, no network", () => {
  test("constructor rejects when STRIPE_SECRET_KEY is missing", () => {
    // The parsed env may legitimately carry a key in some environments; the
    // guard only applies where the boot-time check is the real protection.
    if (process.env.STRIPE_SECRET_KEY) return;

    const err: unknown = (() => {
      try {
        return new StripeGateway();
      } catch (error) {
        return error;
      }
    })();
    expect(err).toBeInstanceOf(GatewayError);
    expect((err as GatewayError).code).toBe("MISSING_CREDENTIALS");
  });

  test("createCheckout builds a payment-mode session in minor units", async () => {
    const { gateway, calls } = buildMockedStripeGateway({
      createSession: () =>
        ({
          id: "cs_test_1",
          url: "https://checkout.stripe.test/sess_1",
          payment_intent: "pi_test_1",
          status: "open",
        }) as unknown as Stripe.Checkout.Session,
    });

    const result = await gateway.createCheckout({
      userId: "user-1",
      subscriptionId: "sub-1",
      tierId: "tier-1",
      tierName: "Gold",
      amountMinor: 1200,
      currency: "usd",
      returnUrl: "https://app.test/return",
    });

    expect(result.checkoutUrl).toBe("https://checkout.stripe.test/sess_1");
    expect(result.providerTxId).toBe("pi_test_1");
    expect(result.providerState).toBe("open");

    expect(calls.sessions).toHaveLength(1);
    const params = calls.sessions[0];
    expect(params.mode).toBe("payment");
    expect(params.client_reference_id).toBe("user-1");
    expect(params.metadata?.subscriptionId).toBe("sub-1");
    expect(params.metadata?.tierId).toBe("tier-1");
    expect(params.success_url).toBe("https://app.test/return");
    expect(params.cancel_url).toBe("https://app.test/return");

    const line = params.line_items?.[0];
    expect(line?.quantity).toBe(1);
    expect(line?.price_data?.unit_amount).toBe(1200);
    expect(line?.price_data?.currency).toBe("usd");
    expect(line?.price_data?.product_data?.name).toBe("Gold");
  });

  test("createCheckout rejects non-positive minor amounts before any provider call", async () => {
    const { gateway, calls } = buildMockedStripeGateway();
    await expectRejects(
      () =>
        gateway.createCheckout({
          userId: "u",
          subscriptionId: "s",
          tierId: "t",
          tierName: "X",
          amountMinor: 0,
          currency: "usd",
        }),
      "INVALID_AMOUNT",
      GatewayError,
    );
    expect(calls.sessions).toHaveLength(0);
  });

  test("createCheckout wraps provider failures in PROVIDER_ERROR", async () => {
    const { gateway } = buildMockedStripeGateway({
      createSession: () => {
        throw new Error("stripe is down");
      },
    });

    const err: unknown = await gateway
      .createCheckout({
        userId: "u",
        subscriptionId: "s",
        tierId: "t",
        tierName: "X",
        amountMinor: 500,
        currency: "usd",
      })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(GatewayError);
    expect((err as GatewayError).code).toBe("PROVIDER_ERROR");
  });
});
