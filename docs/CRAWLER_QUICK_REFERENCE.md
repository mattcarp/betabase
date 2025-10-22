# 🚀 Crawler Quick Reference Guide

**Quick commands and workflows for SIAM crawler infrastructure**

---

## 📋 Essential Commands

### Check Database State

```bash
# Check what tables exist and row counts
node scripts/check-schema-state.js
```

### Clean Duplicates

```bash
# Preview what would be removed (dry run)
npx ts-node scripts/clean-duplicates.ts --dry-run

# Actually remove duplicates
npx ts-node scripts/clean-duplicates.ts

# Clean only specific source
npx ts-node scripts/clean-duplicates.ts --source=confluence

# Stricter similarity (99% match required)
npx ts-node scripts/clean-duplicates.ts --threshold=0.99
```

### Run Master Crawler

```bash
# Full crawl (all sources)
npx ts-node scripts/master-crawler.ts

# Full crawl with pre-cleaning
npx ts-node scripts/master-crawler.ts --clean

# Crawl specific sources
npx ts-node scripts/master-crawler.ts --aoma-only
npx ts-node scripts/master-crawler.ts --confluence-only
npx ts-node scripts/master-crawler.ts --jira-only
```

---

## 🔧 Individual Crawlers

### AOMA (Firecrawl)

```bash
# API endpoint
curl -X POST http://localhost:3000/api/firecrawl-crawl \
  -H "Content-Type: application/json" \
  -d '{"url": "https://aoma-stage.smcdp-de.net/aoma-ui/my-aoma-files"}'
```

### Confluence

```bash
# API endpoint
curl -X POST http://localhost:3000/api/confluence-crawl \
  -H "Content-Type: application/json" \
  -d '{"spaces": ["AOMA", "USM"], "maxPagesPerSpace": 50}'

# Check last crawl status
curl http://localhost:3000/api/confluence-crawl
```

### Jira

```bash
# API endpoint
curl -X POST http://localhost:3000/api/sony-music-jira-crawl \
  -H "Content-Type: application/json" \
  -d '{"projects": ["AOMA", "USM"], "maxResults": 100}'

# Check last crawl status
curl http://localhost:3000/api/sony-music-jira-crawl
```

---

## 📊 Monitoring & Validation

### Check Vector Counts

```typescript
import { validateSonyMusicContent } from "@/lib/supabase";

const counts = await validateSonyMusicContent();
console.log(counts);
// { jira: 78, confluence: 150, firecrawl: 6 }
```

### Search Vectors

```typescript
import { searchVectors } from "@/lib/supabase";
import { openai } from "@ai-sdk/openai";
import { embed } from "ai";

// Generate embedding for query
const { embedding } = await embed({
  model: openai.embedding("text-embedding-3-small"),
  value: "How do I upload files to AOMA?",
});

// Search
const results = await searchVectors(
  embedding,
  0.78, // threshold
  10, // max results
  ["firecrawl", "confluence"] // optional: filter by source
);
```

---

## 🛠️ Programmatic Usage

### Deduplication Service

```typescript
import { getDeduplicationService } from "@/services/deduplicationService";

const dedupService = getDeduplicationService();

// Check if content is duplicate
const result = await dedupService.checkDuplicate(
  content,
  "confluence",
  "PAGE-123",
  "https://confluence.../page-123",
  embedding,
  {
    contentHashMatch: true,
    semanticThreshold: 0.95,
    crossSource: false,
    normalizeUrls: true,
  }
);

if (result.isDuplicate) {
  console.log(`Duplicate detected: ${result.matchType}`);
  console.log(`Existing ID: ${result.existingId}`);
}

// Find duplicates in database
const { duplicates, totalDuplicates } = await dedupService.findDuplicatesInDatabase({
  sourceType: "confluence",
  keepNewest: true,
});

// Remove duplicates
const removeIds = duplicates.flatMap((d) => d.removeIds);
const { removed, errors } = await dedupService.removeDuplicates(removeIds);
```

### Upsert with Deduplication

```typescript
import { upsertVectorWithDedup } from "@/lib/supabase";

const result = await upsertVectorWithDedup(
  content,
  embedding,
  "confluence",
  "PAGE-123",
  { title: "AOMA Docs", space: "AOMA" },
  {
    checkSemanticDuplicates: true,
    semanticThreshold: 0.95,
    url: "https://confluence.../page-123",
  }
);

if (result.skipped) {
  console.log(`Skipped: ${result.reason}`);
} else {
  console.log(`Upserted: ${result.id}`);
}
```

### Master Crawler Class

