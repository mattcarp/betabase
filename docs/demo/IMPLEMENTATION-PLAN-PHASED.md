# 🎯 SIAM Self-Healing Demo Implementation Plan
## Gap Analysis & Phased Execution (48 Hours)

**Created**: November 23, 2025  
**Timeline**: 2 days (Nov 23-24)  
**Team**: Mattie + Claude  
**Goal**: Production-ready sophisticated self-healing test demo

---

## 📊 Current State Audit

### ✅ What We Have (Assets)

**Database Infrastructure**:
- ✅ Supabase configured: `kfxetwuuzljhybfgmpuc.supabase.co`
- ✅ `test_results` table (test execution data)
- ✅ `beta_base_scenarios` table (40K+ historical AOMA tests from Beta Base)
- ✅ `beta_base_executions` table (execution history)
- ✅ `jira_tickets` table (JIRA tickets with embeddings)
- ✅ Multi-tenant vector store (`siam_vectors`)
- ✅ RLHF feedback schema (`rlhf_feedback` table)

**Current Test Data Volume**:
- 40,000+ historical Beta Base scenarios
- Unknown number of recent `test_results` records
- JIRA tickets (need to verify count)

**Code Infrastructure**:
- ✅ React/Next.js app with TypeScript
- ✅ Supabase client configured
- ✅ Shadcn/ui component library
- ✅ Real-time subscriptions capability

---

## ❌ What We're Missing (Gaps)

### Critical Gaps for Demo

1. **Database Schema Gaps**:
   - ❌ No `healing_attempts` table (tracks self-healing workflow)
   - ❌ No `hitl_feedback` table (tracks human reviews)
   - ❌ No healing columns in `test_results` (tier, confidence, strategy)
   - ❌ No view for 24h healing stats

2. **Data Gaps**:
   - ❌ Test results don't have healing metadata
   - ❌ No classification into Tier 1/2/3
   - ❌ No confidence scores calculated
   - ❌ No healing strategies generated
   - ❌ No DOM change snapshots

3. **Component Gaps**:
   - ❌ No EnhancedStatsGrid (three-tier dashboard)
   - ❌ No HealingQueue (left panel with attempts)
   - ❌ No WorkflowViewer (visual 6-step healing process)
   - ❌ No HITLReviewPanel (expert approval interface)
   - ❌ No three-tier visualization

4. **Integration Gaps**:
   - ❌ No connection between test_results and healing data
   - ❌ No real-time updates wired up
   - ❌ No API routes for healing operations

5. **Demo Production Gaps**:
   - ❌ No screen recordings
   - ❌ No CapCut project setup
   - ❌ No voiceover script
   - ❌ No final edited video

---

## 🔍 Database Connectivity Audit (PRIORITY #1)

### Action Items

**Objective**: Verify we can connect to all databases and understand data volume

**Step 1: Connection Test Script** (30 min)
```typescript
// File: scripts/audit-database-connectivity.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function auditDatabases() {
  console.log('🔍 SIAM Database Connectivity Audit\n');
  
  // 1. Beta Base Scenarios
  const { count: betaBaseCount, error: bbError } = await supabase
    .from('beta_base_scenarios')
    .select('*', { count: 'exact', head: true });
  
  console.log(`✅ Beta Base Scenarios: ${betaBaseCount?.toLocaleString() || 'ERROR'}`);
  if (bbError) console.error('   Error:', bbError.message);
  
  // 2. Beta Base Executions
  const { count: executionCount, error: exError } = await supabase
    .from('beta_base_executions')
    .select('*', { count: 'exact', head: true });
  
  console.log(`✅ Beta Base Executions: ${executionCount?.toLocaleString() || 'ERROR'}`);
  if (exError) console.error('   Error:', exError.message);
  
  // 3. JIRA Tickets
  const { count: jiraCount, error: jiraError } = await supabase
    .from('jira_tickets')
    .select('*', { count: 'exact', head: true });
  
  console.log(`✅ JIRA Tickets: ${jiraCount?.toLocaleString() || 'ERROR'}`);
  if (jiraError) console.error('   Error:', jiraError.message);
  
  // 4. Test Results
  const { count: testCount, error: testError } = await supabase
    .from('test_results')
    .select('*', { count: 'exact', head: true });
  
  console.log(`✅ Test Results: ${testCount?.toLocaleString() || 'ERROR'}`);
  if (testError) console.error('   Error:', testError.message);
  
  // 5. SIAM Vectors
  const { count: vectorCount, error: vectorError } = await supabase
    .from('siam_vectors')
    .select('*', { count: 'exact', head: true });
  
  console.log(`✅ SIAM Vectors: ${vectorCount?.toLocaleString() || 'ERROR'}`);
  if (vectorError) console.error('   Error:', vectorError.message);
  
  // 6. RLHF Feedback
  const { count: rlhfCount, error: rlhfError } = await supabase
    .from('rlhf_feedback')
    .select('*', { count: 'exact', head: true });
  
  console.log(`✅ RLHF Feedback: ${rlhfCount?.toLocaleString() || 'ERROR'}`);
  if (rlhfError) console.error('   Error:', rlhfError.message);
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`   Total Historical Tests: ${(betaBaseCount || 0).toLocaleString()}`);
  console.log(`   Total Test Results: ${(testCount || 0).toLocaleString()}`);
  console.log(`   Total JIRA Tickets: ${(jiraCount || 0).toLocaleString()}`);
  console.log(`   Total Vector Embeddings: ${(vectorCount || 0).toLocaleString()}`);
}

auditDatabases().catch(console.error);
```

