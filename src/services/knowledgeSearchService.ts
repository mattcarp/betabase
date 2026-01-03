/**
 * SIAM Knowledge Search Service
 * Centralized interface for vector and keyword search across knowledge sources.
 * 
 * CRITICAL DISTINCTION:
 * - SIAM = Our app (this testing/knowledge platform)
 * - AOMA = App Under Test (Sony Music's Digital Operations app)
 *
 * References:
 * - lib/supabase.ts
 * - src/services/unified-test-intelligence.ts
 */

import { supabase, DEFAULT_APP_CONTEXT } from "../lib/supabase";
import { OptimizedSupabaseVectorService } from "./optimizedSupabaseVectorService";

// Server-only AI SDK - DO NOT use type annotations that reference the modules!
// TypeScript `typeof import()` causes webpack to bundle the module even for dynamic imports
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _embedModule: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _googleModule: any = null;

// Check if we're on the server
const isServer = typeof window === "undefined";

async function getGoogleEmbed(): Promise<{ google: any; embed: any } | null> {
  if (!isServer) {
    return null;
  }

  try {
    if (!_embedModule) {
      _embedModule = await import("ai");
    }
    if (!_googleModule) {
      _googleModule = await import("@ai-sdk/google");
    }
    return { google: _googleModule.google, embed: _embedModule.embed };
  } catch (err) {
    console.warn("[KnowledgeSearch] Failed to load AI SDK:", err);
    return null;
  }
}

export type KnowledgeSourceType =
  | "git"
  | "confluence"
  | "jira"
  | "firecrawl"
  | "knowledge"
  | "email"
  | "metrics"
  | "openai_import"
  | "cache";

export interface KnowledgeSearchOptions {
  sourceTypes?: KnowledgeSourceType[];
  matchThreshold?: number; // 0..1
  matchCount?: number; // top-K
  timeoutMs?: number;
}

export interface KnowledgeSearchResultItem {
  id?: string;
  content: string;
  source_type?: KnowledgeSourceType | string;
  source_id?: string;
  metadata?: Record<string, any>;
  similarity?: number;
  created_at?: string;
  url?: string; // best-effort extraction from metadata
}

export interface KnowledgeSearchResponse {
  query: string;
  usedEmbedding: boolean;
  durationMs: number;
  results: KnowledgeSearchResultItem[];
  stats: {
    count: number;
    sourcesCovered: string[];
  };
}

// Simple in-memory cache for demo scenarios
interface CacheEntry {
  ts: number;
  data: KnowledgeSearchResponse;
}
const QUERY_CACHE = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

function makeCacheKey(query: string, options?: KnowledgeSearchOptions) {
  return JSON.stringify({ q: preprocessQuery(query), o: options || {} });
}

export function preprocessQuery(query: string): string {
  return query
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars
    .slice(0, 2000); // safety cap
}

async function getQueryEmbedding(query: string): Promise<number[] | null> {
  try {
    // CRITICAL: Use Gemini embeddings (768d) to match the documents!
    // Documents are embedded with text-embedding-004 (768 dimensions)
    // Using OpenAI (1536d) creates dimension mismatch → poor similarity scores
    const sdk = await getGoogleEmbed();
    if (!sdk) {
      console.warn("[Knowledge] AI SDK not available in browser, falling back to keyword search");
      return null;
    }
    const model = sdk.google.textEmbeddingModel("text-embedding-004");
    const { embedding } = await sdk.embed({ model, value: query });
    console.log(`[Knowledge] Generated Gemini query embedding (${embedding.length}d)`);
    return embedding;
  } catch (err) {
    console.warn("Embedding generation failed, falling back to keyword search:", err);
    return null;
  }
}

function withinTimeout<T>(promise: Promise<T>, timeoutMs = 3000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Search timed out")), timeoutMs);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

export async function searchKnowledge(
  query: string,
  options?: KnowledgeSearchOptions
): Promise<KnowledgeSearchResponse> {
  const startedAt = Date.now();
  const normalized = preprocessQuery(query);
  const cacheKey = makeCacheKey(normalized, options);
  const cached = QUERY_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < DEFAULT_TTL_MS) {
    return cached.data;
  }

  const matchThreshold = options?.matchThreshold ?? 0.50;
  const matchCount = options?.matchCount ?? 10;
  const timeoutMs = options?.timeoutMs ?? 3000;
  const filterSources = options?.sourceTypes;

  let results: KnowledgeSearchResultItem[] = [];
  let usedEmbedding = false;

  try {
    const embedding = await getQueryEmbedding(normalized);
    if (embedding) {
      usedEmbedding = true;
      const vectorService = new OptimizedSupabaseVectorService();
      const data = await withinTimeout(
        vectorService.smartSearch(normalized, {
          ...DEFAULT_APP_CONTEXT,
          matchThreshold,
          matchCount,
          sourceTypes: filterSources as any,
        }),
        timeoutMs
      );
      results = (data || []).map((row: any) => ({
        id: row.id,
        content: row.content,
        source_type: row.source_type,
        source_id: row.source_id,
        metadata: row.metadata,
        similarity: row.similarity ?? row.score ?? undefined,
        created_at: row.created_at,
        url: row.metadata?.url || row.metadata?.link || undefined,
      }));
    } else {
      // Fallback keyword search by content/title if embeddings are unavailable
      if (!supabase) throw new Error("Supabase client not initialized");
      const { data, error } = (await withinTimeout(
        supabase
          .from("siam_vectors")
          .select("id, content, source_type, source_id, metadata, created_at")
          .eq("organization", DEFAULT_APP_CONTEXT.organization)
          .eq("division", DEFAULT_APP_CONTEXT.division)
          .eq("app_under_test", DEFAULT_APP_CONTEXT.app_under_test)
          .ilike("content", `%${normalized}%`)
          .limit(matchCount) as unknown as Promise<any>,
        timeoutMs
      )) as any;
      if (error) throw error;
      results = (data || []).map((row: any) => ({
        id: row.id,
        content: row.content,
        source_type: row.source_type,
        source_id: row.source_id,
        metadata: row.metadata,
        created_at: row.created_at,
        url: row.metadata?.url || row.metadata?.link || undefined,
      }));
    }
  } catch (err) {
    console.error("Knowledge search failed:", err);
    results = [];
  }

  const durationMs = Date.now() - startedAt;
  const sourcesCovered = Array.from(
    new Set(results.map((r) => String(r.source_type || "unknown")))
  );
  const response: KnowledgeSearchResponse = {
    query: normalized,
    usedEmbedding,
    durationMs,
    results,
    stats: { count: results.length, sourcesCovered },
  };

  QUERY_CACHE.set(cacheKey, { ts: Date.now(), data: response });
  return response;
}

