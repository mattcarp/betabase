# Three-Day Northstar Demo Sprint
## Making All Three Pillars Demo-Ready

**Start**: Friday, November 28, 2025 at 09:00 CET (Rome)
**End**: Monday, December 1, 2025 at 09:00 CET (Rome)
**Duration**: 72 hours
**Team**: Matt + Claude
**Goal**: Working demo for all three pillars

**IMPORTANT: Dev testing only. No production deployment or testing this sprint.**
(Production testing takes forever, breaks constantly, and isn't the point of this demo anyway.)

---

## Sprint Schedule

| Day | Date | Focus | Hours |
|-----|------|-------|-------|
| Day 1 | Fri Nov 28 | Pillar 3 (Testing) + Integration | 09:00-21:00 CET |
| Day 2 | Sat Nov 29 | Pillar 2 (Curate) + Pillar 1 (Chat) | 09:00-21:00 CET |
| Day 3 | Sun Nov 30 | Polish, Testing, Production Deploy | 09:00-21:00 CET |

---

## Current State Assessment (What We Actually Have)

### Already Built (Good News!)

| Component | Status | File |
|-----------|--------|------|
| SelfHealingTestViewer | Complete with mock data | `src/components/test-dashboard/SelfHealingTestViewer.tsx` |
| CuratorQueue | Complete with mock data | `src/components/ui/CuratorQueue.tsx` |
| TestHomeDashboard | Complete with mock data | `src/components/test-dashboard/TestHomeDashboard.tsx` |
| RLHFFeedbackTab | Complete with feedback forms | `src/components/ui/rlhf-tabs/RLHFFeedbackTab.tsx` |
| TestDashboard | Working with 11+ tabs | `src/components/test-dashboard/TestDashboard.tsx` |
| InlineCitation | Built | `src/components/ai-elements/inline-citation.tsx` |
| Mermaid diagrams | Working | Already integrated |
| LangSmith traces | Working | Already integrated |

### Critical Gaps (What We Need)

| Gap | Pillar | Effort | Impact |
|-----|--------|--------|--------|
| Components not wired into main tabs | All | 2h | Demo-breaking |
| No "Home" tab in Test Dashboard | Test | 1h | Navigation flow |
| Self-Healing not in Test tabs | Test | 1h | Feature hidden |
| Curator Queue not in Curate tab | Curate | 1h | Feature hidden |
| No feedback impact visualization | Curate | 3h | "Wow" moment |
| Chat confidence display | Chat | 2h | Demo polish |
| Before/After comparison | Chat | 2h | Demo polish |
| Real data connection (optional) | All | 4h | Nice to have |

---

## Day 1: Friday, November 28 - Integration & Pillar 3 (Testing)

### Morning Session (09:00-13:00 CET)

#### 09:00-11:00: Wire Up Test Dashboard Tabs

**Priority**: Get all built components visible in the UI

- [ ] Add "Home" tab to TestDashboard.tsx using TestHomeDashboard
- [ ] Add "Self-Healing" tab to TestDashboard.tsx using SelfHealingTestViewer
- [ ] Verify navigation between tabs works
- [ ] Test that TestFilters component works
- [ ] Screenshot: Test Dashboard with all tabs visible

```typescript
// In TestDashboard.tsx, add these imports:
import { TestHomeDashboard } from "./TestHomeDashboard";
import { SelfHealingTestViewer } from "./SelfHealingTestViewer";

// Add to TabsList:
<TabsTrigger value="home">Home</TabsTrigger>
<TabsTrigger value="self-healing">Self-Healing</TabsTrigger>

// Add TabsContent:
<TabsContent value="home">
  <TestHomeDashboard onNavigate={setActiveView} testStats={testStats} />
</TabsContent>
<TabsContent value="self-healing">
  <SelfHealingTestViewer />
</TabsContent>
```

#### 11:00-13:00: Enhance Self-Healing UI

- [ ] Add "Tier" badges (Tier 1: Auto, Tier 2: Review, Tier 3: Architect)
- [ ] Add "Impact" callout: "This fix will repair 4 similar tests"
- [ ] Improve the workflow visualization with better animations
- [ ] Add history tab content (even if mock)
- [ ] Screenshot: Self-healing workflow detail view

### Lunch Break (13:00-14:00 CET)

### Afternoon Session (14:00-18:00 CET)

#### 14:00-16:00: Test Pillar Playwright Tests

- [ ] Write `tests/e2e/demo/test-pillar.spec.ts`
- [ ] Test navigation to Test tab
- [ ] Test Home dashboard renders
- [ ] Test Self-Healing tab renders
- [ ] Test clicking a healing item shows details
- [ ] Test approve/reject buttons work

#### 16:00-18:00: Test Dashboard Polish

- [ ] Ensure all test dashboard tabs work smoothly
- [ ] Fix any console errors
- [ ] Add loading states where missing
- [ ] Verify dark mode compatibility
- [ ] Run Playwright tests and fix failures

### Evening Session (18:00-21:00 CET)

#### 18:00-21:00: Testing & Documentation

- [ ] Run full Playwright suite for Test pillar
- [ ] Fix any remaining console errors
- [ ] Take screenshots of Test pillar
- [ ] Document any remaining issues
- [ ] Prepare for Day 2 Curate work

---

## Day 2: Saturday, November 29 - Pillar 2 (Curate) & Pillar 1 (Chat)

### Morning Session (09:00-13:00 CET)

#### 09:00-11:00: Pillar 2 - Curate Tab Integration

- [ ] Add CuratorQueue to main Curate tab (or create dedicated tab)
- [ ] Wire RLHFFeedbackTab into the Curate experience
- [ ] Ensure both components are accessible from main nav
- [ ] Test the approval workflow works

#### 11:00-13:00: Feedback Impact Visualization (NEW)

Create `src/components/ui/FeedbackImpactCard.tsx`:

```typescript
// Shows: "Your 23 corrections created 89 test cases"
// Shows: "Accuracy improved 11% this month"
// Shows: individual correction -> test case mapping
```

- [ ] Build FeedbackImpactCard component
- [ ] Add to Curate tab
- [ ] Wire in mock data showing virtuous cycle
- [ ] Screenshot: Impact visualization

### Lunch Break (13:00-14:00 CET)

### Afternoon Session (14:00-18:00 CET)

#### 14:00-16:00: Curate Pillar Playwright Tests

- [ ] Write `tests/e2e/demo/curate-pillar.spec.ts`
- [ ] Test navigation to Curate tab
- [ ] Test CuratorQueue renders
- [ ] Test clicking queue item shows details
- [ ] Test approve/reject buttons work
- [ ] Test feedback submission works

#### 16:00-18:00: Pillar 1 - Chat Confidence Display

- [ ] Add confidence score badge to AI responses
- [ ] Show "High Confidence: 94%" or "Needs Review: 68%"
- [ ] Color code: Green (>85%), Amber (70-85%), Red (<70%)
- [ ] Add to the Response component

### Evening Session (18:00-21:00 CET)

#### 18:00-20:00: Source Attribution Enhancement

- [ ] Ensure InlineCitation is working in chat responses
- [ ] Add source count badge: "Based on 3 verified sources"
- [ ] Ensure citations expand on click
- [ ] Test with real AOMA queries

#### 20:00-21:00: Chat Pillar Playwright Test

- [ ] Write `tests/e2e/demo/chat-pillar.spec.ts`
- [ ] Test sending an AOMA query
- [ ] Test response shows citations
- [ ] Test Mermaid diagram renders
- [ ] Test reasoning bubbles expand

---

## Day 3: Sunday, November 30 - Polish & Production Deploy

### Morning Session (09:00-13:00 CET)

#### 09:00-11:00: Before/After Demo Setup

Create a simple comparison component:

```typescript
// src/components/ai/BeforeAfterDemo.tsx
// Left panel: "Generic AI" response (hardcoded)
// Right panel: SIAM response with sources
```

- [ ] Build comparison component
- [ ] Add toggle to enable/disable in demo
- [ ] Screenshot: Side-by-side comparison

#### 11:00-13:00: Full Demo Flow Test

- [ ] Run through entire 3-pillar demo manually
- [ ] Time each section:
  - Chat: ~2 minutes
  - Curate: ~2 minutes
  - Test: ~2 minutes
- [ ] Note any awkward transitions
- [ ] Fix blocking issues

### Lunch Break (13:00-14:00 CET)

### Afternoon Session (14:00-18:00 CET)

#### 14:00-16:00: Polish & Error Handling

- [ ] Fix any console errors
- [ ] Add loading states where missing
- [ ] Add empty states where needed
- [ ] Ensure dark mode works throughout
- [ ] Test on different viewport sizes
- [ ] Fix progress indicator positioning

#### 16:00-18:00: Final Smoke Test & Documentation

- [ ] Run all Playwright tests
- [ ] Update NORTHSTAR-STATUS.md with accurate status
- [ ] Take final screenshots
- [ ] Record 30-second video of each pillar
- [ ] Create DEMO-READY-CHECKLIST.md

### Evening Session (18:00-21:00 CET)

#### 18:00-21:00: Final Dev Testing & Wrap-Up

- [ ] Run full Playwright suite on localhost
- [ ] Manual walkthrough of all three pillars
- [ ] Fix any remaining console errors
- [ ] Commit all changes to feature branch
- [ ] Document what works, what doesn't
- [ ] Prep notes for demo day

**NOT doing**: Production deployment, Render monitoring, Mailinator magic link testing.
This is a dev demo. We'll worry about prod later.

---

## Success Criteria Checklist

### Pillar 1: Chat

- [ ] Chat sends queries and receives responses
- [ ] Mermaid diagrams render with zoom/pan
- [ ] Inline citations appear and expand
- [ ] Confidence score visible on responses
- [ ] LangSmith trace link works
- [ ] No console errors

### Pillar 2: Curate

- [ ] Curator Queue visible and populated
- [ ] Can select queue items
- [ ] Approve/Reject buttons work
- [ ] Feedback impact visualization shows
- [ ] RLHFFeedbackTab accessible
- [ ] No console errors

### Pillar 3: Test

- [ ] Home Dashboard shows key metrics
- [ ] Self-Healing tab shows healing queue
- [ ] Can select healing items
- [ ] Workflow visualization renders
- [ ] Approve/Reject healing works
- [ ] No console errors

### Overall

- [ ] All three tabs accessible from main nav
- [ ] Navigation between pillars smooth
- [ ] Dark mode works throughout
- [ ] No console errors anywhere
- [ ] Playwright tests pass on localhost
- [ ] Demo runs smoothly on dev server

---

## Mock Data Strategy

We will use the existing mock data in components for the demo. This is intentional:

1. **Mock data is predictable** - Demo won't fail due to API issues
2. **Mock data is realistic** - Already crafted to show good demo scenarios
3. **Components are structured for real data** - Easy to swap in later

Future work (post-demo):
- Connect to Supabase `healing_attempts` table
- Connect to Supabase `rlhf_feedback` table
- Add real-time subscriptions

---

## File Changes Tracker

### Day 1 Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/test-dashboard/TestDashboard.tsx` | Modify | Add Home and Self-Healing tabs |
| `src/components/test-dashboard/SelfHealingTestViewer.tsx` | Modify | Add tier badges, impact callouts |
| `tests/e2e/demo/test-pillar.spec.ts` | New | Test pillar E2E tests |

### Day 2 Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/ui/pages/CurateTab.tsx` | Modify | Integrate CuratorQueue |
| `src/components/ui/FeedbackImpactCard.tsx` | New | Feedback impact visualization |
| `src/components/ai-elements/Response.tsx` | Modify | Add confidence badge |
| `tests/e2e/demo/curate-pillar.spec.ts` | New | Curate pillar E2E tests |
| `tests/e2e/demo/chat-pillar.spec.ts` | New | Chat pillar E2E tests |

### Day 3 Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/ai/BeforeAfterDemo.tsx` | New | Comparison component |
| `docs/demo/NORTHSTAR-STATUS.md` | Modify | Update with accurate status |
| `docs/demo/DEMO-READY-CHECKLIST.md` | New | Final checklist |

---

## Risk Mitigation

### If We Run Out of Time

**Priority 1** (Must have):
- Test Dashboard with Home + Self-Healing tabs working
- CuratorQueue visible somewhere
- Chat working with basic citations

**Priority 2** (Should have):
- Feedback Impact visualization
- Confidence scores on chat
- Tier badges on self-healing

**Priority 3** (Nice to have):
- Before/After comparison
- Real data connection
- Full Playwright test coverage

### If Components Don't Work

1. Check for missing imports
2. Check for TypeScript errors
3. Check browser console
4. Fall back to mock data
5. Document issue and move on

---

## Quick Commands Reference

```bash
# Start dev server
npx kill-port 3000 && npm run dev

# Run specific tests
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/demo/

# Run all tests
npm run test:aoma

# Check for errors
npm run lint:quick && npm run type-check

# Commit to feature branch (no prod deploy)
git acm "Northstar demo: [description]"
```

---

## Let's Go!

**Sprint Start**: Friday, November 28, 2025 at 09:00 CET (Rome)

**First Task**: Verify dev server works and components render

```bash
npx kill-port 3000 && npm run dev
# Open http://localhost:3000
# Navigate to Test tab
# Verify TestDashboard renders
```

**Day 1 Goal**: Test pillar fully functional with Home + Self-Healing tabs

---

*Created: November 28, 2025*
*Sprint Duration: 72 hours*
*Goal: Three pillars demo-ready*
