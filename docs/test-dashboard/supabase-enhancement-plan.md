# Supabase Enhancement Plan for Test Dashboard

## 📊 Existing Tables Analysis

Based on the existing schema, we have several test-related tables already:

### Core Test Tables (Already Exist)

- `test_results` - Test execution results
- `test_runs` - Test run metadata
- `test_specs` - Test specifications
- `test_contexts` - Context for test execution
- `test_feedback` - User feedback on tests
- `test_generation_patterns` - Patterns for AI test generation
- `test_quality_dimensions` - Quality metrics
- `test_context_attribution` - Attribution tracking
- `test_save_events` - Test save history
- `generated_tests` - AI-generated tests
- `aoma_test_dependencies` - Test dependency management

### Related Tables We Can Leverage

- `crawled_pages` - Can store Firecrawl results
- `crawler_documents` - Document analysis from crawling
- `aoma_ui_elements` - UI element tracking for test selectors
- `aoma_navigation_links` - Navigation paths for user flow tests
- `app_performance_metrics` - Performance test results
- `visual_snapshots` - Visual regression testing
- `console_logs` - Test execution logs

## 🚀 Enhancement Strategy

### 1. Extend Existing Tables (Don't Reinvent)

#### A. Enhance `test_results` Table

```sql
-- Add columns for better Test Dashboard integration
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS
    execution_id TEXT,
    flakiness_score DECIMAL(3,2),
    retry_count INTEGER DEFAULT 0,
    screenshots JSONB,
    trace_url TEXT,
    coverage_data JSONB,
    error_embedding vector(1536), -- For similarity search
    created_by TEXT,
    tags TEXT[];

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_results_execution ON test_results(execution_id);
CREATE INDEX IF NOT EXISTS idx_test_results_flakiness ON test_results(flakiness_score) WHERE flakiness_score > 0.3;
CREATE INDEX IF NOT EXISTS idx_test_results_tags ON test_results USING gin(tags);
```

#### B. Enhance `test_runs` Table

```sql
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS
    suite_name TEXT,
    environment TEXT,
    branch TEXT,
    commit_sha TEXT,
    triggered_by TEXT, -- 'manual', 'ci', 'schedule', 'ai'
    metadata JSONB,
    test_selection_strategy TEXT,
    parallel_workers INTEGER,
    total_duration_ms INTEGER;

CREATE INDEX IF NOT EXISTS idx_test_runs_suite ON test_runs(suite_name);
CREATE INDEX IF NOT EXISTS idx_test_runs_branch ON test_runs(branch);
```

#### C. Enhance `generated_tests` Table

```sql
ALTER TABLE generated_tests ADD COLUMN IF NOT EXISTS
    generation_source TEXT, -- 'testsprite', 'firecrawl', 'manual', 'ai'
    source_url TEXT,
    confidence_score DECIMAL(3,2),
    review_status TEXT, -- 'pending', 'approved', 'rejected'
    test_type TEXT[], -- ['e2e', 'unit', 'integration', 'visual']
    related_features TEXT[],
    prompt_embedding vector(1536);
```

### 2. Create New Specialized Tables (Only What's Missing)

#### A. Test Executions Table (Time-Series Optimized)

```sql
CREATE TABLE IF NOT EXISTS test_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    execution_id TEXT UNIQUE NOT NULL,
    run_id UUID REFERENCES test_runs(id),
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    status TEXT CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    total_tests INTEGER,
    passed INTEGER,
    failed INTEGER,
    skipped INTEGER,
    flaky INTEGER,
    duration_ms INTEGER,
    worker_count INTEGER,
    metadata JSONB,
    logs_url TEXT,
    artifacts_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (started_at);

-- Create monthly partitions
CREATE TABLE test_executions_2025_01 PARTITION OF test_executions
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

#### B. Firecrawl AUT Analysis Table

```sql
CREATE TABLE IF NOT EXISTS aut_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url TEXT NOT NULL,
    app_name TEXT DEFAULT 'SIAM',
    analysis_type TEXT, -- 'full', 'partial', 'api', 'documentation'
    testable_features JSONB,
    user_flows JSONB,
    api_endpoints TEXT[],
    selectors JSONB,
    accessibility_issues JSONB,
    performance_metrics JSONB,
    content_embedding vector(1536),
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- For cache management
    UNIQUE(url, app_name, analysis_type)
);

