# API Spec — Chapters

Regional chapter CRUD (backlog D1). All handlers wrap service work in
`handleChapterRoute()` (`src/app/api/v1/chapters/_lib.ts`), which maps
`ChapterServiceError` to its embedded problem and anything else to 500
`internal-error`.

Route files: `src/app/api/v1/chapters/**`. Schemas:
`src/lib/services/chapter/schemas.ts`; UI shapes: `src/types/chapter.types.ts`.
Permissions: `chapters:read`, `chapters:create`, `chapters:update`,
`chapters:delete`.

## Endpoints

| Method + Path                  | Permission        | Request               | Success                                                  |
| ------------------------------ | ----------------- | --------------------- | -------------------------------------------------------- |
| GET `/api/v1/chapters`         | `chapters:read`   | query below           | 200, items + `page`/`limit`/`total`/`totalPages` in meta |
| POST `/api/v1/chapters`        | `chapters:create` | `createChapterSchema` | 201                                                      |
| GET `/api/v1/chapters/{id}`    | `chapters:read`   | —                     | 200; 404 unknown                                         |
| PATCH `/api/v1/chapters/{id}`  | `chapters:update` | `updateChapterSchema` | 200                                                      |
| DELETE `/api/v1/chapters/{id}` | `chapters:delete` | —                     | 200, `{ id, deleted: true }`; 404 unknown                |

List query (unvalidated beyond pagination): `status`, `region`, `country`
(each comma-separated; unknown status values are ignored), `search`
(ilike over `name`/`displayName`/`city`/`region`), plus `page`/`limit`
(`parsePagination`: positive ints only, defaults 1/20; the service clamps
`limit` to 1–100). Results are ordered by `name`.

`createChapterSchema`: required `name` (3–50), `displayName` (3–100),
`location` (`address` min 5, `city`/`state`/`country` min 2, `postalCode`
min 3, `timezone` min 1, `region` min 2; optional `coordinates` with
`latitude` −90–90 and `longitude` −180–180), `contactInfo` (`email`,
`address` min 5; optional `phone` ≤50, `website` URL or `""`,
`mailingAddress` ≤200), `socialMedia` (optional `facebook`/`twitter`/
`linkedin`/`instagram`/`youtube`, each URL or `""`), and `settings`
(`allowOnlineRegistration`/`requireApproval`/`autoRenewMembership`/
`sendReminders`/`publicDirectory` booleans, `membershipDues` ≥0,
`meetingFrequency` ∈ `weekly`, `biweekly`, `monthly`, `quarterly`; optional
`meetingDay` ≤20, `meetingTime` ≤10). Optional `description` (≤2000),
`status` (default `pending`; `active`, `inactive`, `pending`, `suspended`),
`parentChapterId` (UUID; `""` or `null` normalize to null), `memberCount`
(int ≥0), `establishedDate` (coerced date).

`updateChapterSchema`: any non-empty subset of the same fields; `status` is
a plain optional (not the defaulted `.partial()`), so an empty PATCH cannot
reset it.

## Service rules

- `name` is unique; duplicates surface as 409 `conflict` on create and
  update.
- A provided `parentChapterId` must reference an existing chapter and may
  not be the chapter itself — both cases answer 422 `validation-error` with
  an `errors[]` entry on `parentChapterId`.
- DELETE cascades the chapter's `chapter_members` rows.
- Rows map to the UI `Chapter` shape; metrics/events/finances fields have
  no backing tables yet and render as neutral defaults.

## Errors

401/403 auth; 404 `not-found` (unknown chapter); 409 `conflict` (duplicate
name); 422 `validation-error` (incl. non-JSON body, parent checks); 500
`internal-error`.
