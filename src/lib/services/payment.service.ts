/**
 * Payment service (backlog C3).
 *
 * Owns payment recording and provider-webhook processing; the invoice
 * aggregate lives in invoice.service.ts (scope split documented there).
 *
 * Money rule (ADR-0015 §5): string-mode numeric(10,2) in and out; integer
 * minor-unit arithmetic only, via toMinorUnits/toAmountString.
 *
 * Audit rule (PRINCIPLES.md "Fast vs. auditable"): privileged mutations
 * write their auth_logs entry in the SAME db.transaction as the row change.
 *
 * Webhook idempotency: verified provider events are claimed in
 * membership_webhook_events (unique on provider + event id) BEFORE any
 * processing happens. Delivery retries become no-ops; a processing failure
 * deletes the claim again so the provider's retry can re-attempt (Stripe
 * retries non-2xx responses for up to three days).
 */

import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  authLog,
  membershipInvoice,
  membershipPayment,
  membershipTransaction,
  membershipWebhookEvent,
} from "@/db/schema";
import type {
  MembershipInvoice,
  MembershipPayment,
  MembershipSubscription,
  MembershipTransaction,
} from "@/db/schema";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";
import {
  resolvePaymentGateway,
  toAmountString,
  toMinorUnits,
  type PaymentGateway,
  type VerifiedWebhookEvent,
} from "@/lib/payments/gateway";
import { getInvoice } from "@/lib/services/invoice.service";
import { getTier } from "@/lib/services/membership-tier.service";
import {
  cancelSubscription,
  getSubscription,
  markSubscriptionPastDue,
  renewSubscription,
  type ActorContext,
} from "@/lib/services/subscription.service";
import type { PaymentListQuery, RecordPaymentInput } from "@/lib/validation/finance.validation";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Recorded payment + its ledger transaction + the invoice afterwards. */
export interface RecordedPayment {
  payment: MembershipPayment;
  transaction: MembershipTransaction;
  invoice: MembershipInvoice;
}

export interface WebhookEventContext {
  /** Provider event id (e.g. Stripe evt_...) — the idempotency key. */
  eventId: string;
  /** Provider event type (e.g. checkout.session.completed) — audit metadata. */
  eventType: string;
}

export interface WebhookProcessingResult {
  duplicate: boolean;
  eventId: string;
  action: "renewed" | "past-due" | "canceled" | "recorded" | "none";
  subscriptionId: string | null;
  transactionId?: string;
}

/** Same-transaction audit, mirroring subscription.service's writeAudit. */
async function writeAudit(
  tx: Tx,
  entry: {
    userId: string | null;
    eventType: string;
    message: string;
    severity?: string;
    metadata: Record<string, unknown>;
    actor: ActorContext;
  },
): Promise<void> {
  await tx.insert(authLog).values({
    userId: entry.userId,
    eventType: entry.eventType,
    severity: entry.severity ?? "INFO",
    message: entry.message,
    ipAddress: entry.actor.ipAddress,
    userAgent: entry.actor.userAgent,
    metadata: { ...entry.metadata, actorId: entry.actor.actorId, reason: entry.actor.reason },
  });
}

/**
 * Record a manual (treasurer) payment against an ISSUED invoice.
 *
 * One db.transaction writes the membership_transactions ledger row, the
 * membership_payments row, the invoice's paidAmount/status update, and the
 * audit entry — either everything lands or nothing does. Overpayment and
 * payments against PAID/VOID invoices are rejected before any write.
 */
