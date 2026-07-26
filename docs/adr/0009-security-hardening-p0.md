# ADR-0009: P0 security hardening — what shipped, what's tracked

**Status:** Partially implemented — see the checklist

## Context

A pre-launch security pass found several issues serious enough to block
calling this project "safe to deploy" (full detail: `TODO.md` M1). This ADR
records the decision to fix the small, bounded ones immediately alongside
the Drizzle migration (same files were already being touched) rather than
defer everything to a separate pass, while explicitly _not_ attempting the
larger, riskier items (RFC 9457, the rate limiter rewrite, role-level
authorization) in the same commit — those get their own ADRs and their own
isolated, revertible changes.

## Decision — fixed immediately

- **`sameSite` CSRF gap.** `src/lib/auth.ts` set session cookies to
  `SameSite=None` in production. Changed to always `SameSite=Lax` — this is
  a first-party application with no cross-site cookie requirement.
- **Seed script shared password.** `prisma/seed.ts` (now `scripts/seed.ts`)
  hardcoded `Admin123!@#` into five privileged accounts, including
  superadmin, and committed it to git. `db:seed` now requires
  `SEED_ADMIN_PASSWORD` and refuses to run without it.
- **No environment validation.** `src/lib/env.ts` added: zod-validated,
  loaded at import time, fails loudly instead of falling back to a
  nonexistent SQLite database or an empty email config.
- **Un-transacted audit trail.** `rbac.ts`'s `changeUserRole` now writes the
  role update and its audit log entry in one `db.transaction`.

## Decision — deliberately deferred, tracked in `TODO.md` M1

These are real, but each is either larger in scope or carries its own
design decision that deserves its own change, not a rider on the ORM
migration commit:

- Role-level (not just login-level) authorization on dashboard routes.
- `delete-account` actually deleting the account.
- Rate limiting on `/api/v1/auth/login` and friends (depends on
  ADR-0003 landing first).
- Removing the two debug endpoints.
- Security headers/CSP in `next.config.ts`.

## Consequences

- The commit history shows exactly this split: one commit for the ORM
  migration plus the bundled fixes above (justified by touching the same
  files), a separate commit for dependency-bump fallout, a separate commit
  for the pure formatting baseline. See ADR-0010 for why commits stay
  scoped this way.
