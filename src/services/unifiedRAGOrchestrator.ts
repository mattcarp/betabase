/**
 * Parallel Unified RAG Orchestrator
 *
 * Implements speculative execution to reduce latency:
 * 1. Parallelizes Vector Search (Stage 1) and Query Transformation
 * 2. Speculatively re-ranks initial results while second-pass retrieval runs
 * 3. Merges results from both passes
 *
 * Latency Reduction Goal: 1900ms -> 1100ms (~40% reduction)
 */

import { getContextAwareRetrieval } from "./contextAwareRetrieval";
import { getAgenticRAGAgent } from "./agenticRAG/agent";
import { getSessionStateManager, type RLHFFeedback } from "../lib/sessionStateManager";
import { getTwoStageRetrieval, type TwoStageRetrievalResult } from "./twoStageRetrieval"; // Import types
import { getCohereReranker } from "./cohereReranker";
import { getHybridRetrievalV2 } from "./hybridRetrievalV2"; // NEW: Hybrid retrieval with RRF
import { VectorSearchResult } from "../lib/supabase";

export interface UnifiedRAGOptions {
  sessionId: string;
  organization: string;
  division: string;
  app_under_test: string;
  userEmail?: string;
  
  // Feature flags
  useContextAware?: boolean; // Use conversation history (default: true)
  useAgenticRAG?: boolean; // Use agent with self-correction (default: false)
  useRLHFSignals?: boolean; // Apply RLHF boosts (default: true)
  useHybridSearch?: boolean; // Use hybrid vector+keyword search with RRF (default: true) - NEW!
  
  // Retrieval parameters
  initialCandidates?: number;
  topK?: number;
  targetConfidence?: number;
  maxAgentIterations?: number;
}

export interface UnifiedRAGResult {
  documents: any[];
  response?: string;
  metadata: {
    strategy: "context-aware" | "agentic" | "standard" | "parallel-context-aware" | "hybrid";
    confidence: number;
    totalTimeMs: number;
    usedContextAware: boolean;
    usedAgenticRAG: boolean;
    usedRLHFSignals: boolean;
    usedHybridSearch?: boolean; // NEW
    queryTransformation?: any;
    agentIterations?: number;
  };
}

export class UnifiedRAGOrchestrator {
  private contextAware = getContextAwareRetrieval();
  private agenticRAG = getAgenticRAGAgent();
  private sessionManager = getSessionStateManager();
  private twoStageRetrieval = getTwoStageRetrieval();
  private reranker = getCohereReranker();
  private hybridRetrieval = getHybridRetrievalV2(); // NEW: Hybrid search with RRF

