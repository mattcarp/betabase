-- Migration: Testing Tab Transformation
-- Created: 2025-12-17
-- Feature: 001-testing-tab-transformation
-- Tasks: T003, T004, T005, T006, T007, T009

-- ============================================================================
-- T004: Create historical_tests_view
-- Purpose: Unified view of bb_case with computed confidence scores
-- ============================================================================

CREATE OR REPLACE VIEW historical_tests_view AS
SELECT 
  c.id,
  c.original_id,
  c.source_table,
  COALESCE(NULLIF(c.name, ''), c.expected_result) as test_name,
  c.expected_result as description,
  c.preconditions,
  c.script as test_script,
  c.app_under_test,
  c.tags,
  c.coverage,
  c.client_priority,
  c.mode,
  c.is_security,
  c.review_flag,
  c.flag_reason,
  c.reviewed_flag,
  c.created_by,
  c.created_at::timestamptz,
  c.updated_at::timestamptz,
  c.merged_at::timestamptz,
  c.execution_count,
  c.pass_count,
  c.fail_count,
  c.first_executed_at::timestamptz,
  c.last_executed_at::timestamptz,
  c.jira_ticket_count,
  c.had_duplicate_in_cases,
  -- Computed confidence score based on multiple factors
  CASE 
    -- High confidence: Recently executed with good pass rate
    WHEN c.execution_count > 0 AND c.pass_count::float / GREATEST(c.execution_count, 1) > 0.8 
      AND c.last_executed_at::timestamptz > NOW() - INTERVAL '90 days' THEN 0.9
    -- Medium-high: Has executions but older
    WHEN c.execution_count > 0 AND c.last_executed_at::timestamptz > NOW() - INTERVAL '180 days' THEN 0.75
    -- Medium: Has executions but old
    WHEN c.execution_count > 0 THEN 0.6
    -- Lower: Never executed but recently updated
    WHEN c.updated_at::timestamptz > NOW() - INTERVAL '365 days' THEN 0.5
    -- Low: Old and never executed
    ELSE 0.3
  END as base_confidence,
  -- Category derived from expected_result or tags
  CASE 
    WHEN c.expected_result ILIKE '%distribution%' THEN 'Distribution'
    WHEN c.expected_result ILIKE '%audio%' OR c.expected_result ILIKE '%media%' THEN 'Media'
    WHEN c.expected_result ILIKE '%user%' OR c.expected_result ILIKE '%admin%' THEN 'User Admin'
    WHEN c.expected_result ILIKE '%search%' THEN 'Search'
    WHEN c.expected_result ILIKE '%upload%' OR c.expected_result ILIKE '%import%' THEN 'Upload/Import'
    WHEN c.expected_result ILIKE '%export%' OR c.expected_result ILIKE '%download%' THEN 'Export/Download'
    WHEN c.expected_result ILIKE '%campaign%' THEN 'Campaign'
    WHEN c.expected_result ILIKE '%permission%' OR c.expected_result ILIKE '%role%' THEN 'Permissions'
    ELSE 'General'
  END as category
FROM bb_case c;

-- Index for view performance (on underlying table)
CREATE INDEX IF NOT EXISTS idx_bb_case_app_under_test ON bb_case(app_under_test);
CREATE INDEX IF NOT EXISTS idx_bb_case_last_executed ON bb_case(last_executed_at);
CREATE INDEX IF NOT EXISTS idx_bb_case_execution_count ON bb_case(execution_count);

-- ============================================================================
-- T005: Create rlhf_generated_tests table
-- Purpose: Store tests generated from user feedback
-- ============================================================================

