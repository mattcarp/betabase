/**
 * MC-HUD Query API Endpoint
 *
 * Fast, lightweight endpoint for MC-HUD to query context during meetings.
 * Optimized for speed (<500ms target) over completeness.
 *
 * @see /docs/SIAM_API_SPEC.md in mc-hud project
 */

import { NextRequest, NextResponse } from "next/server";
import { searchKnowledge } from "@/services/knowledgeSearchService";

// Simple in-memory cache for HUD queries (5 minute TTL)
const hudCache = new Map<string, { data: HudResponse; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

interface HudQueryRequest {
  trigger: string;
  trigger_type: "ticket" | "keyword" | "concept" | "person";
  context?: string;
  source: string;
  options?: {
    max_results?: number;
    include_related?: boolean;
  };
}

interface ContextHint {
  type: string;
  title: string;
  summary: string;
  status?: string;
  priority?: string;
  assignee?: string;
  source_id?: string;
  url?: string;
  updated_at?: string;
  relevance: number;
  relation?: string;
}

interface HudResponse {
  trigger: string;
  hints: ContextHint[];
  query_time_ms: number;
  cache_hit: boolean;
  message?: string;
}

// Extract a title from content (first line or first N chars)
function extractTitle(content: string): string {
  if (!content) return "Unknown";
  const firstLine = content.split("\n")[0].trim();
  if (firstLine.length > 100) {
    return firstLine.substring(0, 97) + "...";
  }
  return firstLine || content.substring(0, 100);
}

// Extract a summary from content (first 2-3 sentences)
function extractSummary(content: string): string {
  if (!content) return "";
  // Remove markdown formatting
  const clean = content.replace(/#+\s*/g, "").replace(/\*\*/g, "").replace(/\n+/g, " ").trim();

  // Get first 2-3 sentences
  const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
  return sentences.slice(0, 2).join(" ").substring(0, 300);
}

// Get cached response if available
function getCached(trigger: string): HudResponse | null {
  const entry = hudCache.get(trigger.toLowerCase());
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return { ...entry.data, cache_hit: true };
  }
  return null;
}

// Store response in cache
function setCache(trigger: string, data: HudResponse) {
  hudCache.set(trigger.toLowerCase(), { data, timestamp: Date.now() });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function GET() {
  return NextResponse.json({
    status: "ready",
    version: "1.0.0",
    description: "MC-HUD Query API - Real-time meeting context hints",
    usage: "POST with { trigger, trigger_type, context?, source, options? }",
  });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body: HudQueryRequest = await req.json();
    const { trigger, trigger_type, context, options } = body;

    // Validate required fields
    if (!trigger) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: "trigger is required" } },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = getCached(trigger);
    if (cached) {
      cached.query_time_ms = Date.now() - startTime;
      return NextResponse.json(cached);
    }

    const maxResults = options?.max_results ?? 3;

    // Build search query - combine trigger with context for better semantic search
    const searchQuery = context ? `${trigger} ${context}` : trigger;

    console.log(`[HUD] Querying for: "${trigger}" (${trigger_type})`);

    // Use the knowledge search service
    const searchResults = await searchKnowledge(searchQuery, {
      matchThreshold: 0.4, // Lower threshold for broader results
      matchCount: maxResults + 2, // Fetch a few extra to filter
      timeoutMs: 2000, // Fast timeout for HUD use case
    });

    // Transform results to HUD hints format
    const hints: ContextHint[] = searchResults.results.slice(0, maxResults).map((result) => {
      const hint: ContextHint = {
        type: result.source_type || "knowledge",
        title: extractTitle(result.content),
        summary: extractSummary(result.content),
        relevance: result.similarity || 0.5,
      };

      // Add metadata if available
      if (result.metadata) {
        if (result.metadata.status) hint.status = result.metadata.status;
        if (result.metadata.priority) hint.priority = result.metadata.priority;
        if (result.metadata.assignee) hint.assignee = result.metadata.assignee;
        if (result.metadata.url) hint.url = result.metadata.url;
        if (result.metadata.source_id) hint.source_id = result.metadata.source_id;
      }

      if (result.source_id) hint.source_id = result.source_id;
      if (result.updated_at) hint.updated_at = result.updated_at;

      return hint;
    });

    const response: HudResponse = {
      trigger,
      hints,
      query_time_ms: Date.now() - startTime,
      cache_hit: false,
    };

    if (hints.length === 0) {
      response.message = "No matching context found";
    }

    // Cache the response
    setCache(trigger, response);

    console.log(`[HUD] Returned ${hints.length} hints in ${response.query_time_ms}ms`);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[HUD] Query error:", error);

    const errorMessage = error instanceof Error ? error.message : "Query failed";

    // Check for timeout
    if (errorMessage.includes("timeout") || errorMessage.includes("Timeout")) {
      return NextResponse.json(
        {
          error: { code: "TIMEOUT", message: "Query took too long" },
          query_time_ms: Date.now() - startTime,
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: { code: "INTERNAL_ERROR", message: errorMessage },
        query_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
