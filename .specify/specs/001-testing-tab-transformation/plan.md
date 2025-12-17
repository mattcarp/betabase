# Implementation Plan: Testing Tab Transformation

## Technical Overview

This plan transforms the Testing tab from mock data to real data by:
1. Connecting existing React components to Supabase queries
2. Creating missing database tables/views
3. Wiring up the RLHF feedback loop
4. Implementing AI-powered analysis features
5. Redesigning the UI for demo quality

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | React 19 + Next.js 15 | Existing stack |
| **UI** | Tailwind + shadcn/ui | MAC Design System |
| **Database** | Supabase PostgreSQL | pgvector for embeddings |
| **AI** | Gemini 2.5 Flash/Pro | Analysis, code generation |
| **Embeddings** | Gemini text-embedding-004 | 768 dimensions |
| **Testing** | Playwright | Generated test execution |

---

## Database Strategy

### Existing Tables to Use

```sql
-- Legacy Betabase tables (read-only, don't modify structure)
bb_case          -- Test cases (scenarios)
bb_deployment    -- Deployment history
bb_round         -- Test rounds
bb_variation     -- Test variations
bb_application   -- Apps under test
bb_user          -- QA testers

-- Current SIAM tables
siam_vectors     -- Knowledge base (use for test context)
rlhf_feedback    -- User feedback on AI responses
```

### New Tables/Views to Create

```sql
-- View to unify historical tests
CREATE VIEW historical_tests_view AS
SELECT 
  c.id,
  c.name as test_name,
  c.description,
  c.category,
  c.steps,
  c.expected_result,
  c.created_at,
  c.updated_at,
  -- Calculate confidence score
  CASE 
    WHEN c.updated_at > NOW() - INTERVAL '90 days' THEN 0.9
    WHEN c.updated_at > NOW() - INTERVAL '180 days' THEN 0.7
    WHEN c.updated_at > NOW() - INTERVAL '365 days' THEN 0.5
    ELSE 0.3
  END as base_confidence
FROM bb_case c;

-- RLHF generated tests table
CREATE TABLE rlhf_generated_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_feedback_id UUID REFERENCES rlhf_feedback(id),
  test_name TEXT NOT NULL,
  test_code TEXT NOT NULL,
  language TEXT DEFAULT 'typescript',
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, passing, failing
  confidence FLOAT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  last_run_result TEXT
);

-- Self-healing attempts table
CREATE TABLE self_healing_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL,
  test_name TEXT NOT NULL,
  test_file TEXT,
  old_selector TEXT NOT NULL,
  new_selector TEXT NOT NULL,
  healing_tier INT CHECK (healing_tier IN (1, 2, 3)),
  confidence FLOAT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, auto-approved
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT
);

-- Test analytics aggregates (materialized for performance)
CREATE MATERIALIZED VIEW test_analytics_daily AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE status = 'passed') as passed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  AVG(duration_ms) as avg_duration,
  COUNT(DISTINCT test_name) as unique_tests
FROM test_results
GROUP BY DATE_TRUNC('day', created_at);
```

---

## Component Mapping

### Existing Components → Data Sources

| Component | Current State | Target Data Source |
|-----------|---------------|-------------------|
| `TestHomeDashboard` | Mock stats | `test_analytics_daily` view |
| `HistoricalTestExplorer` | Disabled | `historical_tests_view` |
| `RLHFTestSuite` | Falls back to empty | `rlhf_generated_tests` table |
| `SelfHealingTestViewer` | Mock data | `self_healing_attempts` table |
| `RLHFImpactDashboard` | Mock charts | `rlhf_feedback` + analytics |
| `TestResultsViewer` | Mock results | `test_results` table |
| `AITestGenerator` | UI only | Gemini API + save to `rlhf_generated_tests` |
| `TestAnalytics` | Mock charts | `test_analytics_daily` + live queries |

---

## API Endpoints

### New Endpoints to Create

```typescript
// Historical tests
GET  /api/tests/historical          // Paginated list from bb_case
GET  /api/tests/historical/:id      // Single test details
POST /api/tests/historical/:id/analyze  // AI confidence scoring

// RLHF generated tests
GET  /api/tests/rlhf               // List generated tests
POST /api/tests/rlhf/generate      // Generate test from feedback
PUT  /api/tests/rlhf/:id/approve   // Approve/reject
POST /api/tests/rlhf/:id/run       // Execute test

// Self-healing
GET  /api/self-healing/queue       // Pending healings
PUT  /api/self-healing/:id/resolve // Approve/reject healing
GET  /api/self-healing/history     // Past healings

// Analytics
GET  /api/tests/analytics          // Dashboard metrics
GET  /api/tests/analytics/trends   // Time-series data

// Conversion
POST /api/tests/convert-to-playwright  // Manual → automated
```

