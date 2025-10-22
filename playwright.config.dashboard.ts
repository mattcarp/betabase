import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration for Test Dashboard Integration
 * Uses custom reporter to stream results to the SIAM Test Dashboard
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2, // Limit workers for dashboard visibility

  // Use our custom dashboard reporter along with built-in reporters
  reporter: [
    ["./playwright-dashboard-reporter.js"],
    ["json", { outputFile: ".playwright-results/results.json" }],
    ["line"], // Minimal console output
  ],

  use: {
    // Use localhost for dashboard integration testing
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],

  // Configure output directories
  outputDir: ".playwright-results/test-results",

  // Global setup/teardown for dashboard integration
  globalSetup: require.resolve("./tests/global-setup.ts"),
  globalTeardown: require.resolve("./tests/global-teardown.ts"),

  // Timeout configurations
  timeout: 30000,
  expect: {
    timeout: 5000,
  },

  // Web server configuration for local testing
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: "npm run dev",
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});