CREATE TABLE IF NOT EXISTS rlhf_generated_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to source feedback
  source_feedback_id UUID REFERENCES rlhf_feedback(id) ON DELETE SET NULL,
  source_query TEXT, -- Original user query that triggered feedback
  source_correction TEXT, -- The correction that inspired this test
  
  -- Test definition
  test_name TEXT NOT NULL,
  test_description TEXT,
  test_code TEXT NOT NULL,
  test_language TEXT DEFAULT 'typescript',
  test_framework TEXT DEFAULT 'playwright',
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Just generated, not yet reviewed
    'approved',   -- Human approved for inclusion
    'rejected',   -- Human rejected
    'passing',    -- Approved and currently passing
    'failing',    -- Approved but currently failing
    'flaky'       -- Approved but inconsistent
  )),
  
  -- AI generation metadata
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  generation_model TEXT DEFAULT 'gemini-2.0-flash',
  generation_prompt TEXT,
  generation_tokens INTEGER,
  
  -- Review tracking
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Execution tracking
  last_run_at TIMESTAMPTZ,
  last_run_result TEXT,
  run_count INTEGER DEFAULT 0,
  pass_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  avg_duration_ms INTEGER,
  
  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rlhf_tests_status ON rlhf_generated_tests(status);
CREATE INDEX IF NOT EXISTS idx_rlhf_tests_generated ON rlhf_generated_tests(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_rlhf_tests_source ON rlhf_generated_tests(source_feedback_id);

-- ============================================================================
-- T006: Create self_healing_attempts table
-- Purpose: Track AI-suggested test fixes awaiting human review
-- ============================================================================

CREATE TABLE IF NOT EXISTS self_healing_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Test identification
  test_id TEXT NOT NULL,
  test_name TEXT NOT NULL,
  test_file TEXT,
  test_suite TEXT,
  
  -- What changed
  change_type TEXT CHECK (change_type IN ('selector', 'attribute', 'structure', 'timing', 'text')),
  old_selector TEXT NOT NULL,
  new_selector TEXT NOT NULL,
  selector_type TEXT, -- css, xpath, testid, role, etc.
  
  -- DOM context
  dom_snapshot_before TEXT,
  dom_snapshot_after TEXT,
  dom_changes JSONB, -- Array of specific changes detected
  
  -- Healing decision
  healing_tier INTEGER CHECK (healing_tier IN (1, 2, 3)) NOT NULL,
  -- Tier 1: Auto-approved (high confidence, simple change)
  -- Tier 2: Suggested (medium confidence, needs review)
  -- Tier 3: Manual required (low confidence, complex change)
  
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  healing_strategy TEXT, -- e.g., "fallback_chain", "ai_suggestion", "similar_element"
  healing_rationale TEXT, -- AI explanation of why this fix was suggested
  
  -- Code changes
  code_before TEXT,
  code_after TEXT,
  
  -- Impact analysis
  similar_tests_affected INTEGER DEFAULT 0,
  affected_test_files TEXT[],
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',       -- Awaiting review
    'auto_approved', -- Tier 1, auto-applied
    'approved',      -- Human approved
    'rejected',      -- Human rejected
    'applied',       -- Fix has been applied to codebase
    'reverted'       -- Applied but later reverted
  )),
  
  -- Resolution tracking
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- AI metadata
  ai_model TEXT DEFAULT 'gemini-2.0-flash',
  ai_tokens_used INTEGER,
  execution_time_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  
  -- Error tracking (if healing failed)
  error_message TEXT,
  error_stack TEXT,
  
  -- Timestamps
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  healed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for queue and history views
CREATE INDEX IF NOT EXISTS idx_healing_status ON self_healing_attempts(status);
CREATE INDEX IF NOT EXISTS idx_healing_tier ON self_healing_attempts(healing_tier);
CREATE INDEX IF NOT EXISTS idx_healing_detected ON self_healing_attempts(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_healing_test ON self_healing_attempts(test_name);

-- ============================================================================
-- T007: Create test_analytics_daily materialized view
-- Purpose: Pre-aggregated daily metrics for dashboard performance
-- ============================================================================

-- First ensure test_results table exists (may already exist)
CREATE TABLE IF NOT EXISTS test_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id TEXT,
  test_name TEXT NOT NULL,
  suite_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'skipped', 'pending')),
  duration_ms INTEGER,
  error_message TEXT,
  stack_trace TEXT,
  screenshot_url TEXT,
  console_logs TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_results_created ON test_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);

