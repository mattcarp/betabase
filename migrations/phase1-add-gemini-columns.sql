-- ============================================================
-- PHASE 1: Add Gemini Embedding Columns (Zero Downtime)
-- ============================================================
-- FINAL VERSION: 23 vector columns across all tables
-- - 13 columns with data: Add parallel embedding_gemini column
-- - 10 empty columns: Directly ALTER to vector(768)
-- 
-- Total embeddings to migrate: 39,361
-- 
-- Date: 2024-11-24
-- Project: SIAM - OpenAI to Gemini Embedding Migration
-- ============================================================

-- ============================================================
-- SECTION A: TABLES WITH DATA (Add parallel columns)
-- These get embedding_gemini columns alongside existing 1536d
-- ============================================================

-- 1. jira_ticket_embeddings (16,563 rows)
ALTER TABLE jira_ticket_embeddings 
  ADD COLUMN IF NOT EXISTS embedding_gemini vector(768);
ALTER TABLE jira_ticket_embeddings 
  ADD COLUMN IF NOT EXISTS embedding_source TEXT DEFAULT 'openai';

-- 2. siam_vectors (15,245 rows) - already has embedding_gemini
-- Just ensure embedding_source exists
ALTER TABLE siam_vectors 
  ADD COLUMN IF NOT EXISTS embedding_source TEXT DEFAULT 'openai';

-- 3. git_file_embeddings (4,091 rows)
ALTER TABLE git_file_embeddings 
  ADD COLUMN IF NOT EXISTS embedding_gemini vector(768);
ALTER TABLE git_file_embeddings 
  ADD COLUMN IF NOT EXISTS embedding_source TEXT DEFAULT 'openai';

-- 4. jira_tickets (1,406 with embeddings)
ALTER TABLE jira_tickets 
  ADD COLUMN IF NOT EXISTS embedding_gemini vector(768);
ALTER TABLE jira_tickets 
  ADD COLUMN IF NOT EXISTS embedding_source TEXT DEFAULT 'openai';

-- 5. crawled_pages (916 rows) - note: column is content_embedding
ALTER TABLE crawled_pages 
  ADD COLUMN IF NOT EXISTS embedding_gemini vector(768);
ALTER TABLE crawled_pages 
  ADD COLUMN IF NOT EXISTS embedding_source TEXT DEFAULT 'openai';

-- 6. code_files (503 with embeddings)
ALTER TABLE code_files 
  ADD COLUMN IF NOT EXISTS embedding_gemini vector(768);
ALTER TABLE code_files 
  ADD COLUMN IF NOT EXISTS embedding_source TEXT DEFAULT 'openai';

-- 7. wiki_documents (394 rows)
ALTER TABLE wiki_documents 
  ADD COLUMN IF NOT EXISTS embedding_gemini vector(768);
ALTER TABLE wiki_documents 
  ADD COLUMN IF NOT EXISTS embedding_source TEXT DEFAULT 'openai';

-- 8. app_pages (128 rows)
ALTER TABLE app_pages 
  ADD COLUMN IF NOT EXISTS embedding_gemini vector(768);
ALTER TABLE app_pages 
  ADD COLUMN IF NOT EXISTS embedding_source TEXT DEFAULT 'openai';

-- 9. git_commits (99 rows)
ALTER TABLE git_commits 
  ADD COLUMN IF NOT EXISTS embedding_gemini vector(768);
ALTER TABLE git_commits 
  ADD COLUMN IF NOT EXISTS embedding_source TEXT DEFAULT 'openai';

-- 10. test_results (10 rows)
ALTER TABLE test_results 
  ADD COLUMN IF NOT EXISTS embedding_gemini vector(768);
ALTER TABLE test_results 
  ADD COLUMN IF NOT EXISTS embedding_source TEXT DEFAULT 'openai';

-- 11. siam_git_files (3 rows)
ALTER TABLE siam_git_files 
  ADD COLUMN IF NOT EXISTS embedding_gemini vector(768);
ALTER TABLE siam_git_files 
  ADD COLUMN IF NOT EXISTS embedding_source TEXT DEFAULT 'openai';

