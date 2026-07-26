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
          console.warn("Redis connection lost:", err.message);
          redisAvailable = false;
        }
      });

      redisClient.on("connect", () => {
        console.log("✅ Redis connected for session caching");
        redisAvailable = true;
      });

      redisClient.on("close", () => {
        redisAvailable = false;
      });
    } catch (error) {
      console.warn(
        "Redis not available - session caching disabled:",
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
      console.debug(
        "Redis cache failed (session caching disabled):",
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
    console.warn("Failed to get cached session:", error);
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
    console.warn("Failed to invalidate session cache:", error);
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
    const keys = await redis.keys(pattern);

    for (const key of keys) {
      const cached = await redis.get(key);
      if (cached) {
        try {
          const sessionData: CachedSession = JSON.parse(cached);
          if (sessionData.userId === userId) {
            await redis.del(key);
          }
        } catch {
          // Skip invalid cache entries
          await redis.del(key);
        }
      }
    }
  } catch (error) {
    console.warn("Failed to invalidate user session caches:", error);
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
    console.error("Session validation error:", error);
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
      console.warn("Error closing Redis connection:", error);
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
