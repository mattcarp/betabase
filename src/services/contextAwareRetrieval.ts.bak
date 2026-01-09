/**
 * Context-Aware Retrieval Service
 * 
 * Enhances retrieval by incorporating conversation history and RLHF signals
 * Part of the Advanced RLHF RAG Implementation - Phase 3
 */

import { getSessionStateManager, type ConversationSession } from "../lib/sessionStateManager";
import { getTwoStageRetrieval } from "./twoStageRetrieval";
import { getGeminiEmbeddingService } from "./geminiEmbeddingService";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';

export interface ContextAwareQueryOptions {
  sessionId: string;
  organization: string;
  division: string;
  app_under_test: string;
  userEmail?: string;
  
  // Retrieval options
  initialCandidates?: number;
  topK?: number;
  useRLHFSignals?: boolean;
}

export interface QueryTransformationResult {
  originalQuery: string;
  enhancedQuery: string;
  reasoning: string;
  contextUsed: {
    historyTurns: number;
    topicWeights: Record<string, number>;
    successfulDocs: number;
  };
}

export class ContextAwareRetrieval {
  private sessionManager = getSessionStateManager();
  private twoStageRetrieval = getTwoStageRetrieval();
  private geminiModel: any;
  private supabase: any;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY environment variable is required");
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    this.geminiModel = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.3,
        topP: 0.95,
        topK: 40,
      }
    });

    // Initialize Supabase client for RLHF feedback
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseAnonKey) {
      this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
  }

  /**
   * Execute context-aware retrieval
   */
  async query(
    originalQuery: string,
    options: ContextAwareQueryOptions
  ) {
    const {
      sessionId,
      organization,
      division,
      app_under_test,
      userEmail,
      initialCandidates = 50,
      topK = 10,
      useRLHFSignals = true,
    } = options;

    console.log("\n🧠 ========== CONTEXT-AWARE RETRIEVAL ==========");
    console.log(`📝 Original Query: "${originalQuery.substring(0, 100)}${originalQuery.length > 100 ? '...' : ''}"`);

    // Get or create session
    const session = this.sessionManager.getOrCreateSession(sessionId, {
      organization,
      division,
      app_under_test,
      userEmail,
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    });

    // Transform query based on context
    const transformation = await this.transformQuery(originalQuery, session);
    
    console.log(`🔄 Enhanced Query: "${transformation.enhancedQuery.substring(0, 100)}${transformation.enhancedQuery.length > 100 ? '...' : ''}"`);
    console.log(`💡 Reasoning: ${transformation.reasoning}`);

    // Execute two-stage retrieval with enhanced query
    const retrievalResult = await this.twoStageRetrieval.query(
      transformation.enhancedQuery,
      {
        organization,
        division,
        app_under_test,
        initialCandidates,
        topK,
        useRLHFSignals,
        useGemini: true, // Use Gemini embeddings (768d)
      }
    );

    console.log("==========================================\n");

    return {
      documents: retrievalResult.documents,
      transformation,
      metrics: {
        ...retrievalResult.stage1Metrics,
        ...retrievalResult.stage2Metrics,
        totalTimeMs: retrievalResult.totalTimeMs,
      },
    };
  }

  /**
   * Load RLHF feedback signals from database
   */
  private async loadRLHFFeedback(sessionId: string) {
    if (!this.supabase) {
      console.warn('Supabase not initialized - skipping RLHF feedback load');
      return {
        successfulQueries: [],
        relevantDocuments: [],
        userPreferences: {}
      };
    }

    try {
      // Load positive feedback (rating >= 4 or thumbs_up feedback)
      // Using correct column names from schema: query, response, retrieved_contexts
      const { data, error } = await this.supabase
        .from('rlhf_feedback')
        .select('query, response, retrieved_contexts, feedback_type, feedback_value')
        .or('feedback_type.eq.thumbs_up,feedback_value->>score.gte.4')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Failed to load RLHF feedback:', error);
        return { successfulQueries: [], relevantDocuments: [], userPreferences: {} };
      }

      // Extract successful query patterns
      const successfulQueries = (data || [])
        .map(row => row.query)
        .filter(Boolean);

      // Extract documents from retrieved contexts
      const relevantDocuments = (data || [])
        .flatMap(row => row.retrieved_contexts || [])
        .filter((doc: any) => doc && doc.doc_id);

      console.log(`📚 Loaded ${successfulQueries.length} successful queries from RLHF feedback`);
      console.log(`📄 Found ${relevantDocuments.length} curator-approved documents`);

      return {
        successfulQueries,
        relevantDocuments,
        userPreferences: {}
      };
    } catch (error) {
      console.error('Error loading RLHF feedback:', error);
      return { successfulQueries: [], relevantDocuments: [], userPreferences: {} };
    }
  }

  /**
   * Transform query based on conversation context and RLHF signals
   */
  private async transformQuery(
    originalQuery: string,
    session: ConversationSession,
    useRLHF: boolean = true
  ): Promise<QueryTransformationResult> {
    const { history, reinforcementContext } = session;

    // Load RLHF feedback signals
    let rlhfSignals = { successfulQueries: [], relevantDocuments: [], userPreferences: {} };
    if (useRLHF) {
      rlhfSignals = await this.loadRLHFFeedback(session.sessionId);
    }

    // If no history and no RLHF signals, return original query
    if (history.length === 0 && rlhfSignals.successfulQueries.length === 0) {
      return {
        originalQuery,
        enhancedQuery: originalQuery,
        reasoning: "No conversation history or RLHF signals - using original query",
        contextUsed: {
          historyTurns: 0,
          topicWeights: {},
          successfulDocs: 0,
        },
      };
    }

    // Build context prompt with RLHF signals
    const prompt = this.buildTransformationPrompt(
      originalQuery,
      history,
      reinforcementContext,
      rlhfSignals
    );

    try {
      // Call Gemini to transform query
      const result = await this.geminiModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse response
      const parsed = this.parseTransformationResponse(text);

      return {
        originalQuery,
        enhancedQuery: parsed.enhancedQuery || originalQuery,
        reasoning: parsed.reasoning || "Query transformation applied with RLHF signals",
        contextUsed: {
          historyTurns: history.length,
          topicWeights: reinforcementContext.topicWeights,
          successfulDocs: reinforcementContext.successfulDocIds.length + rlhfSignals.relevantDocuments.length,
        },
      };
    } catch (error) {
      console.error("Query transformation failed:", error);
      return {
        originalQuery,
        enhancedQuery: originalQuery,
        reasoning: "Transformation failed - using original query",
        contextUsed: {
          historyTurns: history.length,
          topicWeights: reinforcementContext.topicWeights,
          successfulDocs: reinforcementContext.successfulDocIds.length,
        },
      };
    }
  }

  /**
   * Build prompt for query transformation
   */
  private buildTransformationPrompt(
    query: string,
    history: any[],
    reinforcementContext: any,
    rlhfSignals?: any
  ): string {
    // Get recent history (last 5 turns)
    const recentHistory = history.slice(-5);

    // Build history text
    const historyText = recentHistory
      .map((turn, idx) => {
        const feedback = turn.feedback
          ? ` (Feedback: ${turn.feedback.type})`
          : "";
        return `${idx + 1}. Q: "${turn.query}"${feedback}`;
      })
      .join("\n");

    // Build topic weights text
    const topTopics = Object.entries(reinforcementContext.topicWeights)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([topic, weight]) => `${topic} (${(weight as number).toFixed(2)})`)
      .join(", ");

    // Build RLHF feedback text
    const rlhfText = rlhfSignals?.successfulQueries?.length > 0
      ? `\n\nSuccessful Query Patterns (from human feedback):\n${rlhfSignals.successfulQueries.slice(0, 5).map((q: string, i: number) => `${i + 1}. "${q}"`).join('\n')}`
      : "";

    const curatorDocsText = rlhfSignals?.relevantDocuments?.length > 0
      ? `\n\nCurator-Approved Documents: ${rlhfSignals.relevantDocuments.length} documents marked as highly relevant`
      : "";

    return `You are a query enhancement system for a knowledge base retrieval system. Your job is to rewrite the user's query to be more effective for vector search, considering the conversation history, learned preferences, and HUMAN FEEDBACK from curators.

Current Query: "${query}"

Conversation History:
${historyText || "No previous conversation"}

User's Topic Preferences (higher = more interested):
${topTopics || "No topic preferences yet"}

Successful Document Sources: ${reinforcementContext.successfulDocIds.length > 0 ? `${reinforcementContext.successfulDocIds.length} documents` : "None yet"}${rlhfText}${curatorDocsText}

Instructions:
1. Analyze the current query in context of the conversation
2. If the query refers to previous topics, incorporate that context
3. If the query is vague, make it more specific based on history
4. **CRITICALLY**: Learn from successful query patterns - if similar queries received positive feedback, adapt this query similarly
5. If topic preferences exist, subtly bias toward those topics
6. If curators marked certain documents as relevant, consider what made them relevant
7. Keep the enhanced query concise and focused
8. Maintain the user's original intent

Respond with ONLY valid JSON in this exact format:
{
  "enhancedQuery": "The enhanced query text here",
  "reasoning": "Brief explanation of what was enhanced and why, especially any RLHF-based improvements"
}`;
  }

  /**
   * Parse Gemini's transformation response
   */
  private parseTransformationResponse(responseText: string): {
    enhancedQuery?: string;
    reasoning?: string;
  } {
    try {
      // Extract JSON from markdown code blocks if present
      let jsonText = responseText.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      }
      
      const parsed = JSON.parse(jsonText);
      return {
        enhancedQuery: parsed.enhancedQuery,
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      console.error("Error parsing transformation response:", error);
      return {};
    }
  }

  /**
   * Add feedback to a conversation turn
   */
  async addFeedback(
    sessionId: string,
    turnIndex: number,
    feedback: any
  ): Promise<void> {
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (turnIndex < 0 || turnIndex >= session.history.length) {
      throw new Error(`Invalid turn index: ${turnIndex}`);
    }

    // Update turn with feedback
    session.history[turnIndex].feedback = feedback;

    // Update reinforcement context
    this.sessionManager.addTurn(sessionId, session.history[turnIndex]);
  }
}

// Singleton instance
let contextAwareRetrieval: ContextAwareRetrieval | null = null;

export function getContextAwareRetrieval(): ContextAwareRetrieval {
  if (!contextAwareRetrieval) {
    contextAwareRetrieval = new ContextAwareRetrieval();
  }
  return contextAwareRetrieval;
}

