# Nuvia Roadmap

This file replaces the old `to-do.md` file. The old file described a hobbyist feature list ("avatar upload", "free vs. premium tier"). It did not describe this codebase or an Association Management System. This is the real roadmap. It states what exists, what is fake, what is missing, and the build order on the way to an open-source 1.0 release.

For the reasoning behind the milestone order and the standards that this backlog answers to, see [`docs/PRINCIPLES.md`](docs/PRINCIPLES.md) and the ADRs in [`docs/adr/`](docs/adr/). For "what does a contributor actually do," see [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`CODING_STANDARD.md`](CODING_STANDARD.md).

## How to read this file

- ☑ done — already shipped. Check the item. Do not redo the work.
- ☐ open — not started.
- Each epic lists **current state** (with file paths) and **what remains**.
- Items tagged **good first issue** are scoped for an outside contributor.

---

## M1 — Safe to deploy — ☑ done

**Exit criterion (objectively checkable):**

- An anonymous request to any `/dashboard/**` route redirects to login.
- `bun audit --prod` reports no unwaived critical or high finding.
- `bun run db:seed` fails without `SEED_ADMIN_PASSWORD`.
- Every `route.ts` file under `src/app/api/` calls an authorization helper.
- CI is green.

All items below are already shipped. See each ADR or commit for detail. Do not verify each item again from the start.

### Corrected finding — the auth gate is real, but incomplete

Earlier analysis in this repository's history claimed that no server-side auth gate existed at all. That claim was wrong. `src/proxy.ts` is the replacement for Next.js 16's `middleware.ts` file. The rename happened during the 16.x cycle, and the file still runs on the Node runtime. `src/proxy.ts` redirects unauthenticated users away from `/dashboard/**` to `/auth/login`. It also gates most of `/api/**` through `src/lib/auth/middleware.ts:createAuthMiddleware`.

The earlier claim came from a search for `middleware.ts` only. That file no longer exists under the current Next.js naming convention. This was a real research gap. This document now corrects the gap so that the error is not repeated.

- ☑ **Authorize by role, not just by login.** The role check works as follows:
  - `src/lib/navigation-data.ts` holds the icon-free path and role data. `navigation-config.tsx` split this data out and now only adds icons to it.
  - `src/lib/dashboard-access.ts` builds a longest-prefix lookup from path to roles, based on that data.
  - `proxy.ts` calls `isRoleAllowedForPath` for every `/dashboard/**` request. It redirects to `/dashboard?error=forbidden` when the signed-in user's role is not on the section's allowed list. This is the same source of truth that the sidebar already used for visibility. Role enforcement now also happens on the server.
  - Three privileged pages under the `(public)` route group (`events/[id]/edit`, `.../check-in`, `events/dashboard`) get the same check through `src/lib/require-dashboard-role.ts`. The matcher in `proxy.ts` never reaches `/events/**`, so those pages need their own check.
  - Tests: `tests/dashboard-access.test.ts`.
  - This work deliberately kept the existing role vocabulary. It did not migrate to `module:action` permission strings. ADR-0005 accepts that migration, but the project has not implemented it project-wide yet, and the migration is a separate, larger change.
- ☑ **Delete the dead per-route auth wrappers.** This work deleted `withAuth`, `withRole`, `withResourceAuth`, and the `authMiddleware` object from `src/lib/auth/middleware.ts`. It confirmed zero call sites first.
- ☑ **Authorize the remaining API routes.** This check re-verified the API route inventory. Today, the only `/api/v1/**` routes are 5 admin routes, already authorized, and 11 auth self-service routes, for example login, signup, and change-password. Those 11 routes legitimately do not call `requirePermission`, because they act on the caller's own session, not on a permission-gated resource. Nothing was actually missing here. The earlier "18 of 23" figure conflated routes that do not need the check with routes that need it and lack it.

### Found along the way, not yet fixed (small, out of this pass's scope)

All four items below were fixed in the business-logic hardening pass of
2026-07-29. They stay listed here, checked off, so the history is not lost.

