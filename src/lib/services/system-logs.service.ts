/**
 * Read-only log-system status for the tools/logs page (UI-23/D3).
 *
 * The honest truth about logs in this codebase (recon, not invention):
 * there is exactly one logger — src/lib/logger.ts (ADR-0004) — and it
 * writes JSON lines to the process's stdout/stderr via console. No pino, no
 * winston, no file sink, no transport of any kind. That means there is no
 * stored log history anywhere to browse, and the tools/logs page refuses to
 * fake a log viewer. This service only reads configuration facts and counts
 * the one log-like thing that IS persisted: the auth audit trail
 * (auth_logs), written by the auth layer, not by the logger.
 */

import { sql } from "drizzle-orm";

import { db } from "@/db/client";
import { authLog } from "@/db/schema";
import { env } from "@/lib/env";
import type { LogLevel } from "@/lib/logger";

export interface AuditTrailStatus {
  /** The table the auth layer writes its audit events to. */
  table: "auth_logs";
  rowCount: number | null;
  /** The newest audit event's timestamp as stored, or null when empty. */
  lastEventAt: string | null;
  /** Populated when the count query failed (e.g. database unreachable). */
  error: string | null;
}

export interface LogsSystemStatus {
  /** Where application logs go. A literal type on purpose: there is no
   * configurable sink in this codebase — stdout is the whole truth. */
  sink: "stdout";
  /** The single structured logger (ADR-0004). */
  loggerModule: "src/lib/logger.ts";
  lineFormat: "JSON lines";
  /** Minimum level the logger emits, from LOGGING_LEVEL (default "info"). */
  configuredLevel: LogLevel;
  /** LOGGING_REQUESTS / LOGGING_ERRORS flags from src/lib/env.ts. */
  requestLoggingEnabled: boolean;
  errorLoggingEnabled: boolean;
  /** No file/transport sink exists — hardcoded fact, not a probe. */
  fileSinkConfigured: false;
  /**
   * The commands whose stdout/stderr carries the logs, verbatim from
   * package.json scripts. Point operators at these — the platform's log
   * collector is the only "storage".
   */
  runCommands: { label: string; command: string }[];
  auditTrail: AuditTrailStatus;
}

async function readAuditTrail(): Promise<AuditTrailStatus> {
  try {
    const rows = await db.execute(
      sql`select count(*)::int as row_count, max(${authLog.timestamp})::text as last_event_at from ${authLog}`,
    );
    const row = rows[0] as
      | { row_count?: number | string; last_event_at?: string | null }
      | undefined;
    return {
      table: "auth_logs",
      rowCount: Number(row?.row_count ?? 0),
      lastEventAt: row?.last_event_at ?? null,
      error: null,
    };
  } catch (error) {
    return {
      table: "auth_logs",
      rowCount: null,
      lastEventAt: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getLogsSystemStatus(): Promise<LogsSystemStatus> {
  const auditTrail = await readAuditTrail();

  return {
    sink: "stdout",
    loggerModule: "src/lib/logger.ts",
    lineFormat: "JSON lines",
    configuredLevel: env.LOGGING_LEVEL,
    requestLoggingEnabled: env.LOGGING_REQUESTS,
    errorLoggingEnabled: env.LOGGING_ERRORS,
    fileSinkConfigured: false,
    // Verbatim from package.json ("dev" and "start" scripts).
    runCommands: [
      { label: "Development", command: "bun run dev" },
      { label: "Production", command: "bun run start" },
    ],
    auditTrail,
  };
}
