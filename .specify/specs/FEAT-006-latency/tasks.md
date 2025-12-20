# Tasks: FEAT-006 Query Latency Optimization

## Task 1: Baseline Measurement

**Goal:** Establish current latency metrics with Playwright

- Create `tests/e2e/latency.spec.ts`
- Measure time from chat submit to first streaming token
- Run 10 queries, record P50/P95
- Commit baseline numbers to this file

**Done when:** Playwright test exists and baseline recorded

---

## Task 2: Parallel Source Queries

**Goal:** Run Jira, KB, and Git queries in parallel

- Refactor `src/app/api/chat/route.ts`
- Use `Promise.all()` or `Promise.allSettled()` for data sources
- Handle partial failures gracefully (if one source fails, continue with others)
- Maintain same response format

**Done when:** Queries run in parallel, no sequential blocking

---

## Task 3: Redis Cache Setup

**Goal:** Add caching layer for RAG results

- Create `src/lib/cache/redis-client.ts` with Upstash connection
- Create `src/lib/cache/query-cache.ts` with get/set/invalidate
- Add `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN` to env
- Test cache hit/miss locally

**Done when:** Cache client works, env vars documented

---

## Task 4: Integrate Cache into Chat Route

**Goal:** Cache RAG results by query hash

- Hash query + filters to create cache key
- Check cache before RAG retrieval
- Store results with appropriate TTL (5 min dynamic, 1 hr static)
- Add cache headers to response for debugging

**Done when:** Repeated queries return cached results

---

## Task 5: Cache Invalidation

**Goal:** Clear cache when documents update

- Add invalidation call to document update webhook
- Invalidate by source type (e.g., all Jira cache on Jira sync)
- Add manual invalidation endpoint for admin

**Done when:** Document updates clear relevant cache entries

---

## Task 6: Latency Verification

**Goal:** Verify P95 < 1000ms

- Run Playwright latency tests
- Compare to baseline from Task 1
- If not meeting target, profile and identify bottleneck
- Iterate until target met

**Done when:** P95 latency < 1000ms confirmed by Playwright

---

## Task 7: Documentation & Cleanup

**Goal:** Document the caching system

- Add cache config to `docs/reference/ENVIRONMENT-VARS.md`
- Update `CLAUDE.md` if needed
- Remove any debug logging
- Final commit

**Done when:** PR-ready, no debug code, docs updated
