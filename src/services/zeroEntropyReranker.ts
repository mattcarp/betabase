/**
 * ZeroEntropy Reranker Service
 *
 * Primary reranker using ZeroEntropy's zerank-2 model.
 * - 50% cheaper than Cohere ($0.025/1M tokens)
 * - Better benchmarks than cohere-rerank-v3.5
 * - Fast mode with automatic slow fallback on rate limits
 *
 * Part of Cascading Reranker architecture:
 * 1. ZeroEntropy (primary)
 * 2. Cohere (fallback)
 * 3. Vector similarity (ultimate fallback)
 */

import ZeroEntropy from 'zeroentropy';
import { VectorSearchResult, supabase } from '../lib/supabase';
import type { RankedDocument, RerankingOptions, RerankingResult } from './cohereReranker';

// Re-export types for convenience
export type { RankedDocument, RerankingOptions, RerankingResult };

/**
 * ZeroEntropy Reranker using zerank-2 model
 */
export class ZeroEntropyReranker {
  private client: ZeroEntropy;

  constructor() {
    const apiKey = process.env.ZEROENTROPY_API_KEY;
    if (!apiKey) {
      throw new Error('ZEROENTROPY_API_KEY environment variable is not set');
    }
    this.client = new ZeroEntropy({ apiKey });
  }

