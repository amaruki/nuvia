/**
 * Logger core — the LoggingService orchestrating the auth-event pipeline:
 * capture through the sinks (console mirror + database write), delegation
 * of the reads, suspicious-activity detection, and retention cleanup.
 */

import { and, count, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db/client";
import { authLog } from "@/db/schema";
import { env } from "@/lib/env";
import { logError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { AuthEventSeverity, AuthEventType } from "./levels";
import {
  getAuthStats as queryAuthStats,
  getRecentAuthLogs as queryRecentAuthLogs,
  getUserAuthLogs as queryUserAuthLogs,
} from "./queries";
import { emitToConsoleSink, persistToDatabaseSink } from "./sinks";
import type { AuthLogEntry, AuthLogInsert, AuthStatsResult } from "./types";

/**
 * Logging and monitoring service for authentication events
 */
export class LoggingService {
  /**
   * Log an authentication event
   * @param entry - Log entry to record
   */
  async logAuthEvent(entry: AuthLogInsert): Promise<void> {
    try {
      if (!env.LOGGING_ERRORS) {
        return;
      }

      // Create the log entry with timestamp
      const logEntry: AuthLogEntry = {
        ...entry,
        timestamp: new Date(),
      };

      // Log to console for development/debugging
      emitToConsoleSink(logEntry);

      // Store in database for persistence
      await persistToDatabaseSink(logEntry);

      // Check for suspicious activity patterns
      await this.detectSuspiciousActivity(logEntry);
    } catch (error) {
      logger.error("Failed to log authentication event", error);
    }
  }

  /**
   * Get authentication logs for a user
   * @param userId - User ID
   * @param limit - Maximum number of logs to retrieve
   * @param offset - Offset for pagination
   * @returns List of authentication logs
   */
  async getUserAuthLogs(userId: string, limit = 50, offset = 0): Promise<AuthLogEntry[]> {
    return queryUserAuthLogs(userId, limit, offset);
  }

  /**
   * Get recent authentication events
   * @param eventType - Optional event type to filter by
   * @param limit - Maximum number of logs to retrieve
   * @param offset - Offset for pagination
   * @returns List of authentication logs
   */
  async getRecentAuthLogs(
    eventType?: AuthEventType,
    limit = 100,
    offset = 0,
  ): Promise<AuthLogEntry[]> {
    return queryRecentAuthLogs(eventType, limit, offset);
  }

  /**
   * Get authentication statistics
   * @param startDate - Start date for statistics
   * @param endDate - End date for statistics
   * @returns Authentication statistics
   */
  async getAuthStats(
    startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: Date = new Date(),
  ): Promise<AuthStatsResult> {
    return queryAuthStats(startDate, endDate);
  }

  /**
   * Detect suspicious activity patterns
   * @param logEntry - Recent log entry to analyze
   */
  private async detectSuspiciousActivity(logEntry: AuthLogEntry): Promise<void> {
    try {
      // Check for multiple failed login attempts from the same IP
      if (logEntry.eventType === AuthEventType.LOGIN_FAILURE && logEntry.ipAddress) {
        const [{ value: recentFailedLogins }] = await db
          .select({ value: count() })
          .from(authLog)
          .where(
            and(
              eq(authLog.eventType, AuthEventType.LOGIN_FAILURE),
              eq(authLog.ipAddress, logEntry.ipAddress),
              gte(authLog.timestamp, new Date(Date.now() - 15 * 60 * 1000)), // Last 15 minutes
            ),
          );

        // If more than 5 failed attempts in 15 minutes, log as suspicious
        if (recentFailedLogins >= 5) {
          await this.logAuthEvent({
            eventType: AuthEventType.SUSPICIOUS_ACTIVITY,
            severity: AuthEventSeverity.WARNING,
            message: `Multiple failed login attempts detected from IP: ${logEntry.ipAddress}`,
            ipAddress: logEntry.ipAddress,
            metadata: {
              reason: "multiple_failed_logins",
              failedAttempts: recentFailedLogins,
              timeWindow: "15 minutes",
            },
          });
        }
      }

      // Check for logins from unusual locations (if location data is available)
      if (
        logEntry.eventType === AuthEventType.LOGIN_SUCCESS &&
        logEntry.userId &&
        logEntry.location
      ) {
        // Get recent login locations for this user
        const recentLogins = await db
          .selectDistinct({ location: authLog.location })
          .from(authLog)
          .where(
            and(
              eq(authLog.userId, logEntry.userId),
              eq(authLog.eventType, AuthEventType.LOGIN_SUCCESS),
              gte(authLog.timestamp, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), // Last 30 days
            ),
          );

        const usualLocations = recentLogins.map((login) => login.location).filter(Boolean);

        // If login is from a new location, log as suspicious
        if (usualLocations.length > 0 && !usualLocations.includes(logEntry.location)) {
          await this.logAuthEvent({
            eventType: AuthEventType.SUSPICIOUS_ACTIVITY,
            severity: AuthEventSeverity.WARNING,
            message: `Login from unusual location detected for user: ${logEntry.userId}`,
            userId: logEntry.userId,
            ipAddress: logEntry.ipAddress,
            location: logEntry.location,
            metadata: {
              reason: "unusual_location",
              usualLocations,
              newLocation: logEntry.location,
            },
          });
        }
      }

      // Check for rapid password reset requests
      if (logEntry.eventType === AuthEventType.PASSWORD_RESET_REQUEST && logEntry.ipAddress) {
        const [{ value: recentResetRequests }] = await db
          .select({ value: count() })
          .from(authLog)
          .where(
            and(
              eq(authLog.eventType, AuthEventType.PASSWORD_RESET_REQUEST),
              eq(authLog.ipAddress, logEntry.ipAddress),
              gte(authLog.timestamp, new Date(Date.now() - 60 * 60 * 1000)), // Last hour
            ),
          );

        // If more than 3 reset requests in an hour, log as suspicious
        if (recentResetRequests >= 3) {
          await this.logAuthEvent({
            eventType: AuthEventType.SUSPICIOUS_ACTIVITY,
            severity: AuthEventSeverity.WARNING,
            message: `Multiple password reset requests detected from IP: ${logEntry.ipAddress}`,
            ipAddress: logEntry.ipAddress,
            metadata: {
              reason: "multiple_password_resets",
              resetRequests: recentResetRequests,
              timeWindow: "1 hour",
            },
          });
        }
      }
    } catch (error) {
      logger.error("Failed to detect suspicious activity", error);
    }
  }

  /**
   * Clean up old authentication logs
   * @param daysToKeep - Number of days to keep logs for
   * @returns Number of logs cleaned up
   */
  async cleanupOldLogs(daysToKeep = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deleted = await db
        .delete(authLog)
        .where(lt(authLog.timestamp, cutoffDate))
        .returning({ id: authLog.id });

      return deleted.length;
    } catch (error) {
      logError(error as Error, {
        service: "logging",
        operation: "cleanupOldLogs",
      });
      throw new Error("Failed to clean up old authentication logs");
    }
  }
}

// Create a singleton instance of the logging service
export const loggingService = new LoggingService();
