# Awards module

**Maturity tier:** Flag-off (schema, API, and UI real; `config/features.ts` flip owned by the orchestrator, backlog D4)
**Gate authority:** [ADR-0008](../adr/0008-module-maturity-gate.md), [`docs/technical-specs/13-module-maturity-gate.md`](../technical-specs/13-module-maturity-gate.md)

---

## What it does

Awards tracks the association's recognition programs and their nomination pipelines: program identity, category and lifecycle status, judging criteria, open/close/award dates, and per-program nominations with review status. Backlog D4 replaced the stub `/dashboard/awards` pages with a real Drizzle schema, an authorized `/api/v1/awards` surface, and a de-mocked dashboard, following the C5/Finance and Chapters pattern.

## Feature flag and gating

- Registry: `MODULE_FLAGS.awards` in `config/features.ts` (§13.3 shape). The D4 commit delivers the schema/API/UI/tests but **does not flip the flag** — the orchestrator flips it post-commit, the same way C5 handled finance. Until then `ModulePreviewBanner` keeps marking `/dashboard/awards` as preview.
- Path mapping: `/dashboard/awards/**` resolves to the `awards` module via `MODULE_PATH_PREFIXES` in `config/features.ts`.

## Schema

Drizzle schema: `src/db/schema/awards.ts` (migration `drizzle/0007_awards.sql`); unlike chapters, the three pgEnums (`award_program_status`, `award_category`, `award_nomination_status`) are defined **inside** the module file.

| Table               | Purpose                                                                                                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `award_programs`    | Identity (`name` unique, `description`), `category` (enum), `status` (default `DRAFT`), `criteria` jsonb (default `[]`, free-text judging criteria), `openDate`/`closeDate`/`awardDate` timestamps, `createdBy`/`updatedBy` user FKs (set-null on user delete), audit timestamps.                                  |
| `award_nominations` | Nomination rows: `programId` FK (cascade delete), nullable `userId` FK (nominees may hold no platform account; set-null on user delete), `nomineeName`/`nomineeEmail`, `nominatorName`/`nominatorEmail`, `status` (default `PENDING`), `statement`, `createdBy`/`updatedBy` user FKs (set-null), audit timestamps. |

Statuses and categories are stored SCREAMING_SNAKE (`OPEN`, `UNDER_REVIEW`, `LIFETIME_ACHIEVEMENT`) and mapped to the UI's lowercase strings at the service boundary.

## API surface

All routes live under `src/app/api/v1/awards/**` and follow `docs/api/conventions.md`: `requirePermission` before any parsing ([ADR-0001](../adr/0001-one-authorization-helper.md)), zod validation, RFC 9457 problem errors ([ADR-0002](../adr/0002-rfc9457-error-contract.md)), success envelope.

