# Nuvia Roadmap

Replaces the old `to-do.md`, which described a hobbyist feature list ("avatar
upload", "free vs. premium tier") rather than this codebase or an Association
Management System. This is the real one: what exists, what's fake, what's
missing, and in what order it gets built on the way to an open-source 1.0.

For the reasoning behind the milestone order and the standards this backlog
answers to, see [`docs/PRINCIPLES.md`](docs/PRINCIPLES.md) and the ADRs in
[`docs/adr/`](docs/adr/). For "what does a contributor actually do," see
[`CONTRIBUTING.md`](CONTRIBUTING.md) and [`CODING_STANDARD.md`](CODING_STANDARD.md).

## How to read this file

- ☑ done — already shipped, verify rather than re-do
- ☐ open — not started
- Each epic lists **current state** (with file paths) and **what's left**
- Items tagged **good first issue** are scoped for an outside contributor

---

## M1 — Safe to deploy — ☑ done

**Exit criterion (objectively checkable):** an anonymous request to any
`/dashboard/**` route redirects to login; `bun audit --prod` has no unwaived
critical/high; `bun run db:seed` fails without `SEED_ADMIN_PASSWORD`; every
`route.ts` under `src/app/api/` calls an authorization helper; CI is green.
All items below are shipped; see each ADR/commit for detail rather than
re-verifying from scratch.

### Corrected finding — the auth gate is real, but incomplete

Earlier analysis in this repo's history claimed there was no server-side auth
gate at all. That was wrong: **`src/proxy.ts` is Next.js 16's `middleware.ts`
replacement** (renamed in the 16.x cycle, runs on the Node runtime) and it
does redirect unauthenticated users away from `/dashboard/**` to
`/auth/login`, and gates most of `/api/**` through
`src/lib/auth/middleware.ts:createAuthMiddleware`. The earlier claim came
from searching only for `middleware.ts`, which no longer exists under this
Next.js convention — a real research gap, now corrected here so it isn't
repeated.

- ☑ **Authorize by role, not just by login.** `src/lib/navigation-data.ts`
  holds the icon-free path/roles data (split out of
  `navigation-config.tsx`, which now just composes icons onto it) and
  `src/lib/dashboard-access.ts` builds a longest-prefix path -> roles lookup
  from it. `proxy.ts` calls `isRoleAllowedForPath` for every
  `/dashboard/**` request and redirects to `/dashboard?error=forbidden`
  when the signed-in user's role isn't on the section's allowed list — the
  same source of truth the sidebar already used for visibility, now
  actually enforced server-side. Three privileged pages under the
  `(public)` route group (`events/[id]/edit`, `.../check-in`,
  `events/dashboard`) get the same check via
  `src/lib/require-dashboard-role.ts`, since `proxy.ts`'s matcher never
  reaches `/events/**`. Tests: `tests/dashboard-access.test.ts`.
  Deliberately kept the existing role vocabulary rather than migrating to
  `module:action` permission strings — ADR-0005 is accepted but
  project-wide not-yet-implemented, and that's a separate, larger change.
- ☑ **Delete the dead per-route auth wrappers.** `withAuth`, `withRole`,
  `withResourceAuth`, and the `authMiddleware` object deleted from
  `src/lib/auth/middleware.ts` — confirmed zero call sites first.
- ☑ **Authorize the remaining API routes.** Re-verified: the only
  `/api/v1/**` routes that exist today are the 5 admin ones (already
  authorized) and 11 auth self-service ones (login, signup,
  change-password, etc.) — those legitimately don't call
  `requirePermission` since they act on the caller's own session, not a
  permission-gated resource. There was nothing actually missing here; the
  "18 of 23" figure conflated routes-that-don't-need-it with
  routes-that-need-it-and-lack-it.

### P0 — done

- ☑ **Drizzle migration.** Prisma fully replaced; see
  [ADR-0011](docs/adr/0011-prisma-to-drizzle.md).
- ☑ **`src/lib/env.ts`** — zod-validated environment config, loaded at
  import time. `DATABASE_URL` no longer falls back to a nonexistent SQLite
  file; boot fails loudly on a missing/placeholder `BETTER_AUTH_SECRET`
  instead of at request time; `REDIS_URL` is required in production.
- ☑ **`scripts/seed.ts` requires `SEED_ADMIN_PASSWORD`.** The previous
  script hardcoded `Admin123!@#` into five privileged accounts (including
  superadmin) and committed it to git; `db:seed` was a documented setup
  step. It now refuses to run without an explicit, validated password.
- ☑ **`sameSite` fixed.** `src/lib/auth.ts` set session cookies to
  `isProduction ? "none" : "lax"` — `SameSite=None` in production disabled
  the browser's CSRF defense on a first-party app. Now always `"lax"`.
- ☑ **rbac.ts role-change transaction.** `changeUserRole` used to update the
  role and write the audit-log entry as two separate statements; a failure
  between them could silently drop the audit trail. Now one `db.transaction`.
- ☑ **`.gitignore`'s blanket `.*` removed** — it previously ignored every
  dotfile, blocking `.editorconfig`, `.nvmrc`, and most CI/tooling config
  from ever being committed.
- ☑ **Drizzle driver switched from `bun-sql` to `postgres-js`.** Discovered
  while fixing the type errors below: `drizzle-orm/bun-sql` unconditionally
  imports the `bun` built-in module, but `next build`'s page-data-collection
  step spawns plain Node.js child processes (via jest-worker) regardless of
  which runtime launched the parent build — confirmed with both Turbopack
  and webpack. Every route transitively importing `src/db/client.ts` (most
  of the app) failed `bun run build` outright as a result; this was never
  caught before because earlier, unrelated build errors always aborted the
  build before reaching this point. `postgres.js` runs identically under
  Bun and Node; `src/db/client.ts` is the only file that changed.
- ☑ **`DELETE /api/v1/auth/delete-account` now actually deletes.** Enables
  better-auth's own `deleteUser` (`user.deleteUser.enabled` in
  `src/lib/auth.ts`) instead of hand-rolling it — hard-deletes the user row
  (cascades to sessions/accounts/etc.), revokes every session, requires a
  password or fresh session. Test: `tests/delete-account.test.ts` asserts
  the row is gone and a second login fails. **New risk flagged inline in
  auth.ts**: `content.authorId`/`events.createdBy`/`forum.userId`/
  `jobs.postedBy`+`userId` reference `user.id` as `NOT NULL` with no
  cascade — a hard delete will throw a foreign-key violation for any user
  who has authored one of those once M3 wires them to real data instead of
  mocks. Revisit then (anonymize instead of delete, or reassign
  authorship).
