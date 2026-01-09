/**
 * Cascading Reranker Service
 *
 * Implements a fault-tolerant reranking architecture:
 * 1. ZeroEntropy (primary) - cheaper, better benchmarks
 * 2. Cohere (fallback) - battle-tested, reliable
 * 3. Vector similarity (ultimate fallback) - always works
 *
 * Benefits:
 * - Cost optimization: ZeroEntropy is 50% cheaper
 * - Redundancy: No single point of failure
 * - Graceful degradation: Always returns results
 */

import { VectorSearchResult } from '../lib/supabase';
import type { RankedDocument, RerankingOptions, RerankingResult } from './cohereReranker';
import { ZeroEntropyReranker } from './zeroEntropyReranker';
import { CohereReranker } from './cohereReranker';

// Re-export types
export type { RankedDocument, RerankingOptions, RerankingResult };

export type RerankerProvider = 'zeroentropy' | 'cohere' | 'vector-fallback';

export interface CascadingRerankingResult extends RerankingResult {
  provider: RerankerProvider;
  fallbackReason?: string;
}

/**
 * Cascading Reranker - tries providers in order of preference
 */
export class CascadingReranker {
  private zeroEntropyReranker: ZeroEntropyReranker | null = null;
  private cohereReranker: CohereReranker | null = null;
  private zeroEntropyAvailable: boolean = false;
  private cohereAvailable: boolean = false;

  constructor() {
    // Try to initialize ZeroEntropy
    try {
      if (process.env.ZEROENTROPY_API_KEY) {
        this.zeroEntropyReranker = new ZeroEntropyReranker();
        this.zeroEntropyAvailable = true;
        console.log('[CascadingReranker] ZeroEntropy reranker initialized');
      } else {
        console.log('[CascadingReranker] ZeroEntropy API key not found, skipping');
      }
    } catch (error) {
      console.warn('[CascadingReranker] Failed to initialize ZeroEntropy:', error);
    }

    // Try to initialize Cohere
    try {
      if (process.env.COHERE_API_KEY) {
        this.cohereReranker = new CohereReranker();
        this.cohereAvailable = true;
        console.log('[CascadingReranker] Cohere reranker initialized');
      } else {
        console.log('[CascadingReranker] Cohere API key not found, skipping');
      }
    } catch (error) {
      console.warn('[CascadingReranker] Failed to initialize Cohere:', error);
    }

    if (!this.zeroEntropyAvailable && !this.cohereAvailable) {
      console.warn('[CascadingReranker] No rerankers available - will use vector similarity fallback');
    }
  }

  /**
   * Re-rank documents using cascading providers
   */
  async rerankDocuments(
    query: string,
    documents: VectorSearchResult[],
    options: RerankingOptions = {}
  ): Promise<CascadingRerankingResult> {
    const { topK = 10 } = options;

    // Empty documents case
    if (documents.length === 0) {
      return {
        documents: [],
        metrics: {
          totalCandidates: 0,
          rerankedCount: 0,
          avgRerankScore: 0,
          rankChanges: 0,
          processingTimeMs: 0,
        },
        provider: 'vector-fallback',
      };
    }

    // Try ZeroEntropy first
    if (this.zeroEntropyAvailable && this.zeroEntropyReranker) {
      try {
        console.log('[CascadingReranker] Attempting ZeroEntropy rerank...');
        const result = await this.zeroEntropyReranker.rerankDocuments(query, documents, options);
        return {
          ...result,
          provider: 'zeroentropy',
        };
      } catch (error) {
        console.warn('[CascadingReranker] ZeroEntropy failed, trying Cohere fallback:', error);
      }
    }

    // Try Cohere as fallback
    if (this.cohereAvailable && this.cohereReranker) {
      try {
        console.log('[CascadingReranker] Attempting Cohere rerank...');
        const result = await this.cohereReranker.rerankDocuments(query, documents, options);
        return {
          ...result,
          provider: 'cohere',
          fallbackReason: this.zeroEntropyAvailable ? 'ZeroEntropy failed' : 'ZeroEntropy not configured',
        };
      } catch (error) {
        console.warn('[CascadingReranker] Cohere failed, using vector similarity:', error);
      }
    }

    // Ultimate fallback: vector similarity
    console.log('[CascadingReranker] Using vector similarity fallback');
    return this.vectorSimilarityFallback(documents, topK);
  }

  /**
   * Ultimate fallback using original vector similarity scores
   */
  private vectorSimilarityFallback(
    documents: VectorSearchResult[],
    topK: number
  ): CascadingRerankingResult {
    const startTime = performance.now();

    const rankedDocs: RankedDocument[] = documents
      .map((doc, index) => ({
        ...doc,
        rerankScore: doc.similarity,
        rerankReasoning: 'Fallback: using original vector similarity',
        originalRank: index + 1,
        originalSimilarity: doc.similarity,
      }))
      .sort((a, b) => b.rerankScore - a.rerankScore)
      .slice(0, topK);

    const avgRerankScore =
      rankedDocs.reduce((sum, doc) => sum + doc.rerankScore, 0) / rankedDocs.length;

    return {
      documents: rankedDocs,
      metrics: {
        totalCandidates: documents.length,
        rerankedCount: documents.length,
        avgRerankScore,
        rankChanges: 0,
        processingTimeMs: performance.now() - startTime,
      },
      provider: 'vector-fallback',
      fallbackReason: 'All rerankers unavailable or failed',
    };
  }

  /**
   * Get status of available providers
   */
  getProviderStatus(): { zeroentropy: boolean; cohere: boolean } {
    return {
      zeroentropy: this.zeroEntropyAvailable,
      cohere: this.cohereAvailable,
    };
  }
}

// Singleton instance
let cascadingReranker: CascadingReranker | null = null;

export function getCascadingReranker(): CascadingReranker {
  if (!cascadingReranker) {
    cascadingReranker = new CascadingReranker();
  }
  return cascadingReranker;
}

// Default export for drop-in replacement
export const getReranker = getCascadingReranker;
