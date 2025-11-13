/**
 * Session caching utilities for improving authentication performance
 *
 * This module provides Redis-based caching for session validation results
 * to reduce database load and improve response times for authenticated users.
 */

import { Redis } from 'ioredis';
import { prisma } from './prisma';

// Cache configuration
const CACHE_TTL = 60; // 60 seconds cache TTL
const CACHE_PREFIX = 'nuvia:session:';

// Redis client instance (singleton)
let redisClient: Redis | null = null;

/**
 * Initialize Redis connection
 */
function getRedisClient(): Redis | null {
  if (!redisClient && process.env.REDIS_URL) {
    try {
      redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      redisClient.on('error', (err) => {
        console.warn('Redis connection error:', err.message);
      });

      redisClient.on('connect', () => {
        console.log('✅ Redis connected for session caching');
      });
    } catch (error) {
      console.warn('Failed to initialize Redis:', error);
    }
  }

  return redisClient;
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

    await redis.setex(
      getCacheKey(sessionToken),
      CACHE_TTL,
      JSON.stringify(cacheData)
    );
  } catch (error) {
    console.warn('Failed to cache session:', error);
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
    console.warn('Failed to get cached session:', error);
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
    console.warn('Failed to invalidate session cache:', error);
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
    console.warn('Failed to invalidate user session caches:', error);
  }
}

/**
 * Enhanced session validation with caching
 */
export async function validateSessionWithCache(sessionToken: string) {
  // First, check cache
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

  // Cache miss - fetch from database
  try {
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            image: true,
            displayName: true,
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
        await prisma.session.delete({
          where: { id: session.id },
        });
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

    // Cache the successful validation
    await cacheSession(sessionToken, {
      ...session,
      user: transformedUser,
    });

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
    console.error('Session validation error:', error);
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
      console.warn('Error closing Redis connection:', error);
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