- ☑ **`/api/v1/auth/login` and friends now rate-limited.** One Redis-backed
  sliding-window limiter (`src/lib/rate-limit.ts`, ADR-0003), applied
  directly to login/signup/forgot-password/reset-password/change-password.
  Test: `tests/rate-limit.test.ts` (429 past threshold, survives a
  simulated process restart via a fresh Redis connection).
- ☑ **One rate limiter, Redis-backed.** The three in-house implementations
  (`auth/rate-limiting.ts`'s in-memory Map, `security.ts:rateLimiters`,
  `utils/rate-limiter.ts`) are deleted — `security.ts` had zero importers
  for _any_ of its exports (not just rate limiting) and was deleted
  entirely. `proxy.ts`'s generic `/api/**` backstop now runs on the same
  Redis limiter too.
- ☑ **Two unguarded debug endpoints** now 404 in production
  (`NODE_ENV !== "production"` gate).
- ☑ **`next.config.ts` security headers/CSP added**, `turbopack.root` fixed
  to `__dirname`. Also found and fixed along the way: TypeScript 7 (bumped
  in the Drizzle migration) doesn't expose the compiler API `next build`'s
  own type-check step expects from TS <7 — `bun run build` failed outright
  without `experimental.useTypeScriptCli: true`.
- ☑ **Admin user-creation route hashes passwords** via better-auth's own
  `hashPassword` (`better-auth/crypto`) instead of writing the raw request
  password into `passwordHash`.
