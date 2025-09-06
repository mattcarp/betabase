import { defineConfig, devices } from "@playwright/test";
import path from 'path';

/**
 * Playwright Configuration for Local Development
 * Tests against localhost:3000
 */
export default defineConfig({
  // Test directory
  testDir: "./tests",
  
  // Don't run tests in parallel locally for easier debugging
  fullyParallel: false,
  workers: 1,
  
  // No retries in local development
  retries: 0,
  
  // Allow .only in local development
  forbidOnly: false,
  
  // Global setup/teardown
  globalSetup: path.join(__dirname, 'tests', 'global-setup.ts'),
  globalTeardown: path.join(__dirname, 'tests', 'global-teardown.ts'),
  
  // Reporters for local development
  reporter: [
    ['list'],
    ['html', { open: 'on-failure' }]
  ],
  
  // Shared settings
  use: {
    // Local development URL
    baseURL: "http://localhost:3000",
    
    // Always capture trace locally
    trace: "on",
    
    // Always take screenshots locally
    screenshot: {
      mode: "on",
      fullPage: true
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
      slowMo: 100
    },
  },
  
  // Only test in Chrome locally
  projects: [
    {
      name: "chromium",
      use: { 
        ...devices["Desktop Chrome"],
        channel: "chrome"
      },
    },
  ],
  
  // Start local dev server
  webServer: {
    command: 'npm run dev',
    port: 3000,
    timeout: 120000,
    reuseExistingServer: true,
  },
  
  // Output folder
  outputDir: 'test-results/',
  
  // Longer timeout for debugging
  timeout: 120000,
  
  // Expect timeout
  expect: {
    timeout: 10000,
  },
});
