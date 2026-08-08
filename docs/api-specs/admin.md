# API Spec — Admin

Role and user administration for the admin dashboard. Routes:
`src/app/api/v1/admin/**`. These routes build errors with the `problems.*`
factory helpers from `src/lib/http.ts` and write audit rows to the
`auth_log` table. Permissions come from the `users:*` family defined in
`src/types/role.types.ts`.

## Permissions catalog

| Method + Path                   | Permission   | Request                                                | Success                                                         |
| ------------------------------- | ------------ | ------------------------------------------------------ | --------------------------------------------------------------- |
| GET `/api/v1/admin/permissions` | `users:read` | `?groupBy=module\|category\|flat` (default `category`) | 200, the full `AVAILABLE_PERMISSIONS` list grouped as requested |

## Roles

| Method + Path              | Permission     | Request                       | Success                      |
| -------------------------- | -------------- | ----------------------------- | ---------------------------- |
| GET `/api/v1/admin/roles`  | `users:read`   | `?includeStats=true` optional | 200 `{ roles, statistics? }` |
| POST `/api/v1/admin/roles` | `users:create` | `createRoleSchema`            | 200 `{ role }`               |

`createRoleSchema` (inline in the route): `name` (3–100, trimmed,
`^[a-z][a-z0-9_-]*$`), `description` (≤500), `permissions` (≥1, from the
`AVAILABLE_PERMISSIONS` enum, no duplicates). Guards beyond validation:

- 409 `conflict` — name shadows a predefined role, or a role with the name
  already exists (also on unique-constraint race).
- 403 `insufficient-permission` — via `canGrantPermissions`: a role may only
  carry permissions its creator already holds.

## Users

| Method + Path              | Permission     | Request            | Success                                                            |
| -------------------------- | -------------- | ------------------ | ------------------------------------------------------------------ |
| GET `/api/v1/admin/users`  | `users:read`   | query below        | 200, users with role info (+ permissions when `includeRoles=true`) |
| POST `/api/v1/admin/users` | `users:create` | `createUserSchema` | 200 `{ user }`                                                     |

List query (loosely parsed, no zod): `page` (≥1, default 1), `limit`
(1–100, default 20), `search` (case-insensitive across username/email/name),
`role`, `sortBy` (`createdAt` default and the other mapped columns),
`sortOrder` (`asc`/`desc`, default `desc`), `includeRoles=true`.

`createUserSchema` (inline): `username` (3–30, `[a-zA-Z0-9_]+`, lowercased),
`email` (valid, lowercased), `name` (1–100), `password` (≥8, hashed with
better-auth's `hashPassword`), `role` (≤100, default `user`). Guards:

- 400 `business-logic-error` — role does not exist or is inactive
  (`INVALID_ROLE`), or username/email already exists.
- 403 `insufficient-permission` — requested role outranks the creator
  (`checkRoleAssignable`).
- 409 `conflict` — unique-constraint race on username/email.

Created accounts start with `emailVerified: false`.

## Role assignment

| Method + Path                         | Permission     | Request             | Success                                      |
| ------------------------------------- | -------------- | ------------------- | -------------------------------------------- |
| GET `/api/v1/admin/users/{id}/role`   | `users:read`   | —                   | 200, the user's current role and permissions |
| PATCH `/api/v1/admin/users/{id}/role` | `users:update` | `{ role, reason? }` | 200 `{ user, role, previousRole }`           |

PATCH body (`updateRoleSchema`, inline): `role` (1–100, required), `reason`
(≤500). Guards: changing your own role → 400 `business-logic-error`;
`changeUserRole` failures map through an inline error table
(`INSUFFICIENT_PERMISSIONS` → 403, invalid/unknown role → 400, not found →
404, ...). Every change is audit-logged with IP + user agent.

## Bulk role update

| Method + Path                               | Permission     | Request                   | Success                                                        |
| ------------------------------------------- | -------------- | ------------------------- | -------------------------------------------------------------- |
| GET `/api/v1/admin/users/bulk-role-update`  | `users:read`   | `?userIds=id1,id2&role=x` | 200, preview: users (≤100), `cannotManage` count, `canProceed` |
| POST `/api/v1/admin/users/bulk-role-update` | `users:update` | `bulkUpdateSchema`        | 200, `{ total, successful, failed, failures[] }`               |

`bulkUpdateSchema` (inline): `userIds` (1–100, deduplicated server-side),
`role` (1–100), `reason` (≤500), `confirm` (must be `true`). Guards:
including your own id → 400; updates run **sequentially** (each
`changeUserRole` is its own transaction; parallel fan-out exhausted the
connection pool); per-user failures are collected in `failures[]` without
failing the request.

## Errors

401/403 auth (incl. the can-grant / role-outrank guards); 400
`business-logic-error`; 404 not found; 409 `conflict`; 422 `validation-error`
with `errors[]`; 500 `internal-error`. Non-JSON bodies on these routes throw
during `request.json()` and surface as 500 — callers must send valid JSON.
