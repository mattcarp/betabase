import { test, expect } from "@playwright/test";

/**
 * Smoke tests - Quick health checks that should always pass
 * @smoke
 * Target runtime: < 2 minutes
 */

test.describe("Smoke Tests @smoke", () => {
  test.describe.configure({ mode: "parallel" });
  
  test("Application is accessible", async ({ page }) => {
    const response = await page.goto("/");
    
    // Check response status
    expect(response?.status()).toBeLessThan(400);
    
    // Check for no console errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });
  
  test("Health endpoint responds", async ({ request }) => {
    const response = await request.get("/api/health");
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty("status", "healthy");
  });
  
  test("Main page loads with expected elements", async ({ page }) => {
    await page.goto("/");
    
    // Check for critical UI elements
    const criticalSelectors = [
      'input[type="email"]',  // Login input
      'button',                // At least one button
      '.mac-card, .mac-professional, [class*="container"]'  // Main container
    ];
    
    for (const selector of criticalSelectors) {
      const element = page.locator(selector).first();
      await expect(element).toBeVisible({ timeout: 10000 });
    }
  });
  
  test("No JavaScript errors on load", async ({ page }) => {
    const jsErrors: string[] = [];
    
    page.on("pageerror", (error) => {
      jsErrors.push(error.message);
    });
    
    await page.goto("/");
    await page.waitForTimeout(3000);
    
    // Filter out known acceptable errors
    const criticalErrors = jsErrors.filter(error => 
      !error.includes("ResizeObserver") && 
      !error.includes("Non-Error promise rejection")
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
  
  test("Static assets load correctly", async ({ page }) => {
    await page.goto("/");
    
    // Check CSS loads
    const styles = await page.evaluate(() => {
      return Array.from(document.styleSheets).length;
    });
    expect(styles).toBeGreaterThan(0);
    
    // Check if fonts load
    const fonts = await page.evaluate(() => {
      return document.fonts.ready.then(() => document.fonts.size);
    });
    expect(fonts).toBeGreaterThan(0);
  });
  
  test("Mobile viewport renders correctly", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15"
    });
    
    const page = await context.newPage();
    await page.goto("/");
    
    // Check viewport meta tag
    const viewportMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta?.getAttribute("content");
    });
    
    expect(viewportMeta).toContain("width=device-width");
    
    // Check responsive elements
    const mobileMenu = page.locator('[data-testid="mobile-menu"], [class*="mobile"]').first();
    const isMenuVisible = await mobileMenu.isVisible().catch(() => false);
    
    // Either mobile menu exists or page is responsive
    expect(isMenuVisible || viewportMeta).toBeTruthy();
    
    await context.close();
  });
});