**Action**: 
```bash
npx tsx scripts/audit-database-connectivity.ts
```

**Step 2: Sample Data Inspection** (15 min)
```bash
# See what actual test_results look like
npx tsx -e "
  import { createClient } from '@supabase/supabase-js';
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  supabase.from('test_results').select('*').limit(5).then(({data}) => console.log(JSON.stringify(data, null, 2)));
"
```

**Step 3: Identify Data Quality Issues** (15 min)
- Check for NULL values in critical columns
- Verify date ranges (are tests recent?)
- Check status distribution (how many failed?)

**Expected Outcome**: Clear report on:
- ✅ What databases exist
- ✅ How much data we have
- ✅ Data quality issues to fix
- ✅ Which data can be used for demo

---

## 📅 Phase 1: Foundation (Hours 1-8) - Saturday Morning/Afternoon

### Milestone 1.1: Database Schema Extension (2 hours)

**Objective**: Add self-healing columns and tables

**Tasks**:
- [ ] Create `scripts/audit-database-connectivity.ts` 
- [ ] Run connectivity audit, document results
- [ ] Create `supabase/migrations/010_self_healing_schema.sql`
- [ ] Add columns to `test_results`:
  - `healing_tier`, `healing_confidence`, `healing_status`
  - `healing_strategy`, `healing_time_ms`, `dom_snapshot`
  - `human_reviewed`, `human_reviewer_id`, `reviewed_at`
- [ ] Create `healing_attempts` table
- [ ] Create `hitl_feedback` table
- [ ] Create `healing_stats_24h` view
- [ ] Create indexes for performance
- [ ] Run migration: `npx supabase migration up --local`
- [ ] Verify tables created: Check Supabase dashboard

**Deliverable**: ✅ Schema ready for healing data

### Milestone 1.2: Intelligent Data Seeding (3 hours)

**Objective**: Transform existing test data into three-tier model

**Tasks**:
- [ ] Create `scripts/seed-healing-data.ts`
- [ ] Implement intelligent tier classification:
  ```typescript
  // Tier 1: Simple selector failures (85-98% confidence)
  // Tier 2: Complex/multi-element (62-84% confidence)
  // Tier 3: Multiple related failures (45-60% confidence)
  ```
- [ ] Generate realistic multi-strategy options:
  - ID attribute match
  - Text content match
  - Position-based match
  - CSS class match
  - Visual recognition (mocked)
- [ ] Calculate realistic healing times (1-5s)
- [ ] Create DOM change snapshots
- [ ] Populate `healing_attempts` for recent failed tests
- [ ] Verify distribution: ~90% Tier 1, ~8% Tier 2, ~2% Tier 3
- [ ] Run: `npx tsx scripts/seed-healing-data.ts`
- [ ] Verify counts in Supabase dashboard

**Deliverable**: ✅ ~500-1000 healing attempts with realistic data

### Milestone 1.3: Enhanced Stats Dashboard Component (3 hours)

**Objective**: Build the visual stats grid showing three-tier breakdown

**Tasks**:
- [ ] Create `src/components/test-dashboard/EnhancedStatsGrid.tsx`
- [ ] Implement 6 stat cards:
  - Total Tests (24h)
  - Success Rate
  - Tier 1 (Autonomous) - green
  - Tier 2 (Review) - amber
  - Tier 3 (Architect) - red
  - Avg Heal Time
