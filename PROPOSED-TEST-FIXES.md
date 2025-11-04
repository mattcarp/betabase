# Proposed Test Fixes

This document contains specific code fixes for the remaining test issues identified in TEST-REPORT.md.

---

## Fix #1: Remove Demo/Showcase Files

### Files to Delete
```bash
rm tests/showcase-vitest-features.test.ts
rm tests/vitest-demo.test.tsx
```

### Rationale
- These are demonstration files showing Vitest features
- They violate the project's strict no-mock policy (20+ violations)
- They cause localStorage errors (wrong environment)
- They provide no value to the actual test suite
- Removing them will eliminate 25+ test failures

---

## Fix #2: Separate Unit and Integration Tests

### Update package.json

Add these scripts:
```json
{
  "scripts": {
    "test:unit": "vitest run --exclude tests/integration/**",
    "test:integration": "vitest run tests/integration/** --bail",
    "test:integration:with-server": "./scripts/test-with-server.sh"
  }
}
```

### Create Test Server Script

Create `scripts/test-with-server.sh`:
```bash
#!/bin/bash
# Run integration tests with a local dev server

set -e

echo "🚀 Starting dev server..."
npm run dev &
SERVER_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to be ready..."
sleep 5

# Run integration tests
echo "🧪 Running integration tests..."
npm run test:integration

# Cleanup
echo "🧹 Cleaning up..."
kill $SERVER_PID

echo "✅ Integration tests complete"
```

Make executable:
```bash
chmod +x scripts/test-with-server.sh
```

---

## Fix #3: Fix MicrosoftEmailParser Safe Links Bug

### File: src/utils/microsoftEmailParser.ts

Add this function (or update existing one):

```typescript
/**
 * Extract actual URLs from Outlook Safe Links
 * Outlook wraps URLs like: https://nam*.safelinks.protection.outlook.com/?url=https%3A%2F%2Fexample.com
 */
function extractSafeLinksUrls(content: string): string {
  // Pattern to match Outlook Safe Links
  const safeLinkPattern = /https:\/\/[^\/]*\.safelinks\.protection\.outlook\.com\/\?url=([^&"'\s<>]+)/g;

  let result = content;
  let match;

  while ((match = safeLinkPattern.exec(content)) !== null) {
    const encodedUrl = match[1];
    try {
      // Decode the URL parameter
      const decodedUrl = decodeURIComponent(encodedUrl);
      // Replace Safe Link with actual URL
      result = result.replace(match[0], decodedUrl);
    } catch (error) {
      // If decoding fails, keep original
      console.warn('Failed to decode Safe Link:', encodedUrl);
    }
  }

  return result;
}

// Update the main parsing function to use this:
export class MicrosoftEmailParser {
  static parseMicrosoftEmail(email: MicrosoftEmailData): ParsedEmail {
    let content = email.htmlBody || email.body || '';

    // Extract actual URLs from Safe Links
    content = extractSafeLinksUrls(content);

    // Continue with rest of parsing...
    // ... existing code ...

    return {
      messageId: email.messageId,
      content: content,
      metadata: { /* ... */ }
    };
  }
}
```

### Alternative: If file structure is different

Look for where HTML is being processed and add:
```typescript
// Before returning or using HTML content
htmlContent = htmlContent.replace(
  /https:\/\/[^\/]*\.safelinks\.protection\.outlook\.com\/\?url=([^&"'\s<>]+)/g,
  (match, encodedUrl) => {
    try {
      return decodeURIComponent(encodedUrl);
    } catch {
      return match;
    }
  }
);
```

---

## Fix #4: Handle aoma-orchestrator-architecture.test.ts

### Option A: Delete (RECOMMENDED)

