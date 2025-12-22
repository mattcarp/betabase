# FEAT-010: Zeitgeist Hot Topics Intelligence

## Overview

The Zeitgeist Hot Topics feature provides AI-powered analysis of frequently asked questions and trending topics across the SIAM platform. It aggregates signals from multiple sources (RLHF curation, Jira tickets, test failures) to surface the most relevant topics for users and managers.

## Architecture

### Core Components

1. **ZeitgeistService** (`src/services/zeitgeistService.ts`)
   - Aggregates topics from multiple signal sources
   - Validates KB coverage for each topic
   - Calculates trending scores with weighted signals
   - Maintains cache with 12-hour TTL

2. **API Routes** (`src/app/api/zeitgeist/`)
   - `GET /api/zeitgeist` - Chat suggestions (top 6)
   - `GET /api/zeitgeist/trending` - Full topic list with stats
   - `POST /api/zeitgeist/refresh` - Force cache refresh

3. **ZeitgeistPanel** (`src/components/ui/ZeitgeistPanel.tsx`)
   - Dashboard panel in Curate > Hot Topics tab
   - Shows KB coverage stats, topic table, trend indicators
   - Manual refresh functionality

### Signal Sources & Weights

| Source | Weight | Description |
|--------|--------|-------------|
| RLHF | 0.4 | Topics from RLHF curation queue (negative ratings) |
| Jira | 0.35 | Feature requests and bug reports |
| Test Failures | 0.25 | Recurring test failure patterns |

### Trend Calculation

Trends are calculated by comparing current scores to previous refresh:
- **Rising**: Score increased by >10%
- **Stable**: Score changed <10%
- **Falling**: Score decreased by >10%

New topics default to "rising" if score > 0.3, otherwise "stable".

## Usage

### Chat Page Integration

The chat page displays zeitgeist suggestions in the "Try these to get started" section. Topics are automatically refreshed when cache expires (12 hours) or can be manually refreshed via the Curate panel.

### Manager Dashboard

Access via: **Curate > Hot Topics** tab

Dashboard shows:
- Total topics count
- KB coverage percentage (with alert if < 70%)
- Last refresh timestamp
- Active signal sources
- Topic table with scores, trends, and KB status

### API Examples

```typescript
// Get chat suggestions
const response = await fetch('/api/zeitgeist');
const { questions } = await response.json();
// questions: [{ question: "...", source: "rlhf", hasGoodAnswer: true }]

// Get trending with stats
const response = await fetch('/api/zeitgeist/trending');
const { topics, stats } = await response.json();
// stats: { totalTopics: 6, withGoodAnswers: 4, cacheStatus: "fresh" }

// Force refresh
const response = await fetch('/api/zeitgeist/refresh', { method: 'POST' });
const { success, analysis } = await response.json();
// analysis: { topicsAnalyzed: 5, topicsWithAnswers: 3, duration: 1200 }
```

## Testing

E2E tests located at: `tests/e2e/features/zeitgeist.spec.ts`

Run tests:
```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/features/zeitgeist.spec.ts
```

Test coverage:
- 3 API endpoint tests
- 3 UI integration tests
- 1 trend indicator test

## Configuration

### Cache Settings

```typescript
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
```

### Trend Threshold

```typescript
const TREND_THRESHOLD = 0.10; // 10% change triggers trend change
```

### Limits

```typescript
const CHAT_SUGGESTIONS_LIMIT = 6; // Max suggestions on chat page
const MAX_TOPICS = 20; // Max topics stored in cache
```

## Data Flow

```
Signal Sources          Zeitgeist Service        Output
---------------        -----------------        ------
RLHF Curation    -->   |               |   -->  Chat Suggestions
Jira Tickets     -->   | Aggregation   |   -->  Hot Topics Panel
Test Failures    -->   | + Scoring     |   -->  API Responses
                       | + KB Validation|
                       | + Caching     |
                       -----------------
```

## Future Enhancements

- Real-time updates via WebSocket
- Custom topic filtering per user/org
- Historical trend graphs
- Export functionality for analytics
- Integration with notification system

## Related Documentation

- [RLHF Curation Guide](./RLHF-CURATION.md)
- [API Reference](./reference/API-REFERENCE.md)
- [Curate Tab Overview](./UI-CURATE-TAB.md)
