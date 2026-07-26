# ADR-0011: Migrate the ORM from Prisma to Drizzle

**Status:** Implemented

## Context

The project used Prisma 6.19.1 across 33 tables and 11 call sites
(`rbac.ts`, `session-cache.ts`, three services, three admin routes, the
better-auth adapter, the seed script, and the client itself). Prisma 7 was
available as a major upgrade. The project separately committed to Bun as
the canonical runtime and package manager, and to Drizzle-based patterns as
its house style (matching the maintainer's other projects' conventions —
module structure, RFC-shaped errors, `withRbac`-wrapped handlers).

## Decision

Replace Prisma with Drizzle rather than upgrade to Prisma 7:

- `src/db/schema/*.ts` — hand-translated from `prisma/schema.prisma`,
  organized by domain (users, auth, membership, events, forum, content,
  jobs) plus `organization.ts` (ADR-0007) and `relations.ts`.
- Columns switch from Prisma's implicit camelCase (no `@map` directives
  existed in the source schema — `"emailVerified"`, not `email_verified`,
  was the actual live column name) to explicit `snake_case`, matching the
  project's coding standard.
- `src/db/client.ts` uses `drizzle-orm/bun-sql` — Bun's native SQL driver,
  no separate `pg` package.
- better-auth's adapter switches from `prismaAdapter` to `drizzleAdapter`.
- `drizzle-kit` replaces `prisma migrate`; `drizzle/` holds the generated
  migration SQL and its snapshot/journal metadata.

**This is a deliberate breaking schema reset, not a preserve-exact-columns
migration.** There is no production data — `prisma/migrations` had exactly
one `init` migration, and `db:reset` was a documented, routine development
workflow. A clean cutover is safe now and would not be safe later, once
real member data exists; that transition point (when migrations stop being
freely resettable) is itself a milestone worth naming explicitly rather
than crossing silently. See `TODO.md` M3 for the plan to keep migrations
compatible once real data exists.

## Consequences

- All 33 original tables plus `Organization` are Drizzle-native. Prisma,
  `@prisma/client`, and `prisma/` are removed entirely.
- **Verification was compile-time only, not run-time.** This environment
  had no live Postgres credentials to run a real migration against — every
  query was verified by `bun run typecheck` (Drizzle's query builder is
  fully typed against the schema, which catches the large majority of
  translation mistakes even without a database connection) and by
  `drizzle-kit check` (migration internal-consistency check), but never
  executed against real data. The first real-database test is the next
  person who runs `bun run db:push` or applies the generated migration.
- Two latent bugs were found and fixed as a side effect of this migration,
  both because Drizzle's stricter typing caught what Prisma's looser
  `select` typing had let through silently:
  - `role.service.ts`'s `getUserWithRoleInfo` read `user.displayName` in
    its return value without including `displayName` in the original
    Prisma `select` — always `undefined` at runtime. Fixed by adding the
    column to the selection.
  - The same gap existed in `session-cache.ts`'s cached-session shape.
- Three tables (`custom_roles`, `user_role_assignments`,
  `role_change_history`) carried over faithfully despite being unread by
  any code — see `TODO.md` M1, this is a pre-existing gap, not something
  the ORM change should paper over by silently dropping them.
