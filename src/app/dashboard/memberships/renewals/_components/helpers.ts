/** Display helpers for the memberships/renewals page. */

import { formatDate } from "@/lib/utils/date-utils";

const DAY_MS = 86_400_000;

export function formatPeriodEnd(date: Date | null): string {
  return date ? formatDate(date, "MMM d, yyyy") : "—";
}

/** Human distance from `now`, e.g. "in 12 days", "today", "3 days ago". */
export function formatRelativeDays(date: Date | null, now: Date): string {
  if (!date) return "no end date";
  const days = Math.round((date.getTime() - now.getTime()) / DAY_MS);
  if (days === 0) return "today";
  if (days > 0) return `in ${days} day${days === 1 ? "" : "s"}`;
  return `${-days} day${days === -1 ? "" : "s"} ago`;
}
