-- Multi-Tenant Vector Store Restructuring (3-Level Hierarchy)
-- Transforms AOMA-specific schema into SIAM enterprise multi-tenant architecture
-- Date: November 1, 2025
-- 
-- CRITICAL DISTINCTION:
-- - SIAM = Our app (the testing/knowledge management platform)
-- - Sony Music/Digital Operations/AOMA = Organization/Division/App being tested
--
-- ENTERPRISE HIERARCHY:
-- Organization → Division → App
-- Example: Sony Music → Digital Operations → AOMA
--          Sony Music → Legal → Contract Manager
--          Sony Music → Finance → Budget Tracker
--
-- This migration:
-- 1. Renames aoma_unified_vectors → siam_vectors
-- 2. Adds 3-level multi-tenancy: organization, division, app_under_test
-- 3. Pre-populates existing data with: sony-music / digital-operations / aoma
-- 4. Updates all indexes to partition by org/division/app
-- 5. Updates all functions to work with new schema

BEGIN;

-- ============================================
-- STEP 1: Rename Main Table
-- ============================================

-- Rename the table to reflect SIAM ownership
ALTER TABLE IF EXISTS aoma_unified_vectors RENAME TO siam_vectors;

-- Add comment for clarity
COMMENT ON TABLE siam_vectors IS 
  'SIAM enterprise multi-tenant vector store. 3-level hierarchy: Organization → Division → App Under Test';

-- ============================================
-- STEP 2: Add 3-Level Multi-Tenancy Columns
-- ============================================

-- Add organization column (top level: Sony Music, Universal, etc.)
ALTER TABLE siam_vectors 
  ADD COLUMN IF NOT EXISTS organization VARCHAR(50) NOT NULL DEFAULT 'sony-music';

-- Add division column (mid level: Digital Operations, Legal, Finance, etc.)
ALTER TABLE siam_vectors 
  ADD COLUMN IF NOT EXISTS division VARCHAR(50) NOT NULL DEFAULT 'digital-operations';

-- Add app_under_test column (bottom level: AOMA, Alexandria, etc.)
ALTER TABLE siam_vectors 
  ADD COLUMN IF NOT EXISTS app_under_test VARCHAR(50) NOT NULL DEFAULT 'aoma';

-- Remove defaults after backfilling (new inserts must specify all 3 levels)
ALTER TABLE siam_vectors ALTER COLUMN organization DROP DEFAULT;
ALTER TABLE siam_vectors ALTER COLUMN division DROP DEFAULT;
ALTER TABLE siam_vectors ALTER COLUMN app_under_test DROP DEFAULT;

-- Add constraints to ensure valid naming (lowercase, alphanumeric, hyphens, underscores)
ALTER TABLE siam_vectors
  ADD CONSTRAINT valid_organization 
  CHECK (organization ~ '^[a-z][a-z0-9_-]*$');

ALTER TABLE siam_vectors
  ADD CONSTRAINT valid_division 
  CHECK (division ~ '^[a-z][a-z0-9_-]*$');

ALTER TABLE siam_vectors
  ADD CONSTRAINT valid_app_under_test 
  CHECK (app_under_test ~ '^[a-z][a-z0-9_-]*$');

-- Update the unique constraint to include full hierarchy
ALTER TABLE siam_vectors
  DROP CONSTRAINT IF EXISTS unique_source;

ALTER TABLE siam_vectors
  ADD CONSTRAINT unique_source_per_app 
  UNIQUE(organization, division, app_under_test, source_type, source_id);

COMMENT ON CONSTRAINT unique_source_per_app ON siam_vectors IS 
  'Ensures unique vectors per org/division/app/source combination';

-- ============================================
-- STEP 3: Update Indexes for 3-Level Multi-Tenancy
-- ============================================

-- Drop old AOMA-specific indexes
DROP INDEX IF EXISTS aoma_unified_vectors_embedding_hnsw_idx;
DROP INDEX IF EXISTS aoma_unified_vectors_source_type_idx;
DROP INDEX IF EXISTS aoma_unified_vectors_metadata_idx;
DROP INDEX IF EXISTS aoma_unified_vectors_created_at_idx;
DROP INDEX IF EXISTS aoma_unified_vectors_source_embedding_idx;

-- Primary HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS siam_vectors_embedding_hnsw_idx 
  ON siam_vectors 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Hierarchy filtering indexes (most common query patterns)
