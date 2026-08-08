# API Spec — Learning

Learning & development / CPD: courses and certificates (backlog D3). All
handlers wrap service work in `handleLearningRoute()`
(`src/app/api/v1/learning/_lib.ts`), which maps `LearningServiceError` to
its embedded problem and anything else to 500 `internal-error`.

Route files: `src/app/api/v1/learning/**`. Schemas:
`src/lib/services/learning/`; UI shapes:
`src/types/learning.types.ts`. Permissions: `learning:read`,
`learning:create`, `learning:update`, `learning:delete`.

## Courses

| Method + Path                          | Permission        | Request              | Success                                                  |
| -------------------------------------- | ----------------- | -------------------- | -------------------------------------------------------- |
| GET `/api/v1/learning/courses`         | `learning:read`   | query below          | 200, items + `page`/`limit`/`total`/`totalPages` in meta |
| POST `/api/v1/learning/courses`        | `learning:create` | `createCourseSchema` | 201                                                      |
| GET `/api/v1/learning/courses/{id}`    | `learning:read`   | —                    | 200; 404 unknown                                         |
| PATCH `/api/v1/learning/courses/{id}`  | `learning:update` | `updateCourseSchema` | 200                                                      |
| DELETE `/api/v1/learning/courses/{id}` | `learning:delete` | —                    | 200, `{ id, deleted: true }`; 404 unknown                |

List query (unvalidated beyond pagination): `search` (ilike over
`title`/`description`/`category`), `category` (exact match), `level`
(`Beginner`, `Intermediate`, `Advanced`; unknown values ignored), plus
`page`/`limit` (`parsePagination`: positive ints only, defaults 1/20; the
service clamps `limit` to 1–100).

`createCourseSchema`: required `title` (2–200), `description` (10–2000),
`category` (1–100), `level` (`Beginner`, `Intermediate`, `Advanced`).
Optional `longDescription` (≤8000), `duration` (≤50; derived from the
module lessons when omitted), `students` (int ≥0, default 0), `rating`
(0–5, default 0), `price` (≥0), `image` (URL ≤2048 or `""`), `color`
(≤200; falls back to a default gradient), `instructor` (`name` 1–120,
optional `role` ≤120, `bio` ≤4000, `avatar`/`signature` URL or `""`),
`modules` (≤50 × { `title` 1–200, `lessons` ≤200 × { `title` 1–200,
`duration` 1–50, `type` ∈ `video`/`article`/`quiz`, optional `id`,
`isCompleted` } }, optional ids synthesized server-side), `reviews` (≤100),
`features` (≤30 × ≤300). `color`/`features`/`modules`/`reviews` are UI-only
and round-trip through `metadata.ui`.

`updateCourseSchema`: any non-empty subset of the same fields; the derived
`duration` is recomputed when `modules` change without an explicit
`duration`. Deleting a course leaves issued certificates intact (they keep
their denormalized record).

## Certificates

| Method + Path                              | Permission        | Request                   | Success                                                  |
| ------------------------------------------ | ----------------- | ------------------------- | -------------------------------------------------------- |
| GET `/api/v1/learning/certificates`        | `learning:read`   | query below               | 200, items + `page`/`limit`/`total`/`totalPages` in meta |
| POST `/api/v1/learning/certificates`       | `learning:create` | `issueCertificateSchema`  | 201                                                      |
| GET `/api/v1/learning/certificates/{id}`   | `learning:read`   | —                         | 200; 404 unknown                                         |
| PATCH `/api/v1/learning/certificates/{id}` | `learning:update` | `updateCertificateSchema` | 200; 404 unknown                                         |

There is no DELETE for certificates — revocation is the PATCH `status`
transition.

List query (unvalidated beyond pagination): `search` (ilike over
`studentName`/`studentEmail`/`courseName`/`verificationCode`), `status`
(`active`, `revoked`; unknown values ignored), `courseId` (exact match),
plus `page`/`limit` (same parsing/clamping as courses). Newest first.

`issueCertificateSchema`: required `courseId` (UUID), `studentName` (1–120),
`studentEmail` (email ≤320); optional `grade` (≤20), `expiryDate` (ISO
datetime). The course must exist — issuing for an unknown course answers
400 `business-logic-error`. The certificate denormalizes course title,
image, and instructor from the course row, and the service generates a
verification code (`ABCD-EFGH-<year>-<random>` style); three retries on
code collision, then 409 `conflict`.

`updateCertificateSchema`: required `status` ∈ `active`, `revoked` — the
revoke/restore switch.

## Errors

401/403 auth; 404 `not-found` (unknown course/certificate); 409 `conflict`
(course identity collision, verification-code exhaustion); 400
`business-logic-error` (certificate for an unknown course); 422
`validation-error` (incl. non-JSON body); 500 `internal-error`.
