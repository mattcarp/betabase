# Fiona Design Review Report - AgentInsightsTab.tsx

**Date**: January 4, 2026  
**Component**: `src/components/ui/rlhf-tabs/AgentInsightsTab.tsx`  
**Reviewer**: Fiona AI Compliance (Code Analysis Mode)

---

## Overall Score: 8.7/10

### Executive Summary
AgentInsightsTab demonstrates **strong MAC Design System compliance** with consistent use of CSS variables, light typography weights, and proper glassmorphism patterns. Minor issues found in the FlowDiagram component which uses hardcoded Tailwind colors instead of MAC tokens.

---

## What's Working Well ✅

1. **Excellent MAC Token Usage** - Component consistently uses `var(--mac-*)` CSS variables for colors, surfaces, and borders
2. **Proper Typography Weights** - Uses `font-light` (300) and `font-normal` (400) throughout, no heavy weights
3. **Glassmorphism Pattern** - Correct use of `mac-glass` class with `bg-[var(--mac-surface-elevated)]`
4. **Semantic Color Variables** - Uses tier colors (`--mac-status-connected`, `--mac-status-warning-text`) for confidence indicators
5. **Animation Standards** - Uses `animate-in fade-in slide-in-from-bottom-4 duration-500` consistent with MAC motion

---

## Critical Issues 🚨

### [High-Priority] FlowDiagram Uses Non-MAC Colors

**Location**: `AgentInsightsTab.tsx:31-48`  
**Problem**: The FlowDiagram component uses hardcoded Tailwind colors instead of MAC tokens

```tsx
// Current (non-compliant):
<div class="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300">
<div class="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-300">
<div class="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
```

**Impact**: Visual inconsistency with MAC design system; breaks theming support  
**Fix**: Replace with MAC CSS variables:

```tsx
// Recommended (MAC-compliant):
<div class="p-3 bg-[var(--mac-info-bg)] border border-[var(--mac-info-border)] rounded-lg text-[var(--mac-info)]">
<div class="p-3 bg-[var(--mac-purple-bg)] border border-[var(--mac-purple-border)] rounded-lg text-[var(--mac-purple)]">
<div class="p-3 bg-[var(--mac-tier1-bg)] border border-[var(--mac-tier1-border)] rounded-lg text-[var(--mac-tier1)]">
```

---

### [Medium-Priority] Legend Colors Non-MAC

**Location**: `AgentInsightsTab.tsx:136-143`  
**Problem**: Legend dots use hardcoded Tailwind colors

```tsx
<div className="h-2 w-2 rounded-full bg-blue-500"></div> Search
<div className="h-2 w-2 rounded-full bg-purple-500"></div> Logic
<div className="h-2 w-2 rounded-full bg-green-500"></div> Model
```

**Fix**: Use MAC variables:
```tsx
<div className="h-2 w-2 rounded-full bg-[var(--mac-info)]"></div>
<div className="h-2 w-2 rounded-full bg-[var(--mac-purple)]"></div>
<div className="h-2 w-2 rounded-full bg-[var(--mac-tier1)]"></div>
```

---

### [Medium-Priority] Zap Icon Uses Tailwind Yellow

**Location**: `AgentInsightsTab.tsx:220`  
**Problem**: `text-yellow-500` instead of MAC warning color

```tsx
<Zap className="h-5 w-5 text-yellow-500" />
```

**Fix**:
```tsx
<Zap className="h-5 w-5 text-[var(--mac-warning-yellow)]" />
```

---

## Improvements 💡

### [Nitpick] dangerouslySetInnerHTML Security

**Location**: `AgentInsightsTab.tsx:52`  
**Issue**: Using `dangerouslySetInnerHTML` for static content is safe here, but consider replacing with React components for better maintainability

```tsx
return <div className="w-full flex justify-center" dangerouslySetInnerHTML={{ __html: svg }} />;
```

**Recommendation**: Refactor FlowDiagram to use proper React JSX instead of HTML string

---

## MAC Design System Compliance

| Category | Score | Notes |
|----------|-------|-------|
| Color Token Usage | 85% | FlowDiagram uses hardcoded colors |
| Typography Weights | 100% | All weights 100-400 ✅ |
| Component Classes | 95% | Uses `mac-glass` correctly |
| Spacing Grid | 100% | 8px multiples observed |
| Border Radius | 100% | Consistent `rounded-xl`, `rounded-lg` |
| Animation | 100% | Uses standard durations |

---

## Visual Scoring (Weighted)

| Criterion | Weight | Score | Weighted |
|-----------|--------|-------|----------|
| Visual Hierarchy | 15% | 9 | 1.35 |
| Color & Contrast | 15% | 8 | 1.20 |
| Typography | 10% | 10 | 1.00 |
| Spacing & Layout | 15% | 9 | 1.35 |
| Interactive Elements | 10% | 9 | 0.90 |
| Visual Consistency | 10% | 8 | 0.80 |
| Accessibility | 10% | 8 | 0.80 |
| Performance | 5% | 9 | 0.45 |
| Emotional Design | 5% | 9 | 0.45 |
| Mobile Responsive | 5% | 9 | 0.45 |
| **TOTAL** | 100% | | **8.75/10** |

---

## Specific Recommendations

### Immediate Actions (Before merge):

1. **Replace FlowDiagram hardcoded colors** with MAC CSS variables (lines 31-48)
2. **Update legend dot colors** to use MAC tokens (lines 136-143)
3. **Fix Zap icon color** to use `--mac-warning-yellow` (line 220)

### Follow-up Tasks (Post-merge):

1. Refactor FlowDiagram from HTML string to React components
2. Consider adding `data-test-id` attributes for Playwright testing
3. Add loading state skeleton for decision data

---

## Console Errors

*Unable to verify via browser (Playwright MCP unavailable) - check dev server logs*

---

*Design Review powered by Fiona & MAC Design System*
