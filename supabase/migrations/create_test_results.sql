
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create test_results table if it doesn't exist
CREATE TABLE IF NOT EXISTS test_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_name TEXT NOT NULL,
  test_file TEXT,
  status TEXT CHECK (status IN ('passed', 'failed', 'skipped', 'pending')),
  duration INTEGER,
  error_message TEXT,
  stack_trace TEXT,
  html_snapshot TEXT,
  screenshot_url TEXT,
  console_logs JSONB,
  performance_metrics JSONB,
  browser_logs JSONB,
  metadata JSONB,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Drop existing read policy if it exists
DROP POLICY IF EXISTS "Allow public read access" ON test_results;

-- Create policies
CREATE POLICY "Allow anon read access" ON test_results FOR SELECT TO anon USING (true);
CREATE POLICY "Allow authenticated insert" ON test_results FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON test_results FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_test_results_name ON test_results(test_name);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);
CREATE INDEX IF NOT EXISTS idx_test_results_created ON test_results(created_at);
