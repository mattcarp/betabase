# Fiona MAC Design System Compliance Audit

**Date**: January 4, 2026  
**Auditor**: Fiona AI Design Agent (Windsurf)  
**Scope**: All `src/components/` files

---

## Executive Summary

**Critical Finding**: The codebase has **1,502 hardcoded Tailwind color violations** that bypass the MAC Design System tokens. This is causing visual inconsistency across pages.

---

## Violation Statistics

| Category | Count | Severity |
|----------|-------|----------|
| Hardcoded Tailwind colors | 1,502 | 🚨 Critical |
| Hardcoded hex values | 30+ | 🚨 Critical |
| Typography weight violations | 25+ | ⚠️ High |

---

## Top 20 Offending Files

| Violations | File |
|------------|------|
| 63 | `test-dashboard/SelfHealingTestViewer.tsx` |
| 44 | `rlhf/FeedbackAnalytics.tsx` |
| 42 | `test-dashboard/SelfHealingDecisionStory.tsx` |
| 39 | `HUDLayout.tsx` |
| 36 | `ui/CleanCurateTab.tsx` |
| 34 | `ui/ConnectionStatusIndicator.tsx` |
| 30 | `ui/rlhf-tabs/TestsTab.tsx` |
| 27 | `rlhf/FeedbackBadge.tsx` |
| 25 | `ui/rlhf-tabs/FineTuningJobsPanel.tsx` |
| 25 | `ui/IntrospectionDropdown.tsx` |
| 25 | `test-dashboard/SelfHealingDemo.tsx` |
| 25 | `test-dashboard/RLHFTestSuite.tsx` |
| 24 | `test-dashboard/SessionPlaybackViewer.tsx` |
| 22 | `ui/RLHFCuratorDashboard.tsx` |
| 22 | `ui/ResponseRenderer.tsx` |
| 22 | `ai/ai-sdk-chat-panel.tsx` |
| 21 | `rlhf/FeedbackImpactLive.tsx` |
| 21 | `ConversationalAI.tsx` |
| 20 | `rlhf/CuratorWorkspace.tsx` |
| 19 | `ui/SearchResultsResponse.tsx` |

---

## Critical Violations by Type

### 1. Hardcoded Tailwind Colors (1,502 instances)

**Pattern**: Using `text-blue-500`, `bg-green-400`, `border-purple-300` instead of MAC tokens

**Examples found**:
```tsx
// ❌ NON-COMPLIANT
text-blue-500, text-green-400, text-purple-400, text-red-400
bg-blue-500/10, bg-green-500/20, bg-purple-500/10
border-blue-600/60, border-green-500/30

// ✅ MAC-COMPLIANT
text-[var(--mac-info)], text-[var(--mac-tier1)], text-[var(--mac-purple)]
bg-[var(--mac-info-bg)], bg-[var(--mac-tier1-bg)]
border-[var(--mac-info-border)], border-[var(--mac-tier1-border)]
```

### 2. Hardcoded Hex Values (30+ instances)

**Files with hex values**:
- `CleanCurateTab.tsx` - `#1a1a1a`, `#666666`, `#4a4a4a`, `#2563eb`
- `EnhancedHUDInterface.tsx` - `#3B82F6`, `#00FFFF`, `#A855F7`, etc.
- `ProfessionalProgress.tsx` - `#3B82F6`, `#10B981`, `#F59E0B`, `#EF4444`
- `AudioWaveformResponse.tsx` - `#3B82F6`, `#4B5563`, `#F59E0B`, `#EF4444`
- `HUDCustomizationPanel.tsx` - Multiple theme colors
- `FloatingPanel.tsx` - `#3B82F6` in gradient

**Fix**: Replace with MAC CSS variables:
```tsx
// ❌ NON-COMPLIANT
fill: "#3B82F6"
color: "#10B981"

// ✅ MAC-COMPLIANT
fill: "var(--mac-info)"
color: "var(--mac-tier1)"
```

### 3. Typography Weight Violations (25+ instances)

**MAC Design System allows only**: `font-thin` (100), `font-extralight` (200), `font-light` (300), `font-normal` (400)

**Violations found**:
- `font-bold` (700) - Multiple files
- `font-semibold` (600) - `alert-dialog.tsx`, `card.tsx`, `RLHFFeedbackTab.tsx`
- `font-medium` (500) - Many files

**Fix**:
```tsx
// ❌ NON-COMPLIANT
font-bold, font-semibold, font-medium

// ✅ MAC-COMPLIANT
font-normal (for emphasis), font-light (for body)
```

---

## MAC Design Token Reference

### Color Tokens
| Purpose | MAC Token | Use Instead Of |
|---------|-----------|----------------|
| Primary accent | `--mac-primary-blue-400` | `blue-500`, `#3B82F6` |
| Info/Teal | `--mac-info` | `cyan-400`, `teal-400` |
| Success | `--mac-tier1` | `green-400`, `#10B981` |
| Warning | `--mac-tier2` | `yellow-400`, `amber-400` |
| Error | `--mac-tier3` | `red-400`, `#EF4444` |
| Purple accent | `--mac-purple` | `purple-400`, `#A855F7` |

### Background Tokens
| Purpose | MAC Token |
|---------|-----------|
| Info background | `--mac-info-bg` |
| Success background | `--mac-tier1-bg` |
| Warning background | `--mac-tier2-bg` |
| Error background | `--mac-tier3-bg` |

### Border Tokens
| Purpose | MAC Token |
|---------|-----------|
| Default border | `--mac-utility-border` |
| Elevated border | `--mac-utility-border-elevated` |
| Status borders | `--mac-info-border`, `--mac-tier1-border`, etc. |

---

## Recommended Fix Strategy

### Phase 1: Critical Components (Immediate)
1. `SelfHealingTestViewer.tsx` - 63 violations
2. `FeedbackAnalytics.tsx` - 44 violations
3. `SelfHealingDecisionStory.tsx` - 42 violations
4. `HUDLayout.tsx` - 39 violations

### Phase 2: High-Priority (This Week)
5. `CleanCurateTab.tsx` - 36 violations + hex values
6. `ConnectionStatusIndicator.tsx` - 34 violations
7. `TestsTab.tsx` - 30 violations
8. `FeedbackBadge.tsx` - 27 violations

### Phase 3: Medium Priority
- Remaining 12 files in top 20

---

## Automated Fix Commands

Run these to identify specific violations:

```bash
# Find all Tailwind color violations
grep -rn --include="*.tsx" -E "(text|bg|border)-(blue|green|red|yellow|purple|orange|cyan)-[0-9]+" src/components/

# Find hex values
grep -rn --include="*.tsx" -E "#[0-9a-fA-F]{6}" src/components/

# Find typography violations
grep -rn --include="*.tsx" -E "font-(bold|semibold|medium)" src/components/
```

---

## Success Criteria

- [ ] Zero hardcoded Tailwind colors in components
- [ ] Zero hardcoded hex values
- [ ] Typography weights 100-400 only
- [ ] All colors use `var(--mac-*)` tokens
- [ ] Visual consistency across all pages

---

*Audit generated by Fiona AI Design Agent*
