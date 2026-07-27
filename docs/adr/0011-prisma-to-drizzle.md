# ADR-0011: Migrate the ORM from Prisma to Drizzle

**Status:** Implemented

## Context

The project used Prisma 6.19.1 across 33 tables and 11 call sites (`rbac.ts`, `session-cache.ts`, three services, three admin routes, the better-auth adapter, the seed script, and the client itself). Prisma 7 was available as a major upgrade. The project separately committed to Bun as the canonical runtime and package manager. It also committed to Drizzle-based patterns as its house style. These patterns match the conventions of the maintainer's other projects — module structure, RFC-shaped errors, `withRbac`-wrapped handlers.

## Decision

Replace Prisma with Drizzle rather than upgrade to Prisma 7:

- `src/db/schema/*.ts` is hand-translated from `prisma/schema.prisma`. It is organized by domain (users, auth, membership, events, forum, content, jobs), plus `organization.ts` (ADR-0007) and `relations.ts`.
- Columns switch from Prisma's implicit camelCase (no `@map` directives existed in the source schema — `"emailVerified"`, not `email_verified`, was the actual live column name) to explicit `snake_case`. This change matches the project's coding standard.
- `src/db/client.ts` uses `drizzle-orm/bun-sql`, Bun's native SQL driver. No separate `pg` package exists.
- better-auth's adapter switches from `prismaAdapter` to `drizzleAdapter`.
- `drizzle-kit` replaces `prisma migrate`. The `drizzle/` directory holds the generated migration SQL and its snapshot and journal metadata.

**This is a deliberate breaking schema reset, not a preserve-exact-columns migration.** There is no production data. `prisma/migrations` had exactly one `init` migration, and `db:reset` was a documented, routine development workflow. A clean cutover is safe now. It will not be safe later, once real member data exists. That transition point, when migrations are no longer freely resettable, is itself a milestone. The team should name that milestone explicitly, not cross it silently. See `TODO.md` M3 for the plan to keep migrations compatible once real data exists.

## Consequences

- All 33 original tables plus `Organization` are Drizzle-native. Prisma, `@prisma/client`, and `prisma/` are removed entirely.
- **Verification was compile-time only, not run-time.** This environment had no live Postgres credentials, so it could not run a real migration. `bun run typecheck` verified every query. Drizzle's query builder is fully typed against the schema, and this typing catches the large majority of translation mistakes even without a database connection. `drizzle-kit check` (a migration internal-consistency check) also ran. No query ran against real data. The first real-database test is the next person who runs `bun run db:push` or applies the generated migration.
- This migration found and fixed two latent bugs as a side effect. Drizzle's stricter typing caught both bugs. Prisma's looser `select` typing let them through silently:
  - `getUserWithRoleInfo` in `role.service.ts` read `user.displayName` in its return value, but the original Prisma `select` did not include `displayName`. The value was always `undefined` at runtime. The fix added the column to the selection.
  - The same gap existed in the cached-session shape in `session-cache.ts`.
- Three tables (`custom_roles`, `user_role_assignments`, `role_change_history`) carried over faithfully, although no code reads them. See `TODO.md` M1. This gap is pre-existing. The ORM change should not silently drop these tables to paper over the gap.
