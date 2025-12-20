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

✅ **COMPLETE**: All database infrastructure is live and working

- [x] T001 [SETUP] Query `bb_case` table to understand schema and available fields ✅
- [x] T002 [SETUP] Query `bb_application`, `bb_round`, `bb_variation` to map relationships ✅
- [x] T003 [SETUP] Create SQL migration file: `supabase/migrations/20251217_testing_tab_tables.sql` ✅
- [x] T004 [P] [SETUP] Create `historical_tests_view` joining bb_case with metadata ✅
- [x] T005 [P] [SETUP] Create `rlhf_generated_tests` table ✅
- [x] T006 [P] [SETUP] Create `self_healing_attempts` table ✅
- [x] T007 [P] [SETUP] Create `test_analytics_daily` materialized view ✅
- [x] T008 [SETUP] Run migrations and verify tables exist ✅ (verified via API - 8,719 tests!)
- [x] T009 [SETUP] Create indexes for performance on large tables ✅

**Checkpoint**: Database ready - 8,719 historical tests, analytics, RLHF, self-healing all working

---

## Phase 2: User Story 1 - Historical Test Explorer (Priority: P1) ✅ COMPLETE

**Goal**: Browse 8,000+ real tests from legacy Betabase
**Status**: ✅ Fully functional with 8,719 tests

### API Implementation ✅

- [x] T010 [US1] Create `/api/tests/historical/route.ts` - GET paginated list ✅
- [x] T011 [US1] Create `/api/tests/historical/[id]/route.ts` - GET single test details ✅
- [x] T012 [US1] Add filter params: category, status, dateRange, search ✅
- [x] T013 [US1] Add sorting: by date, name, confidence ✅

### Component Updates ✅

- [x] T014 [US1] Re-enable `HistoricalTestExplorer.tsx` ✅
- [x] T015 [US1] Replace mock data with real API call in `loadHistoricalTests()` ✅
- [x] T016 [US1] Implement infinite scrolling for 8,000+ items ✅ (uses scroll-based pagination)
- [x] T017 [US1] Add loading states while fetching ✅ ("Warming cache...", inline loading)
- [x] T018 [US1] Add error state with toast notifications ✅
- [x] T019 [US1] Create HistoricalTestDetail panel for viewing full test ✅ (right panel)

### Integration ✅

- [x] T020 [US1] Wire "Historical Tests" tab in ChatPage.tsx to HistoricalTestExplorer ✅
- [x] T021 [US1] Verify counts display accurately ✅ (shows "8,719" tests)

**Checkpoint**: ✅ Can browse, filter, and view historical tests with real data

---

## Phase 3: User Story 2 - Confidence Scoring (Priority: P1) ✅ COMPLETE

**Goal**: AI-generated relevance score for each test
**Status**: ✅ Fully functional with Gemini-powered analysis

### API Implementation ✅

- [x] T022 [US2] Create `/api/tests/confidence-score/route.ts` - POST triggers AI analysis ✅
- [x] T023 [US2] Implement Gemini prompt for confidence scoring ✅ (using AI SDK generateObject)
- [x] T024 [US2] Base confidence computed in database view ✅ (historical_tests_view)
- [x] T025 [US2] Batch analysis via on-demand scoring per test ✅

### Component Updates ✅

- [x] T026 [US2] Add `ConfidenceBadge` component with color coding ✅
- [x] T027 [US2] Show confidence on each test row in HistoricalTestExplorer ✅ (base_confidence)
- [x] T028 [US2] Add "Run AI Analysis" button that triggers scoring ✅
- [x] T029 [US2] Show reasoning and recommendations in detail panel ✅
- [x] T030 [US2] Add sort option: "Sort by confidence" ✅ (sortable columns)
- [x] T031 [US2] Color-coded confidence badges (High/Medium/Low) ✅

**Checkpoint**: ✅ Tests have AI-generated confidence scores with recommendations

---

## Phase 4: User Story 3 - Manual to Automated Conversion (Priority: P2) ✅ COMPLETE

**Goal**: Convert manual test to Playwright script
**Status**: ✅ Fully functional with persistence

### API Implementation ✅

- [x] T032 [US3] Create `/api/tests/generate-playwright/route.ts` - POST generates code ✅
- [x] T033 [US3] Implement Gemini prompt for Playwright code generation ✅
- [x] T034 [US3] Return structured response with testCode, persistedId, model ✅
- [x] T035 [US3] Persist generated tests to rlhf_generated_tests table ✅

### Component Updates ✅

- [x] T036 [US3] Add "Generate Automated Test" button in test detail view ✅
- [x] T037 [US3] Display generated code in syntax-highlighted pre block ✅
- [x] T038 [US3] Add copy-to-clipboard functionality ✅
- [x] T039 [US3] Re-generate button available ✅
- [x] T040 [US3] Toast notification with persisted ID ✅

**Checkpoint**: ✅ Can convert manual tests to Playwright code and persist them

---

## Phase 5: User Story 4 - RLHF Test Generation (Priority: P2) ✅ COMPLETE

**Goal**: View tests generated from user feedback
**Status**: ✅ API working, component wired

### API Implementation ✅

- [x] T041 [US4] Create `/api/tests/rlhf/route.ts` - GET list of generated tests ✅
- [x] T042 [US4] Create `/api/tests/rlhf/generate/route.ts` - POST generates from feedback ✅
- [x] T043 [US4] Create `/api/tests/rlhf/[id]/` - Individual test operations ✅
- [x] T044 [US4] Test execution tracking in database ✅
- [x] T045 [US4] Gemini-powered test generation ✅

