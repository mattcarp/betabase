/**
 * AOMA Parallel Query Service - Performance Optimized
 * 
 * Executes multiple AOMA queries in parallel for faster response times
 * Uses Promise.race for quickest response with fallback options
 */

import { aomaCache } from './aomaCache';

interface AOMAQueryResult {
  success: boolean;
  content: string | null;
  metadata?: {
    queryType: string;
    strategy: string;
    cached?: boolean;
    responseTime?: number;
    source?: string;
  };
}

class AOMAParallelQueryService {
  // AOMA Mesh MCP is deployed to Railway, NOT Render
  private readonly RAILWAY_URL = process.env.NEXT_PUBLIC_AOMA_MESH_SERVER_URL ||
    "https://luminous-dedication-production.up.railway.app";
  
  // No Render deployment - Railway only
  private readonly RENDER_URL = '';
    
  // Primary URL is Railway
  private readonly FALLBACK_URL = this.RAILWAY_URL;

  /**
   * Execute parallel queries to multiple AOMA endpoints
   * Returns the fastest successful response
   */
  async queryWithParallelFallback(
    query: string,
    strategy: "rapid" | "focused" | "comprehensive" = "rapid"
  ): Promise<AOMAQueryResult> {
    const startTime = performance.now();

    // Check cache first for instant response
    const cachedResponse = aomaCache.get(query, strategy);
    if (cachedResponse) {
      console.log('⚡ Cache hit! Returning instantly');
      return {
        success: true,
        content: cachedResponse,
        metadata: {
          queryType: 'cached',
          strategy,
          cached: true,
          responseTime: performance.now() - startTime,
          source: 'cache'
        }
      };
    }

    // Enhance query for better context
    const enhancedQuery = this.enhanceQueryForContext(query);

    // Query Railway endpoint (primary deployment)
    const queries = [
      this.queryEndpoint(enhancedQuery, strategy, this.RAILWAY_URL, 'railway', 10000)
    ];

    try {
      // Race all queries - return the first successful one
      const result = await Promise.race(queries);
      
      if (result && result.success) {
        // Cache the successful result
        aomaCache.set(query, result.content!, strategy);
        
        return {
          ...result,
          metadata: {
            ...result.metadata,
            responseTime: performance.now() - startTime
          }
        };
      }
    } catch (error) {
      console.error('All AOMA queries failed:', error);
    }

    // If first attempt fails, retry Railway with longer timeout
    for (const endpoint of [
      { url: this.RAILWAY_URL, name: 'railway-retry', timeout: 15000 }
    ]) {
      const result = await this.queryEndpoint(
        enhancedQuery, 
        strategy, 
        endpoint.url, 
        endpoint.name, 
        endpoint.timeout
      );
      
      if (result.success) {
        aomaCache.set(query, result.content!, strategy);
        return {
          ...result,
          metadata: {
            ...result.metadata,
            responseTime: performance.now() - startTime
          }
        };
      }
    }

    return { 
      success: false, 
      content: null,
      metadata: {
        queryType: 'failed',
        strategy,
        responseTime: performance.now() - startTime
      }
    };
  }

  /**
   * Query a single AOMA endpoint
   */
  private async queryEndpoint(
    query: string,
    strategy: string,
    baseUrl: string,
    source: string,
    timeout: number
  ): Promise<AOMAQueryResult> {
    try {
      console.log(`🔄 Querying ${source} with strategy: ${strategy}`);

      const rpcPayload = {
        jsonrpc: "2.0",
        id: Math.random(),
        method: "tools/call",
        params: {
          name: "query_aoma_knowledge",
          arguments: { query, strategy }
        }
      };

      const response = await fetch(`${baseUrl}/rpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rpcPayload),
        signal: AbortSignal.timeout(timeout)
      });

      if (!response.ok) {
        console.log(`❌ ${source} query failed with status: ${response.status}`);
        return { success: false, content: null };
      }

      const data = await response.json();
      if (data.error || !data.result?.content?.[0]?.text) {
        return { success: false, content: null };
      }

      const aomaResult = JSON.parse(data.result.content[0].text);
      const resultContent = aomaResult.response || null;

      if (resultContent) {
        console.log(`✅ ${source} query successful`);
        return {
          success: true,
          content: resultContent,
          metadata: {
            queryType: 'live',
            strategy,
            source
          }
        };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`⏱️ ${source} query timed out after ${timeout}ms`);
      } else {
        console.error(`${source} query error:`, error);
      }
    }

    return { success: false, content: null };
  }

  /**
   * Enhance queries with Sony Music context
   */
  private enhanceQueryForContext(originalQuery: string): string {
    const lowerQuery = originalQuery.toLowerCase();

    // Add Sony Music context for known ambiguous terms
    if (lowerQuery.includes("usm") && !lowerQuery.includes("unified") && !lowerQuery.includes("session")) {
      return `${originalQuery} (USM: Unified Session Manager in Sony Music AOMA context)`;
    }

    if (lowerQuery.includes("dam") && !lowerQuery.includes("digital") && !lowerQuery.includes("asset")) {
      return `${originalQuery} (DAM: Digital Asset Management in Sony Music context)`;
    }

    if (lowerQuery.includes("cover hot swap") || lowerQuery.includes("hotswap")) {
      return `${originalQuery} (AOMA cover artwork replacement workflow)`;
    }

    // For general queries, add AOMA context if not present
    if (!lowerQuery.includes("aoma") && !lowerQuery.includes("sony")) {
      return `${originalQuery} in Sony Music AOMA context`;
    }

    return originalQuery;
  }

  /**
   * Prefetch common queries to warm the cache
   */
  async warmCache() {
    const commonQueries = [
      "What is USM?",
      "How does cover hot swap work?",
      "AOMA architecture overview",
      "Digital asset management workflow"
    ];

    console.log('🔥 Warming AOMA cache with common queries...');
    
    await Promise.all(
      commonQueries.map(query => 
        this.queryWithParallelFallback(query, 'rapid').catch(() => {})
      )
    );
    
    console.log('✅ Cache warming complete');
  }
}

export const aomaParallelQuery = new AOMAParallelQueryService();