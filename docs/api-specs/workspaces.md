# API Spec — Workspaces

Committee workspaces (backlog D5). All handlers wrap service work in
`handleWorkspaceRoute()` (`src/app/api/v1/workspaces/_lib.ts`), which maps
`WorkspaceServiceError` to its embedded problem and anything else to 500
`internal-error`.

Route files: `src/app/api/v1/workspaces/**`. Schemas and enum values:
`src/lib/services/workspace.service.ts`; UI shapes:
`src/types/committee.types.ts`. Permissions: `workspaces:read`,
`workspaces:create`, `workspaces:update`, `workspaces:delete`.

## Endpoints

| Method + Path                    | Permission          | Request                 | Success                                                  |
| -------------------------------- | ------------------- | ----------------------- | -------------------------------------------------------- |
| GET `/api/v1/workspaces`         | `workspaces:read`   | query below             | 200, items + `page`/`limit`/`total`/`totalPages` in meta |
| POST `/api/v1/workspaces`        | `workspaces:create` | `createWorkspaceSchema` | 201                                                      |
| GET `/api/v1/workspaces/{id}`    | `workspaces:read`   | —                       | 200; 404 unknown                                         |
| PATCH `/api/v1/workspaces/{id}`  | `workspaces:update` | `updateWorkspaceSchema` | 200                                                      |
| DELETE `/api/v1/workspaces/{id}` | `workspaces:delete` | —                       | 200, `{ id, deleted: true }`; 404 unknown                |

List query (unvalidated beyond pagination): `status`, `type`, `memberRole`
(each comma-separated; unknown values ignored — `memberRole` matches
workspaces whose member roster holds any of the given roles),
`createdAfter`/`createdBefore` (inclusive date bounds on `createdAt`;
unparseable values ignored), `search` (ilike over `name`/`description`),
plus `page`/`limit` (`parsePagination`: positive ints only, defaults 1/20;
the service clamps `limit` to 1–100). Newest first.

Enum values: `type` ∈ `general`, `project`, `document`, `discussion`,
`meeting`; `status` ∈ `active`, `archived`, `locked`; member roles ∈
`chair`, `co_chair`, `secretary`, `treasurer`, `member`, `advisor`;
permissions ∈ `view`, `edit`, `delete`, `upload`, `download`,
`manage_members`, `manage_settings`.

`createWorkspaceSchema`: required `name` (3–50) and `settings`
(`isPublic`/`allowGuestAccess`/`requireApproval`/`enableNotifications`
booleans, `autoArchiveDays` int 1–1095, `maxFileSize` int 1–1000,
`allowedFileTypes` ≥1 non-empty strings, `memberPermissions` ≥1 × {
`role` (role enum), `permissions` (array of permission enum) }). Optional
`description` (≤2000), `type` (default `general`), `status` (default
`active`), `committeeId` (UUID; `""` or `null` normalize to null — when
set, the committee must exist, else 422 `validation-error`).

`updateWorkspaceSchema`: any non-empty subset of the same fields; `type`
and `status` are plain optionals (not the defaulted `.partial()`), so an
empty PATCH cannot reset them.

## Service rules

- Workspace `name` is unique; duplicates surface as 409 `conflict` on
  create and update.
- Member rosters live in a jsonb blob; the list filter matches any roster
  entry's `role`.

## Errors

401/403 auth; 404 `not-found` (unknown workspace); 409 `conflict`
(duplicate name); 422 `validation-error` (incl. non-JSON body, unknown
committee reference); 500 `internal-error`.
