# ADR-0009: P0 security hardening — what shipped, what is tracked

**Status:** Partially implemented — see the checklist

## Context

A pre-launch security pass found several issues serious enough to block the claim that this project is "safe to deploy" (full detail: `TODO.md` M1). This ADR records the decision to fix the small, bounded issues immediately, alongside the Drizzle migration. The same files were already open for that migration. This ADR does not defer every issue to a separate pass. It also explicitly does not attempt the larger, riskier items (RFC 9457, the rate limiter rewrite, role-level authorization) in the same commit. Those items get their own ADRs and their own isolated, revertible changes.

## Decision — fixed immediately

- **`sameSite` CSRF gap.** `src/lib/auth/index.ts` set session cookies to `SameSite=None` in production. This fix changed the setting to always `SameSite=Lax`. This application is first-party and has no cross-site cookie requirement.
- **Seed script shared password.** `prisma/seed.ts` (now `scripts/seed.ts`) hardcoded `Admin123!@#` into five privileged accounts, including superadmin, and committed it to git. `db:seed` now requires `SEED_ADMIN_PASSWORD` and refuses to run without it.
- **No environment validation.** This fix added `src/lib/env.ts`. This module is zod-validated and loads at import time. It fails loudly. It does not fall back to a nonexistent SQLite database or an empty email configuration.
- **Un-transacted audit trail.** The `changeUserRole` function in `rbac.ts` now writes the role update and its audit log entry in one `db.transaction`.

## Decision — deliberately deferred, tracked in `TODO.md` M1

These items are real. However, each item is either larger in scope, or it carries its own design decision. Each deserves its own change, not a rider on the ORM migration commit:

- Role-level (not just login-level) authorization on dashboard routes.
- The fix to make `delete-account` actually delete the account.
- Rate limiting on `/api/v1/auth/login` and similar routes (depends on ADR-0003, which must land first).
- Removal of the two debug endpoints.
- Security headers and CSP in `next.config.ts`.

## Consequences

- The commit history shows exactly this split. One commit holds the ORM migration plus the bundled fixes above. This commit makes sense because it touches the same files. A separate commit holds dependency-bump fallout. Another separate commit holds the pure formatting baseline. See ADR-0010 for why commits stay scoped this way.
