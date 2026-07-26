# CLAUDE.md

Guidance for AI coding agents working in this repository.
This file states the canonical choice for every contested decision and
points at the ADR that explains why — it does not restate the reasoning,
so it stays short enough to actually be read.
If you are an agent and this file conflicts with something you inferred
from the surrounding code, this file wins; the surrounding code may
predate the decision.

## Why this file exists

220 commits landed on `main` directly, with no review, over about six
weeks — a pace consistent with unsupervised AI-assisted development.
That pace is exactly how this codebase ended up with three authorization
helpers, three API response shapes, and four rate limiters, only one of
each actually used.
An agent with no guardrail is just as capable of adding a fourth of each.
This file, `lefthook.yml`'s hooks
(`docs/adr/0010-ai-agent-commit-guard.md`), and `docs/adr/` together are
the guardrail.

## Before writing code

1. Check `docs/adr/README.md` for whether this decision is already made.
   If a canonical helper, pattern, or dependency exists, use it — do not
   introduce an alternative because it seems cleaner in isolation.
2. Check `TODO.md` for whether the thing you're about to build is already
   scoped there, with known constraints.
3. If you're about to import something oxlint's `no-restricted-imports`
   blocks, that block has a message naming the replacement — use the
   replacement, don't work around the lint rule.

## Canonical choices (see the linked ADR for why)

| Concern                   | Use                                                                 | Never                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Authorization             | `requirePermission`/`requireRole` from `src/lib/rbac.ts`            | `withAuth`, `withRole`, `withResourceAuth`, `authorizeApi` — deleted, [0001](docs/adr/0001-one-authorization-helper.md) |
| API errors                | RFC 9457 via `problemResponse()` (`src/lib/http.ts`, once it lands) | Ad-hoc `NextResponse.json({ error: ... })`, [0002](docs/adr/0002-rfc9457-error-contract.md)                             |
| Rate limiting             | The Redis-backed limiter (once it lands)                            | In-memory `Map`-based limiters, [0003](docs/adr/0003-single-rate-limiter.md)                                            |
| Logging                   | The structured logger (once it lands), never bare `console.*`       | `security.ts:logSecurityEvent`, `logging.service.ts` console output, [0004](docs/adr/0004-one-structured-logger.md)     |
| ORM                       | Drizzle (`src/db/client.ts`, `src/db/schema/`)                      | Prisma — fully removed, [0011](docs/adr/0011-prisma-to-drizzle.md)                                                      |
| Package manager / runtime | Bun (`bun`, `bunx`)                                                 | npm, yarn, pnpm, [0012](docs/adr/0012-bun-package-manager-and-runtime.md)                                               |
| Lint / format             | oxlint / oxfmt                                                      | ESLint, Prettier — removed, [0013](docs/adr/0013-oxlint-oxfmt-toolchain.md)                                             |
| Nav visibility            | Derived from the permission a route requires                        | A parallel `roles: string[]` list, [0005](docs/adr/0005-permissions-not-roles.md)                                       |
| Components                | Server Component by default                                         | `"use client"` without a specific interactivity reason, [0006](docs/adr/0006-server-first-components.md)                |

## Dependency versions are pinned, not ranged

Every entry in `package.json` is an exact version — no `^`, no `~`.
Adding a dependency means adding it at an exact, currently-published
version, not a range.
Bumping a dependency is a deliberate, isolated commit, not a side effect of
adding an unrelated package (`bun install` on a fresh add should not touch
unrelated pinned versions).

## New modules are off by default

A new domain module (finance, chapters, anything not in the current
enabled set: members, events, content, forums, jobs) does not get its
feature flag flipped to `true` until it has a real Drizzle schema, an
authorized API, tests, and docs — all four, not some
(`docs/adr/0008-module-maturity-gate.md`).
Building UI against mock data is fine as a starting point; shipping it
enabled by default is not.

## Commits

- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`,
  `test:`, `perf:`, `ci:`, `build:`, `revert:`), enforced by commitlint.
- **No `Co-Authored-By:` trailer, ever** — enforced by a commit-msg hook,
  not a request.
- Separate concerns into separate commits.
  A dependency migration, the fallout fixes it causes, and an unrelated
  formatting pass are three commits, not one — see the commit history from
  the Drizzle migration for the pattern.
- `lefthook`'s pre-commit hook runs oxlint and oxfmt on staged files; it
  will block a commit that fails either.
  Do not bypass it with `--no-verify` — if a check is wrong, fix the check
  in a separate commit, don't route around it.

## When you find a bug outside your task's scope

Log it in `TODO.md` with a file:line reference rather than fixing it
silently mid-unrelated-change, unless it's a one-line fix directly caused
by the change you're already making (e.g., a dependency bump you performed
broke a call site — fix that, it's your bug now) — see the Drizzle
migration commit's own `TODO.md` entries for the standard this sets.

## What "done" means for a claim in this repo

A claim in a doc, a commit message, or a code comment about what the
system does or doesn't do should be checked against the actual code before
being written, not assumed from an earlier finding.
`TODO.md`'s corrected auth-gate finding — an earlier pass claimed no
server-side auth gate existed, when in fact `src/proxy.ts` (Next.js 16's
renamed `middleware.ts`) does gate `/dashboard/**` for authentication — is
the concrete example of getting this wrong and the standard for correcting
it plainly rather than quietly.
