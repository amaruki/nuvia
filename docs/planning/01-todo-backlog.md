# Nuvia — Planning Backlog

> The public claims in README.md, the landing page, and docs/technical-specs describe the TARGET state and are preserved verbatim (owner decision). This backlog is the decomposed work needed to make them true. Nothing here edits those claims.

> How to read: one item = one vertical slice of work a single worker can finish in about one session (schema + API + UI wiring + tests for ONE feature path). Items are deliberately not atomic file-steps and not whole-module epics. IDs are stable (A1…F4) and referenced by `02-claim-gap-map.md`. Each item lists Why (what makes it necessary today), Acceptance (how to know it is done), and Deps (what must land first).

## Wave A — Foundations & gates (M3 prerequisites)

- **A1 — Module maturity gate.** Build `config/features.ts` with `MODULE_FLAGS` (members/events/content/forums/jobs true; finance/awards/learning/chapters/committees/workspaces false), wire sidebar + page rendering to read it, and mark Mock-tier modules visibly (badge/banner) instead of silently rendering mock data.
  - Why: ADR-0008/Section 13 prerequisite; today a treasurer opening finance sees a fully mock UI with no indication.
  - Acceptance: flag file exists per the shape in `docs/technical-specs/13-module-maturity-gate.md` §13.3; nav + render respect flags; mock-marking visible; tests for flag on/off.
  - Deps: none.

- **A2 — Wire the Organization singleton.** Settings UI writes the `organizations` row; email templates, currency formatting, and branding read it instead of hardcoded strings.
  - Why: TODO.md M3 first item; dependency for "easy to customize" and for finance currency handling.
  - Acceptance: settings page edits name/branding/locale/currency; at least email templates + one dashboard surface consume it; tests.
  - Deps: none.

- **A3 — Reconcile Member vs MembershipSubscription.** Land a small ADR deciding the derivation rule (subscription status → member status/role sync), then implement it in services.
  - Why: CONTEXT.md flags the two membership concepts as unreconciled; the "paid member" journey needs one source of truth.
  - Acceptance: ADR accepted; service derives member status from subscription lifecycle (active/trialing/canceled/past due/unpaid/paused); tests for each transition.
  - Deps: none.

## Wave B — The five claimed modules on real data (M3 core)

Wave B preamble: each item = authorized API + service + UI de-mock + tests for that module.

- **B1 — Members on real data.** `/api/v1/members` list/detail (authorized `members:*`), replace `mockUsers` and `use-memberships` mock generation in `users/directory` and `memberships/directory`.
  - Why: the members directories currently render an inline `mockUsers` array and generated `mockMembers` instead of real rows.
  - Acceptance: per the wave bar — authorized `members:*` API + service + UI de-mock + tests, with both directory pages listing real members.
  - Deps: A3.

- **B2 — Events read path real.** GET `/api/v1/events` + `/api/v1/events/[id]` over the events tables (filters, pagination); `event.service.ts` reads fetch the real API instead of `getMockEvents`/`getMockEventById`; public events page and dashboard list render real rows (remove hardcoded `events={[]}`).
  - Why: the events read path returns mock events today and the public page renders an empty array.
  - Acceptance: per the wave bar — authorized read API + service + UI de-mock + tests, with public and dashboard event lists rendering real rows.
  - Deps: none.

- **B3 — Events write + registration real.** Create/update/delete/cancel + register/cancel/check-in routes with `events:*` authorization; transactional `registeredCount`/`waitlistCount` integrity; wire dashboard create/edit/check-in pages.
  - Why: event mutations today fetch `/api/v1/events` endpoints that have no route handler.
  - Acceptance: per the wave bar — authorized write/registration API + service + dashboard create/edit/check-in wiring + tests, with count/waitlist integrity transactional.
  - Deps: B2.

