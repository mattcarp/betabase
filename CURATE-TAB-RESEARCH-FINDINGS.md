# Curate Tab Enhancement - Research Findings
**Date**: 2025-12-18  
**Researcher**: Claudette (Long-Running Agent Session)  
**Purpose**: Comprehensive analysis for SpecKit-driven Curate tab improvement

---

## Executive Summary

The Curate tab is currently functional but suffers from:
1. **Visual Sparseness** - Missing data/analytics displays
2. **Non-functional Elements** - Some buttons/features appear broken
3. **MAC Design Compliance** - Previous audit achieved 9.8/10 but implementation needs verification
4. **Deduplication UX** - Logic is solid but not well-explained to users in demo
5. **RLHF Integration** - Partially complete, missing 2 of 3 tabs

---

## Current State Analysis

### Tab Structure (5 tabs total)
1. **Queue** (active by default) - Curator queue with RLHF feedback items
2. **Files** - Knowledge base file management
3. **Upload** - File upload interface  
4. **Info** - Vector store information
5. **RLHF** - RLHF feedback collection (permission-gated)

### Visual Observations from Screenshot

**Queue Tab (Current View)**:
- ✅ Beautiful glassmorphism card
- ✅ MAC-compliant typography (font-light)
- ✅ Curator Queue with 50 items, filter buttons (All, High Priority)
- ✅ "Feedback Impact" panel on right showing:
  - ↗️ +60% this month improvement
  - 0 Corrections, 0 Tests Created, 0 Training Batches
  - 83% Current Accuracy progress bar
  - Correction → Test Case → Training → Better AI workflow
  - "Recent Corrections" section (empty)
- ⚠️ Sample queue items visible but statistics show zeros
- ⚠️ Empty state in review details panel

**What Looks Sparse/Broken**:
1. All Impact metrics show 0 (Corrections, Tests, Training Batches)
2. "Recent Corrections" section is empty
3. +60% improvement claim contradicts "Improved from 83% to 83%"
4. Review details panel has "Select an item to review" placeholder

---

## Deduplication Logic - How It Works

### Multi-Layered Deduplication Strategy

Based on `src/services/deduplicationService.ts` and `/api/knowledge/deduplicate/route.ts`:

#### 1. **Source ID Exact Match** (Fastest - O(1))
```typescript
// Checks: source_type + source_id within tenant context
// Example: "jira:ITSM-55968" already exists
// Result: SHOULD UPDATE (not insert duplicate)
```

#### 2. **Content Hash Match** (Fast - O(1))
```typescript
// SHA-256 hash of normalized content
// Removes whitespace, converts to lowercase
// Example: Two files with identical text → detected as duplicate
```

#### 3. **URL Normalization** (Fast - O(1))
```typescript
// Removes query params, trailing slashes, fragments
// Example:
//   "https://docs.com/guide?ref=123" 
//   → "https://docs.com/guide"
```

#### 4. **Semantic Similarity** (Slower - O(n) vector search)
```typescript
// Uses vector embeddings (Gemini or OpenAI)
// Default threshold: 0.95 (95% similar)
// Example: "How to configure AOMA" vs "AOMA configuration guide"
//   → cosine similarity = 0.96 → DUPLICATE
```

### Tenant-Scoped Deduplication

**CRITICAL**: All deduplication operates WITHIN tenant context:
- `organization` (e.g., "sony-music")
- `division` (e.g., "mso")
- `app_under_test` (e.g., "aoma")

This prevents cross-contamination between different clients/projects.

### API Endpoints

**POST `/api/knowledge/deduplicate`**
- Dry run by default (`dryRun: true`)
- Parameters:
  - `dryRun` - Preview duplicates without deleting
  - `keepNewest` - Keep most recent version
  - `contentSimilarityThreshold` - Default 0.95
  - `sourceType` - Optional filter (e.g., only "knowledge" docs)

