/**
 * Two-Stage Retrieval System
 * 
 * Stage 1: High-recall vector search (retrieves top N candidates)
 * Stage 2: High-precision Gemini re-ranking (selects best K documents)
 * 
 * Part of the Advanced RLHF RAG Implementation - Phase 2
 */

import { getSupabaseVectorService } from "./supabaseVectorService";
import { getGeminiReranker, type RerankingOptions } from "./geminiReranker";
import { VectorSearchResult } from "../lib/supabase";

export interface TwoStageRetrievalOptions {
  // Stage 1: Vector Search
  organization: string;
  division: string;
  app_under_test: string;
  initialCandidates?: number; // N - how many to retrieve (default: 50)
  vectorThreshold?: number; // Similarity threshold for stage 1
  sourceTypes?: string[];
  useGemini?: boolean; // Use Gemini embeddings (default: true)
  
  // Stage 2: Re-ranking
  topK?: number; // K - how many to return after re-ranking (default: 10)
  rerankBatchSize?: number;
  useRLHFSignals?: boolean; // Apply RLHF boosts (default: true)
}

export interface TwoStageRetrievalResult {
  documents: VectorSearchResult[];
  stage1Metrics: {
    candidatesRetrieved: number;
    vectorSearchTimeMs: number;
    avgSimilarity: number;
  };
  stage2Metrics: {
    rerankedCount: number;
    avgRerankScore: number;
    rankChanges: number;
    rerankingTimeMs: number;
  };
  totalTimeMs: number;
}

export class TwoStageRetrieval {
  private vectorService = getSupabaseVectorService();
  private reranker = getGeminiReranker();

  /**
   * Execute two-stage retrieval: Vector Search → Re-ranking
   */
  async query(
    query: string,
    options: TwoStageRetrievalOptions
  ): Promise<TwoStageRetrievalResult> {
    const startTime = performance.now();

    const {
      organization,
      division,
      app_under_test,
      initialCandidates = 50,
      vectorThreshold = 0.50,
      sourceTypes,
      useGemini = true,
      topK = 10,
      rerankBatchSize = 10,
      useRLHFSignals = true,
    } = options;

    console.log("\n🔍 ========== TWO-STAGE RETRIEVAL ==========");
    console.log(`📝 Query: "${query.substring(0, 100)}${query.length > 100 ? '...' : ''}"`);
    console.log(`🎯 Stage 1: Retrieve ${initialCandidates} candidates`);
    console.log(`🎯 Stage 2: Re-rank to top ${topK} documents`);
    console.log(`🔐 RLHF Signals: ${useRLHFSignals ? 'ENABLED' : 'DISABLED'}`);

    // ========== STAGE 1: High-Recall Vector Search ==========
    const stage1Start = performance.now();
    
    const vectorResults = await this.vectorService.searchVectors(query, {
      organization,
      division,
      app_under_test,
      matchThreshold: vectorThreshold,
      matchCount: initialCandidates,
      sourceTypes,
      useGemini,
    });

    const stage1Time = performance.now() - stage1Start;

    if (vectorResults.length === 0) {
      console.log("⚠️  Stage 1 returned no results");
      return {
        documents: [],
        stage1Metrics: {
          candidatesRetrieved: 0,
          vectorSearchTimeMs: stage1Time,
          avgSimilarity: 0,
        },
        stage2Metrics: {
          rerankedCount: 0,
          avgRerankScore: 0,
          rankChanges: 0,
          rerankingTimeMs: 0,
        },
        totalTimeMs: performance.now() - startTime,
      };
    }

    const avgSimilarity =
      vectorResults.reduce((sum, doc) => sum + doc.similarity, 0) / vectorResults.length;

    console.log(`\n✅ STAGE 1 COMPLETE`);
    console.log(`   Retrieved: ${vectorResults.length} candidates`);
    console.log(`   Time: ${stage1Time.toFixed(0)}ms`);
    console.log(`   Avg Similarity: ${(avgSimilarity * 100).toFixed(1)}%`);
    console.log(`   Top Result: ${(vectorResults[0].similarity * 100).toFixed(1)}%`);

    // ========== STAGE 2: High-Precision Re-ranking ==========
    const stage2Start = performance.now();

    const rerankOptions: RerankingOptions = {
      topK,
      batchSize: rerankBatchSize,
      useRLHFSignals,
      organization,
      division,
      app_under_test,
    };

    const rerankResult = await this.reranker.rerankDocuments(
      query,
      vectorResults,
      rerankOptions
    );

    const stage2Time = performance.now() - stage2Start;

    console.log(`\n✅ STAGE 2 COMPLETE`);
    console.log(`   Re-ranked: ${rerankResult.metrics.rerankedCount} documents`);
    console.log(`   Returned: ${rerankResult.documents.length} top documents`);
    console.log(`   Time: ${stage2Time.toFixed(0)}ms`);
    console.log(`   Avg Re-rank Score: ${(rerankResult.metrics.avgRerankScore * 100).toFixed(1)}%`);
    console.log(`   Rank Changes: ${rerankResult.metrics.rankChanges}`);
    
    if (useRLHFSignals) {
      const docsWithBoost = rerankResult.documents.filter(d => d.rlhfBoost && d.rlhfBoost !== 0);
      if (docsWithBoost.length > 0) {
        const avgBoost = docsWithBoost.reduce((sum, d) => sum + (d.rlhfBoost || 0), 0) / docsWithBoost.length;
        console.log(`   RLHF Boosts Applied: ${docsWithBoost.length} docs (avg: ${(avgBoost * 100).toFixed(1)}%)`);
      }
    }

    const totalTime = performance.now() - startTime;
    console.log(`\n⏱️  TOTAL TIME: ${totalTime.toFixed(0)}ms`);
    console.log(`   Stage 1: ${((stage1Time / totalTime) * 100).toFixed(0)}%`);
    console.log(`   Stage 2: ${((stage2Time / totalTime) * 100).toFixed(0)}%`);
    console.log("==========================================\n");

    return {
      documents: rerankResult.documents,
      stage1Metrics: {
        candidatesRetrieved: vectorResults.length,
        vectorSearchTimeMs: stage1Time,
        avgSimilarity,
      },
      stage2Metrics: {
        rerankedCount: rerankResult.metrics.rerankedCount,
        avgRerankScore: rerankResult.metrics.avgRerankScore,
        rankChanges: rerankResult.metrics.rankChanges,
        rerankingTimeMs: stage2Time,
      },
      totalTimeMs: totalTime,
    };
  }

