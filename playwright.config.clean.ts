import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  /* Global settings */
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'unit',
      testDir: './tests/unit',
      use: { ...devices['Desktop Chrome'] },
      timeout: 10_000,
    },
    {
      name: 'integration',
      testDir: './tests/integration',
      use: { ...devices['Desktop Chrome'] },
      timeout: 30_000,
    },
    {
      name: 'e2e-local',
      testDir: './tests/e2e',
      use: { baseURL: 'http://localhost:3000', ...devices['Desktop Chrome'] },
      timeout: 60_000,
    },
    {
      name: 'e2e-production',
      testDir: './tests/e2e',
      use: { baseURL: 'https://iamsiam.ai', ...devices['Desktop Chrome'] },
      timeout: 90_000,
    },
  ],
});








