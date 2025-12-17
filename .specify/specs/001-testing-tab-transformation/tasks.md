# Tasks: Testing Tab Transformation

**Input**: Design documents from `/specs/001-testing-tab-transformation/`  
**Prerequisites**: plan.md (required), spec.md (required)

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US7)

---

## Phase 1: Database Foundation (Blocking Prerequisites) ✅

**Purpose**: Create database infrastructure before any UI work

⚠️ **CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 [SETUP] Query `bb_case` table to understand schema and available fields ✅
- [x] T002 [SETUP] Query `bb_application`, `bb_round`, `bb_variation` to map relationships ✅
- [x] T003 [SETUP] Create SQL migration file: `supabase/migrations/20251217_testing_tab_tables.sql` ✅
- [x] T004 [P] [SETUP] Create `historical_tests_view` joining bb_case with metadata ✅ (in migration)
- [x] T005 [P] [SETUP] Create `rlhf_generated_tests` table ✅ (in migration)
- [x] T006 [P] [SETUP] Create `self_healing_attempts` table ✅ (already exists!)
- [x] T007 [P] [SETUP] Create `test_analytics_daily` materialized view ✅ (in migration)
- [ ] T008 [SETUP] Run migrations and verify tables exist ⏸️ (needs manual Supabase SQL)
- [x] T009 [SETUP] Create indexes for performance on large tables ✅ (in migration)

**Checkpoint**: Database ready - can query historical tests and analytics

---

## Phase 2: User Story 1 - Historical Test Explorer (Priority: P1) 🎯 MVP ✅

**Goal**: Browse 8,000+ real tests from legacy Betabase  
**Independent Test**: Can paginate through tests, filter, see details

### API Implementation ✅

- [x] T010 [US1] Create `/api/tests/historical/route.ts` - GET paginated list ✅
- [x] T011 [US1] Create `/api/tests/historical/[id]/route.ts` - GET single test details ✅
- [x] T012 [US1] Add filter params: category, status, dateRange, search ✅
- [x] T013 [US1] Add sorting: by date, name, confidence ✅

### Component Updates ✅

- [x] T014 [US1] Re-enable `HistoricalTestExplorer.tsx` ✅ (already enabled, using real API!)
- [x] T015 [US1] Replace mock data with real API call in `loadHistoricalTests()` ✅
- [ ] T016 [US1] Implement virtualized scrolling for 8,000+ items (use react-window)
- [ ] T017 [US1] Add loading skeletons while fetching
- [ ] T018 [US1] Add error state with retry button
- [ ] T019 [US1] Create `HistoricalTestDetail` modal/panel for viewing full test

### Integration

- [ ] T020 [US1] Wire "Historical Tests" tab in ChatPage.tsx to HistoricalTestExplorer
- [ ] T021 [US1] Verify counts display accurately (e.g., "8,449 tests")

**Checkpoint**: Can browse, filter, and view historical tests with real data

---

## Phase 3: User Story 2 - Confidence Scoring (Priority: P1)

**Goal**: AI-generated relevance score for each test  
**Independent Test**: Tests show confidence badges, can sort by confidence

### API Implementation

- [ ] T022 [US2] Create `/api/tests/historical/[id]/analyze/route.ts` - POST triggers AI analysis
- [ ] T023 [US2] Implement Gemini prompt for confidence scoring
- [ ] T024 [US2] Cache confidence scores in database (add column to view or separate table)
- [ ] T025 [US2] Create batch analysis endpoint for scoring multiple tests

### Component Updates

- [ ] T026 [US2] Add `ConfidenceBadge` component with color coding
- [ ] T027 [US2] Show confidence on each test row in HistoricalTestExplorer
- [ ] T028 [US2] Add "Analyze" button that triggers scoring
- [ ] T029 [US2] Show reasoning tooltip when hovering confidence badge
- [ ] T030 [US2] Add sort option: "Sort by confidence"
- [ ] T031 [US2] Highlight low-confidence tests (<50%) with warning styling

**Checkpoint**: Tests have AI-generated confidence scores

---

## Phase 4: User Story 3 - Manual to Automated Conversion (Priority: P2)