  /**
   * Execute retrieval with comparison between re-ranked and non-re-ranked
   * Useful for A/B testing and demonstrating re-ranking value
   */
  async queryWithComparison(
    query: string,
    options: TwoStageRetrievalOptions
  ): Promise<{
    withReranking: TwoStageRetrievalResult;
    withoutReranking: VectorSearchResult[];
    improvementMetrics: {
      topDocChanges: number;
      avgScoreImprovement: number;
      diversityImprovement: number;
    };
  }> {
    const {
      organization,
      division,
      app_under_test,
      vectorThreshold = 0.50,
      topK = 10,
      sourceTypes,
      useGemini = true,
    } = options;

    // Get baseline (vector search only)
    const baseline = await this.vectorService.searchVectors(query, {
      organization,
      division,
      app_under_test,
      matchThreshold: vectorThreshold,
      matchCount: topK,
      sourceTypes,
      useGemini,
    });

    // Get re-ranked results
    const reranked = await this.query(query, options);

    // Calculate improvement metrics
    const baselineIds = new Set(baseline.map(doc => doc.id));
    const rerankedIds = new Set(reranked.documents.map(doc => doc.id));
    
    const topDocChanges = Array.from(rerankedIds).filter(id => !baselineIds.has(id)).length;
    
    const baselineAvgScore = baseline.reduce((sum, doc) => sum + doc.similarity, 0) / baseline.length;
    const rerankedAvgScore = reranked.documents.reduce((sum, doc) => sum + doc.similarity, 0) / reranked.documents.length;
    const avgScoreImprovement = rerankedAvgScore - baselineAvgScore;

    // Diversity: unique source types in top results
    const baselineSources = new Set(baseline.map(doc => doc.source_type));
    const rerankedSources = new Set(reranked.documents.map(doc => doc.source_type));
    const diversityImprovement = rerankedSources.size - baselineSources.size;

    return {
      withReranking: reranked,
      withoutReranking: baseline,
      improvementMetrics: {
        topDocChanges,
        avgScoreImprovement,
        diversityImprovement,
      },
    };
  }
}

// Singleton instance
let twoStageRetrieval: TwoStageRetrieval | null = null;

export function getTwoStageRetrieval(): TwoStageRetrieval {
  if (!twoStageRetrieval) {
    twoStageRetrieval = new TwoStageRetrieval();
  }
  return twoStageRetrieval;
}

