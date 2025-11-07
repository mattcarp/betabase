/**
 * Unified RAG Orchestrator
 * 
 * Integrates all three RLHF RAG strategies:
 * 1. Re-ranking (two-stage retrieval with Gemini re-ranking)
 * 2. Agentic RAG (multi-step reasoning with self-correction)
 * 3. Context-aware retrieval (session history + RLHF signals)
 * 
 * Part of the Advanced RLHF RAG Implementation - Phase 6
 */

import { getContextAwareRetrieval } from "./contextAwareRetrieval";
import { getAgenticRAGAgent } from "./agenticRAG/agent";
import { getSessionStateManager, type RLHFFeedback } from "../lib/sessionStateManager";

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
    strategy: "context-aware" | "agentic" | "standard";
    confidence: number;
    totalTimeMs: number;
    usedContextAware: boolean;
    usedAgenticRAG: boolean;
    usedRLHFSignals: boolean;
    queryTransformation?: any;
    agentIterations?: number;
  };
}

export class UnifiedRAGOrchestrator {
  private contextAware = getContextAwareRetrieval();
  private agenticRAG = getAgenticRAGAgent();
  private sessionManager = getSessionStateManager();

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
      initialCandidates = 50,
      topK = 10,
      targetConfidence = 0.8,
      maxAgentIterations = 3,
    } = options;

    const startTime = performance.now();

    console.log("\n🌟 ========== UNIFIED RAG ORCHESTRATOR ==========");
    console.log(`📝 Query: "${query.substring(0, 100)}${query.length > 100 ? '...' : ''}"`);
    console.log(`🎯 Strategy: ${useAgenticRAG ? 'AGENTIC' : useContextAware ? 'CONTEXT-AWARE' : 'STANDARD'}`);
    console.log(`🔐 RLHF Signals: ${useRLHFSignals ? 'ENABLED' : 'DISABLED'}`);

    let result: any;
    let strategy: "context-aware" | "agentic" | "standard";
    let confidence: number = 0;

    try {
      if (useAgenticRAG) {
        // STRATEGY 1: Agentic RAG (most advanced)
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
            usedRLHFSignals,
            agentIterations: agentResult.iterations,
          },
        };
        confidence = agentResult.confidence;

      } else if (useContextAware) {
        // STRATEGY 2: Context-Aware Retrieval (recommended default)
        strategy = "context-aware";
        console.log("\n🧠 Using Context-Aware Retrieval");
        
        const contextAwareResult = await this.contextAware.query(query, {
          sessionId,
          organization,
          division,
          app_under_test,
          userEmail,
          initialCandidates,
          topK,
          useRLHFSignals,
        });

        result = {
          documents: contextAwareResult.documents,
          metadata: {
            strategy,
            confidence: 0.75, // Heuristic confidence for context-aware
            totalTimeMs: performance.now() - startTime,
            usedContextAware: true,
            usedAgenticRAG: false,
            usedRLHFSignals,
            queryTransformation: contextAwareResult.transformation,
          },
        };
        confidence = 0.75;

      } else {
        // STRATEGY 3: Standard Two-Stage Retrieval (fallback)
        strategy = "standard";
        console.log("\n⚡ Using Standard Two-Stage Retrieval");
        
        const { getTwoStageRetrieval } = await import("./twoStageRetrieval");
        const twoStage = getTwoStageRetrieval();
        
        const twoStageResult = await twoStage.query(query, {
          organization,
          division,
          app_under_test,
          initialCandidates,
          topK,
          useRLHFSignals,
          useGemini: true,
        });

        result = {
          documents: twoStageResult.documents,
          metadata: {
            strategy,
            confidence: 0.7, // Heuristic confidence for standard retrieval
            totalTimeMs: performance.now() - startTime,
            usedContextAware: false,
            usedAgenticRAG: false,
            usedRLHFSignals,
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

