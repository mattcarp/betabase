import { defineConfig, devices } from "@playwright/test";
import { baseConfig } from "./base.config";

/**
 * Local development configuration
 */
export default defineConfig({
  ...baseConfig,

  // Local-specific settings
  use: {
    ...baseConfig.use,
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    // Faster timeouts for local development
    actionTimeout: 10000,
    navigationTimeout: 20000,

    // More verbose output locally
    screenshot: "on",
    trace: "on",
    video: "off",

    // Bypass auth for faster testing
    extraHTTPHeaders: {
      "x-bypass-auth": process.env.NEXT_PUBLIC_BYPASS_AUTH || "true",
    },
  },

  // Projects
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        launchOptions: {
          args: ["--disable-web-security", "--disable-features=IsolateOrigins,site-per-process"],
        },
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
    {
      name: "mobile",
      use: { ...devices["iPhone 14"] },
    },
  ],

  // Web server configuration for local testing
  webServer: {
    command: "NEXT_PUBLIC_BYPASS_AUTH=true npm run dev",
    url: "http://localhost:3000",
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      NEXT_PUBLIC_BYPASS_AUTH: "true",
      NODE_ENV: "development",
    },
  },

  // Faster retries locally
  retries: 0,

  // More parallel workers locally
  workers: 4,
});
