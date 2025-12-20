# Performance Optimization Handoff Document

**Date:** December 20, 2025  
**Author:** Claude (AI Assistant)  
**Project:** mc-thebetabase (The Database / SIAM)

---

## Executive Summary

Completed Phase 1 of chat API performance optimization by removing duplicate RAG orchestration. Achieved **23% improvement in average TTFB** (12.6s → 9.7s), but still 5x slower than target. Root cause identified: UnifiedRAG pipeline makes 3-4 sequential Gemini API calls before streaming can begin.

---

## Current Baseline (Post Phase 1)

### Test Results - December 20, 2025, 09:21 UTC

**Test Configuration:**
- Model: `gemini-2.5-flash`
- Mode: `fast`
- Endpoint: `POST /api/chat`

| Query | TTFB | Total Time | RAG Time | Documents |
|-------|------|------------|----------|-----------|
| "What is AOMA?" | **19,177ms** | 20,235ms | 19,110ms | 5 |
| "What Jira tickets mention login issues?" | **5,224ms** | 6,402ms | 5,191ms | 5 |
| "Show me the USM architecture" | **4,760ms** | 6,177ms | 4,736ms | 5 |

**Summary Statistics:**
- **Average TTFB: 9,720ms**
- **Average Total: 10,938ms**
- **Min TTFB: 4,760ms** (warm query)
- **Max TTFB: 19,177ms** (cold start)

**Key Observation:** First query is ~4x slower than subsequent queries due to Gemini API cold start. Warm queries are in the 4-6 second range.

---

## Phase 1 Completed: Remove Duplicate Orchestration

### What Was Done

1. **Commented out aomaOrchestrator import** (line 9 of route.ts)
   ```typescript
   // DISABLED: aomaOrchestrator removed - UnifiedRAG is now the sole retrieval path
   // import { aomaOrchestrator } from "@/services/aomaOrchestrator";
   ```

2. **Replaced PHASE 2 block** (lines 564-767) with context building from UnifiedRAG results
   - Removed `aomaOrchestrator.executeOrchestration()` call
   - Now uses `ragResult.documents` from PHASE 1 to build context and citations
   - Simplified error handling

3. **Removed unused variables**
   - `vectorTrace`, `vectorStartTime`, `vectorEndTime`

### Before vs After Phase 1

| Metric | Before (Both Orchestrators) | After (UnifiedRAG Only) | Improvement |
|--------|----------------------------|-------------------------|-------------|
| Average TTFB | 12,613ms | 9,720ms | **-23%** |
| Average Total | 13,564ms | 10,938ms | **-19%** |
| Min TTFB | 7,428ms | 4,760ms | **-36%** |
| Max TTFB | 19,424ms | 19,177ms | ~same |

### Target vs Actual

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| TTFB | <2,000ms | 9,720ms | ❌ 5x over |
| Total | <5,000ms | 10,938ms | ❌ 2x over |

---

## Architecture After Phase 1

```
User Query
    ↓
POST /api/chat
    ↓
UnifiedRAGOrchestrator.query()           ← SOLE RAG PATH (no more duplicate)
    ↓
ContextAwareRetrieval.query()
    ├─ loadRLHFFeedback()                 ~200-500ms (Supabase query)
    ├─ transformQuery()                   ~1-3s (Gemini API call #1)
    └─ TwoStageRetrieval.query()
          ├─ vectorService.searchVectors() ~500-2s (embedding generation + pgvector)
          └─ reranker.rerankDocuments()   ~2-5s (Gemini API call #2)
    ↓
synthesizeContext()                       ~500ms-1s (Gemini API call #3)
    ↓
streamText()                              Gemini API call #4 (final response)
    ↓
Streaming Response to Client
```

**Total Gemini API calls per query: 4**
1. Query transformation
2. Embedding generation (via Gemini embedding model)
3. Re-ranking
4. Final response generation

---

## What UnifiedRAG Provides (Worth Keeping)