CREATE INDEX IF NOT EXISTS siam_vectors_org_idx 
  ON siam_vectors(organization);

CREATE INDEX IF NOT EXISTS siam_vectors_org_div_idx 
  ON siam_vectors(organization, division);

CREATE INDEX IF NOT EXISTS siam_vectors_org_div_app_idx 
  ON siam_vectors(organization, division, app_under_test);

-- Compound indexes for filtered searches
CREATE INDEX IF NOT EXISTS siam_vectors_full_hierarchy_source_idx 
  ON siam_vectors(organization, division, app_under_test, source_type);

CREATE INDEX IF NOT EXISTS siam_vectors_full_hierarchy_created_idx 
  ON siam_vectors(organization, division, app_under_test, created_at DESC);

-- Metadata JSONB index
CREATE INDEX IF NOT EXISTS siam_vectors_metadata_idx 
  ON siam_vectors USING gin(metadata);

-- Embedding searches filtered by full hierarchy
CREATE INDEX IF NOT EXISTS siam_vectors_hierarchy_embedding_idx 
  ON siam_vectors(organization, division, app_under_test, id)
  WHERE embedding IS NOT NULL;

-- Add helpful index comments
COMMENT ON INDEX siam_vectors_embedding_hnsw_idx IS 
  'HNSW index for fast similarity search - use org/division/app filtering in WHERE clause';
COMMENT ON INDEX siam_vectors_org_div_app_idx IS 
  'Primary multi-tenant filter - essential for all app-specific queries';

-- ============================================
-- STEP 4: Update Functions for 3-Level Multi-Tenancy
-- ============================================

-- Drop old AOMA-specific functions
DROP FUNCTION IF EXISTS match_aoma_vectors;
DROP FUNCTION IF EXISTS match_aoma_vectors_fast;
DROP FUNCTION IF EXISTS upsert_aoma_vector;

-- New 3-level multi-tenant vector match function
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
  content text,
  source_type text,
  source_id text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set HNSW search parameter for accuracy/speed balance
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

COMMENT ON FUNCTION match_siam_vectors IS 
  'Search vectors for a specific org/division/app with similarity threshold filtering';

-- Fast search without threshold (3-10ms queries!)
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
  content text,
  source_type text,
  source_id text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Lower ef_search for maximum speed
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

COMMENT ON FUNCTION match_siam_vectors_fast IS 
  'Fast search for a specific org/division/app without threshold filtering';

-- Upsert function for 3-level multi-tenant data
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

COMMENT ON FUNCTION upsert_siam_vector IS 
  'Upsert a vector for a specific org/division/app';

