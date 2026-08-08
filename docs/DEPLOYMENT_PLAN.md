# Deployment Plan

How to run Nuvia, produced for backlog item F4. Sources of truth:
`src/lib/env.ts` (boot-time env validation), `.env.example`,
`package.json` scripts, `drizzle/` migrations, `.github/workflows/`,
`docs/release.md`, `docs/observability.md`.

## Runtime

| Piece                                 | Value                                                                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Package manager & test runner         | Bun (`bun install`, `bun test`)                                                                                              |
| Framework                             | Next.js 16 (App Router), `bun run build` / `bun run start`                                                                   |
| Route runtime                         | Default for all routes, except `POST /api/v1/webhooks/stripe`, which pins `runtime = "nodejs"` (Stripe SDK uses Node crypto) |
| Database                              | PostgreSQL via Drizzle ORM 0.45 (`drizzle-kit` 0.31)                                                                         |
| Cache / rate limiting / session cache | Redis (ioredis) — **required in production** (ADR-0003)                                                                      |
| Payments                              | Gateway adapter seam (ADR-0015): `manual` (default, credential-free) or `stripe`                                             |

The app fails fast at boot: `src/lib/env.ts` parses `process.env` once at
import time and throws a readable error on missing/malformed values. A
misconfigured production deploy does not boot.

## Environment variables

### Required (boot fails without them)

| Variable             | Rule                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `APP_URL`            | Valid URL; used for OAuth redirects, problem `type` URIs                                    |
| `DATABASE_URL`       | Must start with `postgresql://` or `postgres://` — there is deliberately no SQLite fallback |
| `BETTER_AUTH_SECRET` | ≥32 chars; the placeholder value is rejected when `NODE_ENV=production`                     |

### Conditionally required

| Variable                | Required when                                                |
| ----------------------- | ------------------------------------------------------------ |
| `REDIS_URL`             | `NODE_ENV=production` (always), or `ENABLE_REDIS_CACHE=true` |
| `STRIPE_SECRET_KEY`     | `PAYMENT_GATEWAY=stripe` (superRefine pair)                  |
| `STRIPE_WEBHOOK_SECRET` | `PAYMENT_GATEWAY=stripe` (superRefine pair)                  |

### Defaulted (override as needed)

| Variable                                                                                                                                           | Default                                     | Notes                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| `NODE_ENV`                                                                                                                                         | `development`                               | `development` \| `test` \| `production`                             |
| `EMAIL_PORT` / `EMAIL_FROM`                                                                                                                        | `587` / `noreply@example.com`               | SMTP host/user/pass optional; `RESEND_API_KEY` optional alternative |
| `CORS_ORIGIN` / `CORS_CREDENTIALS`                                                                                                                 | `http://localhost:3000` / `false`           |                                                                     |
| `API_PREFIX`                                                                                                                                       | `/api/v1`                                   | Server-side route prefix                                            |
| `PAYMENT_GATEWAY`                                                                                                                                  | `manual`                                    | `manual` \| `stripe`                                                |
| `ENABLE_REDIS_CACHE`                                                                                                                               | `false`                                     | Session-cache fast path                                             |
| `LOGGING_LEVEL` / `LOGGING_ERRORS` / `LOGGING_REQUESTS`                                                                                            | `info` / `true` / `false`                   |                                                                     |
| `FEATURE_EMAIL_VERIFICATION` / `FEATURE_TWO_FACTOR_AUTH` / `FEATURE_SOCIAL_LOGIN` / `FEATURE_ACCOUNT_DELETION` / `FEATURE_PASSWORD_STRENGTH_METER` | `true` / `false` / `true` / `true` / `true` | Module gates, also mirrored in `config/features.ts`                 |

### Optional OAuth pairs

`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `GITHUB_*`, `LINKEDIN_*` — a
provider is enabled only when its pair is present. Register callbacks at
`<APP_URL>/api/auth/callback/<provider>`.

### Parsed but currently unused (legacy)

`RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_MINUTES` (limits now live in
the named `RATE_LIMITS` buckets in `src/lib/rate-limit.ts`),
`UPLOAD_MAX_SIZE`, `UPLOAD_ALLOWED_TYPES` (the media service enforces its
own 25 MB cap and document allowlist), `JWT_SECRET` (deprecated — better-auth
owns sessions), `SENTRY_DSN` / `CLOUDFLARE_API_TOKEN` (in `.env.example` but
not in the env schema). They are accepted and ignored; do not rely on them.

## Database

39 tables, created by migrations `drizzle/0000`–`0004` (ledger in
[`TASK_BREAKDOWN.md`](TASK_BREAKDOWN.md#12-ops--tooling)). Schema source:
`src/db/schema/index.ts`; casing `snake_case`; `strict: true`.

```sh
bun run db:generate   # drizzle-kit generate (after schema edits)
bun run db:migrate    # drizzle-kit migrate (applies pending migrations)
bun run db:seed       # scripts/seed.ts — roles, tiers, categories, demo data
bun run db:studio     # drizzle-kit studio
```

**Migration caveat (verify on staging):** migration 0003 runs
`ALTER TYPE "ContentType" ADD VALUE 'PUBLICATION'`. Postgres forbids
`ADD VALUE` inside a transaction block unless the enum type was created in
the same transaction, and drizzle-kit applies each migration
transactionally. If `db:migrate` fails at 0003 with "cannot run inside a
transaction block", apply the statement manually with `psql` on the target
database and re-run `db:migrate` (the journal treats an already-applied
statement's file as pending until recorded). Migration 0004 (invoices,
payments, webhook events) is plain DDL and applies normally. On an existing
database that already has the value, 0003's statement errors as "already
exists" — same fallback.

Fresh-install order: start Postgres → `bun run db:migrate` →
`bun run db:seed` → boot the app.

## Redis

Required in production. Uses:

- **Rate limiting** — sliding-window log in sorted sets
  (`nuvia:ratelimit:*`); without `REDIS_URL` outside production the limiter
  degrades to a logged warning and a no-op (that degradation is not
  acceptable in production, hence the boot-time requirement).
- **Session cache** — when `ENABLE_REDIS_CACHE=true`.

Any Redis-compatible endpoint works (local, Upstash, Railway, Redis Cloud —
see `.env.example` notes).

## Uploads storage

Media uploads (B4 sub-decision) live on **local disk**: files in
`storage/uploads/`, metadata in a JSON manifest
(`storage/uploads/manifest.json`), because migrations were frozen when the
feature shipped. Constraints: 25 MB per file, document-type allowlist,
sha256 checksums (`src/lib/services/media-upload.service.ts`).

Operational consequences, stated plainly:

- The manifest + files must persist across deploys — mount `storage/uploads/`
  as durable storage (volume), not ephemeral container scratch space.
- **Single-node limitation:** two app replicas with separate disks will not
  see each other's uploads. Until a shared volume or object-storage backend
  replaces `media-upload.service.ts`, run one replica, or front replicas
  with a shared filesystem. Swapping in S3/Cloudinary means replacing that
  one service module; no API change.
- Back up `storage/uploads/` alongside the database.

## Stripe configuration (only when `PAYMENT_GATEWAY=stripe`)

1. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (boot fails without
   both).
2. Point a Stripe webhook endpoint at
   `https://<APP_URL>/api/v1/webhooks/stripe`.
