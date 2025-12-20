# FEAT-010: Zeitgeist - Hot Topics Intelligence Service

## Problem

Managers have no visibility into what users are asking about or what issues are trending. The chat landing page shows 6 hardcoded suggested queries that never change, missing an opportunity to surface timely, relevant questions that we know we can answer well.

Meanwhile, valuable signals are scattered across:
- RLHF feedback (what users are asking)
- Jira tickets (what support issues are emerging)
- Test failures (what's breaking)
- Chat history (repeated queries)

## Solution

Build a Zeitgeist service that:
1. Aggregates activity signals from multiple data sources
2. Identifies trending topics and questions
3. Validates we have good KB answers for each topic
4. Surfaces the top 6 as dynamic suggested queries on the chat landing page
5. Provides a manager dashboard showing all trending topics with scores

## Scope

- New service: `src/lib/services/zeitgeistService.ts`
- New API routes: `/api/zeitgeist/*`
- Integration with existing suggestions flow
- Optional: Curate tab sub-panel for manager view

## Out of Scope

- Real-time streaming updates (batch refresh is fine)
- Predictive trending (just reactive to recent activity)
- External data sources (only internal DB)

## Acceptance Criteria

- [ ] `/api/zeitgeist` returns 6 dynamic suggested queries
- [ ] Suggestions are based on actual user activity (last 48h)
- [ ] Each suggestion has been validated against KB (similarity > 0.70)
- [ ] Chat landing page uses dynamic suggestions instead of hardcoded
- [ ] Results are cached in `app_cache` with 6-24h TTL
- [ ] Manager can see full trending topics list with scores
- [ ] Trends show rising/stable/falling indicators

## Success Metrics

| Metric | Target |
|--------|--------|
| Suggestion relevance | Based on real queries, not guesses |
| KB coverage | 100% of suggestions have good answers |
| Refresh frequency | Every 6-24 hours |
| Manager visibility | Full topic list with scores |

## Data Sources

| Source | Signal | Weight |
|--------|--------|--------|
| `rlhf_feedback` | Query frequency, sentiment | 0.4 |
| `jira_tickets` | New issues, keywords | 0.3 |
| `test_results` | Failure spikes | 0.2 |
| `chat_history` | Repeated queries | 0.1 |

## References

- B005 in features.json (promoted to full feature)
- Existing suggestions endpoint: `/api/aoma/suggestions`
- Cache table: `app_cache`
