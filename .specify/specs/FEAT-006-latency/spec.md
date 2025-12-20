# FEAT-006: Query Latency Optimization

## Problem

Chat responses currently take ~1.8 seconds (1797ms measured). Users expect sub-second responses for a fluid conversational experience. The delay occurs between chat submission and first streaming token.

## Solution

Reduce 95th percentile response time to under 1 second by implementing caching, optimizing RAG retrieval, and parallelizing data source queries.

## Scope

- Chat API route (`src/app/api/chat/route.ts`)
- RAG retrieval pipeline
- Multi-source queries (Jira, KB, Git)

## Out of Scope

- UI changes (already streaming)
- Model selection (staying with current provider)

## Acceptance Criteria

- [ ] 95th percentile response time < 1000ms
- [ ] Measured from chat submission to first streaming token
- [ ] Must touch at least 2 sources (Jira + KB or Git + KB)
- [ ] Playwright timing assertions pass
- [ ] No degradation in response quality
- [ ] Cache invalidation works correctly on document updates

## Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| P95 Latency | 1797ms | <1000ms |
| P50 Latency | ~1200ms | <600ms |
| Cache Hit Rate | 0% | >60% |

## References

- REQ-001 in specs/SIAM/requirements.md
- Current timing logged in Langsmith
