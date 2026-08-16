/**
 * Cron entry point for the scheduled-content publisher (issue #17).
 *
 * Usage (any scheduler — system cron, CI scheduled workflow, deploy hook):
 *
 *   DATABASE_URL=... bun run scripts/sweep-scheduled-content.ts
 *
 * Exits 0 with a JSON summary on stdout when the sweep completes (even
 * with zero due rows), and non-zero on unexpected errors — so a scheduler
 * can alert on failure. Rows a concurrent editor action already published
 * are skipped, not failed.
 *
 * The explicit process.exit mirrors scripts/seed-demo.ts and
 * scripts/a11y-smoke.ts: the drizzle/postgres.js connection pool keeps the
 * event loop alive after the work is done, so without it the process never
 * returns to the scheduler.
 */

import { sweepScheduledContent } from "@/lib/services/content";

sweepScheduledContent()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("Scheduled-content sweep failed:", error);
    process.exit(1);
  });
