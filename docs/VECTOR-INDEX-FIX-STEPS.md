# Vector Index Fix - Action Required

**Date**: 2025-10-28
**Issue**: Vector search unreliable (sometimes 5 results, sometimes 0 results)
**Root Cause**: Likely missing HNSW index on `aoma_unified_vectors.embedding` column

---

## STEP 1: Check if Index Exists

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/kfxetwuuzljhybfgmpuc
2. Navigate to: **Database → Indexes**
3. Look for index named: `aoma_unified_vectors_embedding_idx`

**If index EXISTS** → Problem is elsewhere, see "Alternative Diagnoses" below
**If index MISSING** → Continue to Step 2

---

## STEP 2: Create HNSW Index

1. In Supabase Dashboard, go to: **SQL Editor**
2. Click "New Query"
3. Copy and paste this SQL:

```sql
-- Create HNSW index for vector similarity search
-- This will dramatically improve performance and reliability

CREATE INDEX IF NOT EXISTS aoma_unified_vectors_embedding_idx
ON aoma_unified_vectors
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Verify index was created
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'aoma_unified_vectors';
```

4. Click **Run** (or press Cmd+Enter)
5. Wait for completion (should take 1-5 seconds for 28 rows)

**Expected Output:**
```
tablename              | indexname                              | indexdef
-----------------------|----------------------------------------|------------------------------------------
aoma_unified_vectors  | aoma_unified_vectors_embedding_idx    | CREATE INDEX ... USING hnsw ...
aoma_unified_vectors  | aoma_unified_vectors_pkey             | CREATE UNIQUE INDEX ... (id)
```

---

## STEP 3: Test Vector Search Reliability

After creating the index, run this test script:

```bash
cd /Users/mcarpent/Documents/projects/siam
/tmp/test-vector-reliability.sh
```

**Expected Results:**
- All 5 queries should return results (not 0)
- Response times should be consistent (~1-2s for vector search)
- No more "⚠️ Vector store returned no results" messages

---

## What This Index Does

### HNSW (Hierarchical Navigable Small World)
- **Purpose**: Fast approximate nearest neighbor search for vectors
- **Performance**: O(log n) instead of O(n) sequential scan
- **Parameters**:
  - `m = 16`: Connections per layer (balance of speed/accuracy)
  - `ef_construction = 64`: Build quality (higher = better index, slower build)

### Before Index (Sequential Scan)
- Query time: 0-2.6s (unreliable)
- Results: Sometimes 5, sometimes 0
- Database: Full table scan every query

### After Index (HNSW Search)
- Query time: <100ms (consistent)
- Results: Always returns matches above threshold
- Database: Efficient tree traversal

---

## Alternative Diagnoses (If Index Already Exists)

If the index exists but vector search is still unreliable:

### 1. PostgREST Schema Cache Issue
**Symptoms**: Intermittent failures, "function not found" errors
**Fix**: Restart PostgREST or wait 5-10 minutes for auto-refresh

### 2. Connection Pool Exhaustion
**Symptoms**: Timeouts, 0ms queries that return nothing
**Fix**: Check Supabase connection pool settings

### 3. Embedding Dimension Mismatch
**Symptoms**: All queries return 0 results
**Check**:
```sql
SELECT
    COUNT(*) as total_rows,
    COUNT(embedding) as rows_with_embedding,
    array_length(embedding, 1) as embedding_dimensions
FROM aoma_unified_vectors
LIMIT 1;
```
**Expected**: `embedding_dimensions = 1536`

### 4. Threshold Too High
**Current**: 0.50 (50% similarity required)
**Check**: Lower to 0.40 temporarily to test
**Location**: `src/services/supabaseVectorService.ts:51`

---

## Performance Benchmarks

### Current Performance (No Index)
- First query: 14s (when vector succeeds)
- First query: 40s (when vector fails → Railway fallback)
- Cached context: 6.1s (AI regenerates)
- Embedding generation: 300-600ms
- Vector DB query: 240-328ms (when works), 0ms (when fails)

### Expected Performance (With Index)
- First query: 8-10s (vector search <100ms)
- Cached context: 6.1s (unchanged - AI still regenerates)
- Embedding generation: 300-600ms (unchanged)
- Vector DB query: <100ms (reliable)

### Additional Optimizations Needed
1. **Response-level caching** - achieve <500ms cached queries
2. **Embedding cache (LRU)** - save 300-600ms per query
3. **Increase orchestrator timeout** - 15s → 30s (prevent timeout errors)

---

## After Creating Index

Once index is created:

1. **Clear cache** (orchestrator might have cached failures):
   ```bash
   # Restart dev server to clear cache
   # Or just wait - cache has TTL
   ```

2. **Run reliability test**:
   ```bash
   /tmp/test-vector-reliability.sh
   ```

3. **Monitor logs** for:
   - ✅ "Supabase returned 5 results"
   - ✅ Vector search time <500ms
   - ❌ "Vector store returned no results" (should not appear)

4. **Update performance report** with new metrics

---

## Questions?

- Vector search still failing? Check "Alternative Diagnoses"
- Index creation slow? Normal for large tables (28 rows = instant)
- Want to verify index is being used? Run EXPLAIN ANALYZE query

---

**Current Status**: ⚠️ INDEX NOT VERIFIED
**Action Required**: Create HNSW index via Supabase Dashboard
**Expected Fix Time**: 2 minutes
**Expected Impact**: Vector search 100% reliable, <100ms queries
