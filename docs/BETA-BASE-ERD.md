# Beta Base Database ERD

**Last Updated**: November 9, 2025
**Status**: Documented from user description - Awaiting MCP connection for validation
**Source System**: Beta Base (legacy test management system)

---

## 🏗️ **Database Structure Overview**

Beta Base uses a **two-tier testing architecture**:

1. **Scenarios (Test Cases)** - The blueprint/template
2. **Tests (Test Executions)** - The actual runs

---

## 📊 **Entity Relationship Diagram**

```
┌─────────────────────────────────────┐
│          SCENARIOS                  │
│  (Test Cases / Templates)           │
├─────────────────────────────────────┤
│ • id (PK)                           │
│ • test_script                       │
│ • test_description                  │
│ • input_query                       │
│ • expected_output                   │
│ • category                          │
│ • priority                          │
│ • created_date                      │
│ • created_by                        │
│ • tags                              │
│ • metadata                          │
└─────────────────────────────────────┘
              │
              │ 1
              │
              │ has many
              │
              │ N
              ▼
┌─────────────────────────────────────┐
│           TESTS                     │
│  (Test Executions / Runs)           │
├─────────────────────────────────────┤
│ • id (PK)                           │
│ • scenario_id (FK)                  │
│ • actual_output                     │
│ • pass_fail (boolean)               │
│ • execution_date                    │
│ • execution_time_ms                 │
│ • error_message                     │
│ • environment                       │
│ • executed_by                       │
│ • system_version                    │
│ • metadata                          │
└─────────────────────────────────────┘
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

**Estimated Count**: ~10,000+ scenarios (TBD - requires MCP query)

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

**Estimated Count**: Unknown (could be 100k+ executions across all scenarios)

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

Based on Matt's description, the "10,000+ tests" refers to:
- **10,000+ SCENARIOS** (unique test cases)
- Each scenario may have been executed multiple times
- Total TEST EXECUTIONS could be much higher (50k-500k+?)

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

### **Immediate (Requires MCP Connection)**
- [ ] Connect to Beta Base Supabase MCP
- [ ] Run discovery queries to validate schema
- [ ] Count actual scenarios and test executions
- [ ] Analyze category distribution
- [ ] Identify date ranges (oldest/newest)

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

## 🎯 **Expected Data Volumes (Estimates)**

Based on typical test management systems:

| Metric | Conservative | Likely | Optimistic |
|--------|-------------|--------|------------|
| **Scenarios** | 8,000 | 10,000 | 15,000 |
| **Test Executions** | 50,000 | 150,000 | 500,000 |
| **Avg Executions/Scenario** | 6 | 15 | 33 |
| **Active Categories** | 10 | 20 | 30 |
| **Date Range** | 2020-2023 | 2018-2024 | 2015-2024 |

**Note**: These are estimates. Actual numbers will be determined once MCP connection is established.

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

**Status**: Documented based on user description
**Next Action**: Establish MCP connection to validate and discover actual data
**Owner**: Matt Carpenter
**Source System**: Beta Base (legacy)
**Target System**: SIAM (modern)
