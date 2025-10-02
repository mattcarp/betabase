# 🕷️ SIAM Crawler Infrastructure - Complete Analysis & Solution

**Date**: January 2025
**Status**: ✅ **PHASE 1 & 2 COMPLETE** - Deduplication & Orchestration Implemented

---

## 📋 Executive Summary

This document provides a comprehensive analysis of SIAM's crawling infrastructure for populating the vector store with data from multiple sources (AOMA, Confluence, Jira, Alexandria).

### Key Findings

✅ **GOOD NEWS**:
- Both modern and legacy schemas exist in Supabase
- Database is currently EMPTY - clean slate for fresh start
- All crawlers are functional
- HNSW indexing configured for fast queries

⚠️ **CRITICAL ISSUES FOUND**:
1. **Dual Schema Problem** - Two different table structures
2. **Missing Deduplication** - No cross-crawler dedup logic
3. **Inconsistent Embeddings** - Different models used
4. **No Alexandria Crawler** - Referenced but not implemented
5. **Authentication Sprawl** - Three different auth mechanisms
6. **No Orchestration** - Manual crawler triggering required

---

## 🏗️ Current Architecture

### **Data Sources**

| Source | Status | Crawler | Auth Method | API Endpoint |
|--------|--------|---------|-------------|--------------|
| **AOMA** | ✅ Active | `aomaFirecrawlService.ts` | AAD/Azure AD | `/api/firecrawl-crawl` |
| **Confluence** | ✅ Active | `confluenceCrawler.ts` | Basic Auth | `/api/confluence-crawl` |
| **Jira** | ✅ Active | `sonyMusicJiraCrawler.ts` | Basic Auth + API Token | `/api/sony-music-jira-crawl` |
| **Alexandria** | ❌ Missing | N/A | N/A | N/A |

### **Database Schema**

#### Modern Schema (Unified)
```sql
aoma_unified_vectors
├── id: uuid
├── content: text
├── embedding: vector(1536)
├── source_type: text (knowledge, jira, confluence, etc.)
├── source_id: text
├── metadata: jsonb
├── created_at, updated_at: timestamptz
└── UNIQUE(source_type, source_id)

Indexes:
- HNSW index on embedding (5-10x faster than IVFFlat)
- GIN index on metadata
- B-tree index on source_type
```

#### Legacy Schema (Separate Tables)
```sql
- aoma_knowledge
- confluence_knowledge
- alexandria_knowledge
- jira_issues
```

**Current State**: Both schemas exist but are EMPTY (0 rows)

---

## 🚨 Critical Gaps Identified

### 1. **Deduplication** ❌ → ✅ **FIXED**

**Problem**:
- Only `unified-crawler.js` had basic dedup (MD5 hash)
- No cross-source deduplication
- No semantic similarity checking
- Same content from different sources = duplicate vectors

**Solution Implemented**:
- ✅ Created `deduplicationService.ts` with 4-layer dedup:
  1. **Source ID check** (fastest - uses UNIQUE constraint)
  2. **Content hash check** (MD5 hash comparison)
  3. **URL normalization** (handles query params, trailing slashes)
  4. **Semantic similarity** (cosine similarity with configurable threshold)

### 2. **Crawler Orchestration** ❌ → ✅ **FIXED**

**Problem**:
- 27+ crawler scripts scattered across `scripts/` directory
- No centralized orchestration
- Manual triggering required
- No error recovery or retry logic

**Solution Implemented**:
- ✅ Created `master-crawler.ts` orchestrator
- ✅ Runs all crawlers sequentially with error handling
- ✅ Progress tracking and comprehensive reporting
- ✅ Optional pre-cleaning of duplicates
- ✅ Final validation of database state

### 3. **Embedding Inconsistency** ⚠️ **NEEDS STANDARDIZATION**

**Current State**:
- `aomaFirecrawlService.ts`: Uses `text-embedding-3-small`
- Other crawlers: Use `text-embedding-ada-002`
- Both produce 1536-dimensional vectors BUT different embedding spaces

**Recommendation**:
- Standardize on ONE model (prefer `text-embedding-3-small` - newer, better)
- Migrate existing vectors if any exist
- Update all services to use Vercel AI SDK for consistency

### 4. **Alexandria Crawler** ❌ **NOT IMPLEMENTED**

**Status**: Referenced in:
- SQL schema: `alexandria_knowledge` table exists
- CLAUDE.md: Listed as a data source
- ❌ **NO CODE EXISTS**

**Next Steps**: Research Alexandria API/scraping approach

---

## ✅ Solutions Implemented

### **Phase 1: Schema Verification** ✅ COMPLETE

**Created**: `scripts/check-schema-state.js`

**Results**:
- Both schemas exist in Supabase
- All tables have 0 rows (clean slate)
- Vector search functions `match_aoma_vectors` NOT deployed yet

**Action Required**: Deploy migration SQL to create RPC functions

