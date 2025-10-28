-- Deploy upsert_aoma_vector function
-- This function enables safe insert/update of vectors in the unified store

CREATE OR REPLACE FUNCTION upsert_aoma_vector(
  p_content text,
  p_embedding vector(1536),
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
  INSERT INTO aoma_unified_vectors (
    content,
    embedding,
    source_type,
    source_id,
    metadata,
    updated_at
  )
  VALUES (
    p_content,
    p_embedding,
    p_source_type,
    p_source_id,
    p_metadata,
    NOW()
  )
  ON CONFLICT (source_type, source_id)
  DO UPDATE SET
    content = EXCLUDED.content,
    embedding = EXCLUDED.embedding,
    metadata = EXCLUDED.metadata,
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION upsert_aoma_vector TO anon, authenticated, service_role;

-- Verify deployment
SELECT 'Function deployed successfully!' as status;
