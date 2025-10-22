# ✅ Actual Supabase Schema - Crawler Mapping

**Date**: January 2025
**Status**: ✅ **VERIFIED** via `information_schema.columns`
**Database**: kfxetwuuzljhybfgmpuc.supabase.co

---

## 🎯 Crawler-to-Table Mapping

| Crawler               | Target Table                              | Columns | Purpose                        |
| --------------------- | ----------------------------------------- | ------- | ------------------------------ |
| **AOMA Firecrawl**    | `firecrawl_analysis`                      | 13      | UI analysis, testable features |
| **Confluence**        | `wiki_documents`                          | 9       | Wiki/documentation content     |
| **Jira (Playwright)** | `jira_tickets` + `jira_ticket_embeddings` | 10 + 7  | Issues and semantic search     |
| **Jira (REST API)**   | `jira_tickets` + `jira_ticket_embeddings` | 10 + 7  | Issues and semantic search     |
| **Generic Crawls**    | `crawler_documents`                       | 13      | General purpose documents      |

---

## 📊 Table Schemas (As They Exist)

### 1. `firecrawl_analysis` (13 columns)

```sql
id                   uuid                     NOT NULL
url                  text                     NOT NULL
app_name             text                     NULL
analysis_type        text                     NULL
testable_features    jsonb                    NULL
user_flows           jsonb                    NULL
api_endpoints        text[]                   NULL
selectors            jsonb                    NULL
accessibility_issues jsonb                    NULL
performance_metrics  jsonb                    NULL
content_embedding    vector (USER-DEFINED)    NULL  ← Note: content_embedding not embedding
analyzed_at          timestamptz              NULL
expires_at           timestamptz              NULL
```

**Used By**: `src/services/aomaFirecrawlService.ts`
**Function**: `storeFirecrawlData(url, crawlData, embedding)`

---

### 2. `wiki_documents` (9 columns)

```sql
id                uuid          NOT NULL
app_name          text          NOT NULL
url               text          NOT NULL
title             text          NULL
markdown_content  text          NULL
metadata          jsonb         NULL
content_hash      text          NULL
crawled_at        timestamptz   NULL
embedding         vector        NULL  ← Note: embedding not content_embedding
```

**Used By**: `src/services/confluenceCrawler.ts`
**Function**: `upsertWikiDocument(url, appName, title, markdownContent, embedding, metadata)`

---

### 3. `jira_tickets` (10 columns)

```sql
id            uuid          NOT NULL
external_id   text          NOT NULL  ← Jira issue key (e.g., "AOMA-123")
title         text          NOT NULL
description   text          NULL
priority      text          NULL
status        text          NULL
metadata      jsonb         NULL
created_at    timestamptz   NULL
updated_at    timestamptz   NULL
embedding     vector        NULL
```

**Used By**: `src/services/sonyMusicJiraCrawler.ts`
**Function**: `upsertJiraTicket(externalId, title, description, embedding, metadata)`

---

### 4. `jira_ticket_embeddings` (7 columns)

```sql
id            bigint        NOT NULL  ← Note: bigint not uuid
ticket_key    text          NOT NULL  ← Jira issue key
summary       text          NULL
embedding     vector        NOT NULL  ← Note: NOT NULL
metadata      jsonb         NULL
created_at    timestamptz   NULL
updated_at    timestamptz   NULL
```

**Used By**: `src/services/sonyMusicJiraCrawler.ts`
**Function**: `upsertJiraTicketEmbedding(ticketKey, summary, embedding, metadata)`

**Purpose**: Optimized for semantic search queries (smaller, faster lookups)

---

### 5. `crawler_documents` (13 columns)

```sql
id                uuid          NOT NULL
app_id            text          NULL
url               text          NOT NULL
title             text          NOT NULL
content           text          NULL
metadata          jsonb         NULL
content_hash      text          NOT NULL
embedding         vector        NULL
created_at        timestamptz   NOT NULL
updated_at        timestamptz   NOT NULL
app_name          text          NULL
markdown_content  text          NULL
crawled_at        timestamptz   NULL
```

**Used By**: Generic crawlers (future use)
**Function**: `upsertCrawlerDocument(url, title, content, embedding, appName, metadata)`

---

### 6. `test_knowledge_base` (16 columns)

```sql
id                uuid          NOT NULL
source            text          NOT NULL
source_id         text          NULL
category          text          NOT NULL
title             text          NOT NULL
content           text          NOT NULL
solution          text          NULL
tags              text[]        NULL
relevance_score   integer       NULL
usage_count       integer       NULL
helpful_count     integer       NULL
embedding         vector        NULL
metadata          jsonb         NULL
created_at        timestamptz   NULL
updated_at        timestamptz   NULL
content_tsvector  tsvector      NULL  ← Full-text search support
```

**Purpose**: Test-related knowledge base (for test generation, debugging)

---

## 🔍 Key Differences from Migration File

### ❌ Tables That Do NOT Exist

These tables were in `supabase/migrations/001_aoma_vector_store_optimized.sql` but **do NOT exist in production**:

- `aoma_unified_vectors` ❌
- `aoma_knowledge` ❌
- `confluence_knowledge` ❌
- `alexandria_knowledge` ❌
- `aoma_migration_status` ❌
- `aoma_vector_stats` ❌

