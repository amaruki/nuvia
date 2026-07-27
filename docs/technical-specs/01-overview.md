# 1. Overview

Nuvia is an open-source Association Management System (AMS): the software a professional association or similar member organization runs to manage its members, events, content, forums, jobs, and (once promoted) finance, awards, learning, chapters, committees, and workspaces. This document set is the technical specification for the system as it exists today, migrated from the scattered ADRs, architecture notes, and security docs that previously held this information, into one numbered reference. It supersedes `docs/architecture/overview.md`, `docs/architecture/data-model.md`, `docs/security/controls.md`, `docs/security/threat-model.md`, and `docs/security/privacy.md` for the sections those files covered; the originals stay in place until a later cleanup pass retires them, and every fact in this set was cross-checked against them and against the actual code, not assumed from their prose.

## 1.1 Terminology

This document uses the vocabulary defined in [`CONTEXT.md`](../../CONTEXT.md) at the repository root. Read that glossary first: `Organization`, `User`, `Role`, `Permission`, `CustomRole`, `Module`, `Maturity Tier`, and the per-module entities (`Member`, `MembershipTier`, `MembershipSubscription`, `Event`, `Registration`, `Content`, `ForumPost`, `ForumComment`, `JobPosting`, `JobApplication`) all carry a specific, opinionated meaning there. This document does not redefine them.

One open question the glossary flags and this spec does not resolve: `Member` (a `Role` value like `member_professional`) and `MembershipSubscription` (a paid subscription to a `MembershipTier`) are two separate, unreconciled concepts in the schema today. A user's role does not derive from or sync with their subscription status. Section 6.7 documents this as a real data-model gap, not a naming inconsistency.

## 1.2 Goals

- Give an association a working member directory, event calendar, content site, discussion forum, and job board out of the box, on a single deployable Next.js application over one PostgreSQL database.
- Let a deployer customize branding, add fields, and adjust workflows through the `Organization.settings` JSON column and documented extension points, without forking core logic (see `docs/PRINCIPLES.md`, "Easy to customize").
- Keep every module that is not yet fully built (schema, authorized API, tests, docs) disabled by default, so a fresh install never exposes a page that quietly does nothing (see Section 13, the module maturity gate).
- Reach a 1.0 release where every principle in `docs/PRINCIPLES.md` has a passing, checkable test, not an aspirational claim.

## 1.3 Scope by module

Nuvia organizes work into ten `Module`s. Five are `Backed` (a real Drizzle schema and, for the two with a wired API, real routes) and enabled by default; six are `Mock` (schema exists as a structural translation, but no route or service queries it) and disabled by default once the maturity gate (Section 13) is actually built. Today, the maturity gate itself is not built, so the "disabled" modules are in fact reachable by any authenticated user whose role permits the section, per `src/lib/navigation-data.ts`; only the maturity flag is missing, not the role gate.

**Members** (`Backed`, enabled): user directory, role assignment, custom roles. Schema: `users`, `custom_roles`, `user_role_assignments`, `role_change_history`. Owns the `users:*` permission family.

**Events** (`Backed`, enabled): event listing, registration, speakers, sponsors, sessions. Schema: `events`, `event_categories`, `event_registrations`, `event_speakers`, `event_sponsors`, `event_sessions`. Owns the `events:*` permission family.

**Content** (`Backed`, enabled): CMS articles, blog posts, pages. Schema: `content`, `content_categories`. Owns the `content:*` permission family.

**Forums** (`Backed`, enabled): discussion posts and threaded comments. Schema: `forum_posts`, `forum_categories`, `forum_comments`, `forum_attachments`. Owns the `forum:*` permission family.

**Jobs** (`Backed`, enabled): job board listings and applications. Schema: `job_postings`, `job_categories`, `job_types`, `locations`, `companies`, `job_applications`. Owns the `jobs:*` permission family.

