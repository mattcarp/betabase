/**
 * AOMA Response Cache Service
 * Hybrid approach: Use OpenAI for knowledge, cache in Supabase for SPEED!
 *
 * Strategy:
 * 1. Check Supabase cache first (sub-second responses!)
 * 2. If not cached, query OpenAI assistant
 * 3. Cache the response for next time
 * 4. Build up our knowledge base organically!
 */

import { getSupabaseVectorService } from "./supabaseVectorService";
import { createHash } from "crypto";

export interface CachedResponse {
  query: string;
  response: string;
  sources: any[];
  timestamp: Date;
  hitCount: number;
}

export class AOMACacheService {
  private supabaseVector: ReturnType<typeof getSupabaseVectorService>;
  private cacheThreshold = 0.95; // Very high similarity for cache hits

  constructor() {
    this.supabaseVector = getSupabaseVectorService();
  }

  /**
   * Generate a unique cache key from the query
   */
  private generateCacheKey(query: string): string {
    return createHash("sha256").update(query.toLowerCase().trim()).digest("hex");
  }

  /**
   * Check if we have a cached response for this query
   * BLAZING FAST! Sub-second responses!
   */
  async getCachedResponse(query: string): Promise<CachedResponse | null> {
    try {
      console.log("🔍 Checking cache for query:", query);

      // Search for highly similar cached queries
      const results = await this.supabaseVector.searchVectors(query, {
        matchThreshold: this.cacheThreshold,
        matchCount: 1,
        sourceTypes: ["cache"],
      });

      if (results.length > 0) {
        const cached = results[0];
        console.log(`✅ CACHE HIT! Similarity: ${cached.similarity}`);

        // Update hit count
        await this.incrementHitCount(cached.source_id);

        return {
          query: cached.metadata.original_query,
          response: cached.metadata.response,
          sources: cached.metadata.sources || [],
          timestamp: new Date(cached.metadata.cached_at),
          hitCount: (cached.metadata.hit_count || 0) + 1,
        };
      }

      console.log("❌ Cache miss - will query OpenAI");
      return null;
    } catch (error) {
      console.error("Cache lookup failed:", error);
      return null;
    }
  }

  /**
   * Cache a response from OpenAI for future use
   */
  async cacheResponse(query: string, response: string, sources: any[] = []): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(query);

      // Create a combined content for embedding
      const content = `Query: ${query}\n\nResponse: ${response}`;

      const metadata = {
        original_query: query,
        response: response,
        sources: sources,
        cached_at: new Date().toISOString(),
        hit_count: 0,
      };

      await this.supabaseVector.upsertVector(content, "cache", cacheKey, metadata);

      console.log("✅ Response cached for future queries!");
    } catch (error) {
      console.error("Failed to cache response:", error);
      // Don't throw - caching failure shouldn't break the flow
    }
  }

  /**
   * Increment the hit count for a cached response
   */
  private async incrementHitCount(cacheKey: string): Promise<void> {
    try {
      // This would update the metadata to track popular queries
      // Implementation depends on Supabase table structure
      console.log(`📈 Incrementing hit count for cache key: ${cacheKey}`);
    } catch (error) {
      console.error("Failed to update hit count:", error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    try {
      const stats = await this.supabaseVector.getVectorStats();
      const cacheStats = stats.find((s: any) => s.source_type === "cache");

      return {
        totalCached: cacheStats?.document_count || 0,
        averageHitRate: cacheStats?.average_hit_count || 0,
        lastCached: cacheStats?.last_updated || null,
      };
    } catch (error) {
      console.error("Failed to get cache stats:", error);
      return null;
    }
  }

  /**
   * Warm up the cache with common queries
   */
  async warmupCache(commonQueries: string[]): Promise<void> {
    console.log("🔥 Warming up cache with common queries...");

    for (const query of commonQueries) {
      const cached = await this.getCachedResponse(query);
      if (!cached) {
        console.log(`📝 Marking for caching: "${query}"`);
        // The orchestrator will handle actually getting the response
      }
    }
  }
}

// Singleton instance
let instance: AOMACacheService | null = null;

export function getAOMACacheService(): AOMACacheService {
  if (!instance) {
    instance = new AOMACacheService();
  }
  return instance;
}

export default AOMACacheService;
