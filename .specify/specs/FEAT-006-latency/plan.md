# Technical Plan: FEAT-006 Query Latency Optimization

## Current State

- Chat route: `src/app/api/chat/route.ts`
- RAG queries are sequential
- No caching layer
- Measured P95: 1797ms

## Approach

### 1. Parallel Source Queries

Currently queries run sequentially:
```
Jira (400ms) → KB (500ms) → Git (300ms) → LLM (600ms) = 1800ms
```

Parallelize data source queries:
```
┌─ Jira (400ms) ─┐
├─ KB (500ms) ───┼─→ LLM (600ms) = 1100ms
└─ Git (300ms) ──┘
```

### 2. Redis Caching Layer

- Cache RAG results by query hash
- TTL: 5 minutes for dynamic content, 1 hour for static KB
- Invalidate on document update webhook

### 3. Query Optimization

- Reduce vector search `k` from 10 to 5 for initial response
- Use `match_threshold` to skip low-relevance results
- Stream earlier by not waiting for all sources

## Files to Modify

| File | Change |
|------|--------|
| `src/app/api/chat/route.ts` | Parallel queries, early streaming |
| `src/lib/cache/redis-client.ts` | New: Redis connection |
| `src/lib/cache/query-cache.ts` | New: Caching logic |
| `src/lib/rag/retriever.ts` | Optimize vector search params |
| `tests/e2e/latency.spec.ts` | New: Timing assertions |

## Dependencies

- `ioredis` - Redis client (or use Upstash for serverless)
- No new infrastructure if using Upstash (already have account)

## Risks

| Risk | Mitigation |
|------|------------|
| Cache staleness | Short TTL + invalidation webhooks |
| Redis cold start | Fallback to uncached on timeout |
| Over-parallelization | Limit concurrent queries to 3 |

## Rollback Plan

Feature flag `ENABLE_QUERY_CACHE=false` bypasses all caching.
