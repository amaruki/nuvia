/**
 * Issue #27 (finding 1) — refund reversal end to end.
 *
 * Before this fix, a `charge.refunded` webhook wrote an informational
 * REFUNDED ledger row and stopped: the original charge's money stayed
 * booked, the invoice stayed PAID, and the revenue report kept counting
 * refunded dollars. The reversal now undoes all three.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipPayment, membershipTransaction } from "@/db/schema";
import { type VerifiedWebhookEvent } from "@/lib/payments/gateway";
import { createInvoice, getInvoice } from "@/lib/services/invoice.service";
import { processGatewayWebhook } from "@/lib/services/payment.service";
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

describe("refund reversal (issue #27, finding 1)", () => {
  let tierId: string;
  const mockedStripe = buildNoopStripeGateway();

  beforeAll(async () => {
    tierId = await createTestTier("refund-reversal", "Refund Reversal Tier");
  });

  /** Settles an ISSUED invoice via a COMPLETED webhook and returns ids. */
  async function settleInvoice(chargeId: string) {
    const { subscriptionId } = await createTestSubscription(tierId);
    const invoice = await createInvoice({ subscriptionId }, actor);
    const eventId = `evt_${suffix()}`;
    trackWebhookEvent("stripe", eventId);

    const event: VerifiedWebhookEvent = {
      providerTxId: chargeId,
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
    expect(result.action).toBe("renewed");

    const settled = await getInvoice(invoice.id);
    expect(settled.status).toBe("PAID");
    return { subscriptionId, invoiceId: invoice.id, ledgerId: result.transactionId! };
  }

  test("full refund reverses the ledger row, paidAmount, and reopens the invoice", async () => {
    const chargeId = `ch_refund_full_${suffix()}`;
    const { subscriptionId, invoiceId } = await settleInvoice(chargeId);
    const before = await auditCount("WEBHOOK_REFUND_REVERSED");

    const eventId = `evt_${suffix()}`;
    trackWebhookEvent("stripe", eventId);
    const refundEvent: VerifiedWebhookEvent = {
      providerTxId: chargeId,
      providerState: "refunded",
      subscriptionId,
      raw: { amount: 1200, amount_refunded: 1200, currency: "usd" },
    };
    const result = await processGatewayWebhook(
      refundEvent,
      { eventId, eventType: "charge.refunded" },
      actor,
      mockedStripe,
    );

    expect(result.duplicate).toBe(false);
    expect(result.transactionId).toBeDefined();

    // Ledger row flipped to REFUNDED with the refund trail recorded.
    const [ledgerRow] = await db
      .select()
      .from(membershipTransaction)
      .where(eq(membershipTransaction.providerTxId, chargeId));
    expect(ledgerRow.status).toBe("REFUNDED");
    const meta = ledgerRow.metadata as { refundedMinor?: number };
    expect(meta.refundedMinor).toBe(1200);

    // Invoice reopened: paidAmount unwound, status back to ISSUED.
    const reopened = await getInvoice(invoiceId);
    expect(reopened.status).toBe("ISSUED");
    expect(reopened.paidAmount).toBe("0.00");

    // The payment row mirrors the refunded ledger status, so finance reads
    // keyed on membership_payment show the reversal too.
    const [paymentRow] = await db
      .select()
      .from(membershipPayment)
      .where(eq(membershipPayment.providerTxId, chargeId));
    expect(paymentRow.status).toBe("REFUNDED");
    expect(await auditCount("WEBHOOK_REFUND_REVERSED")).toBe(before + 1);
  });

  test("repeating the same refund event is idempotent — no double reversal", async () => {
    const chargeId = `ch_refund_repeat_${suffix()}`;
    const { subscriptionId, invoiceId } = await settleInvoice(chargeId);
    const before = await auditCount("WEBHOOK_REFUND_REVERSED");

    const makeEvent = (eventId: string): VerifiedWebhookEvent => ({
      providerTxId: chargeId,
      providerState: "refunded",
      subscriptionId,
      raw: { amount: 1200, amount_refunded: 1200, currency: "usd" },
    });

    const first = await processGatewayWebhook(
      makeEvent(`evt_${suffix()}`),
      { eventId: `evt_${suffix()}`, eventType: "charge.refunded" },
      actor,
      mockedStripe,
    );
    expect(first.duplicate).toBe(false);

    // Second delivery of a refund with the same cumulative figure.
    const second = await processGatewayWebhook(
      makeEvent(`evt_${suffix()}`),
      { eventId: `evt_${suffix()}`, eventType: "charge.refunded" },
      actor,
      mockedStripe,
    );
    expect(second.transactionId).toBeDefined();

    // Invoice still shows exactly one unwinding, not two.
    const invoice = await getInvoice(invoiceId);
    expect(invoice.status).toBe("ISSUED");
    expect(invoice.paidAmount).toBe("0.00");
    // Exactly one reversal audit row for the whole charge.
    expect(await auditCount("WEBHOOK_REFUND_REVERSED")).toBe(before + 1);
  });

  test("partial refund leaves the invoice ISSUED with reduced paidAmount", async () => {
    const chargeId = `ch_refund_partial_${suffix()}`;
    const { subscriptionId, invoiceId } = await settleInvoice(chargeId);

    const eventId = `evt_${suffix()}`;
    trackWebhookEvent("stripe", eventId);
    const refundEvent: VerifiedWebhookEvent = {
      providerTxId: chargeId,
      providerState: "refunded",
      subscriptionId,
      raw: { amount: 1200, amount_refunded: 500, currency: "usd" },
    };
    const result = await processGatewayWebhook(
      refundEvent,
      { eventId, eventType: "charge.refunded" },
      actor,
      mockedStripe,
    );
    expect(result.transactionId).toBeDefined();

    const [ledgerRow] = await db
      .select()
      .from(membershipTransaction)
      .where(eq(membershipTransaction.providerTxId, chargeId));
    expect(ledgerRow.status).toBe("PARTIALLY_REFUNDED");

    const invoice = await getInvoice(invoiceId);
    expect(invoice.status).toBe("ISSUED");
    // 1200 settled - 500 refunded = 700 still paid.
    expect(invoice.paidAmount).toBe("7.00");
  });

  test("a second refund delta after a partial refund is applied once", async () => {
    const chargeId = `ch_refund_delta_${suffix()}`;
    const { subscriptionId, invoiceId } = await settleInvoice(chargeId);

    // First partial refund: 500 of 1200.
    await processGatewayWebhook(
      {
        providerTxId: chargeId,
        providerState: "refunded",
        subscriptionId,
        raw: { amount: 1200, amount_refunded: 500, currency: "usd" },
      },
      { eventId: `evt_${suffix()}`, eventType: "charge.refunded" },
      actor,
      mockedStripe,
    );

    // Provider reports the cumulative figure rising to 900 — only the 400
    // delta may unwind further.
    await processGatewayWebhook(
      {
        providerTxId: chargeId,
        providerState: "refunded",
        subscriptionId,
        raw: { amount: 1200, amount_refunded: 900, currency: "usd" },
      },
      { eventId: `evt_${suffix()}`, eventType: "charge.refunded" },
      actor,
      mockedStripe,
    );

    const invoice = await getInvoice(invoiceId);
    expect(invoice.status).toBe("ISSUED");
    expect(invoice.paidAmount).toBe("3.00");

    // Final refund to the full amount flips the ledger to REFUNDED.
    await processGatewayWebhook(
      {
        providerTxId: chargeId,
        providerState: "refunded",
        subscriptionId,
        raw: { amount: 1200, amount_refunded: 1200, currency: "usd" },
      },
      { eventId: `evt_${suffix()}`, eventType: "charge.refunded" },
      actor,
      mockedStripe,
    );

    const [ledgerRow] = await db
      .select()
      .from(membershipTransaction)
      .where(eq(membershipTransaction.providerTxId, chargeId));
    expect(ledgerRow.status).toBe("REFUNDED");
    const finalInvoice = await getInvoice(invoiceId);
    expect(finalInvoice.paidAmount).toBe("0.00");
  });
});
