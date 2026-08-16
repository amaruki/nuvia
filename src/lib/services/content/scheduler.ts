/**
 * Scheduled-content publisher (issue #17).
 *
 * Before this module existed, `SCHEDULED` was a permanent dead state: an
 * editor could save content as "scheduled" (the dashboard forms offer the
 * status, and `createContentItem` / `patchContent` accept it with a publish
 * gate), but nothing ever promoted the row to `PUBLISHED` — no cron, no
 * lazy publisher, no read-time promotion. Every audience-facing read path
 * filters `status = 'PUBLISHED'` strictly, so scheduled content was
 * invisible forever.
 *
 * The convention (proven by tests/news-public-read.test.ts and
 * tests/member-announcements.test.ts fixtures) is that a SCHEDULED row
 * carries its intended publish moment in `publishedAt` (a future date).
 * The sweeper promotes every row whose `publishedAt` has arrived:
 *
 *   status: SCHEDULED → PUBLISHED
 *   metadata.ui.status: "scheduled" → "published"  (rowToItem prefers the
 *     metadata copy, so both must move together)
 *   metadata.ui.reviewedAt/reviewedBy stamped as the approval record
 *   metadata.ui.publishedAt normalized to the promotion instant
 *
 * Atomicity: the promotion is a single UPDATE with a `status='SCHEDULED'`
 * predicate and RETURNING, so concurrent runs (or an editor manually
 * publishing the same row first) never double-publish or clobber a manual
 * decision. Rows an editor already moved are simply not returned.
 *
 * Delivery model mirrors the subscription expiry sweep (issue #15): a
 * headless cron entry point (scripts/sweep-scheduled-content.ts) plus an
 * on-demand API route (/api/v1/content/sweep) for editors without shell
 * access. Both call sweepScheduledContent() below.
 */

import { and, eq, lte, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { content } from "@/db/schema";

export interface SweepScheduledContentResult {
  /** Rows actually promoted by this run (RETURNING guarantees accuracy). */
  published: Array<{ id: string; slug: string; title: string }>;
  /** Rows still SCHEDULED after this run (their time has not come). */
  pending: number;
  sweptAt: string;
}

/**
 * Promote every SCHEDULED content row whose publish time has arrived.
 * Idempotent and concurrency-safe (see module header). `now` is injectable
 * for tests.
 */
export async function sweepScheduledContent(
  now: Date = new Date(),
): Promise<SweepScheduledContentResult> {
  const due = await db
    .select({ id: content.id, metadata: content.metadata, publishedAt: content.publishedAt })
    .from(content)
    .where(and(eq(content.status, "SCHEDULED"), lte(content.publishedAt, now)));

  const published: SweepScheduledContentResult["published"] = [];
  const reviewedAt = now.toISOString();

  for (const row of due) {
    const metadata = (row.metadata ?? {}) as { ui?: Record<string, unknown> };
    const ui = metadata.ui ?? {};
    // The intended publish moment is the DB `publishedAt` column (the read
    // paths gate on it). Stamp the same value into the ui blob so the
    // dashboard copy matches the column the audience gates trust.
    const scheduledFor = row.publishedAt?.toISOString();
    const promoted = await db
      .update(content)
      .set({
        status: "PUBLISHED",
        metadata: {
          ...metadata,
          ui: {
            ...ui,
            status: "published",
            reviewedAt,
            reviewedBy: "system:scheduled-content-sweeper",
            ...(scheduledFor ? { publishedAt: scheduledFor } : {}),
          },
        },
        updatedAt: now,
      })
      .where(and(eq(content.id, row.id), eq(content.status, "SCHEDULED")))
      .returning({ id: content.id, slug: content.slug, title: content.title });
    if (promoted.length > 0) {
      published.push(promoted[0]);
    }
  }

  const [{ value: pendingRaw }] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(content)
    .where(eq(content.status, "SCHEDULED"));

  return { published, pending: Number(pendingRaw), sweptAt: now.toISOString() };
}
