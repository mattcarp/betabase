# Beta Base Database Discovery - Complete Results

**Date**: November 9, 2025
**Database**: Local Supabase (Docker) - postgresql://127.0.0.1:54322/postgres
**Status**: ✅ **DISCOVERED & VALIDATED**

---

## 🎯 **Executive Summary**

Successfully connected to Beta Base data in local Supabase and discovered:
- **8,449 scenarios** (test cases/templates)
- **34,631 test executions** (historical runs)
- **6,250 AOMA scenarios** (74% of all scenarios!)
- **Data spanning 2008-2022** (14+ years of test history)
- **78% pass rate** overall (27,027 passes / 34,631 total)

---

## 📊 **Key Statistics**

### **Scenarios (Test Cases)**
- **Total Count**: 8,449 scenarios
- **AOMA Scenarios**: 6,250 (74%)
- **Other Apps**: Promo (1,615), GRAS Lite (422), DX (103), Partner Previewer (59)
- **Date Range**: 2008-01-01 to 2022-07-18 (14+ years)
- **Unique Creators**: 16 people
- **Unique Apps**: 5 applications

### **Test Executions**
- **Total Count**: 34,631 test executions
- **AOMA Executions**: 20,961 (61%)
- **Pass Rate**: 78% (27,027 passes / 34,631 total)
- **Breakdown**:
  - Pass: 27,027 (78%)
  - Fail: 6,115 (18%)
  - Pending: 1,414 (4%)

### **AOMA-Specific Data**
- **Scenarios**: 6,250 test cases
- **Executions**: 20,961 runs
- **Average Executions/Scenario**: ~3.4 runs per scenario
- **Date Range**: 2008-2022 (oldest data!)
- **Quality**: Real user queries and expected behaviors

---

## 🏗️ **Database Schema (Actual)**

### **`scenario` Table** (8,449 rows)

```sql
CREATE TABLE scenario (
  id                            INTEGER PRIMARY KEY,
  name                          VARCHAR(255),         -- Test case name/description
  script                        TEXT,                 -- Test steps (HTML formatted)
  expected_result               TEXT,                 -- Expected outcome (HTML formatted)
  created_by                    VARCHAR(127),         -- Creator username
  updated_by                    VARCHAR(127),
  preconditions                 TEXT,                 -- Setup requirements
  created_at                    VARCHAR(255),         -- Creation timestamp
  updated_at                    VARCHAR(255),
  review_flag                   SMALLINT,
  flag_reason                   TEXT,
  app_under_test                VARCHAR(255),         -- 'AOMA', 'Promo', etc.
  tags                          VARCHAR(255),         -- Comma-separated tags
  coverage                      VARCHAR(128),
  client_priority               SMALLINT,
  mode                          VARCHAR(255),
  is_security                   SMALLINT,
  priority_sort_order           INTEGER,
  enhancement_sort_order        INTEGER,
  current_regression_sort_order INTEGER,
  reviewed_flag                 VARCHAR(1)
);
```

**Key Fields for RLHF Integration**:
- `name` - Test case description (user-facing query)
- `script` - Steps to execute (may contain AOMA workflows)
- `expected_result` - What should happen (ground truth!)
- `app_under_test` - Filter for AOMA scenarios
- `created_at` - Age-based relevance scoring
- `tags` - Categorization

---

### **`test` Table** (34,631 rows)

```sql
CREATE TABLE test (
  id               INTEGER PRIMARY KEY,
  scenario_id      INTEGER,              -- FK to scenario table
  created_at       VARCHAR(255),         -- Execution timestamp
  comments         TEXT,
  ticket           VARCHAR(255),         -- Related Jira ticket
  created_by       VARCHAR(127),         -- Who ran this test
  input            TEXT,                 -- Actual input used
  result           TEXT,                 -- Actual output received
  pass_fail        VARCHAR(32),          -- 'Pass', 'Fail', 'Pending'
  build            VARCHAR(127),         -- AOMA build version
  updated_at       VARCHAR(255),
  updated_by       VARCHAR(127),
  path             VARCHAR(255),
  browser_name     VARCHAR(255),         -- Test environment
  browser_major    VARCHAR(255),
  browser_minor    VARCHAR(255),
  os_name          VARCHAR(255),
  os_major         VARCHAR(255),
  os_minor         VARCHAR(255),
  deployment_stamp VARCHAR(255),
  in_prod          VARCHAR(255)
);
```

