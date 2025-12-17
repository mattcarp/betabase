# SIAM Vector Store Architecture

**Last Updated:** 2025-12-16  
**Status:** Definitive - This is the correct architecture

---

## ✅ CORRECT Architecture

### Storage Layer

| Component | Technology | Details |
|-----------|------------|---------|
| **Database** | Supabase PostgreSQL | With pgvector extension |
| **Table** | `siam_vectors` | Multi-tenant (org/division/app_under_test) |
| **Embeddings** | Gemini text-embedding-004 | 768 dimensions (default) |
| **Alternative** | OpenAI text-embedding-3-small | 1536 dimensions (optional) |

### Multi-Tenant Structure

```
siam_vectors
├── organization: "sony-music"
│   └── division: "digital-operations"
│       └── app_under_test: "aoma"
│           ├── source_type: "firecrawl" (scraped docs)
│           ├── source_type: "jira" (JIRA tickets)
│           ├── source_type: "knowledge" (uploaded files)
│           ├── source_type: "git" (code)
│           └── source_type: "email" (context)
```

### Key Services

| Service | File | Purpose |
|---------|------|---------|
| **SupabaseVectorService** | `src/services/supabaseVectorService.ts` | ✅ Primary vector operations |
| **DeduplicationService** | `src/services/deduplicationService.ts` | ✅ Multi-tenant deduplication |
| **GeminiEmbeddingService** | `src/services/geminiEmbeddingService.ts` | ✅ Embedding generation |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/knowledge/upload` | POST | ✅ Upload documents to Supabase |
| `/api/knowledge/upload` | GET | ✅ List knowledge base stats |
| `/api/knowledge/upload` | DELETE | ✅ Delete vectors by sourceId |

---

## ❌ DEPRECATED Code (DO NOT USE)

The following files use **OpenAI vector stores** which we do NOT use:

| File | Issue | Migration |
|------|-------|-----------|
| `/api/upload/route.ts` | Uses OpenAI files API | Use `/api/knowledge/upload` |
| `/api/assistant/route.ts` | Uses vector_store_ids | Remove vector store refs |
| `/api/vector-store/*` | All OpenAI-based | Rewrite or remove |
| `vectorStoreService.ts` | OpenAI vector stores | Use `supabaseVectorService.ts` |
| `vectorStoreMigration.ts` | OpenAI migration | Archive when done |

### Config to Remove

```typescript
// ❌ DEPRECATED - These should not be used
config/apiKeys.ts:
  vectorStoreId: "vs_..." // OpenAI vector store ID

// Environment variables that reference OpenAI vector stores:
VECTOR_STORE_ID=vs_...  // Not needed for Supabase
```

---

## How It Works

### 1. Document Upload Flow

```
User uploads file
    ↓
/api/knowledge/upload (POST)
    ↓
Extract text content
    ↓
SupabaseVectorService.upsertVector()
    ↓
Generate embedding (Gemini 768d)
    ↓
Store in siam_vectors table
    ↓
Available for RAG search
```

### 2. Search/RAG Flow

```
User asks question
    ↓
Chat API receives query
    ↓
SupabaseVectorService.searchVectors()
    ↓
Generate query embedding (Gemini)
    ↓
pgvector similarity search (siam_vectors)
    ↓
Return top-k results with similarity scores
    ↓
LLM generates response with retrieved context
```

### 3. Deduplication Flow

```
DeduplicationService.checkDuplicate()
    ↓
1. Source ID check (fastest)
    ↓
2. Content hash check (MD5)
    ↓
3. URL normalization check
    ↓
4. Semantic similarity check (if embedding provided)
    ↓
Return: isDuplicate, matchType, shouldUpdate
```

---

## Source Types

| Type | Description | Example Source |
|------|-------------|----------------|
| `firecrawl` | Web-scraped documentation | AOMA help pages |
| `jira` | JIRA tickets and comments | AOMA project tickets |
| `knowledge` | Manually uploaded documents | Release notes, guides |
| `git` | Code and commit messages | AOMA repository |
| `email` | Email context | Support threads |
| `openai_import` | Migrated from OpenAI | Legacy data |
| `cache` | Cached responses | Query caching |

---

## Testing Vectors Are Available

To verify vectors are available for:
- Chat (RAG search)
- Test creation (synthetic tests)
- RLHF feedback
- Curation

All features use `SupabaseVectorService.searchVectors()` which queries the same `siam_vectors` table.

```typescript
const vectorService = getSupabaseVectorService();
const results = await vectorService.searchVectors(query, {
  organization: "sony-music",
  division: "digital-operations",
  app_under_test: "aoma",
  matchThreshold: 0.5,
  matchCount: 10,
});
```

---

## Migration Notes

If you find code using OpenAI vector stores:
1. Add a deprecation comment
2. Plan migration to SupabaseVectorService
3. Update imports and API calls
4. Test thoroughly
5. Archive or remove legacy code

---

*This document is the source of truth for SIAM's vector storage architecture.*




