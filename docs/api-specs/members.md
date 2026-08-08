# API Spec — Members

Member directory (backlog B1). Member status is never stored — the service
derives it per ADR-0014 via `deriveMemberStatus`
(`src/lib/services/membership-status.service.ts`).

Route files: `src/app/api/v1/members/route.ts`,
`src/app/api/v1/members/[id]/route.ts`.

## GET /api/v1/members

Permission: `memberships:read` — a membership-flavored directory (user row +
newest subscription + derived member status).

Query (`listQuerySchema`, inline in the route):

| Param          | Type      | Default     | Notes                                                                                                  |
| -------------- | --------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| `page`         | int ≥1    | 1           |                                                                                                        |
| `limit`        | int 1–100 | 20          |                                                                                                        |
| `search`       | string    | —           | trimmed, min 1                                                                                         |
| `role`         | string[]  | —           | repeatable                                                                                             |
| `memberStatus` | enum[]    | —           | repeatable; `active` \| `trialing` \| `in_grace` \| `paused` \| `expired` \| `none` (derived statuses) |
| `sortBy`       | enum      | `createdAt` | `name` \| `username` \| `email` \| `role` \| `createdAt`                                               |
| `sortOrder`    | enum      | `desc`      | `asc` \| `desc`                                                                                        |

Success 200: `data.members[]`, pagination in `meta`.
Errors: 401/403 auth; 422 `validation-error`; 500 `internal-error`
("Failed to list members").

## GET /api/v1/members/{id}

Permission: `users:read` — this item additionally exposes user-management
data (email, username, verification state, role) alongside subscription
history (`getMemberDetail` in `src/lib/services/member.service.ts`).

Success 200: member detail object. Errors: 401/403 auth; 404 `not-found`
(`NotFoundError` from the service); 500 `internal-error`.
