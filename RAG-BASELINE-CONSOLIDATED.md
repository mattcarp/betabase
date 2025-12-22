# RAG System Baseline - Before AI SDK v6 Improvements

**Date:** 2025-12-22
**Project:** mc-thebetabase (The Database)
**Tester:** Claudette (via automated test script)

---

## Executive Summary

The current RAG system has critical performance and quality issues:

| Metric | Current Value | Target | Status |
|--------|---------------|--------|--------|
| Average TTFB | 6,376ms | <2,000ms | ❌ CRITICAL |
| Average Total Response | 8,442ms | <4,000ms | ❌ CRITICAL |
| Knowledge Base Citation % | 0% | >60% | ❌ CRITICAL |
| Jira Citation % | 100% | <30% | ❌ CRITICAL |
| Confidence Accuracy | Hardcoded 80% | Dynamic | ❌ BROKEN |

---

## Test Results

### Query Performance

| Test | TTFB (ms) | Total (ms) | Citation Sources |
|------|-----------|------------|------------------|
| Application Name (Exact Match) | 8,492 | 9,463 | jira, jira, git |
| Acronym Expansion | 16,334 | 18,179 | jira, jira, jira, jira, jira |
| How-To Question | 3,452 | 6,694 | jira, jira, jira, jira, jira |
| Feature Discovery | 3,649 | 5,694 | jira, jira, jira, jira, jira |
| Multi-Hop Reasoning | 3,050 | 5,762 | jira, jira, jira, jira, jira |
| Quick Factual | 3,281 | 4,859 | jira, jira, jira, jira, jira |

### RAG Metadata (All Tests)

- **Strategy:** parallel-context-aware
- **Confidence:** 80.0% (hardcoded - not dynamic)
- **Documents Retrieved:** 5 per query

### Source Type Distribution

| Source Type | Count | Percentage |
|-------------|-------|------------|
| jira | 28 | 96.6% |
| git | 1 | 3.4% |
| knowledge | 0 | 0.0% |

---

## Root Causes Identified

### 1. Gemini Reranker JSON Parsing Failures
- Location: `/src/services/geminiReranker.ts`
- When JSON parsing fails, ALL documents get default score of 50
- This randomizes document ordering

### 2. Hardcoded Source Type Boosts
```typescript
const SOURCE_TYPE_BOOSTS = {
  knowledge: 0.20,  // +20%
  pdf: 0.15,
  firecrawl: 0.10,
  git: 0.05,
  jira: 0.0,  // No boost - but still dominates!
};
```

### 3. No Hybrid Search
- Only vector search (semantic)
- Missing BM25/keyword search for exact matches
- "AOMA" as a string gets lost in embedding space

### 4. Permissive Vector Threshold
- Current: 0.50 (50% similarity)
- Pulls in too much noise

---

## Implementation Plan

### Phase 1: Replace Gemini Reranker with Cohere (HIGHEST PRIORITY)
- Add `@ai-sdk/cohere` package
- Use `rerank()` function with `rerank-v3.5` model
- Eliminate JSON parsing failures
- Expected improvement: +40-60% answer quality

### Phase 2: Add Hybrid Search
- Implement BM25/keyword search in Supabase
- Merge with vector results before reranking
- Expected improvement: +20-30% recall

### Phase 3: Fix Query Embeddings
- Add task types to embeddings (`RETRIEVAL_QUERY`)
- Expected improvement: +5-10% accuracy

### Phase 4: RAG Middleware Pattern
- Clean architecture with AI SDK v6 middleware
- Better error handling and logging

---

## Post-Implementation Comparison

After completing all phases, re-run:
```bash
npx tsx scripts/rag-baseline-test.ts POST-IMPLEMENTATION
```

Compare results to this baseline.

---

## Files Modified

_To be updated during implementation:_

1. `/src/services/cohereReranker.ts` - NEW
2. `/src/services/twoStageRetrieval.ts` - MODIFIED
3. `/src/services/queryEmbeddingService.ts` - NEW
4. `/src/services/hybridRetrieval.ts` - NEW
5. `/src/app/api/chat/route.ts` - MODIFIED
