-- Create JIRA tickets table for storing support ticket embeddings
-- This enhances the AI assistant with real user support data

-- Create table
CREATE TABLE IF NOT EXISTS public.jira_tickets (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  summary TEXT,
  metadata JSONB,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.jira_tickets ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage jira_tickets"
  ON public.jira_tickets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can read jira_tickets"
  ON public.jira_tickets
  FOR SELECT
  TO authenticated
  USING (true);

-- Create vector search index
CREATE INDEX IF NOT EXISTS jira_tickets_embedding_idx 
  ON public.jira_tickets 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Create similarity search function
CREATE OR REPLACE FUNCTION match_jira_tickets(
  query_embedding vector(1536),
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

-- Add comments
COMMENT ON TABLE public.jira_tickets IS 'Support ticket embeddings for enhanced AI context';
COMMENT ON FUNCTION match_jira_tickets IS 'Semantic search for similar support tickets';

-- Grant permissions
GRANT SELECT ON public.jira_tickets TO authenticated;
GRANT ALL ON public.jira_tickets TO service_role;