-- Helper function to search across an entire division (all apps)
CREATE OR REPLACE FUNCTION match_siam_vectors_by_division(
  p_organization VARCHAR(50),
  p_division VARCHAR(50),
  query_embedding vector(1536),
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

COMMENT ON FUNCTION match_siam_vectors_by_division IS 
  'Search vectors across all apps in a division (e.g., all Digital Operations apps)';

-- ============================================
-- STEP 5: Update Migration Status Table
-- ============================================

-- Rename migration status table
ALTER TABLE IF EXISTS aoma_migration_status RENAME TO siam_migration_status;

-- Add 3-level hierarchy columns
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
  ADD CONSTRAINT unique_migration_per_app 
  UNIQUE(organization, division, app_under_test, source_type);

-- ============================================
-- STEP 6: Update Analytics Views
-- ============================================

-- Drop old views
DROP VIEW IF EXISTS aoma_vector_stats;

-- Detailed stats per org/division/app/source
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

COMMENT ON VIEW siam_vector_stats IS 
  'Detailed statistics per org/division/app/source';

-- App-level summary stats
CREATE OR REPLACE VIEW siam_app_stats AS
SELECT 
  organization,
  division,
  app_under_test,
  COUNT(*) as total_vectors,
  COUNT(DISTINCT source_type) as source_types,
  MIN(created_at) as first_ingested,
  MAX(updated_at) as last_updated,
  pg_size_pretty(SUM(pg_column_size(embedding))::bigint) as total_storage
FROM siam_vectors
GROUP BY organization, division, app_under_test;

COMMENT ON VIEW siam_app_stats IS 
  'Summary statistics per app under test';

-- Division-level rollup stats
CREATE OR REPLACE VIEW siam_division_stats AS
SELECT 
  organization,
  division,
  COUNT(DISTINCT app_under_test) as total_apps,
  COUNT(*) as total_vectors,
  pg_size_pretty(SUM(pg_column_size(embedding))::bigint) as total_storage
FROM siam_vectors
GROUP BY organization, division;

COMMENT ON VIEW siam_division_stats IS 
  'Summary statistics per division (e.g., Digital Operations)';

-- Organization-level rollup stats
CREATE OR REPLACE VIEW siam_organization_stats AS
SELECT 
  organization,
  COUNT(DISTINCT division) as total_divisions,
  COUNT(DISTINCT app_under_test) as total_apps,
  COUNT(*) as total_vectors,
  pg_size_pretty(SUM(pg_column_size(embedding))::bigint) as total_storage
FROM siam_vectors
GROUP BY organization;

COMMENT ON VIEW siam_organization_stats IS 
  'Top-level statistics per organization (e.g., Sony Music)';

-- ============================================
-- STEP 7: Update Performance Monitoring
-- ============================================

DROP FUNCTION IF EXISTS check_vector_index_performance;

CREATE OR REPLACE FUNCTION check_siam_index_performance()
RETURNS TABLE (
  index_name text,
  index_size text,
  index_scans bigint,
  avg_tuples_per_scan numeric
)
LANGUAGE sql
AS $$
  SELECT 
    indexrelname::text as index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    idx_scan as index_scans,
    CASE 
      WHEN idx_scan > 0 THEN round(idx_tup_fetch::numeric / idx_scan, 2)
      ELSE 0
    END as avg_tuples_per_scan
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public' 
    AND tablename = 'siam_vectors'
  ORDER BY idx_scan DESC;
$$;

COMMENT ON FUNCTION check_siam_index_performance IS 
  'Monitor SIAM vector index performance';

-- ============================================
-- STEP 8: Update Permissions
-- ============================================

-- Grant permissions on renamed resources
GRANT ALL ON siam_vectors TO authenticated;
GRANT ALL ON siam_migration_status TO authenticated;
GRANT SELECT ON siam_vector_stats TO authenticated;
GRANT SELECT ON siam_app_stats TO authenticated;
GRANT SELECT ON siam_division_stats TO authenticated;
GRANT SELECT ON siam_organization_stats TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION match_siam_vectors TO authenticated;
GRANT EXECUTE ON FUNCTION match_siam_vectors_fast TO authenticated;
GRANT EXECUTE ON FUNCTION match_siam_vectors_by_division TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_siam_vector TO authenticated;
GRANT EXECUTE ON FUNCTION check_siam_index_performance TO authenticated;

-- ============================================
-- STEP 9: Update Table Statistics
-- ============================================

ANALYZE siam_vectors;
ANALYZE siam_migration_status;

COMMIT;

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- 
-- 3-LEVEL HIERARCHY SUMMARY:
-- ✅ aoma_unified_vectors → siam_vectors
-- ✅ Added organization column (pre-populated: 'sony-music')
-- ✅ Added division column (pre-populated: 'digital-operations')
-- ✅ Added app_under_test column (pre-populated: 'aoma')
-- ✅ Updated all indexes for enterprise multi-tenant queries
-- ✅ Updated all functions to require full org/division/app hierarchy
-- ✅ Created 4-level analytics views (org → division → app → source)
-- ✅ Updated migration tracking table
-- ✅ Updated permissions
--
-- EXISTING DATA STATUS:
-- All existing vectors are now tagged as:
--   organization: 'sony-music'
--   division: 'digital-operations'
--   app_under_test: 'aoma'
--
-- EXAMPLE FUTURE DATA:
--   organization: 'sony-music', division: 'legal', app_under_test: 'contract-manager'
--   organization: 'sony-music', division: 'finance', app_under_test: 'budget-tracker'
--
-- To verify the migration:
-- SELECT * FROM siam_organization_stats;
-- SELECT * FROM siam_division_stats WHERE division = 'digital-operations';
-- SELECT * FROM siam_app_stats WHERE app_under_test = 'aoma';
-- SELECT COUNT(*) FROM siam_vectors WHERE organization = 'sony-music' AND division = 'digital-operations' AND app_under_test = 'aoma';
