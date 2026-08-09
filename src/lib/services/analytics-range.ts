/**
 * Shared date-window helpers for the analytics section (UI-23).
 *
 * The custom report page parses `?range=30|90|365`; every analytics
 * aggregate takes a `{ since, now }` window so all five pages bucket time
 * the same way. Bucket keys/labels are computed in UTC to match the
 * dashboard-overview and finance-report conventions.
 */

export const ANALYTICS_RANGE_DAYS = [30, 90, 365] as const;

export type AnalyticsRangeDays = (typeof ANALYTICS_RANGE_DAYS)[number];

export const DEFAULT_ANALYTICS_RANGE_DAYS: AnalyticsRangeDays = 90;

const DAY_MS = 86_400_000;

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Parse `?range=` into one of the allowed windows; anything else falls back to 90 days. */
export function parseAnalyticsRange(value: string | string[] | undefined): AnalyticsRangeDays {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  return (ANALYTICS_RANGE_DAYS as readonly number[]).includes(parsed)
    ? (parsed as AnalyticsRangeDays)
    : DEFAULT_ANALYTICS_RANGE_DAYS;
}

/** The window start for a trailing-day range relative to `now`. */
export function rangeSince(days: AnalyticsRangeDays, now: Date = new Date()): Date {
  return new Date(now.getTime() - days * DAY_MS);
}

/** How many monthly buckets cover a day range (30 → 1, 90 → 3, 365 → 13). */
export function monthsCoveredBy(days: AnalyticsRangeDays): number {
  return Math.max(1, Math.ceil(days / 30));
}

/** "YYYY-MM" UTC month key for a date. */
export function utcMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Human label for a "YYYY-MM" key, e.g. "Mar 26". */
export function utcMonthLabel(key: string): string {
  const [yearPart, monthPart] = key.split("-");
  const monthIndex = Number.parseInt(monthPart ?? "1", 10) - 1;
  const label = MONTH_LABELS[Math.max(0, Math.min(11, monthIndex))];
  return `${label} ${(yearPart ?? "00").slice(2)}`;
}

/** Midnight UTC of the Monday on or before `date` (week bucket start). */
export function utcWeekStart(date: Date): Date {
  const offset = (date.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - offset));
}

/** Human label for a week bucket, e.g. "Mar 3". */
export function utcWeekLabel(weekStart: Date): string {
  return `${MONTH_LABELS[weekStart.getUTCMonth()]} ${weekStart.getUTCDate()}`;
}

/** Continuous "YYYY-MM" series from the month containing `from` through `now`. */
export function eachUtcMonth(from: Date, now: Date): string[] {
  const keys: string[] = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
  while (cursor.getTime() <= now.getTime()) {
    keys.push(utcMonthKey(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return keys;
}

/** Continuous week-start series (ms timestamps) from the week containing `from` through `now`. */
export function eachUtcWeek(from: Date, now: Date): number[] {
  const starts: number[] = [];
  const cursor = utcWeekStart(from);
  while (cursor.getTime() <= now.getTime()) {
    starts.push(cursor.getTime());
    cursor.setTime(cursor.getTime() + 7 * DAY_MS);
  }
  return starts;
}
