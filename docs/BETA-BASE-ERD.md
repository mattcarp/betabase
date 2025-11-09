# Beta Base Database ERD

**Last Updated**: November 9, 2025
**Status**: ✅ **VALIDATED** - Actual schema from local Supabase
**Source System**: Beta Base (legacy test management system)
**Connection**: Local Supabase Docker - postgresql://127.0.0.1:54322/postgres

---

## 🏗️ **Database Structure Overview**

Beta Base uses a **two-tier testing architecture**:

1. **Scenarios (Test Cases)** - The blueprint/template
2. **Tests (Test Executions)** - The actual runs

---

## 📊 **Entity Relationship Diagram** (Actual Schema)

```
┌─────────────────────────────────────────────┐
│          SCENARIO                           │
│  (Test Cases / Templates)                   │
│  8,449 rows (6,250 AOMA)                   │
├─────────────────────────────────────────────┤
│ • id (INTEGER PK)                           │
│ • name (VARCHAR 255)                        │
│ • script (TEXT - HTML formatted)            │
│ • expected_result (TEXT - HTML formatted)   │
│ • created_by (VARCHAR 127)                  │
│ • updated_by (VARCHAR 127)                  │
│ • preconditions (TEXT)                      │
│ • created_at (VARCHAR 255)                  │
│ • updated_at (VARCHAR 255)                  │
│ • review_flag (SMALLINT)                    │
│ • flag_reason (TEXT)                        │
│ • app_under_test (VARCHAR 255) [AOMA/...]  │
│ • tags (VARCHAR 255 - comma-separated)     │
│ • coverage (VARCHAR 128)                    │
│ • client_priority (SMALLINT)                │
│ • mode (VARCHAR 255)                        │
│ • is_security (SMALLINT)                    │
│ • priority_sort_order (INTEGER)             │
│ • enhancement_sort_order (INTEGER)          │
│ • current_regression_sort_order (INTEGER)   │
│ • reviewed_flag (VARCHAR 1)                 │
└─────────────────────────────────────────────┘
              │
              │ 1
              │
              │ has many
              │
              │ N
              ▼
┌─────────────────────────────────────────────┐
│           TEST                              │
│  (Test Executions / Runs)                   │
│  34,631 rows (20,961 AOMA)                 │
├─────────────────────────────────────────────┤
│ • id (INTEGER PK)                           │
│ • scenario_id (INTEGER FK)                  │
│ • created_at (VARCHAR 255)                  │
│ • comments (TEXT)                           │
│ • ticket (VARCHAR 255)                      │
│ • created_by (VARCHAR 127)                  │
│ • input (TEXT)                              │
│ • result (TEXT)                             │
│ • pass_fail (VARCHAR 32) [Pass/Fail/Pend]  │
│ • build (VARCHAR 127)                       │
│ • updated_at (VARCHAR 255)                  │
│ • updated_by (VARCHAR 127)                  │
│ • path (VARCHAR 255)                        │
│ • browser_name (VARCHAR 255)                │
│ • browser_major (VARCHAR 255)               │
│ • browser_minor (VARCHAR 255)               │
│ • os_name (VARCHAR 255)                     │
│ • os_major (VARCHAR 255)                    │
│ • os_minor (VARCHAR 255)                    │
│ • deployment_stamp (VARCHAR 255)            │
│ • in_prod (VARCHAR 255)                     │
└─────────────────────────────────────────────┘
```

---

## 📝 **Entity Definitions**

### **Scenarios Table**

**Purpose**: Stores the test case templates - the "what should be tested"

**Key Characteristics**:
- ONE scenario = ONE unique test case
- Contains the test script and expected behavior
- Can be executed multiple times (generates many Tests)
- Represents the "source of truth" for what behavior is expected

**Actual Count**: **8,449 scenarios** (6,250 AOMA-specific = 74%)

