/**
 * Unified Knowledge API Types
 *
 * TypeScript interfaces for the Knowledge API request/response contracts.
 */

export type SourceType = 'git' | 'jira' | 'knowledge' | 'wiki' | 'email' | 'metrics';

export interface QueryRequest {
  query: string;
  sources?: SourceType[];
  limit?: number;
  threshold?: number;
  synthesize?: boolean;
  stream?: boolean;
}

export interface VectorResult {
  id: string;
  content: string;
  source_type: SourceType;
  source_id: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

export interface QueryMetrics {
  total_ms: number;
  cache_hit: boolean;
  embedding_ms: number;
  search_ms: number;
  synthesis_ms?: number;
}

export interface QueryResponse {
  results: VectorResult[];
  synthesis?: string;
  metrics: QueryMetrics;
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export interface EmbeddingCacheEntry {
  embedding: number[];
  timestamp: number;
}

export interface AppContext {
  organization: string;
  division: string;
  app_under_test: string;
}

export const DEFAULT_CONTEXT: AppContext = {
  organization: 'sony-music',
  division: 'digital-operations',
  app_under_test: 'aoma',
};

export const DEFAULT_LIMIT = 5;
export const DEFAULT_THRESHOLD = 0.2;
export const MAX_LIMIT = 20;
