/**
 * Same-transaction ledger settlement for processed webhook events: the
 * membership_transactions row, invoice reconciliation for successful
 * payments, and the audit entry all land in ONE db.transaction (ADR-0015 §5;
 * PRINCIPLES.md "Fast vs. auditable").
 */

import { and, asc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipInvoice, membershipPayment, membershipTransaction } from "@/db/schema";
import type { MembershipSubscription } from "@/db/schema";
import {
  toAmountString,
  toMinorUnits,
  type PaymentGateway,
  type SubscriptionStatus,
  type TransactionStatus,
  type VerifiedWebhookEvent,
} from "@/lib/payments/gateway";
import type { ActorContext } from "@/lib/services/subscription.service";
import { writeAudit } from "../audit";
import type { WebhookEventContext } from "../types";

export interface SettleWebhookLedgerInput {
  /** Subscription row as it stands AFTER lifecycle processing. */
  subscription: MembershipSubscription;
  /**
   * Subscription row the member held when billed. Renewal swaps in a NEW
   * row (ADR-0014); invoice reconciliation must accept both ids.
   */
  invoicedSubscriptionId: string;
  txStatus: TransactionStatus;
  subStatus: SubscriptionStatus | null;
  amountMinor: number;
  currency: string;
  gateway: PaymentGateway;
  event: VerifiedWebhookEvent;
  context: WebhookEventContext;
  actor: ActorContext;
  /** Business-rule collision note from lifecycle processing, if any. */
  lifecycleNote: string | null;
}

export interface LedgerSettlement {
  transactionId: string;
  appliedInvoiceId: string | null;
}

/**
 * Write the ledger transaction for a processed webhook event.
 *
 * Successful payments reconcile against the oldest ISSUED invoice of the
 * subscription, if any: the applied amount is capped at the invoice's
 * outstanding balance; surplus stays on the ledger row only.
 */
export async function settleWebhookLedger(
  input: SettleWebhookLedgerInput,
): Promise<LedgerSettlement> {
  const {
    subscription,
    invoicedSubscriptionId,
    txStatus,
    subStatus,
    amountMinor,
    currency,
    gateway,
    event,
    context,
    actor,
    lifecycleNote,
  } = input;
  const amount = toAmountString(amountMinor);

  return db.transaction(async (tx) => {
    // Ledger idempotency (issue #24): two independent dedupe keys, either of
    // which returns the existing settlement instead of writing fresh revenue.
    //
    // 1. Same webhook event id — the retry path where the lifecycle committed
    //    but settlement failed afterwards (claim released, provider retries).
    // 2. Same provider charge (provider + provider_tx_id) — the adversarial
    //    path: a provider (or a replay) can deliver TWO distinct event ids
    //    crediting ONE charge. Deduping by event id alone would settle both.
    //    Scoped to prior COMPLETED rows only: failed/pending events
    //    legitimately repeat (payment retries) and carry informational
    //    ledger rows; a COMPLETED settlement must never be suppressed by an
    //    earlier FAILED row for the same intent (adversarial probe: failed
    //    attempt then success on the same charge). Manual recordPayment
    //    rows are unreachable here because they carry a different
    //    payment_provider or no provider id at all.
    const dedupeByEvent = sql`${membershipTransaction.metadata}->>'webhookEventId' = ${context.eventId}`;
    const dedupeConditions =
      txStatus === "COMPLETED" && event.providerTxId
        ? [
            dedupeByEvent,
            and(
              eq(membershipTransaction.paymentProvider, gateway.provider),
              eq(membershipTransaction.providerTxId, event.providerTxId),
              eq(membershipTransaction.status, "COMPLETED"),
            ),
          ]
        : [dedupeByEvent];
    const [existing] = await tx
      .select()
      .from(membershipTransaction)
      .where(or(...dedupeConditions))
      .limit(1);
    if (existing) {
      const [existingPayment] = await tx
        .select({ invoiceId: membershipPayment.invoiceId })
        .from(membershipPayment)
        .where(eq(membershipPayment.transactionId, existing.id))
        .limit(1);
      return {
        transactionId: existing.id,
        appliedInvoiceId: existingPayment?.invoiceId ?? null,
      };
    }

    const [transaction] = await tx
      .insert(membershipTransaction)
      .values({
        userId: subscription.userId,
        subscriptionId: subscription.id,
        tierId: subscription.tierId,
        amount,
        currency,
        status: txStatus,
        paymentMethod: null,
        paymentProvider: gateway.provider,
        providerTxId: event.providerTxId,
        description: `Webhook ${context.eventType}`,
        metadata: { webhookEventId: context.eventId },
      })
      .returning();

    let appliedInvoiceId: string | null = null;
    if (txStatus === "COMPLETED") {
      const [invoice] = await tx
        .select()
        .from(membershipInvoice)
        .where(
          and(
            inArray(membershipInvoice.subscriptionId, [
              ...new Set([invoicedSubscriptionId, subscription.id]),
            ]),
            eq(membershipInvoice.status, "ISSUED"),
          ),
        )
        .orderBy(asc(membershipInvoice.createdAt))
        .limit(1);

      if (invoice) {
        const outstanding = toMinorUnits(invoice.totalAmount) - toMinorUnits(invoice.paidAmount);
        const appliedMinor = Math.min(amountMinor, outstanding);
        const newPaidMinor = toMinorUnits(invoice.paidAmount) + appliedMinor;

        await tx.insert(membershipPayment).values({
          invoiceId: invoice.id,
          userId: invoice.userId,
          subscriptionId: subscription.id,
          transactionId: transaction.id,
          amount: toAmountString(appliedMinor),
          currency,
          status: "COMPLETED",
          paymentMethod: null,
          paymentProvider: gateway.provider,
          providerTxId: event.providerTxId,
          paidAt: new Date(),
          metadata: { eventId: context.eventId, eventType: context.eventType },
        });

        await tx
          .update(membershipInvoice)
          .set({
            paidAmount: toAmountString(newPaidMinor),
            status: newPaidMinor >= toMinorUnits(invoice.totalAmount) ? "PAID" : "ISSUED",
          })
          .where(eq(membershipInvoice.id, invoice.id));

        appliedInvoiceId = invoice.id;
      }
    }

    await writeAudit(tx, {
      userId: subscription.userId,
      eventType: "WEBHOOK_PROCESSED",
      message: `Processed ${gateway.provider} webhook ${context.eventType} (${context.eventId})`,
      metadata: {
        provider: gateway.provider,
        eventId: context.eventId,
        eventType: context.eventType,
        providerState: event.providerState,
        providerTxId: event.providerTxId,
        transactionStatus: txStatus,
        subscriptionStatusHint: subStatus,
        subscriptionId: subscription.id,
        transactionId: transaction.id,
        appliedInvoiceId,
        amount,
        currency,
        lifecycleNote,
      },
      actor,
    });

    return { transactionId: transaction.id, appliedInvoiceId };
  });
}
