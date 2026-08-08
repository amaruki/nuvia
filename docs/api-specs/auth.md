# API Spec — Auth

Session and credential management. Two layers coexist:

- **better-auth infrastructure** under `/api/auth/**` — the catch-all
  better-auth handler and its callbacks, plus the Redis session-cache helpers.
- **Custom auth routes** under `/api/v1/auth/**` — thin wrappers over
  `auth.api.*` (`src/lib/auth.ts`) with RFC 9457 errors and rate limiting.

Route files: `src/app/api/auth/**`, `src/app/api/v1/auth/**`,
`src/app/api/debug/**`. Request schemas live in
`src/lib/validation/auth.validation.ts` unless noted.

## better-auth infrastructure

| Method + Path                             | Auth          | Request                                                      | Success                                                                     | Route file                                           |
| ----------------------------------------- | ------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------- |
| ANY `/api/auth/[...all]`                  | none (public) | better-auth's own protocol (sign-up/in, session, OAuth, ...) | better-auth responses (not the project envelope)                            | `src/app/api/auth/[...all]/route.ts`                 |
| GET `/api/auth/callback/[provider]`       | none          | provider redirect query                                      | forwards to the better-auth handler                                         | `src/app/api/auth/callback/[provider]/route.ts`      |
| POST `/api/auth/cache-session`            | session       | none                                                         | 200 envelope; warms the Redis session cache                                 | `src/app/api/auth/cache-session/route.ts`            |
| GET `/api/auth/cache-status`              | `system:read` | none                                                         | 200 envelope with cache health (`redis.configured`, `redis.available`, ...) | `src/app/api/auth/cache-status/route.ts`             |
| POST `/api/auth/invalidate-session-cache` | session       | none                                                         | 200 envelope; drops the caller's cached session                             | `src/app/api/auth/invalidate-session-cache/route.ts` |
| GET `/api/debug`                          | none          | none                                                         | 404 problem in production; debug payload otherwise                          | `src/app/api/debug/route.ts`                         |
| GET `/api/debug/oauth`                    | none          | none                                                         | 404 problem in production; which OAuth providers are configured otherwise   | `src/app/api/debug/oauth/route.ts`                   |

Errors: 401 `authentication-required` where a session is required; the debug
routes answer 404 `not-found` in production so their existence is not
revealed.

## POST /api/v1/auth/login

Rate limit: `login` (5/15 min). Body: `loginSchema`.

| Field             | Type    | Required |
| ----------------- | ------- | -------- |
| `emailOrUsername` | string  | yes      |
| `password`        | string  | yes      |
| `rememberMe`      | boolean | no       |

Success 200: `{ user: { id, email, ... }, ... }` envelope. Failed credentials
return better-auth's APIError mapped to a problem (401 class). Every attempt
(failed included) is recorded via `recordLoginAttempt`
(`src/lib/auth/login-activity.ts`). Route: `src/app/api/v1/auth/login/route.ts`.

## POST /api/v1/auth/signup

Rate limit: `signup` (5/h). Body: `signupSchema` — `fullName` (2–100),
`email`, `username` (3–30, `^[a-zA-Z0-9_]+$`), `password` (8–100, must match
`[A-Z]`, `[a-z]`, `[0-9]`, and one non-alphanumeric), `confirmPassword`,
`agreeToTerms` (boolean, all required). Success 200 with the created user.
Route: `src/app/api/v1/auth/signup/route.ts`.

## POST /api/v1/auth/forgot-password

Rate limit: `forgotPassword` (3/h). Body: `forgotPasswordSchema` — `email`
(required). Always answers 200 with message "Password reset email sent if
account exists" — by design the response never reveals whether the email
exists. Route: `src/app/api/v1/auth/forgot-password/route.ts`.

## POST /api/v1/auth/reset-password

Rate limit: `resetPassword` (3/h). Body: `resetPasswordSchema` — `token`,
`password` (same strength rules as signup), `confirmPassword` (all required).
Success 200 with message "Password reset successful".
Route: `src/app/api/v1/auth/reset-password/route.ts`.

## POST /api/v1/auth/change-password

Rate limit: `changePassword` (5/15 min). Requires a session. Body:
`changePasswordSchema` — `currentPassword`, `newPassword` (strength rules),
`confirmPassword` (all required). Success 200 with message "Password changed
successfully". Route: `src/app/api/v1/auth/change-password/route.ts`.

## POST /api/v1/auth/verify-email

Rate limit: `verifyEmail` (10/15 min). Body: `{ token: string (min 1) }`
(inline schema). Success 200: `{ status, user: { id, email } | null }` from
better-auth's verification payload.
Route: `src/app/api/v1/auth/verify-email/route.ts`.

## GET + PUT /api/v1/auth/profile

Requires a session. GET returns `{ user }`. PUT body:
`profileApiUpdateSchema` — any subset of `displayName` (1–50), `bio` (≤500),
`externalLinks` (≤10 × `{ platform, url, username? }`), `name` (1–100),
`image` (URL). The allowlist exists so no field better-auth recognizes can be
set unvalidated through this endpoint. Success 200 `{ user }`.
Route: `src/app/api/v1/auth/profile/route.ts`.

## GET + DELETE /api/v1/auth/active-devices

Requires a session. GET returns `{ devices }` from `auth.api.listSessions`.
DELETE takes `?token=<session token>` (required → 400 `business-logic-error`
when missing) and revokes that session via `auth.api.revokeSession`; success
200 with message "Device deactivated successfully".
Route: `src/app/api/v1/auth/active-devices/route.ts`.

## POST /api/v1/auth/deactivate-other-devices

Requires a session. No body. Revokes all sessions except the current one;
success 200 with message "Other devices deactivated successfully".
Route: `src/app/api/v1/auth/deactivate-other-devices/route.ts`.

## GET /api/v1/auth/login-activities

Requires a session. Query: `page`, `limit` (coerced ints with defaults).
Success 200: `{ activities, pagination: { page, ... } }`.
Route: `src/app/api/v1/auth/login-activities/route.ts`.

## DELETE /api/v1/auth/delete-account

Requires a session. Optional JSON body `{ password?: string }` — better-auth
requires either the password or a session fresh enough to pass its `freshAge`
check. Guards:

- 409 `last-superadmin` — the last super admin cannot delete their own
  account (permanent user-management lockout; `isLastSuperadmin` in
  `src/lib/rbac/role-assignment.ts`).

Success 200 with message "Account deleted successfully". The user row is
hard-deleted with cascades to sessions, accounts, devices, login activity,
reset tokens, and role-change history.
Route: `src/app/api/v1/auth/delete-account/route.ts`.

## Error summary (all v1 auth routes)

400/401/409 mapped from better-auth `APIError`s; 422 `validation-error` with
`errors[]` on schema rejection; 429 `rate-limited` when the bucket is
exhausted; 500 `internal-error` otherwise.
