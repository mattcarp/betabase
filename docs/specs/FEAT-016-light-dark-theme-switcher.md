# FEAT-016: Light/Dark Theme Switcher

**Status**: Draft
**Priority**: Medium
**Estimated Effort**: 5-7 days
**Author**: Matt Carpenter
**Created**: 2025-01-03

## Overview

Add a sun/moon toggle in the top-right navigation to switch between light and dark themes, following the common UX pattern seen across modern web applications.

## Current State Analysis

### What's Already Working (80-85% Ready)

| Component | Status | Notes |
|-----------|--------|-------|
| Custom ThemeContext | Ready | 217-line implementation with 3 themes (mac, jarvis, aoma) |
| localStorage Persistence | Ready | Key: `siam-theme-preference` |
| Theme Transitions | Ready | 1.5s smooth cubic-bezier animations via `theme-transitions.css` |
| Pre-hydration Script | Ready | Prevents flash on page load |
| Tailwind darkMode | Ready | Configured as `["class"]` in tailwind.config.js |
| CSS Variables | Partially Ready | HSL variables defined but only for dark theme |
| Visual Regression Tests | Ready | `dark-theme-regression.spec.ts` exists |

### What Needs Work

| Issue | Severity | Count | Effort |
|-------|----------|-------|--------|
| Hardcoded zinc-*/gray-* classes | Critical | 585 instances | 3-4 days |
| Hardcoded hex colors in styles | High | ~200 instances | 1-2 days |
| Light theme CSS variables | Medium | Not defined | 0.5 days |
| Theme toggle UI component | Medium | New component | 0.5 days |

## Technical Design

### 1. Theme Toggle Component

Location: `src/components/ui/theme-toggle.tsx`

```tsx
'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { colorMode, setColorMode } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setColorMode(colorMode === 'dark' ? 'light' : 'dark')}
      className="h-9 w-9"
      aria-label={`Switch to ${colorMode === 'dark' ? 'light' : 'dark'} mode`}
    >
      {colorMode === 'dark' ? (
        <Sun className="h-4 w-4 text-muted-foreground" />
      ) : (
        <Moon className="h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  );
}
```

### 2. ThemeContext Updates

Extend existing ThemeContext to support color modes:

```tsx
// Add to ThemeContext.tsx
type ColorMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;           // Existing: 'mac' | 'jarvis' | 'aoma'
  colorMode: ColorMode;   // New: 'light' | 'dark' | 'system'
  setTheme: (theme: Theme) => void;
  setColorMode: (mode: ColorMode) => void;
}
```

### 3. CSS Variable Structure

Update `globals.css` to define light theme variables:

```css
:root {
  /* Light theme (default in :root, overridden by .dark) */
  --background: 0 0% 100%;           /* White */
  --foreground: 240 10% 3.9%;        /* Near black */
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 187 100% 42%;           /* Teal - stays same */
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 187 100% 42%;
}

.dark {
  /* Existing dark theme variables */
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  /* ... rest of existing dark variables */
}
```

### 4. Integration Point

Add toggle to existing header/navbar:

```tsx
// In src/components/layout/TopNav.tsx or similar
import { ThemeToggle } from '@/components/ui/theme-toggle';

// Add next to existing nav items
<ThemeToggle />
```

## Hardcoded Color Refactoring Strategy

### Phase 1: Audit (Day 1)

Run this command to generate a refactoring list:

```bash
# Generate report of all hardcoded colors
grep -rn "zinc-\|gray-\|slate-\|#[0-9a-fA-F]\{3,6\}" \
  --include="*.tsx" --include="*.ts" \
  src/components/ > hardcoded-colors-report.txt
```

### Phase 2: Systematic Replacement (Days 2-5)

