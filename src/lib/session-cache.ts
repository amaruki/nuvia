/**
 * Session caching utilities for improving authentication performance
 *
 * This module provides Redis-based caching for session validation results
 * to reduce database load and improve response times for authenticated users.
 */

import { Redis } from "ioredis";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { session as sessionTable } from "@/db/schema";
import { logger } from "@/lib/logger";

// Cache configuration
const CACHE_TTL = 60; // 60 seconds cache TTL
const CACHE_PREFIX = "nuvia:session:";

// Redis client instance (singleton)
let redisClient: Redis | null = null;

// Redis connection state
let redisInitialized = false;
let redisAvailable = false;

// Session cache configuration
const ENABLE_REDIS_CACHE = process.env.ENABLE_REDIS_CACHE === "true" && process.env.REDIS_URL;

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
 * Session cache interface
 */
interface CachedSession {
  userId: string;
  sessionId: string;
  expiresAt: Date;
  user: {
    id: string;
    email: string;
    username: string;
    name: string;
    image?: string;
  };
  lastValidated: number;
}

/**
 * Generate cache key for session
 */
function getCacheKey(sessionToken: string): string {
  return `${CACHE_PREFIX}${sessionToken}`;
}

/**
 * Cache session data in Redis
 */
export async function cacheSession(sessionToken: string, sessionData: any): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const cacheData: CachedSession = {
      userId: sessionData.userId,
      sessionId: sessionData.id,
      expiresAt: sessionData.expiresAt,
      user: sessionData.user,
      lastValidated: Date.now(),
    };

    await redis.setex(getCacheKey(sessionToken), CACHE_TTL, JSON.stringify(cacheData));
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

    const sessionData: CachedSession = JSON.parse(cached);

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
        const sessionData: CachedSession = JSON.parse(cached);
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
 * Enhanced session validation with caching
 */
export async function validateSessionWithCache(sessionToken: string) {
  // First, check cache if enabled
  if (ENABLE_REDIS_CACHE) {
    const cachedSession = await getCachedSession(sessionToken);
    if (cachedSession) {
      return {
        session: {
          id: cachedSession.sessionId,
          userId: cachedSession.userId,
          expiresAt: cachedSession.expiresAt,
          token: sessionToken,
        },
        user: cachedSession.user,
        fromCache: true,
      };
    }
  }

  // Cache miss - fetch from database
  try {
    const session = await db.query.session.findFirst({
      where: eq(sessionTable.token, sessionToken),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            username: true,
            name: true,
            displayName: true,
            image: true,
            profilePhoto: true,
            bio: true,
            externalLinks: true,
            emailVerified: true,
          },
        },
      },
    });

    if (!session || new Date(session.expiresAt) < new Date()) {
      // Clean up invalid session if it exists
      if (session) {
        await db.delete(sessionTable).where(eq(sessionTable.id, session.id));
      }
      return null;
    }

    // Transform user data to match expected format
    const transformedUser = {
      id: session.user.id,
      email: session.user.email,
      username: session.user.username,
      name: session.user.displayName || session.user.name,
      image: session.user.profilePhoto || session.user.image,
      displayName: session.user.displayName,
      profilePhoto: session.user.profilePhoto,
      bio: session.user.bio,
      externalLinks: session.user.externalLinks,
      emailVerified: session.user.emailVerified,
    };

    // Cache the successful validation only if Redis is enabled
    if (ENABLE_REDIS_CACHE) {
      await cacheSession(sessionToken, {
        ...session,
        user: transformedUser,
      });
    }

    return {
      session: {
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
        token: sessionToken,
      },
      user: transformedUser,
      fromCache: false,
    };
  } catch (error) {
    logger.error("Session validation error", error);
    return null;
  }
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