---

## AI Integration Points

### 1. Confidence Scoring (US2)

```typescript
// Prompt for Gemini
const prompt = `Analyze this test case and estimate its relevance:

Test Name: ${test.name}
Description: ${test.description}
Steps: ${test.steps}
Last Updated: ${test.updated_at}
Category: ${test.category}

Consider:
1. Is this testing current functionality?
2. Are the selectors/steps likely still valid?
3. Is this a regression risk area?

Return JSON: { confidence: 0-100, reasoning: "..." }`;
```

### 2. Test Conversion (US3)

```typescript
// Prompt for Gemini
const prompt = `Convert this manual test to Playwright:

Manual Test: ${test.name}
Steps:
${test.steps}

Expected Result: ${test.expected_result}

Generate a complete Playwright test file with:
- Proper imports
- describe/test blocks
- Page object pattern if appropriate
- Comments referencing original test ID: ${test.id}`;
```

### 3. RLHF Test Generation (US4)

```typescript
// Prompt for Gemini
const prompt = `Generate a regression test based on this user feedback:

User Query: ${feedback.query}
AI Response: ${feedback.response}
User Correction: ${feedback.correction}
Rating: ${feedback.rating}/5

Generate a Playwright test that would catch this type of error in the future.`;
```

---

## UI Design Direction

### Color Palette (MAC Design System)

```css
--bg-primary: #09090b;      /* zinc-950 */
--bg-secondary: #18181b;    /* zinc-900 */
--accent-primary: #3b82f6;  /* blue-500 */
--accent-success: #22c55e;  /* green-500 */
--accent-warning: #f59e0b;  /* amber-500 */
--accent-danger: #ef4444;   /* red-500 */
--text-primary: #fafafa;    /* zinc-50 */
--text-muted: #a1a1aa;      /* zinc-400 */
```

### Typography

- **Headings**: JetBrains Mono or Fira Code (developer aesthetic)
- **Body**: Inter (for readability)
- **Code**: JetBrains Mono

### Key UI Improvements

1. **Dashboard Cards**: Gradient borders, subtle animations on hover
2. **Test List**: Virtualized scrolling for 8,000+ items
3. **Confidence Badges**: Color-coded (green >70%, yellow 50-70%, red <50%)
4. **Code Editor**: Monaco editor with syntax highlighting
5. **Charts**: Recharts with smooth animations

---

## Implementation Order

### Phase 1: Data Foundation (US1)
1. Create database views/tables
2. Build API endpoints for historical tests
3. Connect `HistoricalTestExplorer` to real data
4. Implement pagination and filtering

### Phase 2: AI Analysis (US2, US3)
1. Implement confidence scoring API
2. Add confidence badges to test list
3. Build test conversion endpoint
4. Integrate Playwright code generation

### Phase 3: RLHF Loop (US4)
1. Create `rlhf_generated_tests` table
2. Build test generation from feedback
3. Connect `RLHFTestSuite` component
4. Implement approve/reject workflow

### Phase 4: Self-Healing (US5)
1. Create `self_healing_attempts` table
2. Wire up real healing data
3. Implement review queue
4. Add approval workflow

### Phase 5: Analytics & Polish (US6, US7)
1. Build analytics views
2. Connect real metrics
3. UI redesign pass
4. Animation polish

---

## Testing Strategy

### For Each User Story

1. **API Tests**: Verify endpoints return expected data
2. **Component Tests**: Verify UI renders with real data
3. **E2E Tests**: Full user flows in Playwright
4. **Visual Regression**: Screenshot comparison

### Demo Path Testing

Critical path that MUST work for demo:
1. Open Testing tab
2. See real test counts (not 0)
3. Browse historical tests
4. Click test, see details
5. See confidence score
6. Convert to automated
7. View RLHF tests
8. Approve self-healing fix
9. View analytics dashboard

---

## Rollback Strategy

All changes on `001-testing-tab-transformation` branch. If demo fails:
1. `git checkout main`
2. Demo uses old mock UI (better than broken real UI)

---

*Plan created: 2025-12-17*

