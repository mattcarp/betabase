# Visual UX/UI Audit - Quick Action Checklist

**Generated:** 2025-11-30
**Status:** 🔴 Critical issues found

---

## 🔥 CRITICAL (Fix Immediately)

- [ ] **Remove brain icon from introspection dropdown** (user complaint: "looks gross")
  - Component: `IntrospectionDropdown`
  - Action: Replace with Settings icon or move to dev menu

- [ ] **Fix progress indicator placement** (appears BELOW response instead of ABOVE)
  - Component: `AiSdkChatPanel`
  - Action: Move loading indicator above message content

- [ ] **Add alt text to all images**
  - Search: `grep -r "<img" src/`
  - Action: Add descriptive `alt=""` to all images

- [ ] **Fix color contrast violations** (WCAG AA requirement: 4.5:1)
  - Test: `text-slate-400` on dark backgrounds
  - Check: `--mac-text-muted: #737373` contrast ratio
  - Tool: Use browser DevTools contrast checker

- [ ] **Add aria-labels to icon-only buttons**
  - Search: All `<Button size="icon">`
  - Action: Add `aria-label="descriptive action"`

- [ ] **Implement proper routing for deep links** (SPA navigation broken)
  - Current: Cannot link to /hud, /test, etc.
  - Action: Use Next.js App Router or sync URL with active mode
  - Files: Create `app/hud/page.tsx`, `app/test/page.tsx`, etc.

---

## ⚠️ HIGH PRIORITY (This Week)

- [ ] **Simplify header information density** (11+ elements is too many)
  - Move secondary actions into dropdown menu
  - Consolidate knowledge badges into single badge with tooltip
  - Hide non-essential items on mobile

- [ ] **Fix 8px grid spacing violations**
  - Audit: `grep -r "space-x-3\|space-y-3" src/`
  - Change: `space-x-3` → `space-x-4` (12px → 16px)
  - Verify: All spacing uses Tailwind's 8px-based scale

- [ ] **Check typography weight compliance** (max 400)
  - Audit: `grep -r "font-medium\|font-semibold\|font-bold" src/`
  - Remove: Any weights > 400 violate MAC Design System

- [ ] **Enhance navigation tab states**
  - Add: Focus ring for keyboard navigation
  - Improve: Active state visual distinction (add border)
  - Add: `aria-current="page"` for active tab

- [ ] **Create consistent empty state components**
  - Add: Empty states for HUD, Test, Fix, Curate pages
  - Template: Icon + Title + Description + Action button

- [ ] **Standardize loading states**
  - Replace: Plain "Loading..." text
  - Add: Spinner with consistent styling
  - Use: Across all dynamic imports

- [ ] **Simplify knowledge status badges**
  - Current: 2 separate badges (verbose)
  - New: Single badge with tooltip showing details

- [ ] **Add mobile-responsive header**
  - Implement: Hamburger menu for mobile
  - Move: Navigation tabs to drawer on small screens

---

## 📋 MEDIUM PRIORITY (Next Sprint)

- [ ] Standardize border alpha values (`border-zinc-800/50` everywhere)
- [ ] Unify button sizes in header (`h-9 w-9` or `h-8 w-8`)
- [ ] Add shadow hierarchy (active tabs need more depth)
- [ ] Standardize icon sizes (default: `h-4 w-4`)
- [ ] Add consistent transitions to all interactive elements
- [ ] Add focus states to all focusable elements
- [ ] Standardize placeholder text color

---

## ✨ NICE-TO-HAVE (Future)

- [ ] Add micro-interactions (scale on press, slide-in animations)
- [ ] Add visual feedback on mode transitions
- [ ] Implement keyboard shortcuts
- [ ] Add reduce-motion preference support

---

## 📊 Testing Checklist

### Accessibility Testing
- [ ] Tab through entire app (keyboard only)
- [ ] Test with VoiceOver (Cmd+F5 on Mac)
- [ ] Test with screen reader (NVDA on Windows)
- [ ] Run axe DevTools accessibility scan
- [ ] Check heading hierarchy (no skipped levels)
- [ ] Verify all forms have labels
- [ ] Test text zoom to 200%

### Visual Regression Testing
- [ ] Capture screenshots of all 5 pages (Chat, HUD, Test, Fix, Curate)
- [ ] Test across viewports (mobile 375px, tablet 768px, desktop 1440px)
- [ ] Verify focus states are visible
- [ ] Check hover states on interactive elements
- [ ] Verify empty states render correctly
- [ ] Test loading states

### Cross-Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## 🎨 Design System Compliance

### Spacing (8px Grid)
```
✅ ALLOWED: px-2, px-4, px-6, px-8 (8, 16, 24, 32px)
❌ AVOID:   px-3, px-5, px-7 (12, 20, 28px) - use sparingly
```

### Typography (Weights 100-400)
```
✅ font-thin (100)
✅ font-extralight (200)
✅ font-light (300)
✅ font-normal (400)
❌ font-medium (500)
❌ font-semibold (600)
❌ font-bold (700)
```

### Colors (Use CSS Variables)
```
✅ bg-zinc-900, text-zinc-100 (Tailwind OK)
✅ var(--mac-primary-blue-400)
✅ var(--mac-text-secondary)
❌ Hardcoded hex colors in inline styles
```

---

## 📝 Quick Fixes (Copy-Paste Ready)

### Fix 1: Add aria-label to icon button
```tsx
// BEFORE
<Button size="icon">
  <Database className="h-4 w-4" />
</Button>

// AFTER
<Button size="icon" aria-label="Toggle knowledge base panel">
  <Database className="h-4 w-4" />
</Button>
```

### Fix 2: Add focus ring
```tsx
className={cn(
  "...",
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-mac-state-focus",
  "focus-visible:ring-offset-2",
  "focus-visible:ring-offset-zinc-950"
)}
```

### Fix 3: Consistent loading state
```tsx
const LoadingState = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center h-full gap-4">
    <Loader2 className="h-8 w-8 animate-spin text-mac-primary-blue-400" />
    <p className="text-sm text-zinc-400">{label}</p>
  </div>
);
```

### Fix 4: Empty state component
```tsx
<div className="flex flex-col items-center justify-center h-full gap-6 p-8">
  <div className="h-16 w-16 rounded-full bg-zinc-800/50 flex items-center justify-center">
    <TestTube className="h-8 w-8 text-zinc-600" />
  </div>
  <div className="text-center max-w-md">
    <h3 className="text-lg font-light text-zinc-200 mb-2">No tests configured</h3>
    <p className="text-sm text-zinc-400 mb-4">
      Add your first test to get started with automated validation
    </p>
    <Button onClick={handleAddTest}>
      <Plus className="h-4 w-4 mr-2" />
      Create Test
    </Button>
  </div>
</div>
```

---

## 🔍 Search Commands

```bash
# Find spacing violations
grep -r "space-x-3\|space-y-3\|px-5\|py-5" src/

# Find typography violations
grep -r "font-medium\|font-semibold\|font-bold" src/

# Find images without alt
grep -r '<img[^>]*>' src/ | grep -v 'alt='

# Find icon buttons without aria-label
grep -r 'size="icon"' src/ | grep -v 'aria-label'
```

---

## 📈 Progress Tracking

**Critical Issues:** 0/6 fixed
**High Priority:** 0/8 fixed
**Medium Priority:** 0/7 fixed

**Estimated Time:**
- Critical: 8-12 hours
- High Priority: 16-20 hours
- Medium Priority: 8-12 hours
- **Total:** ~40 hours (1 week sprint)

---

**Last Updated:** 2025-11-30
**Next Review:** After critical fixes completed