### Component Updates ✅

- [x] T046 [US4] `RLHFTestSuite.tsx` wired in ChatPage.tsx ✅
- [x] T047 [US4] Source query and correction shown for each test ✅
- [x] T048 [US4] Status field (pending/approved/rejected) ✅
- [x] T049 [US4] Execution tracking (run_count, pass_count, fail_count) ✅
- [x] T050 [US4] Real data from rlhf_generated_tests table ✅

**Checkpoint**: ✅ RLHF test generation loop is demonstrable

---

## Phase 6: User Story 5 - Self-Healing Dashboard (Priority: P2) ✅ COMPLETE

**Goal**: Review and approve AI-suggested test fixes
**Status**: ✅ API and components working with seeded demo data

### API Implementation ✅

- [x] T051 [US5] `/api/self-healing/route.ts` - GET queue of healing attempts ✅
- [x] T052 [US5] Uses self_healing_attempts table with real data ✅
- [x] T053 [US5] `/api/self-healing/[id]/` - Individual healing operations ✅
- [x] T054 [US5] `/api/self-healing/analytics/` and `/api/self-healing/demo/` ✅

### Component Updates ✅

- [x] T055 [US5] `SelfHealingTestViewer.tsx` uses real API ✅
- [x] T056 [US5] Priority queue with tier-based sorting ✅
- [x] T057 [US5] Status tracking (pending/approved/rejected/applied) ✅
- [x] T058 [US5] Before/after selector comparison ✅
- [x] T059 [US5] Tier badges (1/2/3) with confidence scores ✅
- [x] T060 [US5] Healing rationale and strategy displayed ✅

**Checkpoint**: ✅ Self-healing review workflow is functional

---

## Phase 7: User Story 6 - Impact Metrics (Priority: P3) ✅ COMPLETE

**Goal**: Real analytics on testing impact
**Status**: ✅ Real metrics from database (8,719 tests, 80.4% pass rate)

### API Implementation ✅

- [x] T061 [US6] Create `/api/tests/analytics/route.ts` - GET dashboard metrics ✅
- [x] T062 [US6] Returns summary, apps breakdown, execution stats ✅
- [x] T063 [US6] Queries bb_case and historical_tests_view for metrics ✅
- [x] T064 [US6] Pass rate, execution counts, app-level breakdown ✅

### Component Updates ✅

- [x] T065 [US6] TestAnalytics.tsx wired to API ✅
- [x] T066 [US6] RLHFImpactDashboard.tsx uses real data ✅
- [x] T067 [US6] TestHomeDashboard.tsx stats cards show real counts ✅
- [x] T068 [US6] Summary shows: 8,719 tests, 12,177 executions, 80.4% pass rate ✅
- [ ] T069 [US6] Export report button (CSV/PDF) - deferred
- [ ] T070 [US6] Comparison to previous period - deferred

**Checkpoint**: ✅ Analytics dashboard shows real metrics

---

## Phase 8: User Story 7 - UI Redesign (Priority: P3) ✅ COMPLETE

**Goal**: Professional, distinctive UI
**Status**: ✅ MAC Design System applied, demo-ready

### Typography & Colors ✅

- [x] T071 [P] [US7] MAC Design System typography with proper font weights ✅
- [x] T072 [P] [US7] Colors follow --mac-* CSS variables ✅
- [x] T073 [P] [US7] Glassmorphism and zinc color palette ✅

### Component Polish ✅

- [x] T074 [P] [US7] Dashboard stat cards with proper styling ✅
- [x] T075 [P] [US7] Hover animations on interactive elements ✅
- [x] T076 [P] [US7] Loading states ("Warming cache...", inline spinners) ✅
- [x] T077 [P] [US7] Empty states with icons and instructions ✅
- [x] T078 [P] [US7] No placeholder text - shows real counts ✅

### Responsiveness ✅

- [x] T079 [US7] Tested and refined per claude-progress.txt ✅
- [x] T080 [US7] Works on external monitor ✅
- [x] T081 [US7] Layout issues fixed (column widths, floating effects) ✅

**Checkpoint**: ✅ UI is demo-ready

---

## Phase 9: Integration & Polish ⏳ IN PROGRESS

**Purpose**: Final integration and demo preparation

- [x] T082 All tabs work end-to-end (verified via API testing) ✅
- [ ] T083 Run through demo script without errors
- [ ] T084 Fix any console errors or warnings
- [x] T085 Performance: APIs return quickly, pagination works ✅
- [x] T086 Demo data seeded in self_healing_attempts ✅
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

| Phase | Tasks | Status | Completion |
|-------|-------|--------|------------|
| Database Foundation | 9 | ✅ COMPLETE | 9/9 (100%) |
| US1: Historical | 12 | ✅ COMPLETE | 12/12 (100%) |
| US2: Confidence | 10 | ✅ COMPLETE | 10/10 (100%) |
| US3: Conversion | 9 | ✅ COMPLETE | 9/9 (100%) |
| US4: RLHF | 10 | ✅ COMPLETE | 10/10 (100%) |
| US5: Self-Healing | 10 | ✅ COMPLETE | 10/10 (100%) |
| US6: Analytics | 10 | ✅ MOSTLY | 8/10 (80%) |
| US7: UI | 11 | ✅ COMPLETE | 11/11 (100%) |
| Integration | 8 | ⏳ IN PROGRESS | 3/8 (38%) |
| **TOTAL** | **89** | **✅ 92%** | **82/89** |

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

