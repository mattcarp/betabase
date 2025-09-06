import { test, expect } from "@playwright/test";

test.describe("SIAM Authentication Flow", () => {
  test("Emergency login page loads", async ({ page }) => {
    await page.goto("https://siam-app.onrender.com/emergency-login.html");
    await expect(page.locator("h1")).toContainText("SIAM");
    await expect(page.locator("button")).toContainText("Send Magic Link");
  });

  test("Can submit email for magic link", async ({ page }) => {
    await page.goto("https://siam-app.onrender.com/emergency-login.html");
    await page.fill('input[type="email"]', "matt@mattcarpenter.com");

    // Intercept the API call
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/auth/magic-link") && resp.status() === 200,
    );

    await page.click('button[type="submit"]');
    const response = await responsePromise;
    const json = await response.json();

    expect(json.success).toBe(true);
  });

  test("Main app page eventually loads without hydration errors", async ({
    page,
  }) => {
    // Set authentication in localStorage first
    await page.goto("https://siam-app.onrender.com/emergency-login.html");
    await page.evaluate(() => {
      localStorage.setItem(
        "siam_user",
        JSON.stringify({
          email: "test@example.com",
          authToken: "test-token",
          verifiedAt: new Date().toISOString(),
        }),
      );
    });

    // Navigate to main app
    await page.goto("https://siam-app.onrender.com");

    // Wait for any content to appear
    await page.waitForTimeout(5000);

    // Check for React errors
    const errors = await page.evaluate(() => {
      const errorDivs = document.querySelectorAll("[data-nextjs-error]");
      return errorDivs.length;
    });

    // Should have no Next.js error overlays
    expect(errors).toBe(0);
  });
});