**Usage in Dec 2025 Session**:
- Deleted 96 Firecrawl docs (captured raw CSS/HTML garbage)
- Cleaned 55 duplicate chunks after re-chunking knowledge docs
- Left 1,191 optimal knowledge chunks + 4,247 git commits

---

## MAC Design System Compliance Status

### Previous Audit Score: 9.8/10 (2025-10-11)

From `docs/CURATE_TAB_MAC_AUDIT.md`:

**Fixed Violations**:
- ✅ 100% MAC color token usage (`--mac-*` CSS variables)
- ✅ Typography: only font-light (300) and font-normal (400)
- ✅ Glassmorphism on tabs, dialogs, cards
- ✅ Professional lift hover effects with shadows
- ✅ MAC-themed checkboxes
- ✅ 150-300ms transitions with proper easing
- ✅ 8px spacing grid compliance
- ✅ Status badges using MAC classes

**Need to Verify in Current Build**:
1. Files tab functionality (was broken by React 19 + Radix infinite loop)
2. Glassmorphism rendering correctly
3. Hover states on file items
4. Delete dialog appearance
5. Badge colors matching MAC status badges

---

## RLHF Integration Completeness

### What's Complete ✅

From `RLHF-CURATE-INTEGRATION-COMPLETE.md`:

1. **Backend Services** (100%)
   - `unifiedRAGOrchestrator.ts` - RLHF-aware retrieval
   - `geminiReranker.ts` - Document re-ranking
   - `agenticRAG/agent.ts` - Agentic retrieval
   - Permission system with RBAC (`usePermissions` hook)

2. **Database Schema** (100%)
   - `user_roles` and `role_permissions` tables
   - `rlhf_feedback` table
   - `retrieval_reinforcement` table  
   - Gemini embeddings support

3. **RLHF Feedback Tab** (100%)
   - Beautiful Mac-inspired UI with glassmorphism
   - Thumbs up/down quick actions
   - 5-star rating system
   - Detailed feedback textarea
   - Document relevance marking
   - Real-time optimistic updates

4. **Curator Queue Component** (100%)
   - File: `src/components/ui/CuratorQueue.tsx`
   - 50 items shown, All/High Priority filters
   - Fetch from `/api/rlhf/feedback` endpoint

5. **Feedback Impact Card** (100%)
   - File: `src/components/ui/FeedbackImpactCard.tsx`
   - Shows corrections drive continuous improvement
   - Correction → Test Case → Training → Better AI workflow

### What's Missing/Incomplete ⚠️

From RLHF docs, these tabs were **spec'd but NOT implemented**:

1. **Agent Insights Tab** (0%)
   - **Purpose**: Visualize agent decision-making process
   - **Key Features**:
     - Decision flow diagram (Interactive flowchart)
     - Confidence timeline (Line chart)
     - Tool usage breakdown (Bar chart)
     - Execution metrics (Time per step, iterations)
     - Clickable decision nodes with full reasoning
   - **Tech Stack**: React Flow or Mermaid.js + Recharts
   - **Data Source**: `agent_execution_logs` table (may not exist)

2. **Reinforcement Dashboard Tab** (0%)
   - **Purpose**: Show how system is learning from feedback
   - **Key Metrics**:
     - Learning progress over time
     - Quality improvement (before/after comparison)
     - Source type weights (boost/penalty by source)
     - Topic analysis (most improved vs problematic)
     - Curator leaderboard
   - **Charts**:
     - Feedback over time (Area chart)
     - Quality trend (Line chart)
     - Source weight heatmap (Bar chart)
     - Topic cloud (Word cloud sized by feedback count)
   - **Data Source**: `rlhf_feedback` + `retrieval_reinforcement` tables

3. **Model Registry Panel** (Partial - 50%)
   - File exists: `src/components/ui/rlhf-tabs/ModelRegistryPanel.tsx`
   - Unknown if wired up or functional

4. **Training Datasets Panel** (Partial - 50%)
   - File exists: `src/components/ui/rlhf-tabs/TrainingDatasetsPanel.tsx`
   - Unknown if wired up or functional