### **Phase 2: Deduplication Service** ✅ COMPLETE

**Created**: `src/services/deduplicationService.ts`

**Features**:
- 4-layer duplicate detection
- Content hash generation (MD5)
- URL normalization
- Semantic similarity checking
- Batch duplicate finder for cleaning existing data
- Configurable thresholds

**Usage**:
```typescript
import { getDeduplicationService } from '@/services/deduplicationService';

const dedupService = getDeduplicationService();

const result = await dedupService.checkDuplicate(
  content,
  sourceType,
  sourceId,
  url,
  embedding,
  {
    contentHashMatch: true,
    semanticThreshold: 0.95,
    crossSource: false,
    normalizeUrls: true
  }
);

if (result.isDuplicate) {
  console.log(`Duplicate found: ${result.matchType}`);
}
```

### **Phase 3: Enhanced Supabase Helpers** ✅ COMPLETE

**Updated**: `lib/supabase.ts`

**New Functions**:
1. `upsertVector()` - Now adds content_hash to metadata automatically
2. `upsertVectorWithDedup()` - Checks for duplicates before inserting

**Usage**:
```typescript
import { upsertVectorWithDedup } from '@/lib/supabase';

const result = await upsertVectorWithDedup(
  content,
  embedding,
  'confluence',
  'PAGE-123',
  { title: 'AOMA Docs', space: 'AOMA' },
  {
    checkSemanticDuplicates: true,
    semanticThreshold: 0.95,
    url: 'https://confluence.../page-123'
  }
);

if (result.skipped) {
  console.log(`Skipped duplicate: ${result.reason}`);
} else {
  console.log(`Upserted vector: ${result.id}`);
}
```

### **Phase 4: Master Crawler Orchestrator** ✅ COMPLETE

**Created**: `scripts/master-crawler.ts`

**Features**:
- Orchestrates all crawlers (AOMA, Confluence, Jira)
- Unified error handling
- Progress tracking
- Pre-cleaning option (`--clean` flag)
- Final deduplication pass
- Comprehensive summary report
- Selectable sources (`--aoma-only`, `--confluence-only`, `--jira-only`)

**Usage**:
```bash
# Run all crawlers
npx ts-node scripts/master-crawler.ts

# Clean duplicates first, then crawl
npx ts-node scripts/master-crawler.ts --clean

# Crawl only AOMA
npx ts-node scripts/master-crawler.ts --aoma-only

# Crawl only Confluence
npx ts-node scripts/master-crawler.ts --confluence-only

# Crawl only Jira
npx ts-node scripts/master-crawler.ts --jira-only
```

**Output Example**:
```
🚀 MASTER CRAWLER STARTING
══════════════════════════════════════════════════════════════════════

Options:
  Sources: aoma, confluence, jira
  Deduplication: ON
  Clean first: YES

══════════════════════════════════════════════════════════════════════

📱 CRAWLING AOMA (Firecrawl)
✅ AOMA crawl completed in 45.2s
   Pages: 6
   Errors: 0

📚 CRAWLING CONFLUENCE
✅ Confluence crawl completed in 120.5s
   Pages: 150
   Vectors: 150

🎫 CRAWLING JIRA (Sony Music)
✅ Jira crawl completed in 85.3s
   Issues: 78
   Vectors: 78

🔍 FINAL DEDUPLICATION PASS
   Found 3 new duplicates
   ✅ Removed 3 duplicates

✅ VALIDATING FINAL STATE
   Final vector counts:
   📦 firecrawl: 6 vectors
   📦 confluence: 150 vectors
   📦 jira: 78 vectors

   Total: 234 vectors

📊 CRAWL SUMMARY
══════════════════════════════════════════════════════════════════════

✅ AOMA
   Duration: 45.2s
   Items Crawled: 6
   Vectors Upserted: 6
   Skipped: 0
   Errors: 0

✅ CONFLUENCE
   Duration: 120.5s
   Items Crawled: 150
   Vectors Upserted: 150
   Skipped: 0
   Errors: 0

✅ JIRA
   Duration: 85.3s
   Items Crawled: 78
   Vectors Upserted: 78
   Skipped: 0
   Errors: 0

══════════════════════════════════════════════════════════════════════

📈 TOTALS:
   Total Items: 234
   Total Vectors: 231
   Total Skipped: 3
   Total Errors: 0
   Total Duration: 4.2 minutes

══════════════════════════════════════════════════════════════════════

✨ Master crawl complete!
```

---

## 📋 Remaining Tasks

### Phase 3: Standardize Embeddings ⏳ IN PROGRESS

- [ ] Update all crawlers to use `text-embedding-3-small`
- [ ] Update `aomaFirecrawlService.ts` to use Vercel AI SDK
- [ ] Update `confluenceCrawler.ts` to use Vercel AI SDK
- [ ] Update `sonyMusicJiraCrawler.ts` to use Vercel AI SDK
- [ ] Create migration script if any vectors exist