CREATE INDEX idx_aut_analysis_url ON aut_analysis(url);
CREATE INDEX idx_aut_embedding ON aut_analysis USING ivfflat(content_embedding vector_cosine_ops);
```

#### C. Test Knowledge Base (Shared with Support)

```sql
CREATE TABLE IF NOT EXISTS test_knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source TEXT NOT NULL, -- 'test_failure', 'firecrawl', 'documentation', 'support_ticket'
    source_id TEXT, -- Reference to original record
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    solution TEXT,
    tags TEXT[],
    relevance_score INTEGER DEFAULT 50,
    usage_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    embedding vector(1536),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search
ALTER TABLE test_knowledge_base ADD COLUMN IF NOT EXISTS
    content_tsvector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '') || ' ' || coalesce(solution, ''))
    ) STORED;

CREATE INDEX idx_knowledge_fts ON test_knowledge_base USING gin(content_tsvector);
CREATE INDEX idx_knowledge_embedding ON test_knowledge_base USING ivfflat(embedding vector_cosine_ops);
```

#### D. Test Coverage Tracking

```sql
CREATE TABLE IF NOT EXISTS test_coverage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    execution_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    line_coverage DECIMAL(5,2),
    branch_coverage DECIMAL(5,2),
    function_coverage DECIMAL(5,2),
    uncovered_lines INTEGER[],
    coverage_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(execution_id, file_path)
);

CREATE INDEX idx_coverage_execution ON test_coverage(execution_id);
CREATE INDEX idx_coverage_file ON test_coverage(file_path);
```

### 3. Create Materialized Views for Performance

```sql
-- Flaky Test Detection
CREATE MATERIALIZED VIEW IF NOT EXISTS flaky_tests_analysis AS
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
    ROUND((failures::DECIMAL / total_runs) * 100, 2) as failure_rate,
    CASE
        WHEN failures > 0 AND passes > 0
        AND (failures::DECIMAL / total_runs) BETWEEN 0.1 AND 0.9
        THEN ROUND(STDDEV(CASE WHEN status_history[i] = 'failed' THEN 1 ELSE 0 END), 2)
        ELSE 0
    END as flakiness_score,
    status_history[1:10] as recent_history
FROM test_history
WHERE failures > 0 AND passes > 0;

CREATE UNIQUE INDEX ON flaky_tests_analysis(test_name);
```

```sql
-- Test Performance Trends
CREATE MATERIALIZED VIEW IF NOT EXISTS test_performance_trends AS
SELECT
    DATE_TRUNC('day', created_at) as date,
    test_name,
    AVG(duration_ms) as avg_duration,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) as median_duration,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration,
    COUNT(*) as execution_count
FROM test_results
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), test_name;

CREATE INDEX ON test_performance_trends(date, test_name);
```

### 4. Real-time Subscriptions

```sql
-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE test_executions;
ALTER PUBLICATION supabase_realtime ADD TABLE test_results;
ALTER PUBLICATION supabase_realtime ADD TABLE test_knowledge_base;
```

### 5. RLS Policies for Security

```sql
-- Team-based access control
CREATE POLICY test_team_access ON test_results
    FOR ALL
    USING (
        auth.jwt() ->> 'team_id' = ANY(
            SELECT team_id FROM team_members
            WHERE user_id = auth.uid()
        )
    );

-- Read-only access for support team
CREATE POLICY support_read_knowledge ON test_knowledge_base
    FOR SELECT
    USING (
        auth.jwt() ->> 'role' IN ('support', 'qa', 'admin')
    );