- ☑ `POST /api/v1/auth/verify-email` is a placeholder, in the same shape the delete-account route was before its fix. better-auth does have a real `verifyEmail` endpoint (`auth.api.verifyEmail({ query: { token } })`). This route never calls it. `src/app/api/v1/auth/verify-email/route.ts`. **Fixed:** the route now calls the real endpoint, is rate-limited, and `emailVerification.sendVerificationEmail` in `src/lib/auth.ts` actually sends the mail through the existing `EmailService`. Tests: `tests/verify-email.test.ts`.
- ☑ `GET /api/v1/auth/login-activities` is the same kind of placeholder. The `userLoginActivity` table in `src/db/schema/users.ts` already exists for exactly this purpose. The route never queries it. `src/app/api/v1/auth/login-activities/route.ts`. **Fixed:** the route now queries the table scoped to the caller, and `src/lib/auth/login-activity.ts` records successful and failed sign-in attempts from both the API route and `loginAction`. Tests: `tests/login-activity.test.ts`.
- ☑ `src/proxy.ts:isPublicEndpoint` lists `/api/v1/auth/register`, which does not exist. The real route is `/api/v1/auth/signup`. This is a dead, stale list entry. It is harmless, because the real login and session flow never needs to skip auth for the signup route. **Fixed — and it was not harmless:** the stale entry meant `signup`, `forgot-password`, and all `/api/auth/**` better-auth endpoints returned 401 to anonymous callers. The list now matches reality and `/api/auth/**` is passed through untouched. Tests: `tests/auth-route-coverage.test.ts`.
- ☑ The Finance section role list in `navigation-data.ts` (`admin`, `treasurer`, `staff`) does not include `superadmin`, though every other section does. This is a pre-existing inconsistency. The role-enforcement work reused these lists exactly as they were, so it did not change this inconsistency. A superadmin cannot reach `/dashboard/finance/**` until this list is corrected. **Fixed at the gate:** `isRoleAllowedForPath` and the sidebar now treat superadmin as allowed everywhere, matching rbac.ts semantics. The inconsistency was wider than finance — most nav entries omit superadmin — so a per-list patch would have been fragile. The lists themselves are still inconsistent and may be cleaned up as a good-first-issue, but they can no longer lock superadmin out.

### Business-logic hardening pass (2026-07-29)

A dedicated pass over the authorization and auth business logic, ahead of
open-sourcing. Everything below is shipped and test-covered. The integration
suite grew from 115 to 147 tests.

- ☑ **Role assignment enforced on every mutation path.** `changeUserRole` previously only compared the assigner's role against the target's _current_ role — an admin could promote anyone to superadmin, and `POST /api/v1/admin/users` accepted any role string. `rbac.ts` now has `canAssignRole` (hierarchy for predefined roles, permission-subset check for custom roles, superadmin-only grant of superadmin), `canGrantPermissions` (a custom role cannot carry permissions its creator lacks), and `checkRoleAssignable`, called from the single-role route, the bulk-role route, and admin user creation. The dead `validateRoleAssignment` duplicate was deleted. Tests: `tests/role-assignment.test.ts`.
- ☑ **Last-superadmin lockout guard.** Neither a role change nor account deletion can remove the last superadmin. Tests in `tests/role-assignment.test.ts` and `tests/delete-account.test.ts`.
- ☑ **Session-cache endpoints hardened.** `/api/auth/cache-session` let any signed-in user write arbitrary JSON into Redis under any session token — a session-spoofing primitive for `validateSessionWithCache`. It now only ever caches the caller's own, freshly revalidated session and ignores client-supplied user data. `invalidate-session-cache` only evicts the caller's sessions. `cache-status` is admin-only. All three speak RFC 9457.
- ☑ **`auth_logs` cascade.** Deleting a user no longer fails on the auth_logs foreign key; the logs cascade with the user.
- ☑ **Profile update whitelisted.** `PUT /api/v1/auth/profile` forwarded the raw body to better-auth; it now parses through `profileApiUpdateSchema`, so fields like `role` or `emailVerified` cannot be self-assigned. Tests: `tests/profile-update.test.ts`.
- ☑ **Username sign-in works.** The login contract always said "email or username", but the value went to better-auth's email-only `signInEmail`, so username login never worked. Both `loginAction` and the login route now resolve usernames to emails first. Tests in `tests/login-activity.test.ts`.
- ☑ **Dead code removed.** `src/lib/services/role.service.ts` (a divergent second copy of the role-mutation logic; only one type from it was live) and `src/lib/actions/session-cache.actions.ts` (zero importers, wrong cookie prefix) deleted, per ADR-0001.

Follow-ups from this pass:

