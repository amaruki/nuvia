# Threat Model

## Trust boundaries

**Boundary 1: Anonymous internet → `(public)` routes.**
Untrusted input, no session.
Every input is validated (zod) and rate-limited (`docs/adr/0003-single-rate-limiter.md`).
No privileged operation may live here — see the route-group taxonomy in `docs/architecture/overview.md`.

**Boundary 2: Authenticated session → `(authenticated)`/`(admin)` routes.**
A valid session proves identity, not authority.
`requirePermission` (`docs/adr/0001-one-authorization-helper.md`) is the boundary check for authority.
`src/proxy.ts` enforces boundary 1→2 (does a session exist); route-group layouts enforce 2→3 (does this session have this permission).

**Boundary 3: Application → database.**
Drizzle's parameterized queries are the only path (`docs/architecture/data-model.md`).
No string-concatenated SQL exists in this codebase — verified during the Drizzle migration audit.

**Boundary 4: Application → external services.**
Email (Resend/nodemailer), OAuth providers (Google, optionally GitHub/LinkedIn), Redis.
Each is a credential-bearing outbound connection; credentials are env-only (`docs/security/privacy.md`, `src/lib/env.ts`), never hardcoded.

## STRIDE pass

**Spoofing.**
Session tokens are better-auth-issued, `httpOnly`, `SameSite=Lax` (fixed from `None` in `docs/adr/0009-security-hardening-p0.md`).
Open: role-level authorization is still missing at the route-group level (`TODO.md` M1) — an authenticated low-privilege account can reach high-privilege _pages_, though not (today) privileged _data_, since most of those pages render mock data rather than fetching real records.

**Tampering.**
Drizzle's typed queries prevent injection by construction.
Open: the admin user-creation route stores an unhashed password directly (`TODO.md` M1) — a data-integrity and confidentiality issue, not injection, but tampering-adjacent in that stored credential material isn't protected the way the rest of the auth system protects it.

**Repudiation.**
Audit log (`authLog` table) exists and is written to for role changes.
Open: not yet written to for most other privileged actions, since most modules aren't wired to real data yet (`docs/adr/0008-module-maturity-gate.md`).

**Information disclosure.**
Closed: `SameSite` fix, env validation preventing silent misconfiguration.
Open: `delete-account` claims success without deleting anything (`TODO.md` M1) — a user who believes their data is gone is in fact still exposed; this is a disclosure risk against the user's own expectation, not a third party's access.
Open: two debug endpoints leak configuration booleans (low severity — `TODO.md` M1).

**Denial of service.**
Open: no working rate limiter on `/api/v1/auth/login` (`docs/adr/0003-single-rate-limiter.md`) — an attacker can attempt unlimited password guesses against any known account today.

**Elevation of privilege.**
Closed: the audit-trail transaction fix prevents a role change from being applied without a matching log entry.
Open: the missing route-group role check (Spoofing, above) is also the primary elevation-of-privilege surface — reachability of a privileged _page_ by an unprivileged account is the first step toward reachability of privileged _data_ once that module's API is built.

## Out of scope for this document

Physical security, personnel security, and organizational controls — see
`docs/security/controls.md`'s note on ISO 27001 Annex A A.5–A.7, which
covers exactly this gap and why a codebase can't close it alone.
