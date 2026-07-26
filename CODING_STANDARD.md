# Coding Standard

## Table of Contents

1. [General Principles](#1-general-principles)
2. [TypeScript Standards](#2-typescript-standards)
3. [Backend Standards (Next.js + Bun + Drizzle)](#3-backend-standards-nextjs--bun--drizzle)
4. [Frontend Standards (React)](#4-frontend-standards-react)
5. [Database Standards (Drizzle ORM)](#5-database-standards-drizzle-orm)
6. [Testing Standards](#6-testing-standards)
7. [Git Workflow](#7-git-workflow)
8. [File and Folder Naming](#8-file-and-folder-naming)
9. [Code Formatting](#9-code-formatting)
10. [Localization](#10-localization)

This document states rules; the reasoning behind the contested ones lives
in `docs/adr/`.
Where the two disagree, the ADR is the source of truth and this file is
stale — file an issue.

## 1. General Principles

See `docs/PRINCIPLES.md` for the eight principles and their two documented
conflicts.
Practically, day to day:

- Write code for the next contributor, who has less context than you do
  right now.
- Prefer explicit over implicit — no hidden side effects, no magic
  configuration.
- Each function, file, or module does one thing.
- Comments explain _why_, not _what_ — the code already says what.
- No dead code on `main`.
  A helper with zero call sites gets deleted, not kept "in case."
- No `@ts-ignore`/`@ts-expect-error` or `any` without a comment explaining
  why the type can't be expressed properly.

## 2. TypeScript Standards

### 2.1 Compiler settings

`strict: true` is already on.
`noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are **not**
turned on yet — the codebase has 164 pre-existing `any` usages and turning
these on now would produce an unfixable red build.
They're adopted incrementally, file by file, as part of the module
promotion work (`docs/adr/0008-module-maturity-gate.md`), not flipped
globally.

### 2.2 Rules

- No new `any`.
  Use `unknown` and narrow with a type guard.
- Exported functions have explicit return types.
- `type` for data shapes; `interface` only for a contract meant to be
  extended (a plugin API, for instance).
- String literal unions, not TypeScript `enum` — matches the existing
  codebase's `PostStatus`, `EventType`, etc.
  pattern in `src/db/schema/enums.ts`.
- Zod schemas are the source of truth for request/response shapes; derive
  the TS type with `z.infer<>`, don't hand-write a parallel interface.

## 3. Backend Standards (Next.js + Bun + Drizzle)

### 3.1 The actual layering

`docs/architecture/overview.md` states this in full; the short version:

```
route.ts / server action  →  service function  →  Drizzle
```

A `route.ts` handler authorizes first (`requirePermission`,
`docs/adr/0001-one-authorization-helper.md`), validates input with zod,
calls exactly one service function, and returns an RFC 9457 error or a
success envelope (`docs/api/conventions.md`).
A service function is a plain `export async function`, not a class with
static methods — new services follow this even though some existing ones
(`RoleService`, `OAuthService`) predate the convention and haven't been
migrated yet.

### 3.2 Where schemas live

Request/response validation schemas live in `src/lib/validation/<domain>.validation.ts`,
one file per domain, matching the existing `auth.validation.ts`,
`event.validation.ts` pattern — not one schema file per endpoint.
Cross-cutting literal unions (roles, permissions, statuses) live in
`src/types/` or `src/db/schema/enums.ts`, whichever already owns that
concept; don't introduce a third location for the same kind of value.

### 3.3 Error handling

Domain errors extend `Error` with a `code` and `status`
(`src/lib/errors.ts` already has this shape — `ValidationError`,
`NotFoundError`, `AuthorizationError`, etc.) — reuse these, don't
reintroduce a parallel error hierarchy per module.
The route handler's error boundary converts a thrown domain error into an
RFC 9457 response once `docs/adr/0002-rfc9457-error-contract.md` lands.

### 3.4 Environment variables

Import `env` from `src/lib/env.ts`.
Never read `process.env` directly in application code.
The only exceptions are `drizzle.config.ts`, files under `scripts/`, and
`src/proxy.ts` (the Next.js edge/network boundary — it can't reach the
validated `env` export the same way a Node-runtime route can) — each of
these documents the exception inline where it applies.

### 3.5 Async discipline

`async`/`await`, never `.then()` chains.
No fire-and-forget without an explicit `.catch()` that logs — an unhandled
rejection in a request handler is a silent failure, and silent failures
are exactly what `docs/observability.md` exists to prevent.

## 4. Frontend Standards (React)

### 4.1 Server-first

Default to a Server Component (`docs/adr/0006-server-first-components.md`).
`"use client"` is added only when the component needs browser APIs,
interactive local state, or a client-only hook (`react-hook-form`,
`next-themes`) — not by default, and not because the surrounding file
already has it (the 77% `"use client"` figure across this codebase is the
example of what this rule prevents, not a precedent to match).

### 4.2 Component rules

- One component per file, default export.
- Props type named `{ComponentName}Props`.
- No prop spreading (`...rest`) outside a documented low-level wrapper
  (e.g. a shadcn primitive).
- No `fetch` or zod parsing inside a presentational component — that
  belongs in a hook (`src/lib/hooks/`) or a server component's data
  fetching.

### 4.3 Forms

React Hook Form + `zodResolver`, with the schema imported from the domain's
`src/lib/validation/*.ts` file (§3.2) — not redefined inline in the form
component.
Field errors are shown inline, in English (§10).

## 5. Database Standards (Drizzle ORM)

Full detail in `docs/architecture/data-model.md`.
Summary: `snake_case` table and column names, `text` UUID primary keys with
an application-generated default, `created_at`/`updated_at` on every
mutable table, `numeric` in string mode for money, `jsonb` for JSON,
relations declared via Drizzle's `relations()` helper.

### 5.1 Migrations

`bun run db:generate` produces the migration from the current
`src/db/schema/*.ts`; migration files under `drizzle/` are committed, never
hand-edited after generation.
Regenerate after a rebase that touched the schema rather than resolving a
migration-file conflict by hand.

### 5.2 Transactions

Every multi-table write — a mutation plus its audit-log entry, a role
change plus its history record — uses `db.transaction()`.
`docs/adr/0009-security-hardening-p0.md`'s fix to `changeUserRole` is the
canonical example: the role update and the audit write happen in one
transaction specifically because they didn't before, and that gap let the
audit trail silently diverge from the actual state.

## 6. Testing Standards

- `bun test` — no separate test-runner dependency
  (`docs/adr/0012-bun-package-manager-and-runtime.md`).
- Backend service and repository-equivalent (Drizzle query) tests are
  required for new code; frontend tests are written when a component
  carries non-trivial logic, not for every presentational component.
- **Mock at the database client boundary** (`src/db/client.ts`'s `db`
  export), not at an intermediate service or repository layer — mocking an
  intermediate module means a change to that module's internals breaks
  unrelated tests that happen to import through it.

```ts
const mockFindFirst = mock((): Promise<User | undefined> => Promise.resolve(undefined));
mock.module("@/db/client", () => ({
  db: {
    query: { user: { findFirst: mockFindFirst } },
    transaction: (fn: any) => fn({}),
  },
}));
const { getUserWithRoleInfo } = await import("./role.service");
```

`bun`'s `mock.module()` is global for the test file — mocking anything
other than the DB client boundary risks silently breaking a sibling test
that imports the same module for an unrelated reason.

## 7. Git Workflow

### 7.1 Branches

```
feature/<short-description>
fix/<short-description>
chore/<short-description>
```

### 7.2 Commits

Conventional Commits: `<type>(<scope>): <subject>`.
Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`,
`build`, `revert` — enforced by `commitlint.config.ts`.
Imperative mood, subject under 80 characters.
**Never a `Co-Authored-By:` trailer** — enforced by a commit-msg hook, see
`docs/adr/0010-ai-agent-commit-guard.md`.
Separate concerns into separate commits rather than one commit doing three
unrelated things.

### 7.3 Pull requests

Once branch protection is configured (an owner decision, deliberately not
made unilaterally by this document — see `docs/adr/0010`): direct pushes to
`main` are blocked, CI (`bun run guard:heavy`) must pass, and at least one
human review is required before merge.

## 8. File and Folder Naming

| Item                  | Convention             | Example                     |
| --------------------- | ---------------------- | --------------------------- |
| Folders               | `kebab-case`           | `event-registrations/`      |
| TypeScript files      | `kebab-case`           | `role.service.ts`           |
| React component files | `kebab-case`           | `event-card.tsx`            |
| Test files            | source name + `.test`  | `role.service.test.ts`      |
| Constants             | `SCREAMING_SNAKE_CASE` | `MAX_UPLOAD_SIZE_MB`        |
| Variables / functions | `camelCase`            | `getUserWithRoleInfo`       |
| Types / interfaces    | `PascalCase`           | `CreateEventInput`          |
| Zod schemas           | `camelCase` + `Schema` | `createEventSchema`         |
| Drizzle table exports | `camelCase`, singular  | `user`, `eventRegistration` |
| Environment variables | `SCREAMING_SNAKE_CASE` | `DATABASE_URL`              |

All code identifiers are English.
UI copy is English (§10).

## 9. Code Formatting

- Formatter: `oxfmt`.
- Linter: `oxlint`.
- `lefthook`'s pre-commit hook runs both on staged files automatically
  (installed via `bun install`'s `prepare` script — no separate setup step,
  `docs/adr/0010-ai-agent-commit-guard.md`).

## 10. Localization

UI copy is English.
No i18n library is in place yet — copy lives inline in the component that
uses it.
If a future milestone needs multi-language support (a real possibility for
an association with non-English-speaking members), that's a deliberate
decision requiring its own ADR, not something to route around by hardcoding
a second language inline.
Dates use `date-fns` with an explicit locale, not the browser default.
Currency: no association-specific currency is hardcoded — the
`Organization.currency` field (`docs/adr/0007-single-association-tenant-seam.md`)
is the source of truth once dues/finance (M3) reads it.