### ✅ Actual Production Tables

User has **86 production tables** with a thoroughly researched schema. The crawler-related tables are:

- ✅ `firecrawl_analysis` (EXISTS)
- ✅ `wiki_documents` (EXISTS)
- ✅ `jira_tickets` (EXISTS)
- ✅ `jira_ticket_embeddings` (EXISTS)
- ✅ `crawler_documents` (EXISTS)
- ✅ `test_knowledge_base` (EXISTS)

---

## 🎯 Updated Code References

### `lib/supabase.ts`

**Exports**:

```typescript
// Types matching ACTUAL schema
export interface FirecrawlAnalysis { ... }
export interface WikiDocument { ... }
export interface JiraTicket { ... }
export interface JiraTicketEmbedding { ... }
export interface CrawlerDocument { ... }
export interface TestKnowledgeBase { ... }

// Functions using ACTUAL tables
export async function upsertCrawlerDocument(...)
export async function upsertWikiDocument(...)
export async function upsertJiraTicket(...)
export async function upsertJiraTicketEmbedding(...)
export async function storeFirecrawlData(...)
export async function validateSonyMusicContent()  // Updated to query actual tables
```

### `src/services/confluenceCrawler.ts`

**Before**:

```typescript
import { upsertVector } from "@/lib/supabase";
await upsertVector(markdown, embedding, "confluence", sourceId, metadata);
```

**After**:

```typescript
import { upsertWikiDocument } from "@/lib/supabase";
await upsertWikiDocument(url, "confluence", title, markdown, embedding, metadata);
```

### `src/services/sonyMusicJiraCrawler.ts`

**Before**:

```typescript
import { upsertVector } from "@/lib/supabase";
await upsertVector(content, embedding, "jira", issueKey, metadata);
```

**After**:

```typescript
import { upsertJiraTicket, upsertJiraTicketEmbedding } from "@/lib/supabase";
await upsertJiraTicket(issueKey, title, description, embedding, metadata);
await upsertJiraTicketEmbedding(issueKey, title, embedding, metadata);
```

---

## 🚀 Benefits of Actual Schema

### ✅ Production-Ready Features

1. **Vector Embeddings**:
   - All tables have `embedding` column (pgvector type)
   - Ready for semantic search

2. **Deduplication**:
   - `content_hash` columns in `crawler_documents`, `wiki_documents`
   - Prevents duplicate content

3. **Full-Text Search**:
   - `test_knowledge_base` has `content_tsvector` for fast text search
   - Complements vector search

4. **Proper Metadata**:
   - JSONB columns for flexible data
   - No schema changes needed for new fields

5. **Timestamps**:
   - `created_at`, `updated_at`, `crawled_at`, `analyzed_at`
   - Full audit trail

6. **Source Tracking**:
   - `app_name`, `source`, `source_id` columns
   - Data lineage preserved

---

## ⚠️ Critical Reminders

### For Future Development

1. **NEVER assume tables exist** - Always verify with:

   ```sql
   SELECT table_name, COUNT(*) as column_count
   FROM information_schema.columns
   WHERE table_schema = 'public'
   GROUP BY table_name;
   ```

2. **Check actual column names** - Don't assume from migration files:

   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'your_table';
   ```

3. **Use actual schema** - The user has thoroughly researched their schema
   - Don't suggest creating new tables
   - Work with what exists
   - Ask for schema details if unsure

4. **Supabase JS cannot introspect empty tables** - Must query via SQL:

   ```javascript
   // ❌ This returns 0 columns for empty tables
   const { data } = await supabase.from("table").select("*").limit(1);

   // ✅ Must use information_schema via SQL
   // Run in Supabase Dashboard SQL Editor
   ```

---

## 📝 Verification Queries

### Check Table Existence

```sql
SELECT
  table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'firecrawl_analysis',
    'wiki_documents',
    'jira_tickets',
    'jira_ticket_embeddings',
    'crawler_documents',
    'test_knowledge_base'
  )
GROUP BY table_name;
```

### Check Full Schema

```sql
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('firecrawl_analysis', 'wiki_documents', 'jira_tickets')
ORDER BY table_name, ordinal_position;
```

### Check Row Counts

```javascript
const { count } = await supabase.from("wiki_documents").select("*", { count: "exact", head: true });

console.log(`wiki_documents: ${count} rows`);
```

---

## 🎯 Next Steps

### Immediate

1. ✅ All crawlers updated to use actual tables
2. ✅ Types match actual schema
3. ✅ Functions use correct table names
4. ⏳ Test crawlers with VPN access

### Future Improvements

1. **Add HNSW Indexes** (if not present):

   ```sql
   CREATE INDEX crawler_documents_embedding_idx
   ON crawler_documents USING hnsw (embedding vector_cosine_ops);
   ```

2. **Add Unique Constraints** (if not present):

   ```sql
   ALTER TABLE wiki_documents
   ADD CONSTRAINT unique_wiki_url_per_app UNIQUE(app_name, url);
   ```

3. **Check pgvector Extension**:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```

---

**Last Updated**: January 2025
**Verified Via**: Direct SQL queries to information_schema
**Schema Source**: Production Supabase database (kfxetwuuzljhybfgmpuc)
**Tables Total**: 86 production tables
**Crawler Tables**: 6 verified tables with vector support
