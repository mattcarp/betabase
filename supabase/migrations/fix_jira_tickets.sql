
-- Fix jira_tickets table with 768 dimensions

CREATE TABLE IF NOT EXISTS public.jira_tickets (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  summary TEXT,
  metadata JSONB,
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.jira_tickets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Service role can manage jira_tickets" ON public.jira_tickets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can read jira_tickets" ON public.jira_tickets FOR SELECT TO authenticated USING (true);

-- Index
CREATE INDEX IF NOT EXISTS jira_tickets_embedding_idx ON public.jira_tickets USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function
CREATE OR REPLACE FUNCTION match_jira_tickets(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id text,
  content text,
  summary text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    jira_tickets.id,
    jira_tickets.content,
    jira_tickets.summary,
    jira_tickets.metadata,
    1 - (jira_tickets.embedding <=> query_embedding) as similarity
  FROM jira_tickets
  WHERE 1 - (jira_tickets.embedding <=> query_embedding) > match_threshold
  ORDER BY jira_tickets.embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT ALL ON public.jira_tickets TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION match_jira_tickets TO postgres, anon, authenticated, service_role;
