# 🧪 SIAM Production Testing Guide

## Overview

This guide documents our comprehensive testing strategy for production deployments, with special focus on authentication flows and preventing regression of production-specific issues.

## 🚨 Critical Production Issues & Solutions

### Web Component Registration Conflicts (September 2024)

**Issue**: External web components (like `ace-autosize-textarea`) from browser extensions or third-party scripts can cause authentication failures in production.

**Solution**: Implemented `CustomElementGuard` component that intercepts and safely handles duplicate custom element registrations.

**Prevention**:

- Always test with real production environment
- Monitor browser console for DOMException errors
- Check for third-party script conflicts

## 📋 Test Infrastructure

### Available Test Commands

```bash
# Local Development Testing
npm run test:e2e:local              # Test against localhost:3000

# Production Testing (Render)
npm run test:e2e:render             # Test against production URL

# Interactive Testing
npm run test:e2e:ui                 # Opens Playwright UI
npm run test:e2e:debug              # Debug mode with inspector

# Quick Test Suites
npm run test                        # Unit tests
npm run test:e2e                    # All E2E tests
```

### Test Configurations

| Config File                   | Target            | Use Case        |
| ----------------------------- | ----------------- | --------------- |
| `playwright.config.ts`        | Default           | General testing |
| `playwright.config.local.ts`  | localhost:3000    | Development     |
| `playwright.config.render.ts` | siam.onrender.com | Production      |

## 🔐 Authentication Testing

### Test Accounts

```javascript
// Allowed test emails (configured in Cognito)
const testAccounts = [
  "matt@mattcarpenter.com",
  "fiona.burgess.ext@sonymusic.com",
  "fiona@fionaburgess.com",
  "claude@test.siam.ai",
  "siam-test-x7j9k2p4@mailinator.com", // Public Mailinator inbox
];
```

### Magic Link Flow Testing

```typescript
// tests/auth/production-auth.spec.ts
import { test, expect } from "@playwright/test";

test("Magic link authentication flow", async ({ page }) => {
  // Navigate to production
  await page.goto("https://thebetabase.com");

  // Enter email
  await page.fill('input[type="email"]', "siam-test-x7j9k2p4@mailinator.com");
  await page.click('button:has-text("Send Magic Link")');

  // Check for success message
  await expect(page.locator("text=/check your email/i")).toBeVisible();

  // Monitor for console errors
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  // Verify no web component conflicts
  expect(errors.filter((e) => e.includes("CustomElementRegistry"))).toHaveLength(0);
});
```

### Authentication Bypass for Testing

```bash
# Disable auth for development/testing
NEXT_PUBLIC_BYPASS_AUTH=true npm run dev

# Enable auth for production testing
npm run dev  # Without bypass flag
```

## 🎯 Production Deployment Testing

### Pre-Deployment Checklist

```bash
#!/bin/bash
# Run before pushing to main

echo "🔍 Running pre-deployment checks..."

# 1. Type checking
npm run type-check || exit 1

# 2. Linting
npm run lint || exit 1

# 3. Unit tests
npm run test || exit 1

# 4. Local E2E tests
npm run test:e2e:local || exit 1

# 5. Build test
npm run build || exit 1

echo "✅ All checks passed - ready to deploy!"
```

### Post-Deployment Verification

```typescript
// tests/production/deployment-verification.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Production Deployment Verification", () => {
  test("Health check endpoint", async ({ request }) => {
    const response = await request.get("https://thebetabase.com/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("healthy");
  });

  test("No console errors on load", async ({ page }) => {
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("https://thebetabase.com");
    await page.waitForLoadState("networkidle");

    // Filter out known benign errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("Failed to load resource") && // CDN timeouts
        !e.includes("ResizeObserver") // Browser quirk
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("Authentication flow works", async ({ page }) => {
    await page.goto("https://thebetabase.com");

    // Check login form is present
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // No web component errors
    const hasComponentError = await page.evaluate(() => {
      return window.console.error.toString().includes("CustomElementRegistry");
    });
    expect(hasComponentError).toBeFalsy();
  });

  test("Critical routes are accessible", async ({ page }) => {
    const routes = ["/login", "/debug", "/gpt5-chat"];

    for (const route of routes) {
      const response = await page.goto(`https://thebetabase.com${route}`);
      expect(response?.status()).toBeLessThan(400);
    }
  });
});
```

## 🔍 Monitoring Production Issues

### Browser Console Monitoring

```javascript
// Add to your test setup
page.on("console", (msg) => {
  console.log(`${msg.type()}: ${msg.text()}`);
});

