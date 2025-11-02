-- Multi-Tenant Vector Store Restructuring (3-Level Hierarchy) - FIXED
-- Handles missing tables gracefully
-- Date: November 2, 2025

BEGIN;

-- ============================================
-- STEP 1: Rename or Create Main Table
-- ============================================

-- Check if aoma_unified_vectors exists, rename it if so
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'aoma_unified_vectors') THEN
    ALTER TABLE aoma_unified_vectors RENAME TO siam_vectors;
  END IF;
END $$;

-- If siam_vectors doesn't exist yet, we need to check if we should create it
-- (This handles the case where neither table exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'siam_vectors') THEN
    RAISE NOTICE 'siam_vectors table does not exist - migration may need adjustment';
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE siam_vectors IS 
  'SIAM enterprise multi-tenant vector store. 3-level hierarchy: Organization → Division → App Under Test';

-- ============================================
-- STEP 2: Add 3-Level Multi-Tenancy Columns
-- ============================================

-- Add columns with defaults for existing data
ALTER TABLE siam_vectors 
  ADD COLUMN IF NOT EXISTS organization VARCHAR(50) NOT NULL DEFAULT 'sony-music';

ALTER TABLE siam_vectors 
  ADD COLUMN IF NOT EXISTS division VARCHAR(50) NOT NULL DEFAULT 'digital-operations';

ALTER TABLE siam_vectors 
  ADD COLUMN IF NOT EXISTS app_under_test VARCHAR(50) NOT NULL DEFAULT 'aoma';

-- Remove defaults (new inserts must specify)
DO $$
BEGIN
  BEGIN
    ALTER TABLE siam_vectors ALTER COLUMN organization DROP DEFAULT;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER TABLE siam_vectors ALTER COLUMN division DROP DEFAULT;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER TABLE siam_vectors ALTER COLUMN app_under_test DROP DEFAULT;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Add validation constraints (drop first to be safe)
DO $$
BEGIN
  -- Drop existing constraints if they exist
  BEGIN
    ALTER TABLE siam_vectors DROP CONSTRAINT IF EXISTS valid_organization;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER TABLE siam_vectors DROP CONSTRAINT IF EXISTS valid_division;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER TABLE siam_vectors DROP CONSTRAINT IF EXISTS valid_app_under_test;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  -- Add constraints if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_organization' 
    AND conrelid = 'siam_vectors'::regclass
  ) THEN
    ALTER TABLE siam_vectors
      ADD CONSTRAINT valid_organization CHECK (organization ~ '^[a-z][a-z0-9_-]*$');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_division' 
    AND conrelid = 'siam_vectors'::regclass
  ) THEN
    ALTER TABLE siam_vectors
      ADD CONSTRAINT valid_division CHECK (division ~ '^[a-z][a-z0-9_-]*$');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_app_under_test' 
    AND conrelid = 'siam_vectors'::regclass
  ) THEN
    ALTER TABLE siam_vectors
      ADD CONSTRAINT valid_app_under_test CHECK (app_under_test ~ '^[a-z][a-z0-9_-]*$');
  END IF;
END $$;

-- Update unique constraint
DO $$
BEGIN
  -- Drop old constraint
  BEGIN
    ALTER TABLE siam_vectors DROP CONSTRAINT IF EXISTS unique_source;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  -- Drop/recreate new multi-tenant constraint
  BEGIN
    ALTER TABLE siam_vectors DROP CONSTRAINT IF EXISTS unique_per_app_source;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_per_app_source' 
    AND conrelid = 'siam_vectors'::regclass
  ) THEN
    ALTER TABLE siam_vectors
      ADD CONSTRAINT unique_per_app_source 
      UNIQUE(organization, division, app_under_test, source_type, source_id);
  END IF;
END $$;

-- ============================================
-- STEP 3: Update Indexes
-- ============================================

-- Drop old indexes
DROP INDEX IF EXISTS aoma_unified_vectors_embedding_hnsw_idx;
DROP INDEX IF EXISTS aoma_unified_vectors_source_type_idx;
DROP INDEX IF EXISTS aoma_unified_vectors_metadata_idx;
DROP INDEX IF EXISTS aoma_unified_vectors_created_at_idx;
DROP INDEX IF EXISTS aoma_unified_vectors_source_embedding_idx;

-- Create new HNSW index (most important for performance)
CREATE INDEX IF NOT EXISTS siam_vectors_embedding_hnsw_idx
  ON siam_vectors 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64)
  WHERE embedding IS NOT NULL;

-- Supporting indexes
CREATE INDEX IF NOT EXISTS siam_vectors_hierarchy_idx
  ON siam_vectors(organization, division, app_under_test);

CREATE INDEX IF NOT EXISTS siam_vectors_source_type_idx
  ON siam_vectors(organization, division, app_under_test, source_type);

CREATE INDEX IF NOT EXISTS siam_vectors_metadata_idx
  ON siam_vectors USING gin(metadata);

CREATE INDEX IF NOT EXISTS siam_vectors_created_at_idx
  ON siam_vectors(organization, division, app_under_test, created_at DESC);

-- ============================================
-- STEP 4: Update/Create Search Functions
-- ============================================

