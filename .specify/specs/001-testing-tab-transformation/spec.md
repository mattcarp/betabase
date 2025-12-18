# Feature Specification: Testing Tab Transformation

## Overview

Transform The Betabase Testing tab from a non-functional mockup with placeholder data into a fully operational AI-augmented testing platform using real historical test data, RLHF-driven test generation, and self-healing test capabilities.

**Priority**: P0 (Critical for Demo)  
**Estimated Complexity**: High  
**Target**: December 2025 Demo

---

## Problem Statement

The current Testing tab contains 40+ React components that render fake/mock data. All sub-tabs (Dashboard, Historical Tests, RLHF Tests, Impact Metrics, Live Monitor) display "0 of 0" or hardcoded placeholder values. The real value—thousands of historical tests from the legacy Betabase database—is not connected.

### Current State
- Components fall back to `getMockTestResults()` when database queries fail
- Tables like `historical_tests` and `rlhf_generated_tests` don't exist
- Real test data in `scenario` (~8,449 records) and `test` (~34,631 records) tables is unused
- UI is generic and doesn't showcase AI capabilities

### Desired State
- All components connected to real Supabase data
- Historical tests browsable with confidence scoring
- RLHF loop demonstrable end-to-end
- Self-healing tests with human-in-the-loop approval
- Beautiful, distinctive UI (not "AI slop")

---

## User Stories

### US1: Historical Test Explorer
**As a** QA manager  
**I want to** browse through thousands of historical tests from the legacy Betabase  
**So that** I can see the depth of testing done over the years and identify valuable test assets

**Acceptance Criteria:**
- [ ] Can scroll through paginated list of tests from `scenario` table
- [ ] Tests show: name, category, last run date, pass/fail status
- [ ] Can filter by: category, status, date range, search term
- [ ] Can click on a test to see full details (steps, expected results)
- [ ] Shows total count accurately (e.g., "Showing 1-50 of 8,449 tests")
- [ ] Loading states while fetching, error states if failed

### US2: Test Confidence Scoring
**As a** test architect  
**I want to** see an AI-generated confidence score for each historical test  
**So that** I can prioritize which tests are still relevant and worth maintaining

**Acceptance Criteria:**
- [ ] Each test displays a confidence badge (0-100%)
- [ ] Confidence based on: last run recency, failure history, code coverage overlap
- [ ] Can sort tests by confidence score
- [ ] Low confidence tests (<50%) highlighted for review
- [ ] Clicking confidence score shows explanation (why this score?)
- [ ] Batch analysis available for bulk scoring

### US3: Manual to Automated Conversion
**As a** test automation engineer  
**I want to** convert a manual test case into a Playwright automation script  
**So that** I can leverage existing test documentation without rewriting from scratch

**Acceptance Criteria:**
- [ ] "Convert to Automated" button on each manual test
- [ ] AI analyzes test steps and generates Playwright code
- [ ] Generated code shown in syntax-highlighted editor
- [ ] Can copy code to clipboard or download as file
- [ ] Code includes comments referencing original test case
- [ ] Success rate tracking: how many conversions were usable?

### US4: RLHF Test Generation
**As a** QA lead  
**I want to** see tests that were automatically generated from user feedback  
**So that** I can verify the RLHF loop is producing valuable regression tests

**Acceptance Criteria:**
- [ ] List of RLHF-generated tests with source feedback linked
- [ ] Each test shows: generated date, source feedback ID, status (pending/passing/failing)
- [ ] Can run individual generated tests
- [ ] Can approve/reject generated tests for inclusion in suite
- [ ] Stats: total generated, approval rate, pass rate
- [ ] Link to original user feedback that triggered generation

### US5: Self-Healing Dashboard
**As a** test maintenance engineer  
**I want to** see tests that healed themselves after DOM changes  
**So that** I can review and approve the AI's decisions

**Acceptance Criteria:**
- [ ] Queue of healing attempts awaiting review
- [ ] Each shows: test name, what changed (before/after selectors), confidence tier (1/2/3)
- [ ] Tier 1 (high confidence): auto-approved, shown for info
- [ ] Tier 2 (medium): suggested fix, awaiting approval
- [ ] Tier 3 (low): human must decide
- [ ] Can approve, reject, or manually fix each healing
- [ ] History of past healings with outcomes

### US6: Impact Metrics Dashboard
**As a** engineering manager  
**I want to** see real metrics on testing impact  
**So that** I can justify the investment in AI-augmented testing

**Acceptance Criteria:**
- [ ] Real data, not mocks:
  - Tests/day trend
  - Pass rate over time
  - MTTR (Mean Time To Resolution)
  - Automation coverage percentage
  - RLHF improvement rate
- [ ] Date range selector (7d, 30d, 90d, custom)
- [ ] Export report capability
- [ ] Comparison to previous period

### US7: UI Redesign
**As a** demo presenter  
**I want** the Testing tab to look professional and distinctive  
**So that** it doesn't look like generic AI-generated UI

**Acceptance Criteria:**
- [ ] Consistent with MAC Design System
- [ ] Dark theme with accent colors (not purple gradients)
- [ ] Proper typography (distinctive, not Inter/Roboto)
- [ ] Meaningful animations on state changes
- [ ] Mobile-responsive (demo on laptop or tablet)
- [ ] No "0 of 0" or placeholder text visible

---

## Out of Scope

- Creating new test frameworks (use existing Playwright)
- Training actual ML models (collecting data for future training is in scope)
- Production deployment (demo environment only)
- Authentication flows (bypass auth for demo)

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Supabase access | ✅ Available | Main database |
| Betabase tables (`bb_*`) | ✅ Available | Legacy test data |
| `scenario` table | ✅ ~8,449 records | Historical test cases |
| `test` table | ✅ ~34,631 records | Test execution results |
| RLHF feedback table | ⚠️ May need creation | For preference pairs |
| Gemini API | ✅ Available | For AI analysis |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Historical tests visible | 8,000+ browsable |
| Components using real data | 100% (no mocks in demo path) |
| Demo duration without errors | 10 minutes |
| UI distinctiveness | No "AI slop" feedback |
| RLHF loop demonstrable | End-to-end in < 2 minutes |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Betabase schema mismatch | High | Query tables early, adapt mappings |
| Slow queries on large tables | Medium | Add indexes, pagination |
| AI generation quality | Medium | Pre-generate some demo examples |
| Context window exhaustion | High | Use long-running harness + handoffs |

---

## Review & Acceptance Checklist

- [ ] All user stories have testable acceptance criteria
- [ ] Dependencies identified and available
- [ ] Out of scope clearly defined
- [ ] Success metrics are measurable
- [ ] Risks have mitigations

---

*Specification created: 2025-12-17*  
*Last updated: 2025-12-17*


