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

## M1 — Safe to deploy

**Exit criterion (objectively checkable):** an anonymous request to any
`/dashboard/**` route redirects to login; `bun audit --prod` has no unwaived
critical/high; `bun run db:seed` fails without `SEED_ADMIN_PASSWORD`; every
`route.ts` under `src/app/api/` calls an authorization helper; CI is green.

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

What the gate **doesn't** do:

- ☐ **[P0] Authorize by role, not just by login.** `proxy.ts` only checks
  "is there a valid session" — it has no per-route role/permission check. Any
  authenticated account, including a plain `member`, can navigate directly to
  `/dashboard/users/roles` or `/dashboard/tools/database`; only the sidebar
  nav hides the link, and only client-side (`navigation-config.tsx`'s
  `roles?: UserRole[]` — a different vocabulary from the server's
  `module:action` permissions in `rbac.ts`, per
  [ADR-0005](docs/adr/0005-permissions-not-roles.md)). Add a
  `requirePermission`/`requireRole` check at the layout level per route
  group (see the `(public)`/`(authenticated)`/`(admin)` taxonomy in
  [`docs/architecture/overview.md`](docs/architecture/overview.md)).
- ☐ **Delete the dead per-route auth wrappers.** `withAuth`, `withRole`,
  `withResourceAuth`, and the `authMiddleware` object in
  `src/lib/auth/middleware.ts` have zero call sites anywhere in `src/`
  (verified: only `createAuthMiddleware`/`authenticate`/`authorize`, used by
  `proxy.ts`, are actually live). Keeping unused wrappers next to the real
  ones is exactly the kind of drift this backlog exists to close.
- ☐ **Authorize the remaining API routes.** Only 5 of 23 routes under
  `src/app/api/v1/` call `requirePermission` directly. `proxy.ts` covers
  authentication for most of `/api/**`, but per-route authorization
  (does _this_ user have _this_ permission) is still route-by-route and
  mostly missing.

### P0 — done this session

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

### P0 — still open

- ☐ **`DELETE /api/v1/auth/delete-account` doesn't delete anything.**
  `src/app/api/v1/auth/delete-account/route.ts:29-44` is a self-admitted
  placeholder: it authenticates the caller, does nothing, and returns
  `"Account deleted successfully"`. For a system holding member PII this is
  a GDPR/CCPA liability, not just an unfinished feature. Needs a real
  implementation (hard delete or documented anonymization) plus a test that
  asserts the row is actually gone and a second login fails.
- ☐ **`/api/v1/auth/login` has no rate limiting.** It calls
  `auth.api.signInEmail()` server-side, bypassing better-auth's own HTTP
  rate limiter, and adds none of its own. `forgot-password`,
  `reset-password`, and `change-password` are also unprotected. Only
  `signup` is limited.
