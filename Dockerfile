# Nuvia production image.
#
# Two stages:
#   builder  — install all deps, run `next build` (needs no database; the
#              public DB-backed pages are force-dynamic, so prerendering
#              never queries one).
#   runner   — production deps only + build output. No devDependencies,
#              no sources, no build toolchain (hardening-docker-containers
#              convention: ship the minimum that runs the app).
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
#   - Migrations apply at container start via scripts/db-migrate.ts
#     (drizzle-orm runtime migrator — no drizzle-kit needed in the image).

FROM oven/bun:1.3.14 AS builder

WORKDIR /app

# Install everything (dev deps are needed for the build: TypeScript,
# Tailwind's PostCSS plugin, drizzle-kit is NOT needed at build time but
# the frozen lockfile keeps this deterministic).
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at build time —
# pass them as build args when they differ from the localhost defaults.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_ENABLE_REDIS_CACHE
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_ENABLE_REDIS_CACHE=$NEXT_PUBLIC_ENABLE_REDIS_CACHE

RUN bun run build

# ---------------------------------------------------------------------------

FROM oven/bun:1.3.14-slim AS runner

ENV NODE_ENV=production

WORKDIR /app

# Non-root runtime user (hardening convention). Bun images ship a `bun`
# user; give it the app directory.
RUN mkdir -p /app && chown -R bun:bun /app
USER bun

# Production dependencies only, from the same frozen lockfile — same
# resolution the builder used, minus everything dev-only.
COPY --chown=bun:bun package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# The deployable unit (same paths as release.yml's signed tarball).
COPY --chown=bun:bun --from=builder /app/.next ./.next
COPY --chown=bun:bun --from=builder /app/public ./public
COPY --chown=bun:bun --from=builder /app/drizzle ./drizzle
COPY --chown=bun:bun --from=builder /app/scripts/db-migrate.ts ./scripts/db-migrate.ts
# next.config.ts is loaded again by `next start` — without it the
# security headers configured there would silently not apply.
# tsconfig.json keeps path aliases resolvable for any runtime tooling.
COPY --chown=bun:bun --from=builder /app/next.config.ts ./next.config.ts
COPY --chown=bun:bun --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Orchestrator probe (Docker HEALTHCHECK polls it; load balancers can
# too). /api/v1/health returns 200 only when Postgres AND Redis answer.
# Uses bun's own fetch — wget/curl are not in the slim base image.
# --start-period covers migration + cold start on first boot.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:3000/api/v1/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Apply pending migrations, then serve. The migrate step is idempotent
# (drizzle's ledger table) and refuses to run without DATABASE_URL, which
# also surfaces a misconfigured deploy immediately instead of serving a
# half-broken app.
CMD ["sh", "-c", "bun run scripts/db-migrate.ts && bun run start"]