- **B4 — Content real.** CRUD APIs for articles/publications/announcements/categories with `content:*` authorization; replace `use-articles`/`use-publications`/`use-announcements`/`use-categories` mock hooks. Media sub-decision (owner, at implementation time): wire `media.service.ts` to local-disk storage under `storage/uploads` (no new dependency — recommended default) or delete the file; record choice in the item's execution note.
  - Why: the content hooks today serve `mock-article-data`/`mock-publication-data` (and inline category mocks) instead of database rows.
  - Acceptance: per the wave bar — authorized `content:*` CRUD API + service + UI de-mock + tests across articles/publications/announcements/categories, with the media sub-decision recorded.
  - Deps: none.
  - Status: done. Articles/publications/announcements/categories served from the `content` table (discriminated by `type`; new `PUBLICATION` enum value in migration 0003) via `/api/v1/content/**` with `content:*` authorization; UI-only fields round-trip through `content.metadata.ui`; the four mock hooks are API-backed. Tests: `tests/content-api.test.ts`.
  - Execution note (media sub-decision): chose local-disk storage — uploads write to `storage/uploads/` with metadata in a JSON manifest (`storage/uploads/manifest.json`), because no media table exists and migrations were frozen; no new dependency. Served via `/api/v1/media` + `/api/v1/media/[id]` under `content:*` permissions (no media permission module exists). `use-media` uploads POST real multipart; listing/versions/folders remain service-internal until a media table lands.

- **B5 — Forums real.** Posts/comments/categories CRUD + moderation actions with `forum:*` authorization; de-mock `report-list`, `category-manager`, `moderation-queue`; keep per-category `requiredRole` gate.
  - Why: the forum admin components today read `mock-forums` data.
  - Acceptance: per the wave bar — authorized `forum:*` CRUD + moderation API + service + UI de-mock + tests, keeping the per-category role gate.
  - Deps: none.

- **B6 — Jobs real.** Postings/applications CRUD with `jobs:*` authorization; de-mock dashboard jobs (`./_data/mock-jobs`, `mock-applicants`) and the public `/jobs` pages; application status flow tested.
  - Why: dashboard jobs and applicant pages today import `mock-jobs`/`mock-applicants`.
  - Acceptance: per the wave bar — authorized `jobs:*` CRUD API + service + UI de-mock (dashboard and public) + tests, including the application status flow.
  - Deps: none.

## Wave C — Finance & dues: first promoted module (M3 core)

Wave C preamble: finance/dues is the product core for an AMS and the first module to promote (promotion order per `TODO.md` M3 and `docs/technical-specs/13-module-maturity-gate.md` §13.4); every item moves finance toward the Promoted tier.

- **C1 — Payment provider ADR (owner decision).** Choose Stripe vs Midtrans vs manual-first; no SDK installed until decided.
  - Why: no payment SDK exists today; every finance wiring depends on this.
  - Acceptance: ADR-0014 lands with context/decision/consequences.
  - Deps: none.

- **C2 — Tiers + subscription lifecycle engine.** `membership_tiers` CRUD API (`finance:*`); subscription service create/renew/cancel/pause/past-due over `membership_subscriptions`; all amounts `numeric(10,2)` string mode.
  - Why: `membership_subscriptions` — the finance module's core record — is unwired today; no service code queries it yet.
  - Acceptance: per the wave goal — finance advances as the first promoted module: tier CRUD + subscription lifecycle service live on the real tables, tested.
  - Deps: A3, C1.

- **C3 — Invoicing + payment recording.** Invoices generated from subscription events; manual + gateway payments recorded into `membership_transactions`; treasurer reconciliation; privileged financial mutations write audit log in the same transaction (PRINCIPLES.md fast-vs-auditable).
  - Why: no invoice/payment recording or treasurer reconciliation path exists today, and privileged financial mutations need a transactional audit trail.
  - Acceptance: per the wave goal — invoices and payment recording live on the real tables with same-transaction audit logging and reconciliation, tested.
  - Deps: C2.

- **C4 — Finance dashboard real.** Wire dues/invoices/reports/budget/donations/gateways pages to real services; remove `use-dues` etc. mock hooks; reports computed from transactions.
  - Why: the finance dashboard pages today render from `mock-dues-data`-family mock hooks.
  - Acceptance: per the wave goal — dues/invoices/reports/budget/donations/gateways pages read real services, mock hooks removed, reports computed from transactions, tested.
  - Deps: C3.