- [ ] Add real-time Supabase subscriptions
- [ ] Add loading skeletons
- [ ] Style with shadcn/ui + Tailwind
- [ ] Add icons (lucide-react)
- [ ] Wire up to `healing_stats_24h` view
- [ ] Test real-time updates
- [ ] Take screenshot for CapCut

**Deliverable**: ✅ Functional stats dashboard with real data

---

## 📅 Phase 2: Visual Workflows (Hours 9-16) - Saturday Evening / Sunday Morning

### Milestone 2.1: Healing Queue Component (2 hours)

**Objective**: Left panel showing active healing attempts

**Tasks**:
- [ ] Create `src/components/test-dashboard/HealingQueue.tsx`
- [ ] Fetch healing attempts from Supabase
- [ ] Display list with status badges:
  - ✅ Success (green)
  - ⏰ Review (amber)
  - 🚨 Escalated (red)
  - 🔄 Analyzing (blue, animated)
- [ ] Show confidence scores
- [ ] Show healing time for successful attempts
- [ ] Implement click selection
- [ ] Add real-time updates
- [ ] ScrollArea for long lists
- [ ] Style with MAC Design System

**Deliverable**: ✅ Interactive healing queue

### Milestone 2.2: Tier 1 Workflow Viewer (3 hours)

**Objective**: Detailed 6-step visual workflow for autonomous healing

**Tasks**:
- [ ] Create `src/components/test-dashboard/WorkflowViewer.tsx`
- [ ] Build 6-step workflow visualization:
  1. Test Failure Detected (red icon)
  2. Multi-Strategy Analysis (blue, 4 strategies shown)
  3. Confidence Scoring (bar charts 98%, 92%, 78%, 65%)
  4. Auto-Healing Applied (green checkmark)
  5. Healing Successful (celebrate animation)
  6. Feedback Loop (training data logged)
- [ ] Multi-attribute element table:
  - ID, Text, Position, CSS Classes, ARIA, Parent
  - Before/After comparison
- [ ] Code diff viewer:
  - Syntax highlighting
  - Before (red) / After (green)
  - Alternative strategies shown
- [ ] DOM changes panel
- [ ] Execution metadata (time, retries, model)
- [ ] Make it beautiful with animations

**Deliverable**: ✅ Tier 1 workflow that looks SOTA

### Milestone 2.3: Tier 2 HITL Review Panel (2 hours)

**Objective**: Expert approval interface with AI suggestions

**Tasks**:
- [ ] Create `src/components/test-dashboard/HITLReviewPanel.tsx`
- [ ] Show why review is needed (confidence < 85%)
- [ ] Display 3 AI-suggested options:
  - Option A (preferred, 76%)
  - Option B (alternative, 68%)
  - Option C (fallback, 54%)
- [ ] Visual screenshot diff (before/after DOM)
- [ ] Business context panel
- [ ] Approval buttons:
  - ✅ Approve Option A
  - 🔄 Request Changes
  - ❌ Reject & Escalate
- [ ] Show impact: "This will fix 4 similar tests"
- [ ] Wire to `hitl_feedback` table
- [ ] Success toast after approval

**Deliverable**: ✅ HITL interface that demonstrates value

### Milestone 2.4: Tier 3 Architect Escalation (1 hour)

**Objective**: Complex change detection and guided refactoring

**Tasks**:
- [ ] Create escalation criteria display:
  - Multiple interdependent tests (17+)
  - Business logic change detected
  - Breaking change classification
- [ ] Blast radius analysis:
  - Dependency graph (visual)
  - Affected test count
  - Feature areas impacted
- [ ] Guided refactoring workflow:
  - Step 1: Understand integration
  - Step 2: Update fixtures
  - Step 3: Refactor tests (AI + Human)
  - Step 4: Deploy & Monitor
- [ ] Show ROI: "4 hours → 45 minutes"

**Deliverable**: ✅ Tier 3 that shows architectural intelligence

---

## 📅 Phase 3: Integration & Testing (Hours 17-20) - Sunday Afternoon

### Milestone 3.1: Testing Tab Integration (2 hours)

**Tasks**:
- [ ] Create/update `src/app/testing/page.tsx`
- [ ] Integrate all components:
  - EnhancedStatsGrid (top)
  - HealingQueue (left) + WorkflowViewer (right)
  - Tabs for Tier 1/2/3 views
