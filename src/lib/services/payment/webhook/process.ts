/**
 * Verified-event processing: resolve the subscription behind the event,
 * drive its lifecycle through subscription.service's public API, then settle
 * the ledger with a same-transaction audit entry (ledger.ts).
 */

import { db } from "@/db/client";
import type { MembershipSubscription } from "@/db/schema";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";
import {
  toMinorUnits,
  type PaymentGateway,
  type VerifiedWebhookEvent,
} from "@/lib/payments/gateway";
import { getTier } from "@/lib/services/membership-tier.service";
import {
  cancelSubscription,
  getSubscription,
  markSubscriptionPastDue,
  renewSubscription,
  type ActorContext,
} from "@/lib/services/subscription.service";
import { writeAudit } from "../audit";
import type { WebhookEventContext, WebhookProcessingResult } from "../types";
import { settleWebhookLedger } from "./ledger";
import { amountMinorFromRaw, currencyFromRaw } from "./payload";

/**
 * Event types that may renew a subscription and settle the ledger for a
 * COMPLETED charge. Anything else carrying a success state (the Stripe
 * fan-out siblings of a checkout payment) is audited and skipped (issue #24).
 */
const SETTLEMENT_EVENT_TYPES: ReadonlySet<string> = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

/**
 * Process a claimed, verified event:
 *
 *  1. resolve the live subscription behind the event (orphaned events are
 *     audited and stopped — the claim row stays, so retries stay no-ops),
 *  2. drive the subscription lifecycle THROUGH subscription.service's
 *     public API (audit + A3 member sync happen there),
 *  3. settle the ledger (+ invoice reconciliation for successful payments)
 *     with a same-transaction audit entry.
 *
 * Business-rule collisions from the lifecycle (e.g. an event for an
 * already-canceled subscription) are swallowed with an audit note — the
 * event is genuinely processed, and letting the provider retry forever
 * would never resolve.
 */
export async function processVerifiedEvent(
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

  // Narrowed non-null subscription for use inside closures (TS does not
  // carry `let` narrowing across an async closure boundary).
  const liveSubscription: MembershipSubscription = subscription;

  const txStatus = gateway.toTransactionStatus(event.providerState);
  const subStatus = gateway.toSubscriptionStatus(event.providerState);

  // Settlement-event filter (issue #24): ONE Stripe checkout payment fans out
  // as checkout.session.completed + payment_intent.succeeded +
  // charge.succeeded — all mapping to COMPLETED. Only the session-completed
  // event may renew the subscription and settle the ledger; the sibling
  // success events are audited as informational duplicates so one charge can
  // never buy two periods or count as revenue twice.
  if (txStatus === "COMPLETED" && !SETTLEMENT_EVENT_TYPES.has(context.eventType)) {
    await db.transaction(async (tx) => {
      await writeAudit(tx, {
        userId: liveSubscription.userId,
        eventType: "WEBHOOK_INFORMATIONAL_DUPLICATE",
        message: `Ignored non-settlement success event ${context.eventType} (${context.eventId}); charge ${event.providerTxId} settles via checkout.session.completed only`,
        severity: "INFO",
        metadata: {
          provider: gateway.provider,
          eventId: context.eventId,
          eventType: context.eventType,
          providerTxId: event.providerTxId,
          subscriptionId: liveSubscription.id,
        },
        actor,
      });
    });
    return { ...base, action: "none", subscriptionId: subscription.id };
  }

  // Renewal swaps in a NEW subscription row (ADR-0014), but invoices were
  // issued against the row the member held when billed — reconciliation
  // must accept both ids.
  const invoicedSubscriptionId = subscription.id;

  // Drive the lifecycle through subscription.service's public API — never
  // touch membership_subscriptions directly (audit + A3 sync live there).
  let action: WebhookProcessingResult["action"] = "recorded";
  let lifecycleNote: string | null = null;
  // Renewal idempotency (issue #24): renewSubscription applies at most ONE
  // renewal per source row and reports `applied` — false on the retry path
  // where the entitlement already landed.
  let applied = true;

  try {
    if (txStatus === "COMPLETED") {
      const result = await renewSubscription(subscription.id, actor);
      subscription = result.subscription;
      applied = result.applied;
      action = applied ? "renewed" : "recorded";
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

  const { transactionId } = await settleWebhookLedger({
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
  });

  return { ...base, action, subscriptionId: subscription.id, transactionId };
}