**Example**:
```typescript
interface Scenario {
  id: string;
  test_script: string;           // The test code/steps
  test_description: string;      // Human-readable description
  input_query: string;           // Query to test
  expected_output: string;       // Expected result
  category: string;              // e.g., "aoma-search", "jira-integration"
  priority: 'high' | 'medium' | 'low';
  created_date: Date;            // When this test was created
  created_by: string;            // Who created it
  tags: string[];                // Categorization tags
  metadata: {
    aoma_feature?: string;
    test_type?: string;
    complexity?: string;
    [key: string]: any;
  };
}
```

---

### **Tests Table**

**Purpose**: Stores individual test executions - the "what actually happened"

**Key Characteristics**:
- MANY tests per ONE scenario
- Contains actual results from running the scenario
- Tracks pass/fail history over time
- Shows how behavior has changed

**Actual Count**: **34,631 test executions** (20,961 AOMA-specific = 61%)

**Example**:
```typescript
interface TestExecution {
  id: string;
  scenario_id: string;           // FK to scenarios table
  actual_output: string;         // What the system actually returned
  pass_fail: boolean;            // Did it match expected?
  execution_date: Date;          // When this run happened
  execution_time_ms: number;     // How long it took
  error_message?: string;        // If failed, why?
  environment: string;           // 'production' | 'staging' | 'dev'
  executed_by: string;           // Who/what ran this test
  system_version: string;        // AOMA version at time of test
  metadata: {
    confidence_score?: number;
    similarity_score?: number;
    [key: string]: any;
  };
}
```

---

## 🎯 **Key Insights for Historical Test Integration**

### **What the "10,000+ tests" Actually Means**

Based on actual discovery, the data contains:
- **8,449 SCENARIOS** (unique test cases) - 6,250 AOMA-specific
- Each scenario executed ~3.4 times on average
- **34,631 TEST EXECUTIONS** (actual runs) - 20,961 AOMA-specific
- **Data spans 2008-2022** (14+ years of history)
- **78% pass rate** overall (27,027 passes / 34,631 total)

### **Value Proposition**

**Scenarios** are valuable because they contain:
- ✅ **Domain knowledge** - What questions users ask about AOMA
- ✅ **Query patterns** - How people phrase questions
- ✅ **Expected behaviors** - What the correct answer should be
- ✅ **Test coverage** - What functionality was important to test

**Test Executions** are valuable because they show:
- ✅ **Historical performance** - How often did this scenario pass?
- ✅ **Trend analysis** - Is it getting better or worse over time?
- ✅ **Regression detection** - Did it used to work but now fails?
- ✅ **Stability indicators** - Flaky tests vs reliable ones

### **Challenge: Outdated Data**

Many scenarios were created "several years ago" for Beta Base system, which means:
- ❌ May reference old AOMA features
- ❌ May use deprecated terminology (IOMA vs AOMA)
- ❌ May test functionality that no longer exists
- ✅ BUT: Query patterns and user intents still valuable
- ✅ AND: Core AOMA functionality likely unchanged

---

## 🔍 **Discovery Queries (To Run Once MCP Connected)**

### **Count Scenarios**
```sql
SELECT
  COUNT(*) as total_scenarios,
  MIN(created_date) as oldest_scenario,
  MAX(created_date) as newest_scenario,
  COUNT(DISTINCT category) as unique_categories
FROM scenarios;
```

### **Count Test Executions**
```sql
SELECT
  COUNT(*) as total_executions,
  COUNT(DISTINCT scenario_id) as scenarios_with_executions,
  SUM(CASE WHEN pass_fail = true THEN 1 ELSE 0 END) as total_passes,
  SUM(CASE WHEN pass_fail = false THEN 1 ELSE 0 END) as total_failures,
  MIN(execution_date) as first_execution,
  MAX(execution_date) as last_execution
FROM tests;
```

### **Scenario Execution Frequency**
```sql
SELECT
  s.id,
  s.test_description,
  COUNT(t.id) as execution_count,
  SUM(CASE WHEN t.pass_fail = true THEN 1 ELSE 0 END)::float / COUNT(t.id) as pass_rate,
  MAX(t.execution_date) as last_run
FROM scenarios s
LEFT JOIN tests t ON s.id = t.scenario_id
GROUP BY s.id, s.test_description
ORDER BY execution_count DESC
LIMIT 20;
```

