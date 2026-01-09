/**
 * Hybrid Retrieval V2
 *
 * Combines vector search + keyword search with RRF fusion.
 * Relies on Gemini 768d embeddings for semantic understanding.
 *
 * Pipeline:
 * 1. Parallel: Vector search + Keyword (BM25) search
 * 2. Merge & deduplicate results
 * 3. RRF fusion to combine ranking signals
 * 4. Return top K with confidence scores
 *
 * Note: External rerankers (Cohere, ZeRank-2) were tested and removed
 * because Gemini embeddings + RRF produced better results without them.
 */

import { getSupabaseVectorService } from "./supabaseVectorService";
import {
  reciprocalRankFusion,
  mergeAndDeduplicate,
  createRankingSignals,
  logRRFResults,
} from "./reciprocalRankFusion";
import { VectorSearchResult } from "../lib/supabase";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Document with ranking information (used for retrieval results)
 */
export interface RankedDocument extends VectorSearchResult {
  rerankScore: number;
  rerankReasoning?: string;
  originalRank: number;
  originalSimilarity: number;
  rlhfBoost?: number;
}

// Get admin client lazily to avoid null at module load time
function getAdminClient(): SupabaseClient | null {
  // Check global first (set by test scripts)
  if ((globalThis as any).__supabaseAdminClient) {
    return (globalThis as any).__supabaseAdminClient;
  }
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (url && key) {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    (globalThis as any).__supabaseAdminClient = client;
    return client;
  }
  return null;
}

export interface HybridRetrievalOptions {
  // Required context
  organization: string;
  division: string;
  app_under_test: string;

  // Search configuration
  initialCandidates?: number; // How many from each search (default: 30)
  vectorThreshold?: number; // Min similarity for vector search (default: 0.40)
  useGemini?: boolean; // Use Gemini embeddings (default: true)

  // Fusion configuration
  vectorWeight?: number; // Weight for vector signal in RRF (default: 1.0)
  keywordWeight?: number; // Weight for keyword signal in RRF (default: 1.0)
  rrfK?: number; // RRF constant (default: 60)

  // Final selection configuration
  rerankCandidates?: number; // How many candidates for RRF selection (default: 15)
  topK?: number; // Final results to return (default: 5)
}

export interface HybridRetrievalResult {
  documents: RankedDocument[];
  metrics: {
    vectorResults: number;
    keywordResults: number;
    mergedCandidates: number;
    rrfTopCandidates: number;
    finalDocuments: number;
    vectorSearchMs: number;
    keywordSearchMs: number;
    fusionMs: number;
    rerankingMs: number;
    totalMs: number;
  };
  debug?: {
    topRRFScores: Array<{ id: string; score: number; signals: Record<string, number> }>;
  };
}

/**
 * Hybrid Retrieval V2 Service
 */
export class HybridRetrievalV2 {
  private vectorService = getSupabaseVectorService();

