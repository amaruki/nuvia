# API Spec — Committees

Committee CRUD with charters, contact info, and sub-committee hierarchy
(backlog D2). All handlers wrap service work in `handleCommitteeRoute()`
(`src/app/api/v1/committees/_lib.ts`), which maps `NotFoundError` to 404
`not-found`, a `BusinessLogicError` whose code is `COMMITTEE_NAME_TAKEN` or
`COMMITTEE_PARENT_SELF` to 409 `conflict`, any other `BusinessLogicError`
to 400 `business-logic-error`, and anything else to 500 `internal-error`.

Route files: `src/app/api/v1/committees/**`. Schemas and enum values:
`src/lib/services/committee/schemas.ts`; UI shapes:
`src/types/committee.types.ts`. Permissions: `committees:read`,
`committees:create`, `committees:update`, `committees:delete`.

## Endpoints

| Method + Path                    | Permission          | Request                 | Success                                                  |
| -------------------------------- | ------------------- | ----------------------- | -------------------------------------------------------- |
| GET `/api/v1/committees`         | `committees:read`   | query below             | 200, items + `page`/`limit`/`total`/`totalPages` in meta |
| POST `/api/v1/committees`        | `committees:create` | `createCommitteeSchema` | 201                                                      |
| GET `/api/v1/committees/{id}`    | `committees:read`   | —                       | 200; 404 unknown or non-UUID id                          |
| PATCH `/api/v1/committees/{id}`  | `committees:update` | `updateCommitteeSchema` | 200; 404 unknown or non-UUID id                          |
| DELETE `/api/v1/committees/{id}` | `committees:delete` | —                       | 200, `{ id, deleted: true }`; 404 unknown or non-UUID id |

List query: `status`, `type`, `authorityLevel`, `leadershipRole`
(comma-separated enum lists — unknown values dropped, empties mean "no
filter"; `leadershipRole` matches committees with an **active** member
holding one of the roles), `search` (ilike over `displayName`/`purpose`),
`memberCountMin`/`memberCountMax` (non-negative ints, compared against the
live member roster), plus `page`/`limit` (`parsePagination`: positive ints
only, defaults 1/20; the service clamps `limit` to 1–100). Results are
ordered newest first.

Enum values: `status` ∈ `active`, `inactive`, `pending`, `suspended`;
`type` ∈ `executive`, `functional`, `special_interest`, `ad_hoc`,
`standing`; `authorityLevel` ∈ `advisory`, `operational`, `strategic`,
`executive`; roles ∈ `chair`, `co_chair`, `secretary`, `treasurer`,
`member`, `advisor`.

`createCommitteeSchema`: required `name` (3–50), `displayName` (3–100),
`purpose` (10–500), `charter` (`missionStatement` 10–500,
`responsibilities` ≥1 strings each ≥5, `authorityLevel` (enum above),
`decisionMakingProcess` 10–500, `reportingStructure` 10–500, optional
`termLimits` with `chairTerm`/`memberTerm` ints 1–60 and `maxTerms` int
1–10), `contactInfo` (`email` ≤320; optional `phone` ≤50,
`meetingLocation` ≤255, `virtualMeetingLink`/`website` URL ≤2048 or `""`).
Optional `description`, `status` (default `pending`), `type` (default
`functional`), `parentCommitteeId` (UUID or `""`).

`updateCommitteeSchema`: any non-empty subset of the same fields, with
`parentCommitteeId` additionally nullable (send `null`/`""` to detach).

## Service rules

- Committee `name` is unique: duplicates (`COMMITTEE_NAME_TAKEN`) answer
  409 `conflict` on create and update.
- Setting a committee as its own parent (`COMMITTEE_PARENT_SELF`) answers
  409 `conflict`; pointing at a nonexistent parent
  (`COMMITTEE_PARENT_NOT_FOUND`) answers 400 `business-logic-error`.
- Charter review dates are managed server-side: create stamps
  `approvalDate`/`lastReviewed` with now and `nextReview` one year out;
  update preserves the original `approvalDate`.
- Blank `description`/contact strings are normalized to null.
- DELETE cascades the committee's member rows.

## Errors

401/403 auth; 404 `not-found` (unknown committee, incl. non-UUID ids);
409 `conflict` (duplicate name, self-parent); 400 `business-logic-error`
(unknown parent committee); 422 `validation-error` (incl. non-JSON body);
500 `internal-error`.
