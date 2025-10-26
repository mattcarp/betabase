# Testing Strategy

Comprehensive testing guide for SIAM including AOMA validation, visual regression, E2E, and production testing.

## Testing Philosophy

**⚠️ MANDATORY**: See `TESTING_FUNDAMENTALS.md` for comprehensive test documentation.

Testing isn't just about finding bugs - it's about understanding how the application works and fails. SIAM has a complete Playwright test suite covering:

- **AOMA Chat Intelligence Tests** - Prevents hallucination, validates accurate knowledge base responses
- **File Upload/Curation Tests** - Ensures knowledge base management (upload/delete files)
- **Visual Regression Tests** - Prevents dark theme regressions and UI breaks
- **Full Production E2E Tests** - Complete user journey validation

## Pre-Deployment Testing (MUST PASS)

**Before ANY deployment, run:**

```bash
# P0 Critical Tests (MUST PASS)
npm run test:aoma                                  # AOMA hallucination prevention (CRITICAL!)
npm run test:visual                                # Visual regression (MAC compliance + dark theme)
npx playwright test tests/curate-tab-test.spec.ts # File upload/delete
npx playwright test tests/e2e/smoke/smoke.spec.ts # Critical paths
```

## AOMA Chat Validation (Anti-Hallucination)

**CRITICAL**: Prevents AI from making up information not in the knowledge base.

### Quick Commands

```bash
# Comprehensive AOMA validation suite
npm run test:aoma              # Knowledge validation + anti-hallucination (recommended)
npm run test:aoma:knowledge    # Test known facts from knowledge base
npm run test:aoma:hallucination # Catch AI making up bullshit answers
npm run test:aoma:all          # All AOMA tests (includes comprehensive chat tests)

# Or use the test runner script
./scripts/test-aoma-validation.sh
```

### What Gets Tested

1. **Knowledge Base Accuracy** - Verifies AI correctly retrieves information from uploaded documents
2. **Anti-Hallucination** - Ensures AI admits when it doesn't know something
3. **Source Attribution** - Validates proper citation of knowledge sources
4. **Query Understanding** - Tests AI's ability to interpret user questions

### Test Documentation

- `tests/production/AOMA-TESTING-README.md` - Complete AOMA anti-hallucination testing guide
- `tests/aoma/` - AOMA test suite location

## Visual Regression Testing

**CRITICAL**: Prevents MAC Design System violations and dark theme regressions.

### Quick Commands

```bash
# Run all visual regression tests
npm run test:visual

# Test MAC Design System compliance (colors, spacing, typography)
npm run test:visual:mac

# Test dark theme consistency (prevent white background regressions)
npm run test:visual:dark-theme

# Update visual snapshots (after intentional UI changes)
npm run test:visual:update-snapshots
```

### What Gets Tested

1. **MAC Design System Compliance**
   - Color token usage (`--mac-*` variables)
   - Typography weights (100-400 only)
   - Spacing grid (8px base unit)
   - Component patterns (`.mac-*` classes)

2. **Dark Theme Consistency**
   - No white backgrounds in dark mode
   - Proper contrast ratios
   - Consistent color scheme

3. **Visual Elements**
   - Component rendering
   - Layout consistency
   - Animation timings

### Test Documentation

- `tests/visual/mac-design-system-regression.spec.ts` - MAC Design System visual regression tests
- `tests/visual/dark-theme-regression.spec.ts` - Dark theme regression prevention

## E2E Testing

### Smoke Tests (Critical Paths)

```bash
# Run smoke tests
npx playwright test tests/e2e/smoke/smoke.spec.ts

# Run specific E2E test
npx playwright test tests/e2e/critical-user-flow.spec.ts

# With auth bypass for local testing
NEXT_PUBLIC_BYPASS_AUTH=true npx playwright test <test-file>
```

### What Gets Tested

1. **Authentication Flow**
   - Magic link login
   - Email verification
   - Session management

2. **Core User Flows**
   - Dashboard navigation
   - Chat interactions
   - File uploads/downloads
   - Settings changes

3. **API Integration**
   - API endpoint responses
   - Error handling
   - Loading states

### File Upload/Curation Tests

```bash
# Test file upload and delete functionality
npx playwright test tests/curate-tab-test.spec.ts
```

Tests:
- Upload documents to knowledge base
- Delete documents from knowledge base
- Verify knowledge base state changes

## Production Testing

**CRITICAL**: Comprehensive production deployment verification.

### Test Against Production

```bash
# Production E2E tests
PLAYWRIGHT_BASE_URL=https://thebetabase.com npx playwright test

# Specific production test
NEXT_PUBLIC_BYPASS_AUTH=false PLAYWRIGHT_BASE_URL=https://thebetabase.com npx playwright test
```

### Production Test Checklist

1. **Deployment Verification**
   - Health endpoint (`/api/health`)
   - Main page load
   - Build timestamp verification
   - Stable response checks (3 consecutive healthy checks)

2. **Authentication Flow**
   - Magic link generation
   - Email verification (via Mailinator)
   - Session creation
   - Authorization checks

3. **Console Error Detection**
   - No JavaScript errors
   - No network failures
   - No broken resources

4. **Performance Metrics**
   - Page load times
   - API response times
   - Resource sizes

### Production Testing Documentation

- `docs/PRODUCTION_TESTING.md` - Complete production testing guide
- `tests/production/` - Production test suite

## Test Dashboard - Knowledge Sharing

