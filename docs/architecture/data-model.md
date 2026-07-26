# Data Model Conventions

Applies to every table under `src/db/schema/`. See
[ADR-0011](../adr/0011-prisma-to-drizzle.md) for why Drizzle, and
[ADR-0007](../adr/0007-single-association-tenant-seam.md) for the tenancy
decision this section assumes.

## Naming

- Table names: `snake_case`, plural (`event_registrations`, not
  `EventRegistration` or `eventRegistration`). Set via the first argument to
  `pgTable(...)`.
- Column names: `snake_case` (`created_at`, not `createdAt`). The
  pre-Drizzle schema had no `@map` directives, so live columns were
  actually camelCase in Postgres — the Drizzle migration corrected this
  as a deliberate one-time reset (no production data existed to preserve;
  see ADR-0011).
- Drizzle object exports (the JS/TS identifiers): `camelCase`, singular for
  the table binding (`export const eventRegistration = pgTable(...)`),
  matching what `db.query.<name>` expects for the relational query API.
- Enums: `PascalCase` Postgres type name (`EventStatus`), `SCREAMING_SNAKE`
  values (`PUBLISHED`) — unchanged from the original Prisma schema, since
  these are genuinely fine as-is.

## Primary keys

`text("id").primaryKey().$defaultFn(() => crypto.randomUUID())` —
application-generated UUIDs as `TEXT`, not the Postgres `uuid` type and not
a DB-level `gen_random_uuid()` default. This matches what the original
migration SQL actually had (`"id" TEXT NOT NULL`, no default) and there's
no reason to change it as part of an unrelated ORM swap.

## Audit fields

Every mutable table: `created_at` and `updated_at`, both
`timestamp({ withTimezone: true })`, `.notNull().defaultNow()`; `updated_at`
also carries `.$onUpdate(() => new Date())`. Point-in-time records use
`timestamp with time zone`; there is currently no pure-calendar-date use
case in the schema (an AMS may need one for e.g. membership-year
boundaries — add `date()` when that's built, not `timestamp`).

## Soft delete

Only `User.deletedAt` exists today, and nothing actually queries on it
(`deletedAt: null` is never used as a filter anywhere in `src/`) — it's
present but unenforced. New tables that need soft delete should follow the
same `deletedAt: timestamp().nullable()` shape _and_ actually filter on it
in their query layer; don't add the column without the enforcement, which
is the state `User` is in today and is worth fixing, not copying.

## Money

`numeric(column, { precision: 10, scale: 2 })`, left in Drizzle's default
string mode — never `mode: 'number'` for currency columns. Postgres
`numeric` in JS-`number` mode is subject to float rounding error; a string
representation round-trips exactly. Every price/amount/salary column
translated from Prisma's `Decimal` type follows this.

## JSON

`jsonb`, not `json` — matches what Prisma's `Json` type actually emitted in
Postgres, and `jsonb` supports indexing/querying if that's ever needed.

## Relations

Declared with Drizzle's `relations()` helper for the relational query API
(`db.query.<table>.findFirst({ with: {...} })`). Both sides of a relation
must be declared for `with` to work — `src/db/schema/relations.ts` exists
specifically to hold `user`'s many-side relations (accounts, sessions,
created events, etc.) separately from the domain files, because declaring
them inside `users.ts` would create circular imports (every domain file
imports `user`; `users.ts` can't import back from all of them). New
cross-domain relations follow the same pattern: declare the reverse side in
`relations.ts`, not by reaching into another domain file.

## Counter integrity

Denormalized counters exist today (`Event.registeredCount`,
`ForumPost.replyCount`, `JobPosting.applicationCount`, etc.) with no
enforcement mechanism keeping them in sync with the rows they count — they
were copied faithfully from the Prisma schema but nothing writes to them
yet, since nothing queries these tables in real code today. When a module
using these counters gets promoted (`docs/adr/0008-module-maturity-gate.md`),
the service layer that writes the counted rows (registrations, comments,
applications) must update the counter in the same transaction, not as a
follow-up write.
