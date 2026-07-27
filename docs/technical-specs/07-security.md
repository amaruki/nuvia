# 7. Security

Supersedes `docs/security/controls.md` and `docs/security/threat-model.md`'s content for the concerns tabulated below. See those files for the full ISO/OWASP framework mapping this section does not repeat.

## 7.1 Authentication and session security

| Concern          | Implementation                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Session issuance | better-auth, `httpOnly` cookies, `SameSite=Lax` (fixed from `None` per [ADR-0009](../adr/0009-security-hardening-p0.md)) |
| Password storage | better-auth's own hashing; `validatePasswordStrength` enforced at signup and in `scripts/seed.ts`                        |
| OAuth            | Google (configured), GitHub/LinkedIn (planned), enabled only when both client ID and secret are present                  |

## 7.2 Authorization

| Concern         | Implementation                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| API routes      | `requirePermission` / `requireRole` (`src/lib/rbac.ts`), the sole authorization helper ([ADR-0001](../adr/0001-one-authorization-helper.md)) |
| Dashboard pages | `src/proxy.ts` calls `isRoleAllowedForPath` against `src/lib/navigation-data.ts`'s per-path role list (Section 2.4)                          |
| Custom roles    | Resolved via database lookup when `role` is not one of the 14 predefined values; see Section 12                                              |

## 7.3 Rate limiting

Redis-backed, one limiter ([ADR-0003](../adr/0003-single-rate-limiter.md)). Per-route limits: login 5/15min, change-password 5/15min, forgot-password 3/hour, reset-password 3/hour, signup 5/hour, generic API backstop 100/15min. Degrades to a warning and no-op when `REDIS_URL` is unset outside production; required in production (`src/lib/env.ts`).

## 7.4 CORS and request hardening

`CORS_ORIGIN` and `CORS_CREDENTIALS` are environment-configured (Section 11), defaulting to same-origin (`http://localhost:3000` in development). No CSP header is configured yet; this is an open gap, not a documented decision.

## 7.5 Object-store access

No object storage is wired yet (Section 4.4). `src/lib/services/media.service.ts` never writes a file today, so there is no access-control surface to document until that module is built.

## 7.6 Operational-endpoint policy

**Health endpoint** (`GET /api/health`, Section 5.7): public, no authentication. Exposes only aggregate status and dependency latency, no configuration values or secrets.

**Reset-state endpoint** (`POST /api/admin/reset-state`, Section 5.7): mounted only when `ENABLE_RESET_API=true`. This is enforced at route registration, not merely by authorization — the route must not exist when the flag is unset, so that a misconfigured authorization check cannot accidentally expose it. Even when mounted, the endpoint still requires `requirePermission(user, "system:manage")`. `ENABLE_RESET_API` must be unset (not merely `false`) in every production environment; Section 11 states this explicitly.

## 7.7 Trust boundaries (STRIDE summary)

Full STRIDE analysis in `docs/security/threat-model.md`; summarized here as of the last review:

- **Spoofing**: session tokens are better-auth-issued and hardened; role-level authorization at the route-group level is still an open item (`TODO.md` M1).
- **Tampering**: Drizzle's parameterized queries prevent injection by construction; the admin user-creation route storing an unhashed password is an open tampering-adjacent gap.
- **Repudiation**: `auth_logs` covers role changes; most other privileged actions are not yet logged, since most modules are not wired to real data.
- **Information disclosure**: the `delete-account` endpoint claiming success without deleting data is the primary open item (Section 7.8).
- **Denial of service**: covered by the rate limiter (Section 7.3); `/api/v1/auth/login` is now covered following the ADR-0003 consolidation.
- **Elevation of privilege**: the missing route-group role check (see Spoofing) is the primary surface; the audit-trail transaction fix (Section 7.9) closes the elevation risk on role changes specifically.

## 7.8 Known open items

- `DELETE /api/v1/auth/delete-account` authenticates the caller and returns success without deleting anything (`docs/security/privacy.md`). This is broken, not merely unimplemented, and is `TODO.md` M1's highest-priority item after the authorization gaps.
- Two debug endpoints leak configuration booleans (low severity, `TODO.md` M1).

## 7.9 Auditability

A privileged mutation (a role change today; a financial transaction once Finance is promoted) writes its audit-log entry in the same database transaction as the mutation itself ([ADR-0009](../adr/0009-security-hardening-p0.md)) — an audit entry that might not exist is not an audit trail. Read-path logging (page views, searches) is fire-and-forget by design; write-path logging of anything privileged is not (`docs/PRINCIPLES.md`, "fast vs. auditable").
