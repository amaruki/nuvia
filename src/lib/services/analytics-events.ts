/**
 * Event analytics aggregates (UI-23) — events by month, registrations by
 * status, capacity utilization, and check-in rate, computed from `events`
 * and `event_registrations`.
 *
 * Drafts never count as events (they are not happening); every other
 * status does, including canceled/postponed, since those were scheduled.
 * Check-in rate divides checked-in registrations by the registrations that
 * were expected on the day (CONFIRMED/ATTENDED/NO_SHOW) — a null rate
 * means there was nothing expected, never zero invented data.
 */

import { gte } from "drizzle-orm";
import { db } from "@/db/client";
import { event, eventRegistration } from "@/db/schema";
import { eachUtcMonth, utcMonthKey, utcMonthLabel } from "./analytics-range";

const EVENT_SCAN_ROWS = 10_000;
const REGISTRATION_SCAN_ROWS = 100_000;
const DEFAULT_WINDOW_MONTHS = 12;
/** Registration statuses that mean someone was expected on the day. */
const EXPECTED_STATUSES: Record<string, true> = { CONFIRMED: true, ATTENDED: true, NO_SHOW: true };

export interface EventMonthPoint {
  period: string;
  label: string;
  events: number;
}

export interface RegistrationStatusCount {
  status: string;
  count: number;
}

export interface EventCapacitySummary {
  /** Window events that declare a capacity limit. */
  cappedEvents: number;
  totalCapacity: number;
  totalRegistered: number;
  /** Registered ÷ capacity over capped events; null when capacity is zero. */
  utilizationPercent: number | null;
}

export interface EventCheckInSummary {
  checkedIn: number;
  expected: number;
  /** Checked-in ÷ expected registrations; null when nothing was expected. */
  ratePercent: number | null;
}

export interface EventAnalytics {
  /** Non-draft events starting inside the window. */
  eventsInWindow: number;
  byMonth: EventMonthPoint[];
  registrationsByStatus: RegistrationStatusCount[];
  totalRegistrations: number;
  /** Null when the window has no capacity-declaring events. */
  capacity: EventCapacitySummary | null;
  checkIn: EventCheckInSummary;
}

export async function getEventAnalytics(opts?: {
  since?: Date;
  now?: Date;
}): Promise<EventAnalytics> {
  const now = opts?.now ?? new Date();
  const since =
    opts?.since ??
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (DEFAULT_WINDOW_MONTHS - 1), 1));

  const [eventRows, registrationRows] = await Promise.all([
    db
      .select({
        status: event.status,
        capacity: event.capacity,
        registeredCount: event.registeredCount,
        startTime: event.startTime,
      })
      .from(event)
      .where(gte(event.startTime, since))
      .limit(EVENT_SCAN_ROWS),
    db
      .select({ status: eventRegistration.status, checkedInAt: eventRegistration.checkedInAt })
      .from(eventRegistration)
      .limit(REGISTRATION_SCAN_ROWS),
  ]);

  // Events by month — drafts excluded, continuous month series.
  const liveEvents = eventRows.filter((row) => row.status !== "DRAFT");
  const monthCounts = new Map<string, number>();
  for (const row of liveEvents) {
    const key = utcMonthKey(row.startTime);
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }
  const byMonth: EventMonthPoint[] = eachUtcMonth(since, now).map((key) => ({
    period: key,
    label: utcMonthLabel(key),
    events: monthCounts.get(key) ?? 0,
  }));

  // Registrations by status + check-in rate (all-time ledger — the
  // registrations table carries no event-window join we need here).
  const statusCounts = new Map<string, number>();
  let checkedIn = 0;
  let expected = 0;
  for (const row of registrationRows) {
    statusCounts.set(row.status, (statusCounts.get(row.status) ?? 0) + 1);
    if (row.checkedInAt) checkedIn += 1;
    if (EXPECTED_STATUSES[row.status]) expected += 1;
  }
  const registrationsByStatus: RegistrationStatusCount[] = [...statusCounts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  // Capacity utilization over the window's capped events.
  let capacity: EventCapacitySummary | null = null;
  let totalCapacity = 0;
  let totalRegistered = 0;
  let cappedEvents = 0;
  for (const row of liveEvents) {
    if (row.capacity === null) continue;
    cappedEvents += 1;
    totalCapacity += row.capacity;
    totalRegistered += row.registeredCount;
  }
  if (cappedEvents > 0) {
    capacity = {
      cappedEvents,
      totalCapacity,
      totalRegistered,
      utilizationPercent:
        totalCapacity > 0 ? Math.round((totalRegistered / totalCapacity) * 1000) / 10 : null,
    };
  }

  return {
    eventsInWindow: liveEvents.length,
    byMonth,
    registrationsByStatus,
    totalRegistrations: registrationRows.length,
    capacity,
    checkIn: {
      checkedIn,
      expected,
      ratePercent: expected > 0 ? Math.round((checkedIn / expected) * 1000) / 10 : null,
    },
  };
}