1. **Two-Stage Re-ranking** - Gemini re-ranks 50 vector candidates down to top 10 for better precision
2. **RLHF Signal Integration** - Boosts documents that received positive curator feedback
3. **Context-Aware Query Transformation** - Uses conversation history to disambiguate queries
4. **Session State Management** - Tracks successful retrievals for learning
5. **Multi-tenant Design** - Parameterized by `organization`, `division`, `app_under_test`

---

## Remaining Optimization Phases

### Phase 2: Parallelize Independent Operations (Est. 1-2 hours)
**Expected savings: 1-2 seconds**

Run these in parallel instead of sequentially:
```typescript
// CURRENT (sequential):
const rlhfFeedback = await loadRLHFFeedback();
const transformedQuery = await transformQuery();

// PROPOSED (parallel):
const [rlhfFeedback, transformedQuery] = await Promise.all([
  loadRLHFFeedback(),
  transformQuery()
]);
```

Also parallelize RLHF boost query with re-ranking.

### Phase 3: Conditional Query Transformation (Est. 2-3 hours)
**Expected savings: 1-3 seconds for ~60% of queries**

Skip the Gemini query transformation for:
- First message in session (no history to use anyway)
- Short queries (<10 words)
- Queries without pronouns or ambiguous references

```typescript
const needsTransformation = 
  sessionHistory.length > 0 && 
  (query.length > 50 || /\b(it|this|that|they|them)\b/i.test(query));

if (!needsTransformation) {
  // Skip transformQuery() - save 1-3 seconds
}
```

### Phase 4: Cache Embeddings (Est. 4-6 hours)
**Expected savings: 500ms-1s for repeated queries**

Implement query embedding cache:
```typescript
const cacheKey = hashQuery(query);
let embedding = await redis.get(`embed:${cacheKey}`);
if (!embedding) {
  embedding = await generateEmbedding(query);
  await redis.set(`embed:${cacheKey}`, embedding, 'EX', 3600);
}
```

### Phase 5: Skip Re-ranking for Simple Queries (Est. 2-3 hours)
**Expected savings: 2-3 seconds for simple queries**

For queries that match a single document with high confidence (>0.9 similarity), skip the re-ranking step entirely.

---

## Files Modified in Phase 1

| File | Changes |
|------|---------|
| `src/app/api/chat/route.ts` | Commented out aomaOrchestrator import, replaced PHASE 2 block with UnifiedRAG context building, simplified error handling |

---

## Files Relevant for Future Phases

| File | Purpose |
|------|---------|
| `src/services/unifiedRAGOrchestrator.ts` | Main orchestrator - controls strategy selection |
| `src/services/contextAwareRetrieval.ts` | Query transformation, RLHF loading |
| `src/services/twoStageRetrieval.ts` | Vector search + re-ranking coordination |
| `src/services/geminiReranker.ts` | Gemini-based document re-ranking |
| `src/services/supabaseVectorService.ts` | Embedding generation, pgvector queries |
| `src/services/contextSynthesizer.ts` | Synthesizes context from documents |

---

## Test Script Location

Performance test script used for these measurements:
```
/tmp/perf-test-detailed.js
```

Can be run with:
```bash
cd /Users/matt/Documents/projects/mc-thebetabase && node /tmp/perf-test-detailed.js
```

---

## Recommendations

1. **Proceed with Phase 2** (parallelization) - lowest risk, clear benefit
2. **Consider Phase 3** (conditional transformation) - good ROI for simple queries
3. **Phase 4** (caching) requires Redis/cache infrastructure decision
4. **Phase 5** (skip re-ranking) needs threshold tuning to avoid quality regression

**Realistic target after Phases 2-3:** 
- Warm queries: 3-4 seconds
- Cold queries: 10-12 seconds (Gemini cold start is unavoidable)

To hit the <2s TTFB target would require either:
- Pre-warming Gemini connections
- Switching to a faster/local embedding model
- Implementing speculative/progressive retrieval
