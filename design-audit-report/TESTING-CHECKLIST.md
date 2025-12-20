# Design Audit - Manual Testing Checklist

**Date:** 2025-12-20
**Purpose:** Verify MAC Design System compliance fixes
**Tester:** _____________
**Start Time:** _____________
**End Time:** _____________

---

## Pre-Test Setup

- [ ] Dev server running: `npm run dev`
- [ ] Browser opened: http://localhost:3000
- [ ] Browser DevTools console open (check for errors)
- [ ] Browser window at desktop size (1920x1080)
- [ ] Take "before" screenshot for comparison (if available)

---

## Phase 1: Font Weight Verification

### Chat Mode
- [ ] Header: "The Betabase" appears thin/light (200 weight)
- [ ] Subtitle: "Intelligence Platform" appears light (300 weight)
- [ ] Navigation tabs text appears light
- [ ] All buttons appear light, not bold

### Test Mode
- [ ] Click "Test" tab in navigation
- [ ] Header "Advanced Testing & Quality Assurance" appears **LIGHT** (not normal/bold)
- [ ] Icon and text properly aligned
- [ ] Subtitle text readable

### Fix Mode
- [ ] Click "Fix" tab in navigation
- [ ] Header "Debug & Fix Assistant" appears **LIGHT** (not normal/bold)
- [ ] Icon and text properly aligned
- [ ] Subtitle text readable

### Curate Mode
- [ ] Click "Curate" tab in navigation
- [ ] Header "Knowledge Curation" appears **LIGHT** (not normal/bold)
- [ ] `.mac-heading` class not overridden
- [ ] Icon and text properly aligned

---

## Phase 2: Button Testing

### Header Control Buttons
- [ ] Introspection dropdown button - light font weight
- [ ] Knowledge base (Database icon) button - light font weight
- [ ] Performance dashboard button - light font weight
- [ ] Sign out button - light font weight

### Sidebar Buttons
- [ ] "New conversation" button - light font weight
- [ ] Conversation list items (if any) - light font weight

### Navigation Tabs
- [ ] All tab buttons use light font weight
- [ ] Active tab visible and light weight
- [ ] Hover states work and maintain light weight

---

## Phase 3: Visual Consistency Check

### Colors
- [ ] Background is consistent (dark theme)
- [ ] Text colors appear unchanged from before fixes
- [ ] Borders appear unchanged
- [ ] No color regression

### Layout
- [ ] No layout shifts
- [ ] No spacing changes
- [ ] No alignment issues
- [ ] Responsive layout still works

### Transitions
- [ ] Tab switching smooth (200ms)
- [ ] Button hover effects smooth
- [ ] No janky animations

---

## Phase 4: Mode-Specific Testing

### Chat Mode
- [ ] Welcome screen displays correctly
- [ ] Suggested questions visible and clickable
- [ ] Message input field present
- [ ] Sidebar toggle works
- [ ] Right sidebar (knowledge panel) toggle works

### HUD Mode
- [ ] Click "HUD" tab
- [ ] Wait for dynamic import (loading message)
- [ ] HUD interface renders
- [ ] No console errors

### Test Mode
- [ ] All 5 sub-tabs present
- [ ] Click "Dashboard" tab - loads without errors
- [ ] Click "Historical Tests" tab - loads without errors
- [ ] Click "RLHF Tests" tab - loads without errors
- [ ] Click "Impact Metrics" tab - loads without errors
- [ ] Click "Live Monitor" tab - loads without errors

### Fix Mode
- [ ] All 4 sub-tabs present
- [ ] Click "Response Debugger" tab - loads
- [ ] Click "Quick Fix" tab - loads
- [ ] Click "Test Generator" tab - loads
- [ ] Click "Feedback Timeline" tab - loads

### Curate Mode
- [ ] Curate interface loads
- [ ] No console errors
- [ ] Content displays correctly

---

## Phase 5: Mobile Responsive Testing

