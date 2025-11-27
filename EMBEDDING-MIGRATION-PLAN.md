# SIAM Embedding Migration: OpenAI → Gemini

**Date**: November 24, 2024  
**Current State**: OpenAI `text-embedding-3-small` (1536d)  
**Target State**: Gemini `text-embedding-004` (768d)  

## Complete Migration Scope

### **23 Vector Columns Total**

| Table | Column | Rows with Data | Action |
|-------|--------|----------------|--------|
| jira_ticket_embeddings | embedding | 16,563 | Re-embed |
| siam_vectors | embedding | 15,245 | Re-embed |
| git_file_embeddings | embedding | 4,091 | Re-embed |
| jira_tickets | embedding | 1,406 | Re-embed |
| crawled_pages | content_embedding | 916 | Re-embed |
| code_files | embedding | 503 | Re-embed |
| wiki_documents | embedding | 394 | Re-embed |
| app_pages | embedding | 128 | Re-embed |
| git_commits | embedding | 99 | Re-embed |
| test_results | embedding | 10 | Re-embed |
| siam_git_files | embedding | 3 | Re-embed |
| siam_jira_tickets | embedding | 2 | Re-embed |
| crawler_documents | embedding | 1 | Re-embed |
| beta_base_scenarios | embedding | 0 | ALTER only |
| siam_meeting_transcriptions | embedding | 0 | ALTER only |
| siam_web_crawl_results | embedding | 0 | ALTER only |
| aoma_ui_elements | embedding | 0 | ALTER only |
| test_knowledge_base | embedding | 0 | ALTER only |
| aqm_audio_knowledge | content_embedding | 0 | ALTER only |
| firecrawl_analysis | content_embedding | 0 | ALTER only |
| pages | embedding | 0 | ALTER only |
| pages | content_embedding | 0 | ALTER only |
| curation_items | original_embedding | 0 | ALTER only |

### Summary

- **13 columns** with data → Add parallel `embedding_gemini`, re-embed, then swap
- **10 columns** empty → Direct ALTER to vector(768)
- **39,361 embeddings** to re-embed with Gemini

### Storage Impact

- Current: ~240 MB (39,361 × 1536 × 4 bytes)
- After: ~120 MB (39,361 × 768 × 4 bytes)
- **Savings: ~120 MB (50% reduction)**

## Migration Phases

### Phase 1: Schema Changes (Zero Downtime)

```bash
# Run via Supabase Dashboard SQL Editor
# Copy contents of: migrations/phase1-add-gemini-columns.sql
```

This phase:
- Adds `embedding_gemini vector(768)` to 13 tables with data
- Directly ALTERs 10 empty columns from 1536d to 768d
- Creates HNSW indexes on all new columns
- Sets up progress tracking table

### Phase 2: Re-embed with Gemini

```bash
cd /Users/matt/Documents/Projects/siam

# Run all tables (processes largest first):
npx tsx migrations/phase2-reembed-gemini.ts

# Run specific table:
npx tsx migrations/phase2-reembed-gemini.ts --table=jira_ticket_embeddings

# With larger batches:
npx tsx migrations/phase2-reembed-gemini.ts --batch-size=100

# Monitor progress:
# SELECT * FROM embedding_migration_progress ORDER BY total_rows DESC;
```

**Estimated Time**: 
- ~60-90 minutes at default settings (50 batch, 50ms delay)
- Resumable if interrupted

**Estimated Cost**: ~$4-10 (Gemini pricing)

### Phase 3: Cutover

```bash
# Run via Supabase Dashboard SQL Editor
# Copy contents of: migrations/phase3-cutover-gemini.sql
```

Updates all match functions to use `embedding_gemini` columns.

## Pre-Migration Checklist

- [x] Backup confirmed (daily backup from earlier today)
- [x] GOOGLE_API_KEY configured
- [x] Complete inventory (23 columns, 39,361 embeddings)
- [ ] Phase 1 executed
- [ ] Phase 2 complete
- [ ] Phase 3 executed
- [ ] Application tested

## Post-Migration Verification

```sql
-- Check progress
SELECT 
  table_name,
  column_name,
  total_rows,
  migrated_rows,
  failed_rows,
  status
FROM embedding_migration_progress 
ORDER BY total_rows DESC;

-- Verify Gemini embeddings exist
SELECT 
  COUNT(*) as total,
  COUNT(embedding) as with_openai,
  COUNT(embedding_gemini) as with_gemini
FROM siam_vectors;
```

## Known Issues

1. **git_file_embeddings.content is NULL** - Uses file_path as fallback
2. **beta_base_scenarios.search_vector** - tsvector (full-text), NOT affected

## Files Created

- `migrations/phase1-add-gemini-columns.sql` - Schema (23 columns)
- `migrations/phase2-reembed-gemini.ts` - Re-embedding (resumable)
- `migrations/phase3-cutover-gemini.sql` - Function updates
- `scripts/complete-vector-inventory.ts` - Full audit script
- `EMBEDDING-MIGRATION-PLAN.md` - This document
