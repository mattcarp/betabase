# 🔧 Embedding Migration Guide

**Purpose**: Convert TEXT embeddings to proper `vector(1536)` format for Supabase vector search

**Status**: Ready to run
**Estimated Time**: ~1 hour
**Resumable**: Yes (uses checkpoints)

---

## 🎯 What This Fixes

### Current Problem

- **wiki_documents**: 393 docs with TEXT embeddings (~19k dimensions)
- **jira_ticket_embeddings**: 6,040 tickets with TEXT embeddings
- **Supabase vector search**: Returns 0 results (wrong format)

### After Migration

- ✅ **aoma_unified_vectors**: 6,433 docs with proper `vector(1536)` format
- ✅ **Vector search**: Returns relevant results in ~500ms
- ✅ **Hybrid system**: Railway MCP + Supabase both working

---

## 🚀 Quick Start

### Option A: Automated (Recommended)

```bash
# Run the complete deployment and migration
./scripts/deploy-and-migrate-embeddings.sh
```

This will:

1. Deploy the aoma_unified_vectors migration
2. Migrate all embeddings
3. Verify the integration
4. Run tests

### Option B: Manual Steps

```bash
# 1. Deploy migration
supabase db push

# 2. Run embedding migration
node scripts/fix-supabase-embeddings.js

# 3. Verify
node scripts/test-hybrid-integration.js
```

---

## 📋 Prerequisites

### 1. Environment Variables (.env.local)

```bash
OPENAI_API_KEY=sk-...                           # Required for embeddings
NEXT_PUBLIC_SUPABASE_URL=https://...            # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=eyJ...                # Service role key (not anon!)
```

### 2. Supabase CLI (Optional but recommended)

```bash
npm install -g supabase
```

If you don't have it, you can deploy the migration manually via the Supabase dashboard.

### 3. OpenAI API Credits

Estimated cost:

- 393 wiki docs × $0.0001/embedding = $0.04
- 6,040 JIRA tickets × $0.0001/embedding = $0.60
- **Total: ~$0.65**

---

## 🔄 Migration Process

### Phase 1: Deploy Migration (5 mins)

```bash
supabase db push
```

Creates:

- `aoma_unified_vectors` table with `vector(1536)` column
- HNSW index for fast similarity search
- RPC functions: `match_aoma_vectors`, `upsert_aoma_vector`
- Migration tracking table

### Phase 2: Migrate Wiki Documents (~4 mins)

```bash
node scripts/fix-supabase-embeddings.js
```

For each of 393 wiki documents:

1. Read content from `wiki_documents`
2. Generate OpenAI embedding (1536 dimensions)
3. Insert into `aoma_unified_vectors` via `upsert_aoma_vector()`
4. Track progress in checkpoint file

Progress output:

```
📚 MIGRATING WIKI DOCUMENTS
📊 Found 393 wiki documents
🎯 Processing 393 remaining documents

📦 Batch 1/40
   ⏳ [1/393] AOMA Upload Documentation...
   ✅ Migrated successfully
   ⏳ [2/393] Simple Upload Guide...
   ✅ Migrated successfully
   ...

✅ Wiki migration complete:
   Succeeded: 393
   Failed: 0
```

### Phase 3: Migrate JIRA Tickets (~60 mins)

Same process for 6,040 JIRA tickets:

1. Read from `jira_ticket_embeddings`
2. Generate embeddings
3. Insert into `aoma_unified_vectors`
4. Track progress

### Phase 4: Verification

```bash
node scripts/test-hybrid-integration.js
```

Tests:

- Railway MCP endpoint (should work)
- Supabase vector search (should now return results!)
- Integration check (both sources active)

---

## 💾 Resumability

### Checkpoint File

The script saves progress to `.embedding-migration-checkpoint.json`:

```json
{
  "wiki_docs_completed": ["doc1", "doc2", ...],
  "jira_tickets_completed": ["AOMA-123", ...],
  "last_wiki_index": 150,
  "last_jira_index": 2500,
  "started_at": "2025-10-10T17:00:00Z",
  "errors": []
}
```

### Resume After Interruption

If the script is interrupted (network, rate limits, etc.):

```bash
# Just run it again - it will resume from checkpoint
node scripts/fix-supabase-embeddings.js
```

Output:

```
📂 Loaded checkpoint from previous run
   Wiki docs: 150 completed
   JIRA tickets: 2500 completed

📚 MIGRATING WIKI DOCUMENTS
⏭️  Skipping 150 already completed
🎯 Processing 243 remaining documents
```

