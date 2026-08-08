# Chapters module

**Maturity tier:** Flag-off (schema, API, and UI real; `config/features.ts` flip owned by the orchestrator, backlog D1)
**Gate authority:** [ADR-0008](../adr/0008-module-maturity-gate.md), [`docs/technical-specs/13-module-maturity-gate.md`](../technical-specs/13-module-maturity-gate.md)

---

## What it does

Chapters tracks the association's regional chapters: identity and status, contact details, location, leadership rosters, and parent/child hierarchy. Backlog D1 replaced the `mock-chapter-data.ts` fixture with a real Drizzle schema, an authorized `/api/v1/chapters` surface, and a de-mocked dashboard, following the C5/Finance pattern.

## Feature flag and gating

- Registry: `MODULE_FLAGS.chapters` in `config/features.ts` (§13.3 shape). The D1 commit delivers the schema/API/UI/tests but **does not flip the flag** — the orchestrator flips it post-commit, the same way C5 handled finance. Until then `ModulePreviewBanner` keeps marking `/dashboard/chapters` as preview.
- Path mapping: `/dashboard/chapters/**` resolves to the `chapters` module via `MODULE_PATH_PREFIXES` in `config/features.ts`.

## Schema

Drizzle schema: `src/db/schema/chapters.ts` (migration `drizzle/0005_nosy_the_fallen.sql`); status/role enums in `src/db/schema/enums.ts` (`ChapterStatus`, `ChapterRole`).

| Table             | Purpose                                                                                                                                                                                                                                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chapters`        | Identity (`name` unique, `displayName`, `description`), `status` (default `PENDING`), location block, `memberCount`, `establishedDate`, self-referencing `parentChapterId` (set-null on delete), `contactInfo`/`socialMedia`/`settings` jsonb, audit `createdBy`/`updatedBy` (free-form email text, matching the pre-D1 UI shape — no user FK). |
| `chapter_members` | Leadership/roster rows: `chapterId` (cascade delete), nullable `userId` FK (officers may hold no platform account), `role` (`ChapterRole`, default `MEMBER`), `title`, `name`, `email`, `phone`, `avatar`, `startDate`/`endDate`, `isActive`.                                                                                                   |

Statuses and roles are stored SCREAMING_SNAKE (`ACTIVE`, `VICE_PRESIDENT`) and mapped to the UI's lowercase strings at the service boundary.

Metrics, events, and finances shown on the UI (`Chapter.metrics`, `Chapter.events`, `Chapter.finances`) have **no backing tables yet**; the service renders neutral defaults (zeroed metrics, empty event/finance arrays) exactly as the staging event service does. They are the next D-track work, not silent gaps.

## API surface

All routes live under `src/app/api/v1/chapters/**` and follow `docs/api/conventions.md`: `requirePermission` before any parsing ([ADR-0001](../adr/0001-one-authorization-helper.md)), zod validation, RFC 9457 problem errors ([ADR-0002](../adr/0002-rfc9457-error-contract.md)), success envelope.

| Route                   | Method | Permission        | Notes                                                                                                                                                                                              |
| ----------------------- | ------ | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/v1/chapters`      | GET    | `chapters:read`   | Pagination (`page`/`limit`, max 100), filters `status`, `region`, `country` (comma-separated), `search` over name/displayName/description/city. Envelope meta: `{page, limit, total, totalPages}`. |
| `/api/v1/chapters`      | POST   | `chapters:create` | Validates parent existence; duplicate `name` → 409.                                                                                                                                                |
| `/api/v1/chapters/[id]` | GET    | `chapters:read`   | Full UI shape incl. `leadership` (ordered by role rank, then name) and `subChapterIds`.                                                                                                            |
| `/api/v1/chapters/[id]` | PATCH  | `chapters:update` | Partial update; `parentChapterId: null` clears the parent; self-parenting rejected (422).                                                                                                          |
| `/api/v1/chapters/[id]` | DELETE | `chapters:delete` | Cascades `chapter_members`; children get `parentChapterId = null`.                                                                                                                                 |

Role coverage: admin holds all `chapters:*`; staff and chapter officers hold read/update/manage; plain members hold none. Validation mirrors `src/components/dashboard/chapters/add-chapter-form.tsx` so form-valid payloads are API-accepted.

## Service layer

`src/lib/services/chapter.service.ts` — server-only, drizzle, RFC 9457:

- `listChapters({status?, region?, country?, search?, page?, limit?})` — server-side filters + pagination; members for listed chapters are fetched in one batched query so the hook's client-side leadership-role filter works without N+1.
- `getChapter(id)` — populates `leadership` and `subChapterIds`; null when missing.
- `createChapter(input, actorEmail)` / `updateChapter(id, input, actorEmail)` / `deleteChapter(id)` — unique-name violations map to 409, unknown parents and self-parenting to 422.
- `ChapterServiceError` carries a `ProblemDetails` payload; route handlers translate it (mirrors `job.service.ts` / `event-read.service.ts`).

## Dashboard UI

Pages under `src/app/dashboard/chapters/` (list, add, `[id]` detail), wired through `src/lib/hooks/use-chapters.ts` — rewritten on `apiFetch` against `/api/v1/chapters`; `mock-chapter-data.ts` was deleted with zero remaining imports. The hook keeps its previous surface (`chapters`, `statistics`, `filters`, `addChapter`, `updateChapter`, `deleteChapter`, `toggleChapterStatus`, …); statistics are now derived from fetched rows. `ModulePreviewBanner` stays in place until the flag flips.

## Tests

22 tests in `tests/chapters-api.test.ts`, run against the shared test database (`tests/helpers.ts`, real tables):

- Auth + per-action RBAC (admin/staff/member; staff lacks create/delete, member lacks all).
- Validation (422), duplicate-name conflict (409), unknown-parent (422).
- List envelope/meta, status/region/search filters, pagination — all scoped by a unique `RUN_ID` search so assertions measure exactly this run's delta.
- Hierarchy: parent/child linking, `subChapterIds`, self-parenting rejection, null-clears-parent.
- Delete semantics: member-row cascade, child set-null, double-delete 404.
- Service-layer round trip (including `establishedDate`/`memberCount` and `system:` actor email).

Run: `bun test tests/chapters-api.test.ts` (uses `DATABASE_URL` from `.env`).

## Known limitations

- `metrics`/`events`/`finances` are neutral placeholders (see Schema above).
- Roster management is DB-only for now: `chapter_members` rows are managed by seed/migration; the API surface for adding/removing officers is future work.
- `createdBy`/`updatedBy` store actor emails (matching the pre-D1 UI), not user FKs.

## Related decisions

- [ADR-0008](../adr/0008-module-maturity-gate.md) — the maturity gate this module will pass through when promoted.
- [ADR-0001](../adr/0001-one-authorization-helper.md) / [ADR-0002](../adr/0002-rfc9457-error-contract.md) — the API conventions followed here.