export async function batchSearch(
  queries: string[],
  options?: KnowledgeSearchOptions
): Promise<KnowledgeSearchResponse[]> {
  const tasks = queries.map((q) => searchKnowledge(q, options));
  return Promise.all(tasks);
}

export function getQuerySuggestions(prefix?: string): string[] {
  const base = [
    "Show me the authentication flow in the codebase",
    "How does AOMA handle file uploads?",
    "Recent changes to the asset ingestion workflow",
    "Find the React components for user management",
    "Explain the USM integration workflow",
    "Common JIRA issues and their solutions",
  ];
  if (!prefix) return base;
  const p = prefix.toLowerCase();
  return base.filter((s) => s.toLowerCase().includes(p));
}

export interface KnowledgeCounts {
  [key: string]: number;
}

// Cache table availability to avoid repeated 404 errors in console
let tableAvailabilityCache: { available: boolean; checkedAt: number } | null = null;
const TABLE_CHECK_TTL = 5 * 60 * 1000; // Cache for 5 minutes

export async function getKnowledgeSourceCounts(): Promise<KnowledgeCounts> {
  // Counts by source_type for quick dashboard indicators
  if (!supabase) return {};

  const ZERO_COUNTS = {
    git: 0,
    confluence: 0,
    jira: 0,
    firecrawl: 0,
  };

  // Check cache first to avoid repeated 404 errors
  if (tableAvailabilityCache) {
    const age = Date.now() - tableAvailabilityCache.checkedAt;
    if (age < TABLE_CHECK_TTL) {
      if (!tableAvailabilityCache.available) {
        // Table is known to be unavailable - return zeros without querying
        return ZERO_COUNTS;
      }
    }
  }

  // First time or cache expired - check if table exists
  try {
    const { error: tableCheckError } = await supabase
      .from("siam_vectors")
      .select("id", { count: "exact", head: true })
      .eq("organization", DEFAULT_APP_CONTEXT.organization)
      .eq("division", DEFAULT_APP_CONTEXT.division)
      .eq("app_under_test", DEFAULT_APP_CONTEXT.app_under_test)
      .limit(0);

    if (tableCheckError) {
      // Table doesn't exist - cache this result to prevent future queries
      if (
        tableCheckError.message?.includes("404") ||
        tableCheckError.code === "PGRST204" ||
        tableCheckError.code === "PGRST116"
      ) {
        console.info(
          "[Knowledge] siam_vectors table not yet available, caching unavailable status"
        );
        tableAvailabilityCache = { available: false, checkedAt: Date.now() };
        return ZERO_COUNTS;
      }
    }

    // Table exists - cache this and proceed with counts
    tableAvailabilityCache = { available: true, checkedAt: Date.now() };
  } catch (err) {
    // Table check failed - cache unavailable status
    console.info(
      "[Knowledge] Unable to access siam_vectors table, caching unavailable status"
    );
    tableAvailabilityCache = { available: false, checkedAt: Date.now() };
    return ZERO_COUNTS;
  }

  const types: KnowledgeSourceType[] = ["git", "confluence", "jira", "firecrawl"];
  const counts: KnowledgeCounts = {};

  for (const t of types) {
    try {
      const { count, error } = await supabase
        .from("siam_vectors")
        .select("id", { count: "exact", head: true })
        .eq("organization", DEFAULT_APP_CONTEXT.organization)
        .eq("division", DEFAULT_APP_CONTEXT.division)
        .eq("app_under_test", DEFAULT_APP_CONTEXT.app_under_test)
        .eq("source_type", t);

      if (error) {
        console.warn(`[Knowledge] Could not fetch count for ${t}:`, error.message);
        counts[t] = 0;
      } else {
        counts[t] = count ?? 0;
      }
    } catch (err) {
      console.warn(`[Knowledge] Exception querying ${t}:`, err);
      counts[t] = 0;
    }
  }

  return counts;
}
