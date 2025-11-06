-- SIAM Firecrawl Vector Store Schema
-- Run this in Supabase SQL Editor

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Main vector store table
CREATE TABLE IF NOT EXISTS siam_vectors (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI embedding dimensions
  source_type TEXT NOT NULL CHECK (source_type IN ('aoma_docs', 'jira', 'git', 'email', 'confluence')),
  source_id TEXT NOT NULL UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create vector similarity search index
CREATE INDEX IF NOT EXISTS siam_vectors_embedding_idx 
ON siam_vectors 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_siam_vectors_source_type ON siam_vectors(source_type);
CREATE INDEX IF NOT EXISTS idx_siam_vectors_metadata ON siam_vectors USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_siam_vectors_created_at ON siam_vectors(created_at DESC);

-- 4. Source synchronization tracking
CREATE TABLE IF NOT EXISTS siam_source_sync (
  source_type TEXT PRIMARY KEY,
  last_sync TIMESTAMPTZ,
  sync_status TEXT CHECK (sync_status IN ('success', 'partial', 'error', 'in_progress')),
  records_count INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- 5. Crawl history for debugging
CREATE TABLE IF NOT EXISTS siam_crawl_history (
  id BIGSERIAL PRIMARY KEY,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  pages_crawled INTEGER DEFAULT 0,
  pages_failed INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  config JSONB DEFAULT '{}',
  status TEXT CHECK (status IN ('running', 'completed', 'failed'))
);

-- 6. Function for semantic search
CREATE OR REPLACE FUNCTION search_siam_content(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id bigint,
  content text,
  source_type text,
  metadata jsonb,
  similarity float
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    id,
    content,
    source_type,
    metadata,
    1 - (embedding <=> query_embedding) AS similarity
  FROM siam_vectors
  WHERE embedding IS NOT NULL
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 7. Function to get recent crawled content
CREATE OR REPLACE FUNCTION get_recent_siam_content(
  limit_count int DEFAULT 10
)
RETURNS TABLE (
  id bigint,
  content text,
  source_type text,
  metadata jsonb,
  created_at timestamptz
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    id,
    content,
    source_type,
    metadata,
    created_at
  FROM siam_vectors
  WHERE source_type = 'aoma_docs'
  ORDER BY created_at DESC
  LIMIT limit_count;
$$;

-- 8. Insert initial sync status
INSERT INTO siam_source_sync (source_type, sync_status, records_count)
VALUES ('aoma_docs', 'pending', 0)
ON CONFLICT (source_type) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON siam_vectors TO anon, authenticated;
GRANT ALL ON siam_source_sync TO anon, authenticated;
GRANT ALL ON siam_crawl_history TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_siam_content TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_recent_siam_content TO anon, authenticated;