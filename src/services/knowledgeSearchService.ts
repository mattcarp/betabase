/**
 * Knowledge Search Service
 * Centralized interface for vector and keyword search across knowledge sources.
 *
 * References:
 * - lib/supabase.ts
 * - src/services/unified-test-intelligence.ts
 */

import { supabase } from "../../lib/supabase";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { OptimizedSupabaseVectorService } from "./optimizedSupabaseVectorService";

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
    // Use the OpenAI embedding model with 1536 dims to match DB
    const model = openai.embedding("text-embedding-3-small");
    const { embeddings } = await embed({ model, value: query });
    return embeddings[0].embedding;
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
  options?: KnowledgeSearchOptions,
): Promise<KnowledgeSearchResponse> {
  const startedAt = Date.now();
  const normalized = preprocessQuery(query);
  const cacheKey = makeCacheKey(normalized, options);
  const cached = QUERY_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < DEFAULT_TTL_MS) {
    return cached.data;
  }

  const matchThreshold = options?.matchThreshold ?? 0.78;
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
          matchThreshold,
          matchCount,
          sourceTypes: filterSources,
        }),
        timeoutMs,
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
      const { data, error } = await withinTimeout(
        supabase
          .from("aoma_unified_vectors")
          .select("id, content, source_type, source_id, metadata, created_at")
          .ilike("content", `%${normalized}%`)
          .limit(matchCount),
        timeoutMs,
      );
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
    new Set(results.map((r) => String(r.source_type || "unknown"))),
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
  options?: KnowledgeSearchOptions,
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
      .from("aoma_unified_vectors")
      .select("id", { count: "exact", head: true })
      .limit(0);

    if (tableCheckError) {
      // Table doesn't exist - cache this result to prevent future queries
      if (tableCheckError.message?.includes('404') || tableCheckError.code === 'PGRST204' || tableCheckError.code === 'PGRST116') {
        console.info('[Knowledge] aoma_unified_vectors table not yet available, caching unavailable status');
        tableAvailabilityCache = { available: false, checkedAt: Date.now() };
        return ZERO_COUNTS;
      }
    }

    // Table exists - cache this and proceed with counts
    tableAvailabilityCache = { available: true, checkedAt: Date.now() };

  } catch (err) {
    // Table check failed - cache unavailable status
    console.info('[Knowledge] Unable to access aoma_unified_vectors table, caching unavailable status');
    tableAvailabilityCache = { available: false, checkedAt: Date.now() };
    return ZERO_COUNTS;
  }

  const types: KnowledgeSourceType[] = [
    "git",
    "confluence",
    "jira",
    "firecrawl",
  ];
  const counts: KnowledgeCounts = {};

  for (const t of types) {
    try {
      const { count, error } = await supabase
        .from("aoma_unified_vectors")
        .select("id", { count: "exact", head: true })
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

