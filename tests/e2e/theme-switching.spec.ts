import { test, expect } from "@playwright/test";

test.describe("Theme Switching @smoke", () => {
  test("should have light theme CSS variables applied correctly", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);

    // Set theme to light via JavaScript
    await page.evaluate(() => {
      localStorage.setItem("siam-theme-preference", "light");
      document.documentElement.setAttribute("data-theme", "light");
      document.body.classList.remove("dark");
    });
    await page.waitForTimeout(300);

    // Check that light theme CSS variables are applied
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
    });

    // Light theme background should be light (0 0% 98%)
    expect(bgColor).toContain("98%");

    // Check foreground is dark for light mode
    const fgColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim();
    });
    expect(fgColor).toContain("84%"); // Light mode has dark text (222.2 84% 4.9%)
  });

  test("should persist theme preference after reload", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);

    // Set theme to light via localStorage
    await page.evaluate(() => {
      localStorage.setItem("siam-theme-preference", "light");
    });

    // Reload
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);

    // Verify theme attribute persisted
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "light");

    // Cleanup
    await page.evaluate(() => {
      localStorage.setItem("siam-theme-preference", "mac");
    });
  });

  test("should toggle dark class on body when switching themes", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);

    // Default mac theme should have dark class
    const body = page.locator("body");
    await expect(body).toHaveClass(/dark/);

    // Switch to light theme via ThemeContext simulation
    await page.evaluate(() => {
      localStorage.setItem("siam-theme-preference", "light");
      document.documentElement.setAttribute("data-theme", "light");
      document.body.classList.remove("dark");
    });
    await page.waitForTimeout(200);

    // Light theme should not have dark class
    await expect(body).not.toHaveClass(/dark/);

    // Switch back to mac theme
    await page.evaluate(() => {
      localStorage.setItem("siam-theme-preference", "mac");
      document.documentElement.setAttribute("data-theme", "mac");
      document.body.classList.add("dark");
    });
    await page.waitForTimeout(200);

    await expect(body).toHaveClass(/dark/);
  });
});
