# Supabase Function Deployment Guide

## Problem

The `match_aoma_vectors` function is missing from your Supabase database, causing vector search to fail.

## Solution

Deploy the function manually using the Supabase SQL Editor.

## Steps

### 1. Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `kfxetwuuzljhybfgmpuc`
3. Navigate to **SQL Editor** in the left sidebar

### 2. Run the SQL Script

Copy and paste the contents of `sql/create-match-aoma-vectors-function.sql`:

```sql
-- Create the match_aoma_vectors function for vector similarity search
-- This function searches across all knowledge sources using vector embeddings

CREATE OR REPLACE FUNCTION match_aoma_vectors (
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
  similarity float,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id,
    k.content,
    k.source_type,
    k.source_id,
    k.metadata,
    1 - (k.embedding <=> query_embedding) as similarity,
    k.created_at
  FROM aoma_vectors k
  WHERE
    (filter_source_types IS NULL OR k.source_type = ANY(filter_source_types))
    AND k.embedding IS NOT NULL
    AND 1 - (k.embedding <=> query_embedding) > match_threshold
  ORDER BY k.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION match_aoma_vectors TO anon, authenticated, service_role;

-- Create the aoma_vectors table if it doesn't exist
CREATE TABLE IF NOT EXISTS aoma_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'knowledge', 'jira', 'git', 'email', 'confluence', etc.
  source_id TEXT,
  metadata JSONB DEFAULT '{}',
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_aoma_vectors_source_type ON aoma_vectors(source_type);
CREATE INDEX IF NOT EXISTS idx_aoma_vectors_embedding ON aoma_vectors
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_aoma_vectors_created_at ON aoma_vectors(created_at DESC);

-- Add RLS policies
ALTER TABLE aoma_vectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to aoma_vectors" ON aoma_vectors
  FOR SELECT
  TO anon, authenticated, service_role
  USING (true);

CREATE POLICY "Allow service role full access to aoma_vectors" ON aoma_vectors
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### 3. Click "Run" to execute the SQL

### 4. Verify Deployment

Run this query to check if the function was created:

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'match_aoma_vectors';
```

You should see one row returned with:

- `routine_name`: match_aoma_vectors
- `routine_type`: FUNCTION

## What This Fix Does

1. **Creates the `match_aoma_vectors` function** - Enables vector similarity search across all knowledge sources
2. **Creates the `aoma_vectors` table** - Stores embedded knowledge from AOMA, Jira, Git, etc.
3. **Adds performance indexes** - IVFFlat index for fast cosine similarity search
4. **Sets up RLS policies** - Secure row-level access control

## After Deployment

Once deployed, the AOMA chat will:

- ✅ Successfully query Supabase vector store
- ✅ Find relevant knowledge using vector embeddings
- ✅ Provide accurate answers based on stored knowledge
- ✅ Fall back to Railway MCP only if Supabase has no results

## Need Help?

Contact matt@mattcarpenter.com if you encounter any issues.
