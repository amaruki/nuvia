# Observability

See [ADR-0004](adr/0004-one-structured-logger.md) for why one logger.

## Log schema

JSON lines, one per event:

```json
{
  "timestamp": "2026-07-26T15:16:05Z",
  "level": "warn",
  "message": "Multiple failed login attempts",
  "traceId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
  "context": { "ipAddress": "[REDACTED]", "attempts": 5 }
}
```

## Severity ladder

| Level   | Meaning                      | Example                              |
| ------- | ---------------------------- | ------------------------------------ |
| `debug` | Development-only detail      | Query timing                         |
| `info`  | Normal operation             | Login success, role change           |
| `warn`  | Recoverable, needs attention | Failed login, rate limit hit         |
| `error` | Request failed               | Unhandled exception in a route       |
| `fatal` | Process cannot continue      | DB connection pool exhausted at boot |

`LOGGING_LEVEL` (already an env var, now validated by `src/lib/env.ts`)
sets the minimum level emitted; production defaults to `info`.

## Trace propagation

[W3C Trace Context](https://www.w3.org/TR/trace-context/) — a `traceparent`
header read on inbound requests (generated if absent) and propagated to
every log line and DB audit-log write (`authLog.metadata.traceId`) for that
request. The same ID appears in the RFC 9457 error response's `instance`
extension, so a user-reported error can be traced end-to-end from the
response they saw to the exact log lines and audit rows it produced.
OpenTelemetry SDK wraps the propagation once `TODO.md` M2's logger lands;
until then, a request-scoped ID generated in `proxy.ts` and threaded
through via a header is sufficient and doesn't require the OTel dependency
up front.

## PII redaction

Redaction happens in the logger itself, by key name pattern, not by
convention at each call site — a call site that forgets to redact is a bug
class, not an edge case. Redacted keys (non-exhaustive, extended as new
PII-bearing fields are added): `email`, `ipAddress`, `password`,
`passwordHash`, `token`, `*Token`, `ssn`, `taxId`. A field matching one of
these patterns is replaced with `[REDACTED]` before serialization,
regardless of nesting depth in the `context` object.

## What this replaces

`src/lib/security.ts:logSecurityEvent`, `src/lib/services/logging.service.ts`'s
console output, `src/lib/errors.ts:logError`, and 301 bare `console.*`
calls across `src/` — see `TODO.md` M2 for the migration plan and the
`no-console` ratchet.
