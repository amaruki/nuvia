# ADR-0003: One rate limiter, Redis-backed

**Status:** Accepted, not yet implemented (tracked in `TODO.md` M1)

## Context

Four rate-limiting implementations exist:

- `src/lib/auth/rate-limiting.ts` — the one actually wired up (1 of 23
  routes: signup). In-memory `Map`, with its own `// TODO: Replace with
Redis for production` comment.
- `src/lib/security.ts:rateLimiters`
- `src/lib/utils/rate-limiter.ts`
- better-auth's own `rateLimit` config block in `src/lib/auth.ts`

The one in production use is an in-memory `Map`. On any deployment target
that runs more than one server process — which includes the README's own
recommended target, Vercel — each process has its own counter, so the
"limit" is effectively multiplied by process count and resets on every cold
start. `/api/v1/auth/login` has no rate limiting applied to it at all
(it calls `auth.api.signInEmail()` server-side, which bypasses better-auth's
built-in HTTP-layer limiter).

## Decision

One rate limiter, backed by Redis (`ioredis`, already a dependency via
`src/lib/session-cache.ts`), using a sliding-window counter keyed by
`ip + route`. Applied to every `/api/v1/auth/*` route
(login, signup, forgot-password, reset-password, change-password) and any
route `docs/security/controls.md` marks as sensitive.

`src/lib/security.ts:rateLimiters`, `src/lib/utils/rate-limiter.ts`, and the
in-memory `RateLimiter` class in `auth/rate-limiting.ts` are deleted.
better-auth's own `rateLimit` config stays as a coarse backstop but is not
relied on for the specific endpoints this ADR covers, since server-side
`auth.api.*` calls bypass it.

## Consequences

- `env.ts` requires `REDIS_URL` in production (already implemented as part
  of the Drizzle migration commit — this ADR is why).
- The rate limiter's counter must be tested for survival across a simulated
  process restart, proving Redis rather than in-memory state (see
  `TODO.md`'s first-ten-tests list).
- A 429 response uses the RFC 9457 shape from ADR-0002, with a
  `Retry-After` header.
