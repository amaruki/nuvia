/**
 * Cron entry point for the subscription expiry sweep (issue #15).
 *
 * Usage (any scheduler — system cron, CI scheduled workflow, deploy hook):
 *
 *   DATABASE_URL=... bun run scripts/sweep-subscriptions.ts
 *
 * Exits 0 with a JSON summary on stdout when the sweep completes (even with
 * zero candidates), and non-zero on unexpected errors — so a scheduler can
 * alert on failure. Individual rows that a concurrent admin action moved are
 * skipped, not failed.
 */

import { sweepExpiredSubscriptions } from "@/lib/services/subscription.service";

const result = await sweepExpiredSubscriptions({
  actorId: "system:subscription-sweeper",
  reason: "Scheduled subscription expiry sweep",
});

console.log(JSON.stringify(result, null, 2));
