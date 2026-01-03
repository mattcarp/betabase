/**
 * Cache Service for Knowledge API
 *
 * Two-tier LRU caching:
 * - Tier 1: Query hash -> full response (5 min TTL)
 * - Tier 2: Query text -> embedding vector (1 hour TTL)
 */

import { LRUCache } from 'lru-cache';
import crypto from 'crypto';
import type { QueryResponse } from '../types';

// Tier 1: Full response cache (5 minutes)
const responseCache = new LRUCache<string, QueryResponse>({
  max: 500,
  ttl: 5 * 60 * 1000, // 5 minutes
});

// Tier 2: Embedding cache (1 hour)
const embeddingCache = new LRUCache<string, number[]>({
  max: 1000,
  ttl: 60 * 60 * 1000, // 1 hour
});

/**
 * Generate a cache key from query parameters
 */
export function generateCacheKey(
  query: string,
  sources?: string[],
  limit?: number,
  threshold?: number,
  synthesize?: boolean
): string {
  const normalized = JSON.stringify({
    q: query.toLowerCase().trim(),
    s: sources?.sort() || null,
    l: limit || 5,
    t: threshold || 0.5,
    syn: synthesize !== false,
  });
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

/**
 * Get cached response for a query
 */
export function getCachedResponse(cacheKey: string): QueryResponse | undefined {
  return responseCache.get(cacheKey);
}

/**
 * Cache a response
 */
export function setCachedResponse(cacheKey: string, response: QueryResponse): void {
  responseCache.set(cacheKey, response);
}

/**
 * Get cached embedding for a query
 */
export function getCachedEmbedding(query: string): number[] | undefined {
  const key = crypto.createHash('sha256').update(query.toLowerCase().trim()).digest('hex').slice(0, 16);
  return embeddingCache.get(key);
}

/**
 * Cache an embedding
 */
export function setCachedEmbedding(query: string, embedding: number[]): void {
  const key = crypto.createHash('sha256').update(query.toLowerCase().trim()).digest('hex').slice(0, 16);
  embeddingCache.set(key, embedding);
}

/**
 * Clear all caches (for testing)
 */
export function clearAllCaches(): void {
  responseCache.clear();
  embeddingCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  responseCache: { size: number; maxSize: number };
  embeddingCache: { size: number; maxSize: number };
} {
  return {
    responseCache: { size: responseCache.size, maxSize: 500 },
    embeddingCache: { size: embeddingCache.size, maxSize: 1000 },
  };
}
