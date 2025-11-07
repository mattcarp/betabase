-- Gemini Embeddings Migration
-- Add support for Gemini text-embedding-004 (768 dimensions) alongside OpenAI embeddings
-- Date: 2025-01-05
-- Authors: Claude Sonnet 4.5 - Advanced RLHF RAG Implementation

-- Step 1: Add Gemini embedding column to siam_unified_vectors
ALTER TABLE siam_unified_vectors 
  ADD COLUMN IF NOT EXISTS embedding_gemini vector(768);

-- Step 2: Create optimized index for Gemini embeddings
CREATE INDEX IF NOT EXISTS siam_vectors_gemini_idx 
  ON siam_unified_vectors 
  USING ivfflat (embedding_gemini vector_cosine_ops)
  WITH (lists = 100);

-- Step 3: Add metadata to track embedding source
ALTER TABLE siam_unified_vectors 
  ADD COLUMN IF NOT EXISTS embedding_source TEXT DEFAULT 'openai';

-- Step 4: Create embedding migration status table for tracking progress
CREATE TABLE IF NOT EXISTS embedding_migration_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization TEXT NOT NULL,
  division TEXT NOT NULL,
  app_under_test TEXT NOT NULL,
  source_type TEXT NOT NULL,
  total_count INTEGER DEFAULT 0,
  migrated_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')) DEFAULT 'pending',
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create index for migration status queries
CREATE INDEX IF NOT EXISTS idx_migration_status_org 
  ON embedding_migration_status(organization, division, app_under_test);
CREATE INDEX IF NOT EXISTS idx_migration_status 
  ON embedding_migration_status(status);

-- Step 6: Function to search using Gemini embeddings
CREATE OR REPLACE FUNCTION match_siam_vectors_gemini(
  p_organization TEXT,
  p_division TEXT,
  p_app_under_test TEXT,
  query_embedding vector(768),
  match_threshold REAL DEFAULT 0.50,
  match_count INT DEFAULT 10,
  filter_source_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content TEXT,
  embedding_gemini vector(768),
  source_type TEXT,
  source_id TEXT,
  metadata JSONB,
  similarity REAL,
  organization TEXT,
  division TEXT,
  app_under_test TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.content,
    v.embedding_gemini,
    v.source_type,
    v.source_id,
    v.metadata,
    1 - (v.embedding_gemini <=> query_embedding) AS similarity,
    v.organization,
    v.division,
    v.app_under_test
  FROM siam_unified_vectors v
  WHERE 
    v.organization = p_organization
    AND v.division = p_division
    AND v.app_under_test = p_app_under_test
    AND v.embedding_gemini IS NOT NULL
    AND (filter_source_types IS NULL OR v.source_type = ANY(filter_source_types))
    AND 1 - (v.embedding_gemini <=> query_embedding) > match_threshold
  ORDER BY v.embedding_gemini <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION match_siam_vectors_gemini TO authenticated;
GRANT EXECUTE ON FUNCTION match_siam_vectors_gemini TO service_role;
GRANT ALL ON embedding_migration_status TO authenticated;
GRANT ALL ON embedding_migration_status TO service_role;

-- Step 8: Enable RLS on migration status table
ALTER TABLE embedding_migration_status ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to read migration status
CREATE POLICY "Allow authenticated read on migration_status"
  ON embedding_migration_status
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Allow service role full access
CREATE POLICY "Allow service role full access on migration_status"
  ON embedding_migration_status
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 9: Add comments for documentation
COMMENT ON COLUMN siam_unified_vectors.embedding_gemini IS 'Gemini text-embedding-004 vector (768 dimensions)';
COMMENT ON COLUMN siam_unified_vectors.embedding_source IS 'Source of embedding: openai or gemini';
COMMENT ON TABLE embedding_migration_status IS 'Tracks progress of migrating embeddings from OpenAI to Gemini';

-- Done!
SELECT 'Gemini embeddings migration schema created successfully! 🚀' as status;

