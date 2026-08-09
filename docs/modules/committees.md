# Committees module

**Maturity tier:** Promoted (`config/features.ts`, `committees: true` — flipped 2026-08-08, backlog D2)
**Gate authority:** [ADR-0008](../adr/0008-module-maturity-gate.md), [`docs/technical-specs/13-module-maturity-gate.md`](../technical-specs/13-module-maturity-gate.md)
**Promotion order:** second of the flag-off set, per §13.4 — after chapters, before learning/awards/workspaces.

This document is the module's public-surface documentation required for the Promoted tier (`docs/PRINCIPLES.md`, "Easy to customize": a module documents its schema, API, and feature flag well enough that a developer can extend it without reading internal code first).

## What it does

Committees manages the association's committees and working groups: their charter (mission, responsibilities, authority, term limits), roster (leadership officers and regular members), meeting cadence, metrics, and a parent/sub-committee hierarchy. The dashboard presents the roster with status filtering, statistics computed from the fetched data, and per-committee detail pages. It is the second module promoted out of the flag-off set; the mock-data hooks that backed the preview UI were deleted, not left behind flags.

## Feature flag and gating

- Registry: `MODULE_FLAGS.committees === true` in `config/features.ts` (:52, §13.3 shape). Promotion switched the module on by default; the flag-off "Preview — mock data" marking (`src/components/dashboard/module-preview-banner.tsx`, rendered by the committees layout) returns null on its own once the flag is on — no banner removal code was needed.
- Path mapping: `/dashboard/organization/committees/**` resolves to the `committees` module via `MODULE_PATH_PREFIXES` in `config/features.ts` (:130).
- Role gate (separate mechanism, `src/proxy.ts` + `src/lib/navigation-data.ts`): the Organization → Committees section is visible to roles carrying `committees:read`.
- API authorization is per-action and permission-based (below) — reaching a page through the role gate does not grant any API permission by itself.

## Schema

Drizzle schema: `src/db/schema/committees.ts`. Nested documents (charter, meetings, metrics) travel as `jsonb` — the same technique events/content/membership use — and leadership officers and regular members share one `committee_members` table, split by `role` in the service layer.

| Table               | Drizzle constant (`committees.ts`) | Landed in                                   |
| ------------------- | ---------------------------------- | ------------------------------------------- |
| `committees`        | `committee` (:26)                  | `drizzle/0006_early_thing.sql` (backlog D2) |
| `committee_members` | `committeeMember` (:71)            | `drizzle/0006_early_thing.sql` (backlog D2) |

Key shape: `committees.name` carries a unique constraint (duplicate creates return 409); `parent_committee_id` is a self-FK for the hierarchy (indexed); `created_by`/`updated_by` reference `users.id` (`text` — better-auth ids are text); `committee_members.committee_id` cascades on committee delete and `user_id` is nullable (rosters may list people without a login yet). Leadership roles (`chair`, `co_chair`, `secretary`, `treasurer`, `advisor`) vs plain `member` rows drive the leadership/member split in the DTO.

## API surface

All routes live under `src/app/api/v1/committees/**` and follow `docs/api/conventions.md`: `requirePermission` first (ADR-0001), zod validation, RFC 9457 problem errors (ADR-0002), success envelope.

| Endpoint                  | Method(s) | Permission          |
| ------------------------- | --------- | ------------------- |
| `/api/v1/committees`      | GET       | `committees:read`   |
| `/api/v1/committees`      | POST      | `committees:create` |
| `/api/v1/committees/[id]` | GET       | `committees:read`   |
| `/api/v1/committees/[id]` | PATCH     | `committees:update` |
| `/api/v1/committees/[id]` | DELETE    | `committees:delete` |

GET list supports `page`, `limit` (≤100), `status`, `type`, `authorityLevel` (repeatable comma-separated enum lists; unknown values are dropped), `leadershipRole`, `search` (ilike over display name/purpose), and `memberCountMin`/`memberCountMax`, returning the success envelope with `page`/`limit`/`total`/`totalPages` meta. Charter dates are server-managed: create stamps `approvalDate`/`lastReviewed` and sets `nextReview` one year out; PATCH preserves `approvalDate` and refreshes the review dates. A committee cannot be its own parent (409), and a dangling `parentCommitteeId` is a 400 business-logic problem.

