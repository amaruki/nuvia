/**
 * Auth-log reads — per-user history, recent-event listing, and aggregate
 * statistics over the auth_logs table, plus the row-to-entry mapper shared
 * by the list reads.
 */

import { and, count, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { authLog } from "@/db/schema";
import type { AuthLog } from "@/db/schema";
import { logError } from "@/lib/errors";
import { AuthEventType } from "./levels";
import type { AuthEventSeverity } from "./levels";
import type { AuthLogEntry, AuthStatsResult } from "./types";

/**
 * Map an auth_logs row to the AuthLogEntry shape. The eventType/severity
 * columns are plain text in the schema but only ever hold this service's
 * enum values; metadata is jsonb that this service always writes as an
 * object. Nullable columns normalize to undefined to match AuthLogEntry.
 */
function mapRowToAuthLogEntry(log: AuthLog): AuthLogEntry {
  return {
    id: log.id,
    userId: log.userId ?? undefined,
    eventType: log.eventType as AuthEventType,
    severity: log.severity as AuthEventSeverity,
    message: log.message,
    ipAddress: log.ipAddress ?? undefined,
    userAgent: log.userAgent ?? undefined,
    deviceId: log.deviceId ?? undefined,
    location: log.location ?? undefined,
    metadata: (log.metadata ?? undefined) as Record<string, any> | undefined,
    timestamp: log.timestamp,
  };
}

/**
 * Get authentication logs for a user
 * @param userId - User ID
 * @param limit - Maximum number of logs to retrieve
 * @param offset - Offset for pagination
 * @returns List of authentication logs
 */
export async function getUserAuthLogs(
  userId: string,
  limit: number,
  offset: number,
): Promise<AuthLogEntry[]> {
  try {
    const logs = await db
      .select()
      .from(authLog)
      .where(eq(authLog.userId, userId))
      .orderBy(desc(authLog.timestamp))
      .limit(limit)
      .offset(offset);

    return logs.map(mapRowToAuthLogEntry);
  } catch (error) {
    logError(error as Error, {
      service: "logging",
      operation: "getUserAuthLogs",
      userId,
    });
    throw new Error("Failed to get user authentication logs");
  }
}

/**
 * Get recent authentication events
 * @param eventType - Optional event type to filter by
 * @param limit - Maximum number of logs to retrieve
 * @param offset - Offset for pagination
 * @returns List of authentication logs
 */
export async function getRecentAuthLogs(
  eventType: AuthEventType | undefined,
  limit: number,
  offset: number,
): Promise<AuthLogEntry[]> {
  try {
    const logs = await db
      .select()
      .from(authLog)
      .where(eventType ? eq(authLog.eventType, eventType) : undefined)
      .orderBy(desc(authLog.timestamp))
      .limit(limit)
      .offset(offset);

    return logs.map(mapRowToAuthLogEntry);
  } catch (error) {
    logError(error as Error, {
      service: "logging",
      operation: "getRecentAuthLogs",
    });
    throw new Error("Failed to get recent authentication logs");
  }
}

/**
 * Get authentication statistics
 * @param startDate - Start date for statistics
 * @param endDate - End date for statistics
 * @returns Authentication statistics
 */
export async function getAuthStats(startDate: Date, endDate: Date): Promise<AuthStatsResult> {
  try {
    const inRange = and(gte(authLog.timestamp, startDate), lte(authLog.timestamp, endDate));

    // All seven aggregates are read-only and depend only on the pre-built
    // `inRange` predicate, never on each other's results, so run them
    // concurrently instead of paying seven sequential round-trips.
    const [
      [{ value: totalEvents }],
      eventsByTypeRaw,
      eventsBySeverityRaw,
      [{ value: uniqueUsers }],
      [{ value: failedLogins }],
      [{ value: successfulLogins }],
      [{ value: suspiciousActivities }],
    ] = await Promise.all([
      // Get total events count
      db.select({ value: count() }).from(authLog).where(inRange),
      // Get events by type
      db
        .select({ eventType: authLog.eventType, value: count() })
        .from(authLog)
        .where(inRange)
        .groupBy(authLog.eventType),
      // Get events by severity
      db
        .select({ severity: authLog.severity, value: count() })
        .from(authLog)
        .where(inRange)
        .groupBy(authLog.severity),
      // COUNT(DISTINCT userId) reduces to a scalar in the database instead
      // of transferring every distinct userId row to JS just to take
      // .length (O(rows) network/memory before, O(1) after).
      db
        .select({ value: sql<number>`count(distinct ${authLog.userId})` })
        .from(authLog)
        .where(and(inRange, isNotNull(authLog.userId))),
      // Get failed logins count
      db
        .select({ value: count() })
        .from(authLog)
        .where(and(inRange, eq(authLog.eventType, AuthEventType.LOGIN_FAILURE))),
      // Get successful logins count
      db
        .select({ value: count() })
        .from(authLog)
        .where(and(inRange, eq(authLog.eventType, AuthEventType.LOGIN_SUCCESS))),
      // Get suspicious activities count
      db
        .select({ value: count() })
        .from(authLog)
        .where(and(inRange, eq(authLog.eventType, AuthEventType.SUSPICIOUS_ACTIVITY))),
    ]);

    const eventsByType: Record<string, number> = {};
    eventsByTypeRaw.forEach((item) => {
      eventsByType[item.eventType] = item.value;
    });

    const eventsBySeverity: Record<string, number> = {};
    eventsBySeverityRaw.forEach((item) => {
      eventsBySeverity[item.severity] = item.value;
    });

    return {
      totalEvents,
      eventsByType,
      eventsBySeverity,
      uniqueUsers,
      failedLogins,
      successfulLogins,
      suspiciousActivities,
    };
  } catch (error) {
    logError(error as Error, {
      service: "logging",
      operation: "getAuthStats",
    });
    throw new Error("Failed to get authentication statistics");
  }
}
