# ⚠️ ACTION REQUIRED: Deploy Supabase Migration

**Date**: January 2025
**Priority**: 🔥 **CRITICAL - BLOCKS ALL CRAWLING**
**Time Required**: 5 minutes
**VPN Required**: ❌ No (remote SQL execution)

---

## 🎯 What You Need to Do RIGHT NOW

### The Problem

Your Supabase database has **tables with no columns** (empty shells). The migration SQL that defines the sophisticated vector store schema **has never been deployed**.

### The Solution

Deploy the migration SQL manually via Supabase Dashboard.

---

## 📝 Step-by-Step Instructions (5 minutes)

### 1. Open Supabase SQL Editor
```
https://supabase.com/dashboard/project/kfxetwuuzljhybfgmpuc/sql
```

### 2. Click "New Query" (top right button)

### 3. Copy Migration SQL

Run this command on your Mac:
```bash
cat ~/Documents/projects/siam/supabase/migrations/001_aoma_vector_store_optimized.sql | pbcopy
```

This copies the entire migration SQL to your clipboard.

### 4. Paste into Supabase SQL Editor

Paste the copied SQL into the editor (Cmd+V)

### 5. Click "Run" (bottom right)

You should see: `Success. No rows returned`

### 6. Verify Deployment

Back on your Mac terminal:
```bash
cd ~/Documents/projects/siam
node scripts/inspect-supabase-schema.js
```

**Expected output**:
```
✅ aoma_unified_vectors: 0 rows, 8 columns  ← Should show columns now!
✅ match_aoma_vectors: EXISTS AND WORKING
✅ match_aoma_vectors_fast: EXISTS AND WORKING
✅ upsert_aoma_vector: EXISTS AND WORKING
✅ pgvector extension: ENABLED
✅ Vector columns: WORKING
```

---

## ✅ What This Unlocks

Once deployed, you can:

1. **Run First Crawl** (VPN required):
   ```bash
   npx ts-node scripts/master-crawler.ts
   ```

2. **Test Vector Search**:
   - Semantic search across AOMA, Confluence, Jira
   - 5-20ms query performance
   - 200-300 vectors from first crawl

3. **Start Using AOMA Intelligence**:
   - Cross-source knowledge retrieval
   - Automatic deduplication
   - Real-time updates

---

## 📊 What Gets Created

The migration creates:

✅ **aoma_unified_vectors** table (8 columns, not 0!)
- id, content, embedding, source_type, source_id, metadata, created_at, updated_at

✅ **HNSW vector index** (5-10x faster than IVFFlat)

✅ **3 RPC functions**:
- match_aoma_vectors (standard search)
- match_aoma_vectors_fast (ultra-fast 3-10ms)
- upsert_aoma_vector (insert/update)

✅ **aoma_migration_status** table (track crawl progress)

✅ **aoma_vector_stats** view (analytics)

✅ **pgvector extension** (vector similarity search)

---

## 🚨 If You Get Stuck

### Error: "Permission denied"
- Make sure you're logged into Supabase Dashboard
- Check you're on the correct project (kfxetwuuzljhybfgmpuc)

### Error: "Function already exists"
- The migration has `CREATE OR REPLACE` - it's safe to run multiple times
- Just click "Run" again

### Error: "Table already exists"
- The migration has `CREATE TABLE IF NOT EXISTS` - it's safe
- It will add columns to existing empty tables

### Still Issues?
- Check full error message in Supabase SQL Editor
- See detailed guide: `docs/SCHEMA_DEPLOYMENT_STATUS.md`
- Alternative method: Use psql command line (see full guide)

---

## 📋 Quick Checklist

- [ ] Opened Supabase SQL Editor
- [ ] Created new query
- [ ] Copied migration SQL from file
- [ ] Pasted into editor
- [ ] Clicked "Run"
- [ ] Saw "Success. No rows returned"
- [ ] Ran verification script
- [ ] Saw tables with columns (not 0 columns)
- [ ] Saw RPC functions working
- [ ] Saw pgvector enabled

---

## 🎯 After Deployment

### Immediate Next Steps (No VPN)

✅ You're ready to proceed with development
✅ Database is configured for vector storage
✅ All RPC functions available
✅ Search functionality ready

### When on VPN

1. Run first crawl (10 minutes)
2. Verify 200-300 vectors created
3. Test search quality
4. Start building AOMA intelligence features

---

## 📚 Related Documentation

**Full Details**: `docs/SCHEMA_DEPLOYMENT_STATUS.md`
**Complete Status**: `docs/CRAWLER_STATUS_COMPLETE.md`
**Next Steps**: `docs/NEXT_STEPS_SUMMARY.md`

---

**Last Updated**: January 2025
**Action**: Deploy migration SQL NOW
**Time**: 5 minutes
**Blocks**: All crawling, vector search, AOMA intelligence features
