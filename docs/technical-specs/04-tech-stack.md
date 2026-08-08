# 4. Tech Stack

Every choice below was already made and recorded in an ADR before this document existed; this table is a dense reference to those decisions, not a new grill. See the linked ADR for the reasoning.

## 4.1 Runtime and language

| Component       | Technology              | Justification                                              |
| --------------- | ----------------------- | ---------------------------------------------------------- |
| Runtime         | Bun 1.3+                | [ADR-0012](../adr/0012-bun-package-manager-and-runtime.md) |
| Language        | TypeScript, strict mode | Type safety across the route -> service -> Drizzle chain   |
| Package manager | Bun (`bun`, `bunx`)     | Same ADR-0012; npm/yarn/pnpm are forbidden                 |

## 4.2 Backend

| Component      | Technology                                            | Justification                                                                      |
| -------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router)                               | Server Components by default ([ADR-0006](../adr/0006-server-first-components.md))  |
| API style      | REST, versioned under `/api/v1/**`                    | Matches the route.ts -> service -> Drizzle layering                                |
| Validation     | Zod                                                   | Request/response schema validation, one file per domain in `src/lib/validation/`   |
| ORM            | Drizzle ORM                                           | [ADR-0011](../adr/0011-prisma-to-drizzle.md), replacing Prisma                     |
| Error contract | RFC 9457 Problem Details (`src/lib/http.ts`)          | [ADR-0002](../adr/0002-rfc9457-error-contract.md)                                  |
| Authorization  | `requirePermission` / `requireRole` (`src/lib/rbac/`) | [ADR-0001](../adr/0001-one-authorization-helper.md), the sole authorization helper |
| Rate limiting  | Redis-backed (`src/lib/rate-limit.ts`)                | [ADR-0003](../adr/0003-single-rate-limiter.md)                                     |
| Logging        | One structured logger (`src/lib/logger.ts`)           | [ADR-0004](../adr/0004-one-structured-logger.md)                                   |
| Authentication | better-auth                                           | Session cookies, `httpOnly`, `SameSite=Lax`                                        |

## 4.3 Frontend

| Component       | Technology                   | Justification                                                                                                 |
| --------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Framework       | React 19                     | Bundled with Next.js 16                                                                                       |
| Rendering model | Server Components by default | [ADR-0006](../adr/0006-server-first-components.md); `"use client"` requires a documented interactivity reason |
| Styling         | Tailwind CSS v4              | Utility-first, no separate CSS-in-JS runtime                                                                  |
| Components      | shadcn/ui (Radix primitives) | Accessible primitives, copied into the repo rather than a runtime dependency                                  |

## 4.4 Datastores

| Component             | Technology     | Justification                                                                                                           |
| --------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Primary database      | PostgreSQL     | Via Drizzle ORM ([ADR-0011](../adr/0011-prisma-to-drizzle.md))                                                          |
| Cache / rate limiting | Redis          | Required in production ([ADR-0003](../adr/0003-single-rate-limiter.md)); optional in development                        |
| Object storage        | None installed | `src/lib/services/media.service.ts` never writes a file yet; S3/Cloudinary/local-disk is an open decision, not yet made |
| Search                | None           | No full-text search engine in use; Postgres `ILIKE`/basic queries only                                                  |

### Migration and seed mechanism

`drizzle-kit` is the migration tool. `drizzle.config.ts` resolves `schema: "./src/db/schema/index.ts"` and `out: "./drizzle"` relative to the project root, and reads `DATABASE_URL` from the environment (not hardcoded). Commands: `bun run db:generate` (generate a migration from the current schema), `bun run db:migrate` (apply tracked migrations), `bun run db:push` (dev-only direct schema push), `bun run db:seed` (`scripts/seed.ts`, requires `SEED_ADMIN_PASSWORD`), `bun run db:reset` (`drizzle-kit push --force && bun run db:seed`, development only). See Section 6.8 for the full migration/seed specification and Section 6.9 for the reset-db-state endpoint that wraps this for QA.

## 4.5 Tooling

| Component     | Technology     | Justification                                                                                                                                                         |
| ------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lint / format | oxlint / oxfmt | [ADR-0013](../adr/0013-oxlint-oxfmt-toolchain.md), replacing ESLint/Prettier                                                                                          |
| Type check    | `tsc --noEmit` | Strict mode                                                                                                                                                           |
| Test          | `bun test`     | Coverage built up from zero per `TODO.md` M2                                                                                                                          |
| Git hooks     | lefthook       | Pre-commit (lint + format), commit-msg (Conventional Commits, no AI co-author trailer, [ADR-0010](../adr/0010-ai-agent-commit-guard.md)), pre-push (typecheck + test) |
| CI            | GitHub Actions | `.github/workflows/ci.yml`, fast job (lint/format/typecheck) and heavy job (test, migration-drift check, build, `bun audit --prod`) with real Postgres/Redis services |

## 4.6 Infra and integrations

| Component        | Technology                                            | Justification                                                                                                                                                        |
| ---------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hosting target   | Not yet fixed                                         | No deployment target is pinned in this repository today                                                                                                              |
| Containerization | Not yet defined                                       | No Dockerfile exists yet                                                                                                                                             |
| Email            | Resend or nodemailer                                  | Picked per-deployment based on which environment variables are configured (`RESEND_API_KEY` versus `EMAIL_HOST` and related), via `src/lib/auth.ts`'s `EmailService` |
| OAuth providers  | Google (required-optional), GitHub/LinkedIn (planned) | Enabled only when their client ID/secret pair is present                                                                                                             |

## 4.7 What we deliberately do NOT use

| Tool                                                          | Reason                                                                                      |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Prisma                                                        | Fully removed; see [ADR-0011](../adr/0011-prisma-to-drizzle.md)                             |
| npm / yarn / pnpm                                             | [ADR-0012](../adr/0012-bun-package-manager-and-runtime.md)                                  |
| ESLint / Prettier                                             | Replaced by oxlint/oxfmt, [ADR-0013](../adr/0013-oxlint-oxfmt-toolchain.md)                 |
| In-memory `Map`-based rate limiters                           | Cannot survive more than one server process; [ADR-0003](../adr/0003-single-rate-limiter.md) |
| Ad-hoc `NextResponse.json({ error: ... })` shapes             | Replaced by the RFC 9457 contract, [ADR-0002](../adr/0002-rfc9457-error-contract.md)        |
| `withAuth` / `withRole` / `withResourceAuth` / `authorizeApi` | Deleted per-route auth wrappers; [ADR-0001](../adr/0001-one-authorization-helper.md)        |

## 4.8 Version-pinning policy

Every entry in `package.json` is an exact version, never a `^` or `~` range. Adding a dependency means adding it at an exact, currently published version. Bumping a dependency is its own isolated, revertible commit, never a side effect of an unrelated change (`CLAUDE.md`). A minimum-release-age adoption cooldown (14 days, proposed, not yet enforced by tooling) is the intended defense against a compromised-maintainer-account supply-chain attack (`docs/supply-chain.md`).