3. Subscribe the endpoint to the event types the processor understands
   (`src/lib/payments/stripe.ts`): `checkout.session.completed`,
   `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `checkout.session.expired`,
   `invoice.paid`, `invoice.payment_succeeded`, `invoice.payment_failed`,
   `charge.succeeded`, `charge.failed`, `charge.refunded`,
   `payment_intent.succeeded`, `payment_intent.payment_failed`,
   `payment_intent.canceled` — anything else is answered 200 and
   ignored. Unsupported shapes answer 400 `invalid-webhook-event`.
4. Delivery contract: 200 processed/ignored, 400 signature problems, 404
   manual mode, 500 processing failure (idempotency claim rolled back so
   retries succeed) — see [`api-specs/webhooks.md`](api-specs/webhooks.md).

## Observability

- **Logs:** one structured logger (`src/lib/logger.ts`, ADR-0004); level via
  `LOGGING_LEVEL`. `docs/observability.md` is the operating document.
- **Audit trail in the database:** `auth_logs` (auth + role events),
  `role_change_history`, `user_login_activities`, `active_devices`; finance
  writes carry an `ActorContext` with IP address.
- **Health/readiness:** none built in yet — the process failing to boot on
  bad env is the strongest existing signal. Add platform-level probes.
- **Error tracking:** not wired (no env-schema support for `SENTRY_DSN`
  despite `.env.example` listing it).

## Build, release, verification

```sh
bun run guard:light   # lint + format:check + typecheck
bun run guard:heavy   # + integration tests + drizzle-kit check + build + audit
```

CI (`.github/workflows/ci.yml`): `fast` job (lint/format/typecheck) then
`heavy` job (tests with Postgres + Redis services, migration check, build,
audit) on PRs and pushes to `main`.

Release (`.github/workflows/release.yml`, on published release): builds once,
packages a deployable tarball, then produces (1) a signed SLSA
build-provenance attestation via `actions/attest-build-provenance` and (2) a
keyless cosign signature (Sigstore Public Good) over the same tarball — SLSA
Build Level 2; Level 3 is a stretch goal. Nothing is pushed anywhere;
third-party actions are pinned to full SHAs. Deploy the same attested
tarball to staging and production (promote-once model, `docs/release.md`).

## Staging → production checklist

1. **Secrets** — fresh `BETTER_AUTH_SECRET` (≥32 chars, never the
   placeholder), `DATABASE_URL`, `REDIS_URL`, SMTP or `RESEND_API_KEY`;
   Stripe pair only if `PAYMENT_GATEWAY=stripe`. Different secrets per
   environment.
2. **Migrations** — run `bun run db:migrate` against staging first; watch
   for the 0003 caveat above; `bunx drizzle-kit check` must pass (it is in
   `guard:heavy`).
3. **Seed** — staging: `bun run db:seed`; production: seed roles/tiers only
   as needed, never demo data.
4. **Smoke** — hit `/api/auth/get-session` (better-auth), one read route per
   domain with an admin session, and (if stripe) send a test webhook from
   the Stripe CLI (`stripe trigger` / `stripe listen`).
5. **Uploads volume** — confirm `storage/uploads/` is mounted durable and
   the manifest survives a restart.
6. **Promote** — deploy the attested release tarball; verify version via
   logs; keep the previous tarball for rollback (re-deploy, then roll the DB
   forward-only — there are no down-migrations).
7. **Rate limiting** — confirm Redis connectivity: with Redis unreachable in
   production, auth rate limiting silently no-ops; treat limiter warnings in
   logs as an incident.

## Honest limitations (not yet prod-hardened)

- Rate limiting degrades to a no-op when Redis is missing outside
  production; there is no in-process fallback by design (ADR-0003).
- Uploads are single-node until a shared volume or object storage replaces
  the local-disk media service.
- No built-in health endpoint, no APM/error-tracking integration, no
  down-migrations.
- `/api/debug` and `/api/debug/oauth` exist and answer 404 in production;
  their removal is tracked in the security ADR backlog.
- The forums API double-wraps success envelopes (body `{}`); see
  [`api-specs/_index.md`](api-specs/_index.md#known-divergences).
