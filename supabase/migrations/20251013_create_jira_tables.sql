-- Create JIRA tickets table
CREATE TABLE IF NOT EXISTS public.jira_tickets (
  id BIGSERIAL PRIMARY KEY,
  external_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT,
  priority TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create JIRA ticket embeddings table
CREATE TABLE IF NOT EXISTS public.jira_ticket_embeddings (
  id BIGSERIAL PRIMARY KEY,
  external_id TEXT NOT NULL UNIQUE,
  summary TEXT,
  embedding JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jira_tickets_external_id ON public.jira_tickets(external_id);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_status ON public.jira_tickets(status);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_priority ON public.jira_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_created_at ON public.jira_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_jira_ticket_embeddings_external_id ON public.jira_ticket_embeddings(external_id);

-- Enable Row Level Security
ALTER TABLE public.jira_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jira_ticket_embeddings ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (adjust as needed)
CREATE POLICY "Allow authenticated users to read jira_tickets"
  ON public.jira_tickets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read jira_ticket_embeddings"
  ON public.jira_ticket_embeddings FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for service role (for imports)
CREATE POLICY "Allow service role full access to jira_tickets"
  ON public.jira_tickets
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access to jira_ticket_embeddings"
  ON public.jira_ticket_embeddings
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_jira_tickets_updated_at
  BEFORE UPDATE ON public.jira_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jira_ticket_embeddings_updated_at
  BEFORE UPDATE ON public.jira_ticket_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
