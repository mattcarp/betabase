# FEAT-015: Unified Knowledge API

**Status**: Implemented
**Created**: 2026-01-03
**Commit**: `f39608242`

---

## Overview

A standalone Hono-based HTTP service for fast vector search across SIAM's multi-source knowledge base. Runs on port 3006, separate from the main Next.js app (3000) and SIAM MCP server (3005).

---

## Architecture

```
                     +------------------+
                     |   Client Apps    |
                     | (Chat UI, MCP)   |
                     +--------+---------+
                              |
                    POST /v1/knowledge/query
                              |
                     +--------v---------+
                     | Knowledge API    |
                     | (Hono, Port 3006)|
                     +--------+---------+
                              |
       +----------------------+----------------------+
       |                      |                      |
+------v------+    +----------v----------+    +------v------+
| Tier 1 Cache|    | Tier 2 Cache        |    | LLM Synth   |
| (Response)  |    | (Embeddings)        |    | Gemini/Groq |
+-------------+    +---------------------+    +-------------+
                              |
              +---------------+---------------+
              |                               |
     +--------v--------+             +--------v--------+
     | siam_vectors    |             | wiki_documents  |
     | (Gemini 768d)   |             | (Text fallback) |
     | git, jira, etc  |             | Confluence docs |
     +-----------------+             +-----------------+
```

---

## Endpoints

### GET /health

Health check with cache statistics.

**Response:**
```json
{
  "status": "healthy",
  "service": "knowledge-api",
  "version": "1.0.0",
  "cache": {
    "response_entries": 42,
    "embedding_entries": 128,
    "hit_rate": 0.73
  },
  "timestamp": "2026-01-03T10:00:00.000Z"
}
```

---

### POST /v1/knowledge/query

Primary endpoint for semantic search with optional LLM synthesis.

**Request:**
```typescript
interface QueryRequest {
  query: string;           // Required, non-empty
  sources?: SourceType[];  // Filter: 'git' | 'jira' | 'knowledge' | 'wiki' | 'email' | 'metrics'
  limit?: number;          // 1-20, default 5
  threshold?: number;      // 0.0-1.0, default 0.2 (similarity cutoff)
  synthesize?: boolean;    // default true (LLM synthesis)
  stream?: boolean;        // Reserved for future streaming support
}
```

**Response:**
```typescript
interface QueryResponse {
  results: VectorResult[];
  synthesis?: string;      // LLM-generated answer (if synthesize=true)
  metrics: {
    total_ms: number;
    cache_hit: boolean;
    embedding_ms: number;
    search_ms: number;
    synthesis_ms?: number; // Only if synthesis performed
  };
}

interface VectorResult {
  id: string;
  content: string;
  source_type: SourceType;
  source_id: string;       // Jira key, git commit, URL, etc.
  similarity: number;      // 0.0-1.0
  metadata: Record<string, unknown>;
  expandable?: boolean;    // If true, full detail available via /detail
}
```

**Example:**
```bash
curl -X POST http://localhost:3006/v1/knowledge/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I create a test case in AOMA?",
    "sources": ["jira", "wiki"],
    "limit": 5,
    "threshold": 0.3
  }'
```

---

### GET /v1/knowledge/detail/:type/:id

Retrieve full detail for a specific resource.

**Parameters:**
- `type`: Source type (e.g., `jira`, `git`)
- `id`: Source ID (e.g., `SIAM-1234`)

---

## Data Sources

### 1. siam_vectors (Primary)

Multi-tenant vector store with Gemini embeddings (768 dimensions).

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| organization | string | e.g., 'sony-music' |
| division | string | e.g., 'digital-operations' |
| app_under_test | string | e.g., 'aoma' |
| content | text | Searchable text content |
| embedding | vector(768) | Gemini embedding |
| source_type | string | 'git', 'jira', 'knowledge', 'metrics' |
| source_id | string | Original ID from source system |
| metadata | jsonb | Source-specific metadata |

