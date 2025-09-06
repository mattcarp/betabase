import { test, expect } from "@playwright/test";

test.describe("SIAM Application Validation", () => {
  test("Login and validate P0 features", async ({ page }) => {
    // Test credentials from the app
    const testEmail = "claude@test.siam.ai";
    const testPassword = "4@9XMPfE9B$";

    // Navigate to production URL
    await page.goto("https://siam-two.vercel.app");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check if login form is present
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    // Fill in credentials
    await emailInput.fill(testEmail);
    await passwordInput.fill(testPassword);

    // Take screenshot of login page
    await page.screenshot({ path: "login-page.png" });

    // Click sign in button
    await page.locator('button:has-text("Sign In")').click();

    // Wait for navigation or error
    await page.waitForTimeout(3000);

    // Check if we're logged in or if there's an error
    const currentUrl = page.url();
    const pageContent = await page.content();

    console.log("Current URL after login:", currentUrl);

    // Take screenshot after login attempt
    await page.screenshot({ path: "after-login.png" });

    // Check for chat page elements
    const chatInterface = page.locator(
      '[data-testid="chat-interface"], .chat-interface, #chat',
    );
    const hasChat = (await chatInterface.count()) > 0;

    // Check for error messages
    const errorMessage = page.locator('.text-red-200, .error, [role="alert"]');
    const hasError = (await errorMessage.count()) > 0;

    if (hasError) {
      const errorText = await errorMessage.textContent();
      console.log("Login error:", errorText);
    }

    // Validate P0 features presence
    const features = {
      Authentication: currentUrl.includes("/chat") || hasChat,
      "Chat Interface": hasChat,
      Settings:
        (await page
          .locator('[aria-label*="settings"], button:has-text("Settings")')
          .count()) > 0,
      Navigation: (await page.locator('nav, [role="navigation"]').count()) > 0,
    };

    console.log("P0 Features Status:", features);

    // Check build info in footer
    const footer = page.locator("footer");
    const footerText = await footer.textContent();
    console.log("Footer build info:", footerText);

    // Return validation results
    return {
      loginSuccessful: currentUrl.includes("/chat") || hasChat,
      features,
      errorMessage: hasError ? await errorMessage.textContent() : null,
      buildInfo: footerText,
    };
  });
});
