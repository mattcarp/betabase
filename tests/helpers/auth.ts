import { Page } from "@playwright/test";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Login helper for Playwright tests using the test user account
 * Uses the hidden password field to authenticate without showing UI
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  const testEmail = process.env.TEST_USER_EMAIL || "claude@test.siam.ai";
  const testPassword = process.env.TEST_USER_PASSWORD;

  if (!testPassword) {
    throw new Error(
      "TEST_USER_PASSWORD not found in environment variables. Please check your .env file.",
    );
  }

  // Navigate to login page
  await page.goto("http://localhost:3000");

  // Fill in test credentials
  await page.fill('input[type="email"]', testEmail);

  // Use the hidden password field for automated testing
  await page.fill('[data-test-id="login-password-hidden"]', testPassword);

  // Small wait for React state to update
  await page.waitForTimeout(300);

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for authentication to complete
  // Adjust this based on your app's post-login behavior
  try {
    // Option 1: Wait for URL change
    await page.waitForURL("**/dashboard/**", { timeout: 5000 });
  } catch {
    // Option 2: Wait for specific element that appears after login
    await page.waitForSelector('[role="main"]', { timeout: 5000 }).catch(() => {
      // Option 3: Just wait a bit for the auth to process
      return page.waitForTimeout(2000);
    });
  }
}

/**
 * Check if user is currently logged in
 */
export async function isUserLoggedIn(page: Page): Promise<boolean> {
  // Check for various indicators of being logged in
  const indicators = [
    '[data-test-id="user-menu"]',
    '[data-test-id="logout-button"]',
    "text=Dashboard",
    "text=Welcome",
  ];

  for (const selector of indicators) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      return true;
    }
  }

  // Also check if we're NOT on the login page
  const onLoginPage =
    (await page.locator('text="The Betabase"').count()) > 0;
  return !onLoginPage;
}

/**
 * Logout helper
 */
export async function logout(page: Page): Promise<void> {
  // Look for logout button or user menu
  const logoutButton = page.locator('[data-test-id="logout-button"]');
  const userMenu = page.locator('[data-test-id="user-menu"]');

  if ((await logoutButton.count()) > 0) {
    await logoutButton.click();
  } else if ((await userMenu.count()) > 0) {
    await userMenu.click();
    await page.click("text=Logout");
  } else {
    // Fallback: navigate to logout URL or clear session
    await page.goto("http://localhost:3000/logout").catch(() => {
      // If no logout route, just go to home
      return page.goto("http://localhost:3000");
    });
  }

  // Wait for redirect to login page
  await page.waitForSelector('text="The Betabase"', { timeout: 5000 });
}