**RPC Function:** `match_siam_vectors_gemini`

### 2. wiki_documents (Secondary)

Confluence/wiki documents. Currently uses text search as fallback (embeddings stored as TEXT, not vector).

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| title | string | Document title |
| markdown_content | text | Full document content |
| url | string | Source URL |
| app_name | string | e.g., 'AOMA' |

**Search Method:** Keyword-based text search (ilike) until vector migration complete.

---

## Caching Strategy

### Tier 1: Response Cache

- **Key**: Hash of (query, sources, limit, threshold, synthesize)
- **TTL**: 12 hours
- **Storage**: In-memory Map
- **Hit Time**: < 5ms

### Tier 2: Embedding Cache

- **Key**: Normalized query string
- **TTL**: 24 hours
- **Storage**: In-memory Map
- **Avoids**: Repeated Gemini API calls for same query

---

## LLM Synthesis

When `synthesize=true` (default), the API generates a natural language answer.

**Primary Model:** `gemini-2.0-flash` (Google)
- Temperature: 0.3
- Max tokens: 500
- Timeout: 5 seconds

**Fallback Model:** `llama-3.3-70b-versatile` (Groq)
- Same parameters
- Used when Gemini fails or times out

**Prompt Template:**
```
You are a helpful assistant for AOMA (Asset and Offering Management Application).
Answer the user's question based ONLY on the provided context. Be concise and direct.
If the context doesn't contain relevant information, say so clearly.

CONTEXT:
[Vector search results, max 6400 chars]

USER QUESTION: {query}

ANSWER:
```

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Cache hit | < 10ms | Response served from Tier 1 cache |
| Cold query (no synthesis) | < 500ms | Embedding + vector search only |
| Cold query (with synthesis) | < 3s | Full pipeline including LLM |
| Embedding generation | < 200ms | Gemini API call |
| Vector search | < 100ms | Supabase RPC |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| SUPABASE_URL | Yes | Supabase project URL |
| SUPABASE_SERVICE_ROLE_KEY | Yes | Service role key for RPC |
| GOOGLE_GENERATIVE_AI_API_KEY | Yes | For embeddings & synthesis |
| GROQ_API_KEY | Yes | Fallback synthesis |
| KNOWLEDGE_API_PORT | No | Default: 3006 |

---

## Running the Service

```bash
# Development
npm run knowledge-api:dev

# Production (via PM2)
npm run knowledge-api:start

# Start script
./scripts/start-knowledge-api.sh
```

---

## Testing

```bash
# Run E2E tests (requires service running)
npx playwright test tests/e2e/api/knowledge-api.spec.ts
```

**Test Coverage:**
- Health check endpoint
- Query with/without synthesis
- Source filtering
- Cache hit verification
- Limit enforcement (max 20)
- Error handling (400 for invalid requests)
- 404 handler with helpful hints

---

## Future Enhancements

1. **Streaming responses** (`stream: true` parameter)
2. **wiki_documents vector migration** (TEXT to vector(768))
3. **Semantic routing** (skip sources based on query intent)
4. **Progressive streaming** (return Supabase results first, then append wiki)
5. **Smart prefetching** (cache predicted follow-up queries)

---

## Related Files

- `src/knowledge-api/index.ts` - Main entry point
- `src/knowledge-api/routes/query.ts` - Query endpoint
- `src/knowledge-api/routes/detail.ts` - Detail endpoint
- `src/knowledge-api/services/cache.ts` - 2-tier caching
- `src/knowledge-api/services/embedding.ts` - Gemini embeddings
- `src/knowledge-api/services/vectorSearch.ts` - Multi-source search
- `src/knowledge-api/services/synthesis.ts` - LLM synthesis
- `src/knowledge-api/types.ts` - TypeScript interfaces
- `tests/e2e/api/knowledge-api.spec.ts` - E2E tests
- `ecosystem.config.cjs` - PM2 configuration
