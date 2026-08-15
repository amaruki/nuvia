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

This document states rules. The reasoning behind the contested ones lives in `docs/adr/`. Where the two disagree, the ADR is the source of truth and this file is stale. File an issue.

## 1. General Principles

See `docs/PRINCIPLES.md` for the eight principles and their two documented conflicts. Practically, day to day:

- Write code for the next contributor, who has less context than you do right now.
- Prefer explicit over implicit — no hidden side effects, no magic configuration.
- Each function, file, or module does one thing.
- Comments explain _why_, not _what_ — the code already says what.
- No dead code on `main`. Delete a helper with zero call sites. Do not keep it "in case."
- No `@ts-ignore`/`@ts-expect-error` or `any` without a comment that explains why the code cannot express the type properly.

## 2. TypeScript Standards

### 2.1 Compiler settings

`strict: true` is already on. `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are **not** turned on yet. The codebase has 164 pre-existing `any` usages. If the project turns these flags on now, the build fails immediately and there is no quick fix. The project adopts these flags incrementally, file by file, as part of the module promotion work (`docs/adr/0008-module-maturity-gate.md`), not all at once.

### 2.2 Rules

- No new `any`. Use `unknown` and narrow with a type guard.
- Exported functions have explicit return types.
- `type` for data shapes. `interface` only for a contract meant to be extended (a plugin API, for instance).
- Use string literal unions, not TypeScript `enum`. This matches the existing `PostStatus`, `EventType`, etc. pattern in `src/db/schema/enums.ts`.
- Zod schemas are the source of truth for request/response shapes. Derive the TS type with `z.infer<>`. Do not hand-write a parallel interface.

## 3. Backend Standards (Next.js + Bun + Drizzle)

### 3.1 The actual layering

See `docs/architecture/overview.md` for the full description. Here is the short version:

```
route.ts / server action  →  service function  →  Drizzle
```

A `route.ts` handler does four things, in order:

- Authorizes first (`requirePermission`, `docs/adr/0001-one-authorization-helper.md`).
- Validates input with zod.
- Calls exactly one service function.
- Returns an RFC 9457 error or a success envelope (`docs/api/conventions.md`).

A service function is a plain `export async function`, not a class with static methods. New services follow this convention. Some existing services (`RoleService`, `OAuthService`) predate the convention and do not follow it yet.

### 3.2 Where schemas live

Request/response validation schemas live in `src/lib/validation/<domain>.validation.ts`, one file per domain. This matches the existing `auth.validation.ts`, `event.validation.ts` pattern. Do not use one schema file per endpoint. Cross-cutting literal unions (roles, permissions, statuses) live in `src/types/` or `src/db/schema/enums.ts`, whichever already owns that concept. Do not introduce a third location for the same kind of value.

### 3.3 Error handling

Domain errors extend `Error` with a `code` and `status` (`src/lib/errors.ts` already has this shape: `ValidationError`, `NotFoundError`, `AuthorizationError`, etc.). Reuse these. Do not reintroduce a parallel error hierarchy per module. The route handler's error boundary converts a thrown domain error into an RFC 9457 response through `problemResponse()` (`src/lib/http.ts`, [ADR-0002](docs/adr/0002-rfc9457-error-contract.md)).

### 3.4 Environment variables

Import `env` from `src/lib/env.ts`. Never read `process.env` directly in application code. The only exceptions are `drizzle.config.ts`, files under `scripts/`, and `src/proxy.ts` (the Next.js edge/network boundary: it cannot reach the validated `env` export the same way a Node-runtime route can). Each of these files documents the exception inline where it applies.

### 3.5 Async discipline

`async`/`await`, never `.then()` chains. No fire-and-forget without an explicit `.catch()` that logs. An unhandled rejection in a request handler is a silent failure. Silent failures are exactly what `docs/observability.md` exists to prevent.

## 4. Frontend Standards (React)

### 4.1 Server-first

Default to a Server Component (`docs/adr/0006-server-first-components.md`). Add `"use client"` only when the component needs browser APIs, interactive local state, or a client-only hook (`react-hook-form`, `next-themes`). Do not add it by default, and do not add it because the surrounding file already has it. The 77% `"use client"` figure across this codebase is the example of what this rule prevents. It is not a precedent to match.

### 4.2 Component rules

- One component per file, default export.
- Props type named `{ComponentName}Props`.
- No prop spreading (`...rest`) outside a documented low-level wrapper (for example, a shadcn primitive).
- No `fetch` or zod parsing inside a presentational component. That belongs in a hook (`src/lib/hooks/`) or a server component's data fetching.

### 4.3 Forms

Use React Hook Form with `zodResolver`. Import the schema from the domain's `src/lib/validation/*.ts` file (§3.2). Do not redefine it inline in the form component. The form shows field errors inline, in English (§10).

### 4.4 Dashboard CRUD forms

Dashboard CRUD opens in a Sheet on the list page, not on a separate route. The open state lives in the URL (`?form=new` for create, `?form=<id>` for edit) so forms are shareable, refresh-safe, and closed by the back button. Do not add new `/create` or `/[id]/edit` dashboard pages; the ratchet in `tests/unit/form-standard.test.ts` enforces this and the matching schema-location rule from §3.2.

Build forms from `src/components/dashboard/form-sheet/`:

- `useFormSheet()` owns the URL open state (`openCreate`, `openEdit(id)`, `close`).
- `FormSheet` is the container: fixed header, scrollable body, sticky footer, and the dirty-close confirmation via `UnsavedChangesGuard`.
- `FormActions` renders Cancel + submit in the footer; the submit button is linked to the form by id.
- `FormSection` groups fields under a small heading inside the body.
- Field shorthands (`TextField`, `TextareaField`, `SelectField`, `NumberField`, `CheckboxField`, `DateField`) keep labels, help text, required markers, and error messages identical everywhere. The `required` prop renders the asterisk.

Widgets the shorthands cannot express (file uploads, rich editors, icon pickers, field arrays) compose the `ui/form` primitives (`FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`) directly. Never hand-roll error text or red borders outside `FormMessage`.

On success: sonner toast, close the sheet, invalidate queries. On failure: inline destructive `Alert` inside the sheet body. Settings-style forms that legitimately stay full pages follow the same field, schema, and validation rules without the Sheet.

Reference implementation: `src/app/dashboard/content/categories/_components/category-form/`.

## 5. Database Standards (Drizzle ORM)

See `docs/architecture/data-model.md` for full detail. Summary:

- `snake_case` table and column names.
- `text` UUID primary keys with an application-generated default.
- `created_at`/`updated_at` on every mutable table.
- `numeric` in string mode for money.
- `jsonb` for JSON.
- Relations declared via Drizzle's `relations()` helper.

### 5.1 Migrations

`bun run db:generate` produces the migration from the current `src/db/schema/*.ts`. Migration files under `drizzle/` are committed, never hand-edited after generation. If a rebase touches the schema, regenerate the migration. Do not resolve a migration-file conflict by hand.

### 5.2 Transactions

Every multi-table write — a mutation plus its audit-log entry, a role change plus its history record — uses `db.transaction()`. The fix to `changeUserRole` in `docs/adr/0009-security-hardening-p0.md` is the canonical example. The role update and the audit write happen in one transaction specifically because they did not before. That gap let the audit trail silently diverge from the actual state.

## 6. Testing Standards

- `bun test` — no separate test-runner dependency (`docs/adr/0012-bun-package-manager-and-runtime.md`). Runner-level config (preload, timeouts, coverage flags) lives in `bunfig.toml`; `tests/preload.ts` pins `TZ=UTC` so date-window assertions never depend on the host timezone.
- **Suite split.** `tests/unit/` is the infra-free unit suite (`bun run test:unit`): no docker, no network, runs in seconds, and is what the pre-push hook and `guard:light` execute. Everything else under `tests/` is integration: it talks to the compose stack (Postgres `127.0.0.1:15433`, Redis `127.0.0.1:16380`) and runs via `bun run test:integration` locally and in CI. New tests go in `tests/unit/` unless they genuinely need a live database, Redis, or the auth handler stack. The Playwright gates (`bun run test:a11y`, `bun run test:smoke`) are separate commands and run in CI's `browser` job.
- Write backend service and repository-equivalent (Drizzle query) tests for new code. Write frontend tests when a component carries non-trivial logic, not for every presentational component.
- **Unit tests that touch data mock at the database client boundary** (`src/db/client.ts`'s `db` export) using `tests/unit/db-mock.ts` — never at an intermediate service or repository layer. If you mock an intermediate module, a change to that module's internals breaks unrelated tests that happen to import through it. The full usage contract — including when holding a db mock is safe — lives in `tests/unit/db-mock.ts`.

```ts
import { mockDbClient, restoreDbClient } from "./db-mock";

mockDbClient(stubDb); // register BEFORE importing the module under test
const { getUserWithRoleInfo } = await import("@/lib/services/role.service");
// …assert…
restoreDbClient(); // in afterAll when the file mixes mocked and real imports
```

- **Isolation — the hard-won rule:** `mock.module()` rewrites the module registry of the ENTIRE test process, not of one file. Bun runs every file of a `bun test` invocation in one process, files concurrently, so a registered mock is visible to every file in the same run. Holding a db stub during a full `bun test` run corrupts concurrent integration files (`db.insert is not a function`) — this happened, and is why the db mock is restricted to `bun run test:unit` runs with at most one holder at a time. Leaf-module mocks that only the mocking file imports (session hooks, `next/navigation`) do not need this discipline. Inside one file, `mock.module()` is likewise global: register before importing the module under test, and restore in `afterAll` if later tests in the same file need the real module. Note `mock.restore()` only resets function mocks (`mock()`/`spyOn()`), not module mocks; that is why `restoreDbClient()` exists.
- **Speed budget:** the unit suite must stay runnable with docker down. Never import a module that opens connections at import time; clients in this repo are lazy (connections on first query), and the unit suite proves it by running with the stack down.

## 7. Git Workflow

### 7.1 Branches

```
feature/<short-description>
fix/<short-description>
chore/<short-description>
```

### 7.2 Commits

- Conventional Commits: `<type>(<scope>): <subject>`.
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`, `build`, `revert` — enforced by `commitlint.config.ts`.
- Imperative mood, subject under 80 characters.
- **Never a `Co-Authored-By:` trailer** — enforced by a commit-msg hook, see `docs/adr/0010-ai-agent-commit-guard.md`.
- Separate concerns into separate commits. Do not make one commit do three unrelated things.

### 7.3 Pull requests

Once an owner configures branch protection (a decision that this document does not make unilaterally — see `docs/adr/0010`), the project requires all of the following before a merge to `main`:

- No direct pushes to `main`.
- A passing CI run (`bun run guard:heavy`).
- At least one human review.

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

All code identifiers are English. UI copy is English (§10).

## 9. Code Formatting

- Formatter: `oxfmt`.
- Linter: `oxlint`.
- `lefthook`'s pre-commit hook runs both on staged files automatically (installed via `bun install`'s `prepare` script — no separate setup step, `docs/adr/0010-ai-agent-commit-guard.md`).

## 10. Localization

UI copy is English. No i18n library is in place yet — copy lives inline in the component that uses it. If a future milestone needs multi-language support (a real possibility for an association with non-English-speaking members), that is a deliberate decision that requires its own ADR. Do not hardcode a second language inline to avoid that decision.

Dates use `date-fns` with an explicit locale, not the browser default. Currency: the project does not hardcode an association-specific currency. The `Organization.currency` field (`docs/adr/0007-single-association-tenant-seam.md`) is the source of truth once dues/finance (M3) reads it.