-- 12. siam_jira_tickets (2 rows)
ALTER TABLE siam_jira_tickets 
  ADD COLUMN IF NOT EXISTS embedding_gemini vector(768);
ALTER TABLE siam_jira_tickets 
  ADD COLUMN IF NOT EXISTS embedding_source TEXT DEFAULT 'openai';

-- 13. crawler_documents (1 row with embedding)
ALTER TABLE crawler_documents 
  ADD COLUMN IF NOT EXISTS embedding_gemini vector(768);
ALTER TABLE crawler_documents 
  ADD COLUMN IF NOT EXISTS embedding_source TEXT DEFAULT 'openai';

-- ============================================================
-- SECTION B: EMPTY TABLES (Direct ALTER - no data to lose)
-- These can have their column type changed directly
-- ============================================================

-- 14. beta_base_scenarios (0 embeddings, 6250 rows total)
ALTER TABLE beta_base_scenarios 
  ALTER COLUMN embedding TYPE vector(768);

-- 15. siam_meeting_transcriptions (0 rows)
ALTER TABLE siam_meeting_transcriptions 
  ALTER COLUMN embedding TYPE vector(768);

-- 16. siam_web_crawl_results (0 rows)
ALTER TABLE siam_web_crawl_results 
  ALTER COLUMN embedding TYPE vector(768);

-- 17. aoma_ui_elements (0 rows)
ALTER TABLE aoma_ui_elements 
  ALTER COLUMN embedding TYPE vector(768);

-- 18. test_knowledge_base (0 rows)
ALTER TABLE test_knowledge_base 
  ALTER COLUMN embedding TYPE vector(768);

-- 19. aqm_audio_knowledge (0 rows) - column is content_embedding
ALTER TABLE aqm_audio_knowledge 
  ALTER COLUMN content_embedding TYPE vector(768);

-- 20. firecrawl_analysis (0 rows) - column is content_embedding
ALTER TABLE firecrawl_analysis 
  ALTER COLUMN content_embedding TYPE vector(768);

-- 21-22. pages (0 rows) - has both embedding and content_embedding
ALTER TABLE pages 
  ALTER COLUMN embedding TYPE vector(768);
ALTER TABLE pages 
  ALTER COLUMN content_embedding TYPE vector(768);

-- 23. curation_items (0 embeddings) - column is original_embedding
ALTER TABLE curation_items 
  ALTER COLUMN original_embedding TYPE vector(768);

-- ============================================================
-- SECTION C: CREATE HNSW INDEXES
-- ============================================================

