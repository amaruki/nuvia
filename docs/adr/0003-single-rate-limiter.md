# ADR-0003: One rate limiter, Redis-backed

**Status:** Accepted, not yet implemented (tracked in `TODO.md` M1)

## Context

Four rate-limiting implementations exist:

- `src/lib/auth/rate-limiting.ts` is the one actually wired up (1 of 23 routes: signup). It uses an in-memory `Map` and contains its own `// TODO: Replace with Redis for production` comment.
- `src/lib/security.ts:rateLimiters`
- `src/lib/utils/rate-limiter.ts`
- better-auth's own `rateLimit` config block in `src/lib/auth/index.ts`

The one in production use is an in-memory `Map`. Any deployment target that runs more than one server process has this problem. This includes the README's own recommended target, Vercel. Each process keeps its own counter. As a result, the actual "limit" is effectively multiplied by the number of processes, and it resets on every cold start. `/api/v1/auth/login` has no rate limiting at all (it calls `auth.api.signInEmail()` server-side, which bypasses better-auth's built-in HTTP-layer limiter).

## Decision

Use one rate limiter, backed by Redis (`ioredis`, already a dependency through `src/lib/session-cache/index.ts`). It uses a sliding-window counter keyed by `ip + route`. Apply it to every `/api/v1/auth/*` route (login, signup, forgot-password, reset-password, change-password) and to any route that `docs/security/controls.md` marks as sensitive.

`src/lib/security.ts:rateLimiters`, `src/lib/utils/rate-limiter.ts`, and the in-memory `RateLimiter` class in `auth/rate-limiting.ts` are deleted. better-auth's own `rateLimit` config stays as a coarse backstop, but this ADR does not rely on it for the specific endpoints that it covers, because server-side `auth.api.*` calls bypass it.

## Consequences

- `env.ts` requires `REDIS_URL` in production (already implemented as part of the Drizzle migration commit — this ADR is why).
- Tests must confirm that the counter survives a simulated process restart. This proves that the counter uses Redis, not in-memory state (see `TODO.md`'s first-ten-tests list).
- A 429 response uses the RFC 9457 shape from ADR-0002, with a `Retry-After` header.
