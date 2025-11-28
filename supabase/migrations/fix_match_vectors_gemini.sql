-- Fix match_siam_vectors_gemini function return types
-- The function was returning TEXT but siam_vectors uses VARCHAR(50)
-- Date: 2025-11-26

-- Drop and recreate the function with correct return types
-- Based on actual siam_vectors table schema:
-- source_type: TEXT (not VARCHAR)
-- organization, division, app_under_test: VARCHAR(50)
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
  similarity DOUBLE PRECISION,
  organization VARCHAR(50),
  division VARCHAR(50),
  app_under_test VARCHAR(50)
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
  FROM siam_vectors v
  WHERE
    v.organization = p_organization::VARCHAR(50)
    AND v.division = p_division::VARCHAR(50)
    AND v.app_under_test = p_app_under_test::VARCHAR(50)
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

SELECT 'match_siam_vectors_gemini function fixed!' as status;