page.on("pageerror", (error) => {
  console.error("Page error:", error.message);
});

page.on("requestfailed", (request) => {
  console.error("Request failed:", request.url());
});
```

### Common Production Issues to Test

1. **Third-party Script Conflicts**
   - Web components registration
   - Browser extension interference
   - CDN script loading failures

2. **Environment Variable Issues**
   - Missing NEXT*PUBLIC*\* variables
   - Incorrect API endpoints
   - Auth configuration problems

3. **Build-time vs Runtime Issues**
   - Dynamic imports failing
   - SSR/CSR mismatches
   - Hydration errors

## 📊 Test Reports & Metrics

### Generate Test Reports

```bash
# HTML Report
npm run test:e2e:render -- --reporter=html

# JUnit for CI/CD
npm run test:e2e:render -- --reporter=junit

# Coverage Report
npm run test:coverage
```

### Key Metrics to Track

- **Authentication Success Rate**: >99.9%
- **Page Load Time**: <2s
- **Console Errors**: 0 critical
- **API Response Time**: <500ms
- **Test Coverage**: >80%

## 🚀 CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/production-tests.yml
name: Production Tests

on:
  deployment_status:

jobs:
  test:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install

      - name: Run production tests
        run: npm run test:e2e:render
        env:
          BASE_URL: ${{ github.event.deployment_status.target_url }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

## 🛠️ Debugging Production Issues

### Quick Debug Commands

```bash
# Check Render logs
render logs siam-app --tail 100

# Monitor deployment
./scripts/monitor-deployment.py

# Test specific feature
npx playwright test tests/auth/magic-link-auth.spec.ts --debug

# Generate trace for failed test
npx playwright test --trace on
```

### Using Playwright Inspector

```typescript
// Pause execution for debugging
await page.pause();

// Take screenshot at any point
await page.screenshot({ path: "debug.png" });

// Evaluate in browser context
const result = await page.evaluate(() => {
  return window.location.href;
});
```

## 📝 Test Writing Best Practices

### 1. Always Test Happy Path First

```typescript
test("User can complete full journey", async ({ page }) => {
  // Login
  // Navigate
  // Perform action
  // Verify result
});
```

### 2. Test Error Conditions

```typescript
test("Handles network failure gracefully", async ({ page }) => {
  // Simulate offline
  await page.route("**/api/**", (route) => route.abort());
  // Verify error handling
});
```

### 3. Use Page Object Model

```typescript
class LoginPage {
  constructor(private page: Page) {}

  async login(email: string) {
    await this.page.fill('input[type="email"]', email);
    await this.page.click('button:has-text("Send Magic Link")');
  }
}
```

### 4. Test Data Isolation

```typescript
test.beforeEach(async () => {
  // Reset test data
  // Clear local storage
  // Set up test context
});
```

## 🎭 Visual Regression Testing

```typescript
test("Login page visual consistency", async ({ page }) => {
  await page.goto("https://thebetabase.com");
  await expect(page).toHaveScreenshot("login-page.png", {
    maxDiffPixels: 100,
    threshold: 0.2,
  });
});
```

## 📱 Mobile Testing

```typescript
test.use({
  ...devices["iPhone 13"],
});

test("Mobile responsive design", async ({ page }) => {
  await page.goto("https://thebetabase.com");
  // Test mobile-specific interactions
});
```

## 🔄 Continuous Monitoring

### Health Check Script

```bash
#!/bin/bash
# scripts/health-check.sh

URL="https://thebetabase.com/api/health"

while true; do
  response=$(curl -s -o /dev/null -w "%{http_code}" $URL)
  if [ $response -ne 200 ]; then
    echo "❌ Health check failed: $response"
    # Send alert
  else
    echo "✅ Health check passed"
  fi
  sleep 60
done
```

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Render Deployment Guide](./RENDER_DEPLOYMENT.md)
- [Authentication Architecture](./AUTH_ARCHITECTURE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

## 🤝 Contributing

When adding new tests:

1. Follow naming convention: `feature-name.spec.ts`
2. Add to appropriate directory under `/tests`
3. Include in both local and production test suites
4. Document any new test utilities
5. Update this guide with new patterns

---

_Last Updated: September 2024_
_After CustomElementGuard implementation_
