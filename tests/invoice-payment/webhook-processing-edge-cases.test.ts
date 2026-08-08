/**
 * Backlog C3 — verified-webhook processing end to end against the shared
 * test database: orphaned events, lifecycle collisions, and failure
 * compensation of the idempotency claim.
 * One part of the split tests/invoice-payment.test.ts; shared setup lives
 * in ./fixtures.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipTransaction, membershipWebhookEvent } from "@/db/schema";
import {
  GatewayError,
  type PaymentGateway,
  type VerifiedWebhookEvent,
} from "@/lib/payments/gateway";
import { processGatewayWebhook } from "@/lib/services/payment.service";
import { cancelSubscription } from "@/lib/services/subscription.service";
import {
  actor,
  auditCount,
  buildNoopStripeGateway,
  cleanupTestData,
  createTestSubscription,
  createTestTier,
  expectRejects,
  suffix,
  trackWebhookEvent,
} from "./fixtures";

afterAll(cleanupTestData);

describe("verified-webhook processing end to end (payment.service)", () => {
  let tierId: string;
  const mockedStripe = buildNoopStripeGateway();

  beforeAll(async () => {
    tierId = await createTestTier("c3-webhook", "C3 Webhook Tier");
  });

  test("orphaned events are audited, claimed, and answered without writes", async () => {
    const eventId = `evt_${suffix()}`;
    trackWebhookEvent("stripe", eventId);
    const orphansBefore = await auditCount("WEBHOOK_ORPHANED");

    const result = await processGatewayWebhook(
      {
        providerTxId: "pi_orphan",
        providerState: "complete",
        subscriptionId: "missing-sub",
        raw: {},
      },
      { eventId, eventType: "checkout.session.completed" },
      actor,
      mockedStripe,
    );

    expect(result.action).toBe("none");
    expect(result.transactionId).toBeUndefined();
    expect(await auditCount("WEBHOOK_ORPHANED")).toBe(orphansBefore + 1);

    // The claim row persists by design, so retries stay no-ops.
    const retry = await processGatewayWebhook(
      {
        providerTxId: "pi_orphan",
        providerState: "complete",
        subscriptionId: "missing-sub",
        raw: {},
      },
      { eventId, eventType: "checkout.session.completed" },
      actor,
      mockedStripe,
    );
    expect(retry.duplicate).toBe(true);
  });

  test("lifecycle collisions are swallowed; the ledger row still lands", async () => {
    const { subscriptionId } = await createTestSubscription(tierId);
    await cancelSubscription(subscriptionId, actor);
    const eventId = `evt_${suffix()}`;
    trackWebhookEvent("stripe", eventId);

    const result = await processGatewayWebhook(
      {
        providerTxId: "pi_late_1",
        providerState: "complete",
        subscriptionId,
        raw: { amount: 1200 },
      },
      { eventId, eventType: "checkout.session.completed" },
      actor,
      mockedStripe,
    );

    // Renewal is illegal for a canceled subscription, but the event is
    // genuinely processed — no infinite provider retries.
    expect(result.action).toBe("recorded");
    const [ledgerRow] = await db
      .select()
      .from(membershipTransaction)
      .where(eq(membershipTransaction.id, result.transactionId!));
    expect(ledgerRow.status).toBe("COMPLETED");
  });

  test("processing failure releases the idempotency claim for the retry", async () => {
    const { subscriptionId } = await createTestSubscription(tierId);
    const eventId = `evt_${suffix()}`;
    trackWebhookEvent("stripe", eventId);

    const brokenGateway: PaymentGateway = {
      provider: "stripe",
      createCheckout: async () => ({
        checkoutUrl: null,
        providerTxId: null,
        providerState: "open",
      }),
      verifyWebhook: async () => {
        throw new GatewayError("not used", "WEBHOOKS_NOT_SUPPORTED");
      },
      getChargeStatus: async () => {
        throw new GatewayError("not used", "QUERY_NOT_SUPPORTED");
      },
      toTransactionStatus: () => {
        throw new GatewayError("boom", "UNKNOWN_STATE");
      },
      toSubscriptionStatus: () => null,
    };

    const event: VerifiedWebhookEvent = {
      providerTxId: "pi_retry_1",
      providerState: "complete",
      subscriptionId,
      raw: { amount_total: 1200 },
    };
    const context = { eventId, eventType: "checkout.session.completed" };

    await expectRejects(
      () => processGatewayWebhook(event, context, actor, brokenGateway),
      "UNKNOWN_STATE",
      GatewayError,
    );

    // The compensating delete gave the claim back...
    const claim = await db.query.membershipWebhookEvent.findFirst({
      where: and(
        eq(membershipWebhookEvent.provider, "stripe"),
        eq(membershipWebhookEvent.eventId, eventId),
      ),
    });
    expect(claim).toBeUndefined();

    // ...so the provider's retry (now hitting a healthy mapping) succeeds.
    const retry = await processGatewayWebhook(event, context, actor, mockedStripe);
    expect(retry.duplicate).toBe(false);
    expect(retry.action).toBe("renewed");
  });
});
