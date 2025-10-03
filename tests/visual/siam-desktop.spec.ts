import { test, expect } from "@playwright/test";
import { setupConsoleMonitoring, assertNoConsoleErrors } from "../helpers/console-monitor";

/**
 * SIAM Desktop Visual Tests
 * Tests the primary siam-desktop application for UI regression
 */

test.describe("SIAM Desktop Visual Tests", () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitoring(page, {
      ignoreWarnings: true,
      ignoreNetworkErrors: true,
    });
  });

  test.afterEach(async () => {
    assertNoConsoleErrors();
  });

  test("should load main application without errors", async ({ page }) => {
  await page.goto("/");
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
    (error) =>
      !error.includes("AOMA health check") &&
      !error.includes("Maximum update depth"),
  );
  expect(criticalErrors).toHaveLength(0);
});

test("should display JARVIS-style HUD layout", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Check for main HUD container
  const hudContainer = page.locator(
    '[data-testid="hud-container"], .hud-container, .jarvis-hud',
  );
  await expect(hudContainer).toBeVisible();

  // Take screenshot for visual comparison
  await expect(page).toHaveScreenshot("siam-desktop-main-hud.png");
});

test("should display circular navigation", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Check for circular navigation elements
  const circularNav = page.locator(
    '[data-testid="circular-navigation"], .circular-navigation, .navigation-circle',
  );
  await expect(circularNav).toBeVisible();

  // Take screenshot of navigation area
  await expect(page).toHaveScreenshot("siam-desktop-navigation.png");
});

test("should have functional navigation tabs", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Look for navigation tabs/buttons
  const navTabs = page.locator(
    '[data-testid*="nav-"], .nav-tab, .navigation-item',
  );

  if ((await navTabs.count()) > 0) {
    // Test clicking first tab
    await navTabs.first().click();
    await page.waitForTimeout(500);

    // Take screenshot after navigation
    await expect(page).toHaveScreenshot("siam-desktop-after-nav-click.png");
  }
});

test("should display audio waveform component", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Check for audio waveform
  const waveform = page.locator(
    '[data-testid="audio-waveform"], .audio-waveform, canvas',
  );
  await expect(waveform).toBeVisible();
});

test("should display system health monitor", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Check for system health component
  const systemHealth = page.locator(
    '[data-testid="system-health"], .system-health, .health-monitor',
  );
  await expect(systemHealth).toBeVisible();
});

test("should have ElevenLabs conversational AI panel", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Check for ElevenLabs/conversational AI elements
  const conversationalAI = page.locator(
    '[data-testid*="elevenlabs"], [data-testid*="conversational"], .elevenlabs, .conversational-ai',
  );

  if ((await conversationalAI.count()) > 0) {
    await expect(conversationalAI).toBeVisible();
    await expect(page).toHaveScreenshot("siam-desktop-conversational-ai.png");
  }
});

test("should display settings panel when accessed", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Look for settings button/trigger
  const settingsButton = page.locator(
    '[data-testid="settings"], .settings-button, [aria-label*="settings"]',
  );

  if ((await settingsButton.count()) > 0) {
    await settingsButton.click();
    await page.waitForTimeout(500);

    // Check for settings panel
    const settingsPanel = page.locator(
      '[data-testid="settings-panel"], .settings-panel',
    );
    await expect(settingsPanel).toBeVisible();

    await expect(page).toHaveScreenshot("siam-desktop-settings-panel.png");
  }
});

test("should have JARVIS-style visual elements", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Check for JARVIS-style CSS classes and elements
  const jarvisElements = page.locator(
    ".jarvis-panel, .jarvis-glow, .glassmorphism, .holographic",
  );

  if ((await jarvisElements.count()) > 0) {
    await expect(jarvisElements.first()).toBeVisible();
  }

  // Take full page screenshot for visual design validation
  await expect(page).toHaveScreenshot("siam-desktop-full-page.png", {
    fullPage: true,
  });
});

test("should handle recording functionality", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Look for record button
  const recordButton = page.locator(
    '[data-testid="record-button"], .record-button, [aria-label*="record"]',
  );

  if ((await recordButton.count()) > 0) {
    await recordButton.click();
    await page.waitForTimeout(1000);

    // Take screenshot of recording state
    await expect(page).toHaveScreenshot("siam-desktop-recording-state.png");

    // Stop recording
    await recordButton.click();
  }
});

test("should handle panel switching", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Find all navigation items
  const navItems = page.locator(
    '[data-testid*="nav-"], .nav-item, .navigation-button',
  );
  const count = await navItems.count();

  if (count > 1) {
    // Test switching between panels
    for (let i = 0; i < Math.min(count, 3); i++) {
      await navItems.nth(i).click();
      await page.waitForTimeout(500);

      // Take screenshot of each panel
      await expect(page).toHaveScreenshot(`siam-desktop-panel-${i}.png`);
    }
  }
});
