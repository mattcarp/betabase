-- Create AOMA content table for crawled data
CREATE TABLE IF NOT EXISTS aoma_content (
  id SERIAL PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  path TEXT,
  title TEXT,
  content TEXT,
  content_hash TEXT,
  metadata JSONB,
  embedding vector(1536), -- For OpenAI embeddings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_aoma_content_url ON aoma_content(url);
CREATE INDEX IF NOT EXISTS idx_aoma_content_path ON aoma_content(path);
CREATE INDEX IF NOT EXISTS idx_aoma_content_hash ON aoma_content(content_hash);

-- Full text search
ALTER TABLE aoma_content ADD COLUMN IF NOT EXISTS search_vector tsvector 
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))) STORED;
CREATE INDEX IF NOT EXISTS idx_aoma_content_search ON aoma_content USING GIN(search_vector);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_aoma_content_updated_at ON aoma_content;
CREATE TRIGGER update_aoma_content_updated_at 
  BEFORE UPDATE ON aoma_content 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed)
GRANT ALL ON aoma_content TO authenticated;
GRANT ALL ON aoma_content TO service_role;

-- Add RLS policies if needed
ALTER TABLE aoma_content ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read
CREATE POLICY "Allow authenticated users to read aoma_content" 
  ON aoma_content FOR SELECT 
  TO authenticated 
  USING (true);

-- Policy to allow service role full access
CREATE POLICY "Allow service role full access to aoma_content" 
  ON aoma_content FOR ALL 
  TO service_role 
  USING (true);