- [ ] Resize browser to mobile width (375px)
- [ ] Mobile navigation tabs appear (icon-only)
- [ ] Logo switches to compact version
- [ ] Tooltips work on hover
- [ ] All modes accessible on mobile
- [ ] Text still readable at small size

---

## Phase 6: Accessibility Check

### Keyboard Navigation
- [ ] Tab key moves through interactive elements
- [ ] Enter key activates buttons/tabs
- [ ] Escape key closes modals/dropdowns (if any)
- [ ] Focus indicators visible

### Focus States
- [ ] Tab key shows focus ring on buttons
- [ ] Focus ring uses MAC blue color
- [ ] Focus visible on all interactive elements

### ARIA Labels
- [ ] Buttons have proper aria-labels
- [ ] Icon buttons have descriptive labels
- [ ] No accessibility warnings in console

---

## Phase 7: Interaction Testing

### Dropdowns
- [ ] Introspection dropdown opens on click
- [ ] Introspection dropdown closes on Escape
- [ ] Introspection dropdown closes on outside click
- [ ] No errors in console

### Panels
- [ ] Right sidebar opens when Database button clicked
- [ ] Right sidebar closes when button clicked again
- [ ] Left sidebar toggles with toggle button
- [ ] Panels animate smoothly

### Tooltips
- [ ] Hover over navigation tab icons - tooltip appears
- [ ] Tooltip text descriptive and readable
- [ ] Tooltip uses correct MAC styling

---

## Phase 8: Console & Network Check

### Console
- [ ] No errors in console
- [ ] No warnings about font loading
- [ ] No CSS parsing errors
- [ ] No React hydration warnings

### Network
- [ ] All CSS files load successfully
- [ ] `/styles/mac-design-system.css` loads
- [ ] No 404 errors
- [ ] No slow loading resources

---

## Phase 9: Cross-Browser Testing (Optional)

### Chrome
- [ ] All tests pass in Chrome

### Firefox
- [ ] All tests pass in Firefox

### Safari
- [ ] All tests pass in Safari

---

## Phase 10: Visual Comparison

### Before/After
- [ ] Text appears slightly lighter/thinner (expected)
- [ ] Colors remain the same
- [ ] Layout identical
- [ ] Spacing unchanged
- [ ] Overall appearance more refined

### Screenshots
- [ ] Take "after" screenshot of Chat mode
- [ ] Take "after" screenshot of Test mode header
- [ ] Take "after" screenshot of Fix mode header
- [ ] Take "after" screenshot of Curate mode header
- [ ] Save screenshots to `design-audit-report/screenshots/`

---

## Issues Found During Testing

### Critical Issues
| Issue | Location | Screenshot | Notes |
|-------|----------|------------|-------|
|       |          |            |       |
|       |          |            |       |

### Medium Issues
| Issue | Location | Screenshot | Notes |
|-------|----------|------------|-------|
|       |          |            |       |
|       |          |            |       |

### Low Issues
| Issue | Location | Screenshot | Notes |
|-------|----------|------------|-------|
|       |          |            |       |
|       |          |            |       |

---

## Final Verification

- [ ] All checklist items completed
- [ ] No critical issues found
- [ ] Screenshots saved
- [ ] Console clear of errors
- [ ] Ready for production

---

## Sign-off

**Tester Name:** _____________

**Date:** _____________

**Time Spent:** _____________

**Result:** [ ] PASS [ ] FAIL [ ] NEEDS WORK

**Notes:**
```
[Add any additional observations or concerns here]
```

---

## Next Steps (If Issues Found)

1. Document all issues in table above
2. Prioritize: Critical → High → Medium → Low
3. Create GitHub issues for each problem
4. Assign to appropriate developer
5. Re-test after fixes applied

---

## Next Steps (If All Pass)

1. Commit changes to git
2. Create pull request
3. Request code review
4. Merge to main
5. Deploy to production
6. Monitor for issues

---

**File:** design-audit-report/TESTING-CHECKLIST.md
**Last Updated:** 2025-12-20
**Version:** 1.0
