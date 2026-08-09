# Task Breakdown

Module-by-module engineering breakdown of the Nuvia codebase, produced for
backlog item F4. For every module: what it does, its entry points, the schema
tables it owns, its validation, and its tests. The API contract for each
module lives in [`api-specs/`](api-specs/_index.md); runtime and environment
concerns live in [`DEPLOYMENT_PLAN.md`](DEPLOYMENT_PLAN.md).

Conventions used below:

- **Routes** are Next.js App Router handlers under `src/app/api/**` — one
  `route.ts` per endpoint group, exporting the HTTP verbs.
- **Permissions** come from `AVAILABLE_PERMISSIONS` in
  `src/types/role/index.ts` and are enforced through `requirePermission` /
  `requireRole` (`src/lib/rbac/`).
- **Errors** are RFC 9457 problems built only through `src/lib/http.ts`.
- All 48 tables were created by migrations `drizzle/0000`–`0009`.

## 1. Core platform

Cross-cutting infrastructure every other module imports.

| Piece                    | Entry point                      | Notes                                                                                                                     |
| ------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Environment validation   | `src/lib/env.ts`                 | Zod schema; required vs defaulted vars; `superRefine` pairs (Stripe, Redis); see `DEPLOYMENT_PLAN.md`                     |
| HTTP envelope + problems | `src/lib/http.ts`                | `successResponse`, `problemResponse`, `problems.*`, `validationProblem` (ADR-0002)                                        |
| Authorization            | `src/lib/rbac/`                  | `requirePermission`, `requireRole`, `hasPermission`, `getCurrentUser`, `changeUserRole`, `canGrantPermissions` (ADR-0001) |
| Rate limiting            | `src/lib/rate-limit.ts`          | Redis sliding-window log; `RATE_LIMITS` buckets (ADR-0003)                                                                |
| Logging                  | `src/lib/logger.ts`              | One structured logger, `no-console` lint rule (ADR-0004)                                                                  |
| Session cache            | `src/lib/session-cache/index.ts` | Redis-backed session cache used by the auth v1 routes                                                                     |
| Edge proxy               | `src/proxy.ts`                   | Boundary 1→2 gate: session presence before authenticated groups                                                           |
| Feature flags            | `config/features.ts`             | Module gates consumed by nav and dashboard access                                                                         |

