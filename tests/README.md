# SIAM Testing Architecture

This project uses two test frameworks:
- **Vitest** for unit and integration tests (.test.ts files)
- **Playwright** for end-to-end browser tests (.spec.ts files)

---

# 🧪 Vitest Unit & Integration Tests

## Quick Start

```bash
# Run unit tests (fast, no dependencies)
npm run test:unit

# Run integration tests (requires services)
INTEGRATION_TESTS=1 npm run test:integration

# Run all Vitest tests
npm run test
```

## Test Organization

```
tests/
├── unit/                       # Pure unit tests (.test.ts)
│   ├── emailParser.test.ts     # 27 tests
│   └── microsoftEmailParser.test.ts  # 16 tests
├── integration/                # Integration tests (.test.ts)
│   ├── emailContext.test.ts
│   ├── emailContextApi.test.ts
│   └── multi-tenant-vector-store.test.ts
├── helpers/                    # Test utilities
│   └── integration-test.ts
└── setup/                      # Test configuration
    └── no-mocks-allowed.ts     # Enforces no-mock policy
```

## No-Mock Policy ❌

This project enforces a **strict NO-MOCK policy**:

- ❌ `vi.fn()`, `vi.mock()`, `vi.spyOn()` are **forbidden**
- ✅ Use real service instances
- ✅ Let tests fail honestly when services fail
- ✅ Tests validate actual behavior, not mock behavior

See "Vitest Writing Tests" section below for examples.

## Integration Test Pattern

Integration tests are skipped unless `INTEGRATION_TESTS=1`:

```typescript
const isIntegrationTest = !!process.env.INTEGRATION_TESTS;

describe.skipIf(!isIntegrationTest)('My Integration Tests', () => {
  // Tests that require real services
});
```

## Vitest Writing Tests

### Unit Test Example
```typescript
import { describe, test, expect } from 'vitest';
import { EmailParser } from '@/utils/emailParser';

describe('Email Parser', () => {
  test('should parse email subject', () => {
    const email = {
      messageId: 'test-1',
      from: 'sender@example.com',
      to: ['recipient@example.com'],
      subject: 'Test',
      body: 'Hello'
    };

    const result = EmailParser.parseEmail(email);
    expect(result.content).toContain('Subject: Test');
  });
});
```

### Integration Test Example
```typescript
import { describe, test, expect } from 'vitest';

const isIntegrationTest = !!process.env.INTEGRATION_TESTS;

describe.skipIf(!isIntegrationTest)('Email API', () => {
  test('should create email', async () => {
    const response = await fetch('http://localhost:3000/api/email', {
      method: 'POST',
      body: JSON.stringify({ messageId: 'test-1', /* ... */ })
    });
    expect(response.ok).toBe(true);
  });
});
```

## Vitest Debugging

```bash
# Run specific file
npm run test tests/unit/emailParser.test.ts

# Watch mode
npm run test:watch

# With UI
npm run test:ui

# With coverage
npm run test:coverage
```

---

# Playwright E2E Tests

## Directory Structure

```
tests/
├── e2e/                         # End-to-end browser tests
│   ├── smoke/                   # Quick validation tests (< 30s total)
│   ├── features/                # Feature-specific tests (RLHF, chat, dashboard)
│   ├── visual/                  # Visual regression tests (screenshots)
│   ├── production/              # Production-only tests (Mailinator auth, AOMA)
│   ├── demo/                    # Demo/showcase tests
│   └── critical-paths/          # Critical user journey tests
│
├── unit/                        # Unit tests (Vitest)
├── integration/                 # Integration tests (Vitest)
├── auth/                        # Auth flow tests and helpers
├── performance/                 # Performance benchmarks
├── helpers/                     # Shared test utilities
├── fixtures/                    # Test fixtures and data
├── setup/                       # Test configuration
├── _archive/                    # Archived/experimental tests
└── screenshots/                 # Test screenshot output
```

## Test Naming Conventions

### File Naming

- **Unit/Component**: `[component-name].spec.ts`
- **Feature Tests**: `[feature-name]-test.spec.ts`
- **Integration**: `[system]-integration.spec.ts`
- **E2E Journeys**: `[user-journey]-e2e.spec.ts`
- **Visual Tests**: `[page-name]-visual.spec.ts`

### Test Organization

```typescript
// Standard test structure
import { test, expect } from "@playwright/test";
import { helpers } from "./helpers/test-utils";

test.describe("Feature Name", () => {
  // Setup hooks
  test.beforeAll(async () => {});
  test.beforeEach(async ({ page }) => {});

  // Grouped tests
  test.describe("Specific Functionality", () => {
    test("should perform action @smoke", async ({ page }) => {});
    test("should handle edge case @regression", async ({ page }) => {});
  });

  // Cleanup
  test.afterEach(async () => {});
  test.afterAll(async () => {});
});
```

## Test Tags System

Use tags for test categorization and selective execution:

- `@smoke` - Critical path tests, run on every commit
- `@regression` - Full regression suite
- `@visual` - Visual regression tests
- `@api` - API-specific tests
- `@auth` - Authentication tests
- `@slow` - Long-running tests
- `@production` - Production-only tests
- `@local` - Local-only tests

## Running Tests

### Quick Reference

