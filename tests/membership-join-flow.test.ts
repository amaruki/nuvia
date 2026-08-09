/**
 * UI-33 — membership join/renew funnel (decision D10: self-serve Stripe
 * track AND application track).
 *
 * Red-phase suite for src/lib/services/membership-join.service:
 *
 *  - the public tier catalog projects a safe shape (active tiers only, no
 *    permissions/metadata/maxUsers admin internals);
 *  - track selection is honest: no configured gateway → manual track, never
 *    a faked payment; Stripe configured → real createSubscription + hosted
 *    checkout through the adapter, with the SDK surface mocked
 *    (buildMockedStripeGateway runs the adapter's real mapping logic);
 *  - the funnel completes: a verified success webhook drives the state
 *    machine (renew → new ACTIVE row, ADR-0014) and settles the ledger.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { and, desc, eq, inArray } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db/client";
import { authLog, membershipSubscription, membershipTransaction } from "@/db/schema";
import { NotFoundError } from "@/lib/errors";
import { GatewayError } from "@/lib/payments/gateway";
import { processGatewayWebhook } from "@/lib/services/payment.service";
import {
  MANUAL_JOIN_GUIDANCE,
  getPublicTier,
  joinMembership,
  listPublicTiers,
  renewMembershipCheckout,
  selectJoinTrack,
} from "@/lib/services/membership-join.service";
import { buildMockedStripeGateway } from "./invoice-payment/fixtures";
import { createFunnelFixtures } from "./membership-funnel/fixtures";

const fx = createFunnelFixtures();
const SYSTEM_ACTOR = { actorId: "system:ui33-join-flow" };

afterAll(async () => {
  await fx.cleanup();
});

describe("UI-33 public tier catalog", () => {
  let activeTierId: string;
  let inactiveTierId: string;

  beforeAll(async () => {
    activeTierId = await fx.seedTier({
      displayName: `Professional ${fx.RUN_ID}`,
      price: "49.00",
      features: ["Voting rights", "Event discounts"],
      benefits: ["Monthly newsletter"],
    });
    inactiveTierId = await fx.seedTier({
      displayName: `Retired ${fx.RUN_ID}`,
      isActive: false,
    });
  });

  it("exposes only active tiers", async () => {
    const tiers = await listPublicTiers();
    const ids = tiers.map((tier) => tier.id);
    expect(ids).toContain(activeTierId);
    expect(ids).not.toContain(inactiveTierId);
  });

  it("projects a public-safe shape — no admin internals leak", async () => {
    const tiers = await listPublicTiers();
    const tier = tiers.find((candidate) => candidate.id === activeTierId);
    expect(tier).toBeDefined();
    if (!tier) return;
    expect(tier.price).toBe("49.00");
    expect(tier.billingCycle).toBe("monthly");
    expect(tier.features).toEqual(["Voting rights", "Event discounts"]);
    // Admin internals must not cross the public boundary.
    expect("permissions" in tier).toBe(false);
    expect("metadata" in tier).toBe(false);
    expect("maxUsers" in tier).toBe(false);
  });

  it("getPublicTier hides unknown and inactive tiers", async () => {
    await expect(getPublicTier("00000000-0000-0000-0000-000000000000")).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(getPublicTier(inactiveTierId)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("UI-33 join track selection", () => {
  it("selects the manual track when no gateway is configured", () => {
    expect(selectJoinTrack()).toBe("manual");
  });

  it("selects the stripe track when a stripe gateway is provided", () => {
    const { gateway } = buildMockedStripeGateway();
    expect(selectJoinTrack(gateway)).toBe("stripe");
  });
});

describe("UI-33 manual join fallback — never fakes payment success", () => {
  let userId: string;
  let tierId: string;

  beforeAll(async () => {
    ({ userId } = await fx.signUp("manual-joiner"));
    tierId = await fx.seedTier({ displayName: `Manual ${fx.RUN_ID}`, price: "25.00" });
  });

  it("returns offline guidance, reports unpaid, and creates no subscription", async () => {
    const result = await joinMembership({ userId, tierId }, SYSTEM_ACTOR);

    expect(result.track).toBe("manual");
    if (result.track !== "manual") throw new Error("unreachable");
    expect(result.paymentStatus).toBe("unpaid");
    expect(result.subscription).toBeNull();
    expect(result.checkoutUrl).toBeNull();
    expect(result.guidance).toEqual(MANUAL_JOIN_GUIDANCE);
    // Honest copy: names the manual/offline payment step, fabricates no price.
    const text = MANUAL_JOIN_GUIDANCE.join(" ").toLowerCase();
    expect(text).toContain("manual");
    expect(text).not.toContain("$");

    const subscriptions = await db.query.membershipSubscription.findMany({
      where: eq(membershipSubscription.userId, userId),
    });
    expect(subscriptions).toHaveLength(0);
  });

  it("rejects unknown tiers", async () => {
    await expect(
      joinMembership({ userId, tierId: "00000000-0000-0000-0000-000000000000" }, SYSTEM_ACTOR),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("UI-33 stripe join — mocked client, real adapter logic", () => {
  let userId: string;
  let tierId: string;
  let joined: Awaited<ReturnType<typeof joinMembership>> | null = null;
  let joinGateway: ReturnType<typeof buildMockedStripeGateway> | null = null;

  beforeAll(async () => {
    ({ userId } = await fx.signUp("stripe-joiner"));
    tierId = await fx.seedTier({
      displayName: `Stripe ${fx.RUN_ID}`,
      price: "49.00",
      trialDays: 0,
    });
  });

  it("creates the subscription and a hosted checkout session", async () => {
    joinGateway = buildMockedStripeGateway({
      createSession: () =>
        ({
          id: `cs_test_${fx.RUN_ID}`,
          url: `https://checkout.stripe.com/c/pay/cs_test_${fx.RUN_ID}`,
        }) as Stripe.Checkout.Session,
    });
    const result = await joinMembership(
      {
        userId,
        tierId,
        returnUrl: "https://app.test/membership?checkout=returned",
        gateway: joinGateway.gateway,
      },
      SYSTEM_ACTOR,
    );
    joined = result;

    expect(result.track).toBe("stripe");
    if (result.track !== "stripe") throw new Error("unreachable");
    // Until the webhook confirms, the funnel says pending — never paid.
    expect(result.paymentStatus).toBe("pending");
    expect(result.checkoutUrl).toBe(`https://checkout.stripe.com/c/pay/cs_test_${fx.RUN_ID}`);
    expect(result.subscription).not.toBeNull();
    expect(result.subscription?.status).toBe("ACTIVE");

    // The mocked SDK received a payment-mode session for the tier price in
    // minor units, echoing the subscription id for the webhook.
    expect(joinGateway.calls.sessions).toHaveLength(1);
    const session = joinGateway.calls.sessions[0];
    expect(session.mode).toBe("payment");
    expect(session.line_items?.[0]?.price_data?.unit_amount).toBe(4900);
    expect(session.client_reference_id).toBe(userId);
    expect(session.metadata?.subscriptionId).toBe(result.subscription?.id);
    expect(session.metadata?.tierId).toBe(tierId);
    expect(session.success_url).toBe("https://app.test/membership?checkout=returned");

    // The create transition is audited in the same transaction.
    const audits = await db.query.authLog.findMany({
      where: and(eq(authLog.userId, userId), eq(authLog.eventType, "SUBSCRIPTION_CREATED")),
    });
    expect(audits.length).toBeGreaterThan(0);
  });

  it("completes the funnel when the success webhook arrives", async () => {
    if (!joined || joined.track !== "stripe") throw new Error("join step did not run");
    const subscriptionId = joined.subscription?.id;
    if (!subscriptionId) throw new Error("join step created no subscription");

    const eventId = `evt_ui33_${fx.RUN_ID}`;
    fx.webhookEvents.push({ provider: "stripe", eventId });

    const processed = await processGatewayWebhook(
      {
        providerTxId: joined.providerTxId ?? `pi_ui33_${fx.RUN_ID}`,
        providerState: "complete",
        subscriptionId,
        raw: { amount: 4900 },
      },
      { eventId, eventType: "checkout.session.completed" },
      SYSTEM_ACTOR,
      joinGateway?.gateway,
    );

    expect(processed.action).toBe("renewed");

    // Renewal swaps in a NEW row (ADR-0014); the member holds the latest.
    const rows = await db.query.membershipSubscription.findMany({
      where: eq(membershipSubscription.userId, userId),
      orderBy: desc(membershipSubscription.createdAt),
    });
    expect(rows.length).toBe(2);
    expect(rows[0].status).toBe("ACTIVE");

    // The ledger settled with a completed transaction for the tier price.
    const transactions = await db.query.membershipTransaction.findMany({
      where: inArray(
        membershipTransaction.subscriptionId,
        rows.map((row) => row.id),
      ),
    });
    expect(transactions.some((tx) => tx.status === "COMPLETED")).toBe(true);
  });

  it("compensates when checkout creation fails — no live subscription left behind", async () => {
    const failing = buildMockedStripeGateway(); // no createSession handler → throws
    const { userId: member } = await fx.signUp("stripe-joiner-failing");

    await expect(
      joinMembership({ userId: member, tierId, gateway: failing.gateway }, SYSTEM_ACTOR),
    ).rejects.toBeInstanceOf(GatewayError);

    const live = await db.query.membershipSubscription.findMany({
      where: and(
        eq(membershipSubscription.userId, member),
        inArray(membershipSubscription.status, ["ACTIVE", "TRIALING", "PAST_DUE", "PAUSED"]),
      ),
    });
    expect(live).toHaveLength(0);
  });
});

describe("UI-33 renewal checkout", () => {
  it("returns manual guidance without faking a renewal on the manual track", async () => {
    const { userId } = await fx.signUp("manual-renewer");
    const tierId = await fx.seedTier({ displayName: `Renew ${fx.RUN_ID}` });
    const { createSubscription } = await import("@/lib/services/subscription.service");
    const { subscription } = await createSubscription(
      { userId, tierId, trialDays: 0 },
      SYSTEM_ACTOR,
    );

    const result = await renewMembershipCheckout(
      { userId, subscriptionId: subscription.id },
      SYSTEM_ACTOR,
    );
    expect(result.track).toBe("manual");
    if (result.track !== "manual") throw new Error("unreachable");
    expect(result.paymentStatus).toBe("unpaid");
    expect(result.checkoutUrl).toBeNull();
    expect(result.guidance).toEqual(MANUAL_JOIN_GUIDANCE);
  });

  it("creates a hosted checkout against the existing subscription on stripe", async () => {
    const { userId } = await fx.signUp("stripe-renewer");
    const tierId = await fx.seedTier({
      displayName: `Renew Stripe ${fx.RUN_ID}`,
      price: "30.00",
      trialDays: 0,
    });
    const { createSubscription } = await import("@/lib/services/subscription.service");
    const { subscription } = await createSubscription(
      { userId, tierId, trialDays: 0 },
      SYSTEM_ACTOR,
    );

    const mocked = buildMockedStripeGateway({
      createSession: () =>
        ({
          id: `cs_renew_${fx.RUN_ID}`,
          url: `https://checkout.stripe.com/c/pay/cs_renew_${fx.RUN_ID}`,
        }) as Stripe.Checkout.Session,
    });

    const result = await renewMembershipCheckout(
      {
        userId,
        subscriptionId: subscription.id,
        returnUrl: "https://app.test/dashboard/memberships",
        gateway: mocked.gateway,
      },
      SYSTEM_ACTOR,
    );
    expect(result.track).toBe("stripe");
    if (result.track !== "stripe") throw new Error("unreachable");
    expect(result.paymentStatus).toBe("pending");
    expect(result.checkoutUrl).toBe(`https://checkout.stripe.com/c/pay/cs_renew_${fx.RUN_ID}`);
    // The webhook will drive the renewal — no new row is created up front.
    expect(mocked.calls.sessions[0].metadata?.subscriptionId).toBe(subscription.id);
    expect(mocked.calls.sessions[0].line_items?.[0]?.price_data?.unit_amount).toBe(3000);

    const rows = await db.query.membershipSubscription.findMany({
      where: eq(membershipSubscription.userId, userId),
    });
    expect(rows).toHaveLength(1);
  });

  it("refuses a renewal checkout for a subscription the member does not hold live", async () => {
    const { userId } = await fx.signUp("renew-canceled");
    const tierId = await fx.seedTier({ displayName: `Renew Dead ${fx.RUN_ID}` });
    const { cancelSubscription, createSubscription } =
      await import("@/lib/services/subscription.service");
    const { subscription } = await createSubscription(
      { userId, tierId, trialDays: 0 },
      SYSTEM_ACTOR,
    );
    await cancelSubscription(subscription.id, SYSTEM_ACTOR);

    await expect(
      renewMembershipCheckout({ userId, subscriptionId: subscription.id }, SYSTEM_ACTOR),
    ).rejects.toBeInstanceOf(Error);
  });
});
