w# Blast Radius Demo Script

## The Problem We're Solving

A developer makes a tiny change—renaming a button ID from `login-btn` to `loginbtn`—and suddenly **2,000 tests fail**. That's the "blast radius" of a simple rename. But here's the thing: **nothing is actually broken**. The button still works. The functionality is identical. It's just a cosmetic change.

Traditional test suites don't know the difference. They fail on any selector mismatch, regardless of significance.

---

## Demo Setup

**Files:**
- Demo page: `blast-radius-demo/index.html`
- Playwright tests: `tests/e2e/demo/blast-radius-login.spec.ts`
- Tests tab: Curate → Tests

**Current State:**
- HTML has: `data-test-id="login-btn"`
- Test expects: `data-test-id="login-btn"`
- Result: ✅ All 8 tests pass

---

## Demo Flow

### Part 1: Everything Works (30 seconds)

> "Let me show you our AOMA login page and the test suite that validates it."

1. Open `blast-radius-demo/index.html` in browser
2. Show the login form with the "Sign In" button
3. Run the tests:
   ```bash
   pnpm playwright test tests/e2e/demo/blast-radius-login.spec.ts
   ```
4. Point out: **8 tests pass** — login button, form submission, dashboard redirect, etc.

---

### Part 2: The "Tiny" Change (30 seconds)

> "Now imagine a developer comes in and says, 'Let me clean up this ID—remove the hyphen to save a few bytes.' Seems harmless, right?"

1. Open Chrome DevTools on the demo page
2. Find the Sign In button
3. Change `data-test-id="login-btn"` → `data-test-id="loginbtn"`

> "That's it. Three characters removed. The button still works. Users won't notice anything."

---

### Part 3: The Blast Radius (45 seconds)

> "But watch what happens when we run our tests again."

1. Run the tests:
   ```bash
   pnpm playwright test tests/e2e/demo/blast-radius-login.spec.ts
   ```

2. Point out the failures:
   - ❌ **login button should exist** — FAILS (can't find `login-btn`)
   - ❌ **can fill and submit login form** — FAILS (can't click button)
   - ⏭️ **login redirects to dashboard** — SKIPPED
   - ⏭️ **can access settings** — SKIPPED
   - ⏭️ **can view reports** — SKIPPED
   - ⏭️ **can logout** — SKIPPED

> "One tiny rename. Six tests affected. In a real system with thousands of tests, this cascades into hundreds of failures. Engineers waste hours debugging something that isn't actually broken."

---

### Part 4: The AI Analysis (45 seconds)

> "But our system is smarter. It doesn't just fail—it analyzes WHY the test failed."

1. Go to the Curate tab → Tests
2. Show the self-healing suggestion:

> "The AI detected: 'Button with text Sign In found at same position. data-test-id changed from login-btn to loginbtn. This appears to be a RENAME, not a removal.'"

**Key insight:**
- The button **still exists**
- The text **still says "Sign In"**
- The position **hasn't changed**
- Only the ID attribute changed

> "Confidence: 92%. The AI is almost certain this is a cosmetic change, not a real bug."

---

### Part 5: The Smart Decision (30 seconds)

> "Here's where it gets interesting. The AI makes a decision:"

**Scenario A: Button completely removed**
> "If the button was actually missing—DOM empty, element gone—that's a REAL failure. Stop everything. Alert the team."

**Scenario B: Button renamed (our case)**
> "But when it's just renamed? The AI says: 'This change is NOT significant enough to fail this test. Suggest updating the selector and continue running.'"

---

### Part 6: Self-Healing in Action (30 seconds)

> "Now watch. I approve the AI's suggestion."

1. Click "Approve & Update Test"
2. The test file is automatically updated: `login-btn` → `loginbtn`
3. Re-run tests

> "All 8 tests pass again. No manual debugging. No wasted engineering time. The blast radius was contained."

---

## Key Takeaways

1. **Blast radius** = how many tests fail from one change
2. **Traditional tests** fail on ANY selector mismatch
3. **Smart tests** distinguish between:
   - 🔴 Real failures (element removed, functionality broken)
   - 🟡 Cosmetic changes (renamed, moved slightly, text tweaked)
4. **Result**: Engineers focus on REAL bugs, not false positives

---

## The Numbers

| Metric | Traditional | With Self-Healing |
|--------|-------------|-------------------|
| Tests failed | 6 | 0 |
| Engineering time | 2+ hours | 30 seconds |
| False positives | 6 | 0 |
| Real bugs missed | 0 | 0 |

---

## Commands Reference

```bash
# Run the blast radius demo tests
pnpm playwright test tests/e2e/demo/blast-radius-login.spec.ts

# Run with visible browser
pnpm playwright test tests/e2e/demo/blast-radius-login.spec.ts --headed

# Run with UI mode (interactive)
pnpm playwright test tests/e2e/demo/blast-radius-login.spec.ts --ui
```

---

## Demo Checklist

- [ ] Demo page opens correctly
- [ ] All 8 tests pass initially
- [ ] DevTools accessible to change data-test-id
- [ ] Tests fail after ID change
- [ ] Self-healing suggestion appears in Curate → Tests
- [ ] Approval flow works
- [ ] Tests pass after approval
