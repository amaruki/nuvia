/**
 * Idempotency claim for provider webhook events (ADR-0015 §4).
 *
 * Verified events are claimed in membership_webhook_events (unique on
 * provider + event id) BEFORE any processing happens — delivery retries
 * become no-ops while the claim row exists. Processing failures release the
 * claim again so the provider's retry can re-attempt (Stripe retries non-2xx
 * responses for up to three days).
 */

import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipWebhookEvent } from "@/db/schema";
import type { PaymentGateway, VerifiedWebhookEvent } from "@/lib/payments/gateway";
import type { WebhookEventContext } from "../types";

/**
 * Claim the event id. Returns false when the race is lost (0 rows) — a
 * concurrent worker owns the event, which callers treat as a duplicate.
 */
export async function claimEvent(
  gateway: PaymentGateway,
  context: WebhookEventContext,
  event: VerifiedWebhookEvent,
): Promise<boolean> {
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
  return claimed.length > 0;
}

/**
 * Compensating delete: give the provider's retry a clean slate instead of a
 * permanently claimed, never-processed event.
 */
export async function releaseClaim(gateway: PaymentGateway, eventId: string): Promise<void> {
  await db
    .delete(membershipWebhookEvent)
    .where(
      and(
        eq(membershipWebhookEvent.provider, gateway.provider),
        eq(membershipWebhookEvent.eventId, eventId),
      ),
    );
}
