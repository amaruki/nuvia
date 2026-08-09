/**
 * Read-only cache status for the tools/cache page (UI-23/D3).
 *
 * Honesty contract: this service only PROBES — one `PING` against Redis and
 * reads of configuration facts. It never writes, never expires, never
 * flushes. There is deliberately no cache-flush export: no global flush
 * utility exists anywhere in src/ (the a11y harness flushes its own
 * dedicated test Redis in scripts/a11y-smoke/infrastructure.ts, which is
 * test infrastructure, not an application feature). If a real flush lands
 * one day, it belongs here — until then the tools/cache page is read-only
 * and says so.
 */

import { Redis } from "ioredis";

import { env } from "@/lib/env";
import { ENABLE_REDIS_CACHE, getCacheStatus } from "@/lib/session-cache/cache-ops";
import { CACHE_PREFIX } from "@/lib/session-cache/serialization";

/**
 * Mirrors CACHE_TTL in src/lib/session-cache/cache-ops.ts (the constant is
 * not exported there; keep the two in sync if it ever changes).
 */
export const SESSION_CACHE_TTL_SECONDS = 60;

export interface RedisProbeResult {
  /** REDIS_URL is present in the environment. */
  configured: boolean;
  /**
   * Result of a real `PING` round-trip. Always false when Redis is not
   * configured — nothing is probed in that case.
   */
  reachable: boolean;
  /** What the probe observed: "PING acknowledged" or the connection error. */
  detail: string;
}

export interface CacheSystemStatus {
  /** When this status snapshot was taken (ISO timestamp). */
  checkedAt: string;
  sessionCache: {
    /** ENABLE_REDIS_CACHE=true AND REDIS_URL set (cache-ops.ts's own gate). */
    enabled: boolean;
    /** The ENABLE_REDIS_CACHE env flag is "true" (regardless of REDIS_URL). */
    enableFlagSet: boolean;
    /** REDIS_URL is present. */
    redisUrlConfigured: boolean;
    ttlSeconds: number;
    keyPrefix: string;
    /**
     * getCacheStatus()'s in-process "available" flag. It only turns true
     * once the session-cache client has connected in THIS process (i.e. a
     * session was cached since boot), so false does not mean Redis is down —
     * the dedicated PING above answers that.
     */
    clientConnectedInProcess: boolean;
  };
  redis: RedisProbeResult;
  rateLimiter: {
    /**
     * The single rate limiter (ADR-0003) stores its sliding-window buckets
     * in Redis under `nuvia:ratelimit:*` when REDIS_URL is set; without it
     * the limiter is disabled for the process (rate-limit.ts logs a warning).
     */
    redisBacked: boolean;
  };
}

/**
 * Probe Redis with a short-lived, throwaway client. Independent of the
 * session-cache singleton on purpose: the page must report the server's
 * reachability even when ENABLE_REDIS_CACHE is off (Redis still backs the
 * rate limiter in that case).
 */
async function probeRedis(): Promise<RedisProbeResult> {
  if (!env.REDIS_URL) {
    return {
      configured: false,
      reachable: false,
      detail: "REDIS_URL is not set — nothing to ping.",
    };
  }

  const probe = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    connectTimeout: 2500,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });
  // ioredis emits "error" for connection failures; without a listener that
  // would throw from the EventEmitter instead of rejecting the ping promise.
  probe.on("error", () => {});

  try {
    // lazyConnect: true means commands alone won't dial — connect() first,
    // otherwise the ping dies on the disabled offline queue.
    await probe.connect();
    await probe.ping();
    return { configured: true, reachable: true, detail: "PING acknowledged." };
  } catch (error) {
    return {
      configured: true,
      reachable: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  } finally {
    probe.disconnect();
  }
}

export async function getCacheSystemStatus(): Promise<CacheSystemStatus> {
  const redis = await probeRedis();
  const cacheStatus = getCacheStatus();

  return {
    checkedAt: new Date().toISOString(),
    sessionCache: {
      enabled: Boolean(ENABLE_REDIS_CACHE),
      enableFlagSet: env.ENABLE_REDIS_CACHE,
      redisUrlConfigured: Boolean(env.REDIS_URL),
      ttlSeconds: SESSION_CACHE_TTL_SECONDS,
      keyPrefix: CACHE_PREFIX,
      clientConnectedInProcess: cacheStatus.redis.available,
    },
    redis,
    rateLimiter: {
      redisBacked: Boolean(env.REDIS_URL),
    },
  };
}