| Find | Replace With | Reasoning |
|------|--------------|-----------|
| `bg-zinc-900` | `bg-background` | Semantic background |
| `bg-zinc-800` | `bg-card` | Card/elevated surface |
| `bg-zinc-950` | `bg-background` | Deep background |
| `text-zinc-400` | `text-muted-foreground` | Secondary text |
| `text-zinc-300` | `text-foreground` | Primary text |
| `text-gray-400` | `text-muted-foreground` | Secondary text |
| `text-gray-500` | `text-muted-foreground` | Secondary text |
| `border-zinc-700` | `border-border` | Standard border |
| `border-zinc-800` | `border-border` | Standard border |
| `hover:bg-zinc-800` | `hover:bg-accent` | Hover state |

### Phase 3: Component-by-Component (Priority Order)

1. **Layout components** (highest impact)
   - `src/app/layout.tsx`
   - `src/components/layout/*`

2. **UI primitives** (used everywhere)
   - `src/components/ui/button.tsx`
   - `src/components/ui/input.tsx`
   - `src/components/ui/card.tsx`

3. **Feature components**
   - `src/components/chat/*`
   - `src/components/knowledge/*`

4. **Specialized components**
   - `src/components/test-dashboard/*`
   - `src/components/aoma/*`

## Testing Requirements

### Unit Tests
- ThemeToggle component renders correctly
- Theme state persists to localStorage
- Color mode switch triggers class change

### Visual Regression Tests
```typescript
// tests/e2e/visual/theme-toggle.spec.ts
test('light theme renders correctly', async ({ page }) => {
  await page.goto('/');
  await page.click('[aria-label="Switch to light mode"]');

  // Verify background is light
  const bg = await page.locator('body').evaluate(el =>
    window.getComputedStyle(el).backgroundColor
  );
  expect(bg).toMatch(/rgb\((2[45]\d|255), (2[45]\d|255), (2[45]\d|255)\)/);
});

test('theme preference persists across page reload', async ({ page }) => {
  await page.goto('/');
  await page.click('[aria-label="Switch to light mode"]');
  await page.reload();

  // Verify still in light mode
  const htmlClass = await page.locator('html').getAttribute('class');
  expect(htmlClass).not.toContain('dark');
});
```

### Accessibility Tests
- Toggle has proper aria-label
- Sufficient color contrast in both themes (WCAG AA)
- Focus states visible in both themes

## Rollout Plan

### Phase 1: Infrastructure (Days 1-2)
- [ ] Define light theme CSS variables in globals.css
- [ ] Update ThemeContext to support colorMode
- [ ] Create ThemeToggle component
- [ ] Add toggle to header UI

### Phase 2: Color Refactoring (Days 3-5)
- [ ] Audit all hardcoded colors
- [ ] Refactor layout components
- [ ] Refactor UI primitives
- [ ] Refactor feature components

### Phase 3: Testing & Polish (Days 6-7)
- [ ] Add visual regression tests for light theme
- [ ] Fix any discovered contrast issues
- [ ] Add theme transition animations
- [ ] Update documentation

## Success Criteria

1. Sun/moon toggle visible in top-right navigation
2. Clicking toggle immediately switches between light/dark
3. Theme preference persists across sessions
4. No flash of wrong theme on page load
5. All text remains readable in both themes (WCAG AA contrast)
6. Smooth 300ms transition between themes
7. Zero hardcoded zinc-*/gray-* classes remaining

## Dependencies

- No new npm packages required
- Uses existing ThemeContext infrastructure
- Uses existing lucide-react icons (Sun, Moon)

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Large refactoring scope | High | Medium | Phase approach, start with high-impact components |
| Contrast issues in light theme | Medium | High | Use established design system values, test with contrast checker |
| Breaking existing themes (mac/jarvis/aoma) | Low | High | Keep theme system separate from colorMode |
| Performance impact | Low | Low | CSS variables are highly performant |

## Open Questions

1. Should we support "system" preference (auto-detect OS setting)?
2. Should the toggle animate between sun/moon icons?
3. Do we need separate light variants for the jarvis/aoma themes?

## References

- Current ThemeContext: `src/contexts/ThemeContext.tsx`
- Global styles: `src/app/globals.css`
- Design tokens: `public/styles/mac-design-system.css`
- Tailwind config: `tailwind.config.js`
- Visual tests: `tests/e2e/visual/dark-theme-regression.spec.ts`
