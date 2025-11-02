# SIAM Testing Guide

Complete guide to running tests in SIAM, including architecture validation, UI tests, and E2E tests.

## 🚀 Quick Commands

### Run Everything
```bash
pnpm test:all
```
Runs: Architecture validation, Unit tests, UI tests, E2E tests

### UI Tests Only
```bash
pnpm test:ui-all
```
Runs: Architecture validation, Critical UI, Chat interface, Voice features

### Architecture Tests Only
```bash
pnpm test:architecture
```
**CRITICAL:** Validates chat doesn't call Railway (keeps responses fast)

### Individual Categories
```bash
pnpm test              # Unit tests (Vitest)
pnpm test:e2e          # All E2E tests (Playwright)
pnpm test:critical     # Critical UI paths
pnpm test:visual       # Visual regression tests
```

## 📋 What Gets Tested

### Architecture Validation ⭐ NEW!
**Location:** `tests/architecture/`

**Purpose:** Prevents architectural regressions

**Tests:**
- ✅ Chat doesn't call Railway AOMA MCP server
- ✅ Only Supabase and OpenAI are used
- ✅ Response times stay under 2 seconds
- ✅ Zero Railway calls across multiple queries

**Why This Matters:**
Railway adds 2.5+ seconds of latency. These tests ensure we maintain our Supabase-only optimization.

### Unit Tests
**Location:** `tests/unit/`

**Purpose:** Test individual functions and services

**Tests:**
- AOMA Orchestrator behavior
- Service layer functions
- Utility functions

### UI Tests
**Location:** `tests/critical/`, `tests/ai-chat.spec.ts`, `tests/voice-features.spec.ts`

**Purpose:** Validate user interface works correctly

**Tests:**
- Chat interface interaction
- Voice input/output
- Navigation and routing
- Form submissions
- Visual elements

### E2E Tests
**Location:** `tests/e2e/`, `tests/production/`

**Purpose:** Full user flow testing

**Tests:**
- Authentication flows
- Complete chat sessions
- File uploads
- AOMA knowledge queries
- Performance benchmarks

## 🎯 Test Suites

### `test:all` - Complete Suite
1. **Architecture Tests** ← Validates no Railway usage
2. **Unit Tests** ← Service layer validation
3. **Critical UI Tests** ← Core functionality
4. **Chat Tests** ← Chat interface
5. **Voice Tests** ← Voice features

### `test:ui-all` - UI Focus
1. **Architecture Tests** ← Performance validation
2. **Critical UI** ← Core UI elements
3. **Chat Interface** ← Chat interaction
4. **Voice UI** ← Voice controls
5. **Visual Regression** ← Design consistency

## 🔍 When Tests Fail

### Architecture Tests Fail
```
❌ Railway calls detected during chat
```

**What to do:**
1. Check `src/services/aomaOrchestrator.ts`
2. Verify `executeOrchestrationInternal` uses Supabase path
3. Ensure `callAOMATool` method is NOT called
4. Review PR changes for Railway fetch calls

**Critical:** Don't merge code that calls Railway in chat flow!

### Performance Tests Fail
```
⚠️ Response took 2500ms
```

**What to do:**
1. Run architecture tests to check for Railway calls
2. Check Supabase query performance
3. Review API response times
4. Check for blocking network calls

### UI Tests Fail
```
❌ Element not visible
```

**What to do:**
1. Run test locally with `--headed` flag
2. Take screenshots: `pnpm test:e2e --trace on`
3. Check console for errors
4. Verify component is rendering

## 📊 Test Reports

### View Results
```bash
pnpm test:report
```

### Generate Coverage
```bash
pnpm test:coverage
```

### Debug Mode
```bash
pnpm test:e2e:debug
```

### UI Mode (Interactive)
```bash
pnpm test:e2e:ui
```

## 🏃‍♂️ Running Tests Locally

### Prerequisites
1. Install dependencies: `pnpm install`
2. Install Playwright: `pnpm exec playwright install`
3. Set up environment variables (if needed)

### Running Tests
```bash
# Quick validation
pnpm test:architecture

# Full suite (may take 5-10 minutes)
pnpm test:all

# Specific category
pnpm test:ui-all
```

## 🚢 CI/CD Integration

Tests run automatically on:
- Every PR
- Every push to main
- Before deployment

### CI Test Order
1. Architecture validation (MUST PASS)
2. Unit tests
3. UI tests
4. E2E tests

If architecture tests fail, remaining tests are skipped.

## 📝 Writing New Tests

### Architecture Test
```typescript
test("should not call [slow service]", async ({ page }) => {
  const calls: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("slow-service.com")) {
      calls.push(request.url());
    }
  });

  // ... perform action ...

  expect(calls).toHaveLength(0);
});
```

### UI Test
```typescript
test("should display element", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-testid='element']")).toBeVisible();
});
```

### Unit Test
```typescript
test("should return expected result", () => {
  const result = myFunction("input");
  expect(result).toBe("expected");
});
```

## 🎓 Best Practices

1. **Always run architecture tests** before pushing
2. **Use data-testid** attributes for stable selectors
3. **Mock external services** in unit tests
4. **Test real flows** in E2E tests
5. **Keep tests fast** (<1s for unit, <30s for E2E)

## 🔗 Related Documentation

- [Architecture Tests README](./architecture/README.md)
- [Visual Regression Tests](./visual/README.md)
- [Production Tests](./production/README.md)

## ⚙️ Configuration

- `playwright.config.ts` - Playwright configuration
- `vitest.config.ts` - Vitest configuration
- `tests/test.config.ts` - Test utilities

## 🆘 Troubleshooting

### Tests Won't Run
```bash
# Reinstall dependencies
pnpm install
pnpm exec playwright install
```

### Tests Timeout
```bash
# Increase timeout
pnpm test:e2e --timeout=60000
```

### Tests Flaky
```bash
# Run with retries
pnpm test:e2e --retries=3
```

### Can't See What's Happening
```bash
# Run in headed mode
pnpm test:e2e --headed
```

## 📈 Metrics

**Target Performance:**
- Architecture tests: < 30 seconds
- Unit tests: < 10 seconds
- UI tests: < 2 minutes
- Full suite: < 10 minutes

**Current Coverage:**
- Unit tests: ~70%
- E2E tests: Critical paths covered
- Architecture: 100% of chat flow

## 🎯 Goals

- ✅ Prevent slow Railway calls
- ✅ Maintain sub-second responses
- ✅ Catch UI regressions
- ✅ Validate correct architecture
- ✅ Ensure production readiness