**IMPORTANT**: The Test Dashboard creates a shared knowledge ecosystem between QA and Customer Support teams!

### How It Works

- **Failed tests → Support knowledge** - Error details stored in searchable knowledge base
- **Support tickets → Test creation** - Common issues guide test writing
- **Firecrawl analysis** - Deep application analysis informs testing and documentation
- **Vector embeddings** - Similarity search for "Find tests that failed like this support ticket"

### Why This Matters

- Reduce support ticket resolution time
- Prevent known issues from reaching production
- Create better documentation from real test scenarios
- Build feedback loop between QA and Support

### Implementation

- Test failures sync to `test_knowledge_base` table
- Support can search test failures for solutions
- Firecrawl discoveries become documentation
- All knowledge is vector-embedded for semantic search

## Testing with MCP Servers

### Playwright MCP

```bash
# Navigate to page
playwright_navigate url="http://localhost:3000"

# Check console errors
playwright_console_logs type="error"

# Take screenshot
playwright_screenshot name="test-result"

# Test interactions
playwright_click selector="button:has-text('Submit')"
playwright_fill selector="input[type='email']" value="test@example.com"
```

### Browserbase

Used for production testing with real browsers in the cloud.

### Browser Tools

Additional browser testing capabilities for debugging and analysis.

### Firecrawl MCP

```bash
# Crawl and analyze application
# Use for testing, recording LLM-friendly markdown, and analysis
```

## Testing Checklist

**MANDATORY**: Always test UI changes!

1. **Navigate to the page**: `playwright_navigate url="http://localhost:3000"`
2. **Check console errors**: `playwright_console_logs type="error"`
3. **Take screenshots**: `playwright_screenshot name="test-result"`
4. **Test interactions**: Click buttons, fill forms, verify responses
5. **Check connections**: Verify all API connections are working

## Auth Toggle for Testing

```bash
# Disable auth for development/localhost
NEXT_PUBLIC_BYPASS_AUTH=true npm run dev

# Enable auth for testing auth flow
npm run dev  # Without bypass flag
```

## Test Configuration Files

- `playwright.config.ts` - Default config (points to local or Render)
- `playwright.config.render.ts` - Explicit Render production testing
- `playwright.config.local.ts` - Local development testing
- `tests/setup/` - Test setup and utilities

## Authentication Testing

### Mailinator Test Setup

**Test Email Configuration:**

- **Test Email**: `siam-test-x7j9k2p4@mailinator.com`
- **Public Inbox**: https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-test-x7j9k2p4
- **No API key required** for basic testing

### Run Authentication Tests

```bash
# Main authentication flow test
npm run test:e2e tests/auth/magic-link-auth.spec.ts

# Test user authentication
npm run test:e2e tests/auth/test-user-auth.spec.ts
```

### Test Credentials

```
Allowed emails:
- matt@mattcarpenter.com
- fiona.burgess.ext@sonymusic.com
- fiona@fionaburgess.com
- claude@test.siam.ai
- *@sonymusic.com
- siam-test-x7j9k2p4@mailinator.com (test email)
```

## Test Organization

```
tests/
├── aoma/                    # AOMA validation tests
├── auth/                    # Authentication tests
├── e2e/                     # End-to-end tests
│   ├── smoke/              # Critical path smoke tests
│   └── critical-user-flow.spec.ts
├── visual/                  # Visual regression tests
│   ├── mac-design-system-regression.spec.ts
│   └── dark-theme-regression.spec.ts
├── production/              # Production-specific tests
│   └── AOMA-TESTING-README.md
├── curate-tab-test.spec.ts # File upload/delete
└── setup/                   # Test setup and utilities
```

## Writing New Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    const button = page.locator('button:has-text("Submit")');

    // Act
    await button.click();

    // Assert
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('should handle errors', async ({ page }) => {
    // Test error cases
  });
});
```

### Best Practices

1. **Use descriptive test names** - "should do X when Y"
2. **Test one thing per test** - Keep tests focused
3. **Use proper selectors** - Prefer data-testid or role-based selectors
4. **Test happy and sad paths** - Both success and failure cases
5. **Clean up after tests** - Reset state between tests
6. **Check console errors** - Always verify no console errors
7. **Take screenshots on failure** - Aid debugging

## CI/CD Integration

Tests run automatically in CI/CD pipeline:

- **Pre-push hook**: Smoke tests on feature branches
- **PR checks**: Full test suite on PRs
- **Post-deployment**: Production verification tests

See [CI/CD Pipeline](../deployment/CI-CD-PIPELINE.md) for complete automation details.

## Quick Reference

```bash
# P0 Critical Tests
npm run test:aoma          # AOMA anti-hallucination
npm run test:visual        # Visual regression
npm run test:e2e          # E2E smoke tests

# Specific suites
npm run test:aoma:knowledge    # AOMA knowledge base
npm run test:visual:mac        # MAC Design System
npm run test:visual:dark-theme # Dark theme

# Production
PLAYWRIGHT_BASE_URL=https://thebetabase.com npx playwright test

# With auth bypass
NEXT_PUBLIC_BYPASS_AUTH=true npx playwright test
```

## Reference

- **TESTING_FUNDAMENTALS.md** - Complete testing guide
- **PRODUCTION_TESTING.md** - Production deployment verification
- **tests/README.md** - Test suite overview
- **tests/production/AOMA-TESTING-README.md** - AOMA testing guide

---

*For quick reference, see [QUICK-START.md](../QUICK-START.md)*