**Goal**: Convert manual test to Playwright script  
**Independent Test**: Can generate, view, and copy Playwright code

### API Implementation

- [ ] T032 [US3] Create `/api/tests/convert-to-playwright/route.ts` - POST generates code
- [ ] T033 [US3] Implement Gemini prompt for Playwright code generation
- [ ] T034 [US3] Return structured response: { code, language, testId, warnings }
- [ ] T035 [US3] Track conversion attempts in database for analytics

### Component Updates

- [ ] T036 [US3] Add "Convert to Automated" button in test detail view
- [ ] T037 [US3] Create `PlaywrightCodeViewer` component with Monaco editor
- [ ] T038 [US3] Add copy-to-clipboard functionality
- [ ] T039 [US3] Add download as `.spec.ts` file button
- [ ] T040 [US3] Show conversion status and any warnings

**Checkpoint**: Can convert manual tests to Playwright code

---

## Phase 5: User Story 4 - RLHF Test Generation (Priority: P2)

**Goal**: View tests generated from user feedback  
**Independent Test**: Can see, approve/reject, and run generated tests

### API Implementation

- [ ] T041 [US4] Create `/api/tests/rlhf/route.ts` - GET list of generated tests
- [ ] T042 [US4] Create `/api/tests/rlhf/generate/route.ts` - POST generates from feedback
- [ ] T043 [US4] Create `/api/tests/rlhf/[id]/approve/route.ts` - PUT approve/reject
- [ ] T044 [US4] Create `/api/tests/rlhf/[id]/run/route.ts` - POST execute test
- [ ] T045 [US4] Implement Gemini prompt for test generation from feedback

### Component Updates

- [ ] T046 [US4] Update `RLHFTestSuite.tsx` to use real API instead of fallback
- [ ] T047 [US4] Show source feedback link for each generated test
- [ ] T048 [US4] Add approve/reject buttons with confirmation
- [ ] T049 [US4] Show execution status (pending, running, passed, failed)
- [ ] T050 [US4] Add stats cards: total generated, approval rate, pass rate

**Checkpoint**: RLHF test generation loop is demonstrable

---

## Phase 6: User Story 5 - Self-Healing Dashboard (Priority: P2)

**Goal**: Review and approve AI-suggested test fixes  
**Independent Test**: Can see queue, approve/reject healings

### API Implementation

- [ ] T051 [US5] Create `/api/self-healing/queue/route.ts` - GET pending healings
- [ ] T052 [US5] Update existing `/api/self-healing/route.ts` to use real table
- [ ] T053 [US5] Create `/api/self-healing/[id]/resolve/route.ts` - PUT approve/reject
- [ ] T054 [US5] Create `/api/self-healing/history/route.ts` - GET past healings

### Component Updates

- [ ] T055 [US5] Update `SelfHealingTestViewer.tsx` to use real data
- [ ] T056 [US5] Wire up `SelfHealingPriorityQueue` to API
- [ ] T057 [US5] Connect approve/reject buttons to API
- [ ] T058 [US5] Show before/after selector comparison
- [ ] T059 [US5] Display tier badges (1/2/3) with explanations
- [ ] T060 [US5] Add history tab showing past healing decisions

**Checkpoint**: Self-healing review workflow is functional

---

## Phase 7: User Story 6 - Impact Metrics (Priority: P3)

**Goal**: Real analytics on testing impact  
**Independent Test**: Dashboard shows real metrics, not zeros

### API Implementation

- [ ] T061 [US6] Create `/api/tests/analytics/route.ts` - GET dashboard metrics
- [ ] T062 [US6] Create `/api/tests/analytics/trends/route.ts` - GET time-series
- [ ] T063 [US6] Query test_analytics_daily view for metrics
- [ ] T064 [US6] Calculate MTTR, pass rate, automation coverage

### Component Updates

- [ ] T065 [US6] Update `TestAnalytics.tsx` to use real API
- [ ] T066 [US6] Update `RLHFImpactDashboard.tsx` to use real data
- [ ] T067 [US6] Update `TestHomeDashboard.tsx` stats cards
- [ ] T068 [US6] Add date range selector (7d, 30d, 90d)
- [ ] T069 [US6] Add export report button (CSV/PDF)
- [ ] T070 [US6] Show comparison to previous period