---

## ⚠️ Troubleshooting

### OpenAI Rate Limits

**Symptom**: `429 Rate limit exceeded`

**Solution**:

- Script automatically retries with 1s delay between batches
- If it fails, just run again - checkpoint will resume

**Manual delay**:
Edit `RATE_LIMIT_DELAY` in `fix-supabase-embeddings.js`:

```javascript
const RATE_LIMIT_DELAY = 2000; // Increase to 2s
```

### Supabase Connection Errors

**Symptom**: `Failed to insert into aoma_unified_vectors`

**Check**:

1. Migration deployed? `supabase db push`
2. Service role key correct in .env.local?
3. Table exists? Check Supabase dashboard

### Embedding Generation Fails

**Symptom**: `Embedding generation failed`

**Common causes**:

- Empty content (script skips automatically)
- Content too long (script truncates to 8000 chars)
- OpenAI API key invalid

---

## 🧪 Testing After Migration

### 1. Test Vector Search

```bash
node scripts/test-vector-search.js
```

Should now return results:

```
✅ Wiki search: 492ms, 5 results
📄 Top result:
   Title: AOMA Upload Documentation
   Similarity: 87.3%
   Content: AOMA provides multiple file upload methods...
```

### 2. Test Hybrid Integration

```bash
node scripts/test-hybrid-integration.js
```

Should show:

```
✅ Railway MCP: 10756ms
✅ Supabase: 492ms, 5 results  ← NOW RETURNS RESULTS!
✅ searchKnowledge is CALLED in /api/chat
🎉 HYBRID INTEGRATION IS ACTIVE!
```

### 3. Test Live Chat

```bash
npm run dev
# Open http://localhost:3000
# Ask: "How do I upload files in AOMA?"
```

Check console for:

```
⏳ Starting parallel queries: AOMA orchestrator + Supabase vectors...
✅ AOMA orchestration successful
✅ Supabase returned 5 results in 492ms
```

---

## 📊 Expected Results

### Database State After Migration

**aoma_unified_vectors table**:

```
| id   | content | embedding | source_type | source_id |
|------|---------|-----------|-------------|-----------|
| uuid | ...     | [1536]    | knowledge   | wiki_1    |
| uuid | ...     | [1536]    | knowledge   | wiki_2    |
| uuid | ...     | [1536]    | jira        | AOMA-123  |
| ...  | ...     | ...       | ...         | ...       |

Total rows: 6,433
```

**By source type**:

- `knowledge`: 393 (wiki documents)
- `jira`: 6,040 (JIRA tickets)

### Vector Search Performance

- **Query time**: 5-20ms (HNSW index)
- **Results**: Top-K most similar documents
- **Similarity scores**: 0.0-1.0 (higher = more relevant)

### Hybrid Integration

```
User query → /api/chat
  ├─ Railway MCP: 10s (comprehensive AOMA docs)
  └─ Supabase: 500ms (wiki + JIRA)
  ↓
Merged context with both sources
```

---

## 🎯 Success Criteria

- [x] Migration script created
- [x] Deployment script created
- [ ] aoma_unified_vectors table deployed
- [ ] 393 wiki docs migrated
- [ ] 6,040 JIRA tickets migrated
- [ ] Vector search returns results
- [ ] Hybrid integration working
- [ ] No console errors

---

## 📞 Support

If you encounter issues:

1. **Check logs**: The script is verbose, read error messages
2. **Resume from checkpoint**: Just run the script again
3. **Verify environment**: All API keys set in .env.local?
4. **Test incrementally**: Run verification scripts after each phase

---

## 🚀 After Migration

### Deploy to Production

```bash
git add -A
git commit -m "feat: migrate embeddings to proper vector(1536) format"
git push origin main
```

### Monitor Deployment

- Render will auto-deploy
- Check logs for errors
- Test live at https://thebetabase.com

### Demo Script

```
👤 "How do I upload files in AOMA?"

🤖 SIAM:
   [Searches 6,433 documents...]
   ⏱️  10.7 seconds

   📚 Sources:
      - AOMA Knowledge Base (Railway MCP)
      - 4 Confluence Wiki articles (Supabase)
      - 2 JIRA tickets (Supabase)

   ⚡ Total: 6,433 documents searched
```

**IMPRESSIVE!** 🎉

---

**Last Updated**: October 10, 2025
**Status**: Ready to run
**Estimated Time**: ~1 hour
