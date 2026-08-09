/**
 * Cache operations — Redis client lifecycle plus the write, read, and
 * invalidation paths for cached session entries.
 */

import { Redis } from "ioredis";
import { logger } from "@/lib/logger";
import type { CachedSession } from "./types";
import {
  CACHE_PREFIX,
  deserializeCachedSession,
  getCacheKey,
  serializeCachedSession,
  toCachedSession,
} from "./serialization";

// Cache configuration
const CACHE_TTL = 60; // 60 seconds cache TTL

// Session cache configuration
export const ENABLE_REDIS_CACHE =
  process.env.ENABLE_REDIS_CACHE === "true" && process.env.REDIS_URL;

// Redis client instance (singleton)
let redisClient: Redis | null = null;

// Redis connection state
let redisInitialized = false;
let redisAvailable = false;

/**
 * Initialize Redis connection
 */
function getRedisClient(): Redis | null {
  // Return null immediately if Redis caching is disabled
  if (!ENABLE_REDIS_CACHE) {
    return null;
  }

  if (!redisClient && !redisInitialized) {
    redisInitialized = true; // Prevent multiple initialization attempts

    try {
      redisClient = new Redis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        enableOfflineQueue: false,
      });

      redisClient.on("error", (err) => {
        if (redisAvailable) {
          logger.warn("Redis connection lost", err.message);
          redisAvailable = false;
        }
      });

      redisClient.on("connect", () => {
        logger.info("✅ Redis connected for session caching");
        redisAvailable = true;
      });

      redisClient.on("close", () => {
        redisAvailable = false;
      });
    } catch (error) {
      logger.warn(
        "Redis not available - session caching disabled",
        error instanceof Error ? error.message : "Unknown error",
      );
      redisAvailable = false;
    }
  }

  return redisClient && redisAvailable ? redisClient : null;
}

/**
 * Cache session data in Redis
 */
export async function cacheSession(sessionToken: string, sessionData: any): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const cacheData = toCachedSession(sessionData);

    await redis.setex(getCacheKey(sessionToken), CACHE_TTL, serializeCachedSession(cacheData));
  } catch (error) {
    // Silent fail - session caching is optional
    // Only log in development
    if (process.env.NODE_ENV === "development") {
      logger.debug(
        "Redis cache failed (session caching disabled)",
        error instanceof Error ? error.message : error,
      );
    }
  }
}

/**
 * Get cached session data
 */
export async function getCachedSession(sessionToken: string): Promise<CachedSession | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const cached = await redis.get(getCacheKey(sessionToken));
    if (!cached) return null;

    const sessionData = deserializeCachedSession(cached);

    // Check if session has expired
    if (new Date(sessionData.expiresAt) < new Date()) {
      await invalidateSessionCache(sessionToken);
      return null;
    }

    return sessionData;
  } catch (error) {
    logger.warn("Failed to get cached session", error);
    return null;
  }
}

/**
 * Invalidate session cache
 */
export async function invalidateSessionCache(sessionToken: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(getCacheKey(sessionToken));
  } catch (error) {
    logger.warn("Failed to invalidate session cache", error);
  }
}

/**
 * Invalidate all session caches for a user
 */
export async function invalidateUserSessionCaches(userId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const pattern = `${CACHE_PREFIX}*`;

    // SCAN walks the keyspace in incremental batches; KEYS would block the
    // Redis event loop for the entire scan and stall every other client.
    const keys: string[] = [];
    let cursor = "0";
    do {
      const [nextCursor, batch] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 200);
      keys.push(...batch);
      cursor = nextCursor;
    } while (cursor !== "0");

    if (keys.length === 0) return;

    // One pipeline round-trip reads every candidate key; sequential awaits
    // used to pay one network round-trip per key.
    const reads = redis.pipeline();
    for (const key of keys) {
      reads.get(key);
    }
    const results = await reads.exec();
    if (!results) return;

    const keysToDelete: string[] = [];
    for (let i = 0; i < results.length; i++) {
      const [error, cached] = results[i];
      if (error || typeof cached !== "string" || cached.length === 0) continue;

      try {
        const sessionData = deserializeCachedSession(cached);
        if (sessionData.userId === userId) {
          keysToDelete.push(keys[i]);
        }
      } catch {
        // Unparseable entries can never validate again, so purge them too.
        keysToDelete.push(keys[i]);
      }
    }

    if (keysToDelete.length > 0) {
      // Batched deletes keep the whole invalidation at two round-trips total.
      const deletes = redis.pipeline();
      for (const key of keysToDelete) {
        deletes.del(key);
      }
      await deletes.exec();
    }
  } catch (error) {
    logger.warn("Failed to invalidate user session caches", error);
  }
}

/**
 * Get cache status information
 */
export function getCacheStatus() {
  return {
    enabled: ENABLE_REDIS_CACHE,
    redis: {
      configured: !!process.env.REDIS_URL,
      available: redisAvailable,
    },
  };
}

/**
 * Cleanup function for graceful shutdown
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
    } catch (error) {
      logger.warn("Error closing Redis connection", error);
    }
  }
}

/**
 * Health check for Redis connection
 */
export async function checkRedisHealth(): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}