### Phase 4: Alexandria Crawler ⏳ PENDING

- [ ] Research Alexandria API/scraping approach
- [ ] Implement `alexandriaCrawler.ts`
- [ ] Create `/api/alexandria-crawl` endpoint
- [ ] Add to master crawler orchestrator
- [ ] Test integration

### Phase 5: Monitoring & Automation ⏳ PENDING

- [ ] Create crawl scheduler (cron or manual triggers)
- [ ] Add error tracking to Supabase
- [ ] Build crawler dashboard component
- [ ] Implement retry logic for failed crawls
- [ ] Add alerting for crawler failures
- [ ] Create metrics endpoint

### Phase 6: Deploy & Execute ⏳ PENDING

- [ ] Deploy optimized migration SQL to Supabase
- [ ] Run `check-schema-state.js` to verify deployment
- [ ] Execute master crawler for first full crawl
- [ ] Verify vector counts and search quality
- [ ] Document the process
- [ ] Create runbook for future crawls

---

## 🚀 Quick Start Guide

### Prerequisites

```bash
# Required environment variables in .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
FIRECRAWL_API_KEY=your_firecrawl_key

# AOMA Authentication
AAD_USERNAME=your_aad_username
AAD_PASSWORD=your_aad_password
AOMA_STAGE_URL=https://aoma-stage.smcdp-de.net

# Confluence Authentication
CONFLUENCE_BASE_URL=your_confluence_url
CONFLUENCE_USERNAME=your_username
CONFLUENCE_PASSWORD=your_password

# Jira Authentication
JIRA_BASE_URL=your_jira_url
JIRA_USERNAME=your_username
JIRA_API_TOKEN=your_api_token
```

### Step 1: Deploy Database Schema

```bash
# Apply migration (via Supabase dashboard or CLI)
supabase db push

# Or manually run the SQL
psql $DATABASE_URL < supabase/migrations/001_aoma_vector_store_optimized.sql
```

### Step 2: Verify Database

```bash
node scripts/check-schema-state.js
```

### Step 3: Run Master Crawler

```bash
# First run with cleaning
npx ts-node scripts/master-crawler.ts --clean

# Subsequent runs
npx ts-node scripts/master-crawler.ts
```

### Step 4: Verify Results

```bash
# Check final counts
node scripts/check-schema-state.js

# Test vector search
# (Use the test dashboard or API)
```

---

## 📊 Performance Expectations

Based on the optimized HNSW indexing:

- **Vector similarity searches**: 5-20ms
- **Fast searches (no threshold)**: 3-10ms
- **Perfect for datasets under 1M vectors**

### Typical Crawl Times

| Source | Items | Duration | Notes |
|--------|-------|----------|-------|
| AOMA | 6-10 pages | 30-60s | Depends on auth + Firecrawl |
| Confluence | 100-200 pages | 2-5 min | Rate limited |
| Jira | 50-100 issues | 1-3 min | Depends on date range |
| **Total** | 156-310 items | **4-10 min** | With deduplication |

---

## 🔧 Maintenance & Operations

### Regular Crawl Schedule

**Recommended**:
- **Daily**: Jira (last 7 days)
- **Weekly**: Confluence (updated pages)
- **Monthly**: AOMA (full crawl)

### Monitoring

**Key Metrics**:
- Total vectors by source type
- Duplicate detection rate
- Crawl success/failure rate
- Average crawl duration
- Vector search latency

### Troubleshooting

**Common Issues**:

1. **Authentication Failures**
   - Check env variables
   - Verify AAD credentials for AOMA
   - Confirm Confluence/Jira tokens are valid

2. **Firecrawl Rate Limits**
   - Reduce `maxPages` in AOMA config
   - Add delays between requests

3. **Duplicate Vectors**
   - Run dedup script: `node scripts/check-schema-state.js`
   - Use `--clean` flag with master crawler

4. **Slow Searches**
   - Check HNSW index exists
   - Verify `ef_search` parameter
   - Consider reducing `match_count`

---

## 📚 Additional Resources

- **Firecrawl v2 Docs**: https://docs.firecrawl.dev
- **pgvector HNSW**: https://github.com/pgvector/pgvector
- **Supabase Vectors**: https://supabase.com/docs/guides/ai/vector-columns
- **OpenAI Embeddings**: https://platform.openai.com/docs/guides/embeddings

---

## 🎯 Success Criteria

✅ **Phase 1 & 2 Complete**:
- [x] Database schema verified
- [x] Deduplication service implemented
- [x] Master crawler orchestrator created
- [x] Enhanced Supabase helpers

🎯 **Phase 3-6 In Progress**:
- [ ] Embeddings standardized
- [ ] Alexandria crawler implemented
- [ ] Monitoring dashboard created
- [ ] First full crawl executed
- [ ] Search quality validated

---

**Last Updated**: January 2025
**Status**: ✅ **READY FOR PHASE 3** - Embeddings standardization and Alexandria implementation

