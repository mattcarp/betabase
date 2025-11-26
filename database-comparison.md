# Database Comparison: betabase_backup vs mc-tk

## Summary

| Database | Location | Total Tables | Total Rows | Purpose |
|----------|----------|--------------|------------|---------|
| **betabase_backup** | localhost:54322 | 8 | 44,853 | AOMA Test Management |
| **mc-tk** | Supabase Cloud | 15 | 116 | AI Conversation & Knowledge |

---

## Table Comparison

### 📊 Tables in betabase_backup (Local)

| Table | Rows | Status in mc-tk |
|-------|------|-----------------|
| **application** | 10 | ❌ MISSING |
| **cases** | 1,359 | ❌ MISSING |
| **deployment** | 1,793 | ❌ MISSING |
| **round** | 154 | ❌ MISSING |
| **scenario** | 8,449 | ❌ MISSING |
| **test** | 34,631 | ❌ MISSING |
| **user** | 30 | ⚠️ EXISTS (different structure, 0 rows in mc-tk) |
| **variation** | 67 | ❌ MISSING |

**Total in betabase_backup:** 44,853 rows across 8 tables

---

### 📊 Tables in mc-tk (Supabase)

| Table | Rows | Status in betabase |
|-------|------|--------------------|
| **Account** | 0 | ❌ MISSING |
| **Session** | 7 | ❌ MISSING |
| **User** | 1 | ⚠️ Similar to 'user' table |
| **VerificationToken** | 14 | ❌ MISSING |
| **accessibility** | 0 | ❌ MISSING |
| **accounts** | 0 | ❌ MISSING |
| **conversations** | 1 | ❌ MISSING |
| **links** | 0 | ❌ MISSING |
| **logs** | 0 | ❌ MISSING |
| **messages** | 21 | ❌ MISSING |
| **pages** | 7 | ❌ MISSING |
| **sessions** | 0 | ❌ MISSING |
| **todos** | 65 | ❌ MISSING |
| **traces** | 0 | ❌ MISSING |
| **users** | 0 | ⚠️ Similar to 'user' table |

**Total in mc-tk:** 116 rows across 15 tables

---

## 🚨 What's Missing in mc-tk

### High-Value Tables NOT in mc-tk:

1. **scenario** (8,449 rows) ⭐ CRITICAL
   - Test scenario definitions
   - Contains test scripts, expected results, preconditions
   - Core testing knowledge base

2. **test** (34,631 rows) ⭐ CRITICAL
   - Actual test execution results
   - Pass/fail history
   - Browser/OS/build information
   - Links to scenarios via `scenario_id`

3. **deployment** (1,793 rows) ⭐ IMPORTANT
   - Deployment tracking
   - Build numbers and branches
   - Deployment timestamps

4. **cases** (1,359 rows)
   - Legacy test cases (older format)

5. **round** (154 rows)
   - Test rounds/release cycles
   - Release planning data

6. **variation** (67 rows)
   - Test scenario variations
   - Links to scenarios via `scenario_id`

7. **application** (10 rows)
   - Applications under test
   - Only 10 apps tracked

8. **user** (30 rows)
   - Testers and system users
   - Different from mc-tk's User/users tables

---

## 💡 Integration Opportunities

### Option A: Import All Test Data to mc-tk
**Copy betabase_backup tables → mc-tk**
- Preserve all 44,853 test records
- Add test management to AI system
- Enable AI queries over test history

### Option B: Selective Import (Recommended)
**Import only key tables:**
1. **scenario** → Could become `test_scenarios` in mc-tk
2. **test** → Could become `test_results` in mc-tk
3. **deployment** → Could become `deployments` in mc-tk
4. Merge **user** tables (30 local + 0 remote)

### Option C: Create Embeddings
**Generate embeddings for scenarios:**
- Use mc-tk's existing `pages` table structure (has `embedding` column)
- Create searchable test scenario knowledge base
- Enable RAG over test cases

### Option D: Link Systems
**Keep separate but connected:**
- Store test IDs in mc-tk conversations
- Reference tests in AI discussions
- Don't duplicate data

---

## 🎯 Next Steps?

What's your vision for the integration? Should we:

1. Import specific tables from betabase → mc-tk?
2. Create embeddings for test scenarios?
3. Design a unified schema?
4. Something else?

Let me know what you want to tackle! 🚀
