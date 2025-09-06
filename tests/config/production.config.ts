import { defineConfig, devices } from "@playwright/test";
import { baseConfig } from "./base.config";

/**
 * Production testing configuration
 */
export default defineConfig({
  ...baseConfig,
  
  // Production-specific settings
  use: {
    ...baseConfig.use,
    baseURL: process.env.PROD_URL || "https://siam.onrender.com",
    
    // Conservative timeouts for production
    actionTimeout: 20000,
    navigationTimeout: 40000,
    
    // Production monitoring
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    
    // No auth bypass in production
    extraHTTPHeaders: {}
  },
  
  // Projects - test on multiple browsers
  projects: [
    {
      name: "chromium",
      use: { 
        ...devices["Desktop Chrome"],
        channel: "chrome"
      }
    },
    {
      name: "firefox", 
      use: { ...devices["Desktop Firefox"] }
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] }
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] }
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 14"] }
    }
  ],
  
  // No web server - testing against deployed URL
  webServer: undefined,
  
  // More retries for production stability
  retries: 2,
  
  // Conservative parallelization
  workers: 2,
  
  // Fail fast in production tests
  maxFailures: 5
});