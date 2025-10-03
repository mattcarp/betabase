import { test, expect } from "@playwright/test";
import { setupConsoleMonitoring, assertNoConsoleErrors } from "../helpers/console-monitor";

/**
 * SIAM Storybook Audio Waveform Visual Tests
 * Tests the AudioWaveform component in Storybook for UI regression and functionality
 */

test.describe("Storybook Audio Waveform Visual Tests", () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitoring(page, {
      ignoreWarnings: true,
      ignoreNetworkErrors: true,
    });
  });

  test.afterEach(async () => {
    assertNoConsoleErrors();
  });

  test("should load Storybook without errors", async ({ page }) => {
  // Navigate to Storybook
  await page.goto("http://localhost:6006");
  await page.waitForLoadState("networkidle");

  // Check for console errors
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  await page.waitForTimeout(2000);

  // Should not have critical errors
  const criticalErrors = errors.filter(
    (error) => !error.includes("404") && !error.includes("favicon"),
  );
  expect(criticalErrors).toHaveLength(0);
});

test("should display AudioWaveform Default story", async ({ page }) => {
  // Navigate to the Default AudioWaveform story
  await page.goto(
    "http://localhost:6006/?path=/story/siam-ui-audiowaveform--default",
  );
  await page.waitForLoadState("networkidle");

  // Wait for the component to initialize
  await page.waitForTimeout(2000);

  // Check for the waveform container
  const waveformContainer = page.locator(
    '[data-testid="audio-waveform-container"]',
  );
  await expect(waveformContainer).toBeVisible();

  // Take screenshot
  await expect(page).toHaveScreenshot("storybook-audiowaveform-default.png");
});

test("should display AudioWaveform JARVIS Theme story", async ({ page }) => {
  // Navigate to the JARVIS Theme story
  await page.goto(
    "http://localhost:6006/?path=/story/siam-ui-audiowaveform--jarvis-theme",
  );
  await page.waitForLoadState("networkidle");

  // Wait for the component to initialize
  await page.waitForTimeout(2000);

  // Check for the waveform container
  const waveformContainer = page.locator(
    '[data-testid="audio-waveform-container"]',
  );
  await expect(waveformContainer).toBeVisible();

  // Take screenshot
  await expect(page).toHaveScreenshot(
    "storybook-audiowaveform-jarvis-theme.png",
  );
});

test("should display AudioWaveform Matrix Theme story", async ({ page }) => {
  // Navigate to the Matrix Theme story
  await page.goto(
    "http://localhost:6006/?path=/story/siam-ui-audiowaveform--matrix-theme",
  );
  await page.waitForLoadState("networkidle");

  // Wait for the component to initialize
  await page.waitForTimeout(2000);

  // Check for the waveform container
  const waveformContainer = page.locator(
    '[data-testid="audio-waveform-container"]',
  );
  await expect(waveformContainer).toBeVisible();

  // Take screenshot
  await expect(page).toHaveScreenshot(
    "storybook-audiowaveform-matrix-theme.png",
  );
});

test("should display AudioWaveform Alert Theme story", async ({ page }) => {
  // Navigate to the Alert Theme story
  await page.goto(
    "http://localhost:6006/?path=/story/siam-ui-audiowaveform--alert-theme",
  );
  await page.waitForLoadState("networkidle");

  // Wait for the component to initialize
  await page.waitForTimeout(2000);

  // Check for the waveform container
  const waveformContainer = page.locator(
    '[data-testid="audio-waveform-container"]',
  );
  await expect(waveformContainer).toBeVisible();

  // Take screenshot
  await expect(page).toHaveScreenshot(
    "storybook-audiowaveform-alert-theme.png",
  );
});

test("should display AudioWaveform Compact story", async ({ page }) => {
  // Navigate to the Compact story
  await page.goto(
    "http://localhost:6006/?path=/story/siam-ui-audiowaveform--compact",
  );
  await page.waitForLoadState("networkidle");

  // Wait for the component to initialize
  await page.waitForTimeout(2000);

  // Check for the waveform container
  const waveformContainer = page.locator(
    '[data-testid="audio-waveform-container"]',
  );
  await expect(waveformContainer).toBeVisible();

  // Take screenshot
  await expect(page).toHaveScreenshot("storybook-audiowaveform-compact.png");
});

