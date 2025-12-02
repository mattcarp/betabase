/**
 * Login Page Visual Regression Tests
 *
 * GOLD STANDARD BASELINE - Tier 1
 *
 * The login page is considered "damn close to perfect" per design review.
 * These tests establish and protect this high-quality baseline from any
 * unintentional visual regressions.
 *
 * Baseline established: October 6, 2025
 * Quality level: ⭐⭐⭐⭐⭐ (Perfect)
 *
 * @see /tmp/visual-regression-strategy.md for complete testing strategy
 */

import { Page } from '@playwright/test';
import { test, expect } from '../fixtures/base-test';

// Test configuration
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Viewport configurations matching real devices
const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: "mobile-iphone-se" },
  tablet: { width: 768, height: 1024, name: "tablet-ipad" },
  desktop: { width: 1440, height: 900, name: "desktop-macbook-pro" },
};

/**
 * Helper: Wait for login page to be fully loaded and stable
 * Ensures no layout shift during screenshot capture
 */
async function waitForLoginPageStable(page: Page) {
  // Wait for the glassmorphism card to be visible
  await page.waitForSelector(".mac-glass", {
    state: "visible",
    timeout: 20000, // Increased for dev server compilation
  });

  // Wait for logo to load (critical for CLS)
  await page.waitForSelector('img[alt="Betabase"]', {
    state: "visible",
    timeout: 15000,
  });

  // Wait for email input to be interactive
  await page.waitForSelector('input[type="email"]', {
    state: "visible",
    timeout: 15000,
  });

  // Wait for network to be idle (all resources loaded)
  await page.waitForLoadState("networkidle", { timeout: 30000 });

  // Additional stability wait for animations to complete
  await page.waitForTimeout(1000);
}

/**
 * Helper: Normalize dynamic content for consistent screenshots
 */
async function normalizeDynamicContent(page: Page) {
  // Hide any dynamic timestamps or version numbers
  await page.addStyleTag({
    content: `
      [data-testid="build-version"],
      [data-testid="timestamp"],
      .animate-pulse {
        opacity: 0 !important;
      }
    `,
  });
}