- ☑ **Username uniqueness — corrected; nothing to fix.** The original claim said `users.username` is not unique in the schema, that two accounts can share a username, and that the fix was a schema constraint plus a migration decision about existing duplicates. That wording was stale: the constraint already exists and has always been enforced. `src/db/schema/users.ts:17` declares `username` with `.unique()`, and the database has enforced it since the first Drizzle migration — `drizzle/0000_cute_norman_osborn.sql:76` (`CONSTRAINT "users_username_unique" UNIQUE("username")`) — as the legacy Prisma schema did before it (`username String @unique`). Verified against the live shared test database (PostgreSQL 16): a duplicate insert is rejected with SQLSTATE 23505 on `users_username_unique`, and a scan of the live `users` table finds zero duplicate usernames. Migration decision: constraint-first, no data remediation path required. Every migration that ever created the `users` table carries the constraint, so no migrated database can contain legacy duplicate usernames and no backfill migration is needed.
- ☑ **Stale comment from the corrected claim above — fixed.** `src/lib/auth/login-activity.ts` no longer claims the username is non-unique; the comment now says the `orderBy` is a defensive tiebreaker only. The deterministic oldest-account `orderBy` itself stays: with uniqueness enforced it can never break a tie, and it is harmless.

---

## M2 — Toolchain & standards baseline — ☑ done

**Exit criterion:**

- CI is green on `bun run guard:heavy`.
- `bun test` covers the security invariants listed below.
- Each of the four major dependency upgrades landed as an isolated, revertible commit.

This exit criterion is verified end to end. `bun run guard:heavy` exits 0: lint, format, type-check, 115 of 115 tests, `drizzle-kit check`, and `bun run build` all pass. `bun audit --prod` is non-blocking, per the policy in `docs/supply-chain.md`, and its findings are triaged in `SECURITY-WAIVERS.md`. All four dependency upgrades landed, three of them already done before this pass. The fourth upgrade, `nodemailer`, is pinned, but no SMTP credentials exist in this environment, so its send path is still not functionally re-verified. This document notes that gap below, instead of assuming the send path works.

- ☑ Bun is the canonical package manager and runtime.
- ☑ Every dependency is pinned to an exact version (no `^` or `~`) and bumped to the latest stable release.
- ☑ oxlint (`bunx oxlint`) and oxfmt (`bunx oxfmt`) replace ESLint and Prettier. `lefthook.yml` runs both tools pre-commit, and runs `bun test` and the type check pre-push.
- ☑ `commitlint.config.ts` enforces Conventional Commits. The `no-ai-coauthor-trailer` hook rejects any `Co-Authored-By` trailer on any commit, from a human author or an AI author. See [ADR-0010](docs/adr/0010-ai-agent-commit-guard.md).
- ☑ **GitHub Actions CI.** `.github/workflows/ci.yml` runs a fast job (lint, format, type check) and a heavy job (test, migration check, build, audit) with real Postgres and Redis services.
  - Branch protection is still an owner decision. It is not configured here. See `docs/adr/0010`.
  - Along the way, this work also fixed another problem: the heavy job needed `REDIS_URL` set, even though the job only builds and tests. `next build` forces `NODE_ENV=production` internally, regardless of the `NODE_ENV` environment variable passed in, and `env.ts` requires `REDIS_URL` in production.
- ☑ **RFC 9457 Problem Details is now the sole API error contract.** `src/lib/http.ts` provides `problemResponse`, `validationProblem`, and `successResponse`. Every route under `/api/v1/**` migrated off `AuthResponseFactory` and off inline `NextResponse.json` error shapes.
  - `AuthResponseFactory` itself stays in the codebase. It is still used outside `/api/v1/**`, in `proxy.ts`, in `AuthUtils`, and in the OAuth server action.
  - `utils/response-utils.ts` is deleted, because it had zero importers.
  - See [ADR-0002](docs/adr/0002-rfc9457-error-contract.md) and `docs/api/conventions.md`.