**Checkpoint**: Analytics dashboard shows real metrics

---

## Phase 8: User Story 7 - UI Redesign (Priority: P3)

**Goal**: Professional, distinctive UI  
**Independent Test**: Demo-ready appearance, no "0 of 0" visible

### Typography & Colors

- [ ] T071 [P] [US7] Add JetBrains Mono font for headings/code
- [ ] T072 [P] [US7] Audit and update color usage per MAC Design System
- [ ] T073 [P] [US7] Remove any purple gradients or generic styling

### Component Polish

- [ ] T074 [P] [US7] Update dashboard stat cards with gradient borders
- [ ] T075 [P] [US7] Add hover animations to interactive elements
- [ ] T076 [P] [US7] Improve loading states (skeleton screens, not spinners)
- [ ] T077 [P] [US7] Add empty state illustrations (not just "No data")
- [ ] T078 [P] [US7] Ensure no "0 of 0" or placeholder text in demo path

### Responsiveness

- [ ] T079 [US7] Test on laptop resolution (1440x900)
- [ ] T080 [US7] Test on external monitor (1920x1080)
- [ ] T081 [US7] Fix any overflow or layout issues

**Checkpoint**: UI is demo-ready

---

## Phase 9: Integration & Polish

**Purpose**: Final integration and demo preparation

- [ ] T082 Verify all tabs work end-to-end
- [ ] T083 Run through demo script without errors
- [ ] T084 Fix any console errors or warnings
- [ ] T085 Performance audit: ensure no slow queries
- [ ] T086 Create demo data seed script if needed
- [ ] T087 Update `claude-progress.txt` with completion notes
- [ ] T088 Store learnings in ByteRover
- [ ] T089 Commit and push to branch

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Database) ─────────────────────────────────────────┐
                                                            │
Phase 2 (US1 Historical) ────────────┐                      │
                                     │                      │
Phase 3 (US2 Confidence) ────────────┼──> Phase 7 (US6)     │
                                     │                      │
Phase 4 (US3 Conversion) ────────────┘                      │
                                                            │
Phase 5 (US4 RLHF) ──────────────────────────────────────> Phase 9
                                                            │
Phase 6 (US5 Self-Healing) ─────────────────────────────────┤
                                                            │
Phase 8 (US7 UI) ───────────────────────────────────────────┘
```

### Parallel Opportunities

- T004, T005, T006, T007 can run in parallel (different tables)
- T071, T072, T073 can run in parallel (different files)
- T074-T078 can run in parallel (different components)
- US2-US4 can run in parallel after US1 (different features)

---

## Task Count Summary

| Phase | Tasks | Parallel | Est. Time |
|-------|-------|----------|-----------|
| Database Foundation | 9 | 4 | 30 min |
| US1: Historical | 12 | 0 | 60 min |
| US2: Confidence | 10 | 0 | 45 min |
| US3: Conversion | 9 | 0 | 45 min |
| US4: RLHF | 10 | 0 | 60 min |
| US5: Self-Healing | 10 | 0 | 45 min |
| US6: Analytics | 10 | 0 | 45 min |
| US7: UI | 11 | 8 | 60 min |
| Integration | 8 | 0 | 30 min |
| **TOTAL** | **89** | **12** | **~7 hours** |

---

## Long-Running Execution Strategy

This feature is too large for a single context window. Use the long-running harness:

1. **Handoff after each phase**: Create `HANDOFF-phase-N.md` with:
   - Completed tasks
   - Next tasks
   - Any blockers found

2. **Session checkpoints**: Update `claude-progress.txt` after:
   - Database foundation complete
   - Each user story complete
   - UI redesign complete

3. **ByteRover storage**: Store patterns learned:
   - Successful Supabase query patterns
   - Working Gemini prompts
   - Component wiring patterns

4. **Branch discipline**: All work stays on `001-testing-tab-transformation`

---

*Tasks created: 2025-12-17*

