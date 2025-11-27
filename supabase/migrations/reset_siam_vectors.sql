
-- Full reset of siam_vectors to ensure 768 dimensions

DROP TABLE IF EXISTS siam_vectors CASCADE;

CREATE TABLE siam_vectors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text,
  metadata jsonb,
  embedding vector(768), -- Explicitly 768
  source_type text,
  source_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization VARCHAR(50) NOT NULL DEFAULT 'sony-music',
  division VARCHAR(50) NOT NULL DEFAULT 'digital-operations',
  app_under_test VARCHAR(50) NOT NULL DEFAULT 'aoma',
  
  CONSTRAINT valid_organization CHECK (organization ~ '^[a-z][a-z0-9_-]*$'),
  CONSTRAINT valid_division CHECK (division ~ '^[a-z][a-z0-9_-]*$'),
  CONSTRAINT valid_app_under_test CHECK (app_under_test ~ '^[a-z][a-z0-9_-]*$'),
  CONSTRAINT unique_source_per_app UNIQUE(organization, division, app_under_test, source_type, source_id)
);

-- Recreate indexes
CREATE INDEX siam_vectors_embedding_hnsw_idx ON siam_vectors USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX siam_vectors_org_idx ON siam_vectors(organization);
CREATE INDEX siam_vectors_org_div_idx ON siam_vectors(organization, division);
CREATE INDEX siam_vectors_org_div_app_idx ON siam_vectors(organization, division, app_under_test);
CREATE INDEX siam_vectors_full_hierarchy_source_idx ON siam_vectors(organization, division, app_under_test, source_type);
CREATE INDEX siam_vectors_full_hierarchy_created_idx ON siam_vectors(organization, division, app_under_test, created_at DESC);
CREATE INDEX siam_vectors_metadata_idx ON siam_vectors USING gin(metadata);

-- Recreate functions
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

GRANT ALL ON siam_vectors TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION match_siam_vectors TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION match_siam_vectors_fast TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION upsert_siam_vector TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION match_siam_vectors_by_division TO postgres, anon, authenticated, service_role;
