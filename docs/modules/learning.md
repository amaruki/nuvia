# Learning & Development module

**Maturity tier:** Flag-off (schema, API, and UI real; `config/features.ts` flip owned by the orchestrator, backlog D3)
**Gate authority:** [ADR-0008](../adr/0008-module-maturity-gate.md), [`docs/technical-specs/13-module-maturity-gate.md`](../technical-specs/13-module-maturity-gate.md)

This document is the module's public-surface documentation required for the Promoted tier (`docs/PRINCIPLES.md`, "Easy to customize": a module documents its schema, API, and feature flag well enough that a developer can extend it without reading internal code first).

## What it does

Learning & Development manages the association's course catalogue and the certificates it issues: courses carry a description, category, level, price, instructor, and a curriculum of modules/lessons (plus reviews and feature bullets) stored as UI metadata; certificates are issued against a course and denormalize everything the printed certificate needs (course title, instructor name/signature, student name/email, grade) so they survive later course edits or deletion. The dashboard presents the catalogue with filters and tabs, per-course detail, an admin area for course CRUD with derived analytics, the certificate gallery with a verification view, and a management table for revoking/restoring certificates. The mock-data hooks that backed the preview UI were deleted, not left behind flags, and every stat the pages show is derived from fetched rows (the Revenue card had no backing data and was removed rather than faked).

## Feature flag and gating

- Registry: `MODULE_FLAGS.learning` in `config/features.ts` (:51, §13.3 shape). The D3 commit delivers the schema/API/UI/tests but **does not flip the flag** — the orchestrator flips it post-commit, the same way D1/D2 handled chapters/committees. Until then `ModulePreviewBanner` keeps marking `/dashboard/learning` as preview (it returns null on its own once the flag is on — no banner removal code needed).
- Path mapping: `/dashboard/learning/**` resolves to the `learning` module via `MODULE_PATH_PREFIXES` in `config/features.ts` (:129).
- Role gate (separate mechanism, `src/proxy.ts` + `src/lib/navigation-data.ts`): the Learning section is visible to roles carrying `learning:read`.
- API authorization is per-action and permission-based (below) — reaching a page through the role gate does not grant any API permission by itself.

## Schema

Drizzle schema: `src/db/schema/learning.ts`. UI-only documents (color, features, modules, reviews) travel as `jsonb` under `metadata.ui` — the same technique content/events use — and the instructor is denormalized as flat columns on the course.

| Table          | Drizzle constant (`learning.ts`) | Landed in                                      |
| -------------- | -------------------------------- | ---------------------------------------------- |
| `courses`      | `course` (:36)                   | `drizzle/0009_slimy_mole_man.sql` (backlog D3) |
| `certificates` | `certificate` (:77)              | `drizzle/0009_slimy_mole_man.sql` (backlog D3) |

Key shape: `courses.level` uses the `course_level` pgEnum (:32) and is indexed together with `category` for list filters; `duration` is a display label derived from the curriculum on create when omitted (`computeDuration` sums lesson durations). `certificates.verification_code` carries a unique constraint; `course_id` is a nullable FK with `ON DELETE SET NULL` so revoking or deleting a course never destroys issued certificates — the denormalized `course_name`/`instructor_*`/`image` columns keep the record printable. `status` uses the `certificate_status` pgEnum (:34) and is indexed along with `course_id` and `student_email`. `created_by`/`updated_by`/`issued_by` are actor identifiers (`text`, better-auth email ids).

## API surface

All routes live under `src/app/api/v1/learning/**` and follow `docs/api/conventions.md`: `requirePermission` first (ADR-0001), zod validation, RFC 9457 problem errors (ADR-0002), success envelope.

| Endpoint                             | Method(s) | Permission        |
| ------------------------------------ | --------- | ----------------- |
| `/api/v1/learning/courses`           | GET       | `learning:read`   |
| `/api/v1/learning/courses`           | POST      | `learning:create` |
| `/api/v1/learning/courses/[id]`      | GET       | `learning:read`   |
| `/api/v1/learning/courses/[id]`      | PATCH     | `learning:update` |
| `/api/v1/learning/courses/[id]`      | DELETE    | `learning:delete` |
| `/api/v1/learning/certificates`      | GET       | `learning:read`   |
| `/api/v1/learning/certificates`      | POST      | `learning:create` |
| `/api/v1/learning/certificates/[id]` | GET       | `learning:read`   |
| `/api/v1/learning/certificates/[id]` | PATCH     | `learning:update` |

GET course list supports `page`, `limit` (≤100), `search` (ilike over title/category), `category`, and `level`; GET certificate list supports `page`, `limit`, `search` (ilike over course name/student name/email/verification code), `status`, and `courseId`. Both return the success envelope with `page`/`limit`/`total`/`totalPages` meta. Issuing a certificate (`POST /certificates`) validates the course exists (400 business-logic problem otherwise) and generates a unique verification code shaped `SLUG-YEAR-NNNN` (course-title slug + issue year + random digits, retried on collision); PATCH on a certificate accepts `{ status: "active" | "revoked" }` only.

Permission holders among predefined roles (`src/types/role.types.ts`): `superadmin` (all permissions), `admin` (`learning:create/read/update/delete/manage/approve`, :287-292), `staff` (`learning:read/update/manage`, :342-344 — no create/delete), `member_corporate`/`member_professional`/`member_student` (`learning:read` only, :474/:491/:507). The plain `member` role carries no `learning:*` permission; custom roles may.

