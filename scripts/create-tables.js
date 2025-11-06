#!/usr/bin/env node

/**
 * Create the AOMA vector store tables in Supabase
 * Run this to set up the database schema
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log("🚀 Creating AOMA vector store tables...\n");
console.log("⚠️ IMPORTANT: This script shows you the SQL to run.\n");
console.log("Since we can't run DDL commands directly via the JS client,");
console.log("you need to run this SQL in the Supabase SQL Editor:\n");
console.log("1. Go to: https://supabase.com/dashboard/project/kfxetwuuzljhybfgmpuc/sql");
console.log("2. Copy and paste the SQL below");
console.log('3. Click "Run"\n');
console.log("=" * 80 + "\n");

const sql = `
-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the main unified vectors table
CREATE TABLE IF NOT EXISTS siam_vectors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding dimensions
  source_type TEXT NOT NULL CHECK (source_type IN ('knowledge', 'jira', 'git', 'email', 'metrics', 'openai_import', 'cache', 'aoma_docs')),
  source_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Performance optimization indexes
  CONSTRAINT unique_source UNIQUE(source_type, source_id)
);

-- Create indexes for blazing fast queries
CREATE INDEX IF NOT EXISTS siam_vectors_embedding_idx 
  ON siam_vectors 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS siam_vectors_source_type_idx 
  ON siam_vectors(source_type);

CREATE INDEX IF NOT EXISTS siam_vectors_metadata_idx 
  ON siam_vectors 
  USING gin(metadata);

CREATE INDEX IF NOT EXISTS siam_vectors_created_at_idx 
  ON siam_vectors(created_at DESC);

-- Function to search vectors with similarity
CREATE OR REPLACE FUNCTION match_aoma_vectors(
  query_embedding vector(1536),
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
    (filter_source_types IS NULL OR v.source_type = ANY(filter_source_types))
    AND (query_embedding IS NULL OR (1 - (v.embedding <=> query_embedding)) > match_threshold)
  ORDER BY 
    CASE WHEN query_embedding IS NOT NULL THEN v.embedding <=> query_embedding ELSE 0 END
  LIMIT match_count;
END;
$$;

-- Grant appropriate permissions
GRANT ALL ON siam_vectors TO authenticated;
GRANT ALL ON siam_vectors TO anon;
GRANT EXECUTE ON FUNCTION match_aoma_vectors TO authenticated;
GRANT EXECUTE ON FUNCTION match_aoma_vectors TO anon;

-- Success message
SELECT 'Tables created successfully!' as message;
`;

console.log(sql);
console.log("\n" + "=" * 80 + "\n");
console.log("After running the SQL above in Supabase, run:");
console.log("  node scripts/process-aoma-html-no-embeddings.js");
console.log("\nto process your HTML files into the database.");
