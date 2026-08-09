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
