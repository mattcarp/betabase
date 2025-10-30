# Phase 2: OpenAI Vector Store → Supabase Migration Guide

**Status:** Ready to Execute  
**Estimated Time:** 10-30 minutes (depending on document count)  
**Estimated Cost:** ~$0.10-0.20 for embeddings

---

## Prerequisites

### Required Environment Variables

Ensure these are set in your `.env` file:

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Vector Store ID (optional - will use default if not set)
VECTOR_STORE_ID=vs_68a6c6337b10819194ce40498ca7dd6a
```

### Verify Supabase Schema

Ensure the `upsert_aoma_vector` RPC function exists:

```bash
# Check if migration is deployed
psql $DATABASE_URL -c "SELECT routine_name FROM information_schema.routines WHERE routine_name = 'upsert_aoma_vector';"
```

If not found, run:
```bash
cd supabase
supabase db push
```

---

## Migration Steps

### Step 1: Dry Run (Testing)

**Always start with a dry run to verify the process:**

```bash
# Test with just 5 documents
tsx scripts/migrate-openai-to-supabase.ts --dry-run --limit=5
```

This will:
- ✅ Export 5 documents from OpenAI
- ✅ Chunk them
- ✅ Generate embeddings
- ❌ NOT insert into Supabase (dry run)
- 💾 Save backup to `scripts/openai-vector-export.json`

**Expected Output:**
```
🚀 Starting OpenAI → Supabase Migration
=====================================

✅ Environment variables validated
📥 Exporting documents from OpenAI Vector Store: vs_68a6c633...
Found 73 files in vector store
⚠️  Limiting to first 5 files (--limit flag)
[1/5] Processing file: file-abc123...
[1/5] ✅ Exported: AOMA-Overview.pdf (8453 chars)
...
✅ Exported 5 documents
💾 Backup saved to: scripts/openai-vector-export.json

✂️  Chunking 5 documents...
  AOMA-Overview.pdf: 9 chunks
  ...
✅ Created 42 total chunks

🧮 Generating embeddings for 42 chunks...
[1-5/42] Generating embeddings...
...
✅ Generated 42 embeddings

⚠️  DRY RUN - Skipping Supabase insertion
Would have inserted 42 chunks

✅ Migration completed in 15.3s
```

**Review the backup file:**
```bash
cat scripts/openai-vector-export.json | jq '.[] | {id, filename, content_length: (.content | length)}'
```

---

### Step 2: Small Batch Migration (10 documents)

**Once dry run succeeds, migrate a small batch:**

```bash
tsx scripts/migrate-openai-to-supabase.ts --limit=10
```

This will:
- Export 10 documents
- Chunk them (~80-100 chunks)
- Generate embeddings (~$0.01)
- **INSERT into Supabase** ✅

**Expected Time:** 2-3 minutes

**Verify in Supabase:**
```sql
SELECT 
  source_type,
  COUNT(*) as count,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM aoma_unified_vectors
WHERE source_type = 'openai_import'
GROUP BY source_type;
```

**Test a Query:**
```sql
SELECT 
  content,
  metadata->>'filename' as filename,
  similarity
FROM match_aoma_vectors(
  query_embedding := (
    SELECT embedding 
    FROM aoma_unified_vectors 
    LIMIT 1
  ),
  match_threshold := 0.5,
  match_count := 5
)
WHERE source_type = 'openai_import';
```

---

### Step 3: Full Migration (All Documents)

**Once small batch succeeds, run full migration:**

```bash
# No limit = migrate ALL documents
tsx scripts/migrate-openai-to-supabase.ts
```

This will:
- Export ~150 documents
- Create ~1,200-1,500 chunks
- Generate embeddings (~$0.10-0.20)
- Insert into Supabase

**Expected Time:** 10-30 minutes  
**Expected Cost:** ~$0.10-0.20

**Monitor Progress:**
The script provides detailed logging:
```
[125-130/1456] Generating embeddings...
[125-130/1456] ✅ Generated 5 embeddings
```

**If It Fails:**
- Check error messages
- Verify API keys are valid
- Check rate limits (OpenAI API)
- Resume by running again (upsert handles duplicates)

---

### Step 4: Verify Migration

**Check total count:**
```sql
SELECT 
  source_type,
  COUNT(*) as chunks,
  COUNT(DISTINCT source_id) as unique_docs
