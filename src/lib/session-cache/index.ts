/**
 * Session caching utilities for improving authentication performance
 *
 * This module provides Redis-based caching for session validation results
 * to reduce database load and improve response times for authenticated users.
 *
 * Split from src/lib/session-cache.ts into concern-scoped modules (types,
 * serialization, cache operations, validation query) so each file stays
 * within the project's 300-line limit; this barrel keeps the public API
 * unchanged.
 */

// Cache operations
export {
  cacheSession,
  checkRedisHealth,
  closeRedisConnection,
  getCacheStatus,
  getCachedSession,
  invalidateSessionCache,
  invalidateUserSessionCaches,
} from "./cache-ops";

// Session validation query
export { validateSessionWithCache } from "./queries";