**Finance** (`Mock`, disabled): dues, membership tiers, invoices, payment gateways. Schema exists (`membership_tiers`, `membership_subscriptions`, `membership_transactions`) but no route or service queries it; the UI at `src/app/dashboard/finance/**` renders from `src/lib/data/mock-*.ts`. Owns the `finance:*` permission family. Highest product value of the mock modules (see Section 13's promotion order).

**Awards** (`Mock`, disabled): nomination and award programs. No dedicated schema exists yet.

**Learning** (`Mock`, disabled): courses and certifications.

**Chapters** (`Mock`, disabled): regional chapter management, under `organization`.

**Committees** (`Mock`, disabled): committee membership and charters, under `organization`.

**Workspaces** (`Mock`, disabled): collaborative workspace areas.

### Out of scope

- Multi-association (multi-tenant) deployment. `Organization` is a singleton row today; the schema carries an `orgId`-ready seam (see Section 6, Section 2) but nothing implements per-organization isolation, row-level security, or a tenant-scoped query wrapper.
- Payment processing. No payment SDK is installed. The Finance module's promotion depends on a separate, deliberate ADR choosing a payment provider (Stripe, Midtrans, or another), not on this spec.
- Native mobile clients. Nuvia is a server-rendered web application.
- SSO/SAML enterprise identity federation. Authentication is better-auth email/password plus OAuth (Google, optionally GitHub/LinkedIn) only.

## 1.4 User base

Nuvia's users fall into the fourteen `Role` values `CONTEXT.md` defines, from `superadmin` (global system control) down to `user` (a basic registered account with no membership). In practice, three groups matter for reading this document: **members** (the association's own membership, using the member-facing modules), **staff and chapter/committee leadership** (`admin`, `staff`, `treasurer`, `chapter_president`, `chapter_admin`, `committee_chair`, `organizer`, `moderator`, running the association day to day), and **the platform operator** (`superadmin`, the deploying organization's technical owner).

## 1.5 Business workflow summary

The core request flow every module shares, in pseudocode:

```
on request to /dashboard/**:
    proxy.ts checks: does a session exist?
        no  -> redirect to /auth/login
    proxy.ts checks: does isRoleAllowedForPath(path, session.user.role) hold?
        (looks up the longest-matching path entry in navigation-data.ts)
        no  -> redirect to /dashboard?error=forbidden
    render the page

on request to /api/v1/**:
    proxy.ts's auth middleware checks: does a session exist? (skipped for public endpoints)
        no  -> 401 problem+json
    route.ts handler calls requirePermission(session.user, "<module>:<action>")
        not permitted -> 403 problem+json
    route.ts validates the request body with a zod schema
        invalid -> 422 problem+json with per-field errors
    route.ts calls exactly one service function
    service function queries Drizzle, applies business rules, throws a domain error on failure
    route.ts returns successResponse(data) or problemResponse(domainError)
```

A privileged mutation (role change, once financial transactions land) writes its audit-log entry (`auth_logs`) in the same database transaction as the mutation itself, per `docs/PRINCIPLES.md`'s "fast vs. auditable" rule: the request path stays fast for reads, but a write that matters is never allowed to succeed without a paired audit row.

## 1.6 Assumptions and known constraints

1. PostgreSQL is the only supported database engine; no other engine is planned or tested against.
2. Redis is required in production (`src/lib/env.ts` enforces this at boot) for rate limiting; it is optional in development, where the rate limiter degrades to a warning and no-op rather than blocking local work.
3. No production data exists yet for this project. `bun run db:reset` (drop, re-migrate, reseed) is a normal development workflow today; Section 6.8 documents the point at which that stops being true and expand/contract migration discipline becomes mandatory.
4. The six `Mock` modules have a real Drizzle schema but zero wired routes; treating their presence in `src/db/schema/` as evidence of a working feature is the exact mistake the module maturity gate (Section 13) exists to prevent.
5. `(authenticated)` and `(admin)` are route-group names used in `docs/architecture/overview.md`'s original taxonomy, but only `src/app/(public)/` exists as an actual Next.js route group on disk today. The dashboard's actual authorization mechanism is `src/proxy.ts` calling `isRoleAllowedForPath` against `src/lib/navigation-data.ts`'s per-path role list, not layout-level `requirePermission` calls in dedicated route groups. Section 2.4 states this precisely as the current, not aspirational, architecture.
6. `ROLE_PERMISSIONS` (the predefined-role-to-permission-set mapping) and a `Role`'s nav visibility are two independently maintained sources today, though nav visibility is in fact driven by the same `roles` list `dashboard-access.ts` reads for server-side enforcement (see Section 12). ADR-0005's move to a single permission-derived nav vocabulary is accepted but not yet implemented project-wide.
7. Every price, salary, and amount column uses `numeric(10,2)` in Drizzle's string mode, never `mode: "number"`, to avoid floating-point rounding error against Postgres's exact-decimal type.