-- Indexes for tables with data (on the new gemini column)
CREATE INDEX CONCURRENTLY IF NOT EXISTS jira_ticket_embeddings_gemini_idx 
  ON jira_ticket_embeddings USING hnsw (embedding_gemini vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS git_file_embeddings_gemini_idx 
  ON git_file_embeddings USING hnsw (embedding_gemini vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS jira_tickets_embedding_gemini_idx 
  ON jira_tickets USING hnsw (embedding_gemini vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS crawled_pages_embedding_gemini_idx 
  ON crawled_pages USING hnsw (embedding_gemini vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS code_files_embedding_gemini_idx 
  ON code_files USING hnsw (embedding_gemini vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS wiki_documents_embedding_gemini_idx 
  ON wiki_documents USING hnsw (embedding_gemini vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS app_pages_embedding_gemini_idx 
  ON app_pages USING hnsw (embedding_gemini vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS git_commits_embedding_gemini_idx 
  ON git_commits USING hnsw (embedding_gemini vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS test_results_embedding_gemini_idx 
  ON test_results USING hnsw (embedding_gemini vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS siam_git_files_embedding_gemini_idx 
  ON siam_git_files USING hnsw (embedding_gemini vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS siam_jira_tickets_embedding_gemini_idx 
  ON siam_jira_tickets USING hnsw (embedding_gemini vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS crawler_documents_embedding_gemini_idx 
  ON crawler_documents USING hnsw (embedding_gemini vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- siam_vectors index (may already exist)
CREATE INDEX CONCURRENTLY IF NOT EXISTS siam_vectors_embedding_gemini_hnsw_idx 
  ON siam_vectors USING hnsw (embedding_gemini vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Indexes for altered empty tables (on the main embedding column, now 768d)
CREATE INDEX CONCURRENTLY IF NOT EXISTS beta_base_scenarios_embedding_idx 
  ON beta_base_scenarios USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS siam_meeting_transcriptions_embedding_idx 
  ON siam_meeting_transcriptions USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS siam_web_crawl_results_embedding_idx 
  ON siam_web_crawl_results USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS aoma_ui_elements_embedding_idx 
  ON aoma_ui_elements USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS test_knowledge_base_embedding_idx 
  ON test_knowledge_base USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS aqm_audio_knowledge_content_embedding_idx 
  ON aqm_audio_knowledge USING hnsw (content_embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS firecrawl_analysis_content_embedding_idx 
  ON firecrawl_analysis USING hnsw (content_embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS pages_embedding_idx 
  ON pages USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS pages_content_embedding_idx 
  ON pages USING hnsw (content_embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS curation_items_original_embedding_idx 
  ON curation_items USING hnsw (original_embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- ============================================================
-- SECTION D: MIGRATION PROGRESS TRACKING
-- ============================================================

CREATE TABLE IF NOT EXISTS embedding_migration_progress (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  migrated_rows INTEGER NOT NULL DEFAULT 0,
  failed_rows INTEGER NOT NULL DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'schema_only')) DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_processed_id TEXT,
  error_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(table_name, column_name)
);

-- Initialize progress tracking
INSERT INTO embedding_migration_progress (table_name, column_name, total_rows, status)
VALUES 
  -- Tables with data (need re-embedding)
  ('jira_ticket_embeddings', 'embedding', 16563, 'pending'),
  ('siam_vectors', 'embedding', 15245, 'pending'),
  ('git_file_embeddings', 'embedding', 4091, 'pending'),
  ('jira_tickets', 'embedding', 1406, 'pending'),
  ('crawled_pages', 'content_embedding', 916, 'pending'),
  ('code_files', 'embedding', 503, 'pending'),
  ('wiki_documents', 'embedding', 394, 'pending'),
  ('app_pages', 'embedding', 128, 'pending'),
  ('git_commits', 'embedding', 99, 'pending'),
  ('test_results', 'embedding', 10, 'pending'),
  ('siam_git_files', 'embedding', 3, 'pending'),
  ('siam_jira_tickets', 'embedding', 2, 'pending'),
  ('crawler_documents', 'embedding', 1, 'pending'),
  -- Empty tables (schema-only, already done by ALTER)
  ('beta_base_scenarios', 'embedding', 0, 'schema_only'),
  ('siam_meeting_transcriptions', 'embedding', 0, 'schema_only'),
  ('siam_web_crawl_results', 'embedding', 0, 'schema_only'),
  ('aoma_ui_elements', 'embedding', 0, 'schema_only'),
  ('test_knowledge_base', 'embedding', 0, 'schema_only'),
  ('aqm_audio_knowledge', 'content_embedding', 0, 'schema_only'),
  ('firecrawl_analysis', 'content_embedding', 0, 'schema_only'),
  ('pages', 'embedding', 0, 'schema_only'),
  ('pages', 'content_embedding', 0, 'schema_only'),
  ('curation_items', 'original_embedding', 0, 'schema_only')
ON CONFLICT (table_name, column_name) DO UPDATE SET
  total_rows = EXCLUDED.total_rows,
  updated_at = NOW();

GRANT ALL ON embedding_migration_progress TO authenticated, service_role;

-- ============================================================
-- SUMMARY
-- ============================================================
SELECT 'Phase 1 complete!' as status;
SELECT '23 vector columns processed:' as info;
SELECT '  - 13 columns with data: Added embedding_gemini columns' as detail1;
SELECT '  - 10 empty columns: Altered to vector(768)' as detail2;
SELECT '  - 39,361 embeddings ready for Phase 2 re-embedding' as detail3;