```bash
# LOCAL DEVELOPMENT (localhost:3000)
npm run test:smoke:local       # Quick smoke tests
npm run test:features:local    # Feature tests
npm run test:visual:local      # Visual regression

# PRODUCTION (thebetabase.com)
npm run test:smoke             # Smoke tests on prod
npm run test:features          # Feature tests on prod
npm run test:visual            # Visual regression on prod
npm run test:aoma              # AOMA knowledge validation
npm run test:prod              # All production tests

# UTILITIES
npm run test:demo              # Demo/showcase tests
npm run test:critical          # Critical path tests
npm run test:report            # View HTML report
```

### Local Development

```bash
# Run smoke tests against localhost
npm run test:smoke:local

# Run feature tests against localhost
npm run test:features:local

# Run specific test file
npx playwright test tests/e2e/features/ai-chat.spec.ts

# Run in UI mode for debugging
npx playwright test --ui

# Run in headed mode
npx playwright test --headed
```

### Against Production (Render)

```bash
# Run all tests against thebetabase.com
npm run test:e2e

# Run AOMA validation tests
npm run test:aoma

# Run all production tests
npm run test:prod

# Run visual tests
npm run test:visual
```

## Writing New Tests

### 1. Choose the Right Directory

- **api/**: Testing REST endpoints, GraphQL queries
- **auth/**: Login, logout, password reset, permissions
- **e2e/**: Complete user workflows
- **visual/**: Screenshot comparisons, UI consistency

### 2. Use Helpers

```typescript
import { login, logout } from "../helpers/auth";
import { generateTestData } from "../helpers/test-data-generator";
import { waitForAPI } from "../helpers/test-utils";

test("authenticated user flow", async ({ page }) => {
  await login(page, "test@example.com", "password");
  // ... test logic
  await logout(page);
});
```

### 3. Page Object Model (Recommended)

Create page objects for reusable interactions:

```typescript
// tests/pages/chat-page.ts
export class ChatPage {
  constructor(private page: Page) {}

  async sendMessage(text: string) {
    await this.page.fill('[data-testid="chat-input"]', text);
    await this.page.click('[data-testid="send-button"]');
  }

  async getLastMessage() {
    return this.page.textContent('[data-testid="message"]:last-child');
  }
}
```

## Environment Configuration

### Test Data Attributes

Add data-testid attributes to components for reliable selection:

```tsx
<button data-testid="submit-button">Submit</button>
```

### Environment Variables

```bash
# .env.test
BASE_URL=http://localhost:3000
TEST_USER_EMAIL=test@sonymusic.com
TEST_USER_PASSWORD=secure_password
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run Playwright tests
  run: |
    npx playwright install --with-deps
    npm run test:e2e
  env:
    BASE_URL: ${{ secrets.RENDER_URL }}
```

## Best Practices

1. **Keep tests independent** - Each test should run in isolation
2. **Use explicit waits** - Avoid arbitrary sleeps
3. **Mock external services** - Use MSW or Playwright's route handlers
4. **Clean up after tests** - Reset state, delete test data
5. **Use descriptive names** - Test names should explain what they verify
6. **Parallelize wisely** - Use workers for speed, but consider resource limits
7. **Screenshot on failure** - Automatic screenshots help debug CI failures

## Debugging

```bash
# Debug single test
npx playwright test --debug tests/specific.spec.ts

# Generate trace for debugging
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip

# Run with verbose logging
DEBUG=pw:api npx playwright test
```

## Reports

Test reports are generated in:

- `playwright-report/` - HTML report
- `test-results/` - JSON results and failure artifacts
- `screenshots/` - Visual test screenshots

View HTML report:

```bash
npx playwright show-report
```

## IDE Integration

### VS Code

Install the "Playwright Test for VSCode" extension for:

- Run tests from editor
- Debug breakpoints
- Auto-completion

### WebStorm/IntelliJ

Built-in Playwright support:

- Right-click to run tests
- Debugging support
- Test generation

## Quick Test Template

```typescript
// tests/[category]/new-feature.spec.ts
import { test, expect } from "@playwright/test";

test.describe("New Feature", () => {
  test("should do something @smoke", async ({ page }) => {
    // Arrange
    await page.goto("/");

    // Act
    await page.click('[data-testid="feature-button"]');

    // Assert
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

reenshots during tests

```bash
await helpers.takeDebugScreenshot("test-name");
```

### Enable headed mode

```bash
npx playwright test --headed
```

### Use VS Code extension

Install "Playwright Test for VSCode" for integrated debugging

## CI/CD Integration

Tests are configured to run in CI with:

- Headless mode
- Retry on failure (2 attempts)
- Single worker to avoid conflicts
- HTML report generation

## Troubleshooting

### Tests fail locally but pass in CI

- Check if dev server is running
- Verify NEXT_PUBLIC_BYPASS_AUTH is set
- Clear browser cache/storage

### Timeout errors

- Increase timeout in config
- Check network conditions
- Verify API endpoints are responding

### Element not found

- Check if UI has changed
- Verify selectors are correct
- Add wait conditions before interactions

## Contributing

When adding new tests:

1. Follow existing patterns and structure
2. Use the TestHelpers class for common operations
3. Add comprehensive error scenarios
4. Update this README with new coverage
5. Ensure tests are independent and repeatable