- [ ] Wire up component communication:
  - Queue selection → Workflow display
  - Real-time updates flow through
- [ ] Test navigation flow
- [ ] Verify real-time subscriptions work
- [ ] Polish responsive design
- [ ] Dark mode verification

**Deliverable**: ✅ Fully integrated testing dashboard

### Milestone 3.2: End-to-End Testing (1 hour)

**Tasks**:
- [ ] Test full user flow:
  1. Navigate to Testing tab
  2. See stats update
  3. Click Tier 1 item in queue
  4. View workflow details
  5. Click Tier 2 item
  6. Approve healing
  7. See toast confirmation
- [ ] Test real-time: Insert new healing_attempt, see update
- [ ] Test edge cases: empty queue, loading states
- [ ] Fix any bugs found

**Deliverable**: ✅ Bug-free demo flow

### Milestone 3.3: Demo Rehearsal (1 hour)

**Tasks**:
- [ ] Practice navigating the demo
- [ ] Time each section:
  - Stats overview: 15s
  - Tier 1 demo: 60s
  - Tier 2 demo: 45s
  - Tier 3 demo: 45s
- [ ] Identify awkward transitions
- [ ] Polish any rough edges
- [ ] Prepare talking points

**Deliverable**: ✅ Smooth demo flow

---

## 📅 Phase 4: Production (Hours 21-24) - Sunday Evening

### Milestone 4.1: Screen Recording (2 hours)

**Recording Setup**:
- Tool: QuickTime (⌘+Ctrl+N)
- Resolution: 1920x1080, 30fps
- Browser: Chrome, dark mode, no bookmarks
- Clean terminal (if showing)

**Segments to Record**:
1. **Stats Dashboard Pan** (20s)
   - Slow pan across all 6 cards
   - Pause on Tier distribution
   - Show real-time number update (if possible)

2. **Tier 1 Walkthrough** (90s)
   - Click item in queue
   - Scroll through 6-step workflow
   - Zoom in on confidence scores
   - Show code diff
   - Highlight multi-attribute table

3. **Tier 2 HITL Demo** (60s)
   - Click review item
   - Show AI suggestions
   - Hover over options
   - Click "Approve"
   - Show success toast
   - Show "4 similar tests fixed" message

4. **Tier 3 Escalation** (60s)
   - Click escalated item
   - Show blast radius
   - Scroll through dependency graph
   - Show guided refactoring steps

**Tasks**:
- [ ] Record each segment 2-3 times
- [ ] Choose best take for each
- [ ] Save as: `stats-dashboard.mov`, `tier1.mov`, etc.
- [ ] Move files to `demo-1/recordings/`

**Deliverable**: ✅ 4 high-quality screen recordings

### Milestone 4.2: CapCut Editing (3 hours)

**Import & Setup** (30 min):
- [ ] Open CapCut
- [ ] New Project: "SIAM Self-Healing Demo"
- [ ] Set timeline: 1080p, 30fps
- [ ] Import all `.mov` files
- [ ] Import background music (royalty-free tech ambient)

**Timeline Assembly** (90 min):
- [ ] **Intro** (0:00-0:15):
  - Title card: "The Beta Base - Self-Healing Tests"
  - Fade in (0.5s)
  - Text overlay: "Three-Tier HITL Architecture"
  
- [ ] **Stats** (0:15-0:45):
  - `stats-dashboard.mov`
  - Trim dead space
  - Add zoom on success rate (1.3x)
  - Text: "Real-time metrics from 40K+ tests"
  
- [ ] **Tier 1** (0:45-2:15):
  - `tier1.mov`
  - Speed up slow parts (1.2x)
  - Zoom on confidence scores (1.5x, 1s)
  - Text overlays:
    - "Multi-Strategy Analysis"
    - "98% Confidence = Autonomous"
  
- [ ] **Tier 2** (2:15-3:15):
  - `tier2.mov`
  - Zoom on approval button
  - Text: "Human-in-the-Loop Quality Control"
  - Highlight "4 similar tests" callout
  
- [ ] **Tier 3** (3:15-4:15):
  - `tier3.mov`
  - Text: "Architect Escalation + AI Guidance"
  - Show "4 hours → 45 minutes"
  
- [ ] **Closing** (4:15-4:30):
  - Return to title card
  - Three checkmarks: Tier 1 ✓, Tier 2 ✓, Tier 3 ✓
  - Fade out

