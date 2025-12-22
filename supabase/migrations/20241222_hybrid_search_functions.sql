-- Hybrid Search SQL Functions for SIAM RAG System
-- Run this in Supabase SQL Editor
-- Part of RAG Overhaul - Option C

-- ============================================
-- 1. BM25/Full-Text Search Function
-- ============================================
-- This enables keyword search alongside vector search
-- for catching exact matches that semantic search misses

CREATE OR REPLACE FUNCTION search_siam_hybrid(
  p_organization TEXT,
  p_division TEXT,
  p_app_under_test TEXT,
  p_query TEXT,
  p_match_count INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source_type TEXT,
  source_id TEXT,
  metadata JSONB,
  bm25_rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.content,
    v.source_type,
    v.source_id,
    v.metadata,
    ts_rank_cd(
      to_tsvector('english', v.content),
      plainto_tsquery('english', p_query),
      32 -- Normalization: divides rank by document length
    ) as bm25_rank
  FROM siam_vectors v
  WHERE v.organization = p_organization
    AND v.division = p_division
    AND v.app_under_test = p_app_under_test
    AND to_tsvector('english', v.content) @@ plainto_tsquery('english', p_query)
  ORDER BY bm25_rank DESC
  LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. GIN Index for Fast Text Search
-- ============================================
-- This makes the full-text search FAST (milliseconds not seconds)

CREATE INDEX IF NOT EXISTS idx_siam_vectors_content_gin 
ON siam_vectors USING gin(to_tsvector('english', content));

-- ============================================
-- 3. Phrase Search Function (Optional - More Precise)
-- ============================================
-- Use this when you need exact phrase matching

CREATE OR REPLACE FUNCTION search_siam_phrase(
  p_organization TEXT,
  p_division TEXT,
  p_app_under_test TEXT,
  p_phrase TEXT,
  p_match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source_type TEXT,
  source_id TEXT,
  metadata JSONB,
  phrase_rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.content,
    v.source_type,
    v.source_id,
    v.metadata,
    ts_rank_cd(
      to_tsvector('english', v.content),
      phraseto_tsquery('english', p_phrase),
      32
    ) as phrase_rank
  FROM siam_vectors v
  WHERE v.organization = p_organization
    AND v.division = p_division
    AND v.app_under_test = p_app_under_test
    AND to_tsvector('english', v.content) @@ phraseto_tsquery('english', p_phrase)
  ORDER BY phrase_rank DESC
  LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Combined Hybrid Search (Vector + Keyword)
-- ============================================
-- This runs both searches and combines them server-side
-- Useful if you want to minimize round trips

CREATE OR REPLACE FUNCTION search_siam_combined(
  p_organization TEXT,
  p_division TEXT,
  p_app_under_test TEXT,
  p_query TEXT,
  p_query_embedding vector(768),
  p_match_count INT DEFAULT 20,
  p_similarity_threshold FLOAT DEFAULT 0.4
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source_type TEXT,
  source_id TEXT,
  metadata JSONB,
  vector_similarity FLOAT,
  keyword_rank REAL,
  combined_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH vector_results AS (
    SELECT 
      v.id,
      v.content,
      v.source_type,
      v.source_id,
      v.metadata,
      1 - (v.embedding_gemini <=> p_query_embedding) as similarity
    FROM siam_vectors v
    WHERE v.organization = p_organization
      AND v.division = p_division
      AND v.app_under_test = p_app_under_test
      AND 1 - (v.embedding_gemini <=> p_query_embedding) > p_similarity_threshold
    ORDER BY v.embedding_gemini <=> p_query_embedding
    LIMIT p_match_count
  ),
  keyword_results AS (
    SELECT 
      v.id,
      ts_rank_cd(
        to_tsvector('english', v.content),
        plainto_tsquery('english', p_query),
        32
      ) as bm25
    FROM siam_vectors v
    WHERE v.organization = p_organization
      AND v.division = p_division
      AND v.app_under_test = p_app_under_test
      AND to_tsvector('english', v.content) @@ plainto_tsquery('english', p_query)
  ),
  combined AS (
    SELECT 
      COALESCE(vr.id, kr_full.id) as id,
      COALESCE(vr.content, kr_full.content) as content,
      COALESCE(vr.source_type, kr_full.source_type) as source_type,
      COALESCE(vr.source_id, kr_full.source_id) as source_id,
      COALESCE(vr.metadata, kr_full.metadata) as metadata,
      COALESCE(vr.similarity, 0)::FLOAT as vector_sim,
      COALESCE(kr.bm25, 0)::REAL as keyword_r,
      -- Combined score: weighted sum of normalized scores
      (COALESCE(vr.similarity, 0) * 0.7 + LEAST(COALESCE(kr.bm25, 0) * 2, 1) * 0.3)::FLOAT as combined
    FROM vector_results vr
    FULL OUTER JOIN keyword_results kr ON vr.id = kr.id
    LEFT JOIN siam_vectors kr_full ON kr.id = kr_full.id
  )
  SELECT 
    c.id,
    c.content,
    c.source_type,
    c.source_id,
    c.metadata,
    c.vector_sim as vector_similarity,
    c.keyword_r as keyword_rank,
    c.combined as combined_score
  FROM combined c
  ORDER BY c.combined DESC
  LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. Grant Permissions
-- ============================================
-- Make sure the service role can execute these functions

GRANT EXECUTE ON FUNCTION search_siam_hybrid TO service_role;
GRANT EXECUTE ON FUNCTION search_siam_phrase TO service_role;
GRANT EXECUTE ON FUNCTION search_siam_combined TO service_role;

-- ============================================
-- Verification
-- ============================================
-- Run this to verify the functions exist:
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_type = 'FUNCTION' AND routine_name LIKE 'search_siam%';