```typescript
import MasterCrawler from "@/scripts/master-crawler";

const crawler = new MasterCrawler();

const summary = await crawler.runAll({
  sources: ["aoma", "confluence", "jira"],
  deduplicate: true,
  cleanFirst: false,
});

console.log(`Total vectors: ${summary.totalVectors}`);
console.log(`Duplicates removed: ${summary.totalSkipped}`);
```

---

## 🔍 Troubleshooting

### Authentication Issues

**AOMA (AAD)**:

```bash
# Check if auth session exists
ls -la tmp/aoma-stage-storage.json

# Re-authenticate
node scripts/aoma-stage-login.js
```

**Confluence**:

```bash
# Test connection
curl -u $CONFLUENCE_USERNAME:$CONFLUENCE_PASSWORD \
  $CONFLUENCE_BASE_URL/wiki/rest/api/content?limit=1
```

**Jira**:

```bash
# Test connection
curl -u $JIRA_USERNAME:$JIRA_API_TOKEN \
  $JIRA_BASE_URL/rest/api/3/myself
```

### Slow Crawls

1. **Reduce page limits**:
   - AOMA: Set `maxPages: 5` instead of 10
   - Confluence: Set `maxPagesPerSpace: 25` instead of 50
   - Jira: Set `maxResults: 50` instead of 100

2. **Check rate limits**:
   - Firecrawl: Has built-in rate limiting
   - Confluence/Jira: Add delays between requests

3. **Run individual crawlers**:
   ```bash
   npx ts-node scripts/master-crawler.ts --aoma-only
   npx ts-node scripts/master-crawler.ts --confluence-only
   npx ts-node scripts/master-crawler.ts --jira-only
   ```

### Database Issues

**RPC functions not found**:

```bash
# Deploy migration
supabase db push

# Or manually
psql $DATABASE_URL < supabase/migrations/001_aoma_vector_store_optimized.sql
```

**HNSW index missing**:

```sql
-- Create HNSW index
CREATE INDEX IF NOT EXISTS aoma_unified_vectors_embedding_hnsw_idx
  ON aoma_unified_vectors
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

**Too many duplicates**:

```bash
# Run dedup with stricter threshold
npx ts-node scripts/clean-duplicates.ts --threshold=0.99
```

---

## 📁 File Structure

```
/scripts/
├── check-schema-state.js        # Check database state
├── clean-duplicates.ts           # Remove duplicate vectors
└── master-crawler.ts             # Master orchestrator

/src/services/
├── aomaFirecrawlService.ts       # AOMA crawler
├── confluenceCrawler.ts          # Confluence crawler
├── sonyMusicJiraCrawler.ts       # Jira crawler
└── deduplicationService.ts       # Deduplication logic

/lib/
└── supabase.ts                   # Supabase helpers

/app/api/
├── firecrawl-crawl/route.ts      # AOMA API endpoint
├── confluence-crawl/route.ts     # Confluence API endpoint
└── sony-music-jira-crawl/route.ts # Jira API endpoint
```

---

## ⚙️ Environment Variables

Required in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# OpenAI
OPENAI_API_KEY=sk-xxx...

# Firecrawl
FIRECRAWL_API_KEY=fc-xxx...

# AOMA Authentication
AAD_USERNAME=your-email@sonymusic.com
AAD_PASSWORD=your-password
AOMA_STAGE_URL=https://aoma-stage.smcdp-de.net

# Confluence
CONFLUENCE_BASE_URL=https://sonymusic.atlassian.net
CONFLUENCE_USERNAME=your-email@sonymusic.com
CONFLUENCE_PASSWORD=your-api-token

# Jira
JIRA_BASE_URL=https://jira.smedigitalapps.com/jira
JIRA_USERNAME=your-email@sonymusic.com
JIRA_API_TOKEN=your-api-token
```

---

## 🎯 Common Workflows

### Daily Workflow

```bash
# 1. Check current state
node scripts/check-schema-state.js

# 2. Crawl latest Jira issues (last 7 days)
curl -X POST http://localhost:3000/api/sony-music-jira-crawl \
  -d '{"projects": ["AOMA"], "sinceDays": 7}'

# 3. Check for duplicates
npx ts-node scripts/clean-duplicates.ts --dry-run
```

### Weekly Workflow

```bash
# 1. Clean existing duplicates
npx ts-node scripts/clean-duplicates.ts

# 2. Full crawl
npx ts-node scripts/master-crawler.ts

# 3. Verify results
node scripts/check-schema-state.js
```

### Monthly Workflow

```bash
# 1. Full crawl with cleaning
npx ts-node scripts/master-crawler.ts --clean

# 2. Strict deduplication
npx ts-node scripts/clean-duplicates.ts --threshold=0.99

# 3. Validate search quality
# (Manual testing via test dashboard)
```

---

**Last Updated**: January 2025
