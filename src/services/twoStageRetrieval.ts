/**
 * Two-Stage Retrieval System
 *
 * Stage 1: High-recall vector search (retrieves top N candidates)
 * Stage 2: Sort by vector similarity (external rerankers removed)
 *
 * Note: External rerankers (Cohere, ZeRank-2) were tested and removed
 * because Gemini 768d embeddings produce quality rankings without them.
 */

import { getSupabaseVectorService } from "./supabaseVectorService";
import { VectorSearchResult } from "../lib/supabase";

export interface TwoStageRetrievalOptions {
  // Stage 1: Vector Search
  organization: string;
  division: string;
  app_under_test: string;
  initialCandidates?: number; // N - how many to retrieve (default: 50)
  vectorThreshold?: number; // Similarity threshold for stage 1
  sourceTypes?: string[];
  useGemini?: boolean; // Use Gemini embeddings (default: false - data is OpenAI 1536d)
  ensureSourceDiversity?: boolean; // If true, search each source type separately (default: true)

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
      useGemini = true, // Use Gemini embeddings (768d)
      ensureSourceDiversity = true, // Ensure knowledge docs are included
      topK = 10,
      rerankBatchSize = 10,
      useRLHFSignals = true,
    } = options;

    console.log("\n🔍 ========== TWO-STAGE RETRIEVAL ==========");
    console.log(`📝 Query: "${query.substring(0, 100)}${query.length > 100 ? '...' : ''}"`);
    console.log(`🎯 Stage 1: Retrieve ${initialCandidates} candidates`);
    console.log(`🎯 Stage 2: Re-rank to top ${topK} documents`);
    console.log(`🔐 RLHF Signals: ${useRLHFSignals ? 'ENABLED' : 'DISABLED'}`);
    console.log(`📊 Source Diversity: ${ensureSourceDiversity ? 'ENABLED' : 'DISABLED'}`);

    // ========== STAGE 1: High-Recall Vector Search ==========
    const stage1Start = performance.now();

    let vectorResults: VectorSearchResult[];

    if (ensureSourceDiversity && !sourceTypes) {
      // Multi-source search: ensure knowledge docs are included
      // Search each priority source type separately to guarantee diversity
      console.log('🔀 Using multi-source retrieval strategy...');

      const prioritySources = ['knowledge', 'pdf', 'firecrawl', 'git', 'jira'];
      const perSourceLimit = Math.ceil(initialCandidates / prioritySources.length);

      const allResults: VectorSearchResult[] = [];
      const seenIds = new Set<string>();

      for (const sourceType of prioritySources) {
        const sourceResults = await this.vectorService.searchVectors(query, {
          organization,
          division,
          app_under_test,
          matchThreshold: vectorThreshold,
          matchCount: perSourceLimit,
          sourceTypes: [sourceType],
          useGemini,
        });

        // Deduplicate
        for (const result of sourceResults) {
          if (!seenIds.has(result.id)) {
            seenIds.add(result.id);
            allResults.push(result);
          }
        }

        if (sourceResults.length > 0) {
          console.log(`   ${sourceType}: ${sourceResults.length} results (best: ${(sourceResults[0].similarity * 100).toFixed(1)}%)`);
        }
      }

      // Sort all by similarity, take top N
      allResults.sort((a, b) => b.similarity - a.similarity);
      vectorResults = allResults.slice(0, initialCandidates);
    } else {
      // Standard search
      vectorResults = await this.vectorService.searchVectors(query, {
        organization,
        division,
        app_under_test,
        matchThreshold: vectorThreshold,
        matchCount: initialCandidates,
        sourceTypes,
        useGemini,
      });
    }

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

    // ========== STAGE 2: Sort by Similarity (No External Reranking) ==========
    // Note: External rerankers were tested but removed - Gemini embeddings are sufficient
    const stage2Start = performance.now();

    // Sort by similarity and take topK
    const sortedResults = [...vectorResults]
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    const stage2Time = performance.now() - stage2Start;

    console.log(`\n✅ STAGE 2 COMPLETE`);
    console.log(`   Sorted: ${vectorResults.length} -> ${sortedResults.length} documents`);
    console.log(`   Time: ${stage2Time.toFixed(0)}ms`);
    console.log(`   Top Score: ${sortedResults.length > 0 ? (sortedResults[0].similarity * 100).toFixed(1) : 0}%`);

    const totalTime = performance.now() - startTime;
    console.log(`\n⏱️  TOTAL TIME: ${totalTime.toFixed(0)}ms`);
    console.log(`   Stage 1: ${((stage1Time / totalTime) * 100).toFixed(0)}%`);
    console.log(`   Stage 2: ${((stage2Time / totalTime) * 100).toFixed(0)}%`);
    console.log("==========================================\n");

    return {
      documents: sortedResults,
      stage1Metrics: {
        candidatesRetrieved: vectorResults.length,
        vectorSearchTimeMs: stage1Time,
        avgSimilarity,
      },
      stage2Metrics: {
        rerankedCount: sortedResults.length,
        avgRerankScore: sortedResults.length > 0
          ? sortedResults.reduce((sum, d) => sum + d.similarity, 0) / sortedResults.length
          : 0,
        rankChanges: 0, // No reranking changes
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
      useGemini = true, // Use Gemini embeddings (768d)
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