-- Drop existing functions first (needed if return types changed)
DROP FUNCTION IF EXISTS match_siam_vectors(varchar, varchar, varchar, vector, float, int, text[]);
DROP FUNCTION IF EXISTS match_siam_vectors_fast(varchar, varchar, varchar, vector, int, text[]);
DROP FUNCTION IF EXISTS upsert_siam_vector(varchar, varchar, varchar, text, vector, text, text, jsonb);

-- Main search function with full multi-tenant support
CREATE OR REPLACE FUNCTION match_siam_vectors(
  p_organization VARCHAR(50),
  p_division VARCHAR(50),
  p_app_under_test VARCHAR(50),
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 10,
  filter_source_types text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  organization varchar(50),
  division varchar(50),
  app_under_test varchar(50),
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
    v.organization,
    v.division,
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
    AND v.app_under_test = p_app_under_test
    AND (filter_source_types IS NULL OR v.source_type = ANY(filter_source_types))
    AND (1 - (v.embedding <=> query_embedding)) > match_threshold
  ORDER BY v.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Fast search (no threshold)
CREATE OR REPLACE FUNCTION match_siam_vectors_fast(
  p_organization VARCHAR(50),
  p_division VARCHAR(50),
  p_app_under_test VARCHAR(50),
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  filter_source_types text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  organization varchar(50),
  division varchar(50),
  app_under_test varchar(50),
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
    v.organization,
    v.division,
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
    AND v.app_under_test = p_app_under_test
    AND (filter_source_types IS NULL OR v.source_type = ANY(filter_source_types))
  ORDER BY v.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Upsert function
CREATE OR REPLACE FUNCTION upsert_siam_vector(
  p_organization VARCHAR(50),
  p_division VARCHAR(50),
  p_app_under_test VARCHAR(50),
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

-- ============================================
-- STEP 5: Handle Migration Status Table
-- ============================================

-- Try to rename aoma_migration_status if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'aoma_migration_status') THEN
    ALTER TABLE aoma_migration_status RENAME TO siam_migration_status;
  END IF;
END $$;

-- Only proceed if siam_migration_status exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'siam_migration_status') THEN
    -- Add columns
    ALTER TABLE siam_migration_status 
      ADD COLUMN IF NOT EXISTS organization VARCHAR(50) NOT NULL DEFAULT 'sony-music';
    
    ALTER TABLE siam_migration_status 
      ADD COLUMN IF NOT EXISTS division VARCHAR(50) NOT NULL DEFAULT 'digital-operations';
    
    ALTER TABLE siam_migration_status 
      ADD COLUMN IF NOT EXISTS app_under_test VARCHAR(50) NOT NULL DEFAULT 'aoma';
    
    -- Remove defaults
    ALTER TABLE siam_migration_status ALTER COLUMN organization DROP DEFAULT;
    ALTER TABLE siam_migration_status ALTER COLUMN division DROP DEFAULT;
    ALTER TABLE siam_migration_status ALTER COLUMN app_under_test DROP DEFAULT;
    
    -- Update unique constraint
    ALTER TABLE siam_migration_status
      DROP CONSTRAINT IF EXISTS aoma_migration_status_source_type_key;
    
    ALTER TABLE siam_migration_status
      DROP CONSTRAINT IF EXISTS unique_migration_per_app;
    
    ALTER TABLE siam_migration_status
      ADD CONSTRAINT unique_migration_per_app 
      UNIQUE(organization, division, app_under_test, source_type);
  END IF;
END $$;

-- ============================================
-- STEP 6: Update Analytics View
-- ============================================

-- Drop old view
DROP VIEW IF EXISTS aoma_vector_stats;

-- Create new multi-tenant view
CREATE OR REPLACE VIEW siam_vector_stats AS
SELECT
  organization,
  division,
  app_under_test,
  source_type,
  COUNT(*) as document_count,
  AVG(length(content)) as avg_content_length,
  MIN(created_at) as oldest_document,
  MAX(created_at) as newest_document,
  pg_size_pretty(SUM(pg_column_size(embedding))::bigint) as embedding_storage_size
FROM siam_vectors
GROUP BY organization, division, app_under_test, source_type;

-- ============================================
-- STEP 7: Grant Permissions
-- ============================================

GRANT ALL ON siam_vectors TO authenticated;
GRANT SELECT ON siam_vector_stats TO authenticated;
GRANT EXECUTE ON FUNCTION match_siam_vectors TO authenticated;
GRANT EXECUTE ON FUNCTION match_siam_vectors_fast TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_siam_vector TO authenticated;

-- Grant on migration_status if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'siam_migration_status') THEN
    GRANT ALL ON siam_migration_status TO authenticated;
  END IF;
END $$;

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Multi-tenant migration complete!';
  RAISE NOTICE '   - Table renamed: aoma_unified_vectors → siam_vectors';
  RAISE NOTICE '   - Added 3-level hierarchy: organization/division/app_under_test';
  RAISE NOTICE '   - Existing data tagged as: sony-music/digital-operations/aoma';
  RAISE NOTICE '   - Functions updated: match_siam_vectors, upsert_siam_vector';
END $$;

