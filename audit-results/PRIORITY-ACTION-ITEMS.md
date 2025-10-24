# SIAM MAC DESIGN SYSTEM - PRIORITY ACTION ITEMS

## 🔴 BLOCKERS (Fix Immediately - Today/Tomorrow)

### 1. Replace Hardcoded Colors with MAC Variables

**Impact:** CRITICAL - Design system consistency broken
**Files:** src/App.css, src/index.css, app/globals.css
**Violations:** 127 instances
**Effort:** 4-6 hours

**Quick Command:**

```bash
# Search for all hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,8\}" src/ app/ --include="*.css" --include="*.tsx"

# Or use the provided violation report
cat audit-results/mac-violations-detailed.json | jq '.hardcodedColors[]'
```

**Example Fix:**

```css
/* BEFORE */
.status-indicator {
  color: #3b82f6;
}

/* AFTER */
.status-indicator {
  color: var(--mac-primary-blue-400);
}
```

### 2. Fix AOMA Health Endpoint 503

**Impact:** CRITICAL - Core functionality broken
**Error:** `http://localhost:3000/api/aoma/health` returns 503
**Effort:** 2-3 hours

**Investigation Steps:**

1. Check if AOMA mesh MCP server is running
2. Verify environment variables for AOMA connection
3. Check /app/api/aoma/health/route.ts for errors
4. Test AOMA mesh connectivity

---

## 🟠 HIGH PRIORITY (This Week)

### 3. Add MAC Classes to Button Components

**Impact:** HIGH - Visual inconsistency across UI
**Files:** 109 component files with missing classes
**Effort:** 8-12 hours

**Bulk Fix Pattern:**

```tsx
// Find all Button components without mac-button class
// Add appropriate MAC class:
<Button className="mac-button mac-button-primary">

// Primary actions → mac-button-primary
// Secondary actions → mac-button-secondary
// Tertiary/text actions → mac-button-outline
```

**Priority Files:**

1. src/components/ai/ai-sdk-chat-panel.tsx
2. src/components/ui/pages/ChatPage.tsx
3. src/components/test-dashboard/TestDashboard.tsx
4. src/components/ui/EnhancedCurateTab.tsx
5. src/components/ui/AOMAKnowledgePanel.tsx

### 4. Add MAC Classes to Input Components

**Impact:** HIGH - Form consistency
**Files:** Same 109 component files
**Effort:** 4-6 hours

**Bulk Fix Pattern:**

```tsx
<Input className="mac-input" type="text" placeholder="..." />
```

### 5. Standardize Spacing to 8px Grid

**Impact:** HIGH - Visual rhythm broken
**Violations:** 60 instances
**Effort:** 4-6 hours

**Fix Pattern:**

```tsx
/* Use only multiples of 8px: */
p-1 → 4px   (use sparingly)
p-2 → 8px   ✅
p-3 → 12px  ❌ Use p-4 (16px) instead
p-4 → 16px  ✅
p-6 → 24px  ✅
p-8 → 32px  ✅
```

### 6. Fix Dashboard 404 Error

**Impact:** HIGH - Navigation broken
**Error:** /dashboard route returns 404
**Effort:** 1-2 hours

**Possible causes:**

- Missing page.tsx in app/dashboard/
- Routing misconfiguration
- Auth middleware blocking route

---

## 🟡 MEDIUM PRIORITY (This Sprint)

### 7. Clean Up Legacy CSS Files

**Files to review:**

- src/styles/cinematic-ui.css
- src/styles/jarvis-theme.css
- src/styles/motiff-glassmorphism.css

**Options:**

1. Merge useful styles into MAC design system
2. Deprecate and remove if not needed
3. Document what each file is for

### 8. Fix Betabase Logo Preload Warning

**Impact:** MEDIUM - Performance optimization
**Warning:** Preloaded resource not used within load window
**Effort:** 30 minutes

**Fix in app/layout.tsx:**

```tsx
// Either use the logo immediately or remove preload
<link rel="preload" as="image" href="/betabase-logo.webp" />
```