**Polish** (60 min):
- [ ] Add transitions: Crossfade 0.5s between sections
- [ ] Add background music: -22dB, fade in/out
- [ ] Text overlays: Inter font, 48px, white + shadow
- [ ] Color grade: Brightness +5, Contrast +10
- [ ] Add subtle vignette
- [ ] Review pacing (should feel deliberate, not rushed)

**Export**:
- [ ] Resolution: 1080p
- [ ] Frame Rate: 30fps
- [ ] Codec: H.264
- [ ] Bitrate: 12-15 Mbps
- [ ] Filename: `siam-self-healing-demo-2025-11-24.mp4`

**Deliverable**: ✅ 4-5 minute polished demo video

---

## ✅ Success Criteria

### Technical Excellence
- [ ] All three tiers clearly demonstrated
- [ ] Stats show real data from Supabase
- [ ] Confidence scores feel authentic (not all 99%)
- [ ] Real-time updates work smoothly
- [ ] UI is polished with MAC Design System
- [ ] No console errors visible

### Demonstration Impact
- [ ] Tier distribution (90/8/2) is evident
- [ ] Multi-strategy healing is visualized
- [ ] HITL value proposition is clear
- [ ] Research citations add authority
- [ ] Video pacing is professional
- [ ] Leaves audience wanting to try it

### Production Quality
- [ ] Video is 1080p, high bitrate
- [ ] Audio is clear (no background noise)
- [ ] Text overlays add context
- [ ] Transitions are smooth
- [ ] Music enhances (doesn't distract)
- [ ] Total runtime: 4-6 minutes

---

## 🚨 Risk Mitigation

### If Database Connection Fails
**Plan B**: Use local SQLite with seeded data
- Switch to mock data generator
- Still shows UI sophistication
- Explain "demo environment" in narration

### If Components Don't Render
**Plan C**: Static screenshots + voiceover
- Take high-res screenshots of Figma mockups
- Use static images in CapCut
- Strong voiceover carries the narrative

### If Time Runs Short
**Phase Priority**:
1. **Must Have**: Stats dashboard + Tier 1 workflow
2. **Should Have**: Tier 2 HITL interface
3. **Nice to Have**: Tier 3 escalation

---

## 📋 Daily Checkpoint

### Saturday End-of-Day (Hour 16)
**Review**:
- [ ] Database schema deployed?
- [ ] Data seeded with realistic distributions?
- [ ] At least Tier 1 workflow functional?
- [ ] Screenshots taken for backup?

**Decision Point**: Are we on track for Sunday recording?

### Sunday Afternoon (Hour 20)
**Review**:
- [ ] All components integrated?
- [ ] Demo rehearsal completed?
- [ ] Recording environment ready?

**Decision Point**: Ready to record, or need more polish?

---

## 🎯 Next Actions (Right Now)

### Step 1: Database Connectivity Audit (Priority #1)
```bash
# Create audit script
npx tsx scripts/audit-database-connectivity.ts

# Expected output:
✅ Beta Base Scenarios: 40,247
✅ Beta Base Executions: 156,932
✅ JIRA Tickets: 1,247
✅ Test Results: 892
✅ SIAM Vectors: 3,421
```

### Step 2: Review Audit Results
- Identify which tables are accessible
- Confirm data volumes
- Note any connection errors
- Document in audit report

### Step 3: Choose Starting Point
Based on audit results, we'll choose:
- **Option A**: Schema extension (if connections work)
- **Option B**: Fix connections first (if errors found)
- **Option C**: Mock-first approach (if major issues)

---

## 📞 Context Window Handoff Protocol

When we lose context, create new chat with:

**Subject**: `SIAM Demo Phase [X] - [Milestone]`

**Handoff Message**:
```
Continuing SIAM self-healing demo build.

Current Phase: [X]
Last Milestone Completed: [Description]
Current Working Directory: /Users/matt/Documents/projects/siam

Reference Documents:
- Implementation Plan: docs/demo/TWO-DAY-DEMO-BUILD-GUIDE.md
- Enhanced Walkthrough: docs/demo/SOTA-NORTHSTAR-DEMO-WALKTHROUGH-ENHANCED.md

Next Tasks:
1. [Task from plan]
2. [Task from plan]

Ready to continue!
```

---

**Let's start with the database audit! Ready?** 🚀

*À ton service, mon ami!* 💜
