# ADR-0007: Single-association deployment with a tenant seam

**Status:** Accepted. The `Organization` table is implemented. The UI is not wired to it yet.

## Context

An AMS must make a tenancy decision early. This decision determines the schema shape for every domain table. Retrofitting the decision after data exists requires a full migration, not a configuration change. Today, the database has **no `Organization` or tenant concept**. Association name, branding, locale, and currency are hardcoded strings. No row exists to hold deployment-specific settings.

The team considered two extremes:

- **Full multi-tenant now**: Every table gets an `orgId` column. Postgres row-level security and a tenant-scoped query layer enforce it. This approach enables hosted SaaS from day one. However, it roughly doubles the schema and query work for every future feature. It also makes cross-tenant data leakage the top security risk from day one. No one has asked for this benefit (hosted multi-org) yet.
- **Strictly single-tenant, no seam**: This approach gives the simplest possible schema. A later move to multi-tenancy means a rewrite of every table, not an incremental change.

## Decision

**Single-association per deployment**, with a tenant seam for later:

- `Organization` (`src/db/schema/organization.ts`) is a **singleton** row (`id = "default"`). It holds identity, branding, locale, currency, timezone, and a `settings` JSON column for deployer-configurable options.
- New domain tables (finance, chapters, committees, and others built in M3) carry an `orgId` column. This column defaults to `"default"` and is indexed. These tables have no row-level security and no tenant-scoped query wrapper. Only one value exists in this column today.
- The 33 tables migrated from Prisma do **not** get a retroactive `orgId` column. These tables predate this decision. No multi-tenant use case requires a change to them. A retroactive `orgId` column now creates schema churn with no behavioral benefit.

## Consequences

- This decision adds zero row-level-security or tenant-scoping complexity to the 1.0 timeline.
- A future move to real multi-tenancy needs three steps: populate `orgId` beyond the default value, add row-level security policies, and add a tenant-scoped client wrapper. It does not need a redesign of every table.
- Every _new_ table added after this ADR must carry the seam. A reviewer, or eventually a CI check, can ask "does this table have `orgId`?" as a mechanical review question.
- No code path reads the `Organization` row yet. `TODO.md` M3 tracks the work to connect the row to settings pages and email templates.
