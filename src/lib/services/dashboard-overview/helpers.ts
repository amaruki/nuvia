/**
 * Shared dashboard overview internals — the percent-change contract, UTC
 * month boundaries, and the row caps the aggregate scans apply.
 */

/**
 * Percent change between two minor-unit totals, rounded to one decimal.
 * Null when the previous period is zero — a trend against nothing would be
 * a fabricated number.
 */
export function changePercent(currentMinor: number, previousMinor: number): number | null {
  if (previousMinor === 0) return null;
  return Math.round(((currentMinor - previousMinor) / previousMinor) * 1000) / 10;
}

/** Midnight UTC on the first day of the month containing `date`. */
export function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/** Cap for the all-time completed-transaction scan feeding totalRevenue. */
export const ALL_TIME_TRANSACTION_ROWS = 100_000;

/** Cap for the subscription scan, matching the finance-report convention. */
export const SUBSCRIPTION_SCAN_ROWS = 1000;
