-- Test Dashboard Supabase Migration
-- This script enhances existing tables and adds minimal new tables
-- Run this in Supabase SQL Editor

-- ============================================
-- PART 1: Enhance Existing Tables
-- ============================================

-- Enhance test_results table with additional columns
ALTER TABLE test_results 
ADD COLUMN IF NOT EXISTS execution_id TEXT,
ADD COLUMN IF NOT EXISTS suite_name TEXT,
ADD COLUMN IF NOT EXISTS flakiness_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trace_url TEXT,
ADD COLUMN IF NOT EXISTS coverage_data JSONB,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_results_execution ON test_results(execution_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);
CREATE INDEX IF NOT EXISTS idx_test_results_test_name ON test_results(test_name);
CREATE INDEX IF NOT EXISTS idx_test_results_created ON test_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_results_tags ON test_results USING gin(tags);

-- Enhance test_runs table
ALTER TABLE test_runs 
ADD COLUMN IF NOT EXISTS suite_name TEXT,
ADD COLUMN IF NOT EXISTS environment TEXT,
ADD COLUMN IF NOT EXISTS triggered_by TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS total_tests INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS passed_tests INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_tests INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_test_runs_branch ON test_runs(branch);
CREATE INDEX IF NOT EXISTS idx_test_runs_status ON test_runs(status);

-- Enhance generated_tests table
ALTER TABLE generated_tests 
ADD COLUMN IF NOT EXISTS generation_source TEXT DEFAULT 'ai',
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS test_type TEXT[],
ADD COLUMN IF NOT EXISTS related_features TEXT[];

-- ============================================
-- PART 2: Create Minimal New Tables
-- ============================================

-- Test executions table (aggregates multiple test runs)
CREATE TABLE IF NOT EXISTS test_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    run_id UUID REFERENCES test_runs(id),
    execution_id TEXT UNIQUE NOT NULL,
    suite_name TEXT,
    total_tests INTEGER DEFAULT 0,
    passed INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    skipped INTEGER DEFAULT 0,
    flaky_count INTEGER DEFAULT 0,
    environment TEXT,
    triggered_by TEXT CHECK (triggered_by IN ('manual', 'ci', 'schedule', 'ai')),
    worker_count INTEGER DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_executions_run ON test_executions(run_id);
CREATE INDEX IF NOT EXISTS idx_test_executions_created ON test_executions(created_at DESC);

-- Firecrawl AUT analysis cache
CREATE TABLE IF NOT EXISTS firecrawl_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url TEXT NOT NULL,
    app_name TEXT DEFAULT 'SIAM',
    analysis_type TEXT DEFAULT 'full',
    testable_features JSONB,
    user_flows JSONB,
    api_endpoints TEXT[],
    selectors JSONB,
    accessibility_issues JSONB,
    performance_metrics JSONB,
    content_embedding vector(1536),
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    UNIQUE(url, app_name)
);

CREATE INDEX IF NOT EXISTS idx_firecrawl_url ON firecrawl_analysis(url);
CREATE INDEX IF NOT EXISTS idx_firecrawl_expires ON firecrawl_analysis(expires_at);

-- Test knowledge base (shared with support)
CREATE TABLE IF NOT EXISTS test_knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source TEXT NOT NULL CHECK (source IN ('test_failure', 'firecrawl', 'documentation', 'support_ticket', 'ai_generated')),
    source_id TEXT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    solution TEXT,
    tags TEXT[],
    relevance_score INTEGER DEFAULT 50 CHECK (relevance_score >= 0 AND relevance_score <= 100),
    usage_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    embedding vector(1536),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_source ON test_knowledge_base(source);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON test_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON test_knowledge_base USING gin(tags);

-- Full-text search on knowledge base
ALTER TABLE test_knowledge_base ADD COLUMN IF NOT EXISTS 
    content_tsvector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            coalesce(title, '') || ' ' || 
            coalesce(content, '') || ' ' || 
            coalesce(solution, '')
        )
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_knowledge_fts ON test_knowledge_base USING gin(content_tsvector);

