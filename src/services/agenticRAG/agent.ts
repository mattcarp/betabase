/**
 * Agentic RAG Agent
 * 
 * Multi-step reasoning agent using Gemini for decisions and tool execution
 * Part of the Advanced RLHF RAG Implementation - Phase 4
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { executeTool, getGeminiFunctionDeclarations } from "./tools";
import { supabaseAdmin } from "../../lib/supabase";

export interface AgentDecision {
  step: number;
  action: string;
  tool: string;
  toolArgs: Record<string, any>;
  result: any;
  confidence: number;
  reasoning: string;
  timestamp: string;
}

export interface AgentExecutionLog {
  sessionId: string;
  query: string;
  decisions: AgentDecision[];
  finalContext: any[];
  finalConfidence: number;
  totalIterations: number;
  executionTime: number;
  model_used: string;
  organization: string;
  division: string;
  app_under_test: string;
}

export interface AgentOptions {
  sessionId: string;
  organization: string;
  division: string;
  app_under_test: string;
  maxIterations?: number;
  targetConfidence?: number;
  enableLogging?: boolean;
}

export interface AgentResult {
  context: any[];
  confidence: number;
  iterations: number;
  decisions: AgentDecision[];
  executionLog?: AgentExecutionLog;
}

export class AgenticRAGAgent {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY environment variable is required");
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Use Gemini with function calling
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      tools: [{ functionDeclarations: getGeminiFunctionDeclarations() }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.95,
      },
    });
  }

  /**
   * Execute agentic RAG with self-correction
   */
  async executeWithSelfCorrection(
    query: string,
    options: AgentOptions
  ): Promise<AgentResult> {
    const {
      maxIterations = 3,
      targetConfidence = 0.8,
      enableLogging = true,
    } = options;

    const startTime = performance.now();
    let iteration = 0;
    let confidence = 0;
    let context: any[] = [];
    const decisions: AgentDecision[] = [];

    console.log("\n🤖 ========== AGENTIC RAG AGENT ==========");
    console.log(`📝 Query: "${query}"`);
    console.log(`🎯 Target Confidence: ${(targetConfidence * 100).toFixed(0)}%`);
    console.log(`🔁 Max Iterations: ${maxIterations}`);

    while (confidence < targetConfidence && iteration < maxIterations) {
      iteration++;
      console.log(`\n--- Iteration ${iteration} ---`);

      // Attempt retrieval
      const retrievalDecision = await this.executeRetrieval(
        query,
        options,
        iteration
      );
      decisions.push(retrievalDecision);
      context = retrievalDecision.result.documents || [];

      // Evaluate confidence
      const confidenceDecision = await this.evaluateConfidence(
        query,
        context
      );
      decisions.push(confidenceDecision);
      confidence = confidenceDecision.confidence;

      console.log(`   Confidence: ${(confidence * 100).toFixed(1)}%`);
      console.log(`   Reasoning: ${confidenceDecision.reasoning}`);

      if (confidence >= targetConfidence) {
        console.log(`   ✅ Target confidence reached!`);
        break;
      }

      // If not confident and not last iteration, adjust strategy
      if (iteration < maxIterations) {
        console.log(`   🔄 Adjusting strategy...`);
        query = await this.improveQuery(query, confidenceDecision.reasoning);
        console.log(`   Enhanced Query: "${query}"`);
      }
    }

    const executionTime = performance.now() - startTime;

    console.log(`\n⏱️  Total Execution Time: ${executionTime.toFixed(0)}ms`);
    console.log(`🔁 Total Iterations: ${iteration}`);
    console.log(`📊 Final Confidence: ${(confidence * 100).toFixed(1)}%`);
    console.log("==========================================\n");

    // Log execution if enabled
    let executionLog: AgentExecutionLog | undefined;
    if (enableLogging) {
      executionLog = await this.logExecution(
        query,
        decisions,
        context,
        confidence,
        iteration,
        executionTime,
        options
      );
    }

    return {
      context,
      confidence,
      iterations: iteration,
      decisions,
      executionLog,
    };
  }

  /**
   * Execute retrieval using vector search tool
   */
  private async executeRetrieval(
    query: string,
    options: AgentOptions,
    iteration: number
  ): Promise<AgentDecision> {
    const toolArgs = {
      query,
      organization: options.organization,
      division: options.division,
      app_under_test: options.app_under_test,
      match_threshold: Math.max(0.4, 0.5 - (iteration * 0.05)), // Lower threshold on each iteration
    };

    const result = await executeTool("vector_search", toolArgs);

    return {
      step: iteration * 2 - 1,
      action: "search",
      tool: "vector_search",
      toolArgs,
      result: result.result,
      confidence: 0,
      reasoning: `Executed vector search (iteration ${iteration})`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Evaluate confidence in current context
   */
  private async evaluateConfidence(
    query: string,
    context: any[]
  ): Promise<AgentDecision> {
    const toolArgs = {
      query,
      context: context.map(c => c.content || ""),
    };

    const result = await executeTool("confidence_check", toolArgs);

    return {
      step: context.length * 2,
      action: "evaluate",
      tool: "confidence_check",
      toolArgs,
      result: result.result,
      confidence: result.result?.confidence || 0,
      reasoning: result.result?.reasoning || "Confidence check completed",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Improve query based on feedback
   */
  private async improveQuery(
    originalQuery: string,
    feedback: string
  ): Promise<string> {
    try {
      const prompt = `Original query: "${originalQuery}"

Issue: ${feedback}

Generate an improved query that addresses the issue. Respond with ONLY the improved query text, nothing else.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim() || originalQuery;
    } catch (error) {
      console.error("Query improvement failed:", error);
      return originalQuery;
    }
  }

  /**
   * Log agent execution to database
   */
  private async logExecution(
    query: string,
    decisions: AgentDecision[],
    finalContext: any[],
    finalConfidence: number,
    totalIterations: number,
    executionTime: number,
    options: AgentOptions
  ): Promise<AgentExecutionLog | undefined> {
    try {
      // Generate embedding for query
      const { getGeminiEmbeddingService } = await import("../geminiEmbeddingService");
      const embeddingService = getGeminiEmbeddingService();
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      const log: Omit<AgentExecutionLog, 'id'> = {
        sessionId: options.sessionId,
        query,
        decisions,
        finalContext: finalContext.map(c => ({
          id: c.id,
          content: c.content?.substring(0, 200),
          source_type: c.source_type,
        })),
        finalConfidence,
        totalIterations,
        executionTime,
        model_used: "gemini-2.0-flash-exp",
        organization: options.organization,
        division: options.division,
        app_under_test: options.app_under_test,
      };

      if (supabaseAdmin) {
        await supabaseAdmin.from("agent_execution_logs").insert({
          ...log,
          query_embedding: queryEmbedding,
        });
      }

      return log as AgentExecutionLog;
    } catch (error) {
      console.error("Failed to log agent execution:", error);
      return undefined;
    }
  }
}

// Singleton instance
let agenticRAGAgent: AgenticRAGAgent | null = null;

export function getAgenticRAGAgent(): AgenticRAGAgent {
  if (!agenticRAGAgent) {
    agenticRAGAgent = new AgenticRAGAgent();
  }
  return agenticRAGAgent;
}

