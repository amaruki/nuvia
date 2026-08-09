/**
 * Session validation query — the database path behind the cache.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { session as sessionTable } from "@/db/schema";
import { logger } from "@/lib/logger";
import { ENABLE_REDIS_CACHE, cacheSession, getCachedSession } from "./cache-ops";

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
