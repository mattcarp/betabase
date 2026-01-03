/**
 * Vector Search Service for Knowledge API
 *
 * Multi-source search:
 * - siam_vectors: Gemini embeddings (768d) for git, jira, metrics
 * - wiki_documents: OpenAI embeddings (1536d) for documentation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import type { VectorResult, SourceType, AppContext } from '../types';

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

/**
 * Generate OpenAI embedding for wiki_documents search
 */
async function generateOpenAIEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text,
  });
  return embedding;
}

/**
 * Multi-source search: queries both siam_vectors AND wiki_documents
 * Returns merged results sorted by similarity
 */
export async function searchMultiSource(
  geminiEmbedding: number[],
  query: string,
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
    limit = 10,
    threshold = 0.2,
  } = options;

  const client = getSupabaseClient();
  const allResults: VectorResult[] = [];

  // Generate OpenAI embedding for wiki_documents (1536d)
  const openaiStart = performance.now();
  let openaiEmbedding: number[] | null = null;
  try {
    openaiEmbedding = await generateOpenAIEmbedding(query);
    console.log(`   OpenAI embedding: ${Math.round(performance.now() - openaiStart)}ms`);
  } catch (err) {
    console.error('OpenAI embedding failed (wiki search disabled):', err);
  }

  // Run searches in parallel
  const searchPromises: Promise<void>[] = [];

  // 1. Search siam_vectors with Gemini embedding
  searchPromises.push(
    client.rpc('match_siam_vectors_gemini', {
      p_organization: context.organization,
      p_division: context.division,
      p_app_under_test: context.app_under_test,
      query_embedding: geminiEmbedding,
      match_threshold: threshold,
      match_count: limit,
      filter_source_types: sources || null,
    }).then(({ data, error }) => {
      if (error) {
        console.error('siam_vectors search error:', error);
        return;
      }
      const results = (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        content: row.content as string,
        source_type: row.source_type as SourceType,
        source_id: row.source_id as string,
        similarity: row.similarity as number,
        metadata: (row.metadata as Record<string, unknown>) || {},
      }));
      console.log(`   siam_vectors: ${results.length} matches`);
      allResults.push(...results);
    })
  );

  // 2. Search wiki_documents with OpenAI embedding (if available)
  if (openaiEmbedding) {
    searchPromises.push(
      client.rpc('match_wiki_documents', {
        query_embedding: openaiEmbedding,
        match_threshold: threshold,
        match_count: limit,
        app_name_filter: 'AOMA',
      }).then(({ data, error }) => {
        if (error) {
          console.error('wiki_documents search error:', error);
          return;
        }
        // Normalize wiki results to VectorResult shape
        const results = (data || []).map((row: Record<string, unknown>) => ({
          id: row.id as string,
          content: row.markdown_content as string,
          source_type: 'wiki' as SourceType,
          source_id: row.url as string,
          similarity: row.similarity as number,
          metadata: {
            title: row.title,
            app_name: row.app_name,
            url: row.url,
          },
        }));
        console.log(`   wiki_documents: ${results.length} matches`);
        allResults.push(...results);
      })
    );
  }

  await Promise.all(searchPromises);

  // Sort by similarity (highest first) and limit
  allResults.sort((a, b) => b.similarity - a.similarity);
  const finalResults = allResults.slice(0, limit);

  console.log(`📊 Multi-source total: ${allResults.length} matches, returning top ${finalResults.length}`);
  if (finalResults.length > 0) {
    console.log(`   Best: ${(finalResults[0].similarity * 100).toFixed(1)}% from ${finalResults[0].source_type}`);
  }

  return {
    results: finalResults,
    duration_ms: Math.round(performance.now() - start),
  };
}
