/**
 * Event overview aggregates — total, upcoming, and next-7-day counts.
 * "Upcoming" means a live-status event whose start is still ahead; drafts,
 * canceled/postponed, and completed events never count.
 */

import { and, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { event } from "@/db/schema";
import type { EventOverviewStats } from "./types";

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

/** Statuses that can still host people — the only ones that count as upcoming. */
const UPCOMING_STATUSES = [
  "PUBLISHED",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "IN_PROGRESS",
] as const;

export async function getEventOverviewStats(opts?: { now?: Date }): Promise<EventOverviewStats> {
  const now = opts?.now ?? new Date();
  const weekEnd = new Date(now.getTime() + WEEK_MS);

  const countWhere = (...conditions: Parameters<typeof and>) =>
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(event)
      .where(and(...conditions));

  const [[totalRow], [upcomingRow], [weekRow]] = await Promise.all([
    countWhere(),
    countWhere(inArray(event.status, [...UPCOMING_STATUSES]), gte(event.startTime, now)),
    countWhere(
      inArray(event.status, [...UPCOMING_STATUSES]),
      gte(event.startTime, now),
      lt(event.startTime, weekEnd),
    ),
  ]);

  return {
    totalEvents: totalRow?.count ?? 0,
    upcomingEvents: upcomingRow?.count ?? 0,
    eventsThisWeek: weekRow?.count ?? 0,
  };
}
