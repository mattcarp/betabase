/**
 * Gemini Structured Reranker Service
 * 
 * Uses AI SDK v6's generateObject() with Zod schemas for reliable
 * structured output - NO manual JSON parsing, NO silent failures.
 * 
 * This replaces the fragile geminiReranker.ts that used string-based
 * JSON extraction which failed silently (assigning score 50 to all docs).
 * 
 * Part of RAG Overhaul - Option C (Google-only, no Cohere)
 */

import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { VectorSearchResult, supabase } from "../lib/supabase";

// Zod schema for reranking response - guaranteed valid output
const RerankResultSchema = z.array(
  z.object({
    docIndex: z.number().describe("1-based index of the document"),
    relevanceScore: z.number().min(0).max(100).describe("Relevance score 0-100"),
    reasoning: z.string().describe("Brief explanation of the score"),
  })
);

type RerankResult = z.infer<typeof RerankResultSchema>;

export interface RankedDocument extends VectorSearchResult {
  rerankScore: number;
  rerankReasoning?: string;
  originalRank: number;
  originalSimilarity: number;
  rlhfBoost?: number;
  sourceTypeBoost?: number;
}

export interface RerankingOptions {
  topK?: number;
  useRLHFSignals?: boolean;
  organization?: string;
  division?: string;
  app_under_test?: string;
  useSourceTypeBoost?: boolean;
  maxContentLength?: number; // Truncate doc content for token limits
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

/**
 * Gemini Structured Reranker using AI SDK v6
 * 
 * Key improvements over old geminiReranker.ts:
 * 1. Uses generateObject() with Zod - guaranteed valid JSON
 * 2. No manual JSON parsing - no silent failures
 * 3. Uses AI SDK v6's native Google provider
 * 4. Graceful fallback to vector similarity (not score 50)
 */
export class GeminiStructuredReranker {
  
