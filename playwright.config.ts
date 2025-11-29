/**
 * Playwright Configuration
 *
 * IMPORTANT: All tests should import from './tests/fixtures/base-test'
 * instead of '@playwright/test' to get automatic console error monitoring.
 *
 * Example:
 *   import { test, expect } from './fixtures/base-test';
 *
 * Tests will FAIL if console errors occur unless explicitly disabled:
 *   test.use({ failOnConsoleError: false });
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  timeout: 60000,
  testDir: "./tests",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html"],
    ["list"], // Also show test names in console
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Output directory for test artifacts
  outputDir: "test-results",
  // No webServer config - testing against deployed URL
});
