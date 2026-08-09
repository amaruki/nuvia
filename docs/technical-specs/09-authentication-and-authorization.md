# 9. Authentication and Authorization

## 9.1 Mechanism

better-auth issues and validates sessions via `httpOnly`, `SameSite=Lax` cookies. `src/lib/auth/index.ts` configures the `drizzleAdapter` against the `accounts`, `sessions`, `verification` tables (Section 6.5). Password auth and OAuth (Google now, GitHub/LinkedIn planned) are both supported; a user with only an OAuth-linked account has a null `password_hash`.

## 9.2 Token/session strategy

Session-cookie based, not a bearer-token API. `src/proxy.ts` reads the session on every request to `/dashboard/**` and `/api/**` (minus a short public-endpoint allow-list) via `AuthUtils.getCurrentUser`.

## 9.3 Role matrix

The 14 predefined roles, in descending `ROLE_HIERARCHY` order (used by `canManageRole`: a manager can act on any role strictly below their own level, never on `superadmin` unless they are `superadmin` themselves):

| Role                  | Level | Summary                                |
| --------------------- | ----- | -------------------------------------- |
| `superadmin`          | 100   | Global system control, all permissions |
| `admin`               | 90    | Organization-wide management           |
| `staff`               | 80    | Operational staff                      |
| `treasurer`           | 75    | Financial oversight                    |
| `chapter_president`   | 70    | Chapter leadership                     |
| `chapter_admin`       | 65    | Chapter administration                 |
| `committee_chair`     | 60    | Committee leadership                   |
| `organizer`           | 55    | Event organization                     |
| `moderator`           | 50    | Content moderation                     |
| `member_corporate`    | 40    | Corporate member tier                  |
| `member_professional` | 35    | Professional member tier               |
| `member_student`      | 30    | Student member tier                    |
| `member`              | 25    | Basic member tier                      |
| `user`                | 10    | Basic registered account               |

A `CustomRole` (a database row, not one of the above) has level 0 by default under `getRoleLevel` — it cannot be used to escalate above any predefined role through the hierarchy check, only through its own explicit `permissions` array.

## 9.4 Permission model

A `Permission` is a `${PermissionModule}:${PermissionAction}` string. `PERMISSION_MODULES`: `users`, `events`, `memberships`, `finance`, `content`, `communications`, `analytics`, `organization`, `forum`, `jobs`, `learning`, `system`. `PERMISSION_ACTIONS`: `create`, `read`, `update`, `delete`, `manage`, `publish`, `approve`, `export`, `import`, `moderate`. `superadmin` resolves to every permission in `AVAILABLE_PERMISSIONS`; every other predefined role resolves through its own entry in `ROLE_PERMISSIONS`. See Section 12 for the full resolution algorithm.

## 9.5 Secrets

`BETTER_AUTH_SECRET` (minimum 32 characters, rejected if still the placeholder value in production), OAuth client secrets, `REDIS_URL`, `DATABASE_URL`, and email provider credentials are all read exclusively through `src/lib/env.ts`'s validated `env` export, never `process.env` directly, outside the documented exceptions (`drizzle.config.ts`, `scripts/*.ts`, `src/proxy.ts`). Section 11 lists every variable.

## 9.6 Threat surface

See Section 7.7 for the STRIDE summary and `docs/security/threat-model.md` for the full pass.