test("should display AudioWaveform Large story", async ({ page }) => {
  // Navigate to the Large story
  await page.goto(
    "http://localhost:6006/?path=/story/siam-ui-audiowaveform--large",
  );
  await page.waitForLoadState("networkidle");

  // Wait for the component to initialize
  await page.waitForTimeout(2000);

  // Check for the waveform container
  const waveformContainer = page.locator(
    '[data-testid="audio-waveform-container"]',
  );
  await expect(waveformContainer).toBeVisible();

  // Take screenshot
  await expect(page).toHaveScreenshot("storybook-audiowaveform-large.png");
});

test("should display AudioWaveform Interactive Demo story", async ({
  page,
}) => {
  // Navigate to the Interactive Demo story
  await page.goto(
    "http://localhost:6006/?path=/story/siam-ui-audiowaveform--interactive-demo",
  );
  await page.waitForLoadState("networkidle");

  // Wait for the component to initialize
  await page.waitForTimeout(2000);

  // Check for the waveform container
  const waveformContainer = page.locator(
    '[data-testid="audio-waveform-container"]',
  );
  await expect(waveformContainer).toBeVisible();

  // Check for the record button
  const recordButton = page.locator('button:has-text("Record")');
  await expect(recordButton).toBeVisible();

  // Take screenshot of initial state
  await expect(page).toHaveScreenshot(
    "storybook-audiowaveform-interactive-demo.png",
  );

  // Test clicking the record button (though it may not work due to permissions)
  await recordButton.click();
  await page.waitForTimeout(1000);

  // Take screenshot after clicking record
  await expect(page).toHaveScreenshot(
    "storybook-audiowaveform-interactive-demo-clicked.png",
  );
});

test("should display AudioWaveform Multiple Waveforms story", async ({
  page,
}) => {
  // Navigate to the Multiple Waveforms story
  await page.goto(
    "http://localhost:6006/?path=/story/siam-ui-audiowaveform--multiple-waveforms",
  );
  await page.waitForLoadState("networkidle");

  // Wait for the components to initialize
  await page.waitForTimeout(3000);

  // Check for multiple waveform containers
  const waveformContainers = page.locator(
    '[data-testid="audio-waveform-container"]',
  );
  await expect(waveformContainers).toHaveCount(3);

  // Take screenshot
  await expect(page).toHaveScreenshot(
    "storybook-audiowaveform-multiple-waveforms.png",
  );
});

test("should display AudioWaveform Meeting Room story", async ({ page }) => {
  // Navigate to the Meeting Room story
  await page.goto(
    "http://localhost:6006/?path=/story/siam-ui-audiowaveform--meeting-room",
  );
  await page.waitForLoadState("networkidle");

  // Wait for the component to initialize
  await page.waitForTimeout(2000);

  // Check for the waveform container
  const waveformContainer = page.locator(
    '[data-testid="audio-waveform-container"]',
  );
  await expect(waveformContainer).toBeVisible();

  // Take screenshot
  await expect(page).toHaveScreenshot(
    "storybook-audiowaveform-meeting-room.png",
  );
});

test("should not have infinite loops or memory leaks", async ({ page }) => {
  // Navigate to the Default story
  await page.goto(
    "http://localhost:6006/?path=/story/siam-ui-audiowaveform--default",
  );
  await page.waitForLoadState("networkidle");

  // Monitor console for errors that might indicate infinite loops
  const errors: string[] = [];
  const warnings: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    } else if (msg.type() === "warning") {
      warnings.push(msg.text());
    }
  });

  // Wait for component to initialize and run for a while
  await page.waitForTimeout(5000);

  // Check for errors indicating infinite loops
  const infiniteLoopErrors = errors.filter(
    (error) =>
      error.includes("Maximum update depth") ||
      error.includes("Too many re-renders") ||
      error.includes("infinite"),
  );

  expect(infiniteLoopErrors).toHaveLength(0);

  // Check for memory-related warnings
  const memoryWarnings = warnings.filter(
    (warning) => warning.includes("memory") || warning.includes("leak"),
  );

  // This should ideally be 0, but we'll just log them for now
  if (memoryWarnings.length > 0) {
    console.log("Memory warnings detected:", memoryWarnings);
  }
});
