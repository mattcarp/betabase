# Feature Specification: Test Intelligence Redesign (FEAT-017)

## Overview

Redesign the Test mode features (Historical Test Explorer and AI Test Generator) to follow MAC Design System principles, ensuring a beautiful, professional, data-storytelling interface that showcases the thousands of betabase tests with confidence scoring and natural language test generation.

**Status**: Draft
**Priority**: P1 (Demo Quality)
**Owner**: Engineering
**Target**: January 2026

---

## Problem Statement

The Test mode features are functional but need visual polish:

1. **Data Loading Inconsistency**: Stats show "0" initially, then populate - creates jarring experience
2. **Generic UI**: Current design doesn't fully embrace MAC Design System data-storytelling principles
3. **Confidence Scores**: Need more visual prominence and explanation
4. **AI Generator**: Input area could be more inviting and professional
5. **Infinite Scroll**: Needs smoother loading states and better visual feedback

---

## Design Principles Applied

### From MAC Design System

1. **Data-Ink Ratio**: Remove non-essential visual elements (Tufte's principle)
2. **Typography as Hierarchy**: Big numbers tell the story, small text provides context
3. **Muted Professional Colors**: Use `--mac-data-coral`, `--mac-data-teal` palette
4. **Dark Mode Excellence**: All components optimized for professional dark environments
5. **Geometric Simplicity**: Clean shapes, modular grids

### From F012-Test-Intelligence Spec

1. **Automation Confidence Scoring**: 0-100% based on script depth and metadata
2. **Dual-Mode Artifact View**: Human-readable and automated code toggle
3. **HITL Critique Panel**: For script refinement
4. **Tufte-Inspired Polish**: High density, professional palette

---

## Design Requirements

### REQ-017-01: Historical Test Explorer Redesign

**Current State**:
- Left panel: Test list with IDs and names
- Right panel: Detail view with stats
- Confidence badges: Small, not prominent

**Target State**:

```
+------------------------------------------+----------------------------------------+
|  HISTORICAL TESTS                   8,739|  PROJECT TITLE                         |
|  ========================================|  ====================================  |
|                                          |                                        |
|  [Search: Filter by name, script...]     |  VAULT:// ID-56531 | PARTNER PREVIEWER |
|  [App: All v] [Status: All v]            |                                        |
|                                          |  +----------------------------------+  |
|  +--------------------------------------+|  |  AUTOMATION CONFIDENCE           |  |
|  | #56531 Project Title                 ||  |                                  |  |
|  | PARTNER PREVIEWER          [76%] [M] ||  |         76%                      |  |
|  | Last run: 2 days ago       11 runs   ||  |   +----------------------+       |  |
|  +--------------------------------------+|  |   |||||||||||||||||     |       |  |
|  | #33118 Album (+7) Tracks             ||  |   +----------------------+       |  |
|  | PARTNER PREVIEWER          [82%] [H] ||  |                                  |  |
|  | Last run: 1 day ago        24 runs   ||  |   Script Depth: +20              |  |
|  +--------------------------------------+|  |   Context: +15                   |  |
|  | #22688 EP (4-6 Tracks)               ||  |   Stability: +10                 |  |
|  | PARTNER PREVIEWER          [45%] [L] ||  |   Visual Penalty: -15            |  |
|  | Last run: 5 days ago       3 runs    ||  +----------------------------------+  |
|  +--------------------------------------+|                                        |
|                                          |  EXECUTION SUMMARY                     |
|  [Loading more...]                       |  +--------+--------+--------+         |
|                                          |  | RUNS   | PASS   | JIRA   |         |
+------------------------------------------+  | 11     | 100%   | 0      |         |
                                              +--------+--------+--------+         |
                                                                                   |
                                              [Generate Script] [AI Analysis]      |
                                           +---------------------------------------+
```

**Visual Specifications**:

1. **Confidence Badge**:
   - Large circular gauge (120px diameter) in detail panel
   - Arc stroke: 8px, background `--mac-data-zinc-800`, foreground `--mac-data-coral`
   - Center number: 48px, font-weight 200
   - Small breakdown below showing score components

2. **Test List Items**:
   - Height: 72px per item
   - Hover: `bg-[rgba(255,255,255,0.04)]`
   - Selected: Left border accent `--mac-data-teal` (3px)
   - Confidence mini-badge: Pill with H/M/L indicator + percentage

3. **Stats Cards**:
   - Remove borders, use subtle background `bg-card`
   - Large numbers: 36px, font-weight 200, `--mac-data-zinc-100`
   - Labels: 12px uppercase, letter-spacing 0.1em, `--mac-data-zinc-400`

### REQ-017-02: AI Test Generator Redesign

**Current State**:
- Basic textarea for input
- Sample output card on right
- Trending topics section

**Target State**:

```
+------------------------------------------+----------------------------------------+
|  AI TEST GENERATOR                       |  GENERATED TEST                        |
|  ========================================|  ====================================  |
|                                          |                                        |
|  Describe what you want to test          |  Authentication Flow Test              |
|  +--------------------------------------+|  ------------------------------------  |
|  |                                      ||                                        |
|  | Test that users can successfully     ||  Comprehensive test for user           |
|  | upload and process PDF documents     ||  authentication including login,       |
|  | with automatic text extraction...    ||  logout, and session management.       |
|  |                                      ||                                        |
|  +--------------------------------------+|  +----------------------------------+  |
|                                          |  | import { test, expect } from     |  |
|  TEST TYPE        LANGUAGE               |  | '@playwright/test';              |  |
|  [E2E v]          [TypeScript v]         |  |                                  |  |
|                                          |  | test('authentication flow', ...  |  |
|  QUICK SUGGESTIONS                       |  +----------------------------------+  |
|  +--------------------------------------+|                                        |
|  | [Auth Flow] [File Upload] [API]     ||  [Copy] [Export .spec.ts] [Run Test]  |
|  | [Streaming] [Error States]          ||                                        |
|  +--------------------------------------+|  COVERAGE ANALYSIS                     |
|                                          |  +----------------------------------+  |
|  TRENDING TOPICS (ZEITGEIST)    [Live]   |  | Login: Covered                   |  |
|  +--------------------------------------+|  | Logout: Covered                  |  |
|  | Partner Previewer Issues (24 today) ||  | Session Timeout: Partial         |  |
|  | Metadata Sync Failures (12 today)   ||  | Remember Me: Not covered         |  |
|  +--------------------------------------+|  +----------------------------------+  |
|                                          |                                        |
|  [Generate Test]                         |  AI SUGGESTIONS                        |
|                                          |  - Add test for expired session        |
+------------------------------------------+  - Consider negative login cases       |
                                           +---------------------------------------+
```

**Visual Specifications**:

1. **Input Textarea**:
   - Min-height: 120px
   - Background: `bg-card`
   - Border: `border-border` (1px)
   - Focus: Blue glow `0 0 0 3px rgba(74, 158, 255, 0.2)`
   - Placeholder: `text-muted-foreground`, italic

2. **Quick Suggestions**:
   - Pill buttons with `bg-muted`, hover `bg-muted/80`
   - Gap: 8px
   - Font-size: 12px

3. **Generated Code**:
   - Syntax highlighting with muted colors
   - Background: `bg-[#0c0c0c]`
   - Border-radius: 8px
   - Copy button: Top-right corner, ghost style

4. **Generate Button**:
   - Primary gradient: `linear-gradient(135deg, var(--mac-primary-blue-400), var(--mac-accent-purple-400))`
   - Width: 100%
   - Height: 48px
   - Font-weight: 400

### REQ-017-03: Loading States

**Skeleton Screens**:
- Use `mac-shimmer` animation
- Match exact shape of content being loaded
- Duration: 2s infinite

**Progressive Loading**:
- Show first 20 items immediately
- Load remaining in background
- Infinite scroll trigger: 200px from bottom
- Loading indicator: Subtle spinner, not blocking

### REQ-017-04: Stats Dashboard Polish

**KPI Cards**:
```css
.mac-kpi-card {
  background: transparent;
  padding: 16px 24px;
  border-right: 1px solid var(--mac-utility-border);
}

.mac-kpi-value {
  font-size: 36px;
  font-weight: 200;
  color: var(--mac-text-primary);
  font-variant-numeric: tabular-nums;
}

.mac-kpi-label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--mac-text-muted);
}
```

**Semantic Colors for Stats**:
- Pass Rate > 80%: `--mac-data-teal`
- Pass Rate 50-80%: `--mac-data-coral`
- Pass Rate < 50%: `--mac-data-error`
- Failed > 0: `--mac-data-error`

---

## Implementation Plan

### Phase 1: Foundation (2 hours)
1. Create MAC-specific stat card components
2. Implement confidence gauge component
3. Add skeleton loading states

### Phase 2: Historical Explorer (3 hours)
1. Redesign test list items with confidence badges
2. Implement large confidence gauge in detail panel
3. Add score breakdown explanation
4. Polish infinite scroll with smooth loading

### Phase 3: AI Generator (2 hours)
1. Redesign input area with proper spacing
2. Add quick suggestion pills
3. Implement code preview with syntax highlighting
4. Add coverage analysis section

### Phase 4: Polish (1 hour)
1. Ensure all colors use design system variables
2. Add micro-animations on state changes
3. Test responsive behavior
4. Verify accessibility (contrast, focus states)

---

## Acceptance Criteria

- [ ] No hardcoded colors (zinc-*, gray-*, hex values)
- [ ] All stats show skeleton loading before data arrives
- [ ] Confidence scores prominently displayed with explanation
- [ ] Infinite scroll loads smoothly without jarring jumps
- [ ] AI Generator has professional, inviting input area
- [ ] Quick suggestions help users get started
- [ ] Generated code has syntax highlighting
- [ ] All buttons follow MAC button hierarchy
- [ ] Passes WCAG AA contrast requirements
- [ ] No console errors during normal operation

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to first meaningful paint | < 1s |
| Infinite scroll smoothness | 60fps |
| Design system compliance | 100% |
| Accessibility score | 90+ |
| Demo feedback | "Beautiful, not AI slop" |

---

*Specification created: 2026-01-07*
*Based on: F012-test-intelligence, 001-testing-tab-transformation, MAC Design Principles*