- **C5 — Promote the Finance module.** Module docs, flag `finance: true`, WCAG pass on finance pages, promotion bar evidenced (schema + authorized API + tests + docs).
  - Why: finance leads the promotion order, and promotion is what switches a module on by default.
  - Acceptance: per the wave goal — finance clears the promotion bar (schema + authorized API + tests + docs) with the flag on and a WCAG pass on finance pages.
  - Deps: A1, C4.
  - Status: done 2026-08-08. `finance: true` in `config/features.ts`; module docs landed at `docs/modules/finance.md` evidencing the promotion bar — schema (`src/db/schema/membership.ts`, migrations `drizzle/0000_cute_norman_osborn.sql` + `drizzle/0004_plain_ultimo.sql`), authorized API (`/api/v1/finance/**`, every handler on a `finance:*` permission; commits d8e4251, df6de14, e672c11, a17439c), tests (79 across `tests/subscription-lifecycle.test.ts`, `tests/invoice-payment.test.ts`, `tests/finance-dashboard-api.test.ts`) — and the WCAG gate: all six finance pages added to the axe smoke (`scripts/a11y-smoke.ts`), 0 critical/serious on all 13 audited pages (`docs/accessibility/wcag-2.2-aa-enabled-modules.md`).

## Wave D — Post-1.0 promotion queue (one item per module; same promotion bar as C5)

- **D1 — Chapters real (schema + authorized API + UI de-mock of `mock-chapter-data` + tests + docs + flag).**
  - Why: chapters is the first module after finance in the declared promotion order, and its UI currently renders mock data rather than real records.
  - Acceptance: chapters clears the same promotion bar as C5 — schema + authorized API + UI de-mock of `mock-chapter-data` + tests + docs, with the module flag flipped on.
  - Deps: C5 pattern.
  - Status: done 2026-08-08. Chapters cleared the C5 promotion bar: schema (`chapters` + `chapter_members` tables, `ChapterStatus`/`ChapterRole` enums, migration 0005), authorized API `/api/v1/chapters/**` on `chapters:*` permissions, UI de-mocked (`mock-chapter-data.ts` deleted; hooks and pages on `apiFetch`), 22 tests in `tests/chapters-api.test.ts`, module docs at `docs/modules/chapters.md`, and `chapters: true` in `config/features.ts` with `/dashboard/organization/chapters` added to the axe smoke (14 pages PASS, 0 critical/serious).

- **D2 — Committees real (same bar; `mock-committee-data`).**
  - Why: committees is the next module in the post-1.0 promotion order, and its UI currently renders mock data rather than real records.
  - Acceptance: committees clears the same promotion bar as C5 — schema + authorized API + UI de-mock of `mock-committee-data` + tests + docs, with the module flag flipped on.
  - Deps: C5 pattern.
  - Status: done 2026-08-08. Committees cleared the C5 promotion bar: schema (`committees` + `committee_members` tables, migration 0006), authorized API `/api/v1/committees/**` on `committees:*` permissions, UI de-mocked (`mock-committee-data.ts` deleted; hooks and pages on `apiFetch`/react-query), 14 tests in `tests/committees-api.test.ts`, module docs at `docs/modules/committees.md`, and `committees: true` in `config/features.ts` with `/dashboard/organization/committees` added to the axe smoke (15 pages PASS, 0 critical/serious).

- **D3 — Learning/CPD real (same bar; courses/certifications pages).**
  - Why: learning/CPD is the next module in the post-1.0 promotion order, and its courses/certifications pages currently render mock data.
  - Acceptance: learning/CPD clears the same promotion bar as C5 — schema + authorized API + courses/certifications pages on real data + tests + docs, with the module flag flipped on.
  - Deps: C5 pattern.
  - Status: done 2026-08-08. Learning cleared the C5 promotion bar: schema (`course` + `certificate` tables, `course_level`/`certificate_status` enums, migration 0009), authorized API `/api/v1/learning/**` on `learning:*` permissions, courses/certifications/admin pages de-mocked (`courses/_data/mock-data.ts` deleted; hooks and pages on `learning.service.ts` via `use-learning-courses`/`use-learning-certificates`), 27 tests in `tests/learning-api.test.ts`, module docs at `docs/modules/learning.md`, and `learning: true` in `config/features.ts` with `/dashboard/learning/courses` added to the axe smoke (16 pages PASS, 0 critical/serious).

