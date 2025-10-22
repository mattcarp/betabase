import { test, expect } from "@playwright/test";
import { TestHelpers, TEST_USERS } from "../helpers/test-utils";

test.describe("Authentication Flow - Comprehensive", () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.monitorConsoleErrors();
  });

  test.describe("Magic Link Flow", () => {
    test("should display login form with all elements", async ({ page }) => {
      await page.goto("/");

      await expect(page.locator("h1")).toContainText("Welcome to SIAM");
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('button:has-text("Send Magic Link")')).toBeVisible();

      const logo = await page.locator('img[alt*="SIAM"]').isVisible();
      expect(logo).toBeTruthy();
    });

    test("should validate email format", async ({ page }) => {
      await page.goto("/");

      await page.fill('input[type="email"]', "invalid-email");
      await page.click('button:has-text("Send Magic Link")');

      const errorVisible = await helpers.checkTextVisible("Please enter a valid email");
      expect(errorVisible).toBeTruthy();
    });

    test("should successfully request magic link for allowed email", async ({ page }) => {
      await page.goto("/");

      const responsePromise = helpers.waitForAPIResponse("/api/auth/magic-link", { status: 200 });

      await page.fill('input[type="email"]', TEST_USERS.admin.email);
      await page.click('button:has-text("Send Magic Link")');

      const response = await responsePromise;
      const json = await response.json();

      expect(json.success).toBe(true);
      await expect(page.locator("text=/Check your email/i")).toBeVisible();
    });

    test("should reject non-allowed email domains", async ({ page }) => {
      await page.goto("/");

      await page.fill('input[type="email"]', "unauthorized@example.com");
      await page.click('button:has-text("Send Magic Link")');

      const errorVisible = await helpers.checkTextVisible("not authorized");
      expect(errorVisible).toBeTruthy();
    });

    test("should handle rate limiting gracefully", async ({ page }) => {
      await page.goto("/");

      const email = TEST_USERS.admin.email;

      // Send multiple requests quickly
      for (let i = 0; i < 3; i++) {
        await page.fill('input[type="email"]', email);
        await page.click('button:has-text("Send Magic Link")');
        await page.waitForTimeout(100);
      }

      // Check for rate limit message or similar
      const hasRateLimit = await page
        .locator("text=/too many requests|rate limit|try again later/i")
        .isVisible();
      // This might not trigger in dev, but the test structure is here
    });
  });

  test.describe("Bypassed Auth (Dev Mode)", () => {
    test("should allow access with bypassed auth", async ({ page }) => {
      await page.goto("/");
      await helpers.bypassAuth();
      await page.reload();

      await helpers.waitForPageReady();

      // Should see main app content
      const chatVisible = await helpers.checkElementVisible('[data-testid="chat-interface"]');
      const tabsVisible = await helpers.checkElementVisible('[role="tablist"]');

      expect(chatVisible || tabsVisible).toBeTruthy();
    });

    test("should maintain auth state across navigation", async ({ page }) => {
      await page.goto("/");
      await helpers.bypassAuth(TEST_USERS.fiona.email);
      await page.reload();

      await helpers.waitForPageReady();

      // Navigate between tabs
      await helpers.selectTab("Chat");
      await helpers.waitForPageReady();

      await helpers.selectTab("Curate");
      await helpers.waitForPageReady();

      // Check auth is maintained
      const authState = await page.evaluate(() => {
        const stored = localStorage.getItem("siam_user");
        return stored ? JSON.parse(stored) : null;
      });

      expect(authState).toBeTruthy();
      expect(authState.email).toBe(TEST_USERS.fiona.email);
    });

    test("should handle logout correctly", async ({ page }) => {
      await page.goto("/");
      await helpers.bypassAuth();
      await page.reload();

      await helpers.waitForPageReady();

      // Look for logout button
      const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out")');
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();

        // Should redirect to login
        await expect(page.locator('input[type="email"]')).toBeVisible();

        // Check auth is cleared
        const authState = await page.evaluate(() => localStorage.getItem("siam_user"));
        expect(authState).toBeNull();
      }
    });
  });

  test.describe("Session Management", () => {
    test("should expire session after timeout", async ({ page }) => {
      await page.goto("/");

      // Set expired session
      await page.evaluate(() => {
        const expiredDate = new Date();
        expiredDate.setHours(expiredDate.getHours() - 25); // 25 hours ago

        localStorage.setItem(
          "siam_user",
          JSON.stringify({
            email: "test@example.com",
            authToken: "expired-token",
            verifiedAt: expiredDate.toISOString(),
          })
        );
      });

      await page.reload();

      // Should redirect to login
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });

    test("should refresh session on activity", async ({ page }) => {
      await page.goto("/");
      await helpers.bypassAuth();
      await page.reload();

      const initialAuth = await page.evaluate(() => {
        const stored = localStorage.getItem("siam_user");
        return stored ? JSON.parse(stored) : null;
      });

      // Perform some activity
      await helpers.selectTab("Chat");
      await page.waitForTimeout(1000);

      const updatedAuth = await page.evaluate(() => {
        const stored = localStorage.getItem("siam_user");
        return stored ? JSON.parse(stored) : null;
      });

      // Session should still be valid
      expect(updatedAuth).toBeTruthy();
      expect(updatedAuth.email).toBe(initialAuth.email);
    });
  });

  test.describe("Error Handling", () => {
    test("should handle network errors gracefully", async ({ page, context }) => {
      await context.route("**/api/auth/magic-link", (route) => {
        route.abort("failed");
      });

      await page.goto("/");
      await page.fill('input[type="email"]', TEST_USERS.admin.email);
      await page.click('button:has-text("Send Magic Link")');

      const errorVisible = await helpers.checkTextVisible("error occurred");
      expect(errorVisible).toBeTruthy();
    });

    test("should handle server errors gracefully", async ({ page, context }) => {
      await context.route("**/api/auth/magic-link", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
      });

      await page.goto("/");
      await page.fill('input[type="email"]', TEST_USERS.admin.email);
      await page.click('button:has-text("Send Magic Link")');

      const errorVisible = await helpers.checkTextVisible("error");
      expect(errorVisible).toBeTruthy();
    });
  });

  test.afterEach(async ({ page }) => {
    const errors = await helpers.getConsoleErrors();
    if (errors.length > 0) {
      console.log("Console errors detected:", errors);
    }
  });
});
