# FEAT-007: Task Breakdown

## Phase 1: Langfuse Integration

### P1-001: Install Langfuse Client Package
- **Status**: done
- **Estimate**: 15min
- **Description**: Add `@langfuse/client` to dependencies, verify no conflicts with existing `langfuse` package
- **Acceptance**: Package installs, types resolve, no build errors
- **Notes**: Installed @langfuse/client v4.5.1 successfully, no conflicts with existing langfuse v3.38.6

### P1-002: Create Langfuse Query Service
- **Status**: done
- **Estimate**: 1hr
- **Description**: Create `src/lib/introspection/langfuse-query.ts` with methods to fetch traces
- **Acceptance**:
  - `getRecentTraces(limit)` returns real traces
  - `getTrace(id)` returns single trace with observations
  - 30-second in-memory cache implemented
  - Graceful fallback when Langfuse unavailable

### P1-003: Refactor Introspection API Endpoint
- **Status**: done
- **Estimate**: 1hr
- **Description**: Update `/api/introspection/route.ts` to use Langfuse query service
- **Acceptance**:
  - Returns real Langfuse traces instead of samples
  - Response shape compatible with existing UI
  - Error handling for Langfuse failures
  - Health status still works
- **Notes**: Integrated Langfuse query service with fallback to in-memory metrics. Added hasLangfuse to status response. Transform Langfuse traces to match UI format with model, tokens, duration, and similarity scores.

### P1-004: Update Dropdown to Display Real Traces
- **Status**: done
- **Estimate**: 2hr
- **Description**: Refactor `IntrospectionDropdown.tsx` to render real Langfuse data
- **Acceptance**:
  - Traces display with model, tokens, duration
  - Vector search spans show similarity scores
  - Error traces highlighted appropriately
  - Loading states during fetch
- **Notes**: Enhanced trace rendering to show model name, total tokens for LLM traces, and similarity scores for retriever traces. Added Langfuse status indicator to health dashboard.

### P1-005: Enhance Trace Detail Modal
- **Status**: done
- **Estimate**: 1.5hr
- **Description**: Improve trace detail dialog with real inputs/outputs
- **Acceptance**:
  - Inputs section shows actual query/messages
  - Outputs section shows actual response
  - Metadata displays all available fields
  - Nested observations (spans) visible
- **Notes**: Enhanced metadata section to show model, prompt/completion tokens for LLM traces, and similarity scores for retriever traces. Added observation count display.

### P1-006: Write Playwright Tests for Phase 1
- **Status**: done
- **Estimate**: 1hr
- **Description**: E2E tests for introspection dropdown with real data
- **Acceptance**:
  - Test opens dropdown, verifies non-empty trace list
  - Test clicks trace, verifies detail modal opens
  - Test verifies loading states work
- **Notes**: Created comprehensive Playwright test suite in tests/e2e/features/introspection-dropdown.spec.ts. Tests include API endpoint validation, dropdown interaction, trace detail modal, health status display, and refresh functionality. All tests skip gracefully if not authenticated.

### P1-007: Bug Fix - Langfuse API Parameter
- **Status**: done
- **Estimate**: 15min
- **Description**: Fixed invalid `orderBy: "timestamp"` parameter causing 400 errors from Langfuse API
- **Acceptance**:
  - API call succeeds without orderBy parameter
  - Real Langfuse traces returned (not fallback in-memory)
- **Notes**: Discovered during visual testing. Langfuse v4 API doesn't support orderBy on trace.list(). Removed parameter, traces now load correctly.

---

## Phase 2: Cost & Performance

### P2-001: Create Cost Calculator Module
- **Status**: pending
- **Estimate**: 1hr
- **Description**: Create `src/lib/introspection/cost-calculator.ts`
- **Acceptance**:
  - Pricing table for Claude, GPT-4, GPT-3.5, Gemini
  - `calculateCost(model, promptTokens, completionTokens)` returns USD
  - Updates easily when pricing changes

