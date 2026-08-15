# Nuvia production image.
#
# Runtime split (deliberate, discovered by the CI docker job):
#   Bun is the package manager (ADR-0015) — bun install resolves the
#   frozen bun.lock in every stage. But Bun 1.3.14 segfaults with SIGILL
#   at process teardown in containerized CI (deterministic bun.report
#   signature on the runner's AVX-512 CPU), right after `next build`
#   completes. The same crash would break any short-lived Bun process
#   at runtime (the migration step, the healthcheck). So the image runs
#   next build / next start and the migrator under Node — the platform
#   Next.js tests most — while Bun keeps its lockfile role. Local
#   development stays 100% Bun (`bun dev`, `bun run build`).
#
# Stages:
#   builder   — all deps, `next build` under Node (needs no database; the
#               DB-backed routes/pages are force-dynamic, so prerendering
#               never queries one), migrator compiled to plain JS.
#   prod-deps — production deps only, resolved from the same lockfile.
#   runner    — Node 22 slim + prod deps + build output. No devDeps, no
#               sources, no build toolchain, no Bun binary at runtime.
#
# Alignment with docs/release.md: the deployable unit is the same set of
# paths release.yml packages into the signed tarball (.next, public,
# package.json, bun.lock, drizzle). Building here from source instead of
# unpacking a signed tarball keeps `docker build` self-contained; the
# promotion pipeline can swap the runner stage's COPY for an artifact
# extract without changing the runtime shape.
#
# Runtime expectations (see docs/DEPLOYMENT_PLAN.md):
#   - DATABASE_URL and BETTER_AUTH_SECRET are required; src/lib/env.ts
#     fails the boot on missing/malformed values.
#   - REDIS_URL is required in production (rate limiting, session cache).
#   - Migrations apply at container start via the compiled migrator
#     (drizzle-orm runtime migrator — no drizzle-kit needed in the image).

FROM oven/bun:1.3.14 AS builder

WORKDIR /app

# Node for the build itself (see the runtime-split note at the top).
# Debian trixie ships Node 22; Next.js 16 requires >= 20.9.
RUN apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Skip lifecycle scripts during image installs. The root `prepare` script
# runs `lefthook install` (git hooks for local development); inside a
# build image there is no git repository and the prod stage does not even
# carry lefthook (a devDependency), so installs fail unless scripts are
# skipped (caught by the CI docker job). Dependency lifecycle scripts are
# already blocked by Bun's default policy (docs/supply-chain.md §3), so
# nothing else is affected.

# Install everything (dev deps are needed for the build: TypeScript,
# Tailwind's PostCSS plugin, drizzle-kit is NOT needed at build time but
# the frozen lockfile keeps this deterministic).
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at build time —
# pass them as build args when they differ from the defaults. The defaults
# matter: an ARG without a default yields an EMPTY string, and env.ts
# rejects an empty NEXT_PUBLIC_APP_URL ("Invalid URL") — zod defaults only
# apply when the variable is absent, not when it is set to "".
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_ENABLE_REDIS_CACHE=false
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_ENABLE_REDIS_CACHE=$NEXT_PUBLIC_ENABLE_REDIS_CACHE

# next build imports route modules to collect page data, which evaluates
# src/lib/env.ts at import time — and env.ts refuses to boot without a
# valid APP_URL and a >=32-char BETTER_AUTH_SECRET. Provide build-only
# placeholders that satisfy validation; the runner stage gets the real
# values from container env at deploy time (this ENV lives only in the
# builder stage and never reaches the shipped image).
ENV APP_URL=http://localhost:3000
ENV BETTER_AUTH_SECRET=build-time-placeholder-not-a-real-secret-0000000
ENV DATABASE_URL=postgresql://build-time-placeholder
ENV REDIS_URL=redis://build-time-placeholder

RUN node node_modules/next/dist/bin/next build

# Compile the runtime migrator to plain JS so the Node-only runner can
# execute it without TypeScript support or Bun.
RUN bun build scripts/db-migrate.ts --target=node --outfile=dist/db-migrate.mjs

# ---------------------------------------------------------------------------

FROM oven/bun:1.3.14 AS prod-deps

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production --ignore-scripts

# ---------------------------------------------------------------------------

FROM node:22-slim AS runner

ENV NODE_ENV=production

WORKDIR /app

# Non-root runtime user (hardening convention). node:slim ships a `node`
# user; give it the app directory.
RUN mkdir -p /app && chown -R node:node /app
USER node

# Production dependencies resolved by the prod-deps stage from the same
# frozen lockfile — same resolution the builder used, minus everything
# dev-only.
COPY --chown=node:node package.json bun.lock ./
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules

# The deployable unit (same paths as release.yml's signed tarball).
COPY --chown=node:node --from=builder /app/.next ./.next
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=builder /app/drizzle ./drizzle
COPY --chown=node:node --from=builder /app/dist/db-migrate.mjs ./dist/db-migrate.mjs
# next.config.ts is loaded again by `next start` — without it the
# security headers configured there would silently not apply.
# tsconfig.json keeps path aliases resolvable for any runtime tooling.
COPY --chown=node:node --from=builder /app/next.config.ts ./next.config.ts
COPY --chown=node:node --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Orchestrator probe (Docker HEALTHCHECK polls it; load balancers can
# too). /api/v1/health returns 200 only when Postgres AND Redis answer.
# --start-period covers migration + cold start on first boot.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/v1/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Apply pending migrations, then serve. The migrate step is idempotent
# (drizzle's ledger table) and refuses to run without DATABASE_URL, which
# also surfaces a misconfigured deploy immediately instead of serving a
# half-broken app.
CMD ["sh", "-c", "node dist/db-migrate.mjs && node node_modules/next/dist/bin/next start"]