- ☑ **`bun test` coverage: all ten planned tests landed.** The ten tests are:
  1. `db.query.user`'s role read matches the session.
  2. `requirePermission` denies access without a session. Test: `tests/rbac.test.ts`. This test needed one change first: `getCurrentUser`, and every function that calls it, now takes an optional `headersOverride` parameter, the same pattern `AuthUtils.getSession(request)` already used. Without that parameter, no function in `rbac.ts` was callable from bare `bun:test`, because `next/headers`'s ambient `headers()` function throws "called outside a request scope" with no live Next.js request lifecycle.
  3. `changeUserRole`'s transaction rolls back correctly. Test: `tests/change-user-role-transaction.test.ts`.
  4. `seed.ts` exits with a non-zero code without `SEED_ADMIN_PASSWORD`.
  5. `env.ts` throws on a placeholder `BETTER_AUTH_SECRET`, or on a missing `REDIS_URL` in production. Tests: `tests/seed-script.test.ts` and `tests/env.test.ts`. Both tests spawn a real subprocess, because both scripts throw or exit at module import time.
  6. The RFC 9457 error shape is correct. Test: `tests/rfc9457.test.ts`.
  7. The rate limiter returns 429 past the threshold, and survives a simulated process restart. Test: `tests/rate-limit.test.ts`.
  8. Deleting an account removes the user row. Test: `tests/delete-account.test.ts`.
  9. Each nav link resolves to a real page. Test: `tests/nav-links.test.ts`.
  10. Each auth route has an authorization call. Test: `tests/auth-route-coverage.test.ts`. This test originally allowed one named exception, `verify-email`. The hardening pass of 2026-07-29 implemented the real route and deleted the exception.

  Two more tests landed along the way, outside the original list of ten: `tests/dashboard-access.test.ts`, for the new role-authorization gate, and `tests/custom-roles.test.ts`.

- ☑ **One structured logger.** `src/lib/logger.ts` provides JSON lines, a severity ladder, PII redaction by key name, and an optional top-level `traceId`. Full W3C Trace Context propagation is still a later item, the same "once OTel lands" item that `docs/observability.md` already scoped.
  - `errors.ts:logError` and `services/logging.service.ts` are rewritten to call the new logger. `security.ts:logSecurityEvent` no longer exists. This work deleted it as dead code during the rate-limiter consolidation.
  - All 302 remaining bare `console.*` call sites across `src/` are migrated, across 105 files. `.oxlintrc.json` now enables the `no-console` rule, with `scripts/**` exempted. A CLI setup script that prints human-readable progress is not a JSON-log-aggregation candidate, matching the exception `env.ts` already has for `scripts/*.ts`.
- ☑ **Four major upgrades**, each in its own commit, each verified with `bun run guard:heavy` before the next upgrade started:
  1. `prisma`: superseded. Prisma is gone. See M1.
  2. `typescript` 5 to 7: done, as part of the Drizzle migration commit. This removed `downlevelIteration`, the only breaking change found so far.
  3. `eslint` to oxlint: done.
  4. `nodemailer` 7 to 9: pinned to 9.0.3 in the migration commit, but still not functionally re-verified, because no SMTP credentials exist in this environment. This is an accepted, documented limitation, not a blocker, because `guard:heavy` does not exercise an actual send. Smoke-test an actual send before anyone relies on it in production.
- ☑ **Supply-chain policy.** `docs/supply-chain.md` is re-verified against a fresh `bun audit --prod` run.
  - The findings drifted from the stale 2026-07-26 example. The count is now 0 critical and 19 total, against the previously recorded 3 critical and 116 total. This check reviewed every current advisory for reachability, instead of re-asserting the old finding.
  - The waiver mechanism that the document described as "not yet built" now exists, at [`SECURITY-WAIVERS.md`](SECURITY-WAIVERS.md).
  - SBOM and SLSA provenance stay out of scope for M2. `docs/supply-chain.md` itself always scoped those items to M4, where the SBOM item below still tracks them.
- ☑ **Duplicate dependencies, re-examined: two of the three "remaining" pairs were not actually duplicates.** `tsx` and `ts-node` (both removed, because Bun runs TypeScript natively), `bcrypt` and better-auth's own hashing (removed, unused), and `shadcn` and `shadcn-ui` (the deprecated `shadcn-ui` removed) were already correctly resolved. Three pairs were still flagged as open:
  - `sonner` and `react-hot-toast`: `react-hot-toast` had zero importers anywhere in `src/`. This work removed it from `package.json`. This change needed no migration, because nothing used it.
  - `resend` and `nodemailer`: **not actually a duplicate.** `src/lib/auth.ts` has its own inline `EmailService` class. That class deliberately picks `resend`, `nodemailer`, or neither, based on which environment variables are configured, `RESEND_API_KEY` versus `EMAIL_HOST` and related variables. This is a legitimate multi-provider design, not two competing implementations. The actual duplication was `src/lib/services/email.service.ts`, a third, fully unrelated `EmailService` class with a static `import nodemailer` statement and zero importers anywhere. This work deleted that file as dead code. This work needed no ADR, because no real "pick a winner" decision remained, once the dead file was gone.
  - `animejs` and `tw-animate-css`: **not a duplicate either.** `animejs` is a JavaScript animation engine, with imperative `.animate()` calls across 6 files. `tw-animate-css` is a CSS-only Tailwind plugin that provides `animate-*` utility classes, imported once in `globals.css` and used through className strings. The two packages do different jobs, so both stay.