Permission holders among predefined roles (`src/types/role.types.ts`): `superadmin` (all permissions), `admin` (`committees:create/read/update/delete/manage`, :298-302), `staff` (`committees:read/update/manage`, :348-350 — no create/delete), `committee_chair` (`committees:read/update/manage`, :443-445), `member_corporate`/`member_professional`/`member_student` (`committees:read` only, :476/:493/:509). The plain `member` role carries no `committees:*` permission; custom roles may.

## Services

- `src/lib/services/committee/` — the whole module's data access: zod create/update schemas, list with filters/pagination, get/create/update/delete, unique-name violation mapping (PG `23505` → `COMMITTEE_NAME_TAKEN`), parent validation (`COMMITTEE_PARENT_NOT_FOUND`, `COMMITTEE_PARENT_SELF`), and the row→DTO mappers that split `committee_members` into leadership vs members and hydrate the jsonb charter/meetings/metrics with safe fallbacks.

Routes map service errors in `src/app/api/v1/committees/_lib.ts`: `NotFoundError` → 404 problem, `COMMITTEE_NAME_TAKEN`/`COMMITTEE_PARENT_SELF` → 409 conflict, other `BusinessLogicError` → 400 business-logic problem.

## Dashboard UI

Two pages under `src/app/dashboard/organization/committees/`, wired to the API through `src/lib/hooks/use-committees/` (react-query over `apiFetch`, backlog D2 — the `mock-committee-data.ts` file was deleted once its last importer moved):

| Page             | Path                                      |
| ---------------- | ----------------------------------------- |
| Committees list  | `/dashboard/organization/committees`      |
| Committee detail | `/dashboard/organization/committees/[id]` |

The hook fetches the list (filters → query params), computes statistics and the monthly trend client-side from the fetched page (never invented), and exposes create/update/delete/status-toggle mutations. The detail page fetches a single committee with `apiFetch` and hydrates wire dates via `toCommitteeUi`. `src/app/dashboard/organization/committees/layout.tsx` renders the shared mock-tier banner, which returns null now that the flag is on.

## Tests

14 tests in a focused folder, run against the shared test database (real tables, real constraints):

| File                                     | Tests | Covers                                                                                                                                                                                         |
| ---------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/committees-api/crud.test.ts`      | 9     | RBAC matrix (admin/staff/member), create validation (422), unique-name conflict (409), charter date stamping/preservation, leadership vs member split from `committee_members`, PATCH behavior |
| `tests/committees-api/hierarchy.test.ts` | 2     | Parent/child hierarchy incl. self-parent 409 and dangling parent 400                                                                                                                           |
| `tests/committees-api/listing.test.ts`   | 2     | List filters with pagination meta                                                                                                                                                              |
| `tests/committees-api/delete.test.ts`    | 1     | Delete permissions and idempotent 404s                                                                                                                                                         |

Shared setup (actors, payloads, cleanup) lives in `tests/committees-api/fixtures.ts`. Run: `bun test tests/committees-api/` (needs the test Postgres/Redis stack, `compose.yml`). Each file is baseline-delta and self-cleaning: every row is `RUN_ID`-isolated and removed in `afterAll`.

## Accessibility

WCAG 2.2 AA is part of the promotion bar for an enabled module. The committees pages pass the repo-wide `jsx-a11y` oxlint gate statically. They are not yet in the axe smoke page list (`scripts/a11y-smoke.ts`) — the enablement pass (backlog E1) adds `/dashboard/organization/committees` to the list and records the run. Record: [`docs/accessibility/wcag-2.2-aa-enabled-modules.md`](../accessibility/wcag-2.2-aa-enabled-modules.md).

## Promotion bar evidence

| Criterion (ADR-0008 tier 4)            | Evidence                                                                                                              |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Real Drizzle schema                    | `src/db/schema/committees.ts`; migration `drizzle/0006_early_thing.sql` (backlog D2)                                  |
| Authorized API                         | 5 handlers under `src/app/api/v1/committees/**`, each calling `requirePermission("committees:*")` before body parsing |
| Tests                                  | `tests/committees-api/` — 14 tests against the real tables                                                            |
| Documentation                          | This document                                                                                                         |
| WCAG 2.2 AA pass (enabled-module gate) | Static `jsx-a11y` gate passes; axe smoke run recorded by the E1 enablement pass (see Accessibility)                   |
| Flag on                                | `config/features.ts` `MODULE_FLAGS.committees = true` (this promotion)                                                |

## Related decisions

- [ADR-0008](../adr/0008-module-maturity-gate.md) — the maturity gate itself.
- `docs/technical-specs/13-module-maturity-gate.md` — binding tier definitions (§13.3 registry shape, §13.4 promotion order).
