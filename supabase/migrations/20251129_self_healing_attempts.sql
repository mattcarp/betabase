-- Self-Healing Test Attempts Schema
-- Migration: 20251129_self_healing_attempts.sql
-- Purpose: Store self-healing test data for the Test Dashboard (Pillar 3)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main table for self-healing attempts
CREATE TABLE IF NOT EXISTS self_healing_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Test identification
  test_name TEXT NOT NULL,
  test_file TEXT NOT NULL,
  test_line_number INTEGER,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'detecting' CHECK (status IN (
    'detecting', 'analyzing', 'healing', 'testing', 'success', 'failed', 'review', 'approved', 'rejected'
  )),

  -- Tiered healing system
  tier INTEGER NOT NULL DEFAULT 2 CHECK (tier IN (1, 2, 3)),
  confidence DECIMAL(5,4) NOT NULL DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 1),

  -- Selector information
  original_selector TEXT NOT NULL,
  suggested_selector TEXT,
  selector_type TEXT CHECK (selector_type IN ('data-testid', 'css', 'xpath', 'role', 'text', 'label')),

  -- DOM context
  dom_changes JSONB DEFAULT '[]'::jsonb,
  dom_snapshot_before TEXT,
  dom_snapshot_after TEXT,

  -- Healing details
  healing_strategy TEXT CHECK (healing_strategy IN (
    'selector-update', 'wait-strategy', 'structure-adaptation', 'data-fix'
  )),
  healing_rationale TEXT,

  -- Impact multiplier - similar tests affected
  similar_tests_affected INTEGER DEFAULT 0,
  affected_test_files JSONB DEFAULT '[]'::jsonb,

  -- Code context
  code_before TEXT,
  code_after TEXT,
  diff_hunks JSONB DEFAULT '[]'::jsonb,

  -- Execution metadata
  execution_time_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  ai_model TEXT DEFAULT 'gemini-3-pro-preview',
  ai_tokens_used INTEGER,

  -- Error information
  error_message TEXT,
  error_stack TEXT,

  -- Review workflow
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,

  -- Organization context (for multi-tenant)
  organization TEXT DEFAULT 'sony-music',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  healed_at TIMESTAMPTZ,

  -- Indexes for common queries
  CONSTRAINT valid_confidence CHECK (
    (tier = 1 AND confidence > 0.9) OR
    (tier = 2 AND confidence >= 0.6 AND confidence <= 0.9) OR
    (tier = 3 AND confidence < 0.6)
  )
);

-- Indexes for performance
CREATE INDEX idx_self_healing_status ON self_healing_attempts(status);
CREATE INDEX idx_self_healing_tier ON self_healing_attempts(tier);
CREATE INDEX idx_self_healing_created_at ON self_healing_attempts(created_at DESC);
CREATE INDEX idx_self_healing_test_file ON self_healing_attempts(test_file);
CREATE INDEX idx_self_healing_organization ON self_healing_attempts(organization);
CREATE INDEX idx_self_healing_confidence ON self_healing_attempts(confidence DESC);

-- Composite index for queue queries
CREATE INDEX idx_self_healing_queue ON self_healing_attempts(status, tier, created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_self_healing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER self_healing_updated_at
  BEFORE UPDATE ON self_healing_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_self_healing_updated_at();

-- Function to get pending review queue
CREATE OR REPLACE FUNCTION get_self_healing_queue(
  p_status TEXT DEFAULT NULL,
  p_tier INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  test_name TEXT,
  test_file TEXT,
  status TEXT,
  tier INTEGER,
  confidence DECIMAL,
  original_selector TEXT,
  suggested_selector TEXT,
  healing_strategy TEXT,
  similar_tests_affected INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sha.id,
    sha.test_name,
    sha.test_file,
    sha.status,
    sha.tier,
    sha.confidence,
    sha.original_selector,
    sha.suggested_selector,
    sha.healing_strategy,
    sha.similar_tests_affected,
    sha.created_at
  FROM self_healing_attempts sha
  WHERE
    (p_status IS NULL OR sha.status = p_status)
    AND (p_tier IS NULL OR sha.tier = p_tier)
  ORDER BY
    sha.tier ASC,
    sha.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get healing analytics
CREATE OR REPLACE FUNCTION get_self_healing_analytics(
  p_days INTEGER DEFAULT 14
)
RETURNS TABLE (
  total_attempts BIGINT,
  auto_healed BIGINT,
  pending_review BIGINT,
  success_rate DECIMAL,
  avg_heal_time_ms DECIMAL,
  total_tests_impacted BIGINT,
  tier1_count BIGINT,
  tier2_count BIGINT,
  tier3_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_attempts,
    COUNT(*) FILTER (WHERE sha.tier = 1 AND sha.status = 'success')::BIGINT as auto_healed,
    COUNT(*) FILTER (WHERE sha.status IN ('review', 'analyzing'))::BIGINT as pending_review,
    ROUND(
      (COUNT(*) FILTER (WHERE sha.status = 'success')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
      1
    ) as success_rate,
    ROUND(AVG(sha.execution_time_ms)::DECIMAL, 1) as avg_heal_time_ms,
    COALESCE(SUM(sha.similar_tests_affected), 0)::BIGINT as total_tests_impacted,
    COUNT(*) FILTER (WHERE sha.tier = 1)::BIGINT as tier1_count,
    COUNT(*) FILTER (WHERE sha.tier = 2)::BIGINT as tier2_count,
    COUNT(*) FILTER (WHERE sha.tier = 3)::BIGINT as tier3_count
  FROM self_healing_attempts sha
  WHERE sha.created_at > NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily healing trends
CREATE OR REPLACE FUNCTION get_self_healing_trends(
  p_days INTEGER DEFAULT 14
)
RETURNS TABLE (
  date DATE,
  total_attempts INTEGER,
  successful INTEGER,
  failed INTEGER,
  pending INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(sha.created_at) as date,
    COUNT(*)::INTEGER as total_attempts,
    COUNT(*) FILTER (WHERE sha.status = 'success')::INTEGER as successful,
    COUNT(*) FILTER (WHERE sha.status = 'failed')::INTEGER as failed,
    COUNT(*) FILTER (WHERE sha.status IN ('review', 'analyzing', 'detecting'))::INTEGER as pending
  FROM self_healing_attempts sha
  WHERE sha.created_at > NOW() - (p_days || ' days')::INTERVAL
  GROUP BY DATE(sha.created_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- RLS policies
ALTER TABLE self_healing_attempts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all attempts
CREATE POLICY "Allow read access for authenticated users"
  ON self_healing_attempts FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role full access
CREATE POLICY "Allow full access for service role"
  ON self_healing_attempts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon read for demo purposes
CREATE POLICY "Allow anon read for demo"
  ON self_healing_attempts FOR SELECT
  TO anon
  USING (true);

-- Grant permissions
GRANT SELECT ON self_healing_attempts TO anon;
GRANT SELECT, INSERT, UPDATE ON self_healing_attempts TO authenticated;
GRANT ALL ON self_healing_attempts TO service_role;

-- Comments for documentation
COMMENT ON TABLE self_healing_attempts IS 'Stores AI-powered self-healing test attempts with tiered confidence system';
COMMENT ON COLUMN self_healing_attempts.tier IS '1=Auto (>90%), 2=Review (60-90%), 3=Architect (<60%)';
COMMENT ON COLUMN self_healing_attempts.similar_tests_affected IS 'Impact multiplier - how many similar tests this fix would repair';
COMMENT ON COLUMN self_healing_attempts.healing_strategy IS 'selector-update, wait-strategy, structure-adaptation, or data-fix';
