import { and, count, desc, eq, gte, isNotNull, lte, lt } from "drizzle-orm";
import { db } from "@/db/client";
import { authLog } from "@/db/schema";
import { env } from "@/lib/env";
import { logError } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * Authentication event types
 */
export enum AuthEventType {
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILURE = "login_failure",
  LOGOUT = "logout",
  SIGNUP_SUCCESS = "signup_success",
  SIGNUP_FAILURE = "signup_failure",
  PASSWORD_RESET_REQUEST = "password_reset_request",
  PASSWORD_RESET_SUCCESS = "password_reset_success",
  PASSWORD_RESET_FAILURE = "password_reset_failure",
  EMAIL_VERIFICATION_SUCCESS = "email_verification_success",
  EMAIL_VERIFICATION_FAILURE = "email_verification_failure",
  ACCOUNT_DEACTIVATION = "account_deactivation",
  ACCOUNT_REACTIVATION = "account_reactivation",
  ACCOUNT_DELETION = "account_deletion",
  PASSWORD_CHANGE = "password_change",
  PROFILE_UPDATE = "profile_update",
  SECURITY_QUESTION_UPDATE = "security_question_update",
  TWO_FACTOR_ENABLE = "two_factor_enable",
  TWO_FACTOR_DISABLE = "two_factor_disable",
  SESSION_EXPIRED = "session_expired",
  SESSION_INVALIDATED = "session_invalidated",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
}

/**
 * Authentication event severity levels
 */
export enum AuthEventSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

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

/**
 * Logging and monitoring service for authentication events
 */
export class LoggingService {
  /**
   * Log an authentication event
   * @param entry - Log entry to record
   */
  async logAuthEvent(entry: Omit<AuthLogEntry, "id" | "timestamp">): Promise<void> {
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
      if (env.LOGGING_REQUESTS || env.LOGGING_ERRORS) {
        logger.info(`[AuthEvent] ${logEntry.eventType}: ${logEntry.message}`, {
          userId: logEntry.userId,
          severity: logEntry.severity,
          ipAddress: logEntry.ipAddress,
          timestamp: logEntry.timestamp,
        });
      }

      // Store in database for persistence
      await db.insert(authLog).values({
        userId: logEntry.userId,
        eventType: logEntry.eventType,
        severity: logEntry.severity,
        message: logEntry.message,
        ipAddress: logEntry.ipAddress,
        userAgent: logEntry.userAgent,
        deviceId: logEntry.deviceId,
        location: logEntry.location,
        metadata: logEntry.metadata || {},
        timestamp: logEntry.timestamp,
      });

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
    try {
      const logs = await db
        .select()
        .from(authLog)
        .where(eq(authLog.userId, userId))
        .orderBy(desc(authLog.timestamp))
        .limit(limit)
        .offset(offset);

      return logs.map((log: any) => ({
        id: log.id,
        userId: log.userId,
        eventType: log.eventType as AuthEventType,
        severity: log.severity as AuthEventSeverity,
        message: log.message,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        deviceId: log.deviceId,
        location: log.location,
        metadata: log.metadata as Record<string, any>,
        timestamp: log.timestamp,
      }));
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
  async getRecentAuthLogs(
    eventType?: AuthEventType,
    limit = 100,
    offset = 0,
  ): Promise<AuthLogEntry[]> {
    try {
      const logs = await db
        .select()
        .from(authLog)
        .where(eventType ? eq(authLog.eventType, eventType) : undefined)
        .orderBy(desc(authLog.timestamp))
        .limit(limit)
        .offset(offset);

      return logs.map((log: any) => ({
        id: log.id,
        userId: log.userId,
        eventType: log.eventType as AuthEventType,
        severity: log.severity as AuthEventSeverity,
        message: log.message,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        deviceId: log.deviceId,
        location: log.location,
        metadata: log.metadata as Record<string, any>,
        timestamp: log.timestamp,
      }));
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
  async getAuthStats(
    startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: Date = new Date(),
  ): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    uniqueUsers: number;
    failedLogins: number;
    successfulLogins: number;
    suspiciousActivities: number;
  }> {
    try {
      const inRange = and(gte(authLog.timestamp, startDate), lte(authLog.timestamp, endDate));

      // Get total events count
      const [{ value: totalEvents }] = await db
        .select({ value: count() })
        .from(authLog)
        .where(inRange);

      // Get events by type
      const eventsByTypeRaw = await db
        .select({ eventType: authLog.eventType, value: count() })
        .from(authLog)
        .where(inRange)
        .groupBy(authLog.eventType);

      const eventsByType: Record<string, number> = {};
      eventsByTypeRaw.forEach((item) => {
        eventsByType[item.eventType] = item.value;
      });

      // Get events by severity
      const eventsBySeverityRaw = await db
        .select({ severity: authLog.severity, value: count() })
        .from(authLog)
        .where(inRange)
        .groupBy(authLog.severity);

      const eventsBySeverity: Record<string, number> = {};
      eventsBySeverityRaw.forEach((item) => {
        eventsBySeverity[item.severity] = item.value;
      });

      // Get unique users count
      const uniqueUsersRows = await db
        .selectDistinct({ userId: authLog.userId })
        .from(authLog)
        .where(and(inRange, isNotNull(authLog.userId)));
      const uniqueUsers = uniqueUsersRows.length;

      // Get failed logins count
      const [{ value: failedLogins }] = await db
        .select({ value: count() })
        .from(authLog)
        .where(and(inRange, eq(authLog.eventType, AuthEventType.LOGIN_FAILURE)));

      // Get successful logins count
      const [{ value: successfulLogins }] = await db
        .select({ value: count() })
        .from(authLog)
        .where(and(inRange, eq(authLog.eventType, AuthEventType.LOGIN_SUCCESS)));

      // Get suspicious activities count
      const [{ value: suspiciousActivities }] = await db
        .select({ value: count() })
        .from(authLog)
        .where(and(inRange, eq(authLog.eventType, AuthEventType.SUSPICIOUS_ACTIVITY)));

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