- ☑ **Pre-existing type errors: all 25, across the 8 files originally cataloged, are fixed.** The fixes cover:
  - The `job-form` import path.
  - `Announcement` and `AnnouncementStatistics` type drift. The runtime data already carried these fields, but the type declarations had not caught up to the data.
  - The zodResolver and `useForm<T>()` generic mismatches. This fix needed the 3-generic `useForm<Input, Context, Output>` form and a split between `z.input` and `z.output`. In two cases, this fix also aligned a schema's `.optional()` to `.default([])`, to match what the hand-written target type already declared as required.
  - The `DateRange` optional-versus-required mismatch.

  Two more build-blocking bugs turned up during this work. `tsc --noEmit` itself caught neither bug. The first is a Bun-versus-Node runtime mismatch in `next build`'s page-data-collection workers. See the Drizzle-driver item in M1. The second is a missing Suspense boundary around `useSearchParams()` on the login page.

---

## M3 — AMS core is real — ☑ done

**Exit criterion:** an association can take a member from signup, to paid dues, to event registration, without touching mock data.

**Status (2026-08-08, backlog scopes A1–C5, F2):** every item below is shipped. The member→dues→event-registration path runs end to end on the database: signup creates a real user row, finance invoices and records payments through a gateway adapter (manual + Stripe), and event registrations live in `event_registrations`. Zero mock data files remain (backlog F2 swept the residue).

- ☑ **The `Organization` singleton lands, and the app actually uses it.** Wired in backlog A2: settings pages and email templates read the singleton (`id "default"`), and hardcoded association name/branding strings now come from the row. Commit: `dc534a3`.
- ☑ **Members and events wired to real data.** Done in backlog B1–B6: members (B1), events read path (B2) and write/registration lifecycle (B3), content (B4), forums (B5), and jobs (B6) all serve from Drizzle tables through authorized `/api/v1` routes.
- ☑ **Dues and finance: real schema, real lifecycle.** Done in backlog C1–C5. The provider decision landed first as [ADR-0015](docs/adr/0015-payment-gateway-adapter-stripe-first.md) (adapter seam, Stripe first, manual fallback). `membership_tiers`, `subscriptions`, `invoices`, and `payments` tables exist (migrations 0004+); invoice creation, payment recording, and a signature-verified Stripe webhook are tested; the finance dashboard renders from the real services; the module is promoted.
- ☑ **Module promotion gate — built and applied to all six flagged modules.** Backlog A1 added `config/features.ts` (maturity flags + `MOCK_TIER`) per [ADR-0008](docs/adr/0008-module-maturity-gate.md). Every flagged-off module then cleared the bar — real Drizzle schema, authorized API, tests, documentation, plus WCAG evidence — and was promoted in the value order: finance (C5), chapters (D1), committees (D2), learning/CPD (D3), awards (D4), workspaces (D5). All eleven modules are now Promoted; `MOCK_TIER` is empty. See the module-maturity section of `docs/architecture/overview.md`.

- ☑ **`src/lib/services/media.service.ts`** — wired. Backlog B4 replaced the 1,184-line write-nothing file with a real service that stores uploads on local disk under `storage/uploads/` with a JSON manifest (S3 stays a future adapter, no SDK added).

---

## M4 — OSS launch — ☑ done

**Exit criterion:**

- `docs/`, the governance files, and CI all exist and are accurate.
- WCAG 2.2 AA passes on every enabled module.
- The controls mapping in `docs/security/controls.md` states honestly what is CI-verified and what is process-only.

