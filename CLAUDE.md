# CLAUDE.md

This file gives guidance to AI coding agents that work in this repository. It states the canonical choice for every contested decision and links to the ADR that explains the reason. This file does not repeat that reasoning, so it stays short enough for readers to actually use it. If you are an agent and this file conflicts with something you inferred from the surrounding code, this file wins. The surrounding code may predate the decision. Do not overcomment the codebase: comments should explain why code exists or why a non-obvious decision was made, not restate what the code already clearly shows.

## Why this file exists

220 commits landed on `main` directly, with no review, over about six weeks — a pace consistent with unsupervised AI-assisted development. That pace is exactly how this codebase ended up with three authorization helpers, three API response shapes, and four rate limiters. Only one of each is actually used. An agent with no guardrail can add a fourth of each just as easily. This file, the hooks in `lefthook.yml` (`docs/adr/0010-ai-agent-commit-guard.md`), and `docs/adr/` together are the guardrail.

## Before writing code

1. Check `docs/adr/README.md` for whether this decision is already made. If a canonical helper, pattern, or dependency exists, use it. Do not introduce an alternative because it seems cleaner in isolation.
2. Check `TODO.md`, if present at the repository root, for whether the thing you are about to build is already scoped there, with known constraints.
3. If you are about to import something that oxlint's `no-restricted-imports` blocks, that block has a message that names the replacement. Use the replacement. Do not work around the lint rule.

## Commands

```bash
bun run dev              # dev server
bun run typecheck        # tsc --noEmit
bun run lint             # oxlint        (bun run lint:fix to autofix)
bun run format:check     # oxfmt --check (bun run format to apply)
bun run test:unit        # infra-free unit suite (tests/unit/, ~10s, no docker)
bun test                 # unit + integration suites (needs the docker stack)
bun run guard:light      # lint + format:check + typecheck + copy check + unit suite — the fast pre-commit loop
bun run guard:heavy      # guard:light + integration tests + drizzle-kit check + build
```

Integration tests (`bun run test:integration`), the Playwright WCAG 2.2 AA gate (`bun run test:a11y`), and the route-boot smoke (`bun run test:smoke`) need the docker stack up: Postgres on `127.0.0.1:15433` and Redis on `127.0.0.1:16380`. The Playwright gates also run in CI (the `browser` job), so they do not run on every local push.

## Canonical choices (see the linked ADR for why)

| Concern                   | Use                                                                 | Never                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Authorization             | `requirePermission`/`requireRole` from `src/lib/rbac/`              | `withAuth`, `withRole`, `withResourceAuth`, `authorizeApi` — deleted, [0001](docs/adr/0001-one-authorization-helper.md)            |
| API errors                | RFC 9457 via `problemResponse()` (`src/lib/http.ts`)                | Ad-hoc `NextResponse.json({ error: ... })`, [0002](docs/adr/0002-rfc9457-error-contract.md)                                        |
| Rate limiting             | The Redis-backed limiter (`src/lib/rate-limit.ts`)                  | In-memory `Map`-based limiters, [0003](docs/adr/0003-single-rate-limiter.md)                                                       |
| Logging                   | The structured logger (`src/lib/logger.ts`), never bare `console.*` | `security.ts:logSecurityEvent` (file deleted), `logging.service.ts` (file deleted), [0004](docs/adr/0004-one-structured-logger.md) |
| ORM                       | Drizzle (`src/db/client.ts`, `src/db/schema/`)                      | Prisma — fully removed, [0011](docs/adr/0011-prisma-to-drizzle.md)                                                                 |
| Package manager / runtime | Bun (`bun`, `bunx`)                                                 | npm, yarn, pnpm, [0012](docs/adr/0012-bun-package-manager-and-runtime.md)                                                          |
| Lint / format             | oxlint / oxfmt                                                      | ESLint, Prettier — removed, [0013](docs/adr/0013-oxlint-oxfmt-toolchain.md)                                                        |
| Nav visibility            | Derived from the permission a route requires                        | A parallel `roles: string[]` list, [0005](docs/adr/0005-permissions-not-roles.md)                                                  |
| Components                | Server Component by default                                         | `"use client"` without a specific interactivity reason, [0006](docs/adr/0006-server-first-components.md)                           |

## Dependency versions are pinned, not ranged

Every entry in `package.json` is an exact version — no `^`, no `~`. Add a dependency at an exact, currently published version, not a range. Bump a dependency in its own, deliberate commit, not as a side effect when you add an unrelated package. A fresh `bun install` add should not touch unrelated pinned versions.

## New modules are off by default

A new domain module — anything not yet in `MODULE_FLAGS` in `config/features.ts`, where every current module (members through workspaces) is promoted — starts with its feature flag `false`. The flag stays `false` until the module has a real Drizzle schema, an authorized API, tests, and docs — all four, not some (`docs/adr/0008-module-maturity-gate.md`). You may build UI against mock data as a starting point. Do not ship that UI enabled by default.

## Files stay under 300 lines

oxlint's `max-lines` warns at 300 (skipping blanks/comments). Keep files ≤300 raw lines. Split by moving the monolith into a same-named folder with a barrel `index.ts` that re-exports the public surface; page sub-parts go in a `_components/` folder under the page.

## Commits

- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`, `ci:`, `build:`, `revert:`), enforced by commitlint.
- **No `Co-Authored-By:` trailer, ever** — enforced by a commit-msg hook, not a request.
- Separate concerns into separate commits. A dependency migration, the fallout fixes it causes, and an unrelated formatting pass are three commits, not one. See the commit history from the Drizzle migration for the pattern.
- `lefthook`'s pre-commit hook runs oxlint and oxfmt on staged files. This hook will block a commit that fails either. Do not bypass it with `--no-verify`. If a check is wrong, fix the check in a separate commit. Do not route around it.

## Testing gotchas

- Never run `bun run db:seed` or `db:reset` against the shared test database mid-task: suites that assert global superadmin counts (`tests/role-assignment.test.ts`, `tests/delete-account.test.ts`) fail on seeded admins.
- Components/services/hooks live in same-named folders with a barrel; tests are sibling concern-based files with per-file factory fixtures. Style details: `CODING_STANDARD.md`.

## When you find a bug outside your task's scope

Log the bug in `TODO.md` (if present) with a file:line reference. Do not fix it silently as part of an unrelated change. An exception applies to a one-line fix caused directly by the change you are already making. For example, if a dependency bump you performed broke a call site, fix that call site. It is your bug now. See the Drizzle migration commit's own `TODO.md` entries for the standard this sets.

## What "done" means for a claim in this repo

Check a claim in a doc, a commit message, or a code comment about what the system does or does not do. Verify it against the actual code before you write it. Do not assume the claim is true from an earlier finding.

`TODO.md` has a corrected auth-gate finding. An earlier pass claimed that no server-side auth gate existed. In fact, `src/proxy.ts` (Next.js 16's renamed `middleware.ts`) does gate `/dashboard/**` for authentication. This correction is the concrete example of this mistake. It is also the standard for how to correct a mistake plainly, not quietly.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
