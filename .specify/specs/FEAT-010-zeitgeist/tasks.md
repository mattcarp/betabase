# Tasks: FEAT-010 Zeitgeist Service

## Task 1: Create Zeitgeist Service Core

**Goal:** Build the core service that aggregates and scores topics

- Create `src/lib/services/zeitgeistService.ts`
- Implement data collection from:
  - `rlhf_feedback` (query frequency, sentiment)
  - `jira_tickets` (recent issues)
  - `test_results` (failure patterns)
- Implement scoring algorithm (frequency 0.3, recency 0.3, confidence 0.4)
- Return ranked list of `ZeitgeistTopic[]`

**Done when:** Service returns scored topics from real data

---

## Task 2: KB Validation Layer

**Goal:** Validate each topic has a good answer in our knowledge base

- Add `validateKBCoverage()` method to zeitgeistService
- For each candidate topic, run `knowledgeSearchService.search()`
- Set `hasGoodAnswer = true` if similarity > 0.70
- Store `answerConfidence` score
- Run validations in parallel with timeout (2s per topic)

**Done when:** Each topic has `hasGoodAnswer` and `answerConfidence` fields

---

## Task 3: Caching Layer

**Goal:** Store results in app_cache with TTL

- Add `cacheResults()` and `getCachedResults()` methods
- Use cache key: `zeitgeist_suggestions_YYYY-MM-DD`
- Store both top 6 and full topic list
- TTL: 12 hours (configurable via env)
- Handle cache miss gracefully (return defaults, trigger async refresh)

**Done when:** Results persist across requests, TTL works

---

## Task 4: API Routes

**Goal:** Create the API endpoints

- `GET /api/zeitgeist` - Returns top 6 suggestions (for chat page)
  - Check cache first
  - If miss, generate and cache
  - Return `{ suggestions: string[], generatedAt, confidence }`

- `GET /api/zeitgeist/trending` - Returns full topic list (for manager)
  - Include all scored topics
  - Include trend indicators
  - Return `{ topics: ZeitgeistTopic[], generatedAt }`

- `POST /api/zeitgeist/refresh` - Manual refresh trigger
  - Invalidate cache
  - Regenerate topics
  - Return new results

**Done when:** All three endpoints work and return correct data

---

## Task 5: Wire into Chat Suggestions

**Goal:** Replace hardcoded suggestions with dynamic zeitgeist

- Modify `src/app/api/aoma/suggestions/route.ts`
- Call `/api/zeitgeist` instead of returning hardcoded array
- Add fallback to hardcoded if zeitgeist fails
- Update response format to match existing contract

**Done when:** Chat landing page shows dynamic suggestions from zeitgeist

---

## Task 6: Manager Dashboard Panel

**Goal:** Create UI for managers to see trending topics

- Create `src/components/curate/ZeitgeistPanel.tsx`
- Display full topic list as sortable table
- Show: question, score, frequency, trend, confidence, sources
- Color-code by confidence (green = good answer, yellow = medium, red = gap)
- Add to Curate tab as new sub-tab

**Done when:** Manager can view all trending topics with scores

---

## Task 7: Trend Calculation

**Goal:** Add rising/stable/falling indicators

- Compare current 48h frequency to previous 7-day average
- Calculate trend: `(current - avg) / avg`
- rising: > 0.2, falling: < -0.2, stable: in between
- Store trend in topic data
- Show trend arrows in dashboard

**Done when:** Topics show accurate trend indicators

---

## Task 8: E2E Tests

**Goal:** Verify zeitgeist works end-to-end

- Create `tests/e2e/zeitgeist.spec.ts`
- Test `/api/zeitgeist` returns 6 suggestions
- Test `/api/zeitgeist/trending` returns scored topics
- Test chat page shows dynamic suggestions
- Test refresh endpoint clears cache and regenerates

**Done when:** All E2E tests pass

---

## Task 9: Documentation & Cleanup

**Goal:** Document the zeitgeist system

- Add `ZEITGEIST_CACHE_TTL_HOURS` to env docs
- Update `features.json` - move B005 to F009, mark in progress
- Update `claude-progress.txt` with implementation notes
- Remove debug logging
- Final commit

**Done when:** PR-ready, docs updated, no debug code
