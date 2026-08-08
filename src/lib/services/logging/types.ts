/**
 * Shared auth-logging types — the transport-neutral log entry, the insert
 * shape accepted by LoggingService.logAuthEvent, and the statistics result
 * shape returned by getAuthStats.
 */

import type { AuthEventSeverity, AuthEventType } from "./levels";

/**
 * Authentication log entry interface
 */
export interface AuthLogEntry {
  id?: string;
  userId?: string;
  eventType: AuthEventType;
  severity: AuthEventSeverity;
  message: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  location?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/** Input accepted by logAuthEvent — id and timestamp are assigned on write. */
export type AuthLogInsert = Omit<AuthLogEntry, "id" | "timestamp">;

/** Aggregated authentication statistics over a date range. */
export interface AuthStatsResult {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  uniqueUsers: number;
  failedLogins: number;
  successfulLogins: number;
  suspiciousActivities: number;
}