  /**
   * Re-rank documents using ZeroEntropy zerank-2
   */
  async rerankDocuments(
    query: string,
    documents: VectorSearchResult[],
    options: RerankingOptions = {}
  ): Promise<RerankingResult> {
    const {
      topK = 10,
      useRLHFSignals = false,
      useSourceTypeBoost = true,
      organization,
      division,
      app_under_test,
    } = options;

    const startTime = performance.now();

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
      };
    }

    // Store original rankings
    const documentsWithRank = documents.map((doc, index) => ({
      ...doc,
      originalRank: index + 1,
      originalSimilarity: doc.similarity,
    }));

    console.log(`[ZeroEntropy] Reranking ${documents.length} documents with zerank-2...`);

    try {
      // Call ZeroEntropy rerank API
      const response = await this.client.models.rerank({
        model: 'zerank-2',
        query,
        documents: documentsWithRank.map(doc => doc.content),
        top_n: Math.min(topK * 2, documents.length), // Get more than topK for RLHF filtering
      });

      console.log(`[ZeroEntropy] Returned ${response.results.length} ranked results`);

      // Map results back to documents with scores
      let rankedDocuments: RankedDocument[] = response.results.map(result => ({
        ...documentsWithRank[result.index],
        rerankScore: result.relevance_score,
        rerankReasoning: `ZeroEntropy zerank-2 score: ${(result.relevance_score * 100).toFixed(1)}%`,
      }));

      // Apply RLHF boosts if enabled
      if (useRLHFSignals && organization && division && app_under_test) {
        rankedDocuments = await this.applyRLHFBoosts(
          query,
          rankedDocuments,
          organization,
          division,
          app_under_test
        );
      }

      // Apply source type boosts
      if (useSourceTypeBoost) {
        rankedDocuments = this.applySourceTypeBoosts(rankedDocuments);
      }

      // Sort by final combined score
      rankedDocuments.sort((a, b) => {
        const scoreA = a.rerankScore * (1.0 + (a.rlhfBoost || 0) + (a.sourceTypeBoost || 0));
        const scoreB = b.rerankScore * (1.0 + (b.rlhfBoost || 0) + (b.sourceTypeBoost || 0));
        return scoreB - scoreA;
      });

      // Take top K
      const topDocuments = rankedDocuments.slice(0, topK);

      // Calculate metrics
      const rankChanges = topDocuments.filter(
        (doc, idx) => doc.originalRank !== idx + 1
      ).length;

      const avgRerankScore =
        topDocuments.reduce((sum, doc) => sum + doc.rerankScore, 0) / topDocuments.length;

      const processingTimeMs = performance.now() - startTime;

      console.log(`[ZeroEntropy] Rerank completed in ${processingTimeMs.toFixed(0)}ms`);
      console.log(`[ZeroEntropy] Avg score: ${(avgRerankScore * 100).toFixed(1)}%, Rank changes: ${rankChanges}`);

      return {
        documents: topDocuments,
        metrics: {
          totalCandidates: documents.length,
          rerankedCount: response.results.length,
          avgRerankScore,
          rankChanges,
          processingTimeMs,
        },
      };

    } catch (error) {
      // Re-throw to let CascadingReranker handle fallback
      console.error('[ZeroEntropy] Rerank failed:', error);
      throw error;
    }
  }

  /**
   * Apply source type boosts - knowledge docs get priority over Jira
   */
  private applySourceTypeBoosts(documents: RankedDocument[]): RankedDocument[] {
    const SOURCE_TYPE_BOOSTS: Record<string, number> = {
      knowledge: 0.10,
      pdf: 0.08,
      firecrawl: 0.05,
      git: 0.03,
      jira: 0.0,
    };

    return documents.map(doc => {
      const boost = SOURCE_TYPE_BOOSTS[doc.source_type] ?? 0;
      return {
        ...doc,
        sourceTypeBoost: boost,
      };
    });
  }

  /**
   * Apply RLHF boosts based on historical curator feedback
   */
  private async applyRLHFBoosts(
    query: string,
    documents: RankedDocument[],
    organization: string,
    division: string,
    app_under_test: string
  ): Promise<RankedDocument[]> {
    try {
      console.log('[ZeroEntropy] Loading RLHF feedback for document boosts...');

      const { data: positiveFeedback, error } = await (supabase!)
        .from('rlhf_feedback')
        .select('retrieved_contexts, feedback_type, feedback_value')
        .or('feedback_type.eq.thumbs_up,feedback_value->>score.gte.4')
        .not('retrieved_contexts', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[ZeroEntropy] Error loading RLHF feedback:', error);
        return documents;
      }

      if (!positiveFeedback || positiveFeedback.length === 0) {
        return documents;
      }

      // Build document boost map
      const docBoostMap = new Map<string, { count: number, avgRating: number, totalRating: number }>();

      for (const feedback of positiveFeedback) {
        const markedDocs = feedback.retrieved_contexts || [];
        const rating = feedback.feedback_value?.score || (feedback.feedback_type === 'thumbs_up' ? 5 : 3);

        for (const markedDoc of markedDocs) {
          const docId = markedDoc.doc_id || markedDoc.id;
          if (docId) {
            const existing = docBoostMap.get(docId) || { count: 0, avgRating: 0, totalRating: 0 };
            existing.count++;
            existing.totalRating += rating;
            existing.avgRating = existing.totalRating / existing.count;
            docBoostMap.set(docId, existing);
          }
        }
      }

      if (docBoostMap.size > 0) {
        console.log(`[ZeroEntropy] Found ${docBoostMap.size} curator-approved documents`);
      }

      // Apply boosts
      return documents.map(doc => {
        const boostData = docBoostMap.get(doc.id);
        if (!boostData) {
          return { ...doc, rlhfBoost: 0 };
        }

        let boost = 0.05;
        boost += boostData.count * 0.01;
        if (boostData.avgRating >= 4.5) {
          boost += 0.03;
        }
        boost = Math.min(boost, 0.15);

        return {
          ...doc,
          rlhfBoost: boost,
        };
      });
    } catch (error) {
      console.error('[ZeroEntropy] Error applying RLHF boosts:', error);
      return documents;
    }
  }
}

// Singleton instance
let zeroEntropyReranker: ZeroEntropyReranker | null = null;

export function getZeroEntropyReranker(): ZeroEntropyReranker {
  if (!zeroEntropyReranker) {
    zeroEntropyReranker = new ZeroEntropyReranker();
  }
  return zeroEntropyReranker;
}
