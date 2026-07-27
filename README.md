# Nuvia

Nuvia is an open-source Association Management System (AMS) for a professional association or similar member organization. It manages member records, dues, events, chapters, and communications. The system uses Next.js, Drizzle, PostgreSQL, and Bun.

**Status: pre-1.0, actively hardening.** See [`TODO.md`](TODO.md) for what works today, what is mock data, and what is planned before a 1.0 release. Read `TODO.md` before you evaluate this project for production use. `TODO.md` is more accurate than a features list at this stage.

## What actually works today

Five modules connect to a real PostgreSQL database through Drizzle: **members, events, content, forums, jobs**. Authentication gates access to all five. Everything else in the dashboard (finance, awards, learning, chapters, committees, workspaces) is UI built against mock data. `src/proxy.ts` role-gates these pages the same way it gates other dashboard sections. `src/proxy.ts` checks the role list that `src/lib/navigation-data.ts` declares for each path. As a result, a plain member cannot reach `/dashboard/finance/reports`, for example.

**A module-level maturity flag does not yet exist**, independent of role. Today, an admin or treasurer who opens `/dashboard/finance/reports` sees a fully mock UI with no real schema behind it. The page gives no indication that this is not a working feature. `config/features.ts` ([ADR-0008](docs/adr/0008-module-maturity-gate.md)) is the planned fix. This file does not exist yet (`TODO.md` M3).

## Technology stack

- **Runtime & package manager**: [Bun](https://bun.sh) ([ADR-0012](docs/adr/0012-bun-package-manager-and-runtime.md))
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui (Radix primitives)
- **Database**: PostgreSQL via Drizzle ORM ([ADR-0011](docs/adr/0011-prisma-to-drizzle.md))
- **Authentication**: better-auth
- **Caching / rate limiting**: Redis
- **Lint / format**: oxlint / oxfmt ([ADR-0013](docs/adr/0013-oxlint-oxfmt-toolchain.md))

## Architecture

```
route.ts / server action  →  service function  →  Drizzle (src/db/client.ts)
```

This project does not use the four-layer Controller/Service/Manager/Data design that an earlier version of this README described. No `managers/` directory exists in this project. See [`docs/architecture/overview.md`](docs/architecture/overview.md) for full detail, including the route-group security taxonomy and the module maturity system.

## Getting started

### Prerequisites

- [Bun](https://bun.sh) 1.3+
- PostgreSQL
- Redis (required in production, optional in development — `src/lib/env.ts` enforces this)

### Installation

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/amaruki/nuvia.git
   cd nuvia
   bun install
   ```

   `bun install` also installs the git hooks (`lefthook`) that run `oxlint`/`oxfmt` on every commit — see [ADR-0010](docs/adr/0010-ai-agent-commit-guard.md).

2. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

   `src/lib/env.ts` validates every variable at boot. An invalid or missing required value fails immediately with a readable error. The system does not fall back silently. The system always requires `DATABASE_URL` and `BETTER_AUTH_SECRET`. The system requires `REDIS_URL` when `NODE_ENV=production`.

3. Generate a secure `BETTER_AUTH_SECRET`:

   ```bash
   openssl rand -base64 32
   ```

4. Set up the database:

   ```bash
   bun run db:generate   # generate a migration from the current schema
   bun run db:push       # apply it (dev) — or db:migrate for a tracked migration
   ```

5. Seed an admin account. This step **requires an explicit password**, on purpose. An earlier seed script hardcoded one shared password across five privileged accounts (see [ADR-0009](docs/adr/0009-security-hardening-p0.md)):

   ```bash
   SEED_ADMIN_PASSWORD=$(openssl rand -base64 24) bun run db:seed
   ```

6. Start the development server:

   ```bash
   bun run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Google OAuth (optional)

1. In [Google Cloud Console](https://console.cloud.google.com/), go to APIs & Services → Credentials → Create Credentials → OAuth client ID.
2. Select **Web application** as the application type.
3. Enter the authorized redirect URI. Use `http://localhost:3000/api/auth/callback/google` in development, and your production domain's equivalent in production. Do not add a trailing slash or extra parameters. A mismatch here is the most common cause of OAuth setup failure.
4. Copy the Client ID and Secret into `.env.local`.

## Development

### Scripts

| Command                                                        | Does                                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `bun run dev`                                                  | Start the dev server                                                      |
| `bun run build`                                                | Production build                                                          |
| `bun run lint` / `lint:fix`                                    | oxlint                                                                    |
| `bun run format` / `format:check`                              | oxfmt                                                                     |
| `bun run typecheck`                                            | `tsc --noEmit`                                                            |
| `bun test`                                                     | Run tests                                                                 |
| `bun run guard:light`                                          | lint + format + typecheck (fast)                                          |
| `bun run guard:heavy`                                          | `guard:light` + test + migration-drift check + build + `bun audit --prod` |
| `bun run db:generate` / `db:migrate` / `db:push` / `db:studio` | Drizzle                                                                   |
| `bun run db:seed`                                              | Seed an admin account (`SEED_ADMIN_PASSWORD` required)                    |

### Code quality

- **oxlint** and **oxfmt** replaced ESLint and Prettier ([ADR-0013](docs/adr/0013-oxlint-oxfmt-toolchain.md)). The previous ESLint config downgraded most rules to warnings. As a result, nothing actually blocked a build.
- **TypeScript** runs in strict mode.
- **bun test** runs the test suite. Test coverage is currently near zero. See [`TODO.md`](TODO.md) M2 for the first ten new tests and the reason the project needs them.
- **lefthook** — pre-commit (lint + format), commit-msg (Conventional Commits, no `Co-Authored-By` trailers), pre-push (typecheck + test).

### Project structure

```
src/
├── app/                 # Next.js App Router — pages & API routes
├── db/
│   ├── schema/          # Drizzle table definitions
│   └── client.ts        # Drizzle client (drizzle-orm/bun-sql)
├── lib/
│   ├── services/        # Business logic (route.ts → service → Drizzle)
│   ├── validation/       # Zod schemas, one file per domain
│   ├── auth/             # better-auth config, session handling
│   └── env.ts             # Validated environment config — import this, not process.env
├── components/            # React components
├── types/                 # TypeScript type definitions
└── proxy.ts                # Next.js 16's middleware.ts replacement (network-boundary auth)
```

## Documentation

- [`TODO.md`](TODO.md) — the real roadmap: what works, what is mock, what is planned, in order.
- [`docs/PRINCIPLES.md`](docs/PRINCIPLES.md) — the eight principles this project holds itself to, and the two places they conflict.
- [`docs/architecture/`](docs/architecture/) — layering, route-group security taxonomy, data model conventions.
- [`docs/api/conventions.md`](docs/api/conventions.md) — the RFC 9457 error contract and route shape.
- [`docs/security/`](docs/security/) — threat model, controls mapping, privacy/GDPR posture.
- [`docs/supply-chain.md`](docs/supply-chain.md) / [`docs/release.md`](docs/release.md) — dependency policy, signing, migration compatibility.
- [`docs/adr/`](docs/adr/) — every contested decision, with the reasoning.
- [`CODING_STANDARD.md`](CODING_STANDARD.md) — the rules day to day.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — how to actually contribute.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). [`TODO.md`](TODO.md) tags several items **good first issue**.

## Security

See [`SECURITY.md`](SECURITY.md) for how to report a vulnerability, and [`docs/security/`](docs/security/) for the threat model and controls this project maintains against.

## License

[MIT](LICENSE).