### **Category Distribution**
```sql
SELECT
  category,
  COUNT(*) as scenario_count,
  MIN(created_date) as oldest,
  MAX(created_date) as newest
FROM scenarios
GROUP BY category
ORDER BY scenario_count DESC;
```

### **Age Analysis**
```sql
SELECT
  EXTRACT(YEAR FROM created_date) as year,
  COUNT(*) as scenarios_created,
  COUNT(DISTINCT category) as categories
FROM scenarios
GROUP BY EXTRACT(YEAR FROM created_date)
ORDER BY year DESC;
```

---

## 📋 **Integration Strategy**

### **Phase 1: Scenario Analysis**
1. Extract all scenarios from Beta Base
2. Categorize by:
   - Age (how old is the scenario?)
   - Execution history (was it ever run? when?)
   - Pass rate (historically successful or problematic?)
   - Category (AOMA feature area)

### **Phase 2: Relevance Scoring**
For each scenario, score:
- **Temporal relevance**: How old is it?
- **Semantic relevance**: Still applicable to current AOMA?
- **Pattern value**: Is the query pattern still useful?
- **Historical performance**: Did it consistently pass/fail?

### **Phase 3: Modernization**
- **GOLD tier** (keep as-is): Recent scenarios, timeless patterns
- **SILVER tier** (needs updating): Good intent, outdated details
- **BRONZE tier** (archive): Historical reference only
- **TRASH tier** (discard): Completely obsolete

### **Phase 4: RLHF Integration**
- Link scenarios to RLHF feedback items
- Find similar historical scenarios for new queries
- Use test execution history to predict failure modes
- Learn from patterns that historically worked well

---

## 🔧 **Next Steps**

### **Immediate** ✅ **COMPLETED**
- [x] Connected to local Supabase Docker instance
- [x] Ran discovery queries to validate schema
- [x] Counted actual scenarios (8,449) and test executions (34,631)
- [x] Analyzed app distribution (AOMA: 6,250 scenarios)
- [x] Identified date ranges (2008-2022)

### **Short-Term**
- [ ] Build scenario relevance scoring algorithm
- [ ] Create tiering system (GOLD/SILVER/BRONZE/TRASH)
- [ ] Extract top 100 scenarios for pilot testing
- [ ] Link to RLHF system

### **Long-Term**
- [ ] Full scenario migration to modern format
- [ ] Integration with SIAM test suite
- [ ] Automated pattern extraction
- [ ] Historical trend analysis dashboard

---

## 🎯 **Actual Data Volumes** ✅

Discovered from local Supabase (November 9, 2025):

| Metric | Actual Value |
|--------|--------------|
| **Total Scenarios** | 8,449 |
| **AOMA Scenarios** | 6,250 (74%) |
| **Total Test Executions** | 34,631 |
| **AOMA Executions** | 20,961 (61%) |
| **Avg Executions/Scenario** | 4.1 overall, 3.4 for AOMA |
| **Active Apps** | 5 (AOMA, Promo, GRAS Lite, DX, Partner Previewer) |
| **Date Range** | 2008-01-01 to 2022-07-18 |
| **Pass Rate** | 78% (27,027 passes / 34,631 total) |

**Source**: See `docs/BETA-BASE-DISCOVERY-RESULTS.md` for complete analysis

---

## 🚨 **Important Distinctions**

### **Scenarios ≠ Tests**
- **Scenario**: The template ("Test that search works")
- **Test**: The execution ("Search worked on 2023-05-15")

### **When People Say "10k Tests" They Mean:**
- Could mean 10k scenarios (templates)
- Could mean 10k test executions (runs)
- **Clarification needed** via discovery queries

### **For RLHF Integration:**
- **Scenarios** provide the query patterns and expected behaviors
- **Tests** provide the historical performance data
- **Both** are valuable for different reasons

---

**Status**: ✅ Validated - Actual schema documented
**Next Action**: Build import script to extract AOMA scenarios
**Owner**: Matt Carpenter
**Source System**: Beta Base (legacy) - Local Supabase Docker
**Target System**: SIAM (modern)
**Connection**: postgresql://postgres:postgres@127.0.0.1:54322/postgres
