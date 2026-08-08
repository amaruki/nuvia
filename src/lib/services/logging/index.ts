/**
 * Authentication-event logging and monitoring service — the auth_logs
 * audit trail: event capture through console/database sinks (levels.ts,
 * sinks.ts), history reads and aggregate statistics (queries.ts), and the
 * LoggingService orchestration core with suspicious-activity detection and
 * retention cleanup (logger.ts).
 *
 * Split from src/lib/services/logging.service.ts, which stays as a
 * re-export shim so `@/lib/services/logging.service` keeps resolving.
 */

export { AuthEventSeverity, AuthEventType } from "./levels";
export type { AuthLogEntry } from "./types";
export { LoggingService, loggingService } from "./logger";
