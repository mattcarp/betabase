import { test, expect } from '../fixtures/base-test';
import { setupConsoleMonitoring, assertNoConsoleErrors } from "../helpers/console-monitor";

/**
 * SIAM Electron Visual Tests
 * Tests the siam-electron application for feature comparison and reference
 */

test.describe("SIAM Electron - Feature Reference", () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitoring(page, {
      ignoreWarnings: true,
      ignoreNetworkErrors: true,
    });
    await page.goto("/");
    // Wait for app to load
    await page.waitForLoadState("networkidle");
  });

  test.afterEach(async () => {
    assertNoConsoleErrors();
  });

  test("should load siam-electron without errors", async ({ page }) => {
    // Check for console errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    // Should not have critical errors (ignore CSP warnings)
    const criticalErrors = errors.filter(
      (error) => !error.includes("Content Security Policy") && !error.includes("CSP")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("should display HUD layout with navigation", async ({ page }) => {
    // Check for HUD layout
    const hudLayout = page.locator('[data-testid="hud-layout"], .hud-layout');
    await expect(hudLayout).toBeVisible();

    // Take screenshot for comparison with siam-desktop
    await expect(page).toHaveScreenshot("siam-electron-hud-layout.png");
  });

  test("should display circular navigation system", async ({ page }) => {
    // Check for circular navigation
    const circularNav = page.locator('[data-testid="circular-navigation"], .circular-navigation');
    await expect(circularNav).toBeVisible();

    // Take screenshot of navigation
    await expect(page).toHaveScreenshot("siam-electron-circular-nav.png");
  });

  test("should have multiple navigation tabs", async ({ page }) => {
    // Look for navigation tabs (Audio, Transcription, AI Insights, ElevenLabs AI, System Health, Settings)
    const navTabs = page.locator('[data-testid*="nav-"], .nav-tab, .navigation-item');
    const tabCount = await navTabs.count();

    // Should have multiple tabs
    expect(tabCount).toBeGreaterThan(1);

    // Take screenshot showing all tabs
    await expect(page).toHaveScreenshot("siam-electron-all-tabs.png");
  });

  test("should display transcription panel", async ({ page }) => {
    // Look for transcription-related elements
    const transcriptionPanel = page.locator(
      '[data-testid*="transcription"], .transcription, .live-transcription'
    );

    if ((await transcriptionPanel.count()) > 0) {
      await expect(transcriptionPanel).toBeVisible();
      await expect(page).toHaveScreenshot("siam-electron-transcription.png");
    }
  });

  test("should display ElevenLabs conversational AI", async ({ page }) => {
    // Look for ElevenLabs/conversational AI elements
    const elevenLabsPanel = page.locator(
      '[data-testid*="elevenlabs"], .elevenlabs, .conversational-ai'
    );

    if ((await elevenLabsPanel.count()) > 0) {
      await expect(elevenLabsPanel).toBeVisible();
      await expect(page).toHaveScreenshot("siam-electron-elevenlabs.png");
    }
  });

  test("should display AI insights panel", async ({ page }) => {
    // Look for AI insights
    const aiInsights = page.locator('[data-testid*="insights"], .ai-insights, .insights-panel');

    if ((await aiInsights.count()) > 0) {
      await expect(aiInsights).toBeVisible();
      await expect(page).toHaveScreenshot("siam-electron-ai-insights.png");
    }
  });

  test("should have functional panel switching", async ({ page }) => {
    // Test panel switching functionality
    const navItems = page.locator('[data-testid*="nav-"], .nav-item, .navigation-button');
    const count = await navItems.count();

    if (count > 1) {
      // Test switching between first few panels
      for (let i = 0; i < Math.min(count, 4); i++) {
        await navItems.nth(i).click();
        await page.waitForTimeout(500);

        // Take screenshot of each panel state
        await expect(page).toHaveScreenshot(`siam-electron-panel-${i}.png`);
      }
    }
  });

  test("should display settings panel", async ({ page }) => {
    // Look for settings navigation or button
    const settingsNav = page.locator(
      '[data-testid*="settings"], .settings-nav, [aria-label*="settings"]'
    );

    if ((await settingsNav.count()) > 0) {
      await settingsNav.click();
      await page.waitForTimeout(500);

      // Check for settings panel content
      const settingsPanel = page.locator('[data-testid="settings-panel"], .settings-panel');
      await expect(settingsPanel).toBeVisible();

      await expect(page).toHaveScreenshot("siam-electron-settings.png");
    }
  });

  test("should have JARVIS-style design elements", async ({ page }) => {
    // Check for JARVIS design elements
    const jarvisElements = page.locator(
      ".jarvis-panel, .jarvis-glow, .glassmorphism, .holographic, .circular-hud"
    );

    if ((await jarvisElements.count()) > 0) {
      await expect(jarvisElements.first()).toBeVisible();
    }

    // Take full page screenshot for design comparison
    await expect(page).toHaveScreenshot("siam-electron-full-page.png", {
      fullPage: true,
    });
  });
});

test.describe("SIAM Electron - Feature Catalog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should catalog all available features", async ({ page }) => {
    // Catalog all interactive elements for feature comparison
    const interactiveElements = await page
      .locator('button, [role="button"], .clickable, .nav-item')
      .all();

    console.log(`Found ${interactiveElements.length} interactive elements in siam-electron`);

    // Take comprehensive screenshot
    await expect(page).toHaveScreenshot("siam-electron-feature-catalog.png", {
      fullPage: true,
    });
  });

  test("should identify missing features in siam-desktop", async ({ page }) => {
    // This test documents features present in siam-electron that should be ported to siam-desktop
    const expectedFeatures = [
      '[data-testid*="transcription"]',
      '[data-testid*="elevenlabs"]',
      '[data-testid*="insights"]',
      '[data-testid*="audio"]',
      '[data-testid*="system"]',
      '[data-testid*="settings"]',
    ];

    const foundFeatures: string[] = [];

    for (const selector of expectedFeatures) {
      const element = page.locator(selector);
      if ((await element.count()) > 0) {
        foundFeatures.push(selector);
      }
    }

    console.log("Features found in siam-electron:", foundFeatures);

    // Document current feature state
    await expect(page).toHaveScreenshot("siam-electron-current-features.png");
  });
});
