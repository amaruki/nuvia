/**
 * One structured logger. See ADR-0004 and docs/observability.md.
 *
 * Replaces security.ts:logSecurityEvent (deleted — the whole file had zero
 * importers, see the rate-limiter consolidation commit), errors.ts:logError,
 * and services/logging.service.ts's console output, plus ~300 bare
 * console.* calls across src/.
 */

const LEVELS = ["debug", "info", "warn", "error", "fatal"] as const;
export type LogLevel = (typeof LEVELS)[number];

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };

function minLevel(): LogLevel {
  const configured = process.env.LOGGING_LEVEL as LogLevel | undefined;
  return configured && configured in LEVEL_ORDER ? configured : "info";
}

// Key names redacted regardless of nesting depth, per docs/observability.md.
const REDACTED_KEY_PATTERN = /^(email|ipAddress|password|passwordHash|token|.*Token|ssn|taxId)$/i;

function redact(value: unknown, seen = new Set<unknown>()): unknown {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, seen));
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    result[key] = REDACTED_KEY_PATTERN.test(key) ? "[REDACTED]" : redact(val, seen);
  }
  return result;
}

export interface LogContext {
  traceId?: string;
  [key: string]: unknown;
}

function write(level: LogLevel, message: string, context?: LogContext): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel()]) return;

  const line = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context?.traceId ? { traceId: context.traceId } : {}),
    context: redact(context ?? {}),
  };

  const json = JSON.stringify(line);
  // eslint-disable-next-line no-console -- the one sanctioned sink
  (level === "error" || level === "fatal" ? console.error : console.log)(json);
}

/**
 * `extra` covers the overwhelmingly common console.error(msg, err) shape:
 * an Error, a plain context object, or any other value gets folded into
 * `context` sensibly rather than requiring every call site to pre-build one.
 */
function normalizeContext(extra: unknown, context?: LogContext): LogContext | undefined {
  if (extra === undefined) return context;
  if (extra instanceof Error) {
    return { ...context, error: { name: extra.name, message: extra.message, stack: extra.stack } };
  }
  if (typeof extra === "object" && extra !== null) {
    return { ...context, ...(extra as Record<string, unknown>) };
  }
  return { ...context, value: extra };
}

export const logger = {
  debug: (message: string, extra?: unknown, context?: LogContext) =>
    write("debug", message, normalizeContext(extra, context)),
  info: (message: string, extra?: unknown, context?: LogContext) =>
    write("info", message, normalizeContext(extra, context)),
  warn: (message: string, extra?: unknown, context?: LogContext) =>
    write("warn", message, normalizeContext(extra, context)),
  error: (message: string, extra?: unknown, context?: LogContext) =>
    write("error", message, normalizeContext(extra, context)),
  fatal: (message: string, extra?: unknown, context?: LogContext) =>
    write("fatal", message, normalizeContext(extra, context)),
};
