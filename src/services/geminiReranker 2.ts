/**
 * Gemini Re-ranker Service
 * 
 * Implements cross-encoder style re-ranking using Gemini API
 * for high-precision document selection after initial vector search
 * Part of the Advanced RLHF RAG Implementation - Phase 2
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { VectorSearchResult } from "../lib/supabase";
import { supabase } from "../lib/supabase";

export interface RankedDocument extends VectorSearchResult {
  rerankScore: number;
  rerankReasoning?: string;
  originalRank: number;
  originalSimilarity: number;
  rlhfBoost?: number;
}

export interface RerankingOptions {
  topK?: number; // Number of documents to return after re-ranking
  batchSize?: number; // How many docs to re-rank at once
  useRLHFSignals?: boolean; // Apply RLHF boosts
  organization?: string;
  division?: string;
  app_under_test?: string;
}

export interface RerankingResult {
  documents: RankedDocument[];
  metrics: {
    totalCandidates: number;
    rerankedCount: number;
    avgRerankScore: number;
    rankChanges: number;
    processingTimeMs: number;
  };
}

export class GeminiReranker {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY environment variable is required");
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Using Gemini 2.0 Flash for fast, accurate re-ranking
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent scoring
        topP: 0.95,
        topK: 40,
      }
    });
  }

  /**
   * Re-rank documents using Gemini API
   */
  async rerankDocuments(
    query: string,
    documents: VectorSearchResult[],
    options: RerankingOptions = {}
  ): Promise<RerankingResult> {
    const {
      topK = 10,
      batchSize = 10,
      useRLHFSignals = false,
      organization,
      division,
      app_under_test,
    } = options;

    const startTime = performance.now();

    // Store original rankings
    const documentsWithRank = documents.map((doc, index) => ({
      ...doc,
      originalRank: index + 1,
      originalSimilarity: doc.similarity,
    }));

    // Process in batches
    const rankedDocuments: RankedDocument[] = [];
    
    for (let i = 0; i < documentsWithRank.length; i += batchSize) {
      const batch = documentsWithRank.slice(i, i + batchSize);
      const batchResults = await this.rerankBatch(query, batch);
      rankedDocuments.push(...batchResults);
    }

    // Apply RLHF boosts if enabled
    let finalDocuments = rankedDocuments;
    if (useRLHFSignals && organization && division && app_under_test) {
      finalDocuments = await this.applyRLHFBoosts(
        query,
        rankedDocuments,
        organization,
        division,
        app_under_test
      );
    }

    // Sort by final score and take top K
    finalDocuments.sort((a, b) => {
      const scoreA = a.rerankScore * (1.0 + (a.rlhfBoost || 0));
      const scoreB = b.rerankScore * (1.0 + (b.rlhfBoost || 0));
      return scoreB - scoreA;
    });

    const topDocuments = finalDocuments.slice(0, topK);

    // Calculate metrics
    const rankChanges = topDocuments.filter(
      (doc, idx) => doc.originalRank !== idx + 1
    ).length;

    const avgRerankScore = 
      topDocuments.reduce((sum, doc) => sum + doc.rerankScore, 0) / topDocuments.length;

    const processingTimeMs = performance.now() - startTime;

    return {
      documents: topDocuments,
      metrics: {
        totalCandidates: documents.length,
        rerankedCount: finalDocuments.length,
        avgRerankScore,
        rankChanges,
        processingTimeMs,
      },
    };
  }

  /**
   * Re-rank a batch of documents
   */
  private async rerankBatch(
    query: string,
    documents: Array<VectorSearchResult & { originalRank: number; originalSimilarity: number }>
  ): Promise<RankedDocument[]> {
    try {
      // Build the prompt
      const prompt = this.buildRerankingPrompt(query, documents);
      
      // Call Gemini
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const scores = this.parseRerankingResponse(text, documents.length);
      
      // Combine scores with documents
      return documents.map((doc, idx) => ({
        ...doc,
        rerankScore: scores[idx]?.relevance_score / 100 || 0, // Normalize to 0-1
        rerankReasoning: scores[idx]?.reasoningText,
      }));
    } catch (error) {
      console.error("Error re-ranking batch:", error);
      // Fallback: use original similarity scores
      return documents.map(doc => ({
        ...doc,
        rerankScore: doc.originalSimilarity,
        rerankReasoning: "Fallback: using original similarity",
      }));
    }
  }

  /**
   * Build re-ranking prompt for Gemini
   */
  private buildRerankingPrompt(
    query: string,
    documents: VectorSearchResult[]
  ): string {
    const docsText = documents
      .map((doc, idx) => {
        const preview = doc.content.substring(0, 300); // Truncate for token limits
        return `${idx + 1}. [Source: ${doc.source_type}] ${preview}...`;
      })
      .join("\n\n");

    return `You are a relevance scoring system for a knowledge base retrieval system. Rate how relevant each document is to the user's query.

Query: "${query}"

Documents:
${docsText}

Instructions:
- Evaluate each document's relevance to the query
- Score on a scale of 0-100 (0 = completely irrelevant, 100 = perfectly relevant)
- Consider: semantic relevance, specificity, completeness, and recency
- Provide brief reasoning for each score

Respond with ONLY valid JSON in this exact format:
[
  {"doc_id": 1, "relevance_score": 85, "reasoning": "Direct answer to query"},
  {"doc_id": 2, "relevance_score": 72, "reasoning": "Partially relevant"}
]`;
  }

  /**
   * Parse Gemini's re-ranking response
   */
  private parseRerankingResponse(
    responseText: string,
    expectedCount: number
  ): Array<{ doc_id: number; relevance_score: number; reasoningText: string }> {
    try {
      // Extract JSON from markdown code blocks if present
      let jsonText = responseText.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      }
      
      const parsed = JSON.parse(jsonText);
      
      if (!Array.isArray(parsed)) {
        throw new Error("Response is not an array");
      }
      
      // Validate and return
      return parsed.slice(0, expectedCount);
    } catch (error) {
      console.error("Error parsing re-ranking response:", error);
      // Return default scores
      return Array(expectedCount)
        .fill(null)
        .map((_, idx) => ({
          doc_id: idx + 1,
          relevance_score: 50,
          reasoningText: "Parse error - using default score",
        }));
    }
  }

  /**
   * Apply RLHF boosts based on historical feedback
   */
  private async applyRLHFBoosts(
    query: string,
    documents: RankedDocument[],
    organization: string,
    division: string,
    app_under_test: string
  ): Promise<RankedDocument[]> {
    try {
      // Generate embedding for query (using Gemini)
      const { getGeminiEmbeddingService } = await import("./geminiEmbeddingService");
      const embeddingService = getGeminiEmbeddingService();
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      // Find similar past feedback
      const { data: similarFeedback, error } = await supabase.rpc(
        "find_similar_feedback",
        {
          query_embedding: queryEmbedding,
          p_organization: organization,
          p_division: division,
          p_app_under_test: app_under_test,
          match_threshold: 0.85,
          match_count: 5,
        }
      );

      if (error || !similarFeedback || similarFeedback.length === 0) {
        return documents; // No feedback found, return unchanged
      }

      // Calculate boosts for each document
      return documents.map(doc => {
        const boost = this.calculateDocBoost(doc, similarFeedback);
        return {
          ...doc,
          rlhfBoost: boost,
        };
      });
    } catch (error) {
      console.error("Error applying RLHF boosts:", error);
      return documents; // Return unchanged on error
    }
  }

  /**
   * Calculate RLHF boost for a document based on similar past feedback
   */
  private calculateDocBoost(
    doc: RankedDocument,
    similarFeedback: any[]
  ): number {
    let totalBoost = 0;
    let boostCount = 0;

    for (const feedback of similarFeedback) {
      // Check if this document ID appears in relevant docs
      if (feedback.relevant_doc_ids && feedback.relevant_doc_ids.includes(doc.id)) {
        const weight = feedback.similarity || 1.0; // Weight by query similarity
        totalBoost += 0.2 * weight; // +20% boost weighted by similarity
        boostCount++;
      }

      // Check if this document ID appears in irrelevant docs
      if (feedback.irrelevant_doc_ids && feedback.irrelevant_doc_ids.includes(doc.id)) {
        const weight = feedback.similarity || 1.0;
        totalBoost -= 0.15 * weight; // -15% penalty weighted by similarity
        boostCount++;
      }

      // Apply source type boosts from manual_boosts
      if (feedback.manual_boosts && feedback.manual_boosts[doc.source_type]) {
        const weight = feedback.similarity || 1.0;
        const manualBoost = feedback.manual_boosts[doc.source_type] - 1.0; // Convert 1.5 -> 0.5
        totalBoost += manualBoost * weight * 0.5; // 50% of manual boost, weighted
        boostCount++;
      }
    }

    // Average the boosts and clamp to reasonable range [-0.5, +0.5]
    const averageBoost = boostCount > 0 ? totalBoost / boostCount : 0;
    return Math.max(-0.5, Math.min(0.5, averageBoost));
  }
}

// Singleton instance
let geminiReranker: GeminiReranker | null = null;

export function getGeminiReranker(): GeminiReranker {
  if (!geminiReranker) {
    geminiReranker = new GeminiReranker();
  }
  return geminiReranker;
}

