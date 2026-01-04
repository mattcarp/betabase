# Theme Prep Audit: Hardcoded Color Violations

**Generated**: 2025-01-03
**Purpose**: Prepare codebase for light/dark theme switcher
**Goal**: Replace hardcoded colors with CSS variables (preserve visual appearance)

## Executive Summary

| Category | Count | Priority |
|----------|-------|----------|
| Text colors (`text-zinc-*`, `text-gray-*`) | 853 | High |
| Background colors (`bg-zinc-*`, `bg-gray-*`) | 419 | High |
| Border colors (`border-zinc-*`, `border-gray-*`) | 312 | Medium |
| Hover/focus states | 44 | Low |
| Arbitrary hex values (`bg-[#...]`) | 87 | Medium |
| **Total violations** | **1,715** | - |

## Color Mapping Reference

Use this table when refactoring. The replacements maintain the same visual appearance in dark mode.

### Background Colors

| Find | Replace With | Visual Result |
|------|--------------|---------------|
| `bg-zinc-950` | `bg-background` | Near black (#0a0a0a) |
| `bg-zinc-900` | `bg-card` or `bg-secondary` | Dark gray (#141414) |
| `bg-zinc-900/50` | `bg-card/50` | Semi-transparent dark |
| `bg-zinc-900/30` | `bg-card/30` | More transparent |
| `bg-zinc-800` | `bg-muted` | Elevated surface |
| `bg-zinc-800/50` | `bg-muted/50` | Semi-transparent |
| `bg-gray-800` | `bg-card` | Dark gray |
| `bg-gray-700` | `bg-muted` | Elevated |
| `bg-gray-700/50` | `bg-muted/50` | Semi-transparent |

### Text Colors

| Find | Replace With | Visual Result |
|------|--------------|---------------|
| `text-zinc-100` | `text-foreground` | White/near-white |
| `text-zinc-200` | `text-foreground` | White |
| `text-zinc-300` | `text-foreground` | White |
| `text-zinc-400` | `text-muted-foreground` | Gray (#b3b3b3) |
| `text-zinc-500` | `text-muted-foreground` | Gray |
| `text-gray-300` | `text-foreground` | White |
| `text-gray-400` | `text-muted-foreground` | Gray |
| `text-gray-500` | `text-muted-foreground` | Gray |

### Border Colors

| Find | Replace With | Visual Result |
|------|--------------|---------------|
| `border-zinc-700` | `border-border` | Subtle border |
| `border-zinc-700/50` | `border-border/50` | Very subtle |
| `border-zinc-800` | `border-border` | Subtle border |
| `border-zinc-800/50` | `border-border/50` | Very subtle |
| `border-gray-600` | `border-input` | Input border |
| `border-gray-700` | `border-border` | Subtle border |

### Interactive States

| Find | Replace With |
|------|--------------|
| `hover:bg-zinc-800` | `hover:bg-accent` or `hover:bg-muted` |
| `hover:bg-zinc-700` | `hover:bg-accent` |
| `hover:bg-gray-700` | `hover:bg-accent` |
| `hover:bg-gray-700/50` | `hover:bg-accent/50` |
| `hover:text-zinc-100` | `hover:text-foreground` |
| `hover:text-white` | `hover:text-foreground` |
| `hover:border-zinc-700` | `hover:border-input` |
| `focus:border-blue-600` | `focus:border-ring` or `focus:ring-ring` |
| `focus:ring-zinc-*` | `focus:ring-ring` |

---

## Files by Violation Count (Top 30)

### Critical (30+ violations) - Fix First

| File | Count | Primary Issues |
|------|-------|----------------|
| `src/components/ui/RLHFCuratorDashboard.tsx` | 52 | bg-zinc-950, text-zinc-*, border-zinc-* |
| `src/components/rlhf/FeedbackAnalytics.tsx` | 49 | bg-zinc-*, text-zinc-* |
| `src/components/rlhf/CuratorWorkspace.tsx` | 49 | bg-zinc-*, text-zinc-* |
| `src/components/ui/ResponseDebugger.tsx` | 43 | bg-zinc-*, text-zinc-* |
| `src/components/SettingsPanel.tsx` | 38 | bg-gray-*, text-gray-*, border-gray-* |
| `src/app/performance/page.tsx` | 38 | Mixed zinc/gray + hex |
| `src/renderer/components/settings/McpSettings.tsx` | 37 | bg-zinc-*, text-zinc-* |
| `src/components/ui/CleanCurateTab.tsx` | 33 | bg-zinc-*, text-zinc-* |
| `src/components/ui/SearchResultsResponse.tsx` | 32 | bg-zinc-*, text-zinc-* |
| `src/components/ui/pages/ChatPage.tsx` | 31 | bg-zinc-*, text-zinc-* |
| `src/components/ai/demo-enhancements/RAGContextViewer.tsx` | 30 | bg-zinc-*, text-zinc-* |

### High (20-29 violations)

| File | Count |
|------|-------|
| `src/components/ui/ResponseRenderer.tsx` | 29 |
| `src/components/ui/RAGComparisonCard.tsx` | 29 |
| `src/components/rlhf/FeedbackModal.tsx` | 28 |
| `src/components/rlhf/ComparisonPanel.tsx` | 28 |
| `src/components/ui/FeedbackTimeline.tsx` | 27 |
| `src/components/ui/AudioWaveformResponse.tsx` | 26 |
| `src/components/ui/QuickFixPanel.tsx` | 22 |
| `src/components/rlhf/FeedbackImpactLive.tsx` | 22 |
| `src/components/ui/TopicVisualization.tsx` | 20 |
| `src/components/ui/TestCaseGenerator.tsx` | 20 |
| `src/components/ui/RLHFFeedbackTab.tsx` | 20 |

### Medium (10-19 violations)

| File | Count |
|------|-------|
| `src/components/AIInsightsDashboard.tsx` | 17 |
| `src/components/ai/ai-sdk-chat-panel.tsx` | 15 |
| `src/components/ui/ProfessionalProgress.tsx` | 14 |
| `src/ComponentPlayground.tsx` | 14 |
| `src/app/sessions/page.tsx` | 14 |
| `src/app/demo/self-healing/SelfHealingDemo.tsx` | 14 |
| `src/components/rlhf/FeedbackBadge.tsx` | 11 |
| `src/components/ConversationalAI.tsx` | 11 |
| `src/components/ai/FeedbackSegueDialog.tsx` | 11 |
| `src/components/ai/demo-enhancements/DemoMode.tsx` | 11 |

### Low (5-9 violations) - Quick Wins

| File | Count |
|------|-------|
| `src/components/ui/rlhf-tabs/AgentInsightsTab.tsx` | 9 |
| `src/components/rlhf/CuratorWorkspaceContainer.tsx` | 9 |
| `src/components/auth/MagicLinkLoginForm.tsx` | 9 |
| `src/components/ai/demo-enhancements/SourceCard.tsx` | 9 |
| `src/components/ui/DashboardTab.tsx` | 8 |
| `src/components/LoadingStates.tsx` | 8 |
| `src/components/DocumentUpload.tsx` | 8 |
| `src/components/LiveTranscription.tsx` | 7 |
| `src/components/ui/FloatingPanel.tsx` | 6 |
| `src/components/sessions/SessionCard.tsx` | 6 |
| `src/components/ai/demo-enhancements/HeroMetricsStrip.tsx` | 6 |

---

## Hex Color Violations (Separate Category)

These files use arbitrary Tailwind values like `bg-[#1a1a2e]`:

| File | Count | Notes |
|------|-------|-------|
| `src/app/style-guide/page.tsx` | 103 | Style guide - expected |
| `src/components/ai-elements/mermaid-diagram.tsx` | 30 | Diagram theming |
| `src/app/performance/page.tsx` | 24 | Mixed with zinc |
| `src/lib/mac-chart-theme.ts` | 17 | Chart colors |
| `src/components/ui/HUDCustomizationPanel.tsx` | 10 | HUD theming |

---

## Refactoring Strategy

### Phase 1: Quick Wins (1 day)
Start with files that have 5-9 violations - easy to fix, builds momentum.

Files: `SessionCard.tsx`, `FloatingPanel.tsx`, `HeroMetricsStrip.tsx`, `LoadingStates.tsx`

### Phase 2: Core Layout (1 day)
Fix layout components that affect the entire app.

Files: `ChatPage.tsx`, `LeftSidebar.tsx`, `app-sidebar.tsx`

### Phase 3: UI Primitives (1 day)
Fix shared components used everywhere.

Files: `ResponseRenderer.tsx`, `ProfessionalProgress.tsx`, `carousel.tsx`

### Phase 4: Feature Components (2-3 days)
Work through the high-violation feature components.

Priority order:
1. RLHF components (most violations concentrated here)
2. Demo components
3. Settings components

---

## Validation Commands

After refactoring each file, run:

```bash
# Check for remaining violations in a specific file
grep -n "zinc-\|gray-\|slate-" src/components/path/to/file.tsx

# Check entire codebase progress
grep -rh "zinc-\|gray-\|slate-" --include="*.tsx" src/ | wc -l

# Visual regression test
npm run test:visual
```

---

## CSS Variables Available

These are already defined in `globals.css` and `tailwind.config.js`:

### Semantic Colors (use these)
- `bg-background` - Main background
- `bg-foreground` - Inverted background
- `bg-card` - Card/elevated surfaces
- `bg-popover` - Popover backgrounds
- `bg-primary` - Primary action (teal)
- `bg-secondary` - Secondary surfaces
- `bg-muted` - Muted backgrounds
- `bg-accent` - Accent highlights
- `bg-destructive` - Error/danger

### Text Colors
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary text
- `text-primary` - Teal text
- `text-destructive` - Error text

### Border Colors
- `border-border` - Standard border
- `border-input` - Form input border
- `ring-ring` - Focus ring

### MAC Design System (additional)
- `bg-mac-surface-bg` - Pure black
- `bg-mac-surface-elevated` - Elevated surface
- `text-mac-text-primary` - White
- `text-mac-text-secondary` - Gray
- `text-mac-text-muted` - Dim gray

---

## Example Refactor

Before:
```tsx
<div className="h-full flex flex-col bg-zinc-950">
  <div className="p-6 border-b border-zinc-800/50">
    <h1 className="text-2xl font-bold text-zinc-100">Title</h1>
    <p className="text-sm text-zinc-400 mt-1">Description</p>
  </div>
</div>
```

After:
```tsx
<div className="h-full flex flex-col bg-background">
  <div className="p-6 border-b border-border/50">
    <h1 className="text-2xl font-bold text-foreground">Title</h1>
    <p className="text-sm text-muted-foreground mt-1">Description</p>
  </div>
</div>
```

Visual result: **Identical in dark mode**, but now theme-switchable.

---

## Progress Tracking

| Phase | Files | Status |
|-------|-------|--------|
| Quick Wins | 10 files | Not started |
| Core Layout | 3 files | Not started |
| UI Primitives | 5 files | Not started |
| Feature Components | 25 files | Not started |
| **Total** | **43 files** | **0% complete** |

Update this document as you progress through the refactoring.
