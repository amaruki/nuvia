# Changelog

All notable changes to this project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [Semantic Versioning](https://semver.org/) once version 1.0 lands. See [`docs/release.md`](docs/release.md) for what that means during the current `0.x` phase.

## [Unreleased]

### Added

- Drizzle ORM as the data layer, replacing Prisma ([ADR-0011](docs/adr/0011-prisma-to-drizzle.md)).
- `src/lib/env.ts` — validated environment configuration, loaded at import time.
- `Organization` singleton table — the tenancy seam for association identity, branding, and settings ([ADR-0007](docs/adr/0007-single-association-tenant-seam.md)).
- Bun as the canonical package manager and runtime ([ADR-0012](docs/adr/0012-bun-package-manager-and-runtime.md)).
- oxlint and oxfmt, replacing ESLint and Prettier ([ADR-0013](docs/adr/0013-oxlint-oxfmt-toolchain.md)).
- `lefthook` git hooks and `commitlint` — local enforcement on every commit, human or AI ([ADR-0010](docs/adr/0010-ai-agent-commit-guard.md)).
- `TODO.md` — replaces the previous hobbyist-scoped `to-do.md` with the real roadmap.
- `docs/` — principles, architecture, API conventions, observability, security (threat model, controls, privacy), supply chain, release engineering.
- `docs/adr/` — 13 architecture decision records.
- `CODING_STANDARD.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`.

### Changed

- Every dependency pinned to an exact version (no `^`/`~`) and bumped to latest stable.
- `.gitignore`'s blanket `.*` rule replaced with explicit exclusions, so contributors can commit `.github/`, `.editorconfig`, and similar dotfiles.
- `README.md` rewritten to describe what actually exists rather than an aspirational feature list.

### Fixed

- Session cookies no longer set `SameSite=None` in production. That setting disabled the browser's CSRF defense on a first-party application.
- `scripts/seed.ts` (formerly `prisma/seed.ts`) now requires an explicit `SEED_ADMIN_PASSWORD` instead of hardcoding the same password across five privileged accounts, including superadmin.
- Role changes and their audit-log entry now write in a single database transaction. This closes a gap. Previously, a failure between the two statements could silently drop the audit trail.
- Fallout from the dependency bump: `lucide-react` v1 dropped brand icons, `react-day-picker` v10 renamed `initialFocus`→`autoFocus` and `table`→`month_grid`, `better-auth` renamed `forgetPassword`→`requestPasswordReset`. All are fixed. See the corresponding commit for the full file list.
- A pre-existing case-collision between `Card.tsx`/`card.tsx` and `Badge.tsx`/`badge.tsx` — resolvable only on case-insensitive filesystems — is resolved in favor of the lowercase, shadcn-standard names.

### Security

- Role assignment is now validated against the role being granted, on every mutation path (single role change, bulk role change, admin user creation). Previously only the target's current role was checked, so an admin could promote anyone to superadmin, and custom roles could be created carrying permissions their creator did not hold.
- The last superadmin can no longer be demoted or delete their account, preventing lockout of the only role that can manage everything.
- `/api/auth/cache-session` no longer accepts a client-supplied session payload, which allowed writing arbitrary JSON into the Redis session cache under any token. It now caches only the caller's own revalidated session. `/api/auth/invalidate-session-cache` evicts only the caller's sessions, and `/api/auth/cache-status` requires `system:read`.
- `PUT /api/v1/auth/profile` whitelists the body through a zod schema before it reaches better-auth; the raw body used to be forwarded, so undeclared fields could be set.

### Fixed

- Username sign-in now works. The login contract's "email or username" value was forwarded verbatim to better-auth's email-only sign-in; both the API route and the server action now resolve usernames to emails first, deterministically.
- `GET /api/v1/auth/login-activities` returns real data from the `userLoginActivity` table, which had zero writers before. Successful and failed sign-in attempts are now recorded from both the API route and the login server action.
- `POST /api/v1/auth/verify-email` now calls better-auth's real verification endpoint and is rate-limited; verification mail is actually sent through the configured email provider on signup and on request.
- Anonymous callers can reach `/api/v1/auth/signup`, `/api/v1/auth/forgot-password`, and the `/api/auth/**` better-auth endpoints. The proxy's public-endpoint list carried a nonexistent `register` entry and gated all of these behind a session, so signup was unusable outside the server action.
- Deleting a user cascades into their `auth_logs` rows instead of failing the foreign key.
- Superadmin is no longer locked out of dashboard sections whose navigation role list omitted it (finance and most others), in both the server gate and the sidebar.
- Bulk role updates deduplicate user ids and run sequentially instead of unbounded parallel transactions, which could exhaust the connection pool.
- Admin user creation normalizes username/email case, returns 409 on duplicates, and writes a `USER_CREATED` audit entry.

### Removed

- `src/lib/services/role.service.ts` — a dead parallel copy of the role-mutation logic; its only live export was the `UserWithRoleInfo` type, moved to `src/types/role.types.ts`.
- `src/lib/actions/session-cache.actions.ts` — zero importers, and it read the session cookie under the wrong name.
- Prisma, `@prisma/client`, `tsx`, `ts-node`, `bcrypt`, and the deprecated `shadcn-ui` package.

## Prior history

This is not retroactively documented. This changelog starts from the hardening effort tracked in this repository's `docs/adr/` series.
