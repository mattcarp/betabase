-- AOMA MESH MCP - Complete Table Setup
-- Creates all necessary tables for the knowledge base system

-- 1. AOMA Knowledge Base (main table for AOMA content)
CREATE TABLE IF NOT EXISTS aoma_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  content_hash TEXT,
  crawled_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  embedding vector(1536), -- OpenAI embeddings
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_aoma_knowledge_url ON aoma_knowledge(url);
CREATE INDEX IF NOT EXISTS idx_aoma_knowledge_search ON aoma_knowledge USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_aoma_knowledge_embedding ON aoma_knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 2. Confluence Knowledge Base
CREATE TABLE IF NOT EXISTS confluence_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT UNIQUE NOT NULL,
  space_key TEXT,
  title TEXT,
  content TEXT NOT NULL,
  url TEXT,
  author TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  crawled_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  embedding vector(1536),
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_confluence_knowledge_page_id ON confluence_knowledge(page_id);
CREATE INDEX IF NOT EXISTS idx_confluence_knowledge_space ON confluence_knowledge(space_key);
CREATE INDEX IF NOT EXISTS idx_confluence_knowledge_search ON confluence_knowledge USING GIN(search_vector);

-- 3. Alexandria Knowledge Base
CREATE TABLE IF NOT EXISTS alexandria_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT UNIQUE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  url TEXT,
  document_type TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  crawled_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  embedding vector(1536),
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_alexandria_knowledge_doc_id ON alexandria_knowledge(document_id);
CREATE INDEX IF NOT EXISTS idx_alexandria_knowledge_search ON alexandria_knowledge USING GIN(search_vector);

-- 4. Jira Issues (already exists but let's ensure structure)
CREATE TABLE IF NOT EXISTS jira_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_key TEXT UNIQUE NOT NULL,
  project_key TEXT,
  issue_type TEXT,
  status TEXT,
  priority TEXT,
  summary TEXT,
  description TEXT,
  assignee TEXT,
  reporter TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  embedding vector(1536),
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(summary, '') || ' ' || coalesce(description, ''))
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_jira_issues_key ON jira_issues(issue_key);
CREATE INDEX IF NOT EXISTS idx_jira_issues_project ON jira_issues(project_key);
CREATE INDEX IF NOT EXISTS idx_jira_issues_search ON jira_issues USING GIN(search_vector);

-- 5. Unified Knowledge View (combines all sources)
CREATE OR REPLACE VIEW unified_knowledge AS
  SELECT 
    'aoma' as source,
    id,
    title,
    content,
    url,
    crawled_at,
    metadata,
    embedding
  FROM aoma_knowledge
  UNION ALL
  SELECT 
    'confluence' as source,
    id,
    title,
    content,
    url,
    crawled_at,
    metadata,
    embedding
  FROM confluence_knowledge
  UNION ALL
  SELECT 
    'alexandria' as source,
    id,
    title,
    content,
    url,
    crawled_at,
    metadata,
    embedding
  FROM alexandria_knowledge;

-- 6. Search function for AOMA knowledge
CREATE OR REPLACE FUNCTION search_aoma_knowledge(
  query_text TEXT,
  similarity_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  url TEXT,
  crawled_at TIMESTAMPTZ,
  metadata JSONB,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ak.id,
    ak.title,
    ak.content,
    ak.url,
    ak.crawled_at,
    ak.metadata,
    1.0 as similarity -- Placeholder, will be updated when embeddings are added
  FROM aoma_knowledge ak
  WHERE ak.search_vector @@ plainto_tsquery('english', query_text)
  ORDER BY ts_rank(ak.search_vector, plainto_tsquery('english', query_text)) DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Update triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_aoma_knowledge_updated_at
  BEFORE UPDATE ON aoma_knowledge
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_confluence_knowledge_updated_at
  BEFORE UPDATE ON confluence_knowledge
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_alexandria_knowledge_updated_at
  BEFORE UPDATE ON alexandria_knowledge
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 8. Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 9. Enable RLS
ALTER TABLE aoma_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE confluence_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE alexandria_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE jira_issues ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow read for authenticated, full access for service role)
CREATE POLICY "Allow read for authenticated" ON aoma_knowledge
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all for service role" ON aoma_knowledge
  FOR ALL TO service_role USING (true);

CREATE POLICY "Allow read for authenticated" ON confluence_knowledge
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all for service role" ON confluence_knowledge
  FOR ALL TO service_role USING (true);

CREATE POLICY "Allow read for authenticated" ON alexandria_knowledge
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all for service role" ON alexandria_knowledge
  FOR ALL TO service_role USING (true);

CREATE POLICY "Allow read for authenticated" ON jira_issues
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all for service role" ON jira_issues
  FOR ALL TO service_role USING (true);

-- Done!
SELECT 'AOMA Mesh MCP tables created successfully!' as status;