  /**
   * Execute unified RAG query with all three strategies
   */
  async query(
    query: string,
    options: UnifiedRAGOptions
  ): Promise<UnifiedRAGResult> {
    const {
      sessionId,
      organization,
      division,
      app_under_test,
      userEmail,
      useContextAware = true,
      useAgenticRAG = false,
      useRLHFSignals = true,
      useHybridSearch = true, // NEW: Default to hybrid search for better exact match handling
      initialCandidates = 50,
      topK = 10,
      targetConfidence = 0.8,
      maxAgentIterations = 3,
    } = options;

    const startTime = performance.now();

    console.log("\n🌟 ========== UNIFIED RAG ORCHESTRATOR (PARALLEL) ==========");
    console.log(`📝 Query: "${query.substring(0, 100)}${query.length > 100 ? '...' : ''}"`);
    console.log(`🎯 Strategy: ${useAgenticRAG ? 'AGENTIC' : useHybridSearch ? 'HYBRID' : useContextAware ? 'PARALLEL CONTEXT-AWARE' : 'STANDARD'}`);
    console.log(`🔐 RLHF Signals: ${useRLHFSignals ? 'ENABLED' : 'DISABLED'}`);
    console.log(`🔀 Hybrid Search: ${useHybridSearch ? 'ENABLED' : 'DISABLED'}`);

    let result: any;
    let strategy: "context-aware" | "agentic" | "standard" | "parallel-context-aware" | "hybrid";
    let confidence: number = 0;

    try {
      if (useAgenticRAG) {
        // STRATEGY 1: Agentic RAG (most advanced, slower)
        strategy = "agentic";
        console.log("\n🤖 Using Agentic RAG with self-correction");
        
        const agentResult = await this.agenticRAG.executeWithSelfCorrection(
          query,
          {
            sessionId,
            organization,
            division,
            app_under_test,
            maxIterations: maxAgentIterations,
            targetConfidence,
            enableLogging: true,
          }
        );

        result = {
          documents: agentResult.context,
          metadata: {
            strategy,
            confidence: agentResult.confidence,
            totalTimeMs: performance.now() - startTime,
            usedContextAware: false,
            usedAgenticRAG: true,
            usedRLHFSignals: useRLHFSignals,
            usedHybridSearch: false,
            agentIterations: agentResult.iterations,
          },
        };
        confidence = agentResult.confidence;

      } else if (useHybridSearch) {
        // STRATEGY 2: HYBRID SEARCH (NEW - Option C: RRF + Gemini Structured Reranking)
        // This is the recommended default for best quality
        strategy = "hybrid";
        console.log("\n🔀 Using Hybrid Search (Vector + Keyword + RRF + Gemini Reranking)");

        const hybridResult = await this.hybridRetrieval.search(query, {
          organization,
          division,
          app_under_test,
          initialCandidates: initialCandidates,
          vectorThreshold: 0.40, // Slightly stricter threshold
          useGemini: true,
          vectorWeight: 1.0,
          keywordWeight: 1.0,
          rrfK: 60,
          rerankCandidates: 15,
          topK,
          useRLHFSignals,
          skipReranking: false, // Always use Gemini reranking for quality
        });

        // Calculate confidence based on rerank scores
        const avgScore = hybridResult.documents.length > 0
          ? hybridResult.documents.reduce((sum, doc) => sum + (doc.rerankScore || 0), 0) / hybridResult.documents.length
          : 0;

        result = {
          documents: hybridResult.documents,
          metadata: {
            strategy,
            confidence: Math.min(avgScore + 0.1, 1.0), // Slight boost for hybrid
            totalTimeMs: hybridResult.metrics.totalMs,
            usedContextAware: false,
            usedAgenticRAG: false,
            usedRLHFSignals: useRLHFSignals,
            usedHybridSearch: true,
            hybridMetrics: {
              vectorResults: hybridResult.metrics.vectorResults,
              keywordResults: hybridResult.metrics.keywordResults,
              mergedCandidates: hybridResult.metrics.mergedCandidates,
              rerankingMs: hybridResult.metrics.rerankingMs,
            },
          },
        };
        confidence = result.metadata.confidence;

        console.log(`✅ Hybrid search complete: ${hybridResult.documents.length} documents`);
        console.log(`   Vector: ${hybridResult.metrics.vectorResults}, Keyword: ${hybridResult.metrics.keywordResults}`);
        console.log(`   Confidence: ${(confidence * 100).toFixed(1)}%`);

      } else if (useContextAware) {
        // STRATEGY 2: Parallel Context-Aware Retrieval (OPTIMIZED)
        strategy = "parallel-context-aware";
        console.log("\n🧠 Using Parallel Context-Aware Retrieval");

        // Step 1: Fire BOTH Query Transformation AND Initial Vector Search
        console.log("⚡ Starting parallel execution: Transformation + Initial Search");
        
        // Use ANY for internal private method access to avoid complex refactoring
        const transformPromise = (this.contextAware as any).transformQuery(query, 
          this.sessionManager.getOrCreateSession(sessionId, {
            organization, 
            division, 
            app_under_test, 
            userEmail,
            startedAt: new Date().toISOString(),
            lastActivityAt: new Date().toISOString()
          })
        );

        // MULTI-SOURCE SEARCH: Query both wiki_documents (OpenAI 1536d) AND siam_vectors (Gemini 768d)
        const initialVectorSearchPromise = (this.twoStageRetrieval as any).vectorService.searchMultiSource(query, {
          organization,
          division,
          app_under_test,
          matchThreshold: 0.3,
          matchCount: initialCandidates,
          includeWikiDocs: true,
          includeSiamVectors: true,
          appNameFilter: 'AOMA',
        });

        // Step 2: Wait for both to complete? 
        // We can speculatively start re-ranking initial results if transformation takes too long.
        // But for simplicity in V1 parallelization, let's await both, then race the second steps.
        
        const [transformation, initialVectorResults] = await Promise.all([
            transformPromise,
            initialVectorSearchPromise
        ]);

        console.log(`✅ Parallel Step 1 Complete.`);
        console.log(`   Transformed Query: "${transformation.enhancedQuery}"`);
        console.log(`   Initial Candidates: ${initialVectorResults.length}`);

        // Step 3: Fire Enhanced Vector Search (with transformed query) AND Speculative Reranking (of initial results)
        // If the query wasn't changed much, we can skip the second search!
        
        const queryChanged = transformation.enhancedQuery !== query;
        let finalDocuments: any[] = [];
        const metadata: any = {};

        if (!queryChanged) {
            console.log("⚡ Query unchanged, proceeding with standard reranking of initial results");
            // Just rerank initial results
            const rerankResult = await this.reranker.rerankDocuments(query, initialVectorResults, {
                topK,
                organization,
                division,
                app_under_test,
                useRLHFSignals
            });
            finalDocuments = rerankResult.documents;
        } else {
            console.log("⚡ Query changed, executing parallel Enhanced Search + Speculative Reranking");
            
            // Branch A: Enhanced Search -> Rerank (MULTI-SOURCE)
            const enhancedSearchPromise = (async () => {
                const results = await (this.twoStageRetrieval as any).vectorService.searchMultiSource(transformation.enhancedQuery, {
                    organization,
                    division,
                    app_under_test,
                    matchThreshold: 0.3,
                    matchCount: initialCandidates,
                    includeWikiDocs: true,
                    includeSiamVectors: true,
                    appNameFilter: 'AOMA',
                });
                // Rerank these new results immediately? Or merge first?
                // Reranking is the bottleneck, so we should try to batch or just rerank the new ones.
                return this.reranker.rerankDocuments(transformation.enhancedQuery, results, {
                    topK,
                    organization,
                    division,
                    app_under_test,
                    useRLHFSignals
                });
            })();

            // Branch B: Speculative Reranking of Initial Results (in case Enhanced Search yields nothing or fails)
            const speculativeRerankPromise = this.reranker.rerankDocuments(query, initialVectorResults, {
                topK,
                organization,
                division,
                app_under_test,
                useRLHFSignals
            });

            // Wait for both
            const [enhancedReranked, speculativeReranked] = await Promise.all([
                enhancedSearchPromise,
                speculativeRerankPromise
            ]);

            // Merge results based on score
            // Deduplicate by ID
            const allDocs = [...enhancedReranked.documents, ...speculativeReranked.documents];
            const uniqueDocsMap = new Map();
            allDocs.forEach(doc => {
                if (!uniqueDocsMap.has(doc.id) || uniqueDocsMap.get(doc.id).rerankScore < doc.rerankScore) {
                    uniqueDocsMap.set(doc.id, doc);
                }
            });
            
            finalDocuments = Array.from(uniqueDocsMap.values())
                .sort((a: any, b: any) => b.rerankScore - a.rerankScore)
                .slice(0, topK);
                
             console.log(`✅ Merged results: ${enhancedReranked.documents.length} enhanced + ${speculativeReranked.documents.length} speculative -> ${finalDocuments.length} final`);
        }

        result = {
          documents: finalDocuments,
          metadata: {
            strategy,
            confidence: 0.8, 
            totalTimeMs: performance.now() - startTime,
            usedContextAware: true,
            usedAgenticRAG: false,
            usedRLHFSignals: useRLHFSignals,
            queryTransformation: transformation,
          },
        };
        confidence = 0.8;

      } else {
        // STRATEGY 3: Standard Two-Stage Retrieval (fallback)
        strategy = "standard";
        console.log("\n⚡ Using Standard Two-Stage Retrieval");
        
        const twoStageResult = await this.twoStageRetrieval.query(query, {
          organization,
          division,
          app_under_test,
          initialCandidates,
          topK,
          useRLHFSignals,
          useGemini: true, // Use Gemini embeddings (768d)
        });

        result = {
          documents: twoStageResult.documents,
          metadata: {
            strategy,
            confidence: 0.7, // Heuristic confidence for standard retrieval
            totalTimeMs: performance.now() - startTime,
            usedContextAware: false,
            usedAgenticRAG: false,
            usedRLHFSignals: useRLHFSignals,
          },
        };
        confidence = 0.7;
      }

      // Add turn to session history
      const session = this.sessionManager.getOrCreateSession(sessionId, {
        organization,
        division,
        app_under_test,
        userEmail,
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      });

      this.sessionManager.addTurn(sessionId, {
        query,
        retrievedDocs: result.documents.map((d: any) => d.id),
        response: "", // Will be filled after generation
        timestamp: new Date().toISOString(),
      });

      console.log(`\n✅ UNIFIED RAG COMPLETE`);
      console.log(`   Strategy: ${strategy}`);
      console.log(`   Confidence: ${(confidence * 100).toFixed(1)}%`);
      console.log(`   Documents: ${result.documents.length}`);
      console.log(`   Total Time: ${result.metadata.totalTimeMs.toFixed(0)}ms`);
      console.log("================================================\n");

      return result;

    } catch (error) {
      console.error("❌ Unified RAG failed:", error);
      throw error;
    }
  }

