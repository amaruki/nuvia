# Workspaces module

**Maturity tier:** Promoted (`config/features.ts`, `workspaces: true` — flipped 2026-08-08, backlog D5)
**Gate authority:** [ADR-0008](../adr/0008-module-maturity-gate.md), [`docs/technical-specs/13-module-maturity-gate.md`](../technical-specs/13-module-maturity-gate.md)
**Promotion order:** last of the flag-off set, per §13.4 — after chapters, committees, learning, and awards.

This document is the module's public-surface documentation required for the Promoted tier (`docs/PRINCIPLES.md`, "Easy to customize": a module documents its schema, API, and feature flag well enough that a developer can extend it without reading internal code first).

## What it does

Workspaces manages the association's committee workspaces — the collaboration shells a committee runs its work in: a typed purpose (general, project, document, discussion, meeting), lifecycle status (active, archived, locked), per-workspace settings (visibility, approval flow, file policy, per-role permissions), and the working set itself: member roster, documents, tasks, discussions, meetings, and an activity feed. The dashboard presents the workspace list with type/status/member-role/search filters, statistics computed from the fetched rows, and a detail page per workspace. It is the last module promoted out of the flag-off set; the mock-data hook that backed the preview UI was deleted, not left behind a flag.

## Feature flag and gating

- Registry: `MODULE_FLAGS.workspaces === true` in `config/features.ts` (§13.3 shape). Promotion switched the module on by default; the flag-off "Preview — mock data" marking (`src/components/dashboard/module-preview-banner.tsx`) returns null on its own once the flag is on — no banner removal code was needed.
- Path mapping: `/dashboard/organization/workspaces/**` resolves to the `workspaces` module via `MODULE_PATH_PREFIXES` in `config/features.ts`.
- Role gate (separate mechanism, `src/proxy.ts` + `src/lib/navigation-data.ts`): the Organization → Workspaces section is visible to roles carrying `workspaces:read`.
- API authorization is per-action and permission-based (below) — reaching a page through the role gate does not grant any API permission by itself.

## Schema

Drizzle schema: `src/db/schema/workspaces.ts`, including its own pgEnums (`WorkspaceType`, `WorkspaceStatus`). Nested collections travel as `jsonb` — the same technique committees/events/content use — because the UI edits each workspace's roster, documents, tasks, discussions, meetings, and activity as whole documents rather than as independently queryable rows.

| Table        | Drizzle constant (`workspaces.ts`) | Landed in                                      |
| ------------ | ---------------------------------- | ---------------------------------------------- |
| `workspaces` | `workspace`                        | `drizzle/0008_wonderful_sage.sql` (backlog D5) |

Key shape: `workspaces.name` carries a unique constraint (duplicate creates return 409); `committee_id` is a nullable FK to `committees.id` with `ON DELETE SET NULL` (deleting a committee orphans its workspaces rather than cascading them); `created_by`/`updated_by` reference `users.id` (`text` — better-auth ids are text); `type`/`status` default to `GENERAL`/`ACTIVE`; `settings` is a jsonb object and `members`/`documents`/`tasks`/`discussions`/`meetings`/`activity` are jsonb arrays defaulting to `{}`/`[]`. Indexes cover `status`, `type`, and `committee_id`.

Enum values are stored SCREAMING_SNAKE (`GENERAL`, `ACTIVE`) and mapped to the UI's lowercase strings (`general`, `active`) at the service boundary.

## API surface

All routes live under `src/app/api/v1/workspaces/**` and follow `docs/api/conventions.md`: `requirePermission` first (ADR-0001), zod validation, RFC 9457 problem errors (ADR-0002), success envelope.

| Endpoint                  | Method(s) | Permission          |
| ------------------------- | --------- | ------------------- |
| `/api/v1/workspaces`      | GET       | `workspaces:read`   |
| `/api/v1/workspaces`      | POST      | `workspaces:create` |
| `/api/v1/workspaces/[id]` | GET       | `workspaces:read`   |
| `/api/v1/workspaces/[id]` | PATCH     | `workspaces:update` |
| `/api/v1/workspaces/[id]` | DELETE    | `workspaces:delete` |

GET list supports `page`, `limit` (≤100), `status`, `type`, `memberRole` (comma-separated lists; unknown values are dropped), `createdAfter`/`createdBefore` (ISO bounds on `createdAt`), and `search` (ilike over name/description), returning the success envelope with `page`/`limit`/`total`/`totalPages` meta. `memberRole` matches inside the jsonb roster (any member whose `role` equals one of the requested values).

POST validates the full settings block (mirrors the add-workspace form: booleans, `autoArchiveDays` 1–1095, `maxFileSize` 1–1000, non-empty `allowedFileTypes`, at least one `memberPermissions` entry). A non-existent `committeeId` is a 422 validation problem; duplicate `name` is a 409 conflict. PATCH is partial; `committeeId: null` clears the committee link.

