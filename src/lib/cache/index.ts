/**
 * Cache Module - FEAT-006
 *
 * Exports caching utilities for RAG query results.
 */

export { getRedisClient, isCacheAvailable, testConnection } from "./redis-client";
export {
  generateCacheKey,
  getCachedResult,
  setCachedResult,
  invalidateCache,
  getCacheStats,
} from "./query-cache";
