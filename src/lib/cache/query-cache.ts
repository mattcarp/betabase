/**
 * Query Cache for RAG Results - FEAT-006
 *
 * Caches RAG query results to reduce latency for repeated queries.
 * Uses a hash of the query + options as the cache key.
 *
 * TTL Strategy:
 * - Dynamic queries (with session context): 5 minutes
 * - Static queries (no session): 1 hour
 */

import { createHash } from "crypto";
import { getRedisClient, isCacheAvailable } from "./redis-client";

// Cache TTL in seconds
const TTL_DYNAMIC = 5 * 60; // 5 minutes for session-specific queries
const TTL_STATIC = 60 * 60; // 1 hour for general queries

// Cache key prefix
const CACHE_PREFIX = "siam:rag:";

interface CacheOptions {
  sessionId?: string;
  organization?: string;
  division?: string;
  app_under_test?: string;
}

interface CachedRAGResult {
  documents: Array<{
    content: string;
    metadata: Record<string, unknown>;
  }>;
  metadata: {
    strategy: string;
    confidence: number;
    totalTimeMs: number;
    cachedAt: string;
    cacheKey: string;
  };
}

/**
 * Generate a deterministic cache key from query and options
 */
export function generateCacheKey(query: string, options: CacheOptions = {}): string {
  const normalizedQuery = query.toLowerCase().trim();
  const keyParts = [
    normalizedQuery,
    options.organization || "",
    options.division || "",
    options.app_under_test || "",
  ].join("|");

  const hash = createHash("sha256").update(keyParts).digest("hex").substring(0, 16);
  return `${CACHE_PREFIX}${hash}`;
}

/**
 * Get cached RAG result
 */
export async function getCachedResult(
  query: string,
  options: CacheOptions = {}
): Promise<CachedRAGResult | null> {
  if (!isCacheAvailable()) {
    return null;
  }

  const client = getRedisClient();
  if (!client) return null;

  const cacheKey = generateCacheKey(query, options);

  try {
    const cached = await client.get<CachedRAGResult>(cacheKey);
    if (cached) {
      console.log(`[Cache] HIT for key ${cacheKey.substring(0, 20)}...`);
      return cached;
    }
    console.log(`[Cache] MISS for key ${cacheKey.substring(0, 20)}...`);
    return null;
  } catch (error) {
    console.error("[Cache] Error getting cached result:", error);
    return null;
  }
}

/**
 * Store RAG result in cache
 */
export async function setCachedResult(
  query: string,
  result: CachedRAGResult,
  options: CacheOptions = {}
): Promise<boolean> {
  if (!isCacheAvailable()) {
    return false;
  }

  const client = getRedisClient();
  if (!client) return false;

  const cacheKey = generateCacheKey(query, options);
  const ttl = options.sessionId ? TTL_DYNAMIC : TTL_STATIC;

  // Add cache metadata
  const cachedResult: CachedRAGResult = {
    ...result,
    metadata: {
      ...result.metadata,
      cachedAt: new Date().toISOString(),
      cacheKey,
    },
  };

  try {
    await client.set(cacheKey, cachedResult, { ex: ttl });
    console.log(`[Cache] SET key ${cacheKey.substring(0, 20)}... TTL=${ttl}s`);
    return true;
  } catch (error) {
    console.error("[Cache] Error setting cached result:", error);
    return false;
  }
}

/**
 * Invalidate cache entries by pattern
 *
 * @param pattern - "all" to clear all, or prefix like "siam:rag:" to clear specific entries
 */
export async function invalidateCache(pattern: "all" | string = "all"): Promise<number> {
  if (!isCacheAvailable()) {
    return 0;
  }

  const client = getRedisClient();
  if (!client) return 0;

  try {
    const searchPattern = pattern === "all" ? `${CACHE_PREFIX}*` : `${pattern}*`;

    // Scan for keys matching pattern
    let cursor = 0;
    let deletedCount = 0;
    const keysToDelete: string[] = [];

    do {
      const result = await client.scan(cursor, { match: searchPattern, count: 100 });
      cursor = result[0];
      keysToDelete.push(...result[1]);
    } while (cursor !== 0);

    // Delete found keys
    if (keysToDelete.length > 0) {
      for (const key of keysToDelete) {
        await client.del(key);
        deletedCount++;
      }
    }

    console.log(`[Cache] Invalidated ${deletedCount} entries matching ${searchPattern}`);
    return deletedCount;
  } catch (error) {
    console.error("[Cache] Error invalidating cache:", error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  available: boolean;
  keyCount: number;
  memoryUsed: string;
} | null> {
  if (!isCacheAvailable()) {
    return { available: false, keyCount: 0, memoryUsed: "N/A" };
  }

  const client = getRedisClient();
  if (!client) return null;

  try {
    // Count keys with our prefix
    let cursor = 0;
    let keyCount = 0;

    do {
      const result = await client.scan(cursor, { match: `${CACHE_PREFIX}*`, count: 100 });
      cursor = result[0];
      keyCount += result[1].length;
    } while (cursor !== 0);

    return {
      available: true,
      keyCount,
      memoryUsed: "See Upstash dashboard",
    };
  } catch (error) {
    console.error("[Cache] Error getting stats:", error);
    return null;
  }
}

export default {
  generateCacheKey,
  getCachedResult,
  setCachedResult,
  invalidateCache,
  getCacheStats,
};
