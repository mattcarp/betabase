import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors
let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

// Public client for browser
export const supabase = (() => {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      supabaseClient = createClient(url, key);
    }
  }
  return supabaseClient;
})();

// Service client for server-side operations (use carefully!)
export const supabaseAdmin = (() => {
  if (typeof window === 'undefined' && !supabaseAdminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      supabaseAdminClient = createClient(url, key);
    }
  }
  return supabaseAdminClient;
})();

// Types for our tables
export interface AomaUnifiedVector {
  id: string;
  content: string;
  embedding?: number[];
  source_type: 'knowledge' | 'jira' | 'git' | 'email' | 'metrics' | 'openai_import' | 'cache' | 'firecrawl' | 'confluence';
  source_id: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}
export interface FirecrawlAnalysis {
  id: string;
  url: string;
  page_title: string;
  ui_elements: Record<string, any>;
  selectors: Record<string, any>;
  navigation_paths: string[];
  testable_features: string[];
  user_flows: Record<string, any>;
  embedding?: number[];
  metadata: Record<string, any>;
  crawled_at: string;
  created_at: string;
  updated_at: string;
}

// Helper functions for vector operations
export async function searchVectors(
  queryEmbedding: number[],
  matchThreshold = 0.78,
  matchCount = 10,
  sourceTypes?: string[]
) {
  const client = supabase ?? supabaseAdmin;
  if (!client) throw new Error('Supabase client not initialized');
  const { data, error } = await client.rpc('match_aoma_vectors', {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
    filter_source_types: sourceTypes
  });

  if (error) throw error;
  return data;
}
export async function upsertVector(
  content: string,
  embedding: number[],
  sourceType: string,
  sourceId: string,
  metadata: Record<string, any> = {}
) {
  const client = supabase ?? supabaseAdmin;
  if (!client) throw new Error('Supabase client not initialized');
  const { data, error } = await client.rpc('upsert_aoma_vector', {
    p_content: content,
    p_embedding: embedding,
    p_source_type: sourceType,
    p_source_id: sourceId,
    p_metadata: metadata
  });

  if (error) throw error;
  return data;
}

// Sony Music specific helpers
export async function upsertSonyMusicJiraVector(
  content: string,
  embedding: number[],
  sourceId: string,
  metadata: Record<string, any> = {}
) {
  const enriched = { sony_music: true, ...metadata };
  return upsertVector(content, embedding, 'jira', sourceId, enriched);
}

export async function searchSonyMusicKnowledge(
  queryEmbedding: number[],
  matchThreshold = 0.78,
  matchCount = 20
) {
  // Restrict to Sony-relevant sources
  return searchVectors(queryEmbedding, matchThreshold, matchCount, ['jira', 'confluence', 'firecrawl']);
}

export async function getSonyMusicProjectContent(projectKey: string, limit = 50) {
  const client = supabase ?? supabaseAdmin;
  if (!client) throw new Error('Supabase client not initialized');
  const { data, error } = await client
    .from('aoma_unified_vectors')
    .select('*')
    .in('source_type', ['jira', 'confluence', 'firecrawl'])
    .contains('metadata', { project: projectKey })
    .limit(limit);
  if (error) throw error;
  return data as AomaUnifiedVector[];
}

export async function validateSonyMusicContent() {
  const client = supabase ?? supabaseAdmin;
  if (!client) throw new Error('Supabase client not initialized');
  const counts: Record<string, number> = {};
  for (const type of ['jira', 'confluence', 'firecrawl']) {
    const { count, error } = await client
      .from('aoma_unified_vectors')
      .select('*', { count: 'exact', head: true })
      .eq('source_type', type);
    if (error) throw error;
    counts[type] = count ?? 0;
  }
  return counts;
}

// Firecrawl-specific operations
export async function storeFirecrawlData(
  url: string,
  crawlData: any,
  embedding?: number[]
) {
  if (!supabase) {
    console.warn('Supabase client not initialized - skipping store');
    return null;
  }
  
  const { data, error } = await supabase
    .from('firecrawl_analysis')
    .upsert({
      url,
      page_title: crawlData.title || '',
      ui_elements: crawlData.elements || {},
      selectors: crawlData.selectors || {},
      navigation_paths: crawlData.navigationPaths || [],
      testable_features: crawlData.testableFeatures || [],
      user_flows: crawlData.userFlows || {},
      embedding,
      metadata: crawlData.metadata || {},
      crawled_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getFirecrawlAnalysis(url: string) {
  if (!supabase) {
    console.warn('Supabase client not initialized - skipping fetch');
    return null;
  }
  
  const { data, error } = await supabase
    .from('firecrawl_analysis')
    .select('*')
    .eq('url', url)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // Ignore not found errors
  return data;
}

export async function searchFirecrawlData(query: string, limit = 10) {
  const { data, error } = await supabase
    .from('firecrawl_analysis')
    .select('*')
    .textSearch('page_title', query)
    .limit(limit);

  if (error) throw error;
  return data;
}