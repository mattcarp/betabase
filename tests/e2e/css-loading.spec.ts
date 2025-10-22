import { test, expect } from "@playwright/test";

test.describe("CSS Loading and MAC Design System", () => {
  test("should load all critical CSS and apply MAC design system classes", async ({ page }) => {
    // Navigate to the login page
    await page.goto("/");

    // Wait for the page to fully load
    await page.waitForLoadState("networkidle");

    // Check that global CSS is loaded
    const stylesheets = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      return sheets.map((sheet) => sheet.href || "inline").filter(Boolean);
    });

    // Verify at least one stylesheet is loaded
    expect(stylesheets.length).toBeGreaterThan(0);

    // Check that MAC design system classes are properly applied
    const displayText = page.locator("h1.mac-display-text").first();
    await expect(displayText).toBeVisible();

    // Verify the display text has proper styling (not default browser styles)
    const displayTextStyles = await displayText.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        lineHeight: styles.lineHeight,
        background: styles.background,
      };
    });

    // MAC display text should have specific styles
    expect(parseFloat(displayTextStyles.fontSize)).toBeGreaterThan(40); // Should be 3rem or larger
    expect(parseInt(displayTextStyles.fontWeight)).toBeLessThanOrEqual(200); // Should be thin (100-200)

    // Check that the glass morphism card is styled
    const glassCard = page.locator(".mac-glass").first();
    await expect(glassCard).toBeVisible();

    const glassStyles = await glassCard.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        background: styles.background,
        backdropFilter: styles.backdropFilter || styles.webkitBackdropFilter,
        border: styles.border,
        borderRadius: styles.borderRadius,
      };
    });

    // Glass morphism should have blur effect
    expect(glassStyles.backdropFilter || glassStyles.background).toBeTruthy();
    expect(parseFloat(glassStyles.borderRadius)).toBeGreaterThan(0);

    // Check that buttons have MAC styling
    const button = page.locator(".mac-button").first();
    await expect(button).toBeVisible();

    const buttonStyles = await button.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        padding: styles.padding,
        borderRadius: styles.borderRadius,
        cursor: styles.cursor,
        transition: styles.transition,
      };
    });

    // Buttons should have proper styling
    expect(buttonStyles.cursor).toBe("pointer");
    expect(buttonStyles.transition).toBeTruthy(); // Should have some transition

    // Check for CSS variables from MAC design system
    const cssVariables = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = window.getComputedStyle(root);
      return {
        macPrimaryBlue: styles.getPropertyValue("--mac-primary-blue-400"),
        macSurfaceBackground: styles.getPropertyValue("--mac-surface-background"),
        macTextPrimary: styles.getPropertyValue("--mac-text-primary"),
        macGlass: styles.getPropertyValue("--mac-surface-card"),
      };
    });

    // Verify MAC design system CSS variables are loaded
    expect(cssVariables.macPrimaryBlue).toBeTruthy();
    expect(cssVariables.macSurfaceBackground).toBeTruthy();
    expect(cssVariables.macTextPrimary).toBeTruthy();

    // Take a screenshot for visual verification
    await page.screenshot({
      path: "tests/screenshots/login-page-css.png",
      fullPage: true,
    });

    // Check there are no CSS loading errors in console
    const consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && msg.text().toLowerCase().includes("css")) {
        consoleErrors.push(msg.text());
      }
    });

    // Give it a moment to catch any late errors
    await page.waitForTimeout(1000);

    // There should be no CSS-related console errors
    expect(consoleErrors).toHaveLength(0);

    // Verify the page doesn't look like "dogshit" (has proper structure)
    const pageStructure = await page.evaluate(() => {
      const hasLogo = !!document.querySelector(".drop-shadow-2xl");
      const hasTitle = !!document.querySelector("h1.mac-display-text");
      const hasForm = !!document.querySelector("form");
      const hasStyledInput = !!document.querySelector(".mac-input");
      const hasStyledButton = !!document.querySelector(".mac-button");
      const hasGlassEffect = !!document.querySelector(".mac-glass");

      return {
        hasLogo,
        hasTitle,
        hasForm,
        hasStyledInput,
        hasStyledButton,
        hasGlassEffect,
      };
    });

    // All critical UI elements should be present and styled
    expect(pageStructure.hasLogo).toBe(true);
    expect(pageStructure.hasTitle).toBe(true);
    expect(pageStructure.hasForm).toBe(true);
    expect(pageStructure.hasStyledInput).toBe(true);
    expect(pageStructure.hasStyledButton).toBe(true);
    expect(pageStructure.hasGlassEffect).toBe(true);
  });

  test("should maintain CSS on navigation and hot reload", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Get initial style count
    const initialStyles = await page.evaluate(() => {
      return document.styleSheets.length;
    });

    // Reload the page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Styles should still be loaded after reload
    const afterReloadStyles = await page.evaluate(() => {
      return document.styleSheets.length;
    });

    expect(afterReloadStyles).toBeGreaterThanOrEqual(initialStyles);

    // MAC classes should still work after reload
    const displayText = page.locator("h1.mac-display-text").first();
    await expect(displayText).toBeVisible();
  });
});
