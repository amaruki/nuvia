/**
 * One rate limiter, Redis-backed. See ADR-0003.
 *
 * Replaces three prior in-house implementations (auth/rate-limiting.ts's
 * in-memory Map, security.ts:rateLimiters, utils/rate-limiter.ts) — none
 * of which survived more than one server process, and only one of which
 * (auth/rate-limiting.ts, via proxy.ts's generic /api/** check) was
 * actually wired up. /api/v1/auth/login had no rate limiting applied to
 * it at all, since it calls auth.api.signInEmail() server-side, bypassing
 * better-auth's own HTTP-layer limiter.
 */

import { Redis } from "ioredis";
import type { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { problemResponse, problems } from "@/lib/http";
import { logger } from "@/lib/logger";

export interface RateLimitConfig {
  windowSeconds: number;
  max: number;
}

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetAt: Date;
}

/** Named so both the app and its tests can express intent, not raw numbers. */
export const RATE_LIMITS = {
  // 5 attempts / 15 minutes — matches the pre-migration AUTH config.
  login: { windowSeconds: 15 * 60, max: 5 },
  changePassword: { windowSeconds: 15 * 60, max: 5 },
  // 3 / hour — matches the pre-migration PASSWORD_RESET config.
  forgotPassword: { windowSeconds: 60 * 60, max: 3 },
  resetPassword: { windowSeconds: 60 * 60, max: 3 },
  // 5 / hour — matches the pre-migration REGISTRATION config.
  signup: { windowSeconds: 60 * 60, max: 5 },
  // 10 / 15 minutes — token verification. Tokens are signed JWTs and not
  // brute-forceable, but this endpoint is public and server-side auth.api
  // calls bypass better-auth's own HTTP-layer limiter (ADR-0003's reason
  // for this file existing), so it gets its own bucket like the rest.
  verifyEmail: { windowSeconds: 15 * 60, max: 10 },
  // 5 / 15 minutes — the disposable demo account's login (UI-39). One
  // shared credential for every visitor makes this endpoint a brute-force
  // magnet, so it gets the same strict bucket as the real login instead of
  // riding the generic /api/** backstop.
  demoLogin: { windowSeconds: 15 * 60, max: 5 },
  // 100 / 15 minutes — the generic /api/** backstop proxy.ts applies to
  // everything else (matches the pre-migration API config).
  api: { windowSeconds: 15 * 60, max: 100 },
} as const satisfies Record<string, RateLimitConfig>;

let client: Redis | null = null;
let warnedNoRedis = false;

function getClient(): Redis | null {
  if (!env.REDIS_URL) {
    // Only reachable outside production — env.ts requires REDIS_URL there.
    if (!warnedNoRedis) {
      logger.warn("REDIS_URL not set — rate limiting is disabled for this process.");
      warnedNoRedis = true;
    }
    return null;
  }

  if (!client) {
    client = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 });
  }
  return client;
}

/** For tests only — lets a fresh test file get an isolated connection. */
export function _resetClientForTests(): void {
  client = null;
}

/**
 * Sliding-window log: each call records its timestamp in a Redis sorted
 * set keyed by `key`, drops entries older than the window, then counts
 * what's left. State lives in Redis, not the Node process, so it survives
 * a restart and is shared across every server process.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const redis = getClient();
  if (!redis) {
    return {
      limited: false,
      remaining: config.max,
      resetAt: new Date(Date.now() + config.windowSeconds * 1000),
    };
  }

  const now = Date.now();
  const windowStart = now - config.windowSeconds * 1000;
  const redisKey = `nuvia:ratelimit:${key}`;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(redisKey, 0, windowStart);
  pipeline.zadd(redisKey, now, `${now}:${Math.random()}`);
  pipeline.zcard(redisKey);
  pipeline.expire(redisKey, config.windowSeconds);
  const results = await pipeline.exec();

  const count = (results?.[2]?.[1] as number) ?? 0;

  return {
    limited: count > config.max,
    remaining: Math.max(0, config.max - count),
    resetAt: new Date(now + config.windowSeconds * 1000),
  };
}

function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown"
  );
}

/**
 * Route handlers call this first and return the result immediately if
 * non-null. Keyed by IP + route, per ADR-0003.
 */
export async function rateLimitOrProblem(
  headers: Headers,
  route: keyof typeof RATE_LIMITS,
): Promise<NextResponse | null> {
  const result = await checkRateLimit(`${route}:${clientIp(headers)}`, RATE_LIMITS[route]);

  if (!result.limited) return null;

  const retryAfterSeconds = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);
  return problemResponse(
    problems.rateLimited(
      `Too many requests. Try again in ${retryAfterSeconds}s.`,
      retryAfterSeconds,
    ),
    { headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
