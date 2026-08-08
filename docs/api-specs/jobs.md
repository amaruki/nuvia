# API Spec — Jobs

Job postings and applications (backlog B6). All handlers wrap service work
in `handleJobRoute()` (`src/app/api/v1/jobs/_lib.ts`), which maps
`JobServiceError` to its embedded problem and anything else to 500
`internal-error`.

Route files: `src/app/api/v1/jobs/**`. Schemas:
`src/lib/services/job.schemas.ts`; enum values: `src/types/jobs.types.ts`.
Permissions: `jobs:read`, `jobs:create`, `jobs:update`, `jobs:delete`,
`jobs:manage`; plain applicants act under `requireRole("user")`.

## Postings

| Method + Path              | Permission    | Request                  | Success                                                  |
| -------------------------- | ------------- | ------------------------ | -------------------------------------------------------- |
| GET `/api/v1/jobs`         | `jobs:read`   | query below              | 200, items + `page`/`limit`/`total`/`totalPages` in meta |
| POST `/api/v1/jobs`        | `jobs:create` | `createJobPostingSchema` | 201                                                      |
| GET `/api/v1/jobs/{id}`    | `jobs:read`   | —                        | 200; 404 unknown                                         |
| PATCH `/api/v1/jobs/{id}`  | `jobs:update` | `updateJobPostingSchema` | 200                                                      |
| DELETE `/api/v1/jobs/{id}` | `jobs:delete` | —                        | 200                                                      |

List query (unvalidated beyond pagination): `status`, `search`, `categoryId`,
`typeId`, `locationId`, `companyId`, `isFeatured=true|false`, plus
`page`/`limit` (`parsePagination`: positive ints only, defaults 1/20).

`createJobPostingSchema` (`jobPostingFields` + salary-consistency refine):
required `title` (3–200), `description` (min 10), `categoryId`, `typeId`,
`locationId`, `companyId` (UUIDs), `employmentType` (`FULL_TIME`,
`PART_TIME`, `CONTRACT`, `FREELANCE`, `INTERNSHIP`, `TEMPORARY`,
`VOLUNTEER`), `experienceLevel` (`ENTRY_LEVEL`, `JUNIOR`, `MID_LEVEL`,
`SENIOR`, `LEAD`, `EXECUTIVE`, `NOT_SPECIFIED`); optional `requirements` /
`responsibilities` / `benefits` (≤10000 each), `status` (default `DRAFT`;
`DRAFT`, `PUBLISHED`, `ARCHIVED`, `CLOSED`, `FILLED`, `CANCELLED`),
`salaryMin` / `salaryMax` (0–99,999,999.99; max ≥ min enforced), `currency`
(3-letter ISO, default `USD`), `isRemote`, `isFeatured` (defaults false),
`applicationDeadline` (coerced date), `tags` (≤20 × 1–50).

`updateJobPostingSchema`: any non-empty subset of the same fields, same
salary refinement. Slug and counters are never user-editable.

## Applications

| Method + Path                                          | Permission                                     | Request                         | Success                                                                                                                                            |
| ------------------------------------------------------ | ---------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET `/api/v1/jobs/{id}/applications`                   | `jobs:read`                                    | —                               | 200, applications for the posting                                                                                                                  |
| POST `/api/v1/jobs/{id}/applications`                  | role `user` (any authenticated member)         | `createJobApplicationSchema`    | 201                                                                                                                                                |
| GET `/api/v1/jobs/applications`                        | `jobs:read`                                    | —                               | 200, all applications (admin view)                                                                                                                 |
| GET `/api/v1/jobs/applications/mine`                   | role `user`                                    | —                               | 200, the caller's applications                                                                                                                     |
| GET `/api/v1/jobs/{id}/applications/{applicationId}`   | `jobs:read`, else self-service fallback        | —                               | 200; applicants may read **their own** application without `jobs:read`; other people's applications without the permission answer the original 403 |
| PATCH `/api/v1/jobs/{id}/applications/{applicationId}` | `jobs:update` or `jobs:manage`, else applicant | `updateApplicationStatusSchema` | 200                                                                                                                                                |

`createJobApplicationSchema` (all optional): `coverLetter` (≤10000),
`portfolioUrl` (URL), `salaryExpectation` (>0, ≤99,999,999.99),
`availability` (≤200).

`updateApplicationStatusSchema`: required `status` ∈ `PENDING`, `REVIEWING`,
`SHORTLISTED`, `REJECTED`, `INTERVIEWING`, `OFFERED`, `HIRED`, `WITHDRAWN`;
optional `notes` (≤2000). Privileged actors (`jobs:update`/`jobs:manage`) may
set any status; plain applicants are restricted by the service layer to
withdrawing their own application.

## Reference data

| Method + Path           | Permission  | Request | Success                                                               |
| ----------------------- | ----------- | ------- | --------------------------------------------------------------------- |
| GET `/api/v1/jobs/meta` | `jobs:read` | —       | 200, `{ categories, types, locations, companies }` for form dropdowns |

## Errors

401/403 auth; 404 `not-found` (unknown posting/application); 409 `conflict`
(service rule collisions); 422 `validation-error` (incl. non-JSON body);
500 `internal-error`.
