-- Create RLHF Generated Tests table
-- Used to store Playwright tests generated from curator feedback

CREATE TABLE IF NOT EXISTS rlhf_generated_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id TEXT NOT NULL,
  test_description TEXT NOT NULL,
  test_code TEXT NOT NULL,
  original_query TEXT NOT NULL,
  curator_correction TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  run_count INTEGER DEFAULT 0,
  pass_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'passing', 'failing', 'flaky')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rlhf_tests_status ON rlhf_generated_tests(status);
CREATE INDEX IF NOT EXISTS idx_rlhf_tests_generated_at ON rlhf_generated_tests(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_rlhf_tests_feedback_id ON rlhf_generated_tests(feedback_id);

-- Enable RLS
ALTER TABLE rlhf_generated_tests ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON rlhf_generated_tests
  FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'anon')
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_rlhf_tests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_rlhf_tests_updated_at_trigger ON rlhf_generated_tests;
CREATE TRIGGER update_rlhf_tests_updated_at_trigger
  BEFORE UPDATE ON rlhf_generated_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_rlhf_tests_updated_at();