```

### 6. Database Functions for Intelligence

```sql
-- Find similar test failures
CREATE OR REPLACE FUNCTION find_similar_failures(
    error_message TEXT,
    limit_count INTEGER DEFAULT 5
) RETURNS TABLE(
    test_name TEXT,
    error_message TEXT,
    solution TEXT,
    similarity_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tr.test_name,
        tr.error_message,
        tkb.solution,
        1 - (tr.error_embedding <=> tkb.embedding) as similarity_score
    FROM test_results tr
    LEFT JOIN test_knowledge_base tkb ON tkb.source_id = tr.id::TEXT
    WHERE tr.error_embedding IS NOT NULL
    ORDER BY tr.error_embedding <=> (
        SELECT embedding FROM test_knowledge_base
        WHERE content ILIKE '%' || error_message || '%'
        LIMIT 1
    )
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Smart test selection based on code changes
CREATE OR REPLACE FUNCTION select_tests_for_changes(
    changed_files TEXT[],
    risk_threshold DECIMAL DEFAULT 0.5
) RETURNS TABLE(
    test_name TEXT,
    priority INTEGER,
    risk_score DECIMAL,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH test_impact AS (
        SELECT
            t.test_name,
            COUNT(DISTINCT td.dependency_file) as impacted_files,
            MAX(tr.flakiness_score) as flakiness,
            AVG(CASE WHEN tr.status = 'failed' THEN 1 ELSE 0 END) as recent_failure_rate
        FROM test_specs t
        JOIN aoma_test_dependencies td ON t.id = td.test_id
        JOIN test_results tr ON t.test_name = tr.test_name
        WHERE td.dependency_file = ANY(changed_files)
            AND tr.created_at > NOW() - INTERVAL '7 days'
        GROUP BY t.test_name
    )
    SELECT
        test_name,
        CASE
            WHEN impacted_files > 3 THEN 1
            WHEN recent_failure_rate > 0.3 THEN 2
            ELSE 3
        END as priority,
        (impacted_files * 0.4 + flakiness * 0.3 + recent_failure_rate * 0.3)::DECIMAL as risk_score,
        'Impacts ' || impacted_files || ' changed files' as reason
    FROM test_impact
    WHERE (impacted_files * 0.4 + flakiness * 0.3 + recent_failure_rate * 0.3) >= risk_threshold
    ORDER BY priority, risk_score DESC;
END;
$$ LANGUAGE plpgsql;
```

### 7. Integration with Existing SIAM Systems

#### Link to AOMA Knowledge

```sql
-- Connect test failures to AOMA console logs
CREATE OR REPLACE VIEW test_console_correlation AS
SELECT
    tr.test_name,
    tr.error_message,
    acl.message as console_error,
    acl.severity,
    acl.timestamp
FROM test_results tr
JOIN aoma_console_logs acl
    ON acl.session_id = tr.execution_id
    AND acl.timestamp BETWEEN tr.started_at AND tr.completed_at
WHERE tr.status = 'failed'
    AND acl.severity IN ('error', 'warning');
```

#### Link to Visual Testing

```sql
-- Connect test results to visual snapshots
ALTER TABLE visual_snapshots ADD COLUMN IF NOT EXISTS
    test_execution_id TEXT REFERENCES test_executions(execution_id);

CREATE INDEX idx_visual_test ON visual_snapshots(test_execution_id);
```

## 🎯 Implementation Priority

### Phase 1: Enhance Existing Tables (Week 1)

- [ ] Add missing columns to test_results
- [ ] Add missing columns to test_runs
- [ ] Add missing columns to generated_tests
- [ ] Create indexes for performance

### Phase 2: Create Core New Tables (Week 2)

- [ ] Create test_executions table with partitioning
- [ ] Create aut_analysis table for Firecrawl
- [ ] Create test_knowledge_base table
- [ ] Set up real-time subscriptions

### Phase 3: Add Intelligence Layer (Week 3)

- [ ] Create materialized views for analytics
- [ ] Add database functions for smart selection
- [ ] Implement vector embeddings
- [ ] Set up RLS policies

### Phase 4: Integration (Week 4)

- [ ] Link to AOMA systems
- [ ] Connect to visual testing
- [ ] Sync with support knowledge base
- [ ] Test end-to-end flow

## 🔄 Migration Strategy

```sql
-- Safe migration with rollback capability
BEGIN;

-- Create backup
CREATE TABLE test_results_backup AS SELECT * FROM test_results;

-- Apply enhancements
-- ... enhancement SQL ...

-- Verify
SELECT COUNT(*) FROM test_results;

-- Commit or rollback
COMMIT; -- or ROLLBACK;
```

## 📊 Monitoring

```sql
-- Monitor table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename LIKE 'test%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor query performance
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SELECT
    query,
    calls,
    mean_exec_time,
    total_exec_time
FROM pg_stat_statements
WHERE query LIKE '%test%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## 🚀 Next Steps

1. Review this plan with the team
2. Create migration scripts
3. Test in staging environment
4. Deploy incrementally with monitoring
5. Update application code to use enhanced schema
