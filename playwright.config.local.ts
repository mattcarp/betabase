import { defineConfig, devices } from "@playwright/test";
import path from "path";

/**
 * Playwright Configuration for Local Development
 * Tests against localhost:3000
 */
export default defineConfig({
  // Test directory
  testDir: "./tests",
  // Ignore tests that require external secrets or non-Playwright runners
  testIgnore: [
    "tests/auth/**",
    "tests/curation-services.test.ts",
    "tests/e2e/critical-paths/**",
    "tests/03-e2e/**",
    "tests/local-dev.spec.ts",
  ],

  // Don't run tests in parallel locally for easier debugging
  fullyParallel: false,
  workers: 1,

  // No retries in local development
  retries: 0,

  // Allow .only in local development
  forbidOnly: false,

  // Global setup/teardown
  globalSetup: path.join(__dirname, "tests", "global-setup.ts"),
  globalTeardown: path.join(__dirname, "tests", "global-teardown.ts"),

  // Reporters for local development
  reporter: [["list"], ["html", { open: "on-failure" }]],

  // Shared settings
  use: {
    // Local development URL
    baseURL: "http://localhost:3000",

    // Always capture trace locally
    trace: "on",

    // Always take screenshots locally
    screenshot: {
      mode: "on",
      fullPage: true,
    },

    // Record video for debugging
    video: "on",

    // Shorter timeouts for local development
    actionTimeout: 10000,
    navigationTimeout: 20000,

    // Larger viewport for development
    viewport: { width: 1920, height: 1080 },

    // Show browser in headed mode
    headless: false,

    // Slow down actions for debugging
    launchOptions: {
      slowMo: 100,
    },
    // Bypass auth in local runs
    extraHTTPHeaders: {
      "x-bypass-auth": process.env.NEXT_PUBLIC_BYPASS_AUTH || "true",
    },
  },

  // Only test in Chrome locally
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
    },
  ],

  // Start local dev server
  webServer: {
    command: "npm run dev",
    port: 3000,
    timeout: 120000,
    reuseExistingServer: true,
    env: {
      NEXT_PUBLIC_BYPASS_AUTH: "true",
      NEXT_PUBLIC_SUPABASE_URL: "https://kfxetwuuzljhybfgmpuc.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeGV0d3V1emxqaHliZmdtcHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyOTYzMzMsImV4cCI6MjA1MTg3MjMzM30.2doKvph3M-JltbRy-RpqmglECqqivqbakwzdTloQBxg",
    },
  },

  // Output folder
  outputDir: "test-results/",

  // Longer timeout for debugging
  timeout: 120000,

  // Expect timeout
  expect: {
    timeout: 10000,
  },
});