If this test is checking that mocks work (which they shouldn't):
```bash
rm tests/unit/aoma-orchestrator-architecture.test.ts
```

### Option B: Rewrite Without Mocks

If this test is checking real orchestrator behavior, rewrite it:

```typescript
/**
 * Unit Tests: AOMA Orchestrator Architecture
 *
 * Verifies that the aomaOrchestrator uses Supabase-only path
 * and does NOT call Railway AOMA MCP server.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { aomaOrchestrator } from "@/services/aomaOrchestrator";

describe("AOMA Orchestrator Architecture", () => {
  beforeEach(() => {
    // Clear any caches
    // Use real service instances
  });

  it("should query Supabase vector store", async () => {
    // Test with real Supabase instance
    const result = await aomaOrchestrator.query("test query");

    expect(result).toBeDefined();
    expect(result.source).toBe("supabase");
  });

  it("should not make Railway API calls", async () => {
    // Monitor actual network calls (no mocks)
    const originalFetch = globalThis.fetch;
    const fetchCalls: string[] = [];

    globalThis.fetch = async (url: string, ...args: any[]) => {
      fetchCalls.push(url);
      return originalFetch(url, ...args);
    };

    try {
      await aomaOrchestrator.query("test query");

      // Verify no Railway calls
      const railwayCalls = fetchCalls.filter(url =>
        url.includes('railway.app')
      );
      expect(railwayCalls).toHaveLength(0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
```

---

## Fix #5: Add Integration Test Skip Logic

### Update integration test files

Add skip condition to files that need a server:

```typescript
// At top of test file
import { describe, test, expect, beforeAll } from "vitest";

const isIntegrationTest = !!process.env.INTEGRATION_TESTS;

describe.skipIf(!isIntegrationTest)("Email Context API Integration", () => {
  // ... tests ...
});
```

### Or: Add helper

Create `tests/helpers/integration-test.ts`:
```typescript
import { describe, test } from 'vitest';

/**
 * Skip integration tests unless INTEGRATION_TESTS env var is set
 */
export function describeIntegration(
  name: string,
  fn: () => void
) {
  const shouldRun = !!process.env.INTEGRATION_TESTS;
  return describe.skipIf(!shouldRun)(name, fn);
}

export function testIntegration(
  name: string,
  fn: () => void | Promise<void>
) {
  const shouldRun = !!process.env.INTEGRATION_TESTS;
  return test.skipIf(!shouldRun)(name, fn);
}
```

Usage:
```typescript
import { describeIntegration, testIntegration } from '../helpers/integration-test';

describeIntegration("Email Context API", () => {
  testIntegration("should post email", async () => {
    // ... test code ...
  });
});
```

---

## Fix #6: Add Test Documentation

### Create tests/README.md

```markdown
# SIAM Test Suite Documentation

## Test Types

### Unit Tests (.test.ts files)
- Pure unit tests with no external dependencies
- Run with: `npm run test:unit`
- Fast execution (<5s)
- Can run without server

### Integration Tests (tests/integration/*.test.ts)
- Test API endpoints and service integration
- Require local dev server running on port 3000
- Run with: `npm run test:integration:with-server`
- Slower execution (10-30s)

### E2E Tests (.spec.ts files)
- Playwright browser tests
- Test full user workflows
- Run with: `npm run test:e2e`
- Slowest execution (30s-5min)

## Running Tests

### Quick Unit Tests (No Setup Required)
```bash
npm run test:unit
```

### Integration Tests (Requires Server)
```bash
npm run test:integration:with-server
# OR manually:
npm run dev  # Terminal 1
npm run test:integration  # Terminal 2
```

### E2E Tests (Requires Browser)
```bash
npx playwright install chrome  # One-time setup
npm run test:e2e
```

### All Tests
```bash
npm run test:all  # Runs unit, integration (with server), and e2e
```

## Test Organization

```
tests/
├── unit/              # Pure unit tests
├── integration/       # API/service integration tests
├── e2e/              # Playwright E2E tests
│   ├── smoke/        # Quick smoke tests
│   ├── critical-paths/ # Critical user flows
│   └── ...
├── visual/           # Visual regression tests
├── performance/      # Performance benchmarks
├── production/       # Production environment tests
├── setup/            # Test configuration
└── helpers/          # Test utilities

## No-Mock Policy

This project enforces a strict NO-MOCK policy:

✅ DO:
- Use real service instances
- Test against actual APIs
- Let tests fail when services fail

❌ DON'T:
- Use vi.fn()
- Use vi.mock()
- Use vi.spyOn()
- Create mock objects

Why? Mocks create false positives. Tests should validate real behavior.

## Environment Variables

Integration tests use:
- `INTEGRATION_TESTS=1` - Enable integration tests
- `NEXT_PUBLIC_API_URL` - API base URL (default: http://localhost:3000)

E2E tests use:
- `PLAYWRIGHT_BASE_URL` - Base URL for Playwright (default: https://thebetabase.com)

## Debugging Tests

### Vitest
```bash
# Run specific test file
npm run test tests/unit/emailParser.test.ts

# Run with UI
npm run test:ui

# Run in watch mode
npm run test:watch
```

### Playwright
```bash
# Run with UI
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Run specific test
npx playwright test tests/e2e/smoke/smoke.spec.ts
```

## Writing Tests

### Unit Test Example
```typescript
import { describe, test, expect } from 'vitest';
import { parseEmail } from '@/utils/emailParser';

describe('Email Parser', () => {
  test('should parse email subject', () => {
    const email = { subject: 'Test', body: 'Hello' };
    const result = parseEmail(email);
    expect(result.subject).toBe('Test');
  });
});
```

### Integration Test Example
```typescript
import { describeIntegration, testIntegration } from '../helpers/integration-test';

describeIntegration('Email API', () => {
  testIntegration('should create email', async () => {
    const response = await fetch('http://localhost:3000/api/email', {
      method: 'POST',
      body: JSON.stringify({ subject: 'Test' })
    });
    expect(response.ok).toBe(true);
  });
});
```

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test';

test('should load homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/SIAM/);
});
```

## CI/CD

Tests run automatically on:
- Push to main
- Pull requests
- Pre-deployment

CI runs:
1. Unit tests (always)
2. E2E smoke tests (always)
3. Full E2E suite (on deploy)
4. Visual regression (on UI changes)

## Troubleshooting

### "localStorage is not defined"
- You're using browser APIs in a Node environment
- Change vitest.config.ts environment to "jsdom"
- Or add `// @vitest-environment jsdom` to test file

### "connect ECONNREFUSED 127.0.0.1:3000"
- Integration test needs dev server running
- Use `npm run test:integration:with-server`
- Or start server manually: `npm run dev`

### "vi.fn is FORBIDDEN"
- You're using mocks (not allowed)
- Rewrite test to use real implementations
- See "No-Mock Policy" above

### "Chromium not found"
- Playwright browsers not installed
- Run: `npx playwright install chrome`
```

---

## Implementation Order

1. **Immediate (5 minutes)**
   - Delete showcase-vitest-features.test.ts
   - Delete vitest-demo.test.tsx
   - Run tests: Should see 62 passing, 15 failing

2. **Quick (15 minutes)**
   - Add test:unit and test:integration scripts to package.json
   - Create integration-test.ts helper
   - Update integration test files to use skipIf
   - Run unit tests: Should see 62 passing, 1 failing

3. **Medium (30 minutes)**
   - Fix MicrosoftEmailParser Safe Links bug
   - Add tests to verify fix works
   - Run unit tests: Should see 63+ passing, 0 failing

4. **Complete (1 hour)**
   - Create tests/README.md
   - Create test-with-server.sh script
   - Review aoma-orchestrator-architecture.test.ts
   - Run full test suite verification

---

## Expected Results After All Fixes

### Unit Tests
```
Test Files  6 passed (6)
Tests      63 passed (63)
Duration   2-3s
```

### Integration Tests (with server)
```
Test Files  2 passed (2)
Tests      14 passed (14)
Duration   5-10s
```

### E2E Tests (with Playwright)
```
Tests      120+ passed
Duration   2-5min
```

---

## Notes

- All fixes maintain the no-mock policy
- All fixes are backwards compatible
- All fixes improve test reliability
- Documentation helps onboard new developers