- ☑ **`custom_roles` wired up.** `rbac.ts`'s `getCurrentUser`,
  `getUserPermissions`, and `getAllRoles` all had the same placeholder
  (any non-predefined `user.role` resolved to `permissions = []`) — all
  three now query `custom_roles` by name. `POST /api/v1/admin/roles`
  inserts for real instead of fabricating an in-memory object, validates
  permission strings against `AVAILABLE_PERMISSIONS`, and 409s on a
  duplicate name. `user_role_assignments`/`role_change_history` remain
  unused — they back a separate, still-unbuilt multi-role-per-user
  feature, not what this UI/flow uses. Test: `tests/custom-roles.test.ts`.
- ☑ **Dead nav links — smaller than advertised.** Of the originally-counted
  16, 12 were parent items with `subItems`: per `navigation-item.tsx`, a
  parent with sub-items renders as a `CollapsibleTrigger` (expand/collapse
  only) — its `path` is used only for `isActive()` auto-expand matching,
  never rendered as a real `<Link>`. Those were never clickable dead links.
  The 4 real ones (leaf-level, singular/differently-named on disk) are
  fixed by directory rename: `dashboard/award/*` -> `dashboard/awards/*`,
  `memberships/renewal` -> `renewals`, `settings/gateway` -> `settings/payments`.
