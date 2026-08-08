# ADR-0014: Member status is derived from the membership subscription lifecycle

**Status:** Accepted, implemented

## Context

The schema carries two separate membership concepts, flagged as unreconciled in `CONTEXT.md`'s "Member" entry:

1. **Role-based membership.** `users.role` can hold one of four fixed membership-tier values (`member`, `member_student`, `member_professional`, `member_corporate`). A User "is a Member" when their role is one of those values. A role is assigned by staff and says nothing about whether anyone paid for anything.
2. **Subscription-based membership.** `membership_subscriptions.status` — the `MembershipStatus` enum (`ACTIVE`, `TRIALING`, `CANCELED`, `PAST_DUE`, `UNPAID`, `PAUSED`) — tracks a paid subscription to a `MembershipTier` over billing periods. This is the Finance module's core record.

Nothing connects the two. A user can hold the `member` role with no subscription row at all (the seed data does exactly this), and a user can hold an `ACTIVE` subscription while their role is still `user`. Two writable sources of truth for "is this person currently a member?" will drift the first day both are used. The backlog's paid-member path — B1 (member directories on real data) and C2 (the subscription lifecycle engine) — needs one answer.

## Decision

**Member status is derived from the subscription lifecycle. It is never stored independently.** The `membership_subscriptions` row is the single source of truth; member status is a pure function of that row and the current time. No `member_status` column exists, and none may be added — a stored status would be a second source of truth that can disagree with the subscription.

The derivation lives in `src/lib/services/membership-status.service.ts`:

- `deriveMemberStatus(subscription, now)` — pure function from a subscription snapshot (or `null`, for "no subscription row") and a timestamp to a `MemberStatus`: `active`, `trialing`, `in_grace`, `paused`, `expired`, or `none`.
- `syncMemberStatusFromSubscription(userId)` — the db-backed application: read the user's newest subscription row, derive the status, apply the role-sync rules below, and audit any role change.

### Derivation mapping

"Unset" below means the column is `NULL`. The `now` value is passed in, not read from a clock inside the pure function, so the rule is testable with fixed timestamps.

| Subscription input  | Condition                                                | Derived `MemberStatus` |
| ------------------- | -------------------------------------------------------- | ---------------------- |
| No subscription row | —                                                        | `none`                 |
| `ACTIVE`            | `now ≤ current_period_end`, or period end unset          | `active`               |
| `ACTIVE`            | `now > current_period_end`                               | `expired`              |
| `TRIALING`          | `now ≤ trial_end` (falling back to `current_period_end`) | `trialing`             |
| `TRIALING`          | past that anchor                                         | `expired`              |
| `CANCELED`          | `now ≤ current_period_end`                               | `in_grace`             |
| `CANCELED`          | past period end, or period end unset                     | `expired`              |
| `PAST_DUE`          | `now ≤ current_period_end + 7 days`, or period end unset | `in_grace`             |
| `PAST_DUE`          | past that grace end                                      | `expired`              |
| `UNPAID`            | —                                                        | `expired`              |
| `PAUSED`            | —                                                        | `paused`               |

The time checks make the clock authoritative over a stale status value: a provider that has not yet flipped `ACTIVE` to `PAST_DUE` still stops conferring membership once the paid period is over. `UNPAID` means every payment attempt for the period failed, so it confers nothing and gets no grace window; `PAST_DUE` means retries are still running, so membership continues through a 7-day grace window (`PAST_DUE_GRACE_DAYS`, a constant for now). A `CANCELED` subscription that is still inside its paid-through period confers `in_grace` — the member keeps access until what they paid for runs out, then nothing.

### Role-sync rules

`users.role` stays the authorization mechanism; the derivation keeps it honest. When `syncMemberStatusFromSubscription` runs:

- Entitled statuses (`active`, `trialing`, `in_grace`): a user on the bare `user` role is upgraded to `member`. A user already on a membership-tier role keeps their specific tier (`member_student`, `member_professional`, `member_corporate`) — the derivation does not know which tier a subscription buys yet (see Consequences).
- Non-entitled statuses (`paused`, `expired`, `none`): a user on a membership-tier role is downgraded to `user`.
- Any other role — staff, governance, moderator, or a custom role — is never touched. Those identities are independent of paid membership; a staff member's subscription state must not demote them from staff.
- Multiple subscription rows for one user: the newest row (by `created_at`) governs.
- Every role change writes its `auth_logs` `ROLE_CHANGE` entry in the same transaction as the role update, per the privileged-mutation rule in `docs/PRINCIPLES.md` and ADR-0009.

## Consequences

- B1 can answer "who is a member" from real data without trusting `users.role` alone, and C2's lifecycle engine has one contract to satisfy: keep `membership_subscriptions` rows current, and call the sync function on transitions.
- No schema change and no migration. The derivation is code. The trade: a member's status can flip to `expired` purely by time passing, with no row changing, so member-facing checks must derive (or call the sync function), never cache a status value.
- `users.role` remains readable and authorization stays a single-column check; the price is that every path that mutates subscription state must run the sync, or role and subscription drift until the next sync.
- `PAST_DUE_GRACE_DAYS = 7` is a constant, not organization settings. Making it deployer-configurable through `Organization.settings` is deliberate follow-up work, not part of this decision.
- The mapping from a specific `MembershipTier` to a specific member-tier role (which tier buys `member_student` vs `member_corporate`) is deferred to C2: `membership_tiers` carries no role reference today, so upgrades land on the default `member` role and existing specific tiers are preserved.
- The derivation is per-user. Organization-wide or family billing would need a new ADR, not an extension of this one.
- Numbering note: backlog item C1 (payment provider) refers to "ADR-0014" in its acceptance text; that reference predates this ADR. C1 takes the next free number, 0015, when it lands.
