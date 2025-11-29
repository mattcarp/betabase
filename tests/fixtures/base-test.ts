/**
 * Base Test Fixture with Mandatory Console Error Monitoring
 *
 * ALL tests should import from this file instead of '@playwright/test'.
 * This ensures every test automatically fails if console errors occur.
 *
 * Usage:
 * ```typescript
 * import { test, expect } from '../fixtures/base-test';
 * // or from tests root:
 * import { test, expect } from './fixtures/base-test';
 * ```
 */

import { test as base, expect } from '@playwright/test';

interface ConsoleMessage {
  type: string;
  text: string;
  timestamp: number;
  url?: string;
}

interface NetworkError {
  url: string;
  status: number;
  statusText: string;
}

// Known acceptable errors that are handled gracefully in code
const ALLOWED_ERROR_PATTERNS = [
  // Auth status checks - 401 is expected when not logged in
  /Failed to load resource:.*401/i,
  /status of 401/i,

  // Supabase table checks - handled with try-catch
  /Failed to load resource:.*404/i,
  /status of 404/i,

  // OPTIONS preflight - browser behavior
  /Failed to load resource:.*405/i,
  /status of 405/i,
  /Method Not Allowed/i,

  // Dev server instability (Turbopack/Next.js build manifest issues)
  // TODO: Remove once upgraded to Next.js 16 or Turbopack stabilizes
  /Failed to load resource:.*500/i,
  /status of 500.*Internal Server Error/i,
  /Cannot find module/i,  // Turbopack runtime module errors
  /ENOENT.*build-manifest\.json/i,
  /ENOENT.*app-paths-manifest\.json/i,
  /chunks\/ssr/i,  // Turbopack SSR chunk errors
  /\[turbopack\]/i,  // Any turbopack-related error

  // React hydration warnings (not errors)
  /Warning: Text content did not match/i,

  // Dev-only warnings
  /Download the React DevTools/i,

  // Service worker registration (optional feature)
  /service worker/i,

  // Third-party script errors (analytics, etc)
  /third-party/i,
  /gtag/i,
  /analytics/i,
];

function shouldIgnoreError(text: string): boolean {
  return ALLOWED_ERROR_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Extended test fixture that automatically monitors and fails on console errors
 */
export const test = base.extend<{
  consoleErrors: ConsoleMessage[];
  networkErrors: NetworkError[];
  failOnConsoleError: boolean;
}>({
  // Default: fail on console errors
  failOnConsoleError: [true, { option: true }],

  consoleErrors: [async ({ page }, use) => {
    const errors: ConsoleMessage[] = [];

    // Capture all console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        errors.push({
          type: 'console.error',
          text,
          timestamp: Date.now(),
          url: page.url(),
        });
        // Always log to test output for visibility
        console.log(`[CONSOLE ERROR CAPTURED] ${text}`);
      }
    });

    // Capture uncaught exceptions
    page.on('pageerror', error => {
      errors.push({
        type: 'pageerror',
        text: error.message,
        timestamp: Date.now(),
        url: page.url(),
      });
      console.log(`[PAGE ERROR] ${error.message}`);
      if (error.stack) {
        console.log(`[STACK] ${error.stack.split('\n').slice(0, 3).join('\n')}`);
      }
    });

    await use(errors);
  }, { auto: true }],

  networkErrors: [async ({ page }, use) => {
    const errors: NetworkError[] = [];

    page.on('response', response => {
      const status = response.status();
      // Capture 4xx and 5xx errors, but not 404s (often expected)
      if (status >= 400 && status !== 404) {
        errors.push({
          url: response.url(),
          status,
          statusText: response.statusText(),
        });
        console.log(`[NETWORK ERROR] ${status} ${response.url()}`);
      }
    });

    await use(errors);
  }, { auto: true }],
});

/**
 * afterEach hook that runs after EVERY test to check for errors
 * This is the key enforcement mechanism
 */
test.afterEach(async ({ consoleErrors, networkErrors, failOnConsoleError }, testInfo) => {
  // Filter out known acceptable errors
  const realErrors = consoleErrors.filter(err => !shouldIgnoreError(err.text));

  // Generate error report
  if (realErrors.length > 0 || networkErrors.length > 0) {
    console.log('\n========== ERROR SUMMARY ==========');

    if (realErrors.length > 0) {
      console.log(`\nConsole Errors (${realErrors.length}):`);
      realErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. [${err.type}] ${err.text.substring(0, 200)}`);
        if (err.url) console.log(`     URL: ${err.url}`);
      });
    }

    if (networkErrors.length > 0) {
      console.log(`\nNetwork Errors (${networkErrors.length}):`);
      networkErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.status} ${err.statusText} - ${err.url}`);
      });
    }

    console.log('\n===================================\n');
  }

  // Fail the test if console errors occurred (unless disabled)
  if (failOnConsoleError && realErrors.length > 0) {
    const errorMessages = realErrors.map(e => `[${e.type}] ${e.text}`).join('\n');

    // Attach errors to test report
    await testInfo.attach('console-errors', {
      body: JSON.stringify(realErrors, null, 2),
      contentType: 'application/json',
    });

    throw new Error(
      `Test "${testInfo.title}" passed but had ${realErrors.length} console error(s):\n\n${errorMessages}\n\n` +
      `To temporarily disable this check, use: test.use({ failOnConsoleError: false })`
    );
  }
});

/**
 * Helper to temporarily disable console error checking for a specific test
 * Use sparingly - only when errors are expected and handled
 *
 * Usage:
 * ```typescript
 * test.describe('Error handling tests', () => {
 *   test.use({ failOnConsoleError: false });
 *
 *   test('should handle network failure gracefully', async ({ page }) => {
 *     // Test error handling UI
 *   });
 * });
 * ```
 */

// Re-export expect for convenience
export { expect };

// Export types for consumers
export type { ConsoleMessage, NetworkError };
