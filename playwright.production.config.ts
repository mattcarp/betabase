/**
 * Playwright Configuration for Production Testing
 * No webServer - runs tests directly against the production URL
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  timeout: 120000,
  testDir: "./tests",
  testMatch: /.*\.spec\.ts/,
  testIgnore: ["**/tests/_archive/**", "**/tests/legacy/**"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "https://thebetabase.com",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  outputDir: "test-results",
  // No webServer - tests run against the production URL
});
