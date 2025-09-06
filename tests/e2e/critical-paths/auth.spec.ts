import { test, expect } from "../../../fixtures/auth.fixture";
import { TEST_USERS } from "../../../fixtures/auth.fixture";

/**
 * Critical authentication flows that must never break
 * @critical @regression
 */

test.describe("Critical Auth Paths @critical", () => {
  test.describe.configure({ mode: "serial" });
  
  test("Magic link login flow", async ({ page, authHelper }) => {
    await page.goto("/");
    
    // Enter email
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await emailInput.fill(TEST_USERS.primary.email);
    
    // Submit form
    const submitButton = page.locator('button:has-text("Send Magic Link")');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    
    // Check for success message
    await expect(page.locator('text=/Magic link sent|Check your email/i')).toBeVisible({
      timeout: 30000
    });
    
    // Verify no errors in console
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && !msg.text().includes("ResizeObserver")) {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });
  
  test("Multiple valid email domains accepted", async ({ page }) => {
    const validEmails = [
      TEST_USERS.primary.email,
      TEST_USERS.fiona.email,
      TEST_USERS.claude.email,
      "test@sonymusic.com"
    ];
    
    for (const email of validEmails) {
      await page.goto("/");
      
      // Try to send magic link
      await page.fill('input[type="email"]', email);
      await page.click('button:has-text("Send Magic Link")');
      
      // Should either show success or rate limit message (both are valid)
      const response = await page.waitForSelector('text=/Magic link sent|Check your email|Rate limit|Try again/i', {
        timeout: 30000
      });
      
      expect(response).toBeTruthy();
      
      // Small delay between requests
      await page.waitForTimeout(2000);
    }
  });
  
  test("Invalid email shows error", async ({ page }) => {
    await page.goto("/");
    
    const invalidEmails = [
      "notanemail",
      "test@",
      "@test.com",
      "test@invalid-domain-xyz123.com"
    ];
    
    for (const email of invalidEmails) {
      await page.fill('input[type="email"]', email);
      
      // Check HTML5 validation or custom validation
      const emailInput = page.locator('input[type="email"]');
      const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      
      if (isValid) {
        // If HTML5 validation passes, check custom validation
        await page.click('button:has-text("Send Magic Link")');
        
        // Should show error message
        await expect(page.locator('text=/Invalid|Error|not valid/i')).toBeVisible({
          timeout: 5000
        });
      } else {
        // HTML5 validation should prevent submission
        expect(isValid).toBe(false);
      }
    }
  });
  
  test("Auth bypass works in development", async ({ page, authHelper }) => {
    // Skip if not in bypass mode
    if (process.env.NEXT_PUBLIC_BYPASS_AUTH !== "true") {
      test.skip();
      return;
    }
    
    await page.goto("/");
    await authHelper.bypassAuth();
    
    // Should redirect to authenticated area
    await expect(page).toHaveURL(/\/(dashboard|chat|home)/, { timeout: 10000 });
    
    // Check for authenticated UI elements
    const authenticatedElements = [
      '.mac-professional',
      '[data-testid="user-menu"]',
      'button:has-text("New Chat")',
      '[class*="dashboard"]'
    ];
    
    let foundElement = false;
    for (const selector of authenticatedElements) {
      if (await page.locator(selector).isVisible().catch(() => false)) {
        foundElement = true;
        break;
      }
    }
    
    expect(foundElement).toBe(true);
  });
  
  test("Logout flow works correctly", async ({ authenticatedPage }) => {
    const authHelper = new (await import("../../../fixtures/auth.fixture")).AuthHelper(authenticatedPage);
    
    // Ensure we're authenticated first
    await authenticatedPage.goto("/dashboard").catch(() => authenticatedPage.goto("/"));
    
    // Perform logout
    await authHelper.logout();
    
    // Should redirect to login page
    await authenticatedPage.goto("/dashboard");
    await expect(authenticatedPage).toHaveURL(/\/(login|$)/, { timeout: 10000 });
    
    // Login form should be visible
    await expect(authenticatedPage.locator('input[type="email"]')).toBeVisible();
  });
  
  test("Session persistence across page reloads", async ({ authenticatedPage }) => {
    // Navigate to authenticated area
    await authenticatedPage.goto("/dashboard").catch(() => authenticatedPage.goto("/"));
    
    // Reload page
    await authenticatedPage.reload();
    
    // Should still be authenticated
    await expect(authenticatedPage).not.toHaveURL(/\/(login|$)/, { timeout: 5000 });
    
    // Authenticated UI should still be visible
    const authenticatedElement = authenticatedPage.locator('.mac-professional, [data-testid="user-menu"]').first();
    await expect(authenticatedElement).toBeVisible();
  });
});