export async function recordPayment(
  input: RecordPaymentInput,
  actor: ActorContext,
): Promise<RecordedPayment> {
  const invoice = await getInvoice(input.invoiceId);

  if (invoice.status !== "ISSUED") {
    throw new BusinessLogicError(
      `Invoice ${invoice.invoiceNumber} is ${invoice.status}; only ISSUED invoices accept payments`,
      "INVOICE_NOT_PAYABLE",
    );
  }

  const amountMinor = toMinorUnits(input.amount);
  if (amountMinor <= 0) {
    throw new BusinessLogicError("Payment amount must be greater than zero", "INVALID_AMOUNT");
  }

  const totalMinor = toMinorUnits(invoice.totalAmount);
  const paidMinor = toMinorUnits(invoice.paidAmount);
  const outstandingMinor = totalMinor - paidMinor;

  if (amountMinor > outstandingMinor) {
    throw new BusinessLogicError(
      `Payment of ${input.amount} exceeds the outstanding ${toAmountString(outstandingMinor)} on invoice ${invoice.invoiceNumber}`,
      "OVERPAYMENT_NOT_ALLOWED",
    );
  }

  const providerTxId = `manual_${crypto.randomUUID()}`;
  const paymentMethod = input.paymentMethod ?? "manual";

  const result = await db.transaction(async (tx) => {
    const [transaction] = await tx
      .insert(membershipTransaction)
      .values({
        userId: invoice.userId,
        subscriptionId: invoice.subscriptionId,
        tierId: invoice.tierId,
        amount: input.amount,
        currency: invoice.currency,
        status: "COMPLETED",
        paymentMethod,
        paymentProvider: "manual",
        providerTxId,
        description: `Payment for invoice ${invoice.invoiceNumber}`,
      })
      .returning();

    const [payment] = await tx
      .insert(membershipPayment)
      .values({
        invoiceId: invoice.id,
        userId: invoice.userId,
        subscriptionId: invoice.subscriptionId,
        transactionId: transaction.id,
        amount: input.amount,
        currency: invoice.currency,
        status: "COMPLETED",
        paymentMethod,
        paymentProvider: "manual",
        providerTxId,
        paidAt: new Date(),
        metadata: input.reason ? { reason: input.reason } : null,
      })
      .returning();

    const newPaidMinor = paidMinor + amountMinor;
    const settled = newPaidMinor >= totalMinor;
    const [updatedInvoice] = await tx
      .update(membershipInvoice)
      .set({
        paidAmount: toAmountString(newPaidMinor),
        status: settled ? "PAID" : "ISSUED",
      })
      .where(eq(membershipInvoice.id, invoice.id))
      .returning();

    await writeAudit(tx, {
      userId: invoice.userId,
      eventType: "PAYMENT_RECORDED",
      message: `Recorded ${input.amount} ${invoice.currency} against invoice ${invoice.invoiceNumber}${settled ? " — invoice settled" : ""}`,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        paymentId: payment.id,
        transactionId: transaction.id,
        amount: input.amount,
        paidAmount: updatedInvoice.paidAmount,
        settled,
      },
      actor,
    });

    return { payment, transaction, invoice: updatedInvoice };
  });

  return result;
}

/** Filtered, newest-first payment list with standard pagination meta. */
export async function listPayments(
  query: PaymentListQuery,
): Promise<{ payments: MembershipPayment[]; total: number }> {
  const conditions = [
    query.invoiceId ? eq(membershipPayment.invoiceId, query.invoiceId) : undefined,
    query.userId ? eq(membershipPayment.userId, query.userId) : undefined,
    query.subscriptionId ? eq(membershipPayment.subscriptionId, query.subscriptionId) : undefined,
  ].filter(Boolean);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.query.membershipPayment.findMany({
      where,
      orderBy: desc(membershipPayment.createdAt),
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    }),
    db.select({ total: count() }).from(membershipPayment).where(where),
  ]);

  return { payments: rows, total };
}

export async function getPayment(id: string): Promise<MembershipPayment> {
  const payment = await db.query.membershipPayment.findFirst({
    where: eq(membershipPayment.id, id),
  });

  if (!payment) {
    throw new NotFoundError("Payment", id);
  }

  return payment;
}

/* ------------------------------------------------------------------ *
 * Provider webhook processing (ADR-0015 §4)
 * ------------------------------------------------------------------ */

/**
 * Duck-typed minor-unit extraction from a raw provider object — works for
 * Stripe checkout sessions (amount_total), charges/payment intents
 * (amount), and provider invoices (amount_paid) without importing provider
 * types. Returns null when no usable integer amount is present.
 */
function amountMinorFromRaw(raw: unknown): number | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  for (const key of ["amount_total", "amount_paid", "amount"]) {
    const value = obj[key];
    if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  }
  return null;
}

function currencyFromRaw(raw: unknown): string | null {
  if (typeof raw !== "object" || raw === null || !("currency" in raw)) return null;
  const value = raw.currency;
  return typeof value === "string" && value.length >= 2 ? value.toUpperCase() : null;
}

/**
 * Process one verified provider webhook event end to end:
 *
 *  1. claim the event id (idempotency — retries become no-ops),
 *  2. drive the subscription lifecycle THROUGH subscription.service's
 *     public API (audit + A3 member sync happen there),
 *  3. write the ledger transaction (+ invoice reconciliation for
 *     successful payments) with a same-transaction audit entry.
 *
 * Processing failures delete the claim again and rethrow, so the route
 * answers non-2xx and the provider retries. Business-rule collisions from
 * the lifecycle (e.g. an event for an already-canceled subscription) are
 * swallowed with an audit note — the event is genuinely processed, and
 * letting the provider retry forever would never resolve.
 *
 * The `gateway` parameter defaults to resolvePaymentGateway(); tests pass a
 * mock-surface Stripe adapter directly (no network involved).
 */
