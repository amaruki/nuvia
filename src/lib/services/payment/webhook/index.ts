/**
 * Provider webhook processing (ADR-0015 §4).
 *
 * Idempotency: verified provider events are claimed in
 * membership_webhook_events (unique on provider + event id) BEFORE any
 * processing happens. Delivery retries become no-ops; a processing failure
 * deletes the claim again so the provider's retry can re-attempt (Stripe
 * retries non-2xx responses for up to three days).
 *
 * Concern split within this folder: claim.ts owns the idempotency-claim
 * lifecycle, process.ts drives the verified event through
 * subscription.service, ledger.ts writes the same-transaction settlement,
 * payload.ts extracts amounts from raw provider objects.
 */

import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipWebhookEvent } from "@/db/schema";
import {
  resolvePaymentGateway,
  type PaymentGateway,
  type VerifiedWebhookEvent,
} from "@/lib/payments/gateway";
import type { ActorContext } from "@/lib/services/subscription.service";
import type { WebhookEventContext, WebhookProcessingResult } from "../types";
import { claimEvent, releaseClaim } from "./claim";
import { processVerifiedEvent } from "./process";

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
  const claimed = await claimEvent(gateway, context, event);
  if (!claimed) {
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
    await releaseClaim(gateway, context.eventId);
    throw error;
  }
}