  /**
   * Execute hybrid retrieval with RRF fusion and optional reranking
   */
  async search(
    query: string,
    options: HybridRetrievalOptions
  ): Promise<HybridRetrievalResult> {
    const startTime = performance.now();

    const {
      organization,
      division,
      app_under_test,
      initialCandidates = 30,
      vectorThreshold = 0.40,
      useGemini = true,
      vectorWeight = 1.0,
      keywordWeight = 1.0,
      rrfK = 60,
      rerankCandidates = 15,
      topK = 5,
    } = options;

    console.log("\n🔍 ========== HYBRID RETRIEVAL V2 ==========");
    console.log(`📝 Query: "${query.substring(0, 80)}${query.length > 80 ? "..." : ""}"`);
    console.log(`⚙️  Config: ${initialCandidates} candidates → ${rerankCandidates} rerank → ${topK} final`);

    // ========== STEP 1: Parallel Search ==========
    // FIX 1: Use searchMultiSource to query BOTH siam_vectors AND wiki_documents
    const searchStart = performance.now();

    const [vectorResults, keywordResults] = await Promise.all([
      // Multi-source vector search (siam_vectors + wiki_documents)
      this.vectorService.searchMultiSource(query, {
        organization,
        division,
        app_under_test,
        matchThreshold: vectorThreshold,
        matchCount: initialCandidates,
        includeWikiDocs: true,
        includeSiamVectors: true,
        appNameFilter: 'AOMA',
      }).catch(err => {
        console.error("❌ Multi-source vector search failed:", err);
        return [] as VectorSearchResult[];
      }),

      // Keyword/BM25 search
      this.keywordSearch(query, {
        organization,
        division,
        app_under_test,
        limit: initialCandidates,
      }).catch(err => {
        console.error("❌ Keyword search failed:", err);
        return [] as VectorSearchResult[];
      }),
    ]);

    const vectorSearchMs = performance.now() - searchStart;

    console.log(`\n📊 Search Results:`);
    console.log(`   Vector: ${vectorResults.length} results`);
    console.log(`   Keyword: ${keywordResults.length} results`);

    // Handle edge case: no results
    if (vectorResults.length === 0 && keywordResults.length === 0) {
      console.log("⚠️ No results from either search");
      return this.emptyResult(performance.now() - startTime);
    }

    // ========== STEP 2: Merge & Deduplicate ==========
    const fusionStart = performance.now();

    const allDocuments = mergeAndDeduplicate(vectorResults as any[], keywordResults as any[]);
    console.log(`   Merged: ${allDocuments.length} unique documents`);

    // ========== STEP 3: RRF Fusion ==========
    const signals = createRankingSignals(vectorResults as any[], keywordResults as any[]);

    // Apply weights if not 1.0
    if (vectorWeight !== 1.0 || keywordWeight !== 1.0) {
      // Use weighted RRF
      const weights = new Map([
        ["vector", vectorWeight],
        ["keyword", keywordWeight],
      ]);

      // Re-calculate with weights
      for (const [signalName, rankings] of signals) {
        const weight = weights.get(signalName) ?? 1.0;
        for (const r of rankings) {
          r.score = (r.score || 0) * weight;
        }
      }
    }

    const rrfResults = reciprocalRankFusion(allDocuments, signals, rrfK);

    // Log top RRF results for debugging
    logRRFResults(rrfResults, 5);

    const fusionMs = performance.now() - fusionStart;

    // Take top candidates for reranking
    const candidatesForRerank = rrfResults
      .slice(0, rerankCandidates)
      .map(r => r.document);

    console.log(`\n🎯 RRF selected ${candidatesForRerank.length} candidates for reranking`);

    // ========== STEP 4: Apply RRF Scores (No External Reranking) ==========
    // Note: External rerankers were tested (Cohere, ZeRank-2) but removed
    // because Gemini embeddings + RRF fusion produce better results.
    const finalDocuments: RankedDocument[] = candidatesForRerank.slice(0, topK).map((doc, idx) => ({
      ...doc,
      rerankScore: rrfResults[idx].rrfScore,
      rerankReasoning: `RRF score: ${rrfResults[idx].rrfScore.toFixed(4)}`,
      originalRank: idx + 1,
      originalSimilarity: doc.similarity ?? 0,
    } as RankedDocument));
    const rerankingMs = 0; // No external reranking

    console.log(`\n✅ RRF fusion complete: ${finalDocuments.length} documents`);

    // ========== FINAL RESULTS ==========
    const totalMs = performance.now() - startTime;

    console.log(`\n⏱️  TIMING BREAKDOWN:`);
    console.log(`   Parallel search: ${vectorSearchMs.toFixed(0)}ms`);
    console.log(`   RRF fusion: ${fusionMs.toFixed(0)}ms`);
    console.log(`   Reranking: ${rerankingMs.toFixed(0)}ms`);
    console.log(`   TOTAL: ${totalMs.toFixed(0)}ms`);
    console.log("=".repeat(50) + "\n");

    return {
      documents: finalDocuments,
      metrics: {
        vectorResults: vectorResults.length,
        keywordResults: keywordResults.length,
        mergedCandidates: allDocuments.length,
        rrfTopCandidates: candidatesForRerank.length,
        finalDocuments: finalDocuments.length,
        vectorSearchMs,
        keywordSearchMs: vectorSearchMs, // Parallel, so same time
        fusionMs,
        rerankingMs,
        totalMs,
      },
      debug: {
        topRRFScores: rrfResults.slice(0, 10).map(r => ({
          id: r.document.id,
          score: r.rrfScore,
          signals: r.signalBreakdown,
        })),
      },
    };
  }

  /**
   * Keyword search using PostgreSQL full-text search
   * Falls back to similarity search if BM25 function doesn't exist
   */
  private async keywordSearch(
    query: string,
    options: {
      organization: string;
      division: string;
      app_under_test: string;
      limit: number;
    }
  ): Promise<VectorSearchResult[]> {
    const { organization, division, app_under_test, limit } = options;

    try {
      // Get admin client lazily
      const adminClient = getAdminClient();
      if (!adminClient) {
        console.log("⚠️ Supabase admin client not available, skipping keyword search");
        return [];
      }
      
      // Try to use the BM25 search function
      const { data, error } = await adminClient.rpc("search_siam_hybrid", {
        p_organization: organization,
        p_division: division,
        p_app_under_test: app_under_test,
        p_query: query,
        p_match_count: limit,
      });

      if (error) {
        // Function might not exist yet, fall back gracefully
        if (error.message.includes("function") || error.code === "42883") {
          console.log("⚠️ BM25 search function not found, using vector-only");
          return [];
        }
        throw error;
      }

      // Transform to VectorSearchResult format
      return (data || []).map((row: any) => ({
        id: row.id,
        content: row.content,
        source_type: row.source_type,
        source_id: row.source_id,
        metadata: row.metadata,
        similarity: Math.min(row.bm25_rank * 2, 1), // Normalize BM25 to 0-1 range
      }));
    } catch (error) {
      console.error("Keyword search error:", error);
      return [];
    }
  }

  /**
   * Return empty result structure
   */
  private emptyResult(totalMs: number): HybridRetrievalResult {
    return {
      documents: [],
      metrics: {
        vectorResults: 0,
        keywordResults: 0,
        mergedCandidates: 0,
        rrfTopCandidates: 0,
        finalDocuments: 0,
        vectorSearchMs: 0,
        keywordSearchMs: 0,
        fusionMs: 0,
        rerankingMs: 0,
        totalMs,
      },
    };
  }
}

// Singleton instance
let hybridRetrievalV2: HybridRetrievalV2 | null = null;

export function getHybridRetrievalV2(): HybridRetrievalV2 {
  if (!hybridRetrievalV2) {
    hybridRetrievalV2 = new HybridRetrievalV2();
  }
  return hybridRetrievalV2;
}
