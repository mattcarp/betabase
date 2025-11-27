-- Gemini 768 Dimension Migration
-- Alters ALL embedding columns to vector(768)

-- Drop all existing vector indexes first
DROP INDEX IF EXISTS wiki_documents_embedding_idx;
DROP INDEX IF EXISTS crawled_pages_content_embedding_idx;
DROP INDEX IF EXISTS app_pages_embedding_idx;
DROP INDEX IF EXISTS code_files_embedding_idx;
DROP INDEX IF EXISTS jira_tickets_embedding_idx;
DROP INDEX IF EXISTS siam_vectors_embedding_idx;
DROP INDEX IF EXISTS beta_base_scenarios_embedding_idx;
DROP INDEX IF EXISTS test_results_embedding_idx;
DROP INDEX IF EXISTS git_commits_embedding_idx;

-- Alter all embedding columns to vector(768), setting to NULL
ALTER TABLE wiki_documents ALTER COLUMN embedding TYPE vector(768) USING NULL;
ALTER TABLE crawled_pages ALTER COLUMN content_embedding TYPE vector(768) USING NULL;
ALTER TABLE app_pages ALTER COLUMN embedding TYPE vector(768) USING NULL;
ALTER TABLE code_files ALTER COLUMN embedding TYPE vector(768) USING NULL;
ALTER TABLE jira_tickets ALTER COLUMN embedding TYPE vector(768) USING NULL;
ALTER TABLE siam_vectors ALTER COLUMN embedding TYPE vector(768) USING NULL;
ALTER TABLE beta_base_scenarios ALTER COLUMN embedding TYPE vector(768) USING NULL;
ALTER TABLE test_results ALTER COLUMN embedding TYPE vector(768) USING NULL;
ALTER TABLE git_commits ALTER COLUMN embedding TYPE vector(768) USING NULL;

-- Recreate indexes with new dimension
CREATE INDEX IF NOT EXISTS wiki_documents_embedding_idx ON wiki_documents 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS crawled_pages_embedding_idx ON crawled_pages 
USING ivfflat (content_embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS app_pages_embedding_idx ON app_pages 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

CREATE INDEX IF NOT EXISTS code_files_embedding_idx ON code_files 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS jira_tickets_embedding_idx ON jira_tickets 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS siam_vectors_embedding_idx ON siam_vectors 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS beta_base_scenarios_embedding_idx ON beta_base_scenarios 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS test_results_embedding_idx ON test_results 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

CREATE INDEX IF NOT EXISTS git_commits_embedding_idx ON git_commits 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