5. **Fine-Tuning Jobs Panel** (Partial - 50%)
   - File exists: `src/components/ui/rlhf-tabs/FineTuningJobsPanel.tsx`
   - Unknown if wired up or functional

---

## Known Issues & Technical Debt

### 1. React 19 + Radix UI Infinite Loop (RESOLVED)

From `HANDOFF-2025-12-16-curate-files-infinite-loop.md` and `claude-progress.txt` Session 2025-12-17 07:05:

**Problem**: "Maximum update depth exceeded" on Files tab
**Root Cause**: React 19.2.3 ref cleanup + Radix UI `composeRefs` recursion
**Solution Applied**: Switched from `CleanCurateTab` to `CurateTab` in `ChatPage.tsx`
  - `CurateTab.tsx` uses native HTML tabs (React 19 compatible)
  - `CleanCurateTab.tsx` had problematic Radix components

**Status**: ✅ FIXED (committed 2025-12-17)

### 2. Mock Data vs Real Data

**Current State**:
- Queue items: REAL (50 items from `/api/rlhf/feedback`)
- Feedback Impact metrics: MOCK (hardcoded zeros)
- Agent Insights: NOT IMPLEMENTED
- Reinforcement Dashboard: NOT IMPLEMENTED

**For Demo**:
- Need to populate real corrections, test cases, training batches
- OR create realistic mock data that doesn't show contradictory zeros

### 3. Incomplete RLHF Tab Integration

From `RLHF-CURATE-INTEGRATION-COMPLETE.md` (line 360):

> ### Immediate (Before Launch)
> 1. ✅ Core Implementation - Complete
> 2. ✅ RLHF Feedback Tab - Complete
> 3. 🔄 Complete Integration - Add tabs to CurateTab.tsx (5 min task)
> 4. 🔄 Agent Insights Tab - Implement flowchart visualization (2-3 hours)
> 5. 🔄 Reinforcement Dashboard Tab - Implement charts (2-3 hours)

**Status**: Stuck at step 3 - tabs NOT added to `CurateTab.tsx`

---

## What Users Can't See But Should (For Demo)

### 1. Deduplication Intelligence

Users don't see:
- **WHY** something was marked as duplicate (content hash? semantic? URL?)
- **WHAT** was kept vs removed (which version was newer?)
- **SAVINGS** from deduplication (201 MB before → X MB after)

**Demo Opportunity**: 
- Visual before/after comparison
- "Smart Deduplication" badge showing algorithm used
- Storage savings metric (GB saved, % reduction)

### 2. Multi-Tenant Isolation

Users don't see:
- Deduplication happens WITHIN their org/division/app context
- No cross-contamination between Sony vs Universal vs Warner

**Demo Opportunity**:
- "Tenant-Safe Deduplication" badge
- Security/privacy message: "Your data never crosses tenants"

### 3. RLHF Learning Loop

Users see queue items but don't see:
- HOW their corrections improve the AI
- WHICH documents get boosted/penalized
- TIMELINE of quality improvement

**Demo Opportunity**:
- Reinforcement Dashboard showing learning curve
- Before/after quality scores for corrected queries
- Top improved topics (e.g., "authentication" went from 60% → 90%)

---

## Improvement Opportunities

### 1. Visual Density (High Priority)

**Problem**: Large empty spaces, zero metrics look broken

**Solutions**:
1. Populate Feedback Impact with real or realistic mock data
2. Add Dashboard tab (from `EnhancedCurateTab.tsx` - already exists!)
   - Real-time KPI cards
   - Document processing trends
   - Quality metrics heatmap
3. Add Analytics tab (similar to Test tab analytics)
4. Show knowledge base stats (104 files, 201.3 MB) prominently

### 2. Deduplication UX (High Priority for Demo)

**Problem**: Can't explain HOW deduplication works during demo

