/**
 * Apply the match_siam_vectors_gemini function fix
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Applying match_siam_vectors_gemini function fix...');

  const sql = `
-- Drop and recreate the function with correct return types
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
  source_type VARCHAR(50),
  source_id TEXT,
  metadata JSONB,
  similarity REAL,
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
    AND (filter_source_types IS NULL OR v.source_type::TEXT = ANY(filter_source_types))
    AND 1 - (v.embedding_gemini <=> query_embedding) > match_threshold
  ORDER BY v.embedding_gemini <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION match_siam_vectors_gemini TO authenticated;
GRANT EXECUTE ON FUNCTION match_siam_vectors_gemini TO service_role;
  `;

  // Execute each statement via RPC or use raw query via psql
  // Supabase JS client doesn't support raw SQL execution
  // We'll need to use the Management API or psql directly

  console.log('SQL to apply:');
  console.log(sql);
  console.log('\nPlease apply this SQL via Supabase Dashboard SQL Editor');
  console.log('Navigate to: https://supabase.com/dashboard/project/kfxetwuuzljhybfgmpuc/sql');
}

main().catch(console.error);