### P2-002: Add Cost Display to Traces
- **Status**: pending
- **Estimate**: 45min
- **Description**: Show estimated cost per trace in dropdown
- **Acceptance**:
  - Cost displays as "$0.0023" format
  - Calculation based on trace token usage
  - Tooltip explains calculation

### P2-003: Create Latency Waterfall Component
- **Status**: pending
- **Estimate**: 2hr
- **Description**: Visual component showing latency breakdown
- **Acceptance**:
  - Horizontal bar chart with segments
  - Color-coded: embedding (blue), vector (orange), LLM (green)
  - Displays in trace detail modal
  - Responsive sizing

### P2-004: Implement Token Budget Tracking
- **Status**: pending
- **Estimate**: 2hr
- **Description**: Aggregate and display token usage over time
- **Acceptance**:
  - Daily/weekly totals calculated from Langfuse
  - Displayed in dropdown header
  - Optional: persist aggregates for faster loading

### P2-005: Add Slow Query Highlighting
- **Status**: pending
- **Estimate**: 45min
- **Description**: Visual indicator for slow traces
- **Acceptance**:
  - Traces > 2s show warning icon
  - Yellow/amber highlight in list
  - Filter option to show only slow queries

---

## Phase 3: Quality Signals

### P3-001: Integrate RLHF Feedback Summary
- **Status**: pending
- **Estimate**: 1.5hr
- **Description**: Fetch and display recent feedback from RLHF tables
- **Acceptance**:
  - Shows thumbs up/down counts (last 24h)
  - Aggregate score or percentage
  - Link to curator workspace

### P3-002: Add Similarity Score Statistics
- **Status**: pending
- **Estimate**: 1hr
- **Description**: Extract and display similarity score stats
- **Acceptance**:
  - Shows avg/min/max similarity from recent searches
  - Flags low-similarity responses
  - Optional: mini histogram

### P3-003: Track Citation Usage
- **Status**: pending
- **Estimate**: 1hr
- **Description**: Count and display citation metrics
- **Acceptance**:
  - Citations per response counted
  - Average citation rate displayed
  - Derived from trace metadata

### P3-004: Add Conversation Depth Metrics
- **Status**: pending
- **Estimate**: 1hr
- **Description**: Track session/conversation statistics
- **Acceptance**:
  - Average messages per session
  - Session count (last 24h)
  - Derived from Langfuse session data

---

## Phase 4: Developer Tools

### P4-001: Add Trace Export Button
- **Status**: pending
- **Estimate**: 45min
- **Description**: JSON download for individual traces
- **Acceptance**:
  - Download button in trace detail modal
  - Includes full trace data with observations
  - Sensible filename format

### P4-002: Create Request/Response Inspector
- **Status**: pending
- **Estimate**: 1.5hr
- **Description**: Expandable raw data viewer
- **Acceptance**:
  - Collapsible sections for request/response
  - Syntax-highlighted JSON
  - Copy to clipboard functionality

### P4-003: Add Prompt Viewer
- **Status**: pending
- **Estimate**: 1hr
- **Description**: Display system prompt used in generation
- **Acceptance**:
  - Shows full system prompt from trace
  - Collapsible/expandable
  - Highlights dynamic sections if identifiable

### P4-004: Implement Verbose Logging Toggle
- **Status**: pending
- **Estimate**: 1hr
- **Description**: Developer setting for detailed logging
- **Acceptance**:
  - Toggle in dropdown settings area
  - Persisted in localStorage
  - When enabled, adds console.log throughout introspection
  - Visual indicator when active

### P4-005: Final Polish and Documentation
- **Status**: pending
- **Estimate**: 2hr
- **Description**: Clean up, optimize, document
- **Acceptance**:
  - Remove any dead code from old implementation
  - Performance audit (no regressions)
  - Update CLAUDE.md with introspection docs
  - Team walkthrough/demo

---

## Summary

| Phase | Tasks | Est. Total |
|-------|-------|------------|
| Phase 1 | 6 | ~6.5hr |
| Phase 2 | 5 | ~6.5hr |
| Phase 3 | 4 | ~4.5hr |
| Phase 4 | 5 | ~6.25hr |
| **Total** | **20** | **~24hr** |
