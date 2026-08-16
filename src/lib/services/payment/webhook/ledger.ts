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
  /**
   * Issue #27 (finding 1): for REFUNDED / PARTIALLY_REFUNDED events, the
   * exact minor-unit amount the provider refunded (from amount_refunded).
   * Null for every other event; falls back to the charge amount when the
   * provider payload carries no refund figure.
   */
  refundAmountMinor?: number | null;
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
    refundAmountMinor,
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

    // Issue #27 (finding 1): refunds reverse what the original charge did.
    // The reversal branch runs BEFORE the generic insert — a refund for a
    // known charge marks that ledger row REFUNDED, unwinds the invoice's
    // paidAmount, and reopens a settled invoice. Only refunds with no
    // matching settled charge fall through to the informational insert.
    if (txStatus === "REFUNDED" || txStatus === "PARTIALLY_REFUNDED") {
      const reversed = await applyRefundReversal(tx, {
        subscription,
        txStatus,
        amountMinor,
        currency,
        refundAmountMinor: refundAmountMinor ?? null,
        gateway,
        event,
        context,
        actor,
      });
      if (reversed) return reversed;
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
        // Issue #27 (finding 2): never apply a payment in one currency to an
        // invoice billed in another — €100 applied to a $100 invoice books
        // face value and silently under/over-settles. The ledger row still
        // records what the provider collected; reconciliation is skipped and
        // flagged for manual handling.
        if (invoice.currency.toUpperCase() !== currency.toUpperCase()) {
          await writeAudit(tx, {
            userId: subscription.userId,
            eventType: "WEBHOOK_CURRENCY_MISMATCH",
            severity: "WARN",
            message: `Payment currency ${currency} does not match invoice ${invoice.id} currency ${invoice.currency}; reconciliation skipped`,
            metadata: {
              provider: gateway.provider,
              eventId: context.eventId,
              invoiceId: invoice.id,
              invoiceCurrency: invoice.currency,
              paymentCurrency: currency,
              transactionId: transaction.id,
              amount,
            },
            actor,
          });
        } else {
          const outstanding =
            toMinorUnits(invoice.totalAmount, invoice.currency) -
            toMinorUnits(invoice.paidAmount, invoice.currency);
          const appliedMinor = Math.min(amountMinor, outstanding);
          const newPaidMinor = toMinorUnits(invoice.paidAmount, invoice.currency) + appliedMinor;

          await tx.insert(membershipPayment).values({
            invoiceId: invoice.id,
            userId: invoice.userId,
            subscriptionId: subscription.id,
            transactionId: transaction.id,
            amount: toAmountString(appliedMinor, invoice.currency),
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
              paidAmount: toAmountString(newPaidMinor, invoice.currency),
              status:
                newPaidMinor >= toMinorUnits(invoice.totalAmount, invoice.currency)
                  ? "PAID"
                  : "ISSUED",
            })
            .where(eq(membershipInvoice.id, invoice.id));

          appliedInvoiceId = invoice.id;
        }
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

type LedgerTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface RefundReversalInput {
  subscription: MembershipSubscription;
  txStatus: TransactionStatus;
  /** The charge's full minor-unit amount (the ledger row's amount). */
  amountMinor: number;
  currency: string;
  /** Cumulative minor-units refunded on the charge, if the provider sent it. */
  refundAmountMinor: number | null;
  gateway: PaymentGateway;
  event: VerifiedWebhookEvent;
  context: WebhookEventContext;
  actor: ActorContext;
}

/**
 * Issue #27 (finding 1): reverse what a refunded charge recorded.
 *
 * Locates the settled ledger row for the provider charge, locks it, and —
 * using the provider's CUMULATIVE refunded figure — reverses only the delta
 * since the last refund event (so repeat/partial events stay idempotent).
 * The reversal marks the ledger row REFUNDED / PARTIALLY_REFUNDED, unwinds
 * the invoice's paidAmount, and reopens a settled invoice. Returns null when
 * there is no settled charge to reverse (the caller falls back to a plain
 * informational ledger row).
 */
async function applyRefundReversal(
  tx: LedgerTx,
  input: RefundReversalInput,
): Promise<LedgerSettlement | null> {
  const {
    subscription,
    txStatus,
    amountMinor,
    currency,
    refundAmountMinor,
    gateway,
    event,
    context,
    actor,
  } = input;

  // The settled charge this refund reverses. Only COMPLETED rows hold money
  // to unwind; a refund for a charge that never settled is informational.
  const [original] = await tx
    .select()
    .from(membershipTransaction)
    .where(
      and(
        eq(membershipTransaction.paymentProvider, gateway.provider),
        eq(membershipTransaction.providerTxId, event.providerTxId),
        inArray(membershipTransaction.status, ["COMPLETED", "PARTIALLY_REFUNDED"]),
      ),
    )
    .for("update")
    .limit(1);

  if (!original) return null;

  const originalMinor = toMinorUnits(original.amount, original.currency);
  // Cumulative refunded (fall back to the full charge when the provider
  // payload carries no amount_refunded, e.g. a manual reversal).
  const cumulativeMinor = refundAmountMinor ?? originalMinor;
  // What a prior refund event already reversed (stored on the ledger row).
  const alreadyReversedMinor = Number(
    (original.metadata as { refundedMinor?: number } | null)?.refundedMinor ?? 0,
  );
  const deltaMinor = cumulativeMinor - alreadyReversedMinor;

  // Nothing new to reverse — an idempotent repeat of this refund.
  if (deltaMinor <= 0) {
    const [payment] = await tx
      .select({ invoiceId: membershipPayment.invoiceId })
      .from(membershipPayment)
      .where(eq(membershipPayment.transactionId, original.id))
      .limit(1);
    return { transactionId: original.id, appliedInvoiceId: payment?.invoiceId ?? null };
  }

  // Partial vs full must be computed from amounts, not providerState: the
  // provider sends the same "refunded" state for both, distinguished only
  // by amount_refunded < amount. Using txStatus here would mark a partial
  // refund REFUNDED and break the cumulative-delta bookkeeping.
  const newStatus: TransactionStatus =
    cumulativeMinor >= originalMinor ? "REFUNDED" : "PARTIALLY_REFUNDED";

  await tx
    .update(membershipTransaction)
    .set({
      status: newStatus,
      metadata: {
        ...((original.metadata as Record<string, unknown> | null) ?? {}),
        webhookEventId: context.eventId,
        refundedMinor: cumulativeMinor,
        refundedAt: new Date().toISOString(),
      },
    })
    .where(eq(membershipTransaction.id, original.id));

  // Unwind the invoice the charge settled against, if any.
  let reversedInvoiceId: string | null = null;
  const [payment] = await tx
    .select()
    .from(membershipPayment)
    .where(eq(membershipPayment.transactionId, original.id))
    .limit(1);

  if (payment) {
    // The payment row mirrors the ledger status, so finance reads keyed on
    // membership_payment (listPayments) show the refund too.
    await tx
      .update(membershipPayment)
      .set({ status: newStatus })
      .where(eq(membershipPayment.id, payment.id));
  }

  if (payment?.invoiceId) {
    const [invoice] = await tx
      .select()
      .from(membershipInvoice)
      .where(eq(membershipInvoice.id, payment.invoiceId))
      .for("update")
      .limit(1);

    if (invoice && invoice.currency.toUpperCase() === original.currency.toUpperCase()) {
      const paidMinor = toMinorUnits(invoice.paidAmount, invoice.currency);
      const totalMinor = toMinorUnits(invoice.totalAmount, invoice.currency);
      const newPaidMinor = Math.max(paidMinor - deltaMinor, 0);
      const reopened = newPaidMinor < totalMinor;

      await tx
        .update(membershipInvoice)
        .set({
          paidAmount: toAmountString(newPaidMinor, invoice.currency),
          status: reopened ? "ISSUED" : invoice.status,
        })
        .where(eq(membershipInvoice.id, invoice.id));

      reversedInvoiceId = invoice.id;
    }
  }

  await writeAudit(tx, {
    userId: subscription.userId,
    eventType: "WEBHOOK_REFUND_REVERSED",
    severity: "INFO",
    message: `Reversed ${toAmountString(deltaMinor, currency)} ${currency} refund for charge ${event.providerTxId}${reversedInvoiceId ? ` against invoice ${reversedInvoiceId}` : ""}`,
    metadata: {
      provider: gateway.provider,
      eventId: context.eventId,
      eventType: context.eventType,
      providerTxId: event.providerTxId,
      transactionId: original.id,
      reversedInvoiceId,
      refundAmount: toAmountString(deltaMinor, currency),
      cumulativeRefunded: toAmountString(cumulativeMinor, currency),
      newTransactionStatus: newStatus,
      currency,
    },
    actor,
  });

  return { transactionId: original.id, appliedInvoiceId: reversedInvoiceId };
}
