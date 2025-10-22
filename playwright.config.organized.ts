import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration - Organized Test Structure
 * Uses layer-based projects for better organization
 */

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

export default defineConfig({
  // Test directory
  testDir: "./tests",

  // Parallelization
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 1 : undefined,

  // Retries
  retries: process.env.CI ? 2 : 0,

  // Reporter
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["list"],
  ],

  // Global settings
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  // Projects for different test layers
  projects: [
    // Unit tests - Fast, isolated
    {
      name: "unit",
      testMatch: "**/01-unit/**/*.test.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: BASE_URL,
      },
      timeout: 5000,
      retries: 0,
    },

    // Integration tests - Component interactions
    {
      name: "integration",
      testMatch: "**/02-integration/**/*.test.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: BASE_URL,
      },
      timeout: 15000,
      retries: 1,
    },

    // E2E Smoke tests - Critical paths only
    {
      name: "e2e-smoke",
      testMatch: "**/03-e2e/**/*.test.ts",
      grep: /@smoke/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: BASE_URL,
      },
      timeout: 30000,
      retries: 2,
    },
    // E2E Full regression
    {
      name: "e2e-regression",
      testMatch: "**/03-e2e/**/*.test.ts",
      grep: /@regression/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: BASE_URL,
      },
      timeout: 30000,
      retries: 2,
    },

    // Visual regression tests
    {
      name: "visual",
      testMatch: "**/04-visual/**/*.test.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: BASE_URL,
      },
      timeout: 10000,
      retries: 1,
    },

    // Mobile tests
    {
      name: "mobile",
      testMatch: "**/*.test.ts",
      grep: /@mobile/,
      use: {
        ...devices["iPhone 13"],
        baseURL: BASE_URL,
      },
    },
  ],

  // Web server config for local development
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});
