# API Spec — Awards

Award programs and nominations (backlog D4). All handlers wrap service work
in `handleAwardRoute()` (`src/app/api/v1/awards/_lib.ts`), which maps
`AwardServiceError` to its embedded problem and anything else to 500
`internal-error`.

Route files: `src/app/api/v1/awards/**`. Schemas:
`src/lib/services/award.service.ts`; UI shapes: `src/types/award.types.ts`.
Permissions: `awards:read`, `awards:create`, `awards:update`,
`awards:delete`.

## Programs

| Method + Path                         | Permission      | Request                    | Success                                                  |
| ------------------------------------- | --------------- | -------------------------- | -------------------------------------------------------- |
| GET `/api/v1/awards/programs`         | `awards:read`   | query below                | 200, items + `page`/`limit`/`total`/`totalPages` in meta |
| POST `/api/v1/awards/programs`        | `awards:create` | `createAwardProgramSchema` | 201                                                      |
| GET `/api/v1/awards/programs/{id}`    | `awards:read`   | —                          | 200; 404 unknown                                         |
| PATCH `/api/v1/awards/programs/{id}`  | `awards:update` | `updateAwardProgramSchema` | 200                                                      |
| DELETE `/api/v1/awards/programs/{id}` | `awards:delete` | —                          | 200, `{ id, deleted: true }`; 404 unknown                |

List query (unvalidated beyond pagination): `status`, `category` (each
comma-separated; unknown values ignored), `search` (ilike over
`name`/`description`), plus `page`/`limit` (`parsePagination`: positive
ints only, defaults 1/20; the service clamps `limit` to 1–100). Listed
programs carry their live nomination count.

`createAwardProgramSchema`: required `name` (3–80); optional `description`
(≤2000), `category` (default `achievement`; `achievement`, `service`,
`leadership`, `innovation`, `scholarship`, `lifetime_achievement`),
`status` (default `draft`; `draft`, `open`, `closed`, `archived`),
`criteria` (≤20 × 3–500, default `[]`), `openDate`/`closeDate`/`awardDate`
(coerced dates). Refinement: `openDate` ≤ `closeDate` when both are given
(reported on `closeDate`).

`updateAwardProgramSchema`: any non-empty subset of the same fields;
`description` and the three dates are additionally nullable (send `null`
to clear). The effective nomination window is re-validated after the patch
— a resulting `openDate` > `closeDate` answers 422 `validation-error`.

## Nominations

| Method + Path                            | Permission      | Request                       | Success                                                  |
| ---------------------------------------- | --------------- | ----------------------------- | -------------------------------------------------------- |
| GET `/api/v1/awards/nominations`         | `awards:read`   | query below                   | 200, items + `page`/`limit`/`total`/`totalPages` in meta |
| POST `/api/v1/awards/nominations`        | `awards:create` | `createAwardNominationSchema` | 201                                                      |
| GET `/api/v1/awards/nominations/{id}`    | `awards:read`   | —                             | 200; 404 unknown                                         |
| PATCH `/api/v1/awards/nominations/{id}`  | `awards:update` | `updateAwardNominationSchema` | 200                                                      |
| DELETE `/api/v1/awards/nominations/{id}` | `awards:delete` | —                             | 200, `{ id, deleted: true }`; 404 unknown                |

List query (unvalidated beyond pagination): `status` (comma-separated;
`pending`, `under_review`, `approved`, `rejected` — unknown values
ignored), `programId` (exact match), `search` (ilike over
`nomineeName`/`nomineeEmail`/`nominatorName`), plus `page`/`limit` (same
parsing/clamping as programs).

`createAwardNominationSchema`: required `programId` (UUID), `nomineeName`
(2–120), `nomineeEmail` (email), `nominatorName` (2–120),
`nominatorEmail` (email); optional `userId` (UUID; `""` or `null`
normalize to null for nominees without an account — when set, the user
must exist), `status` (default `pending`), `statement` (≤5000). Unknown
`programId`/`userId` answer 422 `validation-error` with an `errors[]`
entry on the offending field.

`updateAwardNominationSchema`: nominations are edited through review —
optional `status` (enum above) and `statement` (≤5000, nullable); at least
one field required.

## Service rules

- Program `name` is unique; duplicates surface as 409 `conflict` on create
  and update.
- DELETE on a program cascades its nominations (FK `onDelete` cascade).

## Errors

401/403 auth; 404 `not-found` (unknown program/nomination); 409 `conflict`
(duplicate program name); 422 `validation-error` (incl. non-JSON body,
unknown program/user references, invalid nomination window); 500
`internal-error`.
