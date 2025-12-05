-- RAG Pipeline Fix Migration
-- Date: 2025-11-25
-- Fixes:
--   1. Type mismatch in match_siam_vectors (double precision vs real/float)
--   2. Creates missing rlhf_feedback table
--   3. Creates update_updated_at_column function if missing

BEGIN;

-- ============================================
-- STEP 1: Create update_updated_at_column function if missing
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 2: Fix match_siam_vectors type mismatch
-- The issue: similarity column returns double precision but function declares float
-- Solution: Cast to double precision consistently
-- ============================================

-- Drop existing functions to recreate with correct types
DROP FUNCTION IF EXISTS match_siam_vectors(varchar, varchar, varchar, vector, float, int, text[]);
DROP FUNCTION IF EXISTS match_siam_vectors(varchar, varchar, varchar, vector, double precision, int, text[]);

-- Recreate with double precision return type
CREATE OR REPLACE FUNCTION match_siam_vectors(
  p_organization VARCHAR(50),
  p_division VARCHAR(50),
  p_app_under_test VARCHAR(50),
  query_embedding vector(1536),
  match_threshold double precision DEFAULT 0.25,
  match_count int DEFAULT 10,
  filter_source_types text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  organization varchar(50),
  division varchar(50),
  app_under_test varchar(50),
  content text,
  source_type text,
  source_id text,
  metadata jsonb,
  similarity double precision,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  SET LOCAL hnsw.ef_search = 40;

  RETURN QUERY
  SELECT
    v.id,
    v.organization,
    v.division,
    v.app_under_test,
    v.content,
    v.source_type,
    v.source_id,
    v.metadata,
    (1 - (v.embedding <=> query_embedding))::double precision as similarity,
    v.created_at,
    v.updated_at
  FROM siam_vectors v
  WHERE
    v.organization = p_organization
    AND v.division = p_division
    AND v.app_under_test = p_app_under_test
    AND (filter_source_types IS NULL OR v.source_type = ANY(filter_source_types))
    AND (1 - (v.embedding <=> query_embedding)) > match_threshold
  ORDER BY v.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION match_siam_vectors(varchar, varchar, varchar, vector, double precision, int, text[]) TO anon;
GRANT EXECUTE ON FUNCTION match_siam_vectors(varchar, varchar, varchar, vector, double precision, int, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION match_siam_vectors(varchar, varchar, varchar, vector, double precision, int, text[]) TO service_role;

-- ============================================
-- STEP 3: Create rlhf_feedback table
-- ============================================

CREATE TABLE IF NOT EXISTS rlhf_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  query TEXT NOT NULL,
  query_embedding vector(1536), -- OpenAI embedding (matching siam_vectors)
  response TEXT NOT NULL,
  retrieved_contexts JSONB, -- Array of {doc_id, similarity, rank, content_preview}
  feedback_type TEXT CHECK (feedback_type IN ('thumbs_up', 'thumbs_down', 'rating', 'correction', 'detailed')) NOT NULL,
  feedback_value JSONB, -- Flexible: {score: 1-5} or {correction: "..."} or {comment: "..."}
  feedback_metadata JSONB DEFAULT '{}', -- User info, timestamp, model used, etc
  curator_email TEXT,
  organization TEXT NOT NULL DEFAULT 'sony-music',
  division TEXT DEFAULT 'digital-operations',
  app_under_test TEXT DEFAULT 'aoma',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding similar queries
CREATE INDEX IF NOT EXISTS idx_rlhf_feedback_query_embedding
  ON rlhf_feedback
  USING hnsw (query_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64)
  WHERE query_embedding IS NOT NULL;

-- Supporting indexes
CREATE INDEX IF NOT EXISTS idx_rlhf_feedback_session ON rlhf_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_rlhf_feedback_org ON rlhf_feedback(organization, division, app_under_test);
CREATE INDEX IF NOT EXISTS idx_rlhf_feedback_type ON rlhf_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_rlhf_feedback_created ON rlhf_feedback(created_at DESC);

-- Enable RLS
ALTER TABLE rlhf_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Service role full access on rlhf_feedback" ON rlhf_feedback;
CREATE POLICY "Service role full access on rlhf_feedback"
  ON rlhf_feedback
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can read rlhf_feedback" ON rlhf_feedback;
CREATE POLICY "Anon can read rlhf_feedback"
  ON rlhf_feedback
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Authenticated can manage rlhf_feedback" ON rlhf_feedback;
CREATE POLICY "Authenticated can manage rlhf_feedback"
  ON rlhf_feedback
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_rlhf_feedback_updated_at ON rlhf_feedback;
CREATE TRIGGER update_rlhf_feedback_updated_at
  BEFORE UPDATE ON rlhf_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 4: Create retrieval_reinforcement table (for RLHF signals)
-- ============================================

CREATE TABLE IF NOT EXISTS retrieval_reinforcement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_embedding vector(1536), -- OpenAI embedding
  query_text TEXT NOT NULL,
  relevant_doc_ids TEXT[],
  irrelevant_doc_ids TEXT[],
  manual_boosts JSONB DEFAULT '{}',
  context TEXT,
  strength REAL DEFAULT 1.0 CHECK (strength >= 0.0 AND strength <= 1.0),
  curator_email TEXT,
  organization TEXT NOT NULL DEFAULT 'sony-music',
  division TEXT DEFAULT 'digital-operations',
  app_under_test TEXT DEFAULT 'aoma',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding similar reinforcement signals
CREATE INDEX IF NOT EXISTS idx_retrieval_reinforcement_query_embedding
  ON retrieval_reinforcement
  USING hnsw (query_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64)
  WHERE query_embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_retrieval_reinforcement_org
  ON retrieval_reinforcement(organization, division, app_under_test);

CREATE INDEX IF NOT EXISTS idx_retrieval_reinforcement_created
  ON retrieval_reinforcement(created_at DESC);

-- Enable RLS
ALTER TABLE retrieval_reinforcement ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on retrieval_reinforcement" ON retrieval_reinforcement;
CREATE POLICY "Service role full access on retrieval_reinforcement"
  ON retrieval_reinforcement
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can read retrieval_reinforcement" ON retrieval_reinforcement;
CREATE POLICY "Anon can read retrieval_reinforcement"
  ON retrieval_reinforcement
  FOR SELECT
  TO anon
  USING (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_retrieval_reinforcement_updated_at ON retrieval_reinforcement;
CREATE TRIGGER update_retrieval_reinforcement_updated_at
  BEFORE UPDATE ON retrieval_reinforcement
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 5: Grant table permissions
-- ============================================

GRANT ALL ON rlhf_feedback TO service_role;
GRANT SELECT, INSERT ON rlhf_feedback TO authenticated;
GRANT SELECT ON rlhf_feedback TO anon;

GRANT ALL ON retrieval_reinforcement TO service_role;
GRANT SELECT, INSERT ON retrieval_reinforcement TO authenticated;
GRANT SELECT ON retrieval_reinforcement TO anon;

COMMIT;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '=== RAG Pipeline Fix Complete ===';
  RAISE NOTICE '1. match_siam_vectors: Fixed type mismatch (now returns double precision)';
  RAISE NOTICE '2. rlhf_feedback: Table created with proper indexes and RLS';
  RAISE NOTICE '3. retrieval_reinforcement: Table created for RLHF signals';
  RAISE NOTICE '';
  RAISE NOTICE 'Run a test query to verify:';
  RAISE NOTICE 'SELECT * FROM match_siam_vectors(''sony-music'', ''digital-operations'', ''aoma'', <embedding>, 0.25, 5, NULL);';
END $$;
