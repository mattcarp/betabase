-- Fix match_siam_vectors_gemini function to use correct table name
-- The function was querying siam_unified_vectors but data is in siam_vectors

DROP FUNCTION IF EXISTS match_siam_vectors_gemini(TEXT, TEXT, TEXT, vector(768), REAL, INT, TEXT[]);

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
  similarity DOUBLE PRECISION,  -- Changed from REAL to DOUBLE PRECISION
  organization TEXT,
  division TEXT,
  app_under_test TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
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
    (1 - (v.embedding_gemini <=> query_embedding))::DOUBLE PRECISION AS similarity,
    v.organization,
    v.division,
    v.app_under_test,
    v.created_at,
    v.updated_at
  FROM siam_vectors v  -- Changed from siam_unified_vectors to siam_vectors
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION match_siam_vectors_gemini TO authenticated;
GRANT EXECUTE ON FUNCTION match_siam_vectors_gemini TO service_role;
GRANT EXECUTE ON FUNCTION match_siam_vectors_gemini TO anon;

SELECT 'Fixed match_siam_vectors_gemini to use siam_vectors table! 🚀' as status;
