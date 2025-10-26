-- Create the match_aoma_vectors function for vector similarity search
-- This function searches across all knowledge sources using vector embeddings

CREATE OR REPLACE FUNCTION match_aoma_vectors (
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
  similarity float,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id,
    k.content,
    k.source_type,
    k.source_id,
    k.metadata,
    1 - (k.embedding <=> query_embedding) as similarity,
    k.created_at
  FROM aoma_vectors k
  WHERE
    (filter_source_types IS NULL OR k.source_type = ANY(filter_source_types))
    AND k.embedding IS NOT NULL
    AND 1 - (k.embedding <=> query_embedding) > match_threshold
  ORDER BY k.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION match_aoma_vectors TO anon, authenticated, service_role;

-- Create the aoma_vectors table if it doesn't exist
CREATE TABLE IF NOT EXISTS aoma_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'knowledge', 'jira', 'git', 'email', 'confluence', etc.
  source_id TEXT,
  metadata JSONB DEFAULT '{}',
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_aoma_vectors_source_type ON aoma_vectors(source_type);
CREATE INDEX IF NOT EXISTS idx_aoma_vectors_embedding ON aoma_vectors
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_aoma_vectors_created_at ON aoma_vectors(created_at DESC);

-- Add RLS policies
ALTER TABLE aoma_vectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to aoma_vectors" ON aoma_vectors
  FOR SELECT
  TO anon, authenticated, service_role
  USING (true);

CREATE POLICY "Allow service role full access to aoma_vectors" ON aoma_vectors
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