-- Test coverage tracking
CREATE TABLE IF NOT EXISTS test_coverage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    execution_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    line_coverage DECIMAL(5,2),
    branch_coverage DECIMAL(5,2),
    function_coverage DECIMAL(5,2),
    statement_coverage DECIMAL(5,2),
    uncovered_lines INTEGER[],
    coverage_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(execution_id, file_path)
);

CREATE INDEX IF NOT EXISTS idx_coverage_execution ON test_coverage(execution_id);
CREATE INDEX IF NOT EXISTS idx_coverage_file ON test_coverage(file_path);

-- ============================================
-- PART 3: Create Views for Analytics
-- ============================================

-- Flaky test detection view
CREATE OR REPLACE VIEW flaky_tests_view AS
WITH test_history AS (
    SELECT 
        test_name,
        COUNT(*) as total_runs,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failures,
        SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passes,
        ARRAY_AGG(status ORDER BY created_at DESC) as status_history
    FROM test_results
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY test_name
    HAVING COUNT(*) >= 5
)
SELECT 
    test_name,
    total_runs,
    failures,
    passes,
    ROUND((failures::DECIMAL / NULLIF(total_runs, 0)) * 100, 2) as failure_rate,
    CASE 
        WHEN failures > 0 AND passes > 0 
        AND (failures::DECIMAL / NULLIF(total_runs, 0)) BETWEEN 0.1 AND 0.9 
        THEN ROUND((failures::DECIMAL / NULLIF(total_runs, 0)) * (1 - (failures::DECIMAL / NULLIF(total_runs, 0))) * 4, 2)
        ELSE 0
    END as flakiness_score,
    status_history[1:10] as recent_history
FROM test_history
WHERE failures > 0 AND passes > 0
ORDER BY flakiness_score DESC;

-- Test execution summary view
CREATE OR REPLACE VIEW test_execution_summary AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(DISTINCT execution_id) as total_executions,
    SUM(total_tests) as total_tests,
    SUM(passed) as passed_tests,
    SUM(failed) as failed_tests,
    SUM(skipped) as skipped_tests,
    AVG(CASE WHEN total_tests > 0 THEN (passed::DECIMAL / total_tests) * 100 ELSE 0 END) as avg_pass_rate
FROM test_executions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- ============================================
-- PART 4: Create Functions
-- ============================================