- ☐ **One rate limiter, Redis-backed.** There are four implementations today
  (`src/lib/auth/rate-limiting.ts`, `src/lib/security.ts:rateLimiters`,
  `src/lib/utils/rate-limiter.ts`, better-auth's own `rateLimit` config).
  The one actually used is an in-memory `Map` — non-functional across more
  than one server process. See
  [ADR-0003](docs/adr/0003-single-rate-limiter.md).
- ☐ **Two unguarded debug endpoints.** `src/app/api/debug/route.ts` and
  `src/app/api/debug/oauth/route.ts`. The latter only leaks booleans about
  which OAuth providers are configured (low severity), but both should be
  gated behind `NODE_ENV !== 'production'` or removed.
- ☐ **`next.config.ts` has no security headers/CSP**, and
  `turbopack.root: path.join(__dirname, '..')` points at the repo's
  **parent** directory — almost certainly a copy-paste artifact, not
  intentional.
- ☐ **The admin user-creation route stores plaintext passwords.**
  `src/app/api/v1/admin/users/route.ts` POST writes the given password
  directly into `passwordHash`, unhashed (flagged inline in code as of the
  Drizzle migration commit; pre-existing, not introduced by it). This route
  also entirely bypasses better-auth, so accounts it creates cannot log in
  via the normal flow.
- ☐ **Three dead tables with a UI on top of them.** `custom_roles`,
  `user_role_assignments`, `role_change_history` exist in the schema and are
  never read by any code (`rbac.ts:81-91` has the `customRole` lookup
  commented out with a `TODO`). Meanwhile `/dashboard/users/roles` and
  `/api/v1/admin/roles` present a full custom-role management UI over a path
  that always resolves to `permissions = []`. Either wire it up or remove
  the UI — half of both is worse than either.
- ☐ **16 dead nav links** in `src/components/dashboard/layout/navigation-config.tsx`
  resolve to no `page.tsx`, including a singular/plural mismatch that makes
  the entire Awards module unreachable (nav: `/dashboard/awards/*`,
  directory: `src/app/dashboard/award/*`). **Good first issue.**
- ☐ **Privileged pages live inside the `(public)` route group.**
  `src/app/(public)/events/[id]/edit/page.tsx`,
  `.../check-in/page.tsx`, `.../events/dashboard/page.tsx`. Combined with
  the role-authorization gap above, event editing and attendee check-in are
  reachable by any logged-in account. Fix as part of adopting the
  `(public)`/`(authenticated)`/`(admin)` route-group taxonomy.

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
- ☐ **GitHub Actions CI.** `.gitignore` no longer blocks `.github/`; add
  `.github/workflows/ci.yml` running `bun run guard:heavy` on every PR, plus
  branch protection (owner decision, not something an agent should configure
  unilaterally — see `docs/adr/0010`).
- ☐ **`bun test` coverage, starting from zero.** No test file exists yet.
  First ten, in priority order: (1) `db.query.user` role read matches the
  session; (2) `requirePermission` denies without a session; (3)
  `changeUserRole`'s transaction rolls back the role update if the audit
  insert fails; (4) `seed.ts` exits non-zero without `SEED_ADMIN_PASSWORD`;
  (5) `env.ts` throws on a placeholder `BETTER_AUTH_SECRET` in production;
  (6) RFC 9457 error shape from a sample route (once M2's RFC 9457 item
  lands); (7) rate limiter returns 429 past threshold and survives a
  simulated process restart; (8) `delete-account` actually removes the row;
  (9) nav-link-resolves-to-page check (promote the CI script below to a
  test); (10) auth-route-has-authorization-call check (ditto).
- ☐ **RFC 9457 Problem Details as the sole API error contract**, replacing
  the three in-house response factories (`AuthResponseFactory`,
  `errors.ts:createSuccessResponse`, `utils/response-utils.ts` — 6 routes
  use the first, 0 use the second, 19 hand-roll `NextResponse.json`). This
  is a breaking API shape change — land it **before** any new domain routes
  are written (M3), not after. See
  [ADR-0002](docs/adr/0002-rfc9457-error-contract.md).
- ☐ **One structured logger**, `no-console` enforced via oxlint once it
  lands (301 bare `console.*` calls today, replacing
  `security.ts:logSecurityEvent`, `services/logging.service.ts`, and
  `errors.ts:logError`). W3C Trace Context propagation and PII redaction
  rules go in [`docs/observability.md`](docs/observability.md).
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
- ☐ **Duplicate dependencies** — six pairs doing the same job:
  `sonner`+`react-hot-toast`, `resend`+`nodemailer`,
  `tsx`+`ts-node` (☑ both removed — Bun runs TS natively),
  `bcrypt`+better-auth's own hashing (☑ removed, unused),
  `shadcn`+`shadcn-ui` (☑ deprecated `shadcn-ui` removed),
  `animejs`+`tw-animate-css`. Remaining: pick one toast library and one mail
  transport, and migrate every call site off the loser. **Good first issue**
  once a canonical choice is made (needs an ADR first, since it touches
  many files).
- ☐ **Pre-existing type errors, surfaced by the first-ever `tsc --noEmit`
  run in this project's history** (no typecheck script or CI existed before
  this session's toolchain setup). None are related to the Drizzle
  migration or the dependency bumps — cataloged here rather than fixed
  blind, since each needs understanding of a specific form's intended
  shape:
  - `src/app/dashboard/jobs/create/page.tsx` imports
    `../../_components/job-form`, which doesn't exist.
  - `src/app/dashboard/content/announcements/[id]/page.tsx` and
    `src/components/content/announcements-overview-cards.tsx` reference
    `Announcement.metrics` and `AnnouncementStatistics.publishedArticles` /
    `.totalArticles` / `.topPerformingArticles` — fields the type
    definitions don't have. Mock-data/type drift.
  - `src/app/dashboard/learning/admin/_components/course-form.tsx`,
    `src/components/content/add-announcement-form.tsx`,
    `add-article-form.tsx`, `add-publication-form.tsx`: `zodResolver`
    output type doesn't match the `useForm<T>()` generic — a classic
    zod-coercion/react-hook-form generic mismatch, needs per-schema fixing.
  - `src/components/content/publications-filters.tsx:447`: a `DateRange`
    with optional `start`/`end` passed where both are required.

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
