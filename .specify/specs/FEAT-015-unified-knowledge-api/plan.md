# FEAT-015: Unified Knowledge API - Implementation Plan

**Status**: Complete
**Implemented**: 2026-01-03

---

## Summary

Built a standalone Hono service for fast vector search, decoupled from Next.js for better performance and separation of concerns.

---

## Implementation Steps (Completed)

### Phase 1: Core Service

1. **Set up Hono server** (`src/knowledge-api/index.ts`)
   - CORS for localhost:3000 and thebetabase.com
   - Request logging middleware
   - Health check endpoint

2. **Create query endpoint** (`routes/query.ts`)
   - Request validation
   - Cache lookup (Tier 1)
   - Embedding generation
   - Multi-source vector search
   - LLM synthesis
   - Response caching

3. **Build service layer**
   - `cache.ts` - 2-tier caching (response + embedding)
   - `embedding.ts` - Gemini embeddings with cache
   - `vectorSearch.ts` - siam_vectors + wiki_documents
   - `synthesis.ts` - Gemini primary, Groq fallback

### Phase 2: Testing

4. **E2E tests** (`tests/e2e/api/knowledge-api.spec.ts`)
   - Health check
   - Query with/without synthesis
   - Source filtering
   - Cache validation
   - Error handling

### Phase 3: Operations

5. **Startup scripts**
   - `scripts/start-knowledge-api.sh`
   - PM2 config in `ecosystem.config.cjs`

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Hono over Express | Smaller, faster, better TypeScript support |
| Separate port (3006) | Independent scaling, no Next.js overhead |
| In-memory cache | Fast, simple, sufficient for single-instance |
| Gemini + Groq fallback | Redundancy for synthesis availability |
| Text search for wiki | Temporary until vector migration complete |

---

## Dependencies Added

- `hono` - HTTP framework
- `@hono/node-server` - Node.js adapter

---

## Related Commits

- `f39608242` - feat: Add Unified Knowledge API (Hono service on port 3006)