-- Function to calculate flaky tests
CREATE OR REPLACE FUNCTION get_flaky_tests(
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
    min_runs INTEGER DEFAULT 5,
    flakiness_threshold DECIMAL DEFAULT 0.3
)
RETURNS TABLE(
    test_name TEXT,
    total_runs BIGINT,
    failures BIGINT,
    passes BIGINT,
    failure_rate NUMERIC,
    flakiness_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH test_stats AS (
        SELECT 
            tr.test_name,
            COUNT(*) as total_runs,
            SUM(CASE WHEN tr.status = 'failed' THEN 1 ELSE 0 END) as failures,
            SUM(CASE WHEN tr.status = 'passed' THEN 1 ELSE 0 END) as passes
        FROM test_results tr
        WHERE tr.created_at >= start_date
        GROUP BY tr.test_name
        HAVING COUNT(*) >= min_runs
    )
    SELECT 
        ts.test_name,
        ts.total_runs,
        ts.failures,
        ts.passes,
        ROUND((ts.failures::DECIMAL / NULLIF(ts.total_runs, 0)) * 100, 2) as failure_rate,
        CASE 
            WHEN ts.failures > 0 AND ts.passes > 0 
            AND (ts.failures::DECIMAL / NULLIF(ts.total_runs, 0)) BETWEEN 0.1 AND 0.9 
            THEN ROUND((ts.failures::DECIMAL / NULLIF(ts.total_runs, 0)) * 
                      (1 - (ts.failures::DECIMAL / NULLIF(ts.total_runs, 0))) * 4, 2)
            ELSE 0
        END as flakiness_score
    FROM test_stats ts
    WHERE ts.failures > 0 AND ts.passes > 0
        AND (ts.failures::DECIMAL / NULLIF(ts.total_runs, 0)) >= flakiness_threshold
    ORDER BY flakiness_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to find similar test failures
CREATE OR REPLACE FUNCTION find_similar_failures(
    error_text TEXT,
    limit_count INTEGER DEFAULT 5
)
RETURNS TABLE(
    test_name TEXT,
    error_message TEXT,
    similarity_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tr.test_name,
        tr.error_message,
        similarity(tr.error_message, error_text) as similarity_score
    FROM test_results tr
    WHERE tr.error_message IS NOT NULL
        AND tr.status = 'failed'
    ORDER BY similarity(tr.error_message, error_text) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to sync test failures to knowledge base
CREATE OR REPLACE FUNCTION sync_test_failure_to_knowledge(
    test_result_id UUID
)
RETURNS VOID AS $$
DECLARE
    test_record RECORD;
BEGIN
    SELECT * INTO test_record FROM test_results WHERE id = test_result_id;
    
    IF test_record.status = 'failed' AND test_record.error_message IS NOT NULL THEN
        INSERT INTO test_knowledge_base (
            source,
            source_id,
            category,
            title,
            content,
            tags,
            relevance_score
        ) VALUES (
            'test_failure',
            test_result_id::TEXT,
            'test_failure',
            'Test Failure: ' || test_record.test_name,
            test_record.error_message,
            ARRAY['test_failure', test_record.test_file],
            75
        ) ON CONFLICT DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 5: Enable Real-time Updates
-- ============================================

-- Enable real-time for test dashboard tables
ALTER PUBLICATION supabase_realtime ADD TABLE test_executions;
ALTER PUBLICATION supabase_realtime ADD TABLE test_results;
ALTER PUBLICATION supabase_realtime ADD TABLE test_runs;

-- ============================================
-- PART 6: Row Level Security (RLS)
-- ============================================

-- Enable RLS on new tables
ALTER TABLE test_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE firecrawl_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_coverage ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view test executions" ON test_executions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create test executions" ON test_executions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view firecrawl analysis" ON firecrawl_analysis
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create firecrawl analysis" ON firecrawl_analysis
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Anyone can read test knowledge" ON test_knowledge_base
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can contribute knowledge" ON test_knowledge_base
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- PART 7: Create Triggers
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_test_knowledge_updated_at 
    BEFORE UPDATE ON test_knowledge_base 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-sync failed tests to knowledge base
CREATE OR REPLACE FUNCTION auto_sync_test_failures()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'failed' AND NEW.error_message IS NOT NULL THEN
        PERFORM sync_test_failure_to_knowledge(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_failures_to_knowledge 
    AFTER INSERT ON test_results 
    FOR EACH ROW 
    EXECUTE FUNCTION auto_sync_test_failures();

-- ============================================
-- PART 8: Initial Data & Testing
-- ============================================

-- Insert sample data for testing (optional)
/*
INSERT INTO test_knowledge_base (source, category, title, content, tags) VALUES
    ('documentation', 'best_practice', 'Test Naming Convention', 'Tests should be named descriptively using the pattern: should_expectedBehavior_when_condition', ARRAY['testing', 'best_practice']),
    ('documentation', 'troubleshooting', 'Handling Flaky Tests', 'Flaky tests can be identified by inconsistent pass/fail patterns. Use retry mechanisms and investigate timing issues.', ARRAY['flaky', 'debugging']),
    ('documentation', 'performance', 'Test Performance Optimization', 'Parallelize test execution, use test data factories, and minimize database interactions for faster tests.', ARRAY['performance', 'optimization']);
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('test_executions', 'firecrawl_analysis', 'test_knowledge_base', 'test_coverage');

-- Check enhanced columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'test_results' 
AND column_name IN ('execution_id', 'suite_name', 'flakiness_score', 'tags');

-- Test the flaky tests function
-- SELECT * FROM get_flaky_tests();

-- Check real-time subscriptions
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';