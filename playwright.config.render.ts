import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for Render.com production tests
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/*.spec.ts", "**/*.spec.js"],
  
  // Parallel execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 4,
  
  // Reporting
  reporter: [
    ["html", { open: "never" }],
    ["list"],
    ["junit", { outputFile: "test-results/junit.xml" }]
  ],
  
  use: {
    // Render.com deployment URL
    baseURL: process.env.BASE_URL || "https://siam.onrender.com",
    
    // Tracing and screenshots
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    
    // Timeouts
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  
  // Test timeout
  timeout: 60000,
  
  projects: [
    {
      name: "chromium",
      use: { 
        ...devices["Desktop Chrome"],
        channel: "chrome"
      },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    // Mobile viewports
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 13"] },
    },
  ],
  
  // No local server - testing against Render deployment
});