Permission holders among predefined roles (`src/types/role.types.ts`): `superadmin` (all permissions), `admin` (`workspaces:create/read/update/delete/manage`), `staff` (`workspaces:read/update/manage` — no create/delete), `member_corporate`/`member_professional`/`member_student` (`workspaces:read` only). The plain `member` role carries no `workspaces:*` permission — not even read; custom roles may.

## Services

- `src/lib/services/workspace.service.ts` — the whole module's data access: zod create/update schemas, `listWorkspaces` with filters/pagination, `getWorkspace`/`updateWorkspace` (null on miss), `createWorkspace`/`deleteWorkspace` (boolean), unique-name violation mapping (PG `23505` → 409 conflict problem), committee-existence check, enum case mapping, and the row→DTO mapper that hydrates jsonb blobs with safe fallbacks.
- `WorkspaceServiceError` carries a `ProblemDetails` payload (chapter-service style); routes translate it through `handleWorkspaceRoute` in `src/app/api/v1/workspaces/_lib.ts`.

## Dashboard UI

Two pages under `src/app/dashboard/organization/workspaces/`, wired to the API through `src/lib/hooks/use-workspaces.ts` (react-query over `apiFetch`, backlog D5 — the `mock-workspace-data.ts` file was deleted once its last importer moved):

| Page             | Path                                      |
| ---------------- | ----------------------------------------- |
| Workspaces list  | `/dashboard/organization/workspaces`      |
| Workspace detail | `/dashboard/organization/workspaces/[id]` |

The hook fetches the list (filters → query params), hydrates wire dates per collection (`WireWorkspace` → `CommitteeWorkspace`), computes statistics client-side from the fetched page (never invented) — including task completion rate, document upload rate, meeting attendance rate, top active workspaces, type breakdown, and the monthly trend — and exposes create/update/delete/status-toggle mutations. The detail page fetches a single workspace with `apiFetch` and hydrates it through the same mapper.

## Tests

24 tests in one file, run against the shared test database (real tables, real constraints):

| File                           | Tests | Covers                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tests/workspaces-api.test.ts` | 24    | Auth + RBAC matrix (admin/staff/member tiers; staff lacks create/delete; plain member lacks even read), create validation (422), unique-name conflict (409), committee linking incl. unknown-committee 422 and null-clears-link, list filters (status/type/memberRole/date range/search) with pagination meta, PATCH semantics, delete permissions and idempotent 404s, service-layer round trip |

Run: `bun test tests/workspaces-api.test.ts` (needs the test Postgres/Redis stack, `compose.test.yml`). The suite is baseline-delta and self-cleaning: every row is `RUN_ID`-isolated and removed in `afterAll`.

## Accessibility

WCAG 2.2 AA is part of the promotion bar for an enabled module. The workspaces pages pass the repo-wide `jsx-a11y` oxlint gate statically. They are not yet in the axe smoke page list (`scripts/a11y-smoke.ts`) — the enablement pass (backlog E1) adds `/dashboard/organization/workspaces` to the list and records the run. Record: [`docs/accessibility/wcag-2.2-aa-enabled-modules.md`](../accessibility/wcag-2.2-aa-enabled-modules.md).

## Promotion bar evidence

| Criterion (ADR-0008 tier 4)            | Evidence                                                                                                              |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Real Drizzle schema                    | `src/db/schema/workspaces.ts`; migration `drizzle/0008_wonderful_sage.sql` (backlog D5)                               |
| Authorized API                         | 5 handlers under `src/app/api/v1/workspaces/**`, each calling `requirePermission("workspaces:*")` before body parsing |
| Tests                                  | `tests/workspaces-api.test.ts` — 24 tests against the real tables                                                     |
| Documentation                          | This document                                                                                                         |
| WCAG 2.2 AA pass (enabled-module gate) | Static `jsx-a11y` gate passes; axe smoke run recorded by the E1 enablement pass (see Accessibility)                   |
| Flag on                                | `config/features.ts` `MODULE_FLAGS.workspaces = true` (this promotion)                                                |

## Known limitations

- Nested collections (`members`, `documents`, `tasks`, `discussions`, `meetings`, `activity`) are created empty server-side; the staging UI's rich seed content was mock data. Populating them is the responsibility of whatever workflow manages each collection.
- Roster/document/task management is DB-only for now: there are no sub-resource endpoints (add member, upload document, complete task). Whole-workspace PATCH is the only mutation surface.
- Meetings are a jsonb record, not a booking system: no scheduling engine, availability checks, or calendar integration.
- `committeeId` links are informational; deleting a committee set-nulls the link and the workspace remains.

## Related decisions

- [ADR-0008](../adr/0008-module-maturity-gate.md) — the maturity gate itself.
- [ADR-0001](../adr/0001-one-authorization-helper.md) / [ADR-0002](../adr/0002-rfc9457-error-contract.md) — the API conventions followed here.
- `docs/technical-specs/13-module-maturity-gate.md` — binding tier definitions (§13.3 registry shape, §13.4 promotion order).