-- Create the materialized view for analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS test_analytics_daily AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE status = 'passed') as passed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'skipped') as skipped,
  ROUND(AVG(duration_ms)::numeric, 2) as avg_duration_ms,
  ROUND(STDDEV(duration_ms)::numeric, 2) as stddev_duration_ms,
  MIN(duration_ms) as min_duration_ms,
  MAX(duration_ms) as max_duration_ms,
  COUNT(DISTINCT test_name) as unique_tests,
  COUNT(DISTINCT suite_name) as unique_suites,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'passed')::float / NULLIF(COUNT(*), 0) * 100)::numeric, 
    2
  ) as pass_rate
FROM test_results
GROUP BY DATE_TRUNC('day', created_at);

-- Index on the materialized view
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON test_analytics_daily(date DESC);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_test_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY test_analytics_daily;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- T009: Additional indexes for performance
-- ============================================================================

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_bb_case_app_execution 
  ON bb_case(app_under_test, execution_count DESC);

CREATE INDEX IF NOT EXISTS idx_bb_case_category_confidence 
  ON bb_case(app_under_test, updated_at DESC);

-- Full text search on test descriptions
CREATE INDEX IF NOT EXISTS idx_bb_case_description_fts 
  ON bb_case USING gin(to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(expected_result, '')));

-- ============================================================================
-- Seed some demo data for self-healing (optional, comment out if not needed)
-- ============================================================================

INSERT INTO self_healing_attempts (
  test_id, test_name, test_file, change_type,
  old_selector, new_selector, selector_type,
  healing_tier, confidence, healing_strategy, healing_rationale,
  status, similar_tests_affected
) VALUES 
(
  'test-001',
  'User Login Flow',
  'tests/auth/login.spec.ts',
  'selector',
  'button.login-btn',
  'button[data-testid="login-submit"]',
  'css',
  1,
  0.95,
  'testid_fallback',
  'Class name changed but data-testid attribute is stable',
  'auto_approved',
  3
),
(
  'test-002',
  'Search Results Display',
  'tests/search/results.spec.ts',
  'structure',
  'div.results-container > ul > li',
  'div[role="list"] > div[role="listitem"]',
  'css',
  2,
  0.72,
  'semantic_role',
  'DOM structure changed from ul/li to divs with ARIA roles',
  'pending',
  5
),
(
  'test-003',
  'Asset Upload Modal',
  'tests/assets/upload.spec.ts',
  'timing',
  'await page.waitForSelector(".upload-complete", { timeout: 5000 })',
  'await page.waitForSelector(".upload-complete", { timeout: 10000 })',
  'timing',
  3,
  0.45,
  'timeout_increase',
  'Upload completion taking longer than expected; may indicate performance regression',
  'pending',
  1
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Grant permissions (adjust roles as needed)
-- ============================================================================

-- For authenticated users (Supabase default)
GRANT SELECT ON historical_tests_view TO authenticated;
GRANT SELECT ON test_analytics_daily TO authenticated;
GRANT SELECT, INSERT, UPDATE ON rlhf_generated_tests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON self_healing_attempts TO authenticated;
GRANT SELECT, INSERT ON test_results TO authenticated;

-- For service role (full access)
GRANT ALL ON historical_tests_view TO service_role;
GRANT ALL ON test_analytics_daily TO service_role;
GRANT ALL ON rlhf_generated_tests TO service_role;
GRANT ALL ON self_healing_attempts TO service_role;
GRANT ALL ON test_results TO service_role;

-- ============================================================================
-- Done!
-- ============================================================================

