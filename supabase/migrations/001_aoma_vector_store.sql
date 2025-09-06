-- AOMA Unified Vector Store Migration
-- Epic performance optimization: 25s → <1s response times!
-- Date: 2025-08-21
-- Authors: Matt & Claude - YOLO MODE ACTIVATED 🚀

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the main unified vectors table
CREATE TABLE IF NOT EXISTS aoma_unified_vectors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-ada-002 dimensions
  source_type TEXT NOT NULL CHECK (source_type IN ('knowledge', 'jira', 'git', 'email', 'metrics', 'openai_import', 'cache')),
  source_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Performance optimization indexes
  CONSTRAINT unique_source UNIQUE(source_type, source_id)
);

-- Create indexes for blazing fast queries
CREATE INDEX IF NOT EXISTS aoma_unified_vectors_embedding_idx 
  ON aoma_unified_vectors 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS aoma_unified_vectors_source_type_idx 
  ON aoma_unified_vectors(source_type);

CREATE INDEX IF NOT EXISTS aoma_unified_vectors_metadata_idx 
  ON aoma_unified_vectors 
  USING gin(metadata);

CREATE INDEX IF NOT EXISTS aoma_unified_vectors_created_at_idx 
  ON aoma_unified_vectors(created_at DESC);

-- Function to search vectors with similarity
CREATE OR REPLACE FUNCTION match_aoma_vectors(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 10,
  filter_source_types text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  source_type text,
  source_id text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.content,
    v.source_type,
    v.source_id,
    v.metadata,
    1 - (v.embedding <=> query_embedding) as similarity
  FROM aoma_unified_vectors v
  WHERE 
    (filter_source_types IS NULL OR v.source_type = ANY(filter_source_types))
    AND (1 - (v.embedding <=> query_embedding)) > match_threshold
  ORDER BY v.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to upsert vectors (for migration and updates)
CREATE OR REPLACE FUNCTION upsert_aoma_vector(
  p_content text,
  p_embedding vector(1536),
  p_source_type text,
  p_source_id text,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO aoma_unified_vectors (
    content, 
    embedding, 
    source_type, 
    source_id, 
    metadata,
    updated_at
  )
  VALUES (
    p_content, 
    p_embedding, 
    p_source_type, 
    p_source_id, 
    p_metadata,
    NOW()
  )
  ON CONFLICT (source_type, source_id) 
  DO UPDATE SET
    content = EXCLUDED.content,
    embedding = EXCLUDED.embedding,
    metadata = EXCLUDED.metadata,
    updated_at = NOW()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Table to track migration progress
CREATE TABLE IF NOT EXISTS aoma_migration_status (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type TEXT NOT NULL,
  total_count INTEGER DEFAULT 0,
  migrated_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics view for monitoring
CREATE OR REPLACE VIEW aoma_vector_stats AS
SELECT 
  source_type,
  COUNT(*) as document_count,
  AVG(length(content)) as avg_content_length,
  MIN(created_at) as oldest_document,
  MAX(created_at) as newest_document,
  pg_size_pretty(SUM(pg_column_size(embedding))::bigint) as embedding_storage_size
FROM aoma_unified_vectors
GROUP BY source_type;

-- Grant appropriate permissions (adjust based on your Supabase setup)
GRANT ALL ON aoma_unified_vectors TO authenticated;
GRANT ALL ON aoma_migration_status TO authenticated;
GRANT SELECT ON aoma_vector_stats TO authenticated;
GRANT EXECUTE ON FUNCTION match_aoma_vectors TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_aoma_vector TO authenticated;

-- Success! Your vector store is ready for BLAZING FAST queries! 🚀
COMMENT ON TABLE aoma_unified_vectors IS 'Unified vector store for all AOMA data sources - replacing slow distributed API calls with sub-second local queries!';