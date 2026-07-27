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

`LOGGING_LEVEL` is already an environment variable. `src/lib/env.ts` now validates it. `LOGGING_LEVEL` sets the minimum level that the logger emits. In production, the default value is `info`.

## Trace propagation

Nuvia follows [W3C Trace Context](https://www.w3.org/TR/trace-context/). The server reads a `traceparent` header on each inbound request, and generates one if the request has none. The server then propagates this header to every log line and to the database audit-log write (`authLog.metadata.traceId`) for that request. The same ID appears in the `instance` extension of the RFC 9457 error response. As a result, a support engineer can trace a user-reported error end-to-end. The trace runs from the response the user saw to the exact log lines and audit rows that the request produced. Once `TODO.md` M2's logger lands, the OpenTelemetry SDK will wrap this propagation. Until then, a request-scoped ID that `proxy.ts` generates and passes through a header is enough, and this approach does not need the OpenTelemetry dependency yet.

## PII redaction

The logger itself performs redaction, by key name pattern. Redaction does not depend on convention at each call site. A call site that forgets to redact a field is a bug class, not an edge case. The list of redacted keys is not exhaustive, and grows as developers add new PII-bearing fields: `email`, `ipAddress`, `password`, `passwordHash`, `token`, `*Token`, `ssn`, `taxId`. Before serialization, the logger replaces a field that matches one of these patterns with `[REDACTED]`, regardless of the field's nesting depth in the `context` object.

## What this replaces

This logger replaces four things: `src/lib/security.ts:logSecurityEvent`, the console output of `src/lib/services/logging.service.ts`, `src/lib/errors.ts:logError`, and 301 bare `console.*` calls across `src/`. See `TODO.md` M2 for the migration plan and the `no-console` ratchet.
