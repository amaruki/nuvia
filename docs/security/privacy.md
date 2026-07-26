# Privacy

Nuvia stores association member data — names, emails, event registrations,
eventually dues and payment records once M3 lands.
GDPR and comparable regimes apply to any deployer with EU members, and the
same discipline is good practice regardless of jurisdiction.

## Lawful basis

Membership data: contract (the member relationship with the association).
Event registration: contract or consent, depending on the event.
Marketing communications (newsletters, once built): consent, with an
unsubscribe path — not yet implemented, since the newsletter module is
mock-only (`docs/adr/0008-module-maturity-gate.md`).

## Retention

Not yet defined per data category — this is a real gap, not an oversight
being glossed over.
`TODO.md` M4 tracks writing an actual retention schedule (how long login
activity logs, audit logs, and inactive-member records are kept) before
1.0.
The `authLog` table already has a `cleanupOldLogs(daysToKeep = 90)` function
(`src/lib/services/logging.service.ts`) — the default exists, but no
scheduled job calls it yet.

## Data Subject Access Requests (DSAR)

Not implemented.
A member has no self-service way to export their own data today.
Tracked in `TODO.md` M4, likely as an authenticated endpoint that assembles
the requesting user's own rows across `users`, `event_registrations`,
`membership_subscriptions` (once real), and `auth_logs`, returned as a
downloadable JSON or CSV.

## Erasure

**This is currently broken, not just unimplemented.**
`DELETE /api/v1/auth/delete-account` authenticates the caller, does
nothing, and returns `"Account deleted successfully"`
(`src/app/api/v1/auth/delete-account/route.ts:29-44`, a self-admitted
placeholder).
A deployer relying on this endpoint to honor an erasure request is
violating that request without knowing it.
Fixing this is `TODO.md` M1's highest-priority open item after the
authorization gaps.
The fix needs a decision this document doesn't make unilaterally: hard
delete (removes the row) vs. anonymization (retains a row for referential
integrity — e.g. a forum post's author — with PII scrubbed).
Anonymization is usually the right choice for a system with foreign-key
references to the user row (forum posts, event registrations, audit logs)
that shouldn't disappear when a member leaves.

## PII inventory (current, not exhaustive)

| Table                   | PII fields                                                     |
| ----------------------- | -------------------------------------------------------------- |
| `users`                 | email, name, bio, external links, profile photo                |
| `user_login_activities` | IP address, user agent, location                               |
| `active_devices`        | IP address, user agent, device name                            |
| `auth_logs`             | IP address, user agent, location, metadata (may contain email) |

Redaction in logs (not database rows) is covered by
`docs/observability.md`.
