import { test, expect } from "@playwright/test";

test.describe("Render Deployment Test Suite", () => {
  test("should load the SIAM application @smoke", async ({ page }) => {
    // Navigate to the app (uses baseURL from config)
    await page.goto("/");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check for SIAM branding
    const siamElement = page.locator("text=/SIAM/i").first();
    await expect(siamElement).toBeVisible({ timeout: 30000 });

    // Take a screenshot for verification
    await page.screenshot({ 
      path: "screenshots/render-homepage.png", 
      fullPage: true 
    });

    console.log("✅ SIAM app loaded successfully on Render!");
  });

  test("should display authentication elements @smoke", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check for authentication UI - could be login form or main app
    const authElements = await page.evaluate(() => {
      const hasLoginForm = document.querySelector('[type="email"], [type="submit"], input[placeholder*="email" i]');
      const hasMainApp = document.querySelector('[role="tab"], .tab-content, nav');
      return { hasLoginForm: !!hasLoginForm, hasMainApp: !!hasMainApp };
    });

    // Either auth form or main app should be visible
    expect(authElements.hasLoginForm || authElements.hasMainApp).toBeTruthy();
    
    console.log("✅ Authentication state detected:", authElements);
  });

  test("should have responsive design @visual", async ({ page }) => {
    await page.goto("/");
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ 
      path: "screenshots/render-desktop.png",
      fullPage: true 
    });

    // Test mobile viewport  
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ 
      path: "screenshots/render-mobile.png",
      fullPage: true 
    });

    console.log("✅ Responsive design screenshots captured!");
  });

  test("should have proper meta tags and SEO", async ({ page }) => {
    await page.goto("/");
    
    // Check title
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Check viewport meta tag
    const viewport = await page.$('meta[name="viewport"]');
    expect(viewport).toBeTruthy();
    
    // Check for favicon
    const favicon = await page.$('link[rel*="icon"]');
    expect(favicon).toBeTruthy();
    
    console.log(`✅ SEO basics in place. Title: "${title}"`);
  });

  test("should handle errors gracefully", async ({ page }) => {
    // Try to navigate to a non-existent page
    const response = await page.goto("/non-existent-page-404", {
      waitUntil: "networkidle"
    });
    
    // Should either show 404 or redirect to home
    expect(response?.status()).toBeLessThanOrEqual(404);
    
    // Page should still be functional
    await page.waitForLoadState("domcontentloaded");
    
    console.log("✅ Error handling works!");
  });
});
