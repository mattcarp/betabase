-- Create the match_siam_vectors_gemini function for Gemini 768d embeddings
-- Multi-tenant version with organization/division/app_under_test filtering

-- First, add the embedding_gemini column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'siam_vectors' AND column_name = 'embedding_gemini'
    ) THEN
        ALTER TABLE siam_vectors ADD COLUMN embedding_gemini vector(768);
    END IF;
END $$;

-- Create index for Gemini embeddings (HNSW for better performance)
CREATE INDEX IF NOT EXISTS idx_siam_vectors_embedding_gemini ON siam_vectors
  USING hnsw (embedding_gemini vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Create the multi-tenant Gemini search function
CREATE OR REPLACE FUNCTION match_siam_vectors_gemini (
  p_organization text,
  p_division text,
  p_app_under_test text,
  query_embedding vector(768),
  match_threshold float DEFAULT 0.50,
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
  created_at timestamptz,
  organization text,
  division text,
  app_under_test text
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
    (1 - (k.embedding_gemini <=> query_embedding))::float as similarity,
    k.created_at,
    k.organization,
    k.division,
    k.app_under_test
  FROM siam_vectors k
  WHERE
    k.organization = p_organization
    AND k.division = p_division
    AND k.app_under_test = p_app_under_test
    AND (filter_source_types IS NULL OR k.source_type = ANY(filter_source_types))
    AND k.embedding_gemini IS NOT NULL
    AND (1 - (k.embedding_gemini <=> query_embedding)) > match_threshold
  ORDER BY k.embedding_gemini <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION match_siam_vectors_gemini TO anon, authenticated, service_role;

-- Also ensure the siam_vectors table has multi-tenant columns
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'siam_vectors' AND column_name = 'organization'
    ) THEN
        ALTER TABLE siam_vectors ADD COLUMN organization text DEFAULT 'sony-music';
        ALTER TABLE siam_vectors ADD COLUMN division text DEFAULT 'digital-operations';
        ALTER TABLE siam_vectors ADD COLUMN app_under_test text DEFAULT 'aoma';
    END IF;
END $$;

-- Create composite index for multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_siam_vectors_tenant 
ON siam_vectors(organization, division, app_under_test);

-- Create composite index for source type + tenant
CREATE INDEX IF NOT EXISTS idx_siam_vectors_tenant_source 
ON siam_vectors(organization, division, app_under_test, source_type);

-- Verify the function was created
SELECT 'match_siam_vectors_gemini function created successfully!' as status;