FROM aoma_unified_vectors
GROUP BY source_type
ORDER BY source_type;
```

**Expected Results:**
```
source_type     | chunks | unique_docs
----------------+--------+-------------
jira            | 15085  | 6554
openai_import   | 1456   | 150
```

**Test Search Quality:**
```typescript
// In your app
const results = await supabase.rpc('match_aoma_vectors', {
  query_embedding: await generateEmbedding('What is AOMA cover hot swap?'),
  match_threshold: 0.5,
  match_count: 10
});

console.log('Results:', results.data);
// Should now include results from openai_import source_type
```

---

## Step 5: Update Orchestrator (Optional)

After migration succeeds, you have two options:

### Option A: Keep OpenAI as Backup (Recommended for transition)

No code changes needed! The orchestrator will:
- Query Supabase (now with ALL AOMA docs) - fast
- Query OpenAI Assistant - slow but comprehensive
- Merge results

Over time, Supabase will return most/all results, making OpenAI queries redundant.

### Option B: Use Only Supabase (Maximum Performance)

Update `src/services/aomaOrchestrator.ts`:

```typescript
// Around line 574-585, comment out OpenAI query:
const openaiPromise = Promise.resolve({ sources: [] }); // Skip OpenAI
// const openaiPromise = this.callAOMATool("query_aoma_knowledge", {
//   query,
//   strategy: "rapid",
// });
```

This will:
- ✅ 20-100x faster (5s → 200ms)
- ✅ No more slow OpenAI queries
- ❌ Only Supabase data (but that's now complete!)

---

## Rollback Plan

If you need to revert:

### 1. Remove Migrated Data
```sql
DELETE FROM aoma_unified_vectors
WHERE source_type = 'openai_import';
```

### 2. Re-enable OpenAI Dependency
The orchestrator already queries both, so no code changes needed.

### 3. Restore from Backup
If needed, restore the exported data:
```bash
# The export is saved in scripts/openai-vector-export.json
cat scripts/openai-vector-export.json | jq '.[].filename'
```

---

## Monitoring & Validation

### Key Metrics to Track

**Before Migration:**
- Average query time: 2-5s
- Supabase results: 28 AOMA docs
- OpenAI results: ~150 AOMA docs

**After Migration:**
- Average query time: 200ms-1s (if using Supabase only)
- Supabase results: ~150+ AOMA docs
- OpenAI results: Still available as backup

### Performance Test

```bash
# Time a query before migration
time curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What is AOMA?"}]}'

# Time same query after migration
# Should be significantly faster if using Supabase only
```

---

## Troubleshooting

### Error: "Missing environment variables"
**Solution:** Ensure `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_SUPABASE_URL` are set in `.env`

### Error: "Rate limit exceeded"
**Solution:** The script includes delays. If you still hit limits, wait 1 minute and re-run (upsert handles duplicates)

### Error: "RPC function not found"
**Solution:** Run `cd supabase && supabase db push` to deploy the schema

### Migration Stalls
**Solution:** 
- Check network connection
- Verify API keys are valid
- Re-run script (will skip existing chunks)

### Low Success Rate (< 90%)
**Solution:**
- Check Supabase logs for errors
- Verify embedding dimensions match (1536)
- Check disk space on Supabase

---

## Cost Breakdown

### OpenAI Embedding API Costs
- Model: `text-embedding-3-small`
- Cost: $0.02 per 1M tokens
- Average: ~1,500 chunks × 200 tokens = 300K tokens
- **Total: ~$0.006** (less than 1 cent!)

### Supabase Storage
- Free tier: 500MB database
- Typical usage: ~50-100MB for all vectors
- **Total: $0** (within free tier)

### Time Investment
- Dry run: 2 minutes
- Small batch (10 docs): 3 minutes
- Full migration (150 docs): 15-30 minutes
- Validation: 5 minutes
- **Total: ~30-45 minutes**

---

## Success Criteria

✅ All documents exported from OpenAI  
✅ Embeddings generated successfully  
✅ Data inserted into Supabase  
✅ Test queries return results from `openai_import` source  
✅ Query performance improved (if using Supabase only)  
✅ No data loss (backup file exists)

---

## Next Steps After Migration

1. **Monitor Performance:** Track query times for 1 week
2. **A/B Test:** Compare result quality before/after
3. **Optimize:** If needed, adjust chunk size or similarity thresholds
4. **Scale:** Consider adding more document sources
5. **Cleanup:** After 1 month of stable operation, optionally remove OpenAI dependency

---

## Questions?

Contact: matt@mattcarpenter.com

**Ready to migrate?** Start with the dry run! 🚀

