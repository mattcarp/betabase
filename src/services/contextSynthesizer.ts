/**
 * Context Synthesizer Service
 *
 * Transforms raw vector search results into human-friendly context summaries.
 * Uses a fast LLM (Gemini Flash) for sub-second synthesis.
 *
 * The Problem:
 * - Vector search returns 10 raw documents (Jira tickets, KB articles, etc.)
 * - Raw concatenation creates a mess that confuses the final LLM
 * - Users get "17 Jira tickets" instead of a coherent answer
 *
 * The Solution:
 * - Pre-synthesize raw results into 2-3 key insights
 * - Prioritize what a human would actually want to know
 * - Pass clean, summarized context to the final LLM
 */

import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Use Gemini Flash for synthesis - fast and cheap
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

export interface VectorResult {
  content: string;
  source_type: string;
  source_id?: string;
  similarity?: number;
  metadata?: Record<string, unknown>;
}

export interface SynthesizedContext {
  summary: string;
  keyInsights: string[];
  sourceTypes: string[];
  hasJiraTickets: boolean;
  hasTechnicalDocs: boolean;
  synthesisTimeMs: number;
}

/**
 * Synthesize raw vector results into human-friendly context
 *
 * @param query - The user's original question
 * @param results - Raw vector search results
 * @returns Synthesized context ready for the final LLM
 */
export async function synthesizeContext(
  query: string,
  results: VectorResult[]
): Promise<SynthesizedContext> {
  const startTime = Date.now();

  // If no results, return empty context
  if (!results || results.length === 0) {
    return {
      summary: "No relevant information found in the knowledge base.",
      keyInsights: [],
      sourceTypes: [],
      hasJiraTickets: false,
      hasTechnicalDocs: false,
      synthesisTimeMs: Date.now() - startTime,
    };
  }

  // Categorize results
  const sourceTypes = [...new Set(results.map((r) => r.source_type))];
  const hasJiraTickets = sourceTypes.includes("jira");
  const hasTechnicalDocs =
    sourceTypes.includes("knowledge") || sourceTypes.includes("firecrawl");

  // Build context for synthesis - use more results and longer content for chunked docs
  // With proper chunking, each result is ~1800 chars so we can include more
  const topResults = results.slice(0, 8);
  const rawContext = topResults
    .map((r, i) => {
      const type = r.source_type.toUpperCase();
      // INCREASED: 800 chars per result to capture more detail from chunks
      const content = r.content.substring(0, 800);
      return `[${type} ${i + 1}]: ${content}`;
    })
    .join("\n\n");

  // Use Gemini Flash for fast synthesis
  try {
    const synthesisPrompt = `You are a context synthesizer for a Sony Music AI assistant.

USER QUESTION: "${query}"

RAW KNOWLEDGE BASE RESULTS:
${rawContext}

YOUR TASK:
1. Extract the 2-3 most relevant facts that DIRECTLY answer the user's question
2. Ignore noise (CSS classes, UI element descriptions, ticket metadata)
3. Focus on WHAT the user wants to know, not WHERE it came from
4. If there are Jira tickets, only mention them if they're directly relevant - don't list them

RESPOND IN THIS FORMAT:
SUMMARY: [1-2 sentences that directly answer the question]
KEY_INSIGHT_1: [Most important fact]
KEY_INSIGHT_2: [Second most important fact, if relevant]
KEY_INSIGHT_3: [Third fact, if relevant]

Be concise. Speak like a helpful colleague, not a search engine.`;

    const result = await generateText({
      model: google("gemini-2.0-flash"),
      prompt: synthesisPrompt,
      temperature: 0.3, // Low temperature for factual synthesis
    });

    // Parse the synthesis result
    const lines = result.text.split("\n").filter((l) => l.trim());
    const summaryLine = lines.find((l) => l.startsWith("SUMMARY:"));
    const summary = summaryLine?.replace("SUMMARY:", "").trim() || result.text;

    const keyInsights = lines
      .filter((l) => l.startsWith("KEY_INSIGHT_"))
      .map((l) => l.replace(/KEY_INSIGHT_\d+:\s*/, "").trim())
      .filter((l) => l.length > 0);

    return {
      summary,
      keyInsights,
      sourceTypes,
      hasJiraTickets,
      hasTechnicalDocs,
      synthesisTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error("Context synthesis failed:", error);

    // Fallback: Simple concatenation with truncation
    const fallbackSummary = topResults
      .slice(0, 2)
      .map((r) => r.content.substring(0, 200))
      .join(" ... ");

    return {
      summary: fallbackSummary,
      keyInsights: [],
      sourceTypes,
      hasJiraTickets,
      hasTechnicalDocs,
      synthesisTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Format synthesized context for the final LLM system prompt
 */
export function formatContextForPrompt(ctx: SynthesizedContext): string {
  let formatted = `**SYNTHESIZED KNOWLEDGE:**\n${ctx.summary}`;

  if (ctx.keyInsights.length > 0) {
    formatted += "\n\n**KEY FACTS:**";
    ctx.keyInsights.forEach((insight, i) => {
      formatted += `\n${i + 1}. ${insight}`;
    });
  }

  // Add source hints without dumping raw content
  if (ctx.sourceTypes.length > 0) {
    const sources = ctx.sourceTypes
      .map((t) => {
        switch (t) {
          case "jira":
            return "Jira tickets";
          case "knowledge":
            return "Knowledge base";
          case "firecrawl":
            return "AOMA documentation";
          case "git":
            return "Git history";
          case "email":
            return "Email archives";
          default:
            return t;
        }
      })
      .join(", ");
    formatted += `\n\n*Sources consulted: ${sources}*`;
  }

  return formatted;
}