  /**
   * Re-rank documents using Gemini with structured output
   */
  async rerankDocuments(
    query: string,
    documents: VectorSearchResult[],
    options: RerankingOptions = {}
  ): Promise<RerankingResult> {
    const {
      topK = 10,
      useRLHFSignals = false,
      useSourceTypeBoost = false, // Disabled by default - let reranker decide
      organization,
      division,
      app_under_test,
      maxContentLength = 400,
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

    console.log(`🎯 Gemini Structured Reranker: Processing ${documents.length} documents...`);

    try {
      // Format documents for the prompt
      const docsText = documentsWithRank
        .map((doc, idx) => {
          const truncatedContent = doc.content.length > maxContentLength
            ? doc.content.substring(0, maxContentLength) + "..."
            : doc.content;
          return `[Document ${idx + 1}] (Source: ${doc.source_type})\n${truncatedContent}`;
        })
        .join("\n\n---\n\n");

      // Call Gemini with structured output
      const { object: rankings } = await generateObject({
        model: google("gemini-2.0-flash"),
        schema: RerankResultSchema,
        prompt: `You are a relevance scoring system for a knowledge base. Rate how well each document answers the user's query.

QUERY: "${query}"

DOCUMENTS:
${docsText}

SCORING GUIDELINES:
- 90-100: Directly and completely answers the query with specific, accurate information
- 70-89: Highly relevant, contains useful information that addresses the query
- 50-69: Somewhat relevant, tangentially related or partially addresses the query
- 30-49: Low relevance, only loosely connected to the query
- 0-29: Not relevant to the query

IMPORTANT: Score based on actual relevance to the query, not on document source type.

Score ALL ${documents.length} documents.`,
      });

      console.log(`✅ Gemini returned ${rankings.length} structured rankings`);

      // Map rankings to documents
      let rankedDocuments: RankedDocument[] = rankings
        .filter(r => r.docIndex >= 1 && r.docIndex <= documents.length)
        .map(r => ({
          ...documentsWithRank[r.docIndex - 1],
          rerankScore: r.relevanceScore / 100, // Normalize to 0-1
          rerankReasoning: r.reasoning,
        }));

      // Handle any missing documents (shouldn't happen with structured output)
      const rankedIds = new Set(rankedDocuments.map(d => d.id));
      const missingDocs = documentsWithRank.filter(d => !rankedIds.has(d.id));
      if (missingDocs.length > 0) {
        console.warn(`⚠️ ${missingDocs.length} documents missing from rankings, using similarity`);
        rankedDocuments.push(...missingDocs.map(doc => ({
          ...doc,
          rerankScore: doc.originalSimilarity,
          rerankReasoning: "Not ranked by model - using vector similarity",
        })));
      }

      // Apply RLHF boosts if enabled
      if (useRLHFSignals && organization && division && app_under_test) {
        rankedDocuments = await this.applyRLHFBoosts(
          rankedDocuments,
          organization,
          division,
          app_under_test
        );
      }

      // Apply source type boosts if enabled (disabled by default)
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

      console.log(`⏱️  Gemini rerank completed in ${processingTimeMs.toFixed(0)}ms`);
      console.log(`📊 Avg score: ${(avgRerankScore * 100).toFixed(1)}%, Rank changes: ${rankChanges}`);

      return {
        documents: topDocuments,
        metrics: {
          totalCandidates: documents.length,
          rerankedCount: rankings.length,
          avgRerankScore,
          rankChanges,
          processingTimeMs,
        },
      };

    } catch (error) {
      console.error("❌ Gemini structured rerank failed:", error);

      // GRACEFUL FALLBACK: Use original similarity scores
      // This is MUCH better than the old approach of assigning 50 to all docs
      console.log("⚠️ Falling back to vector similarity ranking");

      const fallbackDocs = documentsWithRank
        .map(doc => ({
          ...doc,
          rerankScore: doc.originalSimilarity,
          rerankReasoning: "Fallback: using original vector similarity",
        }))
        .sort((a, b) => b.rerankScore - a.rerankScore)
        .slice(0, topK);

      return {
        documents: fallbackDocs,
        metrics: {
          totalCandidates: documents.length,
          rerankedCount: documents.length,
          avgRerankScore: fallbackDocs.reduce((sum, doc) => sum + doc.rerankScore, 0) / fallbackDocs.length,
          rankChanges: 0,
          processingTimeMs: performance.now() - startTime,
        },
      };
    }
  }

  /**
   * Apply source type boosts - REDUCED because reranker should be authoritative
   */
  private applySourceTypeBoosts(documents: RankedDocument[]): RankedDocument[] {
    // Minimal boosts - the reranker's judgment should dominate
    const SOURCE_TYPE_BOOSTS: Record<string, number> = {
      knowledge: 0.05, // +5% for knowledge base docs
      pdf: 0.03,       // +3% for uploaded PDFs
      firecrawl: 0.02, // +2% for crawled content
      git: 0.01,       // +1% for git/code context
      jira: 0.0,       // No boost for JIRA tickets
    };

    return documents.map(doc => ({
      ...doc,
      sourceTypeBoost: SOURCE_TYPE_BOOSTS[doc.source_type] ?? 0,
    }));
  }

  /**
   * Apply RLHF boosts based on historical curator feedback
   */
  private async applyRLHFBoosts(
    documents: RankedDocument[],
    organization: string,
    division: string,
    app_under_test: string
  ): Promise<RankedDocument[]> {
    try {
      const { data: positiveFeedback, error } = await (supabase!)
        .from("rlhf_feedback")
        .select("retrieved_contexts, feedback_type, feedback_value")
        .or("feedback_type.eq.thumbs_up,feedback_value->>score.gte.4")
        .not("retrieved_contexts", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error || !positiveFeedback || positiveFeedback.length === 0) {
        return documents;
      }

      // Build document boost map
      const docBoostMap = new Map<string, { count: number; avgRating: number }>();

      for (const feedback of positiveFeedback) {
        const markedDocs = feedback.retrieved_contexts || [];
        const rating = feedback.feedback_value?.score || (feedback.feedback_type === "thumbs_up" ? 5 : 3);

        for (const markedDoc of markedDocs) {
          const docId = markedDoc.doc_id || markedDoc.id;
          if (docId) {
            const existing = docBoostMap.get(docId) || { count: 0, avgRating: 0 };
            existing.count++;
            existing.avgRating = (existing.avgRating * (existing.count - 1) + rating) / existing.count;
            docBoostMap.set(docId, existing);
          }
        }
      }

      if (docBoostMap.size > 0) {
        console.log(`📊 RLHF: Found ${docBoostMap.size} curator-approved documents`);
      }

      // Apply boosts
      return documents.map(doc => {
        const boostData = docBoostMap.get(doc.id);
        if (!boostData) {
          return { ...doc, rlhfBoost: 0 };
        }

        // Calculate boost
        let boost = 0.05; // Base 5% for any approval
        boost += Math.min(boostData.count * 0.02, 0.06); // +2% per approval, max +6%
        if (boostData.avgRating >= 4.5) {
          boost += 0.04; // +4% for highly rated
        }

        // Cap at 15%
        boost = Math.min(boost, 0.15);

        return { ...doc, rlhfBoost: boost };
      });
    } catch (error) {
      console.error("Error applying RLHF boosts:", error);
      return documents;
    }
  }
}

// Singleton instance
let geminiStructuredReranker: GeminiStructuredReranker | null = null;

export function getGeminiStructuredReranker(): GeminiStructuredReranker {
  if (!geminiStructuredReranker) {
    geminiStructuredReranker = new GeminiStructuredReranker();
  }
  return geminiStructuredReranker;
}

// Alias for drop-in replacement
export const getReranker = getGeminiStructuredReranker;
