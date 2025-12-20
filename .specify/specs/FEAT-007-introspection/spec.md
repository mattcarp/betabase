# FEAT-007: Introspection & Dogfooding Dashboard

## Problem

The current introspection dropdown shows fake sample data and a disconnected health monitor. We have Langfuse tracing implemented in the chat route but the UI doesn't display real traces. Engineers and product owners have no visibility into:
- Actual LLM call performance and costs
- RAG pipeline effectiveness
- Quality signals from user feedback
- System health beyond basic connectivity

This makes dogfooding and debugging difficult.

## Solution

Transform the introspection dropdown into a comprehensive observability dashboard that surfaces real Langfuse traces, cost tracking, latency breakdowns, and quality signals - all without impacting chat performance.

## Scope

### Phase 1: Langfuse Integration (Core)
- Wire up real Langfuse traces to the dropdown
- Display LLM generations with model, tokens, duration
- Show vector search operations with similarity scores
- Surface RAG orchestration steps
- Display real error traces

### Phase 2: Cost & Performance Insights
- Token cost estimation per request (model-specific pricing)
- Latency waterfall visualization (embedding | vector | LLM)
- Running token budget (daily/weekly/monthly)
- Slow query alerts (> 2s threshold)

### Phase 3: Quality Signals
- RLHF feedback summary (recent + aggregate)
- Similarity score distribution chart
- Citation usage stats
- Conversation depth metrics

### Phase 4: Developer Tools
- Trace export (JSON download)
- Request/response inspector
- Prompt viewer (see actual system prompt)
- Verbose logging toggle

## Out of Scope

- Real-time websocket streaming (polling is sufficient)
- Historical analytics beyond 24 hours (use Langfuse dashboard)
- User-facing analytics (this is internal tooling)
- Changes to the chat critical path

## Acceptance Criteria

### Phase 1
- [ ] Dropdown displays real Langfuse traces (not fake samples)
- [ ] LLM generations show model, tokens, duration, finish reason
- [ ] Vector searches show query, results count, top similarity
- [ ] Errors display with actual error messages
- [ ] Data refreshes on dropdown open (lazy load)
- [ ] 30-second client-side cache to avoid hammering API

### Phase 2
- [ ] Cost per request displayed (calculated from tokens + model)
- [ ] Latency waterfall shows time breakdown visually
- [ ] Token budget shows daily/weekly totals
- [ ] Slow queries (> 2s) highlighted with warning indicator

### Phase 3
- [ ] RLHF feedback widget shows recent thumbs up/down
- [ ] Similarity score histogram or summary stats
- [ ] Citation count per response tracked
- [ ] Session depth (messages per conversation) displayed

### Phase 4
- [ ] Export trace as JSON button works
- [ ] Click trace to see full request/response
- [ ] System prompt viewer shows actual prompt used
- [ ] Toggle for verbose console logging

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Real traces visible | 0% | 100% |
| Cost visibility | None | Per-request |
| Latency breakdown | None | 3-segment waterfall |
| Feedback visibility | Separate page | Inline summary |
| Debug time reduction | Baseline | -50% |

## Technical Approach

### Performance Safeguards
- Langfuse API calls ONLY when dropdown opens (lazy)
- 30-second cache on fetched traces
- Server-side aggregation with limits (max 50 traces)
- No polling unless dropdown is actively open
- All operations async, non-blocking

### Dependencies
- `@langfuse/client` package for trace fetching
- Existing Langfuse credentials (already configured)
- Existing RLHF tables in Supabase

## Files Affected

- `src/components/ui/IntrospectionDropdown.tsx` - Main UI
- `src/app/api/introspection/route.ts` - API endpoint
- `src/lib/langfuse.ts` - Add query client
- `src/lib/metrics.ts` - May be deprecated or merged
- New: `src/lib/introspection/` - Modular introspection services

## References

- Langfuse Query SDK: https://langfuse.com/docs/api-and-data-platform/features/query-via-sdk
- Current Langfuse integration: `src/lib/langfuse.ts`
- Current dropdown: `src/components/ui/IntrospectionDropdown.tsx`
- RLHF tables: `supabase/migrations/20251128_rlhf_comparisons_extended.sql`
