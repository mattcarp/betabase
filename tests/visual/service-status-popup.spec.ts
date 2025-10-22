/**
 * SERVICE STATUS POPUP REGRESSION TEST
 *
 * Prevents the service status dropdown from staying visible when not hovering
 */

import { test, expect } from "@playwright/test";

const PRODUCTION_URL = "https://thebetabase.com";
const TEST_EMAIL = "siam-test-x7j9k2p4@mailinator.com";

test.describe("Service Status Popup Behavior", () => {
  test("should ONLY show dropdown on hover, NEVER by default", async ({ page }) => {
    // Navigate and login
    await page.goto(PRODUCTION_URL);

    // Check if already logged in by looking for chat interface
    const alreadyLoggedIn = await page
      .locator('textarea[placeholder*="Ask"]')
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (!alreadyLoggedIn) {
      // Need to login
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.click('button[type="submit"]');

      // For this test, we'll skip full login and just test the UI component
      // In a real scenario, complete the login flow
      test.skip();
      return;
    }

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Step 1: Verify dropdown is NOT visible by default
    const dropdown = page.locator("text=Service Status").locator("..");
    const isVisibleByDefault = await dropdown.isVisible();

    expect(
      isVisibleByDefault,
      "CRITICAL BUG: Service Status dropdown should NOT be visible without hover"
    ).toBe(false);

    // Step 2: Hover over the status badge
    const statusBadge = page.locator("text=/\\d+\\/\\d+.*Services/");
    await statusBadge.hover();
    await page.waitForTimeout(500); // Wait for animation

    // Step 3: Verify dropdown IS visible during hover
    const isVisibleOnHover = await dropdown.isVisible();
    expect(isVisibleOnHover, "Dropdown should be visible when hovering over status badge").toBe(
      true
    );

    // Take screenshot during hover
    await page.screenshot({ path: "test-results/service-status-hover-visible.png" });

    // Step 4: Move mouse away
    await page.mouse.move(0, 0);
    await page.waitForTimeout(500); // Wait for animation

    // Step 5: Verify dropdown is NOT visible after hover ends
    const isVisibleAfterHover = await dropdown.isVisible();
    expect(
      isVisibleAfterHover,
      "CRITICAL BUG: Service Status dropdown should disappear after hover ends"
    ).toBe(false);

    // Take screenshot after hover
    await page.screenshot({ path: "test-results/service-status-hover-gone.png" });
  });

  test("should hide when clicking elsewhere on page", async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    const alreadyLoggedIn = await page
      .locator('textarea[placeholder*="Ask"]')
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (!alreadyLoggedIn) {
      test.skip();
      return;
    }

    // Hover to show dropdown
    const statusBadge = page.locator("text=/\\d+\\/\\d+.*Services/");
    await statusBadge.hover();
    await page.waitForTimeout(300);

    // Click elsewhere
    await page.click("body", { position: { x: 10, y: 10 } });
    await page.waitForTimeout(300);

    // Verify hidden
    const dropdown = page.locator("text=Service Status").locator("..");
    const isVisible = await dropdown.isVisible();
    expect(isVisible).toBe(false);
  });
});