- ☑ `docs/adr/` holds a decision record for every contested choice. See the index.
- ☑ **WCAG 2.2 AA.** Done 2026-08-08 (backlog E1): oxlint's `jsx-a11y` rule set enabled at error level (30 rules in `.oxlintrc.json`), an `@axe-core/playwright` smoke gate wired as `bun run test:a11y` (`scripts/a11y-smoke.ts`, fails on critical/serious) covering one authenticated page per enabled module plus the public `/events` and `/jobs` pages, and a manual pass recorded in [`docs/accessibility/wcag-2.2-aa-enabled-modules.md`](docs/accessibility/wcag-2.2-aa-enabled-modules.md). Feature-flagging the rest of the modules shrinks the surface that must conform for version 1.0.
- ☑ SLSA build provenance, through cosign keyless signing via GitHub Actions OIDC. Backlog E2, commit `69a838c`.
- ☑ An OWASP ASVS and NIST SSDF controls mapping in [`docs/security/controls.md`](docs/security/controls.md). Backlog E3, commit `c45e5e5`; this reconciliation pass corrected the stale V12 sentence (media now writes files, see B4).
- ☑ ISO/IEC 27001 Annex A, **A.8 only**. Backlog E4, commit `94f6688`, states the A.5–A.7 limit explicitly instead of overclaiming.
- ☑ CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, CHANGELOG.md, PR template, CODEOWNERS. All present; PR template and CODEOWNERS landed in backlog E5 (`c7f6946`).

---

## Post-1.0 — module promotion queue

This queue follows the value order established in M3: finance/dues, then chapters, then committees, then learning/CPD, then awards, then workspaces. Each promotion is its own milestone, with the same bar: schema, authorized API, tests, documentation, and the flag switched on.

---

## Module flags — maturity gate built, all modules enabled

The feature flag described above as "not built yet" now exists: [`config/features.ts`](config/features.ts) (backlog A1, [ADR-0008](docs/adr/0008-module-maturity-gate.md)). It carries a per-module maturity flag, human-readable labels, and `getEnabledModules`/`getDisabledModules` helpers that the nav, middleware, and docs registry all consume.

As of the 2026-08-08 backlog completion, all eleven modules — members, events, content, forums, jobs, finance, awards, learning, chapters, committees, workspaces — are Promoted: real schema, authorized API, tests, documentation, and WCAG evidence each. `MOCK_TIER` is empty and every flag defaults to `true`, so a fresh install exposes the full suite. A deployer who wants a smaller surface switches flags off in `config/features.ts`; the role gate in `src/proxy.ts` → `dashboard-access.ts` still applies on top of the maturity flag, exactly as before.

---

## Good first issues

- Remove any dead nav links, or point them at real pages, in `navigation-config.tsx`. Verify the current count first: `tests/nav-links.test.ts` only checks that leaf paths resolve to a real page, so a stale count here could be off if a parent-only nav item is involved.
- ~~Clean up the role lists in `navigation-data.ts`: most of them omit `superadmin`…~~ **Done (backlog F3, commit `3998b75`)**: the nav role lists now include superadmin, matching the gate and sidebar special case.
- Fix the singular-versus-plural mismatch in the Awards nav item.
- ~~Pick and migrate off one duplicate dependency, once its ADR lands.~~ **Stale as of the M2 "Duplicate dependencies, re-examined" finding above**: all three flagged pairs (toast library, mail transport, animation library) are already resolved, and none needed an ADR. No open duplicate-dependency item remains here.
- Add the `weeks` react-day-picker `classNames` key to `src/components/ui/calendar.tsx`, for visual parity with version 10's new grid-based rendering. The calendar is functional already. This is a polish pass.
- ~~Write a Playwright and axe smoke test for one of the 5 enabled modules.~~ **Done (backlog E1, commit `1c8b530`)**: `bun run test:a11y` runs an `@axe-core/playwright` smoke over one authenticated page per enabled module plus the public `/events` and `/jobs` pages.
- Donations filters: "Clear All" clears `filters.dateRange` upstream, but the date-range popover label keeps showing the stale selection, because the local `dateRange` state in `src/components/finance/donations-filters/date-range-filter.tsx:13` initializes from props once and never resyncs. Pre-existing behavior, preserved during the file split of `donations-filters.tsx`.
- Workspaces table: each row renders 11 body cells — the last one before Actions is a member avatar stack — but the header row has only 10 columns, so the avatar column has no heading. Pre-existing mismatch, preserved during the file split of `workspaces-table.tsx` into `src/components/workspaces/workspaces-table/`. See `workspaces-table.tsx:34` (header row) and `workspace-row.tsx:110` (avatar cell).
