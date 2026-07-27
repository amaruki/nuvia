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

### Removed

- Prisma, `@prisma/client`, `tsx`, `ts-node`, `bcrypt`, and the deprecated `shadcn-ui` package.

## Prior history

This is not retroactively documented. This changelog starts from the hardening effort tracked in this repository's `docs/adr/` series.
