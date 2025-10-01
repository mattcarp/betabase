# Visual Regression Test Suite

This directory contains visual regression tests for the SIAM application.

## Critical Tests

### `dark-theme-regression.spec.ts` ⚠️ **IMPORTANT**

**Purpose:** Prevents recurring regression where the main chat panel shows white/light background instead of dark theme.

**History:** This regression has occurred multiple times, typically caused by:
- Using CSS variables like `from-background via-background` that resolve to light colors
- Components not having explicit dark backgrounds
- Gradient classes that pull from theme CSS variables

**What it tests:**
1. ✅ Main chat panel background is dark (rgb values < 30)
2. ✅ Conversation area has dark background
3. ✅ Header badges are visible with proper contrast
4. ✅ Suggestion buttons have dark styling
5. ✅ Visual snapshot comparison (catches any visual changes)
6. ✅ No light-colored gradients in main content
7. ✅ Body/HTML elements maintain dark theme

**How to run:**
```bash
# Run all dark theme regression tests
npx playwright test tests/visual/dark-theme-regression.spec.ts

# Run only critical tests (marked with "CRITICAL:")
npx playwright test tests/visual/dark-theme-regression.spec.ts -g "CRITICAL"

# Update visual baseline snapshot (after intentional UI changes)
npx playwright test tests/visual/dark-theme-regression.spec.ts:205 --update-snapshots
```

**When to update snapshots:**
- After intentionally changing the UI design
- After updating colors, spacing, or layout
- **Never** update if the change is unintentional (investigate first!)

**CI/CD Integration:**
This test should be run:
- ✅ On every pull request
- ✅ Before deployment to production
- ✅ After any CSS/styling changes
- ✅ After updating UI components

## Other Visual Tests

### `chat-landing.spec.ts`
Tests the main chat landing page loads correctly with AI Elements and MAC Theme.

### `quick-visual-check.spec.ts`
Quick sanity check for visual elements and console errors. Useful for fast feedback during development.

### `siam-desktop.spec.ts`
Tests for desktop-specific UI features and JARVIS-style HUD elements.

### `responsive-hub.spec.ts`
Tests responsive design across different viewport sizes.

## Running Visual Tests

### Run all visual tests:
```bash
npx playwright test tests/visual/
```

### Run in headed mode (see browser):
```bash
npx playwright test tests/visual/ --headed
```

### Run specific test:
```bash
npx playwright test tests/visual/dark-theme-regression.spec.ts
```

### Debug a failing test:
```bash
npx playwright test tests/visual/dark-theme-regression.spec.ts --debug
```

### View test report:
```bash
npx playwright show-report
```

## Troubleshooting

### Test fails with "white background" error:
1. Check `src/components/ai/ai-sdk-chat-panel.tsx` - main container should use `bg-zinc-950`
2. Check CSS variables in `app/globals.css` - ensure dark theme is applied
3. Run locally to see the visual issue: `npx playwright test --headed`

### Snapshot mismatch:
1. Review the diff in the HTML report: `npx playwright show-report`
2. If change is intentional: `npx playwright test --update-snapshots`
3. If change is unintentional: investigate the root cause

### Test timeout:
1. Increase timeout in test: `test.setTimeout(60000)`
2. Check if dev server is running: `lsof -i :3000`
3. Use `domcontentloaded` instead of `networkidle` for faster tests

## Best Practices

1. **Always review visual changes** before updating snapshots
2. **Run visual tests locally** before pushing
3. **Update documentation** when adding new visual tests
4. **Keep tests fast** - use selective waits, not blanket timeouts
5. **Test real user scenarios** - not just that elements exist

## Related Documentation

- [Production Testing Guide](../../docs/PRODUCTION_TESTING.md)
- [Visual Regression Fix Report](../../docs/VISUAL_REGRESSION_FIX_REPORT.md)
- [MAC Design Principles](../../context/mac-design-principles.md)
