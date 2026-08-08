# 5. Module Definitions

Each module below states its responsibility, its public surface, the entities it owns (see [`CONTEXT.md`](../../CONTEXT.md) for definitions), and its maturity tier (Section 13). The operational endpoints (health monitor, reset-db-state) are documented in Section 5.7, since they belong to no single business module.

## 5.1 Members (`Backed`, enabled by default)

**Responsibility**: user identity, role assignment, custom-role definitions. This module is deep: a caller asking "can this user do X" never touches `ROLE_PERMISSIONS`, `custom_roles`, or the predefined/custom branching logic directly — it calls `requirePermission(user, permission)` and gets a boolean-or-throw. See Section 12 for the full resolution algorithm this hides.

**Public surface**: `requirePermission(user, permission): void | throws`, `requireRole(user, role): void | throws` (`src/lib/rbac/`), `getCurrentUser(): UserWithRole | null`. Invariants: a `Permission` is always a `module:action` string from the fixed `PERMISSION_MODULES` x `PERMISSION_ACTIONS` product; a predefined `Role` always resolves through `ROLE_PERMISSIONS`; an unrecognized role string is treated as a `CustomRole` name and resolved via a database lookup, defaulting to zero permissions if inactive or absent.

**Entities owned**: `User`, `CustomRole`, `Role` (as data, via `user_role_assignments` and `role_change_history`).

**Seam**: the predefined-vs-custom-role branch (`isPredefinedRole(role)`) is the injection point where a future permission-resolution strategy (e.g., ADR-0005's permission-derived nav) would plug in without changing `requirePermission`'s external contract.

## 5.2 Events (`Backed`, enabled by default)

**Responsibility**: event listings, registration, and the supporting entities (speakers, sponsors, sessions) each event carries. Deep because a caller registering a user for an event does not need to know about waitlist capacity math, counter increments, or status transitions — those stay inside the Events module's service layer.

**Public surface**: registration creates an `event_registrations` row with `status = "PENDING"` by default; the module owns the `registeredCount`/`waitlistCount` counters on `events` and is responsible for keeping them in sync with the rows they count once wired (see Section 6.7's counter-integrity note).

**Entities owned**: `Event`, `Registration`, and (not part of `CONTEXT.md`'s core glossary, module-internal) speaker, sponsor, and session records.

## 5.3 Content (`Backed`, enabled by default)

**Responsibility**: CMS articles, blog posts, pages, and their categorization.

**Public surface**: content has an independent status/visibility lifecycle from Events and Forums even though the words (draft, published, archived) overlap; each module's status enum is separate by design (see `CONTEXT.md`'s note on this).

**Entities owned**: `Content`.

## 5.4 Forums (`Backed`, enabled by default)

**Responsibility**: discussion posts and threaded comments.

**Public surface**: a `ForumComment` may reply to a `ForumPost` or to another `ForumComment` (self-referential `parentId`), forming an arbitrary-depth thread. `forum_categories` supports a `requiredRole` gate per category, independent of the dashboard's own role-gating mechanism (Section 2.4) — this is a module-internal visibility rule, not the platform's authorization boundary.

**Entities owned**: `ForumPost`, `ForumComment`.

## 5.5 Jobs (`Backed`, enabled by default)

**Responsibility**: job board listings and applications.

**Public surface**: a `JobApplication`'s status is independent of its parent `JobPosting`'s status (an application can be `INTERVIEWING` while the posting itself is still `PUBLISHED`).

**Entities owned**: `JobPosting`, `JobApplication`.

## 5.6 Finance (`Mock`, disabled once the maturity gate is built)

**Responsibility (planned)**: dues billing, membership tiers, transaction history, payment gateway integration.

**Current state**: schema exists (`membership_tiers`, `membership_subscriptions`, `membership_transactions`) as a structural translation from the pre-Drizzle Prisma schema; no route or service function queries any of these tables. The dashboard UI at `src/app/dashboard/finance/**` renders entirely from `src/lib/data/mock-*.ts`. No payment SDK is installed. Promoting this module needs its own ADR choosing a payment provider before any real wiring begins.

**Entities owned (schema only, not wired)**: `MembershipTier`, `MembershipSubscription`.

## 5.7 Operational endpoints

These belong to the platform itself, not to any one business module.

### Health monitor

`GET /api/health`. Public, no authentication required. Returns overall status plus a per-dependency breakdown:

```json
{
  "status": "ok",
  "dependencies": {
    "database": { "status": "ok", "latencyMs": 4 },
    "redis": { "status": "ok", "latencyMs": 1 }
  }
}
```

`status` is `"ok"` only if every dependency reports `"ok"`; otherwise `"degraded"` (at least one dependency down but the app itself responds) or the endpoint fails to respond at all (the app itself is down, which the caller observes as a connection failure rather than a JSON body). The database check runs a lightweight `SELECT 1`; the Redis check runs `PING`. No `/health/live` versus `/health/ready` split exists; a single endpoint is sufficient at Nuvia's current single-instance deployment scale.

### Reset database state

`POST /api/admin/reset-state`. **Registered only when `ENABLE_RESET_API=true`** — the route module itself checks this flag and returns a 404-equivalent (or is not registered at all, depending on the Next.js route-registration mechanism chosen at implementation time) when the flag is unset, so the route does not exist in production, not merely refuses access. `ENABLE_RESET_API` must never be set to `true` in a production environment; Section 11 states this as an explicit environment-variable rule. Even in an environment where the flag is set, the endpoint still requires `requirePermission(user, "system:manage")` — environment gating is not a substitute for authorization, it is an additional layer, per ADR-0001's "one authorization helper, no exceptions" precedent.

Request body: `{ "seed": "dev" }`. Only `"dev"` is supported; no separate QA seed script exists today, and adding one is an open follow-up (Section 5.8), not built into this endpoint's initial scope. The endpoint runs synchronously: drop and re-migrate the schema, then run `scripts/seed.ts` with the configured `SEED_ADMIN_PASSWORD`. Response: `200` with a summary of what was reset, or a `problemResponse` on failure.

## 5.8 Open follow-ups

- A QA-specific seed script (distinct from the dev admin-only seed) is not built. Add it, and extend the reset-state endpoint's `seed` field to accept `"qa"`, once a QA workflow actually needs data beyond the dev admin accounts.
- The health endpoint's dependency list (database, Redis) does not yet include the email provider or OAuth providers; add them if an incident ever traces back to one of those being silently unreachable.