**Key Fields for RLHF Integration**:
- `scenario_id` - Link to scenario
- `pass_fail` - Historical success rate
- `created_at` - When executed (trend analysis)
- `build` - Which AOMA version (correlation with failures)
- `input` / `result` - Actual vs expected comparison
- `ticket` - Link to known issues

---

## 🎨 **Sample AOMA Scenarios**

### **Example 1**: Hot Swap DSD Master
```
ID: 4363
Name: "Hot swap Test Case #8: Swap an Audio DSD Master for a product which
       is not published yet with another Audio DSD Master"
Created: 2015-06-11
App: AOMA
```

### **Example 2**: Package Graphics Registration
```
ID: 2093
Name: "Package Graphics Registration 2. Common Registration Test Cases:
       Register a graphics with descriptor files and corresponding pdfs"
Created: 2013-01-17
App: AOMA
```

### **Example 3**: Vinyl 16b Support
```
ID: 4852
Name: "Vinyl 16b Support Test Case #20: User has Auto export destination set
       to Manufacturing - Central European Services (CES) and registers a
       vinyl 16b product – Direct Upload"
Created: 2015-07-08
App: AOMA
```

**Observation**:
- Test names are very descriptive (user queries!)
- HTML-formatted scripts and expected results
- Real AOMA workflows from 2008-2022
- Specific feature testing (DDP Descriptor, Supply Chain, etc.)

---

## 📋 **App Distribution**

| App Under Test     | Scenarios | Test Executions | Avg Runs/Scenario |
|--------------------|-----------|-----------------|-------------------|
| **AOMA**           | 6,250     | 20,961          | 3.4               |
| **Promo**          | 1,615     | 12,967          | 8.0               |
| **GRAS Lite**      | 422       | 532             | 1.3               |
| **DX**             | 103       | 102             | 1.0               |
| **Partner Previewer** | 59     | 69              | 1.2               |
| **Total**          | **8,449** | **34,631**      | **4.1**           |

**Insight**: AOMA has the most scenarios but moderate execution frequency. Promo has fewer scenarios but higher execution rate (more frequently run tests).

---

## 🕐 **Age Analysis**

### **Timeline**
- **Oldest**: 2008-01-01 (17 years ago!)
- **Newest**: 2022-07-18 (2.5 years ago)
- **Gap**: No new scenarios added since 2022

### **Implications**
- ✅ **Valuable**: 6,250 real AOMA scenarios with actual user workflows
- ⚠️ **Outdated**: 2.5+ years old, may reference deprecated features
- ⚠️ **Very Outdated**: Many scenarios from 2008-2015 (10+ years old)
- ✅ **Historical Trends**: 20,961 executions show what used to work/fail

### **Relevance Strategy Needed**
- **Recent** (2020-2022): ~20% likely still relevant
- **Medium** (2015-2019): ~40% may need modernization
- **Old** (2008-2014): ~40% mostly for pattern extraction

---

## 🎯 **Value Proposition for RLHF**

### **What Beta Base Provides**

1. **Real User Queries** (via scenario names)
   - "How do I register graphics with descriptor files?"
   - "How do I swap a DSD Master?"
   - "How do I set auto export destination?"

2. **Expected Behaviors** (via expected_result)
   - What AOMA should return for each query
   - Ground truth for validation
   - Error messages users expect

3. **Historical Performance** (via test executions)
   - Which queries consistently passed
   - Which queries frequently failed
   - Regression detection (used to pass, now fails)

4. **Query Patterns** (via script)
   - How users phrase AOMA questions
   - Common workflows (registration, export, etc.)
   - Feature-specific terminology

5. **Known Issues** (via ticket field)
   - Link to Jira tickets
   - Known bugs and workarounds
   - Historical context for failures

---

## 🚀 **Integration Strategy**

### **Phase 1: AOMA Scenario Import** (Immediate)
1. Extract 6,250 AOMA scenarios from local Supabase
2. Store in SIAM database for analysis
3. Compute relevance scores (age, content, execution history)
4. Classify into GOLD/SILVER/BRONZE/TRASH tiers

### **Phase 2: Similarity Matching** (Week 1)
1. For each RLHF feedback query, find similar Beta Base scenarios
2. Show historical context: "This query pattern failed 15 times in 2018"
3. Display expected result from Beta Base
4. Link to execution history

