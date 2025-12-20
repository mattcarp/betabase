# FEAT-007: Implementation Plan

## Phase 1: Langfuse Integration (Core)

### 1.1 Add Langfuse Client Package
- Install `@langfuse/client` for trace querying
- Verify compatibility with existing `langfuse` package
- Test connection with existing credentials

### 1.2 Create Introspection Service Layer
- New `src/lib/introspection/langfuse-client.ts`
- Singleton pattern matching existing langfuse.ts
- Methods: `getRecentTraces()`, `getTrace(id)`, `getTraceObservations(id)`
- Built-in 30-second caching

### 1.3 Update API Endpoint
- Refactor `/api/introspection/route.ts`
- Replace fake sample data with real Langfuse fetch
- Add error handling for Langfuse unavailability
- Maintain backward compatibility with existing response shape

### 1.4 Update Dropdown UI
- Remove sample data generation
- Display real trace data with proper formatting
- Add loading states for async fetch
- Improve trace detail modal with real inputs/outputs

## Phase 2: Cost & Performance Insights

### 2.1 Token Cost Calculator
- New `src/lib/introspection/cost-calculator.ts`
- Model pricing lookup table (Claude, GPT-4, Gemini)
- Calculate cost from trace usage data
- Format as currency display

### 2.2 Latency Waterfall Component
- New `src/components/ui/LatencyWaterfall.tsx`
- Visual bar chart showing time segments
- Segments: Embedding | Vector Search | LLM | Other
- Derive from Langfuse span durations

### 2.3 Token Budget Tracking
- Aggregate token usage from Langfuse
- Daily/weekly/monthly buckets
- Store aggregates in Supabase or calculate on-demand
- Display in dropdown header area

### 2.4 Slow Query Highlighting
- Flag traces with duration > 2000ms
- Warning icon + yellow highlight in list
- Quick filter to show only slow queries

## Phase 3: Quality Signals

### 3.1 RLHF Feedback Integration
- Query recent feedback from Supabase RLHF tables
- Aggregate thumbs up/down counts
- Display inline summary in dropdown
- Link to full curator workspace

### 3.2 Similarity Score Stats
- Extract similarity scores from vector search spans
- Calculate min/max/avg/median
- Simple histogram or summary display
- Flag low-similarity responses

### 3.3 Citation Tracking
- Count citations per response (from trace metadata)
- Track citation rate over time
- Display in quality summary section

### 3.4 Conversation Metrics
- Messages per session average
- Session duration stats
- Derive from Langfuse session data

## Phase 4: Developer Tools

### 4.1 Trace Export
- JSON download button on trace detail
- Include full inputs/outputs/metadata
- Filename: `trace_{id}_{timestamp}.json`

### 4.2 Request/Response Inspector
- Expandable sections for raw request/response
- Syntax-highlighted JSON display
- Copy to clipboard buttons

### 4.3 Prompt Viewer
- Extract system prompt from generation span
- Collapsible display in trace detail
- Highlight dynamic sections (skills, context)

### 4.4 Verbose Logging Toggle
- localStorage-persisted setting
- When enabled, adds detailed console.log throughout
- Visual indicator when active

## Testing Strategy

### Unit Tests
- Cost calculator accuracy
- Cache behavior
- Data transformation functions

### Integration Tests
- Langfuse API connectivity
- RLHF data fetching
- Full dropdown render with real data

### E2E Tests (Playwright)
- Open dropdown, verify real traces appear
- Click trace, verify detail modal
- Export trace, verify JSON download
- Toggle verbose logging

## Rollout Plan

1. **Phase 1**: Ship behind feature flag, internal testing
2. **Phase 2**: Enable for all internal users, gather feedback
3. **Phase 3**: Iterate based on dogfooding insights
4. **Phase 4**: Full release, document for team

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Langfuse API rate limits | 30s cache, lazy loading |
| Slow Langfuse queries | Timeout + fallback to cached |
| Missing trace data | Graceful degradation, show what's available |
| Cost calculation drift | Regular pricing table updates |
