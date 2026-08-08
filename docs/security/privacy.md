# Privacy

Nuvia stores association member data — names, emails, event registrations, and eventually dues and payment records once M3 lands. GDPR and comparable regimes apply to any deployer with EU members. The same discipline is good practice regardless of jurisdiction.

## Lawful Basis

Membership data uses contract as its lawful basis (the member relationship with the association). Event registration uses contract or consent, depending on the event. Marketing communications (newsletters, once built) will use consent, with an unsubscribe path. This path is not yet implemented, since the newsletter module is mock-only (`docs/adr/0008-module-maturity-gate.md`).

## Retention

The project has not yet defined a retention period per data category. This is a real gap, not an oversight that this document hides. `TODO.md` M4 tracks writing an actual retention schedule before 1.0. This schedule will state how long the project keeps login activity logs, audit logs, and inactive-member records. The `authLog` table already has a `cleanupOldLogs(daysToKeep = 90)` function (`src/lib/services/logging.service.ts`). This default exists, but no scheduled job calls it yet.

## Data Subject Access Requests (DSAR)

Not implemented. A member has no self-service way to export their own data today. `TODO.md` M4 tracks this gap, likely as an authenticated endpoint. This endpoint would assemble the requesting user's own rows across `users`, `event_registrations`, `membership_subscriptions` (once real), and `auth_logs`. The endpoint would return these rows as a downloadable JSON or CSV file.

## Erasure

**Erasure is now implemented.** `DELETE /api/v1/auth/delete-account` authenticates the caller, re-authenticates (a password, or a session fresh enough to pass better-auth's `freshAge` check), refuses to delete the last super admin (lockout guard), and then hard-deletes the user row via better-auth's `deleteUser` (`src/app/api/v1/auth/delete-account/route.ts`). Sessions, accounts, role assignments, login activity, and auth logs cascade with the user; chapter memberships and award nominations are set to null. Covered by `tests/delete-account.test.ts`. The hard-delete-vs-anonymization decision resolved to **hard delete** for the account row and auth-owned data. One residual: rows a user authored (content authorship, forum posts and comments, created events, committee audit fields) reference the author with non-cascading foreign keys, so this endpoint erases the account, not an anonymized trace of their authored content; a deployment that must retain referential integrity for authored content should treat that as a follow-up.

## PII Inventory (Current, Not Exhaustive)

| Table                   | PII fields                                                     |
| ----------------------- | -------------------------------------------------------------- |
| `users`                 | email, name, bio, external links, profile photo                |
| `user_login_activities` | IP address, user agent, location                               |
| `active_devices`        | IP address, user agent, device name                            |
| `auth_logs`             | IP address, user agent, location, metadata (may contain email) |

`docs/observability.md` covers redaction in logs, not database rows.
