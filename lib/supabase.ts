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

// Types for our ACTUAL tables (as they exist in Supabase)
export interface CrawlerDocument {
  id: string;
  app_id?: string;
  url: string;
  title: string;
  content?: string;
  metadata?: Record<string, any>;
  content_hash: string;
  embedding?: number[];
  created_at: string;
  updated_at: string;
  app_name?: string;
  markdown_content?: string;
  crawled_at?: string;
}

export interface WikiDocument {
  id: string;
  app_name: string;
  url: string;
  title?: string;
  markdown_content?: string;
  metadata?: Record<string, any>;
  content_hash?: string;
  crawled_at?: string;
  embedding?: number[];
}

export interface JiraTicket {
  id: string;
  external_id: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  embedding?: number[];
}

export interface JiraTicketEmbedding {
  id: number;
  ticket_key: string;
  summary?: string;
  embedding: number[];
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface FirecrawlAnalysis {
  id: string;
  url: string;
  app_name?: string;
  analysis_type?: string;
  testable_features?: Record<string, any>;
  user_flows?: Record<string, any>;
  api_endpoints?: string[];
  selectors?: Record<string, any>;
  accessibility_issues?: Record<string, any>;
  performance_metrics?: Record<string, any>;
  content_embedding?: number[];
  analyzed_at?: string;
  expires_at?: string;
}

export interface TestKnowledgeBase {
  id: string;
  source: string;
  source_id?: string;
  category: string;
  title: string;
  content: string;
  solution?: string;
  tags?: string[];
  relevance_score?: number;
  usage_count?: number;
  helpful_count?: number;
  embedding?: number[];
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  content_tsvector?: any;
}

// Helper functions for vector operations using ACTUAL tables
export async function upsertCrawlerDocument(
  url: string,
  title: string,
  content: string,
  embedding: number[],
  appName: string,
  metadata: Record<string, any> = {}
) {
  const client = supabase ?? supabaseAdmin;
  if (!client) throw new Error('Supabase client not initialized');

  const crypto = await import('crypto');
  const contentHash = crypto.createHash('md5').update(content.trim()).digest('hex');

  const { data, error } = await client
    .from('crawler_documents')
    .upsert({
      url,
      title,
      content,
      embedding,
      content_hash: contentHash,
      app_name: appName,
      metadata,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'url,app_name'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function upsertWikiDocument(
  url: string,
  appName: string,
  title: string,
  markdownContent: string,
  embedding: number[],
  metadata: Record<string, any> = {}
) {
  const client = supabase ?? supabaseAdmin;
  if (!client) throw new Error('Supabase client not initialized');

  const crypto = await import('crypto');
  const contentHash = crypto.createHash('md5').update(markdownContent.trim()).digest('hex');

  const { data, error } = await client
    .from('wiki_documents')
    .upsert({
      url,
      app_name: appName,
      title,
      markdown_content: markdownContent,
      embedding,
      content_hash: contentHash,
      metadata,
      crawled_at: new Date().toISOString()
    }, {
      onConflict: 'url,app_name'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function upsertJiraTicket(
  externalId: string,
  title: string,
  description: string,
  embedding: number[],
  metadata: Record<string, any> = {}
) {
  const client = supabase ?? supabaseAdmin;
  if (!client) throw new Error('Supabase client not initialized');

  const { data, error } = await client
    .from('jira_tickets')
    .upsert({
      external_id: externalId,
      title,
      description,
      embedding,
      metadata,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'external_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function upsertJiraTicketEmbedding(
  ticketKey: string,
  summary: string,
  embedding: number[],
  metadata: Record<string, any> = {}
) {
  const client = supabase ?? supabaseAdmin;
  if (!client) throw new Error('Supabase client not initialized');

  const { data, error } = await client
    .from('jira_ticket_embeddings')
    .upsert({
      ticket_key: ticketKey,
      summary,
      embedding,
      metadata,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'ticket_key'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Sony Music specific helpers using ACTUAL tables
export async function validateSonyMusicContent() {
  const client = supabase ?? supabaseAdmin;
  if (!client) throw new Error('Supabase client not initialized');

  const counts: Record<string, number> = {};

  // Count jira tickets
  const { count: jiraCount, error: jiraError } = await client
    .from('jira_tickets')
    .select('*', { count: 'exact', head: true });
  if (jiraError) throw jiraError;
  counts['jira'] = jiraCount ?? 0;

  // Count wiki documents (confluence)
  const { count: wikiCount, error: wikiError } = await client
    .from('wiki_documents')
    .select('*', { count: 'exact', head: true })
    .eq('app_name', 'confluence');
  if (wikiError) throw wikiError;
  counts['confluence'] = wikiCount ?? 0;

  // Count firecrawl analysis
  const { count: firecrawlCount, error: firecrawlError } = await client
    .from('firecrawl_analysis')
    .select('*', { count: 'exact', head: true });
  if (firecrawlError) throw firecrawlError;
  counts['firecrawl'] = firecrawlCount ?? 0;

  return counts;
}

// Firecrawl-specific operations (matches actual schema)
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
      app_name: crawlData.appName || 'aoma',
      analysis_type: crawlData.analysisType || 'ui_analysis',
      testable_features: crawlData.testableFeatures || {},
      user_flows: crawlData.userFlows || {},
      api_endpoints: crawlData.apiEndpoints || [],
      selectors: crawlData.selectors || {},
      accessibility_issues: crawlData.accessibilityIssues || {},
      performance_metrics: crawlData.performanceMetrics || {},
      content_embedding: embedding,
      analyzed_at: new Date().toISOString()
    }, {
      onConflict: 'url'
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
  const client = supabase ?? supabaseAdmin;
  if (!client) throw new Error('Supabase client not initialized');

  const { data, error } = await client
    .from('firecrawl_analysis')
    .select('*')
    .ilike('app_name', `%${query}%`)
    .limit(limit);

  if (error) throw error;
  return data;
}