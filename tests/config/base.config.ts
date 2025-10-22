import { PlaywrightTestConfig } from "@playwright/test";

/**
 * Base configuration shared across all environments
 */
export const baseConfig: Partial<PlaywrightTestConfig> = {
  // Test directory
  testDir: "../",

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 4,

  // Reporting
  reporter: [
    ["html", { open: "never" }],
    ["list"],
    ["json", { outputFile: "test-results.json" }],
    ...(process.env.CI ? [["github"] as any] : []),
  ],

  // Global test settings
  use: {
    // Actions timeout
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // Screenshots and traces
    screenshot: {
      mode: "only-on-failure",
      fullPage: true,
    },
    trace: "retain-on-failure",
    video: process.env.CI ? "retain-on-failure" : "off",

    // Browser settings
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    // Custom test attributes
    testIdAttribute: "data-testid",
  },

  // Test match patterns
  testMatch: ["**/*.spec.ts"],

  // Global timeout
  timeout: 60000,

  // Output folder
  outputDir: "../test-results",

  // Maximum test failures
  maxFailures: process.env.CI ? 10 : undefined,
};

/**
 * Test tags for organizing test execution
 */
export const TEST_TAGS = {
  SMOKE: "@smoke",
  CRITICAL: "@critical",
  REGRESSION: "@regression",
  VISUAL: "@visual",
  SLOW: "@slow",
  API: "@api",
  E2E: "@e2e",
} as const;

/**
 * Test timeouts by category
 */
export const TIMEOUTS = {
  SHORT: 10000,
  MEDIUM: 30000,
  LONG: 60000,
  EXTRA_LONG: 120000,
} as const;
