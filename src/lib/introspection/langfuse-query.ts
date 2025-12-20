/**
 * Langfuse Query Service
 *
 * Provides read-only access to Langfuse traces for introspection.
 * Implements caching to avoid hammering the Langfuse API.
 *
 * @see https://langfuse.com/docs/api-and-data-platform/features/query-via-sdk
 */

import { LangfuseClient } from "@langfuse/client";

// Singleton instance
let queryClientInstance: LangfuseClient | null = null;

// Simple in-memory cache with 30-second TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * Get or create the Langfuse query client instance
 */
function getQueryClient(): LangfuseClient {
  if (!queryClientInstance) {
    const secretKey = process.env.LANGFUSE_SECRET_KEY;
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
    const baseUrl = process.env.LANGFUSE_BASEURL;

    if (!secretKey || !publicKey) {
      throw new Error("[Langfuse Query] Missing credentials");
    }

    queryClientInstance = new LangfuseClient({
      secretKey,
      publicKey,
      baseUrl: baseUrl || "https://us.cloud.langfuse.com",
    });

    console.log("[Langfuse Query] Client initialized successfully");
  }

  return queryClientInstance;
}

/**
 * Get data from cache if not expired
 */
function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Store data in cache
 */
function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Fetch recent traces with caching
 */
export async function getRecentTraces(
  limit: number = 50
): Promise<any[] | null> {
  try {
    const cacheKey = `traces:${limit}`;
    const cached = getFromCache<any[]>(cacheKey);
    if (cached) {
      console.log("[Langfuse Query] Returning cached traces");
      return cached;
    }

    const client = getQueryClient();
    const response = await client.api.trace.list({
      limit,
    });

    const traces = response.data || [];
    setCache(cacheKey, traces);

    console.log(`[Langfuse Query] Fetched ${traces.length} traces`);
    return traces;
  } catch (error) {
    const err = error as Error;
    console.error("[Langfuse Query] Failed to fetch traces:", {
      message: err.message,
      name: err.name,
      stack: err.stack?.split("\n").slice(0, 3).join("\n"),
    });
    return null;
  }
}

/**
 * Fetch a single trace by ID with observations
 */
export async function getTrace(traceId: string): Promise<any | null> {
  try {
    const cacheKey = `trace:${traceId}`;
    const cached = getFromCache<any>(cacheKey);
    if (cached) {
      console.log(`[Langfuse Query] Returning cached trace ${traceId}`);
      return cached;
    }

    const client = getQueryClient();
    const trace = await client.api.trace.get(traceId);

    if (!trace) {
      console.warn(`[Langfuse Query] Trace ${traceId} not found`);
      return null;
    }

    setCache(cacheKey, trace);
    console.log(`[Langfuse Query] Fetched trace ${traceId}`);
    return trace;
  } catch (error) {
    console.error(`[Langfuse Query] Failed to fetch trace ${traceId}:`, error);
    return null;
  }
}

/**
 * Fetch observations for a specific trace
 */
export async function getTraceObservations(
  traceId: string,
  type?: "GENERATION" | "SPAN" | "EVENT"
): Promise<any[] | null> {
  try {
    const cacheKey = `observations:${traceId}:${type || "all"}`;
    const cached = getFromCache<any[]>(cacheKey);
    if (cached) {
      console.log(`[Langfuse Query] Returning cached observations for ${traceId}`);
      return cached;
    }

    const client = getQueryClient();
    const response = await client.api.observationsV2.getMany({
      traceId,
      type,
      limit: 100,
      fields: "core,basic,usage",
    });

    const observations = response.data || [];
    setCache(cacheKey, observations);

    console.log(`[Langfuse Query] Fetched ${observations.length} observations for trace ${traceId}`);
    return observations;
  } catch (error) {
    console.error(`[Langfuse Query] Failed to fetch observations for ${traceId}:`, error);
    return null;
  }
}

/**
 * Check if Langfuse is available and configured
 */
export function isLangfuseAvailable(): boolean {
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  return !!(secretKey && publicKey);
}

/**
 * Clear the cache (useful for testing or manual refresh)
 */
export function clearCache(): void {
  cache.clear();
  console.log("[Langfuse Query] Cache cleared");
}
