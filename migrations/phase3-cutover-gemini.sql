-- ============================================================
-- PHASE 3: Cutover to Gemini Embeddings
-- ============================================================
-- Run this AFTER Phase 2 (re-embedding) is complete.
-- This script:
-- 1. Updates all match functions to use embedding_gemini
-- 2. Drops old 1536d columns (optional, commented out)
-- 3. Renames embedding_gemini -> embedding
--
-- IMPORTANT: Verify Phase 2 completed successfully before running!
-- Check: SELECT * FROM embedding_migration_progress;
-- ============================================================

-- First, verify migration is complete
DO $$
DECLARE
  incomplete_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO incomplete_count
  FROM embedding_migration_progress
  WHERE status != 'completed';
  
  IF incomplete_count > 0 THEN
    RAISE EXCEPTION 'Migration not complete! % tables still pending. Run Phase 2 first.', incomplete_count;
  END IF;
END $$;

-- ============================================================
-- STEP 1: Update match functions to use 768d Gemini embeddings
-- ============================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS match_siam_vectors(VARCHAR, VARCHAR, VARCHAR, vector, float, int, text[]);
DROP FUNCTION IF EXISTS match_siam_vectors_fast(VARCHAR, VARCHAR, VARCHAR, vector, int, text[]);
DROP FUNCTION IF EXISTS match_siam_vectors_by_division(VARCHAR, VARCHAR, vector, float, int);
DROP FUNCTION IF EXISTS upsert_siam_vector(VARCHAR, VARCHAR, VARCHAR, text, vector, text, text, jsonb);

-- Create updated match function with 768d
CREATE OR REPLACE FUNCTION match_siam_vectors(
  p_organization VARCHAR(50),
  p_division VARCHAR(50),
  p_app_under_test VARCHAR(50),
  query_embedding vector(768),
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
  SET LOCAL hnsw.ef_search = 40;
  
  RETURN QUERY
  SELECT 
    v.id,
    v.content,
    v.source_type,
    v.source_id,
    v.metadata,
    1 - (v.embedding_gemini <=> query_embedding) as similarity
  FROM siam_vectors v
  WHERE 
    v.organization = p_organization
    AND v.division = p_division
    AND v.app_under_test = p_app_under_test
    AND v.embedding_gemini IS NOT NULL
    AND (filter_source_types IS NULL OR v.source_type = ANY(filter_source_types))
    AND (1 - (v.embedding_gemini <=> query_embedding)) > match_threshold
  ORDER BY v.embedding_gemini <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Fast match function
CREATE OR REPLACE FUNCTION match_siam_vectors_fast(
  p_organization VARCHAR(50),
  p_division VARCHAR(50),
  p_app_under_test VARCHAR(50),
  query_embedding vector(768),
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
  SET LOCAL hnsw.ef_search = 20;
  
  RETURN QUERY
  SELECT 
    v.id,
    v.content,
    v.source_type,
    v.source_id,
    v.metadata,
    1 - (v.embedding_gemini <=> query_embedding) as similarity
  FROM siam_vectors v
  WHERE 
    v.organization = p_organization
    AND v.division = p_division
    AND v.app_under_test = p_app_under_test
    AND v.embedding_gemini IS NOT NULL
    AND (filter_source_types IS NULL OR v.source_type = ANY(filter_source_types))
  ORDER BY v.embedding_gemini <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Division-level match function
CREATE OR REPLACE FUNCTION match_siam_vectors_by_division(
  p_organization VARCHAR(50),
  p_division VARCHAR(50),
  query_embedding vector(768),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  app_under_test text,
  content text,
  source_type text,
  source_id text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  SET LOCAL hnsw.ef_search = 40;
  
  RETURN QUERY
  SELECT 
    v.id,
    v.app_under_test,
    v.content,
    v.source_type,
    v.source_id,
    v.metadata,
    1 - (v.embedding_gemini <=> query_embedding) as similarity
  FROM siam_vectors v
  WHERE 
    v.organization = p_organization
    AND v.division = p_division
    AND v.embedding_gemini IS NOT NULL
    AND (1 - (v.embedding_gemini <=> query_embedding)) > match_threshold
  ORDER BY v.embedding_gemini <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Upsert function with 768d
CREATE OR REPLACE FUNCTION upsert_siam_vector(
  p_organization VARCHAR(50),
  p_division VARCHAR(50),
  p_app_under_test VARCHAR(50),
  p_content text,
  p_embedding vector(768),
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
  INSERT INTO siam_vectors (
    organization,
    division,
    app_under_test,
    content, 
    embedding_gemini,
    embedding_source,
    source_type, 
    source_id, 
    metadata,
    updated_at
  )
  VALUES (
    p_organization,
    p_division,
    p_app_under_test,
    p_content, 
    p_embedding,
    'gemini',
    p_source_type, 
    p_source_id, 
    p_metadata,
    NOW()
  )
  ON CONFLICT (organization, division, app_under_test, source_type, source_id) 
  DO UPDATE SET
    content = EXCLUDED.content,
    embedding_gemini = EXCLUDED.embedding_gemini,
    embedding_source = 'gemini',
    metadata = EXCLUDED.metadata,
    updated_at = NOW()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION match_siam_vectors TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION match_siam_vectors_fast TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION match_siam_vectors_by_division TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION upsert_siam_vector TO postgres, anon, authenticated, service_role;

-- ============================================================
-- STEP 2: (OPTIONAL) Rename columns and drop old ones
-- ============================================================
-- Uncomment these lines ONLY after verifying everything works!

-- -- Drop old 1536d embedding column
-- ALTER TABLE siam_vectors DROP COLUMN IF EXISTS embedding;
-- 
-- -- Rename embedding_gemini to embedding
-- ALTER TABLE siam_vectors RENAME COLUMN embedding_gemini TO embedding;
-- 
-- -- Repeat for other tables...
-- ALTER TABLE jira_tickets DROP COLUMN IF EXISTS embedding;
-- ALTER TABLE jira_tickets RENAME COLUMN embedding_gemini TO embedding;
-- ... etc

SELECT 'Phase 3 complete! Functions now use Gemini (768d) embeddings.' as status;
