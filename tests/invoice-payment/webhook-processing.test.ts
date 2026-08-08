/**
 * Backlog C3 — verified-webhook processing end to end against the shared
 * test database: renewal, ledger writes, invoice reconciliation,
 * idempotency, and the core event-state transitions.
 * One part of the split tests/invoice-payment.test.ts; shared setup lives
 * in ./fixtures.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipTransaction } from "@/db/schema";
import { type VerifiedWebhookEvent } from "@/lib/payments/gateway";
import { createInvoice, getInvoice } from "@/lib/services/invoice.service";
import { listPayments, processGatewayWebhook } from "@/lib/services/payment.service";
import { getSubscription } from "@/lib/services/subscription.service";
import {
  actor,
  auditCount,
  buildNoopStripeGateway,
  cleanupTestData,
  createTestSubscription,
  createTestTier,
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

  test("checkout.session.completed renews, writes the ledger, settles the invoice", async () => {
    const { memberId, subscriptionId } = await createTestSubscription(tierId);
    const invoice = await createInvoice({ subscriptionId }, actor);
    const eventId = `evt_${suffix()}`;
    trackWebhookEvent("stripe", eventId);

    const event: VerifiedWebhookEvent = {
      providerTxId: "pi_evt_1",
      providerState: "complete",
      subscriptionId,
      raw: { amount_total: 1200, currency: "usd" },
    };

    const result = await processGatewayWebhook(
      event,
      { eventId, eventType: "checkout.session.completed" },
      actor,
      mockedStripe,
    );

    expect(result.duplicate).toBe(false);
    expect(result.action).toBe("renewed");
    expect(result.transactionId).toBeDefined();
    // Renewal swaps in a new row (ADR-0014).
    expect(result.subscriptionId).not.toBe(subscriptionId);
    const renewed = await getSubscription(result.subscriptionId!);
    expect(renewed.status).toBe("ACTIVE");
    expect(renewed.metadata).toEqual({ renewedFrom: subscriptionId });

    // Ledger row from the webhook.
    const [ledgerRow] = await db
      .select()
      .from(membershipTransaction)
      .where(eq(membershipTransaction.id, result.transactionId!));
    expect(ledgerRow.status).toBe("COMPLETED");
    expect(ledgerRow.amount).toBe("12.00");
    expect(ledgerRow.providerTxId).toBe("pi_evt_1");
    expect(ledgerRow.paymentProvider).toBe("stripe");

    // Invoice reconciliation crossed the renewal row swap: the invoice was
    // issued against the OLD subscription row and still settled.
    const settled = await getInvoice(invoice.id);
    expect(settled.status).toBe("PAID");
    expect(settled.paidAmount).toBe("12.00");

    const { payments } = await listPayments({ invoiceId: invoice.id, page: 1, limit: 10 });
    expect(payments).toHaveLength(1);
    expect(payments[0].paymentProvider).toBe("stripe");
    expect(payments[0].transactionId).toBe(result.transactionId ?? null);

    expect(await auditCount("WEBHOOK_PROCESSED", memberId)).toBe(1);
  });

  test("duplicate delivery is a no-op", async () => {
    const { subscriptionId } = await createTestSubscription(tierId);
    const eventId = `evt_${suffix()}`;
    trackWebhookEvent("stripe", eventId);

    const event: VerifiedWebhookEvent = {
      providerTxId: "pi_dup_1",
      providerState: "complete",
      subscriptionId,
      raw: { amount_total: 1200, currency: "usd" },
    };
    const context = { eventId, eventType: "checkout.session.completed" };

    const first = await processGatewayWebhook(event, context, actor, mockedStripe);
    expect(first.duplicate).toBe(false);

    const second = await processGatewayWebhook(event, context, actor, mockedStripe);
    expect(second.duplicate).toBe(true);
    expect(second.action).toBe("none");

    const [txCount] = await db
      .select({ n: count() })
      .from(membershipTransaction)
      .where(eq(membershipTransaction.providerTxId, "pi_dup_1"));
    expect(txCount.n).toBe(1);
  });

  test("failed payment marks the subscription PAST_DUE with a FAILED ledger row", async () => {
    const { subscriptionId } = await createTestSubscription(tierId);
    const eventId = `evt_${suffix()}`;
    trackWebhookEvent("stripe", eventId);

    const result = await processGatewayWebhook(
      { providerTxId: "pi_fail_1", providerState: "failed", subscriptionId, raw: { amount: 1200 } },
      { eventId, eventType: "payment_intent.payment_failed" },
      actor,
      mockedStripe,
    );

    expect(result.action).toBe("past-due");
    const subscription = await getSubscription(result.subscriptionId!);
    expect(subscription.status).toBe("PAST_DUE");

    const [ledgerRow] = await db
      .select()
      .from(membershipTransaction)
      .where(eq(membershipTransaction.id, result.transactionId!));
    expect(ledgerRow.status).toBe("FAILED");
  });

  test("canceled payment intent cancels the subscription", async () => {
    const { subscriptionId } = await createTestSubscription(tierId);
    const eventId = `evt_${suffix()}`;
    trackWebhookEvent("stripe", eventId);

    const result = await processGatewayWebhook(
      {
        providerTxId: "pi_cancel_1",
        providerState: "canceled",
        subscriptionId,
        raw: { amount: 1200 },
      },
      { eventId, eventType: "payment_intent.canceled" },
      actor,
      mockedStripe,
    );

    expect(result.action).toBe("canceled");
    const subscription = await getSubscription(result.subscriptionId!);
    expect(subscription.status).toBe("CANCELED");

    const [ledgerRow] = await db
      .select()
      .from(membershipTransaction)
      .where(eq(membershipTransaction.id, result.transactionId!));
    expect(ledgerRow.status).toBe("CANCELED");
  });

  test("a refund alone records a REFUNDED ledger row without touching the subscription", async () => {
    const { subscriptionId } = await createTestSubscription(tierId);
    const eventId = `evt_${suffix()}`;
    trackWebhookEvent("stripe", eventId);

    const result = await processGatewayWebhook(
      {
        providerTxId: "ch_refund_1",
        providerState: "refunded",
        subscriptionId,
        raw: { amount: 1200 },
      },
      { eventId, eventType: "charge.refunded" },
      actor,
      mockedStripe,
    );

    expect(result.action).toBe("recorded");
    const subscription = await getSubscription(subscriptionId);
    expect(subscription.status).toBe("ACTIVE");

    const [ledgerRow] = await db
      .select()
      .from(membershipTransaction)
      .where(eq(membershipTransaction.id, result.transactionId!));
    expect(ledgerRow.status).toBe("REFUNDED");
  });
});