**Solutions**:
1. Add "Deduplication" tab showing:
   - Duplicate groups found (with reason: exact hash, semantic, URL)
   - Preview of kept vs removed content
   - Run dedupe with live progress bar
   - Before/after stats
2. Smart badges on files: "Deduplicated (3 versions merged)"
3. Timeline showing deduplication runs

### 3. RLHF Completion (Medium Priority)

**Problem**: 2 of 3 RLHF tabs missing (Agent Insights, Reinforcement Dashboard)

**Solutions**:
1. Implement Agent Insights with Mermaid diagrams
2. Implement Reinforcement Dashboard with Recharts
3. Wire up existing panels (Model Registry, Training Datasets, Fine-Tuning Jobs)
4. Add sub-tabs to RLHF tab for better organization

### 4. MAC Design Verification (Low Priority - Already High Score)

**Problem**: Can't verify if previous 9.8/10 audit fixes are still applied

**Solutions**:
1. Run MAC Design Compliance Auditor skill (`.claude/skills/mac-design-compliance-auditor/`)
2. Visual regression test with Playwright
3. Manual checklist from `docs/CURATE_TAB_MAC_AUDIT.md` (lines 237-264)

---

## Recommended SpecKit Feature Scope

### Option 1: Comprehensive Overhaul (Large Feature)
**Duration**: 6-8 hours across 2-3 sessions  
**Scope**:
- Complete RLHF tabs (Agent Insights + Reinforcement Dashboard)
- Add Deduplication tab with visual intelligence
- Populate all metrics with real/mock data
- Add Dashboard tab from EnhancedCurateTab
- Full MAC compliance verification
- E2E Playwright tests

### Option 2: Demo-Ready Polish (Medium Feature)
**Duration**: 3-4 hours in 1-2 sessions  
**Scope**:
- Fix Feedback Impact metrics (no more zeros)
- Add visual deduplication explainer
- Implement 1 of 2 missing RLHF tabs (Reinforcement Dashboard priority)
- Manual MAC compliance check
- Basic smoke tests

### Option 3: Critical Fixes Only (Small Feature)
**Duration**: 1-2 hours in 1 session  
**Scope**:
- Replace zero metrics with realistic mock data
- Add deduplication explanation tooltips
- Verify Files tab works without errors
- Quick visual check for MAC compliance

---

## Recommendation

**Go with Option 2: Demo-Ready Polish** because:
1. You want to explain deduplication in demo → Need visual explainer
2. Zero metrics look broken → Hurts credibility
3. Reinforcement Dashboard shows AI learning → Great demo value
4. MAC compliance already high → Just verify, don't re-implement
5. Fits in 3-4 hours → Manageable for long-running feature

---

## Files for Reference

| File | Purpose | Lines |
|------|---------|-------|
| `src/components/ui/CurateTab.tsx` | Current active implementation | 1,113 |
| `src/components/ui/CleanCurateTab.tsx` | React 19 problematic version (unused) | 1,716 |
| `src/components/ui/CuratorQueue.tsx` | Queue component | 549 |
| `src/components/ui/FeedbackImpactCard.tsx` | Impact metrics card | ~200 |
| `src/components/ui/rlhf-tabs/RLHFFeedbackTab.tsx` | RLHF feedback UI | ~400 |
| `src/services/deduplicationService.ts` | Dedupe logic | 439 |
| `src/app/api/knowledge/deduplicate/route.ts` | Dedupe API | 256 |
| `docs/CURATE_TAB_MAC_AUDIT.md` | MAC compliance audit | 352 |
| `RLHF-CURATE-INTEGRATION-COMPLETE.md` | RLHF integration spec | 430 |
| `docs/CURATION_SUMMARY.md` | Enhanced Curate Tab summary | 210 |

---

## ByteRover Knowledge Tags

`#curate-tab` `#rlhf` `#deduplication` `#mac-design` `#knowledge-management` `#demo-prep` `#long-running-feature` `#speckit`

---

**Next Step**: Create SpecKit feature specification in `specs/SIAM/features/` directory



