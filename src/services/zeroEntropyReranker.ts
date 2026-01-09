/**
 * ZeroEntropy ZeRank-2 Reranker Service
 *
 * Primary reranker using ZeRank-2 which outperforms Cohere rerank-v3.5
 * by ~15% on NDCG@10 benchmarks across all domains.
 *
 * Key advantages:
 * - Calibrated scores (0.8 actually means ~80% relevance)
 * - Instruction-following support
 * - 100+ languages with near-English performance
 * - 50% cheaper than Cohere ($0.025/1M tokens)
 *
 * Falls back to Cohere if ZeRank-2 fails.
 */

import { VectorSearchResult, supabase } from "../lib/supabase";
import { getCohereReranker, RankedDocument, RerankingOptions, RerankingResult } from "./cohereReranker";

const ZEROENTROPY_API_URL = "https://api.zeroentropy.dev/v1/models/rerank";

/**
 * ZeroEntropy Reranker using ZeRank-2
 */
export class ZeroEntropyReranker {
  private cohereReranker = getCohereReranker();

  /**
   * Re-rank documents using ZeRank-2 with Cohere fallback
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

    const zeroEntropyKey = process.env.ZEROENTROPY_API_KEY;

    // If no ZeroEntropy key, fall back to Cohere immediately
    if (!zeroEntropyKey) {
      console.log("⚠️ ZEROENTROPY_API_KEY not configured - using Cohere");
      return this.cohereReranker.rerankDocuments(query, documents, options);
    }

    console.log(`🎯 ZeRank-2 Reranker: Processing ${documents.length} documents...`);

    try {
      const response = await fetch(ZEROENTROPY_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${zeroEntropyKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'zerank-2',
          query: query,
          documents: documentsWithRank.map(doc => doc.content || ''),
          top_n: Math.min(topK * 2, documents.length),
          latency: 'fast',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ZeroEntropy API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const results = data.results as Array<{ index: number; relevance_score: number }>;

      console.log(`✅ ZeRank-2 returned ${results.length} ranked results`);

      // Map results back to documents with scores
      let rankedDocuments: RankedDocument[] = results.map(result => ({
        ...documentsWithRank[result.index],
        rerankScore: result.relevance_score,
        rerankReasoning: `ZeRank-2 score: ${(result.relevance_score * 100).toFixed(1)}% (calibrated)`,
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

      console.log(`⏱️  ZeRank-2 rerank completed in ${processingTimeMs.toFixed(0)}ms`);
      console.log(`📊 Avg score: ${(avgRerankScore * 100).toFixed(1)}% (calibrated), Rank changes: ${rankChanges}`);

      return {
        documents: topDocuments,
        metrics: {
          totalCandidates: documents.length,
          rerankedCount: results.length,
          avgRerankScore,
          rankChanges,
          processingTimeMs,
        },
      };

    } catch (error) {
      console.error("❌ ZeRank-2 rerank failed:", error);
      console.log("⚠️ Falling back to Cohere reranker...");

      // Fall back to Cohere
      return this.cohereReranker.rerankDocuments(query, documents, options);
    }
  }

  /**
   * Apply source type boosts - knowledge docs get priority over Jira
   *
   * Note: ZeRank-2's calibrated scores are already high quality,
   * so we use minimal boosts (same as Cohere version).
   */
  private applySourceTypeBoosts(documents: RankedDocument[]): RankedDocument[] {
    const SOURCE_TYPE_BOOSTS: Record<string, number> = {
      knowledge: 0.10,   // +10% for knowledge base docs
      wiki: 0.10,        // +10% for wiki documents
      pdf: 0.08,         // +8% for uploaded PDFs
      firecrawl: 0.05,   // +5% for crawled content
      git: 0.03,         // +3% for git/code context
      jira: 0.0,         // No boost for JIRA tickets
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
      console.log('📊 Loading RLHF feedback for document boosts...');

      const { data: positiveFeedback, error } = await (supabase!)
        .from('rlhf_feedback')
        .select('retrieved_contexts, feedback_type, feedback_value')
        .or('feedback_type.eq.thumbs_up,feedback_value->>score.gte.4')
        .not('retrieved_contexts', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading RLHF feedback:', error);
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
        console.log(`✅ Found ${docBoostMap.size} curator-approved documents`);
      }

      // Apply boosts
      return documents.map(doc => {
        const boostData = docBoostMap.get(doc.id);
        if (!boostData) {
          return { ...doc, rlhfBoost: 0 };
        }

        // Calculate boost
        let boost = 0.05; // Base boost
        boost += boostData.count * 0.01; // +1% per approval
        if (boostData.avgRating >= 4.5) {
          boost += 0.03; // +3% for highly rated
        }

        // Cap at 15%
        boost = Math.min(boost, 0.15);

        return {
          ...doc,
          rlhfBoost: boost,
        };
      });
    } catch (error) {
      console.error("Error applying RLHF boosts:", error);
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

// Primary reranker export - use this instead of getCohereReranker
export const getReranker = getZeroEntropyReranker;
