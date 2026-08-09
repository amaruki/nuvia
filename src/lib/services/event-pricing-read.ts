/**
 * Event pricing facts (UI-23).
 *
 * Events carry a flat pricing model in the schema (src/db/schema/events.ts):
 * an `is_free` flag, an optional numeric `price`, and a per-event `currency`.
 * There is no ticket tier, promo code, or discount table anywhere in the
 * schema, so this read returns only what is actually stored: free-vs-paid
 * counts, upcoming-vs-paid splits, and the observed price points grouped by
 * currency. The pricing page says so when a dimension is unmodeled rather
 * than inventing one.
 */

import { and, count, eq, gte, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { event } from "@/db/schema";

export interface EventPricePoint {
  /** numeric(10,2) column read in string mode, e.g. "25.00". */
  price: string;
  currency: string;
  /** Events listed at exactly this price in this currency. */
  eventCount: number;
}

export interface EventPricingOverview {
  totalEvents: number;
  /** Events flagged via the stored `is_free` flag. */
  freeEvents: number;
  /** Events flagged via the stored `is_free` flag (negation). */
  paidEvents: number;
  /** Events with a positive numeric price set, independent of the flag. */
  pricedEvents: number;
  /** Free-flagged events starting at or after `now`. */
  upcomingFree: number;
  /** Paid-flagged events starting at or after `now`. */
  upcomingPaid: number;
  pricePoints: EventPricePoint[];
}

export async function getEventPricingOverview(
  now: Date = new Date(),
): Promise<EventPricingOverview> {
  const [
    totalRows,
    freeRows,
    paidRows,
    upcomingFreeRows,
    upcomingPaidRows,
    pricedRows,
    pricePointRows,
  ] = await Promise.all([
    db.select({ n: count() }).from(event),
    db.select({ n: count() }).from(event).where(eq(event.isFree, true)),
    db.select({ n: count() }).from(event).where(eq(event.isFree, false)),
    db
      .select({ n: count() })
      .from(event)
      .where(and(eq(event.isFree, true), gte(event.startTime, now))),
    db
      .select({ n: count() })
      .from(event)
      .where(and(eq(event.isFree, false), gte(event.startTime, now))),
    db
      .select({ n: count() })
      .from(event)
      .where(and(isNotNull(event.price), sql`${event.price} > 0`)),
    db
      .select({
        price: event.price,
        currency: event.currency,
        n: sql<number>`count(*)::int`,
      })
      .from(event)
      .where(and(isNotNull(event.price), sql`${event.price} > 0`))
      .groupBy(event.price, event.currency)
      .orderBy(event.price, event.currency),
  ]);

  const pricePoints: EventPricePoint[] = [];
  for (const row of pricePointRows) {
    if (row.price === null) continue;
    pricePoints.push({ price: row.price, currency: row.currency, eventCount: row.n });
  }

  return {
    totalEvents: totalRows[0]?.n ?? 0,
    freeEvents: freeRows[0]?.n ?? 0,
    paidEvents: paidRows[0]?.n ?? 0,
    pricedEvents: pricedRows[0]?.n ?? 0,
    upcomingFree: upcomingFreeRows[0]?.n ?? 0,
    upcomingPaid: upcomingPaidRows[0]?.n ?? 0,
    pricePoints,
  };
}
