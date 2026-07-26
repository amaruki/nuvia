# ADR-0007: Single-association deployment with a tenant seam

**Status:** Accepted; `Organization` table implemented, not yet wired to the UI

## Context

An AMS has to make a tenancy decision — it determines schema shape for
every domain table, and retrofitting it after data exists is a full
migration, not a config change. Today there is **no `Organization`/tenant
concept anywhere in the database**: association name, branding, locale, and
currency are hardcoded strings, and there is no row to attach
deployment-specific settings to.

Two extremes were considered:

- **Full multi-tenant now**: every table gets an `orgId`, enforced by
  Postgres row-level security and a tenant-scoped query layer. Enables
  hosted SaaS from day one, but roughly doubles the schema/query work for
  every future feature and makes cross-tenant data leakage the top security
  risk from day one, for a benefit (hosted multi-org) nobody has asked for
  yet.
- **Strictly single-tenant, no seam**: simplest possible schema, but
  multi-tenancy later means a rewrite of every table, not an incremental
  change.

## Decision

**Single-association per deployment**, with a tenant seam for later:

- `Organization` (`src/db/schema/organization.ts`) is a **singleton** row
  (`id = "default"`) holding identity, branding, locale, currency, timezone,
  and a `settings` JSON column for deployer-configurable options.
- New domain tables (finance, chapters, committees, etc., as they're built
  in M3) carry an `orgId` column defaulting to `"default"`, indexed, but
  **no row-level security and no tenant-scoped query wrapper** — there's
  only ever one value in that column today.
- The 33 tables migrated from Prisma do **not** get a retroactive `orgId`
  added. They predate this decision, there is no multi-tenant use case
  driving a change to them, and adding it now would be schema churn with no
  behavioral benefit.

## Consequences

- Zero RLS/tenant-scoping complexity for the 1.0 timeline.
- A future move to real multi-tenancy is "populate `orgId` beyond the
  default, add RLS policies, add a tenant-scoped client wrapper" — not
  "redesign every table."
- Every _new_ table added after this ADR is expected to carry the seam. A
  reviewer (or eventually a CI check) can ask "does this table have
  `orgId`?" as a mechanical review question.
- The `Organization` row itself is not yet read by any code path — wiring
  it into settings pages and email templates is `TODO.md` M3 work.
