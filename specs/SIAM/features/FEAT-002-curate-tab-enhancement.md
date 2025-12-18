# FEAT-002: Curate Tab Enhancement - Demo-Ready Intelligence Platform

**Feature ID**: FEAT-002  
**Created**: 2025-12-18  
**Author**: Claudette (Long-Running Agent)  
**Type**: Enhancement (Existing Feature)  
**Priority**: High (Demo Critical)  
**Estimated Duration**: 3-4 hours across 1-2 sessions  
**Status**: 📋 Spec Complete - Ready for Implementation

---

## Table of Contents
1. [Vision](#vision)
2. [Problem Statement](#problem-statement)
3. [User Stories](#user-stories)
4. [Requirements](#requirements)
5. [Technical Design](#technical-design)
6. [Implementation Plan](#implementation-plan)
7. [Testing Strategy](#testing-strategy)
8. [Success Metrics](#success-metrics)
9. [Dependencies & Risks](#dependencies--risks)
10. [Knowledge Store](#knowledge-store)

---

## Vision

Transform the Curate tab from a functional-but-sparse knowledge management interface into a **visually rich, demo-ready intelligence platform** that clearly demonstrates:
1. **Deduplication Intelligence** - Show HOW and WHY duplicates are detected
2. **RLHF Learning Loop** - Visualize AI improvement from human feedback
3. **Multi-Tenant Security** - Demonstrate data isolation
4. **Professional UI** - MAC Design System compliance at 9.8/10+

### What Makes This Feature Demo-Worthy?

- **Before**: Empty metrics (zeros), unexplained deduplication, missing visualizations
- **After**: Rich analytics, visual deduplication explainer, learning curves, professional polish

---

## Problem Statement

### Current State (As of 2025-12-18)

The Curate tab is **functional** but suffers from critical demo-readiness issues:

#### 1. Visual Sparseness
- Feedback Impact Card shows **all zeros**: 0 Corrections, 0 Tests Created, 0 Training Batches
- Contradictory messaging: "+60% this month" but "Improved from 83% to 83%"
- Large empty spaces in UI
- "Recent Corrections" section empty

#### 2. Hidden Intelligence
- Deduplication logic is sophisticated (4-layer detection) but **invisible to users**
- Can't explain during demo:
  - WHY was something marked duplicate? (Content hash? Semantic? URL?)
  - WHAT was kept vs removed?
  - HOW MUCH storage was saved?
- Multi-tenant isolation not visible (major security/privacy feature)

#### 3. Incomplete RLHF Integration
- ✅ Backend 100% complete (services, DB, permissions)
- ✅ RLHF Feedback Tab 100% complete
- ❌ Agent Insights Tab: 0% (spec exists, not implemented)
- ❌ Reinforcement Dashboard Tab: 0% (spec exists, not implemented)  
- ⚠️ Model Registry, Training Datasets, Fine-Tuning Jobs panels exist but not wired

#### 4. Demo Narrative Gap
- Can't show "AI learning from corrections" without Reinforcement Dashboard
- Can't explain "human-in-the-loop" workflow without Agent Insights
- Can't demonstrate ROI without deduplication metrics

### Impact on Demo

**Without fixes**:
- Looks unfinished (zeros everywhere)
- Can't explain key differentiators (deduplication, RLHF)
- Undermines credibility with senior technical colleagues

**With fixes**:
- Professional, polished interface
- Clear demonstration of AI+human symbiosis
- Quantifiable value (storage savings, quality improvements)
- Reinforces "Betabase helps AI get better" narrative

---

## User Stories

### US-001: Demo Presenter (Primary)
**As** a demo presenter,  
**I want** to visually explain how deduplication works,  
**So that** technical colleagues understand the multi-layered intelligence and ROI.

**Acceptance Criteria**:
- [ ] Can click "Deduplication" tab and see visual explainer
- [ ] Shows duplicate groups with reason (exact hash, semantic 96%, URL normalized)
- [ ] Displays before/after storage metrics (e.g., "201 MB → 150 MB, 25% saved")
- [ ] Explains tenant-scoped isolation visually
- [ ] Can run deduplication with live progress bar

### US-002: Demo Presenter (RLHF Story)
**As** a demo presenter,  
**I want** to show how AI learns from curator corrections,  
**So that** I can demonstrate human-AI collaboration, not replacement.

**Acceptance Criteria**:
- [ ] Reinforcement Dashboard tab shows quality improvement timeline
- [ ] Displays top improved topics (e.g., "authentication: 60% → 90%")
- [ ] Shows source type weights (boosted/penalized)
- [ ] Curator leaderboard visible (gamification aspect)
- [ ] Can narrate "Correction → Test Case → Training → Better AI" workflow with data

### US-003: Demo Presenter (Visual Polish)
**As** a demo presenter,  
**I want** all metrics to show realistic data (no zeros),  
**So that** the interface looks professional and credible.

**Acceptance Criteria**:
- [ ] Feedback Impact Card shows non-zero metrics
- [ ] "Improved from X% to Y%" shows actual delta
- [ ] Recent Corrections section has at least 3 items
- [ ] Queue shows mix of high/medium/low priority items
- [ ] All charts render without errors

### US-004: Knowledge Curator (Secondary)
**As** a knowledge curator,  
**I want** to understand why my document was flagged as duplicate,  
**So that** I can approve/reject the deduplication decision.

**Acceptance Criteria**:
- [ ] Can see duplicate groups with matched documents side-by-side
- [ ] Match reason visible (e.g., "Semantic Similarity: 96%")
- [ ] Can preview content of both versions
- [ ] Can override AI decision ("Keep This Version" button)
- [ ] Deduplication history tracked for audit

### US-005: Executive Stakeholder (Tertiary)
**As** an executive reviewing the platform,  
**I want** to see ROI from curation activities,  
**So that** I can justify investment in the Betabase platform.

**Acceptance Criteria**:
- [ ] Storage savings metric visible (GB saved, cost reduction)
- [ ] Quality improvement trend (accuracy over time)
- [ ] Curator productivity metrics (docs processed per hour)
- [ ] Feedback impact quantified (corrections → model improvements)

---

## Requirements

### Functional Requirements

#### FR-001: Deduplication Visualization Tab
**Priority**: 🔴 Critical (Demo Blocker)

- **Description**: Add new "Dedupe" tab showing duplicate detection intelligence
- **Components**:
  1. Duplicate Groups List
     - Group by match type (Exact Hash, Semantic, URL, Source ID)
     - Show similarity score for semantic matches
     - Display content preview (first 200 chars)
     - Highlight differences between versions
  2. Match Reason Badge
     - "🔍 Exact Hash" (SHA-256 match)
     - "🧠 Semantic 96%" (vector similarity)
     - "🔗 URL Normalized" (after removing query params)
     - "🆔 Source ID Duplicate" (JIRA-123 already exists)
  3. Storage Savings Metrics
     - Before/After size comparison
     - Files deduplicated count
     - Percentage reduction
     - Estimated cost savings (if applicable)
  4. Run Deduplication Action
     - "Dry Run" button (preview only)
     - "Execute" button (requires confirmation)
     - Live progress bar
     - Results summary modal
  5. Tenant Isolation Badge
     - "🔒 Tenant-Safe: sony-music/mso/aoma"
     - Tooltip: "Deduplication never crosses tenant boundaries"

**Linked Requirements**: REQ-020 (Deduplication Logic)  
**Test Strategy**: Playwright snapshot of dedupe tab, verify metrics calculation  
**ByteRover Tags**: `#deduplication` `#visualization` `#demo` `#curate-tab`

---

#### FR-002: Reinforcement Dashboard Tab
**Priority**: 🟠 High (Demo Value)

- **Description**: Implement missing RLHF tab showing AI learning from corrections
- **Components**:
  1. Quality Improvement Timeline (Recharts Area Chart)
     - X-axis: Date (last 30 days)
     - Y-axis: Average response quality (0-100%)
     - Annotations for major correction events
     - Before/after trend lines
  2. Top Improved Topics (Bar Chart)
     - Topics with biggest quality gains
     - Example: "Authentication +28%, Configuration +15%"
     - Color-coded: Green (improved), Red (declined)
  3. Source Type Weights (Horizontal Bar Chart)
     - Shows boost/penalty per source
     - knowledge: +15%, jira: +8%, git: -3%, etc.
     - Tooltip explaining why (e.g., "Boosted based on 12 positive feedbacks")
  4. Curator Leaderboard (Table)
     - Top 10 curators by correction count
     - Badges: 🏆 Master, 🥇 Champion, ⭐ Expert, 🌟 Rising Star
     - Contributions this month
  5. Feedback Volume (Stats Cards)
     - Total feedback collected
     - Pending review
     - Average rating
     - Thumbs up/down ratio
  6. Learning Impact Metrics
     - Queries improved (count + %)
     - Average quality delta (+X%)
     - Documents re-ranked (count)

**Linked Requirements**: REQ-021 (RLHF Reinforcement Learning)  
**Test Strategy**: Mock data for charts, verify all Recharts components render  
**ByteRover Tags**: `#rlhf` `#reinforcement` `#charts` `#learning-curve`

**Note**: Agent Insights Tab (decision flowcharts) is lower priority - defer to future.

---

#### FR-003: Feedback Impact Card - Real Data
**Priority**: 🟠 High (Demo Credibility)

- **Description**: Replace hardcoded zeros with real or realistic mock data
- **Data Sources**:
  1. Corrections: Query `rlhf_feedback` where `feedback_type = 'correction'`
  2. Tests Created: Query `rlhf_generated_tests` table (if exists) or mock
  3. Training Batches: Query fine-tuning jobs (if exists) or mock
  4. Accuracy: Calculate from `rlhf_feedback` ratings (average over time)
- **Mock Data Strategy** (if real data unavailable):
  - Corrections: Random 5-15
  - Tests Created: Corrections * 0.6 (not all corrections become tests)
  - Training Batches: Tests / 10 (batched training)
  - Accuracy: Start at 78%, increment 1-3% per week based on corrections
- **Calculation**:
  ```typescript
  const thisMonthCorrections = await getCorrectionsThisMonth();
  const lastMonthCorrections = await getCorrectionsLastMonth();
  const percentChange = ((thisMonthCorrections - lastMonthCorrections) / lastMonthCorrections) * 100;
  ```
- **UI Changes**:
  - Remove hardcoded zeros
  - Use `useEffect` to fetch on mount
  - Show loading spinner while fetching
  - Format numbers with commas (1,234)
  - Show realistic "Improved from 78% to 83%" delta

**Linked Requirements**: REQ-006 (Feedback Collection UI)  
**Test Strategy**: Mock API responses, verify metrics update  
**ByteRover Tags**: `#feedback-impact` `#metrics` `#curate-tab`

---

#### FR-004: Recent Corrections Section - Populate
**Priority**: 🟡 Medium (Visual Polish)

- **Description**: Show 3-5 most recent corrections in Feedback Impact Card
- **Data Source**: `rlhf_feedback` ordered by `created_at DESC` limit 5
- **Display Format**:
  ```
  🔧 "How to configure AOMA pipeline?"
     Corrected by: matt@betabase.com
     2 hours ago
  ```
- **Interaction**: Click to expand full correction details
- **Empty State**: "No corrections yet - submit feedback to see learning in action"

**Linked Requirements**: REQ-006  
**Test Strategy**: Playwright check for at least 1 correction item  
**ByteRover Tags**: `#recent-corrections` `#rlhf` `#curate-tab`

---

### Non-Functional Requirements

#### NFR-001: MAC Design System Compliance
**Priority**: 🟢 Low (Already High Score)

- **Current Score**: 9.8/10 (from 2025-10-11 audit)
- **Verification Needed**:
  - [ ] Glassmorphism still rendering correctly
  - [ ] All new components use `--mac-*` CSS variables
  - [ ] Font weights ≤ 400 (light/normal only)
  - [ ] Hover states with lift effect
  - [ ] 8px spacing grid
  - [ ] 150-300ms animations
- **Action**: Run MAC Design Compliance Auditor skill on new components
- **Acceptance**: Score ≥ 9.5/10

**Linked Requirements**: Constitution Section 11 (MAC Design System)  
**Test Strategy**: Manual visual check + auditor skill  
**ByteRover Tags**: `#mac-design` `#compliance` `#visual-polish`

---

#### NFR-002: Performance - Tab Switching
**Priority**: 🟢 Low

- **Target**: Tab switch < 200ms
- **Measurement**: Playwright timing from tab click to content render
- **Optimization**:
  - Lazy load chart components
  - Virtualize long lists
  - Memoize expensive calculations

**Test Strategy**: Playwright performance tests  
**ByteRover Tags**: `#performance` `#tab-switching`

---

#### NFR-003: Accessibility (WCAG AA)
**Priority**: 🟢 Low

- **Keyboard Navigation**: All tabs accessible via Tab key
- **Screen Reader**: ARIA labels on charts
- **Focus Indicators**: Blue ring on focused elements
- **Color Contrast**: Text ≥ 4.5:1 against background

**Test Strategy**: axe-core automated accessibility tests  
**ByteRover Tags**: `#accessibility` `#wcag` `#a11y`

---

## Technical Design

### Architecture

#### New Components

1. **`DeduplicationTab.tsx`** (NEW)
   - Location: `src/components/ui/DeduplicationTab.tsx`
   - Responsibilities:
     - Fetch duplicate groups from `/api/knowledge/deduplicate?dryRun=true`
     - Display groups with match reason badges
     - Storage savings calculation
     - Run deduplication action

2. **`ReinforcementDashboardTab.tsx`** (NEW - RLHF sub-tab)
   - Location: `src/components/ui/rlhf-tabs/ReinforcementDashboardTab.tsx`
   - Responsibilities:
     - Quality improvement timeline (Recharts AreaChart)
     - Top improved topics (Recharts BarChart)
     - Source type weights (Recharts BarChart)
     - Curator leaderboard (Table)
     - Fetch from `/api/rlhf/analytics`

3. **`FeedbackImpactCard.tsx`** (ENHANCED - existing file)
   - Location: `src/components/ui/FeedbackImpactCard.tsx`
   - Changes:
     - Replace hardcoded zeros with real API calls
     - Add loading states
     - Populate Recent Corrections section
     - Fix percentage calculation

#### API Endpoints

**New Endpoint**: `POST /api/rlhf/analytics`
- **Request**: `{ timeRange: '30d' | '7d' | 'all' }`
- **Response**:
  ```typescript
  {
    qualityTimeline: Array<{ date: string; quality: number }>,
    topImprovedTopics: Array<{ topic: string; delta: number }>,
    sourceWeights: Array<{ source: string; weight: number }>,
    curatorLeaderboard: Array<{ name: string; corrections: number }>,
    feedbackVolume: { total: number; pending: number; avgRating: number }
  }
  ```

**Enhanced Endpoint**: `GET /api/rlhf/feedback?recent=true&limit=5`
- Returns most recent corrections for "Recent Corrections" section

#### Data Flow

```
User clicks "Dedupe" tab
  ↓
DeduplicationTab.tsx mounts
  ↓
useEffect calls GET /api/knowledge/deduplicate?dryRun=true
  ↓
Backend queries siam_vectors table
  ↓
Groups duplicates by content_hash, semantic similarity, URL
  ↓
Returns duplicate groups with match reasons
  ↓
Component renders groups with badges and metrics
```

---

### Database Schema

**No new tables required** - uses existing:
- `siam_vectors` (for deduplication)
- `rlhf_feedback` (for corrections, ratings)
- `retrieval_reinforcement` (for source weights)

**Optional Enhancement**: Add `deduplication_history` table for audit trail
```sql
CREATE TABLE deduplication_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duplicate_groups_found INT NOT NULL,
  files_removed INT NOT NULL,
  bytes_saved BIGINT NOT NULL,
  run_by TEXT, -- curator email
  dry_run BOOLEAN NOT NULL DEFAULT true,
  organization TEXT NOT NULL,
  division TEXT NOT NULL,
  app_under_test TEXT NOT NULL
);
```

---

### UI/UX Mockups

#### Deduplication Tab

```
┌─────────────────────────────────────────────────────────────┐
│  Deduplication Intelligence                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Storage Savings                                         │
│  ┌──────────┬──────────┬──────────┬──────────┐            │
│  │ Before   │ After    │ Saved    │ % Reduction│           │
│  │ 201.3 MB │ 150.8 MB │ 50.5 MB  │ 25.1%      │           │
│  └──────────┴──────────┴──────────┴──────────┘            │
│                                                             │
│  🔒 Tenant-Safe: sony-music/mso/aoma                       │
│     (Deduplication never crosses tenant boundaries)        │
│                                                             │
│  ═══════════════════════════════════════════════════       │
│                                                             │
│  Duplicate Groups (12 found)                                │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │ 🧠 Semantic Similarity: 96%                      │       │
│  │                                                  │       │
│  │ ✓ Keep: "SACD Spec - 2048 bytes per sector..."  │       │
│  │   📄 sacd-technical-spec.pdf (2.4 MB)            │       │
│  │   🕐 Uploaded: 2025-12-17 14:32                  │       │
│  │                                                  │       │
│  │ ✗ Remove: "SACD Technical Specification..."     │       │
│  │   📄 sacd_spec_duplicate.pdf (2.3 MB)            │       │
│  │   🕐 Uploaded: 2025-12-15 09:18                  │       │
│  │                                                  │       │
│  │   [Keep This Instead] [Preview Diff]            │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │ 🔍 Exact Hash (SHA-256)                          │       │
│  │ ...                                              │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  [🧹 Run Deduplication (Dry Run)]  [✅ Execute]           │
└─────────────────────────────────────────────────────────────┘
```

#### Reinforcement Dashboard Tab

```
┌─────────────────────────────────────────────────────────────┐
│  AI Learning from Your Corrections                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📈 Quality Improvement Timeline (Last 30 Days)             │
│  ┌─────────────────────────────────────────────────┐       │
│  │   100%                                           │       │
│  │    90%  ╱────────                                │       │
│  │    80% ╱                                         │       │
│  │    70%╱___________                               │       │
│  │      Dec 1    Dec 15    Dec 31                   │       │
│  │                                                  │       │
│  │  🎯 Improved from 78% to 83% (+5%)               │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  🔥 Top Improved Topics                                     │
│  ┌──────────────────────────────────────┐                  │
│  │ Authentication  ████████████ +28%    │                  │
│  │ Configuration   ████████ +15%        │                  │
│  │ Deployment      ███ +8%              │                  │
│  └──────────────────────────────────────┘                  │
│                                                             │
│  ⚖️ Source Type Weights                                     │
│  ┌──────────────────────────────────────┐                  │
│  │ knowledge  ████████████████ +15%     │                  │
│  │ jira       ████████████ +8%          │                  │
│  │ git        ██████ -3%                │                  │
│  └──────────────────────────────────────┘                  │
│                                                             │
│  🏆 Curator Leaderboard                                     │
│  ┌───────────────────────────────────────────┐             │
│  │ 1. 🏆 matt@betabase.com    42 corrections │             │
│  │ 2. 🥇 jane@betabase.com    28 corrections │             │
│  │ 3. ⭐ john@betabase.com    15 corrections │             │
│  └───────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Deduplication Visualization (T001-T008)
**Duration**: 1.5-2 hours  
**Session**: 1

#### T001: Create DeduplicationTab.tsx Component
- Copy structure from existing CurateTab tabs
- Add tab to CurateTab.tsx tablist
- Basic layout with placeholder content

#### T002: Integrate `/api/knowledge/deduplicate` API
- useEffect to fetch duplicate groups on mount
- Loading state with spinner
- Error handling with toast notifications

#### T003: Implement Duplicate Groups Display
- Map over groups, render cards
- Show match type badge (Exact Hash, Semantic, URL, Source ID)
- Display similarity score for semantic matches
- Content preview (first 200 chars) with "..." truncation

#### T004: Add Storage Savings Metrics
- Calculate before/after from API response
- Display in stat cards at top of tab
- Format numbers with commas (50,500 bytes → "50.5 KB")

#### T005: Tenant Isolation Badge
- Static badge showing current tenant context
- Tooltip with explanation
- Fetch tenant context from Supabase client

#### T006: Run Deduplication Action
- "Dry Run" button calls API with `dryRun=true`
- "Execute" button shows confirmation dialog, then calls with `dryRun=false`
- Live progress bar (mock 0-100% over 3 seconds if API doesn't support streaming)
- Results summary modal

#### T007: MAC Design Compliance
- Apply glassmorphism to cards
- Use `--mac-*` CSS variables for colors
- Font-light typography
- Hover lift effects on duplicate cards

#### T008: Verify in Browser
- Navigate to Curate > Dedupe tab
- Check all components render
- Run dedupe dry run
- Take screenshot for documentation

---

### Phase 2: Reinforcement Dashboard Tab (T009-T016)
**Duration**: 1.5-2 hours  
**Session**: 1 or 2

#### T009: Create ReinforcementDashboardTab.tsx Component
- Location: `src/components/ui/rlhf-tabs/ReinforcementDashboardTab.tsx`
- Basic layout with placeholders for charts

#### T010: Create `/api/rlhf/analytics` Endpoint
- File: `src/app/api/rlhf/analytics/route.ts`
- Query `rlhf_feedback` for quality timeline data
- Group by date, calculate average rating
- Mock data if real data insufficient

#### T011: Quality Improvement Timeline Chart
- Use Recharts `<AreaChart>`
- X-axis: Date, Y-axis: Quality %
- Blue gradient fill (MAC primary blue)
- Annotations for major correction events

#### T012: Top Improved Topics Chart
- Use Recharts `<BarChart>` (horizontal)
- Green bars for improvements, red for declines
- Sort by delta (biggest improvement first)

#### T013: Source Type Weights Chart
- Use Recharts `<BarChart>` (horizontal)
- Color-coded: Green (+), Red (-)
- Tooltips explaining boost/penalty reason

#### T014: Curator Leaderboard Table
- Query `rlhf_feedback` grouped by `user_email`
- Count corrections per curator
- Assign badges based on count (42+ = Master, 20+ = Champion, etc.)
- Display in sortable table

#### T015: Feedback Volume Stats Cards
- Total feedback count
- Pending review count
- Average rating (1-5 stars)
- Thumbs up/down ratio

#### T016: Wire to CurateTab > RLHF Tab
- Add as sub-tab under RLHF
- Use native HTML tabs or simple state toggle
- Verify renders without errors

---

### Phase 3: Feedback Impact Card Real Data (T017-T020)
**Duration**: 30-45 minutes  
**Session**: 2

#### T017: Add Real Data Fetching Logic
- File: `src/components/ui/FeedbackImpactCard.tsx`
- useEffect to fetch from `/api/rlhf/feedback?stats=true`
- Calculate corrections, tests, training batches
- Calculate accuracy delta (this month vs last month)

#### T018: Replace Hardcoded Zeros
- Update state with real values
- Add loading spinner while fetching
- Handle empty state gracefully

#### T019: Populate Recent Corrections Section
- Fetch 5 most recent corrections
- Display with user, timestamp, query preview
- Click to expand full details

#### T020: Fix Percentage Calculation
- Ensure "Improved from X% to Y%" shows real delta
- Avoid contradictions like "83% to 83%"
- Show trending indicator (↗️ up, ↘️ down, → flat)

---

### Phase 4: Verification & Polish (T021-T025)
**Duration**: 30 minutes  
**Session**: 2

#### T021: MAC Design Compliance Audit
- Run auditor skill on new components
- Fix any violations (colors, typography, spacing)
- Verify glassmorphism rendering

#### T022: Browser E2E Verification
- Navigate through all tabs (Queue, Files, Upload, Info, RLHF, Dedupe)
- Verify no console errors
- Check hover states, animations
- Take screenshots of all new features

#### T023: Playwright Smoke Tests
- Add test for Dedupe tab rendering
- Add test for Reinforcement Dashboard charts
- Add test for non-zero metrics in Feedback Impact

#### T024: ByteRover Knowledge Storage
- Store deduplication patterns learned
- Store RLHF chart implementations
- Tag with `#curate-tab` `#rlhf` `#deduplication`

#### T025: Update Progress Files
- Update `claude-progress.txt`
- Mark feature complete in `features.json`
- Create handoff if needed

---

## Testing Strategy

### Unit Tests (Optional - Prefer E2E)

**Deduplication Logic** (`src/services/deduplicationService.test.ts`):
- ✅ Already exists (from previous work)
- Verify content hash generation
- Verify semantic similarity calculation
- Verify URL normalization

### E2E Tests (Playwright - Required)

**File**: `tests/e2e/curate-tab-enhancement.spec.ts`

```typescript
test.describe('Curate Tab Enhancement', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.click('[data-tab="curate"]');
  });

  test('Deduplication tab shows storage savings', async ({ page }) => {
    await page.click('[data-tab-id="dedupe"]');
    await expect(page.locator('[data-metric="storage-saved"]')).toBeVisible();
    await expect(page.locator('[data-metric="storage-saved"]')).not.toContainText('0 MB');
  });

  test('Reinforcement Dashboard shows quality timeline', async ({ page }) => {
    await page.click('[data-tab-id="rlhf"]');
    await page.click('[data-sub-tab="reinforcement-dashboard"]');
    await expect(page.locator('[data-chart="quality-timeline"]')).toBeVisible();
  });

  test('Feedback Impact Card shows non-zero metrics', async ({ page }) => {
    await page.click('[data-tab-id="queue"]');
    const corrections = await page.locator('[data-metric="corrections"]').textContent();
    expect(parseInt(corrections || '0')).toBeGreaterThan(0);
  });

  test('Recent corrections section is populated', async ({ page }) => {
    await page.click('[data-tab-id="queue"]');
    const corrections = await page.locator('[data-section="recent-corrections"] li').count();
    expect(corrections).toBeGreaterThanOrEqual(1);
  });
});
```

### Visual Regression Tests (Optional)

**Using Playwright Screenshots**:
```typescript
test('Curate tab visual regression', async ({ page }) => {
  await page.goto('http://localhost:3000/#curate');
  await expect(page).toHaveScreenshot('curate-tab-enhanced.png');
});
```

---

## Success Metrics

### Demo Readiness
- [ ] Can explain deduplication in <2 minutes with visual aids
- [ ] Can show AI learning curve from corrections
- [ ] No zeros visible in any metric
- [ ] All tabs render without errors
- [ ] Professional appearance (MAC 9.5/10+)

### Technical Quality
- [ ] All Playwright tests pass
- [ ] No console errors
- [ ] Tab switching < 200ms
- [ ] Charts render in < 500ms
- [ ] WCAG AA compliance

### Knowledge Transfer
- [ ] Research findings stored in ByteRover
- [ ] Deduplication flow documented
- [ ] RLHF chart patterns stored
- [ ] Session progress logged in `claude-progress.txt`

---

## Dependencies & Risks

### Dependencies

1. **Recharts Library** (Already installed)
   - Used for Quality Timeline, Topic Charts, Source Weights
   - No action needed

2. **Real RLHF Data** (May not exist in sufficient quantity)
   - **Mitigation**: Create realistic mock data generator
   - **Fallback**: Populate `rlhf_feedback` table with sample data

3. **Deduplication API** (Already exists)
   - Endpoint: `/api/knowledge/deduplicate`
   - **Risk**: May be slow on large datasets
   - **Mitigation**: Add pagination, run in background

### Risks

#### Risk 1: Insufficient Real Data
**Likelihood**: High  
**Impact**: Medium (Can use mocks for demo)  
**Mitigation**:
- Create `scripts/seed-rlhf-data.ts` to populate sample corrections
- Use realistic ranges (10-50 corrections, 80-85% accuracy)
- Document that data is illustrative

#### Risk 2: Chart Performance
**Likelihood**: Low  
**Impact**: Low  
**Mitigation**:
- Limit data points (30 days = 30 points max)
- Use Recharts built-in optimizations
- Lazy load chart components

#### Risk 3: MAC Design Drift
**Likelihood**: Low  
**Impact**: Low (Already 9.8/10)  
**Mitigation**:
- Run auditor skill before merge
- Manual visual check
- Apply `--mac-*` variables consistently

#### Risk 4: Scope Creep
**Likelihood**: Medium  
**Impact**: High (Could balloon to 8+ hours)  
**Mitigation**:
- **Strict scope**: Only Dedupe tab, Reinforcement Dashboard, Feedback Impact fixes
- **Defer**: Agent Insights tab (complex flowcharts)
- **Defer**: Enhanced Curate Tab features (analytics, insights) - already documented

---

## Knowledge Store

### ByteRover Tags for This Feature

```
#curate-tab #deduplication #rlhf #reinforcement-dashboard #feedback-impact
#demo-ready #mac-design #recharts #charts #visualization #long-running-feature
#speckit #multi-tenant #storage-savings #quality-improvement #curator-leaderboard
```

### Key Learnings to Store

1. **Deduplication Algorithm Flow**
   - 4-layer detection: Source ID → Content Hash → URL → Semantic
   - Tenant-scoped (never crosses org boundaries)
   - Default semantic threshold: 0.95
   - Uses SHA-256 for content hashing

2. **Recharts Best Practices**
   - AreaChart for timelines (quality over time)
   - Horizontal BarChart for comparisons (topics, source weights)
   - Use MAC color variables for brand consistency
   - Limit data points to 30-50 for performance

3. **RLHF Metrics Calculation**
   - Quality = avg(rating) from rlhf_feedback
   - Delta = (this_month_avg - last_month_avg) / last_month_avg * 100
   - Source weights from retrieval_reinforcement table
   - Curator leaderboard = COUNT(corrections) GROUP BY user_email

4. **Mock Data Strategy for Demos**
   - Use realistic ranges based on typical usage
   - Ensure non-zero values (even if small)
   - Show trends (gradual improvement, not sudden spikes)
   - Document clearly as "illustrative data"

---

## Related Documents

- **Research Findings**: `CURATE-TAB-RESEARCH-FINDINGS.md`
- **Previous RLHF Integration Spec**: `RLHF-CURATE-INTEGRATION-COMPLETE.md`
- **MAC Design Audit**: `docs/CURATE_TAB_MAC_AUDIT.md`
- **Deduplication Service**: `src/services/deduplicationService.ts`
- **Current Component**: `src/components/ui/CurateTab.tsx`
- **Constitution**: `specs/SIAM/constitution.md` (Section 11: MAC Design System)
- **Requirements**: `specs/SIAM/requirements.md` (REQ-020, REQ-021)

---

## Approval & Sign-Off

**Spec Author**: Claudette (Long-Running Agent)  
**Date**: 2025-12-18  
**Status**: ✅ Ready for User Review

**User Review Checklist**:
- [ ] Vision aligns with demo goals
- [ ] Scope is manageable (3-4 hours)
- [ ] Deduplication explanation sufficient
- [ ] RLHF visualization valuable
- [ ] Mock data strategy acceptable
- [ ] Technical approach sound

**Once approved, proceed to Implementation Phase 1 (T001-T008).**

---

*"The Curate tab should tell a story: Humans and AI working together to build better intelligence. This spec makes that story visible."*

— Claudette, Long-Running Agent 💜