  /**
   * Add feedback to a session
   */
  async addFeedback(
    sessionId: string,
    feedback: RLHFFeedback
  ): Promise<void> {
    const session = this.sessionManager.getSession(sessionId);
    if (!session || session.history.length === 0) {
      throw new Error(`No active session or history found for ${sessionId}`);
    }

    // Add feedback to the most recent turn
    const lastTurnIndex = session.history.length - 1;
    session.history[lastTurnIndex].feedback = feedback;

    // Update reinforcement context
    this.sessionManager.addTurn(sessionId, session.history[lastTurnIndex]);
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string) {
    const session = this.sessionManager.getSession(sessionId);
    if (!session) return null;

    const { history, reinforcementContext } = session;
    
    const feedbackCount = history.filter(t => t.feedback).length;
    const positiveFeedback = history.filter(
      t => t.feedback && (t.feedback.type === "thumbs_up" || (t.feedback.type === "rating" && t.feedback.value?.score >= 4))
    ).length;

    return {
      totalTurns: history.length,
      feedbackCount,
      positiveFeedback,
      successfulDocs: reinforcementContext.successfulDocIds.length,
      failedDocs: reinforcementContext.failedDocIds.length,
      topTopics: Object.entries(reinforcementContext.topicWeights)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5),
    };
  }
}

// Singleton instance
let unifiedRAGOrchestrator: UnifiedRAGOrchestrator | null = null;

export function getUnifiedRAGOrchestrator(): UnifiedRAGOrchestrator {
  if (!unifiedRAGOrchestrator) {
    unifiedRAGOrchestrator = new UnifiedRAGOrchestrator();
  }
  return unifiedRAGOrchestrator;
}