Schema tables: none owned directly (this layer defines the rules other
modules' tables obey).

Tests: `tests/env.test.ts`, `tests/logger.test.ts`, `tests/rate-limit.test.ts`,
`tests/rfc9457.test.ts`, `tests/rbac.test.ts`, `tests/module-gate.test.ts`,
`tests/nav-links.test.ts`, `tests/dashboard-access.test.ts`.

## 2. Authentication (better-auth + v1 auth)

Session, credentials, email verification, devices, and account lifecycle.

- **Entry points:** `src/lib/auth/index.ts` (better-auth config: email+password,
  OAuth providers, session hooks), `src/app/api/auth/**` (better-auth
  handler + cache endpoints + OAuth callbacks), `src/app/api/v1/auth/**`
  (13 custom routes: login, signup, profile, password flows, devices,
  delete-account), `src/lib/auth/` and `src/lib/actions/` server actions.
- **Schema tables:** `users`, `accounts`, `sessions`, `verification`,
  `verification_tokens`, `active_devices`, `password_reset_tokens`,
  `user_login_activities`, `auth_logs` (migration 0001 makes
  `auth_logs.user_id` cascade on delete).
- **Validation:** inline zod in each v1 route +
  `src/lib/validation/auth.validation.ts`.
- **Spec:** [`api-specs/auth.md`](api-specs/auth.md).
- **Tests:** `tests/auth-route-coverage.test.ts`, `tests/verify-email.test.ts`,
  `tests/login-activity.test.ts`, `tests/delete-account.test.ts`,
  `tests/profile-update.test.ts`, `tests/auth-log-cascade.test.ts`.

## 3. Admin & RBAC management

Roles, permissions, and user management for administrators.

- **Entry points:** `src/app/api/v1/admin/**` (permissions, roles, users,
  role assignment, bulk role update), `src/types/role/index.ts`
  (`AVAILABLE_PERMISSIONS`, `ROLE_PERMISSIONS`, `canManageRole`),
  `src/lib/rbac/` (`changeUserRole` with audit-trail transaction).
- **Schema tables:** `custom_roles`, `role_change_history`,
  `user_role_assignments` (plus reads/writes on `users`, `auth_logs`).
- **Spec:** [`api-specs/admin.md`](api-specs/admin.md).
- **Tests:** `tests/role-assignment.test.ts`,
  `tests/custom-roles.test.ts`,
  `tests/change-user-role-transaction.test.ts`.

## 4. Members (backlog B1)

Member directory with **derived** member status (ADR-0014 — status is never
stored; it is computed from subscription rows).

- **Entry points:** `src/app/api/v1/members/**` (2 routes),
  `src/lib/services/member.service.ts` (list + derived status),
  `src/lib/services/membership-status.service.ts` (the A3 derivation shared
  with finance).
- **Schema tables:** reads `users` + `membership_*`; owns no table of its
  own.
- **Validation:** `listQuerySchema` in `member.service.ts` (page/limit/
  search/role[]/memberStatus[]/sort).
- **Spec:** [`api-specs/members.md`](api-specs/members.md).
- **Tests:** `tests/members-api/`,
  `tests/member-status-derivation/`.

## 5. Events (backlog B2/B3)

Event CRUD plus registration, waitlist, check-in, and cancel.

- **Entry points:** `src/app/api/v1/events/**` (9 routes),
  `src/lib/services/event-read.service.ts` (list/get with filters),
  `src/lib/services/event-write/` (create/update/delete + `eventFields`
  zod), `src/lib/services/registration.service.ts`
  (status derivation: PENDING paid / CONFIRMED capacity / WAITLISTED full,
  capacity + waitlist promotion in one transaction),
  `src/lib/validation/event.validation.ts` (UI/server-action schemas —
  the REST check-in route itself takes no body).
- **Schema tables:** `events`, `event_categories`, `event_registrations`,
  `event_sessions`, `event_speakers`, `event_sponsors` (all migration 0000).
- **Spec:** [`api-specs/events.md`](api-specs/events.md).
- **Tests:** `tests/events-read-api/`,
  `tests/events-write-api/`.

## 6. Content & media (backlog B4)

Four collections on one table, plus disk-backed uploads.

- **Entry points:** `src/app/api/v1/content/{articles,publications,announcements,categories}/**`
  (20 routes, all delegating to `src/app/api/v1/content/shared.ts`),
  `src/lib/services/content/` (content + category CRUD, slug
  uniqueness, `metadata.ui` round-trip),
  `src/lib/services/media-upload.service.ts` (uploads on local disk +
  JSON manifest — no media table, migrations were frozen; swap-in point for
  S3/Cloudinary later).
- **Schema tables:** `content`, `content_categories`. Migration 0003 adds
  the `PUBLICATION` value to the `ContentType` enum.
- **Validation:** `src/lib/validation/content.validation.ts`
  (`contentBaseSchema` + per-collection extensions + `createCategorySchema`
  - list query schemas).
- **Spec:** [`api-specs/content.md`](api-specs/content.md),
  [`api-specs/media.md`](api-specs/media.md).
- **Tests:** `tests/content-api/`.

## 7. Forums (backlog B5)

Posts, comments, categories, moderation queue, and reports.

- **Entry points:** `src/app/api/v1/forums/**` (18 routes),
  `src/lib/services/forum/index.ts` (schemas + rules: status derivation
  into `PENDING_REVIEW`, soft deletes, counter maintenance, report
  resolution).
- **Schema tables:** `forum_categories`, `forum_posts`, `forum_comments`,
  `forum_attachments` (0000), `forum_reports` (0002).
- **Spec:** [`api-specs/forums.md`](api-specs/forums.md) — note the known
  double-wrap divergence recorded in
  [`api-specs/_index.md`](api-specs/_index.md#known-divergences).
- **Tests:** `tests/forums-api/` (service layer; route layer carries
  the divergence).

## 8. Jobs (backlog B6)

Job postings and applications with reference data for form dropdowns.

- **Entry points:** `src/app/api/v1/jobs/**` (12 routes incl. `meta`),
  `src/app/api/v1/jobs/_lib.ts` (`handleJobRoute`, `parsePagination`),
  `src/lib/services/job/index.ts`, `src/lib/services/job.schemas.ts`,
  `src/types/jobs.types.ts` (enum values).
- **Schema tables:** `job_categories`, `job_types`, `locations`,
  `companies`, `job_postings`, `job_applications` (all 0000).
- **Spec:** [`api-specs/jobs.md`](api-specs/jobs.md).
- **Tests:** `tests/jobs-api/`.

## 9. Finance (backlog C1–C5, ADR-0014/0015)

Membership tiers, subscriptions with a lifecycle state machine, invoices,
manual payments, reports, gateway abstraction, and webhook intake.

- **Entry points:** `src/app/api/v1/finance/**` (25 routes across tiers,
  subscriptions + 6 lifecycle actions, invoices + void, payments, reports,
  gateway), `src/app/api/v1/finance/_lib/helpers.ts`
  (`actorFromRequest`, `problemFromFinanceError`, conflict-code set),
  `src/lib/services/subscription/` (lifecycle engine),
  `src/lib/services/{membership-tier,invoice,finance-report}.service.ts`,
  `src/lib/services/payment/`,
  `src/lib/payments/{gateway,stripe}.ts` (provider seam),
  `src/lib/validation/finance.validation.ts` (string-mode money schemas).
- **Schema tables:** `membership_tiers`, `membership_subscriptions`,
  `membership_transactions` (0000); `membership_invoices`,
  `membership_invoice_items`, `membership_payments`,
  `membership_webhook_events` (0004 — the webhook idempotency ledger).
- **Key rules:** member status is derived, never stored (ADR-0014); amounts
  are string-mode numeric(10,2) (ADR-0015 §5); webhook idempotency claims
  roll back on failure so provider retries succeed.
- **Spec:** [`api-specs/finance.md`](api-specs/finance.md),
  [`api-specs/webhooks.md`](api-specs/webhooks.md).
- **Tests:** `tests/invoice-payment/`,
  `tests/subscription-lifecycle/`,
  `tests/finance-dashboard-api/`.

## 10. Organization (ADR-0007)

The organization singleton — one row for the whole association
(single-tenant seam).

- **Entry points:** `src/app/api/v1/organization/route.ts` (GET/PATCH),
  `src/lib/services/organization.service.ts`,
  `src/lib/validation/organization.validation.ts` (all-fields-required
  update schema with blank→null normalization, IANA timezone + ISO 4217
  validation).
- **Schema tables:** `organizations` (pk fixed at `"default"`).
- **Spec:** [`api-specs/organization.md`](api-specs/organization.md).
- **Tests:** `tests/organization.test.ts`.

## 11. Frontend & dashboard

Pages and components consuming the API above.

- **Entry points:** `src/app/` (landing `(public)`, `auth/`, `dashboard/`),
  `src/components/**` (dashboard, finance, auth, landing, ...),
  `src/lib/navigation-data/index.ts` + `src/lib/dashboard-access.ts` (permission-
  derived nav and the server-side dashboard gate), `src/contexts/`,
  `src/hooks/` (session, OAuth, realtime).
- **Rules:** Server Components by default (ADR-0006); nav derives from
  permissions, not a parallel role list (ADR-0005); UI talks to the API via
  `src/lib/api-client.ts`.

## 12. Ops & tooling

- **Scripts:** `scripts/seed.ts` (`db:seed`), `scripts/run-integration-tests.ts`
  (`test:integration`), `scripts/a11y-smoke.ts` (`test:a11y`).
- **Guards:** `guard:light` (lint + format:check + typecheck), `guard:heavy`
  (+ integration tests + `drizzle-kit check` + build + audit); lefthook
  `prepare` hook.
- **Tests:** `tests/seed-script.test.ts`; CI workflows in
  `.github/workflows/` (`ci.yml`, `release.yml` — SLSA provenance build).
- **Migration ledger:** `drizzle/0000` (34 tables), `0001` (auth_logs FK
  cascade), `0002` (forum_reports), `0003` (ContentType + PUBLICATION),
  `0004` (invoice/payment/webhook tables), `0005` (chapters +
  chapter_members), `0006` (committees + committee_members), `0007`
  (award_programs + award_nominations), `0008` (workspaces), `0009`
  (courses + certificates).

## 13. Chapters (backlog D1)

Regional chapters with member rosters.

- **Entry points:** `src/app/api/v1/chapters/**` (5 endpoints),
  `src/app/api/v1/chapters/_lib.ts` (`handleChapterRoute`,
  `parsePagination`), `src/lib/services/chapter/` (schemas colocated).
- **Schema tables:** `chapters`, `chapter_members` (0005).
- **Spec:** [`api-specs/chapters.md`](api-specs/chapters.md).
- **Tests:** `tests/chapters-api/`.

## 14. Committees (backlog D2)

Committees with member rosters, same shape as chapters.

- **Entry points:** `src/app/api/v1/committees/**` (5 endpoints),
  `src/app/api/v1/committees/_lib.ts`, `src/lib/services/committee/`
  (schemas colocated).
- **Schema tables:** `committees`, `committee_members` (0006).
- **Spec:** [`api-specs/committees.md`](api-specs/committees.md).
- **Tests:** `tests/committees-api/` (focused suite folder).

## 15. Learning / CPD (backlog D3)

Courses and issued certificates.

- **Entry points:** `src/app/api/v1/learning/**` (9 endpoints across
  courses and certificates; certificates carry no DELETE),
  `src/app/api/v1/learning/_lib.ts`, `src/lib/services/learning/`
  (schemas colocated).
- **Schema tables:** `courses`, `certificates` (0009).
- **Spec:** [`api-specs/learning.md`](api-specs/learning.md).
- **Tests:** `tests/learning-api/`.

## 16. Awards (backlog D4)

Award programs and nominations.

- **Entry points:** `src/app/api/v1/awards/**` (10 endpoints across
  `programs` and `nominations`), `src/app/api/v1/awards/_lib.ts`,
  `src/lib/services/award/index.ts` (schemas colocated).
- **Schema tables:** `award_programs`, `award_nominations` (0007).
- **Spec:** [`api-specs/awards.md`](api-specs/awards.md).
- **Tests:** `tests/awards-api/`.

## 17. Workspaces (backlog D5)

Member workspaces.

- **Entry points:** `src/app/api/v1/workspaces/**` (5 endpoints),
  `src/app/api/v1/workspaces/_lib.ts`, `src/lib/services/workspace.service.ts`
  (schemas colocated).
- **Schema tables:** `workspaces` (0008).
- **Spec:** [`api-specs/workspaces.md`](api-specs/workspaces.md).
- **Tests:** `tests/workspaces-api/`.
