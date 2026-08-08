/**
 * Auth-log sinks (transports) — the console mirror routed through the
 * structured app logger (ADR-0004), and the durable auth_logs database
 * write that persists the audit trail.
 */

import { db } from "@/db/client";
import { authLog } from "@/db/schema";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { formatAuthEventMessage } from "./levels";
import type { AuthLogEntry } from "./types";

/**
 * Console sink — mirrors the entry through the structured logger for
 * development/debugging.
 */
export function emitToConsoleSink(entry: AuthLogEntry): void {
  if (env.LOGGING_REQUESTS || env.LOGGING_ERRORS) {
    logger.info(formatAuthEventMessage(entry.eventType, entry.message), {
      userId: entry.userId,
      severity: entry.severity,
      ipAddress: entry.ipAddress,
      timestamp: entry.timestamp,
    });
  }
}

/**
 * Database sink — persists the entry to the auth_logs table.
 */
export async function persistToDatabaseSink(entry: AuthLogEntry): Promise<void> {
  await db.insert(authLog).values({
    userId: entry.userId,
    eventType: entry.eventType,
    severity: entry.severity,
    message: entry.message,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
    deviceId: entry.deviceId,
    location: entry.location,
    metadata: entry.metadata || {},
    timestamp: entry.timestamp,
  });
}