### 9. Consolidate Supabase Client Instances

**Impact:** MEDIUM - Prevent auth bugs
**Warning:** Multiple GoTrueClient instances detected
**Effort:** 1-2 hours

**Create single client instance:**

```typescript
// lib/supabase.ts
export const supabase = createClientComponentClient();
// Use this singleton everywhere
```

---

## 🟢 LOW PRIORITY (Nice to Have)

### 10. Increase MAC Typography Class Usage

**Current:** 0 instances of mac-display-text, mac-heading, mac-title, mac-body
**Target:** Use throughout application for better hierarchy

### 11. Add More Glassmorphism Effects

**Current:** Only 1 instance of mac-glass
**Opportunity:** Cards, modals, overlays could use mac-glass

### 12. Implement MAC Floating Orbs

**Benefit:** Enhanced visual appeal
**Usage:** Background decoration, loading states

---

## QUICK WINS (Do These First)

These can be done in parallel by different team members:

**Developer 1: Color Migration**

- Spend 4-6 hours replacing all hardcoded colors
- Use find-replace for common patterns
- Test in browser after each file

**Developer 2: Button/Input Classes**

- Add mac-button and mac-input classes
- Focus on most-used components first
- Can be done incrementally

**Developer 3: Investigation**

- Fix AOMA health endpoint
- Fix dashboard 404 routing
- Address console errors

---

## TESTING CHECKLIST

After fixing violations, verify:

- [ ] All pages render without console errors
- [ ] Visual appearance matches MAC Design System
- [ ] No hardcoded colors remain (scan with tool)
- [ ] All buttons have appropriate MAC classes
- [ ] All inputs have mac-input class
- [ ] Spacing follows 8px grid
- [ ] Typography weights are 100-400 only
- [ ] AOMA health endpoint returns 200
- [ ] Dashboard route is accessible
- [ ] Mobile responsive layout works
- [ ] Dark theme applied correctly
- [ ] No visual regressions

---

## AUTOMATED CHECKS TO IMPLEMENT

**Prevent Future Violations:**

1. **Pre-commit hook:**

```bash
# .husky/pre-commit
npm run lint:mac-compliance
```

2. **Add to package.json:**

```json
{
  "scripts": {
    "lint:mac-compliance": "node scan-mac-violations.js && exit 1 if violations > 0"
  }
}
```

3. **GitHub PR Check:**

```yaml
# .github/workflows/mac-compliance.yml
- name: Check MAC Design System Compliance
  run: npm run lint:mac-compliance
```

---

## RESOURCES

**Design System Reference:**

- MAC Design System: `src/styles/mac-design-system.css`
- Full Audit Report: `audit-results/FIONA-COMPREHENSIVE-DESIGN-AUDIT.md`
- Detailed Violations: `audit-results/mac-violations-detailed.json`
- Visual Screenshots: `audit-results/*.png`

**Tools:**

- Violation Scanner: `scan-mac-violations.js`
- Playwright Audit: `tests/fiona-design-audit.spec.ts`

**Contact:**

- Design System Questions: @fiona
- Implementation Help: Refer to FIONA-COMPREHENSIVE-DESIGN-AUDIT.md

---

## PROGRESS TRACKING

**Week 1 Goals:**

- [ ] Fix all 127 hardcoded color violations
- [ ] Fix AOMA health endpoint
- [ ] Fix dashboard 404 routing
- [ ] Add MAC classes to top 20 most-used components

**Week 2-3 Goals:**

- [ ] Complete MAC class migration for all components
- [ ] Standardize all spacing to 8px grid
- [ ] Clean up legacy CSS files

**Week 4 Goals:**

- [ ] Implement automated compliance checks
- [ ] Set up visual regression testing
- [ ] Document design system usage

**Success Metrics:**

- Zero MAC violations detected by scanner
- All components using MAC classes
- Design system audit score > 9.0/10
- No console errors or warnings

---

**Last Updated:** October 24, 2025
**Next Review:** After Week 1 completion