- **D4 — Awards real (same bar; no schema exists yet — item includes schema design).**
  - Why: awards is the next module in the post-1.0 promotion order, and it has no schema today, so the item must include schema design.
  - Acceptance: awards clears the same promotion bar as C5 — schema designed and landed + authorized API + UI + tests + docs, with the module flag flipped on.
  - Deps: C5 pattern.

- **D5 — Workspaces real (same bar; `mock-workspace-data`).**
  - Why: workspaces is the last module in the post-1.0 promotion order, and its UI currently renders mock data rather than real records.
  - Acceptance: workspaces clears the same promotion bar as C5 — schema + authorized API + UI de-mock of `mock-workspace-data` + tests + docs, with the module flag flipped on.
  - Deps: C5 pattern.

## Wave E — M4: OSS launch

- **E1 — WCAG 2.2 AA on enabled modules (oxlint `jsx-a11y` rule set + `@axe-core/playwright` smoke on the five enabled modules + manual pass).**
  - Why: M4's exit criteria require WCAG 2.2 AA on all enabled modules, and none currently has an automated accessibility gate.
  - Acceptance: the `jsx-a11y` rule set is enabled, the `@axe-core/playwright` smoke passes on the five enabled modules, and a manual pass is recorded.
  - Deps: each module at Backed+.
  - Status: done 2026-08-08. `jsx-a11y` enabled at error level (30 rules); 39 static violations fixed across 18 files; `bun run test:a11y` smoke (Playwright + `@axe-core/playwright`, WCAG 2.2 AA tags) audits one authenticated page per enabled module plus public `/events` and `/jobs` and passes with 0 critical/serious after fixing 12 axe findings (contrast tokens, unnamed sidebar trigger, calendar chip semantics); manual pass recorded in `docs/accessibility/wcag-2.2-aa-enabled-modules.md`.

- **E2 — SLSA Build Level 2 provenance (`actions/attest-build-provenance` + cosign keyless signing via GitHub Actions OIDC).**
  - Why: M4's exit criteria require supply-chain provenance, which this item builds into the release pipeline per `docs/release.md`.
  - Acceptance: release builds produce SLSA Level 2 provenance and keyless cosign signatures via GitHub Actions OIDC, with CI green.
  - Deps: CI green.

- **E3 — Controls mapping (OWASP ASVS + NIST SSDF).**
  - Why: M4's exit criteria require a controls mapping so each security control is verifiable in one place.
  - Acceptance: `docs/security/controls.md` maps OWASP ASVS + NIST SSDF, with each control marked CI-verified vs process-only per the "Secure" test.
  - Deps: none.

- **E4 — ISO/IEC 27001 control statement limited to Annex A, A.8 only.**
  - Why: M4's exit criteria require an honest ISO statement scoped to the control set the system actually covers.
  - Acceptance: the statement explicitly names the A.5–A.7 limit and the external-auditor requirement.
  - Deps: none.

- **E5 — Governance completion (PR template + CODEOWNERS).**
  - Why: M4's exit criteria require production governance files, and only CONTRIBUTING/CODE_OF_CONDUCT/SECURITY/CHANGELOG exist today.
  - Acceptance: PR template and CODEOWNERS land alongside the existing governance files.
  - Deps: none.

- **E6 — Username uniqueness follow-up (unique constraint exists; migration decision + roadmap-text reconciliation).**
  - Why: the current schema already enforces uniqueness (`src/db/schema/users.ts:17` `.unique()`, `drizzle/0000_cute_norman_osborn.sql:76` UNIQUE constraint), but `TODO.md:70` still claims the opposite; the effective open work is documenting the migration handling for any legacy duplicate usernames and reconciling the roadmap wording.
  - Acceptance: a documented migration decision is present for any existing duplicate usernames (or a confirmed none-exist statement), and the stale `TODO.md:70` claim is reconciled with the schema — verified by reading the schema + roadmap diff.
  - Deps: none.

