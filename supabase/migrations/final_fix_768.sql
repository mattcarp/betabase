
DROP FUNCTION IF EXISTS upsert_siam_vector;

CREATE OR REPLACE FUNCTION upsert_siam_vector(
  p_organization VARCHAR(50),
  p_division VARCHAR(50),
  p_app_under_test VARCHAR(50),
  p_content text,
  p_embedding vector(768), -- Back to p_embedding but explicitly 768
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

GRANT EXECUTE ON FUNCTION upsert_siam_vector TO postgres, anon, authenticated, service_role;
