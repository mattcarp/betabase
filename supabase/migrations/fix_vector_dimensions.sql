
-- Fix vector dimensions to match Gemini (768) instead of OpenAI (1536)

-- Drop functions first because they depend on the type
DROP FUNCTION IF EXISTS match_siam_vectors;
DROP FUNCTION IF EXISTS match_siam_vectors_fast;
DROP FUNCTION IF EXISTS upsert_siam_vector;
DROP FUNCTION IF EXISTS match_siam_vectors_by_division;

-- Alter table
ALTER TABLE siam_vectors ALTER COLUMN embedding TYPE vector(768);

-- Re-create functions with 768 dimensions

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
    1 - (v.embedding <=> query_embedding) as similarity
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
    1 - (v.embedding <=> query_embedding) as similarity
  FROM siam_vectors v
  WHERE 
    v.organization = p_organization
    AND v.division = p_division
    AND v.app_under_test = p_app_under_test
    AND (filter_source_types IS NULL OR v.source_type = ANY(filter_source_types))
  ORDER BY v.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

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
    embedding, 
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
    p_source_type, 
    p_source_id, 
    p_metadata,
    NOW()
  )
  ON CONFLICT (organization, division, app_under_test, source_type, source_id) 
  DO UPDATE SET
    content = EXCLUDED.content,
    embedding = EXCLUDED.embedding,
    metadata = EXCLUDED.metadata,
    updated_at = NOW()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

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
    1 - (v.embedding <=> query_embedding) as similarity
  FROM siam_vectors v
  WHERE 
    v.organization = p_organization
    AND v.division = p_division
    AND (1 - (v.embedding <=> query_embedding)) > match_threshold
  ORDER BY v.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant permissions again just in case
GRANT EXECUTE ON FUNCTION match_siam_vectors TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION match_siam_vectors_fast TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION upsert_siam_vector TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION match_siam_vectors_by_division TO postgres, anon, authenticated, service_role;