## Services

- `src/lib/services/learning.service.ts` — the whole module's data access: zod create/update/issue schemas, list with filters/pagination (`paginate`, default limit 20, max 100), get/create/update/delete for courses, issue/get/update/list for certificates, `computeDuration` (lesson-duration summing), the verification-code builder, and the row→DTO mappers that hydrate `metadata.ui` (color/features/modules/reviews) with safe fallbacks and map the SCREAMING_SNAKE DB enums to UI casing. Errors are `LearningServiceError` carrying RFC 9457 problem details; PG `23505` maps to a 409 conflict.

Routes map service errors in `src/app/api/v1/learning/_lib.ts`: `LearningServiceError.problemDetails` → `problemResponse`, anything else → 500.

## Dashboard UI

Nine pages under `src/app/dashboard/learning/`, wired to the API through `src/lib/hooks/use-learning-courses.ts` and `src/lib/hooks/use-learning-certificates.ts` (react-query over `apiFetch`, backlog D3 — the `courses/_data` and `courses/_types` mock files were deleted once their last importers moved; shared types live in `src/types/learning.types.ts`):

| Page                  | Path                                                 |
| --------------------- | ---------------------------------------------------- |
| Course catalogue      | `/dashboard/learning/courses`                        |
| Course detail         | `/dashboard/learning/courses/[courseId]`             |
| Admin — courses       | `/dashboard/learning/admin`                          |
| Admin — create course | `/dashboard/learning/admin/create`                   |
| Admin — edit course   | `/dashboard/learning/admin/[courseId]/edit`          |
| Certifications        | `/dashboard/learning/certifications`                 |
| Certificate view      | `/dashboard/learning/certifications/[certificateId]` |
| Certificate mgmt      | `/dashboard/learning/certificate-management`         |
| Settings              | `/dashboard/learning/settings` (presentation-only)   |

The list hooks fetch pages (`limit=100`) and expose plain async mutations (`createCourse`/`updateCourse`/`deleteCourse`, `revokeCertificate`) that toast on success/error and invalidate the `["learning", "courses" | "certificates"]` query keys; wire dates are hydrated to display labels in the mapper. Admin analytics (total courses, total students) are reduced from fetched rows — nothing is invented; loading/error/empty states are honest and distinguish "no data yet" from "no filter matches". The certificate card badge reflects `status` ("Verified"/"Revoked"), and the certificate view prints the real `studentName`.

## Tests

27 tests in one file, run against the shared test database (real tables, real constraints):

| File                         | Tests | Covers                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/learning-api.test.ts` | 27    | RBAC matrix (admin/staff/member: member holds no `learning:*`, staff no create/delete), create/issue validation (422), unknown-course issuance (400), verification-code shape, denormalized course data, list filters with pagination meta, revoke/restore, course delete set-nulling `certificate.course_id`, service round-trip and `computeDuration` |

Run: `bun test tests/learning-api.test.ts` (needs the test Postgres/Redis stack, `compose.test.yml`). The suite is baseline-delta and self-cleaning: every row is `RUN_ID`-isolated and removed in `afterAll`.

## Accessibility

WCAG 2.2 AA is part of the promotion bar for an enabled module. The learning pages pass the repo-wide `jsx-a11y` oxlint gate statically. They are not yet in the axe smoke page list (`scripts/a11y-smoke.ts`) — the enablement pass (backlog E1) adds `/dashboard/learning/**` to the list and records the run. Record: [`docs/accessibility/wcag-2.2-aa-enabled-modules.md`](../accessibility/wcag-2.2-aa-enabled-modules.md).

## Promotion bar evidence

| Criterion (ADR-0008 tier 4)            | Evidence                                                                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Real Drizzle schema                    | `src/db/schema/learning.ts`; migration `drizzle/0009_slimy_mole_man.sql` (backlog D3)                             |
| Authorized API                         | 9 handlers under `src/app/api/v1/learning/**`, each calling `requirePermission("learning:*")` before body parsing |
| Tests                                  | `tests/learning-api.test.ts` — 27 tests against the real tables                                                   |
| Documentation                          | This document                                                                                                     |
| WCAG 2.2 AA pass (enabled-module gate) | Static `jsx-a11y` gate passes; axe smoke run recorded by the E1 enablement pass (see Accessibility)               |
| Flag on                                | `config/features.ts` `MODULE_FLAGS.learning = true` — pending, flipped by the orchestrator post-commit            |

## Known limitations

- `progress` is a neutral `0` for every course: there is no enrollment/completion tracking yet (staged like the chapters metrics).
- The catalogue's "Saved" tab has no backing store and renders an honest empty state.
- Certificate PDF download is not implemented; the button shows an honest "not available yet" toast.
- Reviews/features/color live in `metadata.ui` and are managed through course create/update only — no separate review API.
- Instructors are flat columns on the course; aggregate instructor counts are omitted until an instructor entity exists.

## Related decisions

- [ADR-0008](../adr/0008-module-maturity-gate.md) — the maturity gate itself.
- `docs/technical-specs/13-module-maturity-gate.md` — binding tier definitions (§13.3 registry shape, §13.4 promotion order).