- ☑ **Privileged pages in the `(public)` route group gated**, not
  relocated (see the role-authorization item above) —
  `src/lib/require-dashboard-role.ts`, since `proxy.ts`'s matcher doesn't
  cover `/events/**`. Verified with a real `bun run build` + `bun run
start` + curl (can't be unit-tested — `next/headers`'s `headers()`
  needs a live request scope bare `bun:test` doesn't provide).

### Found along the way, not yet fixed (small, out of this pass's scope)

- ☐ `POST /api/v1/auth/verify-email` is a placeholder identical in shape to
  the delete-account one was: better-auth _does_ have a real `verifyEmail`
  endpoint (`auth.api.verifyEmail({ query: { token } })`); this route just
  never calls it. `src/app/api/v1/auth/verify-email/route.ts`.
- ☐ `GET /api/v1/auth/login-activities` is the same shape of placeholder —
  `src/db/schema/users.ts`'s `userLoginActivity` table already exists for
  exactly this, the route just never queries it.
  `src/app/api/v1/auth/login-activities/route.ts`.
- ☐ `src/proxy.ts:isPublicEndpoint` lists `/api/v1/auth/register`, which
  doesn't exist — the real route is `/api/v1/auth/signup`. Dead list entry,
  harmless (signup was never actually reached through this path since the
  real login/session flow doesn't need to skip auth for it), but stale.
- ☐ `navigation-data.ts`'s Finance section role list (`admin`, `treasurer`,
  `staff`) doesn't include `superadmin` — every other section does.
  Pre-existing inconsistency (unchanged by the role-enforcement work,
  which reuses these lists verbatim); a superadmin literally cannot reach
  `/dashboard/finance/**` until this is corrected.

---

## M2 — Toolchain & standards baseline

**Exit criterion:** CI is green on `bun run guard:heavy`; `bun test` covers
the security invariants below; the four major dependency upgrades have each
landed as an isolated, revertible commit.

- ☑ Bun is the canonical package manager and runtime.
- ☑ Every dependency pinned to an exact version (no `^`/`~`), bumped to
  latest stable.
- ☑ oxlint (`bunx oxlint`) and oxfmt (`bunx oxfmt`) replace ESLint/Prettier;
  `lefthook.yml` runs both pre-commit, plus `bun test`/`typecheck` pre-push.
- ☑ `commitlint.config.ts` enforces Conventional Commits; the `no-ai-coauthor-trailer`
  hook rejects any `Co-Authored-By` trailer on any commit, human or AI. See
  [ADR-0010](docs/adr/0010-ai-agent-commit-guard.md).
- ☑ **GitHub Actions CI.** `.github/workflows/ci.yml` runs a fast job
  (lint/format/typecheck) and a heavy job (test/migration-check/build/audit)
  with real Postgres + Redis services. Branch protection is still an owner
  decision, not configured here (see `docs/adr/0010`). Also fixed along the
  way: the heavy job needed `REDIS_URL` set even though it only builds and
  tests, since `next build` forces `NODE_ENV=production` internally
  regardless of the `NODE_ENV` env var passed in, and `env.ts` requires
  `REDIS_URL` in production.
- ☑ **RFC 9457 Problem Details as the sole API error contract.**
  `src/lib/http.ts` (`problemResponse`, `validationProblem`,
  `successResponse`); every route under `/api/v1/**` migrated off
  `AuthResponseFactory`/inline `NextResponse.json` error shapes.
  `AuthResponseFactory` itself stays (still used outside `/api/v1/**`:
  `proxy.ts`, `AuthUtils`, the OAuth server action). `utils/response-utils.ts`
  deleted (zero importers). See [ADR-0002](docs/adr/0002-rfc9457-error-contract.md)
  and `docs/api/conventions.md`.
- ☑ **`bun test` coverage — all ten landed.** (1) `db.query.user` role read
  matches the session, (2) `requirePermission` denies without a session —
  `tests/rbac.test.ts`, after giving `getCurrentUser` (and everything that
  calls it) an optional `headersOverride` param, same pattern
  `AuthUtils.getSession(request)` already had — without it, none of
  `rbac.ts`'s functions were callable from bare `bun:test`, since
  `next/headers`'s ambient `headers()` throws "called outside a request
  scope" with no live Next request lifecycle. (3) `changeUserRole`'s
  transaction rollback — `tests/change-user-role-transaction.test.ts`. (4)
  `seed.ts` exits non-zero without `SEED_ADMIN_PASSWORD`, (5) `env.ts`
  throws on a placeholder `BETTER_AUTH_SECRET`/missing `REDIS_URL` in
  production — `tests/seed-script.test.ts`, `tests/env.test.ts`, both
  spawned as real subprocesses since both scripts throw/exit at module
  import time. (6) RFC 9457 error shape — `tests/rfc9457.test.ts`. (7) rate
  limiter 429 + survives a simulated process restart —
  `tests/rate-limit.test.ts`. (8) delete-account removes the row —
  `tests/delete-account.test.ts`. (9) nav-link-resolves-to-page —
  `tests/nav-links.test.ts`. (10) auth-route-has-authorization-call —
  `tests/auth-route-coverage.test.ts`, with one named exception
  (verify-email, see the placeholder note above) rather than a silent gap.
  Two more added along the way, not on the original list:
  `tests/dashboard-access.test.ts` (the new role-authorization gate) and
  `tests/custom-roles.test.ts`.
- ☑ **One structured logger.** `src/lib/logger.ts` — JSON lines, severity
  ladder, PII redaction by key name, optional top-level `traceId` (full
  W3C Trace Context propagation is still the "later, once OTel lands"
  item `docs/observability.md` already scoped it as). `errors.ts:logError`
  and `services/logging.service.ts` rewritten to call it
  (`security.ts:logSecurityEvent` no longer exists — deleted as dead code
  during the rate-limiter consolidation). All 302 remaining bare
  `console.*` call sites across `src/` migrated (105 files); `no-console`
  enabled via `.oxlintrc.json`, with `scripts/**` exempted (a CLI setup
  script printing human-readable progress isn't a JSON-log-aggregation
  candidate, matching `env.ts`'s existing `scripts/*.ts` exception).
- ☐ **Four major upgrades**, each its own commit, each verified with
  `bun run guard:heavy` before the next starts:
  1. `prisma` — **superseded**, Prisma is gone (see M1).
  2. `typescript` 5→7 — ☑ done as part of the Drizzle migration commit
     (`downlevelIteration` removed, the only breaking change hit so far).
  3. `eslint` → oxlint — ☑ done.
  4. `nodemailer` 7→9 — ☑ pinned to 9.0.3 in the migration commit; **not
     functionally re-verified** (no SMTP credentials in this environment).
     Smoke-test an actual send before relying on it.
- ☐ **Supply-chain policy** written up in
  [`docs/supply-chain.md`](docs/supply-chain.md): triage by severity ×
  reachability (not severity alone — `bun audit --prod` found 3 "critical"
  advisories on 2026-07-26, and reachability analysis showed none were
  actually exploitable in this configuration), SBOM (CycloneDX), SLSA
  provenance, a documented waiver-with-expiry mechanism, Renovate with a
  cooldown window.
- ☑ **Duplicate dependencies — re-examined, two of the three "remaining"
  pairs weren't actually duplicates.** `tsx`+`ts-node` (both removed — Bun
  runs TS natively), `bcrypt`+better-auth's own hashing (removed, unused),
  and `shadcn`+`shadcn-ui` (deprecated `shadcn-ui` removed) were correctly
  resolved already. Of the three flagged as still open:
  - `sonner`+`react-hot-toast`: `react-hot-toast` had zero importers
    anywhere in `src/` — removed from `package.json`, no migration needed
    since nothing used it.
  - `resend`+`nodemailer`: **not actually a duplicate.**
    `src/lib/auth.ts` has its own inline `EmailService` class that
    deliberately picks `resend` OR `nodemailer` OR neither based on which
    env vars are configured (`RESEND_API_KEY` vs `EMAIL_HOST`+friends) —
    a legitimate multi-provider design, not two competing
    implementations. The actual duplication was
    `src/lib/services/email.service.ts`, a _third_, fully unrelated
    `EmailService` class (static `import nodemailer`) with zero importers
    anywhere — deleted as dead code. No ADR was needed since there was no
    real "pick a winner" decision once the dead file was out of the
    picture.
  - `animejs`+`tw-animate-css`: **not a duplicate either.** `animejs` is
    a JS animation engine (imperative `.animate()` calls, 6 files);
    `tw-animate-css` is a CSS-only Tailwind plugin providing `animate-*`
    utility classes (`@import`ed once in `globals.css`, used via
    className strings). Different jobs; both stay.
- ☑ **Pre-existing type errors** (all 25, across the 8 files originally
  cataloged) fixed: the `job-form` import path, `Announcement`/
  `AnnouncementStatistics` type drift (fields the runtime data already
  carried but the type declarations hadn't caught up to), the
  zodResolver/`useForm<T>()` generic mismatches (needed the 3-generic
  `useForm<Input, Context, Output>` form, `z.input`/`z.output` split, and
  in two cases aligning a schema's `.optional()` to `.default([])` to match
  what the hand-written target type already declared required), and the
  `DateRange` optional-vs-required mismatch. Two more build-blocking bugs
  turned up in the process, neither caught by `tsc --noEmit` itself: a
  `bun`-vs-Node runtime mismatch in `next build`'s page-data-collection
  workers (see the Drizzle-driver item in M1) and a missing Suspense
  boundary around `useSearchParams()` on the login page.

---

## M3 — AMS core is real

**Exit criterion:** an association can take a member from signup → paid dues
→ event registration without touching mock data.

- ☐ **`Organization` singleton lands and is actually used.** The Drizzle
  schema has it (`src/db/schema/organization.ts`, id `"default"`) but
  nothing reads or writes it yet — association name, branding, locale,
  currency all still live in hardcoded strings. Wire it into settings pages
  and email templates first; it's a dependency for the "easy to customize"
  principle.
- ☐ **Members + events wired to real data.** 0 of 104 `page.tsx` files
  import Prisma/Drizzle today. Members and Events already have Drizzle
  tables (`src/db/schema/users.ts`, `events.ts`) — the work is API routes,
  server actions, and swapping the mock-data imports in the UI.
- ☐ **Dues/finance — highest product value, currently 100% mock, zero
  schema.** No `MembershipTier`/dues/invoice/gateway model exists in the
  Drizzle schema at all (the whole `finance` UI in `src/app/dashboard/finance/`
  and `src/lib/data/mock-*.ts` renders from hardcoded arrays). For an AMS,
  dues billing is the product — this is the first module to promote out of
  "flagged off." No payment SDK is installed; that's a separate, deliberate
  decision (Stripe vs. Midtrans vs. others) needing its own ADR before
  building against it.
- ☐ **Module promotion gate.** Before any flagged-off module (finance,
  awards, learning, chapters, committees, workspaces) ships enabled by
  default, it must have: a real Drizzle schema, an authorized API, tests,
  and docs. See `docs/architecture/overview.md`'s module-maturity section
  and [ADR-0008](docs/adr/0008-module-maturity-gate.md). Promotion order,
  by value to an association: **finance/dues → chapters → committees →
  learning/CPD → awards → workspaces.**
- ☐ **`src/lib/services/media.service.ts`** is 1,184 lines that never write
  a file (`storagePath: ''`) and is imported by nothing. Either wire it to
  a real storage backend (no SDK installed — S3, Cloudinary, or local disk
  need a decision) or delete it; it is not "50% done," it is unstarted with
  extra steps.

---

## M4 — OSS launch

**Exit criterion:** `docs/`, governance files, and CI all exist and are
accurate; WCAG 2.2 AA passes on every _enabled_ module; the controls mapping
in `docs/security/controls.md` is honest about what's CI-verified vs.
process-only.

- ☑ `docs/adr/` — decision records for every contested choice (see index).
- ☐ WCAG 2.2 AA: `eslint-plugin-jsx-a11y` equivalent via oxlint's `jsx-a11y`
  rule set, `@axe-core/playwright` in E2E, manual pass on the 5 enabled
  modules only (feature-flagging the rest shrinks the surface that must
  conform for 1.0).
- ☐ SLSA build provenance (cosign keyless signing via GitHub Actions OIDC).
- ☐ OWASP ASVS + NIST SSDF controls mapping in
  [`docs/security/controls.md`](docs/security/controls.md).
- ☐ ISO/IEC 27001 Annex A — **A.8 only**. A.5–A.7 are organizational
  controls (screening, physical facilities, policy) that a repository
  cannot satisfy on its own, and certification needs an external auditor.
  Say so explicitly rather than overclaiming.
- ☐ CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, CHANGELOG.md, PR
  template, CODEOWNERS.

---

## Post-1.0 — module promotion queue

In the value order established in M3: finance/dues, chapters, committees,
learning/CPD, awards, workspaces. Each promotion is its own milestone with
the same bar: schema, authorized API, tests, docs, flag flipped on.

---

## Cut from the default install (owner decision)

Finance, awards, learning, chapters, committees, and workspaces are
**feature-flagged off by default** — a fresh install exposes only the 5
database-backed modules (members, events, content, forums, jobs). See
[ADR-0007](docs/adr/0007-single-association-tenant-seam.md) and
[ADR-0008](docs/adr/0008-module-maturity-gate.md). This is not deletion —
the UI work is preserved and each module ships the moment it clears the
promotion gate above.

---

## Good first issues

- Remove the 16 dead nav links (or point them at real pages) in
  `navigation-config.tsx`.
- Fix the Awards singular/plural nav mismatch.
- Pick and migrate off one duplicate dependency once its ADR lands
  (toast library, mail transport).
- Add the `weeks` react-day-picker classNames key to
  `src/components/ui/calendar.tsx` for visual parity with v10's new
  grid-based rendering (functional already; this is a polish pass).
- Write a Playwright/axe smoke test for one of the 5 enabled modules.