test.describe("Login Page Visual Regression - Gold Standard", () => {
  // Increase timeout for dev server compilation delays
  test.setTimeout(60000); // 60 seconds per test

  test.beforeEach(async ({ page }) => {
    // Ensure we're logged out (clear cookies)
    await page.context().clearCookies();
  });

  /**
   * TIER 1 TEST: Desktop Full-Page Baseline
   *
   * This is the primary baseline for the login page.
   * Desktop is the most common viewport and our development target.
   */
  test("Desktop (1440x900): Full-page baseline screenshot", async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize(VIEWPORTS.desktop);

    // Navigate to login page
    await page.goto(BASE_URL);

    // Wait for page stability
    await waitForLoginPageStable(page);
    await normalizeDynamicContent(page);

    // Capture full-page screenshot
    await expect(page).toHaveScreenshot("login-desktop-baseline.png", {
      fullPage: true,
      animations: "disabled",
      maxDiffPixels: 100, // Allow small anti-aliasing differences
      threshold: 0.2, // 20% pixel difference threshold
    });
  });

  /**
   * TIER 1 TEST: Tablet Full-Page Baseline
   *
   * iPad and similar tablets are increasingly common for business users.
   * Validates responsive design at tablet breakpoint (768px).
   */
  test("Tablet (768x1024): Full-page baseline screenshot", async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize(VIEWPORTS.tablet);

    // Navigate to login page
    await page.goto(BASE_URL);

    // Wait for page stability
    await waitForLoginPageStable(page);
    await normalizeDynamicContent(page);

    // Capture full-page screenshot
    await expect(page).toHaveScreenshot("login-tablet-baseline.png", {
      fullPage: true,
      animations: "disabled",
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  /**
   * TIER 1 TEST: Mobile Full-Page Baseline
   *
   * iPhone SE represents the smallest commonly-used device.
   * Validates responsive design at mobile breakpoint (375px).
   */
  test("Mobile (375x667): Full-page baseline screenshot", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(VIEWPORTS.mobile);

    // Navigate to login page
    await page.goto(BASE_URL);

    // Wait for page stability
    await waitForLoginPageStable(page);
    await normalizeDynamicContent(page);

    // Capture full-page screenshot
    await expect(page).toHaveScreenshot("login-mobile-baseline.png", {
      fullPage: true,
      animations: "disabled",
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  /**
   * INTERACTIVE STATE: Email Input Focus
   *
   * Validates focus ring, border color, and any visual feedback.
   * Focus states are critical for accessibility and UX.
   */
  test("Desktop: Email input focused state", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto(BASE_URL);
    await waitForLoginPageStable(page);
    await normalizeDynamicContent(page);

    // Focus the email input
    const emailInput = page.locator('input[type="email"]');
    await emailInput.focus();

    // Wait for focus animations to complete
    await page.waitForTimeout(300);

    // Screenshot the form card area only (more stable than full page)
    const formCard = page.locator(".mac-glass");
    await expect(formCard).toHaveScreenshot("login-email-focused.png", {
      animations: "disabled",
      maxDiffPixels: 50,
    });
  });

  /**
   * INTERACTIVE STATE: Submit Button Hover
   *
   * Validates hover effects on the primary CTA.
   * Hover states provide critical visual feedback.
   */
  test("Desktop: Submit button hover state", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto(BASE_URL);
    await waitForLoginPageStable(page);
    await normalizeDynamicContent(page);

    // Fill email to enable button
    await page.fill('input[type="email"]', "test@example.com");

    // Hover the submit button
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.hover();

    // Wait for hover animations to complete
    await page.waitForTimeout(300);

    // Screenshot the form card
    const formCard = page.locator(".mac-glass");
    await expect(formCard).toHaveScreenshot("login-button-hover.png", {
      animations: "disabled",
      maxDiffPixels: 50,
    });
  });

  /**
   * INTERACTIVE STATE: Loading State
   *
   * Validates loading spinner and disabled state during submission.
   * Critical for preventing double-submissions and providing feedback.
   */
  test("Desktop: Loading state during submission", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto(BASE_URL);
    await waitForLoginPageStable(page);
    await normalizeDynamicContent(page);

    // Fill email
    await page.fill('input[type="email"]', "test@example.com");

    // Intercept API call to delay response
    await page.route("/api/auth/magic-link", async (route) => {
      // Delay response to capture loading state
      await page.waitForTimeout(2000);
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      });
    });

    // Click submit button (don't await - we want to capture loading state)
    const submitButton = page.locator('button[type="submit"]');
    submitButton.click();

    // Wait for loading state to appear (Spinner component from Lucide)
    await page.waitForSelector(".animate-spin", { state: "visible", timeout: 5000 });

    // Screenshot the form card in loading state
    const formCard = page.locator(".mac-glass");
    await expect(formCard).toHaveScreenshot("login-loading-state.png", {
      animations: "disabled",
      maxDiffPixels: 100, // Spinner may have slight variations
    });
  });

  /**
   * ERROR STATE: Invalid Email
   *
   * Validates error message display and styling.
   * Error states must be clear and accessible.
   */
  test("Desktop: Error state - invalid email", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto(BASE_URL);
    await waitForLoginPageStable(page);
    await normalizeDynamicContent(page);

    // Fill invalid email
    await page.fill('input[type="email"]', "invalid-email");

    // Blur to trigger validation
    await page.locator('input[type="email"]').blur();

    // Wait for error message to appear
    await page.waitForSelector('[role="alert"]', { state: "visible", timeout: 5000 });

    // Screenshot the form card with error
    const formCard = page.locator(".mac-glass");
    await expect(formCard).toHaveScreenshot("login-error-invalid-email.png", {
      animations: "disabled",
      maxDiffPixels: 50,
    });
  });

  /**
   * SUCCESS STATE: Magic Link Sent
   *
   * Validates success message and post-submission UI.
   * Success states provide important confirmation to users.
   */
  test("Desktop: Success state - magic link sent", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto(BASE_URL);
    await waitForLoginPageStable(page);
    await normalizeDynamicContent(page);

    // Fill valid email
    await page.fill('input[type="email"]', "test@example.com");

    // Mock successful API response
    await page.route("/api/auth/magic-link", async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      });
    });

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message (CheckCircle icon and "Magic Link Sent!" heading)
    await page.waitForSelector('h3:has-text("Magic Link Sent!")', {
      state: "visible",
      timeout: 5000,
    });

    // Screenshot the form card with success message
    const formCard = page.locator(".mac-glass");
    await expect(formCard).toHaveScreenshot("login-success-state.png", {
      animations: "disabled",
      maxDiffPixels: 50,
    });
  });

  /**
   * ACCESSIBILITY: Keyboard Navigation
   *
   * Validates visual feedback during keyboard navigation.
   * Ensures keyboard-only users have clear visual indicators.
   */
  test("Desktop: Keyboard navigation focus indicators", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto(BASE_URL);
    await waitForLoginPageStable(page);
    await normalizeDynamicContent(page);

    // Tab to email input
    await page.keyboard.press("Tab");
    await page.waitForTimeout(200);

    // Screenshot with email input focused
    let formCard = page.locator(".mac-glass");
    await expect(formCard).toHaveScreenshot("login-keyboard-nav-email.png", {
      animations: "disabled",
      maxDiffPixels: 50,
    });

    // Tab to submit button
    await page.keyboard.press("Tab");
    await page.waitForTimeout(200);

    // Screenshot with button focused
    await expect(formCard).toHaveScreenshot("login-keyboard-nav-button.png", {
      animations: "disabled",
      maxDiffPixels: 50,
    });
  });

  /**
   * DARK THEME: Glassmorphism Validation
   *
   * Validates the MAC Design System glassmorphism effects.
   * Ensures backdrop-filter and transparency work correctly.
   */
  test("Desktop: Dark theme glassmorphism effects", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto(BASE_URL);
    await waitForLoginPageStable(page);
    await normalizeDynamicContent(page);

    // Get computed styles of the form card
    const formCard = page.locator(".mac-glass");
    const backgroundColor = await formCard.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );
    const backdropFilter = await formCard.evaluate(
      (el) => window.getComputedStyle(el).backdropFilter
    );

    // Validate dark theme (should have transparency)
    expect(backgroundColor).toContain("rgba");

    // Validate glassmorphism (should have backdrop-filter)
    expect(backdropFilter).toContain("blur");

    // Visual screenshot to confirm
    await expect(page).toHaveScreenshot("login-dark-theme-glassmorphism.png", {
      fullPage: true,
      animations: "disabled",
      maxDiffPixels: 100,
    });
  });

  /**
   * LOGO: CLS Validation (Critical!)
   *
   * Validates that the Betabase logo has no layout shift.
   * CLS was a major achievement (0.02) and must be protected.
   *
   * @see /tmp/a-grade-achievement-report.md for CLS history
   */
  test("Desktop: Logo CLS validation (no layout shift)", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);

    // Navigate and immediately start monitoring layout shifts
    await page.goto(BASE_URL);

    // Inject CLS tracking script
    const clsScore = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let cls = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
        });
        observer.observe({ type: "layout-shift", buffered: true });

        // Wait for page to be fully loaded
        window.addEventListener("load", () => {
          setTimeout(() => {
            observer.disconnect();
            resolve(cls);
          }, 1000);
        });
      });
    });

    // CLS should be excellent (< 0.1 for A-grade)
    expect(clsScore).toBeLessThan(0.1);
    console.log(`✅ Login page CLS: ${clsScore.toFixed(4)} (Target: < 0.1)`);

    // Validate logo has aspect-ratio wrapper
    const logoWrapper = page.locator(".betabase-logo-wrapper");
    await expect(logoWrapper).toBeVisible();

    const aspectRatio = await logoWrapper.evaluate((el) => window.getComputedStyle(el).aspectRatio);
    expect(aspectRatio).toContain("1.5037"); // Image is 400x266

    // Screenshot to confirm logo renders correctly
    await expect(logoWrapper).toHaveScreenshot("login-logo-no-cls.png", {
      animations: "disabled",
      maxDiffPixels: 20,
    });
  });

  /**
   * RESPONSIVE: Breakpoint Transitions
   *
   * Validates that the design gracefully transitions between breakpoints.
   * Tests critical widths where layout changes occur.
   */
  test("Responsive: Breakpoint transition at 768px (tablet)", async ({ page }) => {
    // Start just below tablet breakpoint
    await page.setViewportSize({ width: 767, height: 1024 });
    await page.goto(BASE_URL);
    await waitForLoginPageStable(page);
    await normalizeDynamicContent(page);

    // Screenshot below breakpoint (mobile)
    await expect(page).toHaveScreenshot("login-below-tablet-breakpoint.png", {
      fullPage: true,
      animations: "disabled",
      maxDiffPixels: 100,
    });

    // Resize to just above tablet breakpoint
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500); // Wait for responsive changes

    // Screenshot above breakpoint (tablet)
    await expect(page).toHaveScreenshot("login-above-tablet-breakpoint.png", {
      fullPage: true,
      animations: "disabled",
      maxDiffPixels: 100,
    });
  });
});

/**
 * BASELINE DOCUMENTATION
 *
 * Quality Level: ⭐⭐⭐⭐⭐ (Perfect - Gold Standard)
 *
 * What Makes This Baseline Perfect:
 * - Clean glassmorphism effects (MAC Design System)
 * - Excellent CLS score (0.02)
 * - Clear focus indicators for accessibility
 * - Professional loading and error states
 * - Responsive design works flawlessly
 * - Form validation is clear and helpful
 * - Logo renders without layout shift
 *
 * Protected Elements:
 * - Betabase logo (critical for CLS)
 * - Email input styling and focus ring
 * - Submit button hover effects
 * - Error message styling and placement
 * - Success message confirmation
 * - Loading spinner animation
 * - Glassmorphism backdrop-filter effects
 * - Dark theme color consistency
 *
 * Regression Prevention:
 * - Any change to logo sizing/aspect-ratio
 * - Changes to form card glassmorphism
 * - Input styling or focus ring modifications
 * - Button hover state changes
 * - Error/success message styling
 * - Responsive breakpoint behavior
 * - Dark theme color values
 *
 * Last Updated: October 6, 2025
 * Next Review: After any auth flow changes or MAC design updates
 */
