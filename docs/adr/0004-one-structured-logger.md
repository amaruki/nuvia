# ADR-0004: One structured logger

**Status:** Accepted, not yet implemented (tracked in `TODO.md` M2)

## Context

Three logging implementations exist (`security.ts:logSecurityEvent`, `services/logging.service.ts`, `errors.ts:logError`), plus 301 bare `console.*` calls across `src/` that bypass all three. None emit structured (JSON) output, none carry a request-trace correlation ID, and none redact PII before they write it.

## Decision

Use one structured logger, exported from `src/lib/logger.ts`. It wraps a single severity ladder (`debug` / `info` / `warn` / `error` / `fatal`). It emits JSON lines with: `timestamp`, `level`, `message`, `traceId` (from W3C Trace Context propagation, see `docs/observability.md`), and a `context` object. The logger redacts PII fields (email, IP address, tokens) by key-name pattern before serialization, not by convention at each call site.

`security.ts:logSecurityEvent`, `services/logging.service.ts`'s console output, and `errors.ts:logError` are rewritten to call this logger instead of `console.*` directly. `LoggingService`'s `authLog` DB writes (`src/lib/services/logging.service.ts`) stay. A persisted audit trail and structured application logs are different concerns, and the system needs both.

## Consequences

- The team enables `oxlint`'s `no-console` rule only after the migration is complete. If the team enables it earlier, the build immediately fails against 301 existing violations (see the ratchet approach in `docs/adr/0009-security-hardening-p0.md`).
- Every request handler that goes through `requirePermission` (ADR-0001) automatically receives a `traceId`. As a result, a team can trace a single request across the logger, the RFC 9457 error response's `instance` field, and the `authLog` DB row it may also write.