export async function processGatewayWebhook(
  event: VerifiedWebhookEvent,
  context: WebhookEventContext,
  actor: ActorContext,
  gateway: PaymentGateway = resolvePaymentGateway(),
): Promise<WebhookProcessingResult> {
  // Fast path for the common case: provider retries of an event we already
  // fully processed.
  const existing = await db.query.membershipWebhookEvent.findFirst({
    where: and(
      eq(membershipWebhookEvent.provider, gateway.provider),
      eq(membershipWebhookEvent.eventId, context.eventId),
    ),
  });
  if (existing) {
    return {
      duplicate: true,
      eventId: context.eventId,
      subscriptionId: existing.subscriptionId,
      action: "none",
    };
  }

  // Claim the event id. Losing the race (0 rows) means a concurrent worker
  // owns it — treat as duplicate.
  const claimed = await db
    .insert(membershipWebhookEvent)
    .values({
      provider: gateway.provider,
      eventId: context.eventId,
      eventType: context.eventType,
      subscriptionId: event.subscriptionId,
    })
    .onConflictDoNothing()
    .returning({ id: membershipWebhookEvent.id });

  if (claimed.length === 0) {
    return {
      duplicate: true,
      eventId: context.eventId,
      subscriptionId: event.subscriptionId,
      action: "none",
    };
  }

  try {
    return await processVerifiedEvent(event, context, actor, gateway);
  } catch (error) {
    // Compensating delete: give the provider's retry a clean slate instead
    // of a permanently claimed, never-processed event.
    await db
      .delete(membershipWebhookEvent)
      .where(
        and(
          eq(membershipWebhookEvent.provider, gateway.provider),
          eq(membershipWebhookEvent.eventId, context.eventId),
        ),
      );
    throw error;
  }
}

async function processVerifiedEvent(
  event: VerifiedWebhookEvent,
  context: WebhookEventContext,
  actor: ActorContext,
  gateway: PaymentGateway,
): Promise<WebhookProcessingResult> {
  const base = { eventId: context.eventId, duplicate: false };

  // No live subscription behind the event → nothing to drive. Our checkout
  // contract always sends subscriptionId in the session metadata; anything
  // else is a provider-side anomaly we audit and stop (the claim row stays,
  // so retries stay no-ops).
  let subscription: MembershipSubscription | null = null;
  if (event.subscriptionId) {
    try {
      subscription = await getSubscription(event.subscriptionId);
    } catch (error) {
      if (!(error instanceof NotFoundError)) throw error;
    }
  }

  if (!subscription) {
    await db.transaction(async (tx) => {
      await writeAudit(tx, {
        userId: null,
        eventType: "WEBHOOK_ORPHANED",
        message: `Webhook ${context.eventType} (${context.eventId}) carries no live subscription`,
        severity: "WARN",
        metadata: {
          provider: gateway.provider,
          eventId: context.eventId,
          eventType: context.eventType,
          providerState: event.providerState,
        },
        actor,
      });
    });
    return { ...base, action: "none", subscriptionId: event.subscriptionId };
  }

  const txStatus = gateway.toTransactionStatus(event.providerState);
  const subStatus = gateway.toSubscriptionStatus(event.providerState);

  // Renewal swaps in a NEW subscription row (ADR-0014), but invoices were
  // issued against the row the member held when billed — reconciliation
  // must accept both ids.
  const invoicedSubscriptionId = subscription.id;

  // Drive the lifecycle through subscription.service's public API — never
  // touch membership_subscriptions directly (audit + A3 sync live there).
  let action: WebhookProcessingResult["action"] = "recorded";
  let lifecycleNote: string | null = null;

  try {
    if (txStatus === "COMPLETED") {
      const result = await renewSubscription(subscription.id, actor);
      subscription = result.subscription;
      action = "renewed";
    } else if (txStatus === "FAILED") {
      const result = await markSubscriptionPastDue(subscription.id, actor);
      subscription = result.subscription;
      action = "past-due";
    } else if (txStatus === "CANCELED") {
      const result = await cancelSubscription(subscription.id, actor);
      subscription = result.subscription;
      action = "canceled";
    }
  } catch (error) {
    if (!(error instanceof BusinessLogicError) || error.code !== "INVALID_TRANSITION") {
      throw error;
    }
    // Event for a subscription already past this transition (e.g. a repeat
    // cancellation). Ledger + audit still land; the provider must not retry
    // forever.
    lifecycleNote = error.message;
  }

  // Amount/currency: prefer the provider's truth, fall back to the tier
  // price (events without amounts still settle the subscribed tier).
  const tier = await getTier(subscription.tierId);
  const amountMinor = amountMinorFromRaw(event.raw) ?? toMinorUnits(tier.price);
  const currency = currencyFromRaw(event.raw) ?? "USD";
  const amount = toAmountString(amountMinor);

  let transactionId: string | undefined;
  let appliedInvoiceId: string | null = null;

  await db.transaction(async (tx) => {
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
      })
      .returning();
    transactionId = transaction.id;

    // Reconcile successful payments against the oldest ISSUED invoice of
    // this subscription, if any. The applied amount is capped at the
    // invoice's outstanding balance; surplus stays on the ledger row only.
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
        transactionId,
        appliedInvoiceId,
        amount,
        currency,
        lifecycleNote,
      },
      actor,
    });
  });

  return { ...base, action, subscriptionId: subscription.id, transactionId };
}
