/**
 * Vector Search Service for Knowledge API
 *
 * Calls Supabase RPC function match_siam_vectors_gemini for vector similarity search
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { VectorResult, SourceType, AppContext, DEFAULT_CONTEXT } from '../types';

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }

    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClient;
}

export interface SearchResult {
  results: VectorResult[];
  duration_ms: number;
}

/**
 * Search for similar vectors using Supabase RPC
 */
export async function searchVectors(
  embedding: number[],
  options: {
    context?: AppContext;
    sources?: SourceType[];
    limit?: number;
    threshold?: number;
  } = {}
): Promise<SearchResult> {
  const start = performance.now();

  const {
    context = {
      organization: 'sony-music',
      division: 'digital-operations',
      app_under_test: 'aoma',
    },
    sources,
    limit = 5,
    threshold = 0.3,
  } = options;

  const client = getSupabaseClient();

  // Log search parameters for debugging
  console.log(`🔍 Vector search: org=${context.organization}, div=${context.division}, app=${context.app_under_test}`);
  console.log(`   threshold=${threshold}, limit=${limit}, sources=${sources || 'all'}`);
  console.log(`   embedding length=${embedding.length}`);

  const { data, error } = await client.rpc('match_siam_vectors_gemini', {
    p_organization: context.organization,
    p_division: context.division,
    p_app_under_test: context.app_under_test,
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit,
    filter_source_types: sources || null,
  });

  if (error) {
    console.error('Vector search error:', error);
    throw new Error(`Vector search failed: ${error.message}`);
  }

  console.log(`📊 Results: ${(data || []).length} matches`);

  const results: VectorResult[] = (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    content: row.content as string,
    source_type: row.source_type as SourceType,
    source_id: row.source_id as string,
    similarity: row.similarity as number,
    metadata: (row.metadata as Record<string, unknown>) || {},
  }));

  return {
    results,
    duration_ms: Math.round(performance.now() - start),
  };
}