| Route                             | Method | Permission      | Notes                                                                                                                                                                                                             |
| --------------------------------- | ------ | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/v1/awards/programs`         | GET    | `awards:read`   | Pagination (`page`/`limit`, max 100), filters `status`, `category` (comma-separated), `search` over name/description. Each program carries a batched `nominationCount`. Meta: `{page, limit, total, totalPages}`. |
| `/api/v1/awards/programs`         | POST   | `awards:create` | Duplicate `name` → 409; `openDate > closeDate` → 422.                                                                                                                                                             |
| `/api/v1/awards/programs/[id]`    | GET    | `awards:read`   | Full UI shape incl. `nominationCount`.                                                                                                                                                                            |
| `/api/v1/awards/programs/[id]`    | PATCH  | `awards:update` | Partial update (≥1 field); date fields accept ISO strings and `null` (clears the date).                                                                                                                           |
| `/api/v1/awards/programs/[id]`    | DELETE | `awards:delete` | Cascades `award_nominations`.                                                                                                                                                                                     |
| `/api/v1/awards/nominations`      | GET    | `awards:read`   | Pagination, filters `status` (comma-separated), `programId`, `search` over nominee/nominator name and email. Rows carry the parent `programName`.                                                                 |
| `/api/v1/awards/nominations`      | POST   | `awards:create` | Validates program existence (422) and, when supplied, `userId` existence (422).                                                                                                                                   |
| `/api/v1/awards/nominations/[id]` | GET    | `awards:read`   | Full UI shape.                                                                                                                                                                                                    |
| `/api/v1/awards/nominations/[id]` | PATCH  | `awards:update` | Review surface: `status` transitions and `statement`.                                                                                                                                                             |
| `/api/v1/awards/nominations/[id]` | DELETE | `awards:delete` | Removes the nomination row only; the parent program survives.                                                                                                                                                     |

Role coverage: admin holds all `awards:*`; staff holds read/update/manage; corporate/professional/student members hold `awards:read`; plain members hold none.

## Service layer

`src/lib/services/award.service.ts` — server-only, drizzle, RFC 9457:

- `listAwardPrograms({status?, category?, search?, page?, limit?})` / `listAwardNominations({status?, programId?, search?, page?, limit?})` — server-side filters + pagination; nomination counts for listed programs are fetched in one batched query (no N+1).
- `getAwardProgram(id)` / `getAwardNomination(id)` — null when missing.
- `createAwardProgram` / `updateAwardProgram` / `deleteAwardProgram` / `createAwardNomination` / `updateAwardNomination` / `deleteAwardNomination` — actor recorded via `createdBy`/`updatedBy` user FKs; unique-name violations map to 409, unknown program/user and bad date ranges to 422.
- `AwardServiceError` carries a `ProblemDetails` payload; route handlers translate it (mirrors `chapter.service.ts`). Exported zod schemas: `createAwardProgramSchema`, `updateAwardProgramSchema`, `createAwardNominationSchema`, `updateAwardNominationSchema` (date unions are `z.union([z.null(), z.coerce.date()])` — null branch first so `null` clears dates instead of coercing to the epoch).

## Dashboard UI

`src/app/dashboard/awards/programs/page.tsx` (program statistics cards, status/category filters, search, table) and `src/app/dashboard/awards/nominations/page.tsx` (review-queue summary, status/program filters, search, table), wired through a new `src/lib/hooks/use-awards.ts` — react-query over `/api/v1/awards/*` with wire→UI ISO-date mapping and client-side statistics derived from fetched rows. `ModulePreviewBanner` stays in place until the flag flips.

## Tests

27 tests in `tests/awards-api.test.ts`, run against the shared test database (`tests/helpers.ts`, real tables):

- Auth + per-action RBAC (admin/staff/member; staff lacks create/delete, member lacks all).
- Validation (422), duplicate-program-name conflict (409), unknown-program nomination (422).
- List envelope/meta, status/category/search filters, pagination — all scoped by a unique `RUN_ID` search so assertions measure exactly this run's delta.
- Nomination lifecycle: create, review-status PATCH, statement update, `programName` join, delete semantics (single row removed, double-delete 404, batched `nominationCount`).
- Program lifecycle: date clearing via `PATCH … null`, unique-name 409 on update, cascade delete of nominations.
- Service-layer round trip (actor FKs, batched counts).

Run: `bun test tests/awards-api.test.ts` (uses `DATABASE_URL` from `.env`).

## Known limitations

- Nominations are staff-managed only: there is no public self-nomination or member submission flow yet.
- No judging/scoring workflow, winner selection, or notification pipeline — `status` is the only review state.
- `criteria` is a free-text string list (jsonb), not structured rubrics.
- `nomineeEmail`/`nominatorEmail` are free-form text; nominees without a `userId` are unlinked from member records.

## Related decisions

- [ADR-0008](../adr/0008-module-maturity-gate.md) — the maturity gate this module will pass through when promoted.
- [ADR-0001](../adr/0001-one-authorization-helper.md) / [ADR-0002](../adr/0002-rfc9457-error-contract.md) — the API conventions followed here.
