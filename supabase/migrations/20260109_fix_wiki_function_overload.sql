-- Fix match_wiki_documents function overload issue
-- Error: Could not choose between double precision vs real signatures
--
-- Solution: Drop ALL versions and recreate with single consistent signature

-- Drop ALL existing versions (both parameter type variants)
DROP FUNCTION IF EXISTS match_wiki_documents(vector(768), double precision, int, text);
DROP FUNCTION IF EXISTS match_wiki_documents(vector(768), real, int, text);
DROP FUNCTION IF EXISTS match_wiki_documents(vector(1536), double precision, int, text);
DROP FUNCTION IF EXISTS match_wiki_documents(vector(1536), real, int, text);
DROP FUNCTION IF EXISTS match_wiki_documents(vector, double precision, int, text);
DROP FUNCTION IF EXISTS match_wiki_documents(vector, real, int, text);

-- Recreate with single FLOAT signature (PostgreSQL standard)
CREATE OR REPLACE FUNCTION match_wiki_documents(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.40,
  match_count INT DEFAULT 10,
  app_name_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title TEXT,
  markdown_content TEXT,
  url TEXT,
  app_name TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.title,
    w.markdown_content,
    w.url,
    w.app_name,
    w.metadata,
    (1 - (w.embedding <=> query_embedding))::FLOAT AS similarity
  FROM wiki_documents w
  WHERE
    w.embedding IS NOT NULL
    AND (app_name_filter IS NULL OR w.app_name ILIKE '%' || app_name_filter || '%')
    AND 1 - (w.embedding <=> query_embedding) > match_threshold
  ORDER BY w.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_wiki_documents(vector(768), float, int, text)
  IS 'Vector search for wiki_documents using Gemini 768d embeddings (fixed overload Jan 2026)';

-- Verify only one function exists
SELECT
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'match_wiki_documents';
