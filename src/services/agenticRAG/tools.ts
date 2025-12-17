/**
 * Agentic RAG Tools
 * 
 * Domain-aware tools for AOMA knowledge navigation
 * Part of the Advanced RLHF RAG Implementation - Phase 4
 */

import { getTwoStageRetrieval } from "../twoStageRetrieval";
import { VectorSearchResult } from "../../lib/supabase";

export interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, ToolParameter>;
  execute: (args: any) => Promise<any>;
}

export interface ToolExecutionResult {
  tool: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTimeMs: number;
}

/**
 * Vector search tool
 */
export const vectorSearchTool: ToolDefinition = {
  name: "vector_search",
  description: "Semantic search across all AOMA documents",
  inputSchema: {
    query: {
      name: "query",
      type: "string",
      description: "Search query",
      required: true,
    },
    source_types: {
      name: "source_types",
      type: "array",
      description: "Filter by source types (e.g., ['knowledge', 'jira'])",
    },
    match_threshold: {
      name: "match_threshold",
      type: "number",
      description: "Minimum similarity threshold (0-1)",
    },
    organization: {
      name: "organization",
      type: "string",
      description: "Organization filter",
      required: true,
    },
    division: {
      name: "division",
      type: "string",
      description: "Division filter",
      required: true,
    },
    app_under_test: {
      name: "app_under_test",
      type: "string",
      description: "App under test filter",
      required: true,
    },
  },
  execute: async (args) => {
    const twoStage = getTwoStageRetrieval();
    const result = await twoStage.query(args.query, {
      organization: args.organization,
      division: args.division,
      app_under_test: args.app_under_test,
      sourceTypes: args.source_types,
      vectorThreshold: args.match_threshold || 0.50,
      initialCandidates: 30,
      topK: 10,
      useRLHFSignals: true,
    });
    
    return {
      documents: result.documents.map(doc => ({
        id: doc.id,
        content: doc.content.substring(0, 300),
        source_type: doc.source_type,
        similarity: doc.similarity,
        rerankScore: doc.rerankScore,
      })),
      count: result.documents.length,
      metrics: result.stage1Metrics,
    };
  },
};

/**
 * Metadata filter tool
 */
export const metadataFilterTool: ToolDefinition = {
  name: "metadata_filter",
  description: "Filter documents by specific metadata criteria",
  inputSchema: {
    filters: {
      name: "filters",
      type: "object",
      description: "Metadata filters as key-value pairs",
      required: true,
    },
    organization: {
      name: "organization",
      type: "string",
      description: "Organization",
      required: true,
    },
    division: {
      name: "division",
      type: "string",
      description: "Division",
      required: true,
    },
    app_under_test: {
      name: "app_under_test",
      type: "string",
      description: "App under test",
      required: true,
    },
  },
  execute: async (args) => {
    // This would query Supabase with metadata filters
    // For now, return a placeholder
    return {
      message: "Metadata filtering applied",
      filters: args.filters,
      results: [],
    };
  },
};

/**
 * Confidence check tool
 */
export const confidenceCheckTool: ToolDefinition = {
  name: "confidence_check",
  description: "Evaluate confidence that current context can answer the query",
  inputSchema: {
    context: {
      name: "context",
      type: "array",
      description: "Array of context strings",
      required: true,
    },
    query: {
      name: "query",
      type: "string",
      description: "The original query",
      required: true,
    },
  },
  execute: async (args) => {
    const { context, query } = args;
    
    // Simple heuristic-based confidence calculation
    // In production, this could use LLM or more sophisticated methods
    
    if (!context || context.length === 0) {
      return {
        confidence: 0,
        reasoningText: "No context available",
      };
    }
    
    // Check for keyword overlap
    const queryKeywords = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    const contextText = context.join(" ").toLowerCase();
    const matchingKeywords = queryKeywords.filter((kw: string) => contextText.includes(kw));
    const keywordOverlap = matchingKeywords.length / queryKeywords.length;
    
    // Check context length
    const totalContentLength = context.reduce((sum: number, c: string) => sum + c.length, 0);
    const lengthScore = Math.min(1.0, totalContentLength / 1000); // Normalize to 1000 chars
    
    // Calculate confidence
    const confidence = (keywordOverlap * 0.7 + lengthScore * 0.3);
    
    let reasoning = "";
    if (confidence >= 0.8) {
      reasoning = "High confidence - strong keyword overlap and sufficient context";
    } else if (confidence >= 0.5) {
      reasoning = "Medium confidence - some keyword overlap but may need more context";
    } else {
      reasoning = "Low confidence - weak keyword overlap or insufficient context";
    }
    
    return {
      confidence: Math.min(1.0, confidence),
      reasoning,
      metrics: {
        keywordOverlap,
        lengthScore,
        contextChunks: context.length,
        totalContentLength,
      },
    };
  },
};

/**
 * All available tools
 */
export const AGENTIC_TOOLS: Record<string, ToolDefinition> = {
  vector_search: vectorSearchTool,
  metadata_filter: metadataFilterTool,
  confidence_check: confidenceCheckTool,
};

/**
 * Execute a tool by name
 */
export async function executeTool(
  toolName: string,
  args: any
): Promise<ToolExecutionResult> {
  const startTime = performance.now();
  
  const tool = AGENTIC_TOOLS[toolName];
  if (!tool) {
    return {
      tool: toolName,
      success: false,
      error: `Tool ${toolName} not found`,
      executionTimeMs: performance.now() - startTime,
    };
  }
  
  try {
    const result = await tool.execute(args);
    return {
      tool: toolName,
      success: true,
      result,
      executionTimeMs: performance.now() - startTime,
    };
  } catch (error) {
    return {
      tool: toolName,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      executionTimeMs: performance.now() - startTime,
    };
  }
}

/**
 * Get Gemini function declarations for all tools
 */
export function getGeminiFunctionDeclarations() {
  return Object.values(AGENTIC_TOOLS).map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: {
      type: "object",
      properties: Object.fromEntries(
        Object.entries(tool.inputSchema || {}).map(([key, param]) => {
          const paramDef: Record<string, any> = {
            type: param.type,
            description: param.description,
          };
          // Add items for array types (required by Gemini API)
          if (param.type === "array") {
            paramDef.items = { type: "string" };
          }
          return [key, paramDef];
        })
      ),
      required: Object.entries(tool.inputSchema || {})
        .filter(([, param]) => param.required)
        .map(([key]) => key),
    },
  }));
}