### **Phase 3: Pattern Extraction** (Week 2)
1. Extract common query patterns from 6,250 scenarios
2. Identify high-value patterns (high pass rate)
3. Avoid low-value patterns (high fail rate)
4. Build query suggestion system

### **Phase 4: Test Modernization** (Ongoing)
1. GOLD tier: Use as-is for regression testing
2. SILVER tier: AI-assisted modernization
3. BRONZE tier: Pattern extraction only
4. TRASH tier: Discard

---

## 🔍 **Discovery Queries Used**

### **1. Table Discovery**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### **2. Scenario Count**
```sql
SELECT COUNT(*) as total_scenarios FROM scenario;
-- Result: 8,449
```

### **3. Test Count**
```sql
SELECT COUNT(*) as total_tests FROM test;
-- Result: 34,631
```

### **4. Age Analysis**
```sql
SELECT
  MIN(created_at) as oldest_scenario,
  MAX(created_at) as newest_scenario,
  COUNT(DISTINCT app_under_test) as unique_apps,
  COUNT(DISTINCT created_by) as unique_creators
FROM scenario
WHERE created_at IS NOT NULL AND created_at != '';
```

### **5. App Distribution**
```sql
SELECT
  app_under_test,
  COUNT(*) as scenario_count
FROM scenario
WHERE app_under_test IS NOT NULL AND app_under_test != ''
GROUP BY app_under_test
ORDER BY scenario_count DESC;
```

### **6. Pass/Fail Distribution**
```sql
SELECT
  pass_fail,
  COUNT(*) as test_count
FROM test
WHERE pass_fail IS NOT NULL AND pass_fail != ''
GROUP BY pass_fail
ORDER BY test_count DESC;
```

---

## ⚙️ **Connection Details**

### **Local Supabase (Docker)**
- **API URL**: http://127.0.0.1:54321
- **Database URL**: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **Studio URL**: http://127.0.0.1:54323
- **MCP URL**: http://127.0.0.1:54321/mcp

### **Direct PostgreSQL Connection**
```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres
```

### **Via Supabase CLI**
```bash
supabase status  # Get connection info
supabase db reset  # Reset database (careful!)
```

---

## ✅ **Validation Checklist**

- [x] Connected to local Supabase successfully
- [x] Found `scenario` table (8,449 rows)
- [x] Found `test` table (34,631 rows)
- [x] Verified AOMA scenarios exist (6,250)
- [x] Analyzed age distribution (2008-2022)
- [x] Checked pass/fail rates (78% pass)
- [x] Sampled actual scenario data
- [x] Documented schema structure
- [x] Identified relationship (scenario ← test)

---

## 🎯 **Next Steps**

### **Immediate**
1. ✅ Document discovery results (this file)
2. ⏳ Update Feature Roadmap with actual data
3. ⏳ Update Beta Base ERD with actual schema
4. ⏳ Build import script to copy scenarios to SIAM database

### **This Week**
1. Import AOMA scenarios to SIAM database
2. Build relevance scoring algorithm
3. Classify scenarios into tiers
4. Link top 100 scenarios to RLHF feedback

### **Next Week**
1. Build Beta Base Explorer UI component
2. Show similar scenarios in RLHF tab
3. Display execution history
4. Extract query patterns

---

## 📝 **Important Notes**

### **Data Quality**
- ✅ **Good**: Real user queries, actual workflows, historical context
- ⚠️ **Challenge**: HTML-formatted text (needs parsing)
- ⚠️ **Challenge**: 2.5+ years outdated (needs relevance filtering)
- ⚠️ **Challenge**: Some very old scenarios (10+ years)

### **Format Challenges**
- `script` and `expected_result` are HTML-formatted
- Need to strip HTML tags for clean query extraction
- May need LLM to parse complex HTML content
- Some scenarios have incomplete data

### **Opportunities**
- 6,250 real AOMA test cases = goldmine for RLHF
- 20,961 executions = trend analysis potential
- 78% pass rate = high-quality baseline
- Historical data = regression detection

---

**Status**: Discovery complete, integration ready to begin
**Owner**: Matt Carpenter
**Next Action**: Build import script for AOMA scenarios
**Timeline**: Integration can begin immediately
