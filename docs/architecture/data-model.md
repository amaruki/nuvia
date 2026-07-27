# Data Model Conventions

Applies to every table under `src/db/schema/`. See [ADR-0011](../adr/0011-prisma-to-drizzle.md) for why Drizzle, and [ADR-0007](../adr/0007-single-association-tenant-seam.md) for the tenancy decision this section assumes.

## Naming

- Table names use `snake_case`, plural (`event_registrations`, not `EventRegistration` or `eventRegistration`). Contributors set this name via the first argument to `pgTable(...)`.
- Column names use `snake_case` (`created_at`, not `createdAt`). The pre-Drizzle schema had no `@map` directives. As a result, live columns were actually camelCase in Postgres. The Drizzle migration corrected this as a deliberate one-time reset. No production data existed to preserve (see ADR-0011).
- Drizzle object exports (the JS/TS identifiers) use `camelCase`, singular for the table binding (`export const eventRegistration = pgTable(...)`). This singular form matches what `db.query.<name>` expects for the relational query API.
- Enums use a `PascalCase` Postgres type name (`EventStatus`) and `SCREAMING_SNAKE` values (`PUBLISHED`). This convention is unchanged from the original Prisma schema. The convention remains adequate without change.

## Primary Keys

Primary keys use application-generated UUIDs as `TEXT` (`text("id").primaryKey().$defaultFn(() => crypto.randomUUID())`), not the Postgres `uuid` type, and not a database-level `gen_random_uuid()` default. This matches the original migration SQL (`"id" TEXT NOT NULL`, no default). No reason exists to change this as part of an unrelated ORM swap.

## Audit Fields

Every mutable table has `created_at` and `updated_at` columns, both `timestamp({ withTimezone: true })` with `.notNull().defaultNow()`. The `updated_at` column also carries `.$onUpdate(() => new Date())`. Point-in-time records use `timestamp with time zone`. No pure-calendar-date use case exists in the schema today. An AMS may need one, for example, for membership-year boundaries. Add `date()` when that use case is built, not `timestamp`.

## Soft Delete

Only `User.deletedAt` exists today. No code actually queries on this column (`deletedAt: null` is never used as a filter anywhere in `src/`). This column is present but unenforced. New tables that need soft delete should follow the same `deletedAt: timestamp().nullable()` shape, and should actually filter on it in the query layer. Do not add the column without the enforcement. `User` is in this unenforced state today. This state is worth fixing, not copying.

## Money

Money columns use `numeric(column, { precision: 10, scale: 2 })`, left in Drizzle's default string mode. Never use `mode: 'number'` for currency columns. JS-`number` mode causes float rounding error for Postgres `numeric` values. A string representation round-trips exactly. Every price, amount, or salary column translated from Prisma's `Decimal` type follows this pattern.

## JSON

JSON columns use `jsonb`, not `json`. This matches what Prisma's `Json` type actually emitted in Postgres. `jsonb` also supports indexing and querying, if either becomes necessary.

## Relations

Contributors declare relations with Drizzle's `relations()` helper for the relational query API (`db.query.<table>.findFirst({ with: {...} })`). Contributors must declare both sides of a relation for `with` to work. `src/db/schema/relations.ts` exists specifically to hold the many-side relations for `user` (accounts, sessions, and created events) separately from the domain files. This separation avoids circular imports. Every domain file imports `user`. `users.ts` cannot import back from all of them. New cross-domain relations follow the same pattern. Declare the reverse side in `relations.ts`, not by reaching into another domain file.

## Counter Integrity

Denormalized counters exist today (`Event.registeredCount`, `ForumPost.replyCount`, `JobPosting.applicationCount`, and similar fields), with no mechanism that keeps them in sync with the rows they count. The Drizzle migration copied these counters faithfully from the Prisma schema. Nothing writes to these counters yet, since nothing queries these tables in real code today. When the maturity gate promotes a module that uses these counters (`docs/adr/0008-module-maturity-gate.md`), the service layer that writes the counted rows (registrations, comments, applications) must update the counter in the same transaction, not as a follow-up write.
</content>
