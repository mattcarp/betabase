# Technical Plan: FEAT-010 Zeitgeist Service

## Current State

- Chat landing page: `src/components/ui/pages/ChatPage.tsx`
- 6 hardcoded suggestions passed to `AiSdkChatPanel`
- Existing endpoint `/api/aoma/suggestions` returns same hardcoded list
- `app_cache` table exists and is designed for this use case
- RAG search via `knowledgeSearchService.ts` can validate answers

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZEITGEIST SERVICE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  RLHF    │  │  Jira    │  │  Tests   │  │  Chat    │        │
│  │ Feedback │  │ Tickets  │  │ Results  │  │ History  │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │               │
│       └─────────────┴─────────────┴─────────────┘               │
│                           │                                     │
│                    ┌──────▼──────┐                              │
│                    │  Aggregate  │                              │
│                    │  & Score    │                              │
│                    └──────┬──────┘                              │
│                           │                                     │
│                    ┌──────▼──────┐                              │
│                    │  Validate   │  ← RAG search for each topic │
│                    │  KB Answer  │                              │
│                    └──────┬──────┘                              │
│                           │                                     │
│                    ┌──────▼──────┐                              │
│                    │  Cache in   │  → app_cache table           │
│                    │  app_cache  │                              │
│                    └─────────────┘                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           ▼                                     ▼
    ┌─────────────┐                      ┌─────────────┐
    │ Chat Page   │                      │  Manager    │
    │ Suggestions │                      │  Dashboard  │
    │  (Top 6)    │                      │ (Full List) │
    └─────────────┘                      └─────────────┘
```

## Approach

### 1. Data Collection Queries

```sql
-- RLHF: What questions are being asked?
SELECT
  query,
  COUNT(*) as ask_count,
  AVG(CASE WHEN feedback_type = 'thumbs_up' THEN 1 ELSE 0 END) as approval_rate
FROM rlhf_feedback
WHERE created_at > NOW() - INTERVAL '48 hours'
GROUP BY query
ORDER BY ask_count DESC
LIMIT 50;

-- Jira: What issues are new?
SELECT summary, created_at
FROM jira_tickets
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 50;

-- Tests: What's failing?
SELECT test_name, COUNT(*) as fail_count
FROM test_results
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY test_name
HAVING COUNT(*) >= 2
ORDER BY fail_count DESC;
```

### 2. Scoring Algorithm

```typescript
interface ZeitgeistTopic {
  question: string;
  rawScore: number;
  frequency: number;
  recencyWeight: number;
  trend: 'rising' | 'stable' | 'falling';
  hasGoodAnswer: boolean;
  answerConfidence: number;
  sources: string[];
  lastSeen: Date;
}

function calculateScore(topic: ZeitgeistTopic): number {
  const frequencyScore = Math.min(topic.frequency / 10, 1.0) * 0.3;
  const recencyScore = topic.recencyWeight * 0.3;
  const confidenceScore = topic.answerConfidence * 0.4;

  return frequencyScore + recencyScore + confidenceScore;
}

// Only include if: hasGoodAnswer && score > 0.5
```

### 3. KB Validation

For each candidate topic, run RAG search:

```typescript
const validation = await knowledgeSearchService.search(topic.question, {
  matchThreshold: 0.70,  // Higher bar for "good answer"
  matchCount: 3,
  timeoutMs: 2000
});

topic.hasGoodAnswer = validation.results.length > 0
  && validation.results[0].similarity > 0.70;
topic.answerConfidence = validation.results[0]?.similarity ?? 0;
```

### 4. Caching Strategy

```typescript
// Cache key
const cacheKey = `zeitgeist_suggestions_${format(new Date(), 'yyyy-MM-dd')}`;

// Cache structure
interface ZeitgeistCache {
  suggestions: string[];           // Top 6 for chat page
  allTopics: ZeitgeistTopic[];     // Full list for dashboard
  generatedAt: string;
  dataRange: '48h';
  version: 1;
}

// TTL: 6-24 hours
// Refresh: Manual trigger or scheduled
```

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/services/zeitgeistService.ts` | Create | Core service logic |
| `src/app/api/zeitgeist/route.ts` | Create | GET top 6 suggestions |
| `src/app/api/zeitgeist/trending/route.ts` | Create | GET full topic list |
| `src/app/api/zeitgeist/refresh/route.ts` | Create | POST manual refresh |
| `src/app/api/aoma/suggestions/route.ts` | Modify | Delegate to zeitgeist |
| `src/components/curate/ZeitgeistPanel.tsx` | Create | Manager dashboard |
| `tests/e2e/zeitgeist.spec.ts` | Create | E2E tests |

## Dependencies

- No new packages required
- Uses existing: Supabase client, knowledgeSearchService, app_cache table

## Risks

| Risk | Mitigation |
|------|------------|
| No activity data | Fallback to curated defaults |
| All topics low confidence | Keep best available, mark as "exploring" |
| Slow KB validation | Parallel validation, timeout per topic |
| Cache miss on first load | Return defaults, trigger async refresh |

## Rollback Plan

If zeitgeist fails, `/api/aoma/suggestions` falls back to hardcoded list (current behavior).
