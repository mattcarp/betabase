# SIAM Testing Architecture Rules for Claude Code

## Testing Framework
- We use Playwright for all E2E testing
- Tests are written in TypeScript
- Follow Page Object Model pattern for complex pages

## 🚨 CRITICAL PRODUCTION TEST RULE 🚨
**ALL PRODUCTION TESTS MUST USE MAILINATOR FOR AUTHENTICATION**
- Production URL: https://siam.onrender.com
- Auth method: Magic link via Mailinator ONLY
- Email format: siam-test-{timestamp}@mailinator.com
- See tests/production/mailinator-auth-template.spec.ts for the pattern
- NEVER mock auth or use direct login in production tests

## Test Structure
Tests are organized in /tests/ with this hierarchy:
- api/ - API endpoint tests
- auth/ - Authentication flows
- e2e/ - End-to-end journeys
- visual/ - Visual regression
- helpers/ - Shared utilities
- local/ - Local dev only
- production/ - Prod only

## When Creating New Tests
1. Place in appropriate directory based on test type
2. Name files as: [feature].spec.ts
3. Tag with @smoke for critical tests
4. Use data-testid attributes for selectors
5. Import helpers from tests/helpers/

## CRITICAL: Production vs Local Testing
**PRODUCTION TESTS:**
- ALWAYS use Mailinator for magic link authentication
- Use test email like: siam-test-{timestamp}@mailinator.com
- Magic link flow: Request link → Check Mailinator → Click link
- NEVER use direct login or mock auth in production
- Tag with @production

**LOCAL TESTS:**
- Can use direct auth or mock credentials
- Can bypass magic link flow for speed
- Use localhost:3000 as base URL

## Git Commands for Tests
To commit only production tests:
```bash
git add tests/production/
git add tests/auth/*mailinator*.spec.ts
git commit -m "feat: production tests with Mailinator flow"
```

To exclude local-only tests from commits:
```bash
git add tests/ --ignore tests/local/
```

## Running Tests
- Local: npm run test:e2e:local
- Render: npm run test:e2e
- Debug: npx playwright test --ui

## Test Template
```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature", () => {
  test("action @smoke", async ({ page }) => {
    await page.goto("/");
    // test logic
    await expect(page.locator("[data-testid='']")).toBeVisible();
  });
});
```

## Key Configs
- playwright.config.ts - Main/Render config
- playwright.config.local.ts - Local dev
- Tests use baseURL from config

## Documentation
See /tests/README.md for comprehensive guide
