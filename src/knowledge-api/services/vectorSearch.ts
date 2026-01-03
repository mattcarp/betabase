/**
 * Vector Search Service for Knowledge API
 *
 * Multi-source search:
 * - siam_vectors: Gemini embeddings (768d) for git, jira, metrics
 * - wiki_documents: Text search fallback (embeddings stored as TEXT, not vector)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
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

export interface EnrichedVectorResult extends VectorResult {
  expandable?: boolean; // If true, more detail available via /detail endpoint
}

export interface SearchResult {
  results: EnrichedVectorResult[];
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
  console.log(
    `Vector search: org=${context.organization}, div=${context.division}, app=${context.app_under_test}`
  );
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

  console.log(`Results: ${(data || []).length} matches`);

  const results: EnrichedVectorResult[] = (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    content: row.content as string,
    source_type: row.source_type as SourceType,
    source_id: row.source_id as string,
    similarity: row.similarity as number,
    metadata: (row.metadata as Record<string, unknown>) || {},
    expandable: row.source_type === 'jira', // Jira tickets have full detail available
  }));

  return {
    results,
    duration_ms: Math.round(performance.now() - start),
  };
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
  const allResults: EnrichedVectorResult[] = [];

  // Run searches in parallel
  const searchPromises: Promise<void>[] = [];

  // 1. Search siam_vectors with Gemini embedding
  // NOTE: For documentation questions, wiki should be PRIMARY. Jira/git are supporting evidence.
  searchPromises.push(
    client
      .rpc('match_siam_vectors_gemini', {
        p_organization: context.organization,
        p_division: context.division,
        p_app_under_test: context.app_under_test,
        query_embedding: geminiEmbedding,
        match_threshold: threshold,
        match_count: limit,
        filter_source_types: sources || null,
      })
      .then(({ data, error }) => {
        if (error) {
          console.error('siam_vectors search error:', error);
          return;
        }

        const results = (data || []).map((row: Record<string, unknown>) => {
          const sourceType = row.source_type as SourceType;
          let similarity = row.similarity as number;

          // Deprioritize Jira tickets - they're supporting evidence, not primary answers
          // Jira titles are too short to be useful as main content
          if (sourceType === 'jira') {
            similarity = similarity * 0.6; // Reduce Jira ranking
          }

          return {
            id: row.id as string,
            content: row.content as string,
            source_type: sourceType,
            source_id: row.source_id as string,
            similarity,
            metadata: (row.metadata as Record<string, unknown>) || {},
            expandable: sourceType === 'jira', // Jira has full details via /detail endpoint
          };
        });
        console.log(`   siam_vectors: ${results.length} matches`);
        allResults.push(...results);
      })
  );

  // 2. Search wiki_documents - use text search as fallback since embeddings are stored as TEXT
  // NOTE: Vector search returns 0 results because wiki_documents.embedding is TEXT not vector(1536)
  // Until migrated, we use keyword-based text search as a workaround
  // Only search wiki if no source filter or 'wiki' is in the filter
  const shouldSearchWiki = !sources || sources.includes('wiki');
  if (shouldSearchWiki) {
    searchPromises.push(
      (async () => {
      // Extract key terms from query for text search
      const searchTerms = query
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(
          (term) =>
            term.length > 2 &&
            !['what', 'how', 'the', 'is', 'are', 'can', 'does', 'for', 'and', 'with'].includes(term)
        );

      if (searchTerms.length === 0) {
        searchTerms.push('aoma'); // Default to AOMA if no terms
      }

      // Build OR query for text search
      const orConditions = searchTerms.map((term) => `markdown_content.ilike.%${term}%`).join(',');

      const { data, error } = await client
        .from('wiki_documents')
        .select('id, title, markdown_content, url, app_name')
        .eq('app_name', 'AOMA')
        .or(orConditions)
        .limit(limit * 2); // Fetch extra to account for filtering

      if (error) {
        console.error('wiki_documents text search error:', error);
        return;
      }

      // Filter out index/navigation pages (contain "Recently Updated" lists)
      const contentPages = (data || []).filter((row: Record<string, unknown>) => {
        const content = (row.markdown_content as string) || '';
        // Exclude pages that are just navigation/index pages
        return !content.includes('Recently Updated') && !content.includes('• created by');
      });

      // Score results by term frequency (rough relevance)
      const results = contentPages.slice(0, limit).map((row: Record<string, unknown>) => {
        const content = ((row.markdown_content as string) || '').toLowerCase();
        let matchCount = 0;
        searchTerms.forEach((term) => {
          const regex = new RegExp(term, 'gi');
          matchCount += (content.match(regex) || []).length;
        });
        // Normalize to 0-1 range (rough approximation)
        const similarity = Math.min(0.9, 0.3 + matchCount * 0.05);

        return {
          id: row.id as string,
          content: row.markdown_content as string,
          source_type: 'wiki' as SourceType,
          source_id: row.url as string,
          similarity,
          metadata: {
            title: row.title,
            app_name: row.app_name,
            url: row.url,
          },
          expandable: false, // Wiki returns full content already
        };
      });

      console.log(
        `   wiki_documents (text search): ${results.length} matches for terms [${searchTerms.join(', ')}]`
      );
      allResults.push(...results);
      })()
    );
  }

  await Promise.all(searchPromises);

  // Sort by similarity (highest first) and limit
  allResults.sort((a, b) => b.similarity - a.similarity);
  const finalResults = allResults.slice(0, limit);

  console.log(`Multi-source total: ${allResults.length} matches, returning top ${finalResults.length}`);
  if (finalResults.length > 0) {
    console.log(`   Best: ${(finalResults[0].similarity * 100).toFixed(1)}% from ${finalResults[0].source_type}`);
  }

  return {
    results: finalResults,
    duration_ms: Math.round(performance.now() - start),
  };
}
