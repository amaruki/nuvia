/**
 * Serialization for cached session entries — cache key derivation and the
 * JSON encoding shared by the write, read, and invalidation paths.
 */

import type { CachedSession } from "./types";

// Cache key prefix for all session entries
export const CACHE_PREFIX = "nuvia:session:";

/**
 * Generate cache key for session
 */
export function getCacheKey(sessionToken: string): string {
  return `${CACHE_PREFIX}${sessionToken}`;
}

/**
 * Build the cache payload from a freshly validated session.
 */
export function toCachedSession(sessionData: any): CachedSession {
  return {
    userId: sessionData.userId,
    sessionId: sessionData.id,
    expiresAt: sessionData.expiresAt,
    user: sessionData.user,
    lastValidated: Date.now(),
  };
}

/**
 * Serialize a cache payload for Redis storage.
 */
export function serializeCachedSession(session: CachedSession): string {
  return JSON.stringify(session);
}

/**
 * Parse a cache payload read back from Redis. Throws on malformed JSON;
 * callers treat that as a cache miss (or a purge).
 */
export function deserializeCachedSession(raw: string): CachedSession {
  return JSON.parse(raw) as CachedSession;
}
