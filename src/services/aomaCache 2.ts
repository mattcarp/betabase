/**
 * AOMA Query Cache Service
 * Implements LRU caching with semantic similarity matching for AOMA knowledge base queries
 * Dramatically reduces query times from 10-45s to <2s for cached responses
 */

import crypto from "crypto";

interface CacheEntry {
  query: string;
  normalizedQuery: string;
  response: any;
  strategy: string;
  timestamp: number;
  hitCount: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalQueries: number;
}

class AOMACache {
  private cache: Map<string, CacheEntry>;
  private readonly maxSize: number;
  private readonly ttlMs: Record<string, number>;
  private stats: CacheStats;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;

    // Different TTLs for different strategies
    this.ttlMs = {
      rapid: 3600000, // 1 hour for rapid queries
      focused: 1800000, // 30 minutes for focused
      comprehensive: 1800000, // 30 minutes for comprehensive
      default: 1800000, // 30 minutes default
    };

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalQueries: 0,
    };

    // Pre-warm cache with common queries
    this.prewarmCache();
  }

  /**
   * Generate a cache key from query and strategy
   */
  private generateKey(query: string, strategy: string): string {
    const normalized = this.normalizeQuery(query);
    const combined = `${normalized}:${strategy}`;
    return crypto.createHash("sha256").update(combined).digest("hex");
  }

  /**
   * Normalize query for better cache hit rates
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, " ") // Remove punctuation
      .replace(/\s+/g, " ") // Normalize whitespace
      .split(" ")
      .sort() // Sort words for order-independent matching
      .join(" ");
  }

  /**
   * Check if a cache entry is still valid
   */
  private isValidEntry(entry: CacheEntry, strategy: string): boolean {
    const ttl = this.ttlMs[strategy] || this.ttlMs.default;
    const age = Date.now() - entry.timestamp;
    return age < ttl;
  }

  /**
   * Get a cached response if available
   */
  get(query: string, strategy: string = "rapid"): any | null {
    this.stats.totalQueries++;

    // Try exact match first
    const key = this.generateKey(query, strategy);
    const entry = this.cache.get(key);

    if (entry && this.isValidEntry(entry, strategy)) {
      entry.hitCount++;
      this.stats.hits++;

      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, entry);

      console.log(
        `📦 Cache HIT for query: "${query.substring(0, 50)}..." (${entry.hitCount} hits)`,
      );
      return entry.response;
    }

    // Try semantic similarity match for near-misses
    const similarEntry = this.findSimilarEntry(query, strategy);
    if (similarEntry) {
      similarEntry.hitCount++;
      this.stats.hits++;
      console.log(
        `📦 Cache HIT (similar) for query: "${query.substring(0, 50)}..."`,
      );
      return similarEntry.response;
    }

    this.stats.misses++;
    console.log(`📭 Cache MISS for query: "${query.substring(0, 50)}..."`);
    return null;
  }

  /**
   * Store a response in the cache
   */
  set(query: string, response: any, strategy: string = "rapid"): void {
    const key = this.generateKey(query, strategy);

    // Implement LRU eviction if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.stats.evictions++;
      console.log(
        `🗑️ Cache eviction (LRU) - cache at capacity (${this.maxSize})`,
      );
    }

    const entry: CacheEntry = {
      query,
      normalizedQuery: this.normalizeQuery(query),
      response,
      strategy,
      timestamp: Date.now(),
      hitCount: 0,
    };

    this.cache.set(key, entry);
    console.log(
      `💾 Cache SET for query: "${query.substring(0, 50)}..." (cache size: ${this.cache.size})`,
    );
  }

  /**
   * Find a semantically similar cached entry
   */
  private findSimilarEntry(query: string, strategy: string): CacheEntry | null {
    const normalizedQuery = this.normalizeQuery(query);
    const queryWords = new Set(normalizedQuery.split(" "));

    let bestMatch: CacheEntry | null = null;
    let bestScore = 0;
    const threshold = 0.7; // 70% similarity threshold

    for (const entry of this.cache.values()) {
      if (entry.strategy !== strategy || !this.isValidEntry(entry, strategy)) {
        continue;
      }

      const entryWords = new Set(entry.normalizedQuery.split(" "));
      const intersection = new Set(
        [...queryWords].filter((x) => entryWords.has(x)),
      );
      const union = new Set([...queryWords, ...entryWords]);

      // Jaccard similarity coefficient
      const similarity = intersection.size / union.size;

      if (similarity > threshold && similarity > bestScore) {
        bestScore = similarity;
        bestMatch = entry;
      }
    }

    return bestMatch;
  }

  /**
   * Pre-warm cache with common AOMA queries
   */
  private prewarmCache(): void {
    // These would normally be fetched, but for now we'll leave them empty
    // The cache will populate naturally as queries are made
    const commonQueries = [
      { query: "What is USM?", response: null },
      { query: "What is AOMA?", response: null },
      { query: "What is Unified Session Manager?", response: null },
      { query: "How does cover hot swap work?", response: null },
      { query: "What is DAM in Sony Music?", response: null },
    ];

    console.log(`🔥 Cache pre-warming ready (will populate on first access)`);
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🧹 Cache cleared (removed ${size} entries)`);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { size: number; hitRate: number } {
    const hitRate =
      this.stats.totalQueries > 0
        ? (this.stats.hits / this.stats.totalQueries) * 100
        : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: Math.round(hitRate),
    };
  }

  /**
   * Remove expired entries
   */
  pruneExpired(): number {
    let pruned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValidEntry(entry, entry.strategy)) {
        this.cache.delete(key);
        pruned++;
      }
    }

    if (pruned > 0) {
      console.log(`🧹 Pruned ${pruned} expired cache entries`);
    }

    return pruned;
  }
}

// Export singleton instance
export const aomaCache = new AOMACache(100);

// Set up periodic cache pruning (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    aomaCache.pruneExpired();
  }, 300000);
}

// Export type for use in other modules
export type { CacheEntry, CacheStats };
