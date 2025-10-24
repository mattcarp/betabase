import { defineConfig } from "@playwright/test";
// import path from "path"; // Unused - keeping for future use

export default defineConfig({
  testDir: "./tests/electron",
  fullyParallel: false, // Electron tests should run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Only one worker for Electron tests
  reporter: [["html", { outputFolder: "playwright-report-electron" }]],
  timeout: 60000, // 60 seconds for Electron tests

  use: {
    // Electron-specific settings
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  // Configure projects for major browsers
  projects: [
    {
      name: "electron",
      testDir: "./tests/electron",
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: "npm run electron:dev",
    url: "http://localhost:8085",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
  },
});