## Wave F — Debt & companion docs surfaced by the audit

- **F1 — Retire dead `src/lib/config.ts` (parallel to canonical `src/lib/env.ts`).**
  - Why: the audit surfaced `src/lib/config.ts` as a dead parallel config source alongside the canonical `src/lib/env.ts`.
  - Acceptance: remaining importers are migrated to `src/lib/env.ts` and `src/lib/config.ts` is deleted.
  - Deps: none.

- **F2 — Mock residue sweep after B/C land (delete `src/lib/mock/` and only the wired `src/lib/data/mock-*.ts`).**
  - Why: after the B/C waves land, mock files for wired modules are residue, while mock UI stays only for unpromoted modules (ADR-0008).
  - Acceptance: `src/lib/mock/` and only the `src/lib/data/mock-*.ts` whose module is now wired are deleted; unpromoted modules keep mock UI.
  - Deps: B1–B6, C4.
  - Status: done. Deleted `src/lib/mock/` (`eventMockData.ts`), the wired-module mocks under `src/lib/data/` (`mock-article-data.ts`, `mock-publication-data.ts`, `mock-media-data.ts`, `mock-forums.ts`), the orphaned jobs `_data` mocks, and the mock-backed `media.service.ts`. Rewired `event.service.ts` (dashboard/registration reads: real upcoming events, honest empty stats/registrations), `use-media` (real upload-manifest API for list/upload/delete/export, honest errors/empties for features with no backing store), and the article/publication filter & form author/tag facets (derived from the real content collections). Unpromoted modules (chapters, committees, workspaces, learning/CPD) keep their mocks per ADR-0008. Finance mocks were already removed by C4.

- **F3 — navigation-data.ts role-list cleanup (`superadmin` added consistently).**
  - Why: the audit surfaced role lists omitting `superadmin`, which `dashboard-access.ts` special-cases around; it is tagged good-first-issue.
  - Acceptance: `superadmin` is added consistently to the nav role lists and the special-case reliance in `dashboard-access.ts` is removed.
  - Deps: none.

- **F4 — Produce the three companion docs flagged by `docs/technical-specs/_index.md` (`api-specs/`, `TASK_BREAKDOWN.md`, `DEPLOYMENT_PLAN.md`).**
  - Why: the audit surfaced these companion docs as not yet produced while the conventions table lists them.
  - Acceptance: `api-specs/`, `TASK_BREAKDOWN.md`, and `DEPLOYMENT_PLAN.md` exist and reflect the accurate API inventory.
  - Deps: B/C waves for accurate API inventory.
  - Status: done 2026-08-08. `docs/api-specs/` (`_index.md` + 11 domain files: auth, members, events, content, media, forums, jobs, finance, admin, organization, webhooks — covering all 78 `route.ts` files under `src/app/api/`, produced by reading every route, permission call, zod schema, and status code out of the code), `docs/TASK_BREAKDOWN.md` (module-by-module entry points, schema tables, tests), and `docs/DEPLOYMENT_PLAN.md` (runtime, env matrix from `src/lib/env.ts`, migrations 0000–0004 incl. the 0003 `ALTER TYPE` transaction caveat, Redis, local-disk uploads + single-node note, Stripe webhook setup, SLSA release pipeline, staging→prod checklist). Known divergences (forums success-envelope double-wrap, finance lists nesting `meta` inside `data`) are recorded in `docs/api-specs/_index.md` rather than papered over.

## Dependency summary

The backlog dependency relations (backlog IDs, from this document's per-item Deps):

- A1 before C5; A3 before B1 and C2; C1 before C2; B2 before B3; C2→C3→C4→C5; D1–D5 reuse C5's promotion pattern (after C5); E1 after Wave B (every enabled module at Backed+); F2 after B1–B6 and C4; F4 after the B/C waves; E2–E6, F1, and F3 independent of B–D.
- (F1–F4 here are backlog Wave-F items — a different ID space from this plan's verifier rows.)
