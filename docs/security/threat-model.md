# Threat Model

## Trust Boundaries

**Boundary 1: Anonymous internet to `(public)` routes.**
This boundary carries untrusted input, with no session. Zod validates every input, and a rate limiter limits every input (`docs/adr/0003-single-rate-limiter.md`). No privileged operation may live here — see the route-group taxonomy in `docs/architecture/overview.md`.

**Boundary 2: Authenticated session to `(authenticated)`/`(admin)` routes.**
A valid session proves identity, not authority. `requirePermission` (`docs/adr/0001-one-authorization-helper.md`) is the boundary check for authority. `src/proxy.ts` enforces boundary 1 to 2 (does a session exist). The route-group layouts enforce boundary 2 to 3 (does this session have this permission).

**Boundary 3: Application to database.**
Drizzle's parameterized queries are the only path (`docs/architecture/data-model.md`). No string-concatenated SQL exists in this codebase. The Drizzle migration audit verified this.

**Boundary 4: Application to external services.**
These services are email (Resend/nodemailer), OAuth providers (Google, optionally GitHub/LinkedIn), and Redis. Each is a credential-bearing outbound connection. Each connection's credentials stay env-only (`docs/security/privacy.md`, `src/lib/env.ts`), never hardcoded.

## STRIDE Pass

**Spoofing.**
Session tokens are better-auth-issued, `httpOnly`, `SameSite=Lax` (fixed from `None` in `docs/adr/0009-security-hardening-p0.md`). Open: role-level authorization is still missing at the route-group level (`TODO.md` M1). An authenticated low-privilege account can reach high-privilege _pages_, though not (today) privileged _data_, since most of those pages render mock data rather than fetching real records.

**Tampering.**
Drizzle's typed queries prevent injection by construction. The admin user-creation route hashes passwords with better-auth's `hashPassword` before storing them, so stored credential material carries the same protection as the rest of the auth system.

**Repudiation.**
The audit log (`authLog` table) exists and logs role changes. Open: the audit log does not yet log most other privileged actions, since most modules are not wired to real data yet (`docs/adr/0008-module-maturity-gate.md`).

**Information Disclosure.**
Closed: the `SameSite` fix and env validation prevent silent misconfiguration. Closed: `delete-account` now hard-deletes the user through better-auth's `deleteUser` (cascading to sessions and related rows). Open: two debug endpoints leak configuration booleans in development (low severity, 404 in production — `TODO.md` M1).

**Denial of Service.**
Closed: `/api/v1/auth/login` is rate-limited (`rateLimitOrProblem` in `src/app/api/v1/auth/login/route.ts`, single-rate-limiter design in `docs/adr/0003-single-rate-limiter.md`), so unlimited password guesses against a known account are no longer possible.

**Elevation of Privilege.**
Closed: the audit-trail transaction fix requires a matching log entry for every role change. A role change cannot take effect without one. Open: the missing route-group role check (see Spoofing, above) is also the primary elevation-of-privilege surface. Reachability of a privileged _page_ by an unprivileged account is the first step toward reachability of privileged _data_, once that module's API is built.

## Out of Scope for This Document

Physical security, personnel security, and organizational controls — see `docs/security/controls.md`'s note on ISO 27001 Annex A A.5–A.7, which covers exactly this gap and explains why a codebase cannot close it alone.
</content>
