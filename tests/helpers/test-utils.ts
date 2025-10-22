import { Page, expect } from "@playwright/test";
import TEST_CONFIG from "../test.config";

/**
 * Common test utilities for SIAM tests
 */

// Authentication helpers
export async function login(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.fill(TEST_CONFIG.selectors.emailInput, email);
  await page.fill(TEST_CONFIG.selectors.passwordInput, password);
  await page.click(TEST_CONFIG.selectors.submitButton);

  // Wait for redirect or main app to load
  await page.waitForURL((url) => !url.pathname.includes("login"), {
    timeout: TEST_CONFIG.timeouts.navigation,
  });
}

export async function logout(page: Page) {
  const logoutButton = page.locator(TEST_CONFIG.selectors.logoutButton);
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL("**/login", { timeout: TEST_CONFIG.timeouts.navigation });
  }
}

// Navigation helpers
export async function navigateToTab(page: Page, tabName: "Chat" | "Curate" | "Analytics") {
  const tabSelector = `button[role="tab"]:has-text("${tabName}")`;
  await page.click(tabSelector);
  await page.waitForTimeout(500); // Brief wait for tab content to load
}

// Wait helpers
export async function waitForAPIResponse(page: Page, endpoint: string) {
  return page.waitForResponse(
    (response) => response.url().includes(endpoint) && response.status() === 200,
    { timeout: TEST_CONFIG.timeouts.api }
  );
}

export async function waitForLoadingComplete(page: Page) {
  // Wait for any loading indicators to disappear
  const loadingIndicators = page.locator('.loading, .spinner, [data-loading="true"]');
  await loadingIndicators.waitFor({ state: "hidden", timeout: TEST_CONFIG.timeouts.action });
}

// Screenshot helpers
export async function captureScreenshot(page: Page, name: string, fullPage = true) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `tests/screenshots/${name}-${timestamp}.png`;
  await page.screenshot({ path: filename, fullPage });
  return filename;
}

// Form helpers
export async function fillForm(page: Page, formData: Record<string, string>) {
  for (const [field, value] of Object.entries(formData)) {
    const selector = `[name="${field}"], [data-testid="${field}"], #${field}`;
    await page.fill(selector, value);
  }
}

export async function submitForm(page: Page, buttonText = "Submit") {
  const submitButton = page.locator(`button:has-text("${buttonText}")`);
  await submitButton.click();
}

// Assertion helpers
export async function expectToastMessage(page: Page, message: string) {
  const toast = page.locator('.toast-message, [role="alert"]');
  await expect(toast).toContainText(message);
}

export async function expectErrorMessage(page: Page, message: string) {
  const error = page.locator('.error, .error-message, [data-error="true"]');
  await expect(error).toContainText(message);
}

// Data helpers
export function generateTestEmail() {
  const timestamp = Date.now();
  return `test-${timestamp}@sonymusic.com`;
}

export function generateTestData() {
  const timestamp = Date.now();
  return {
    email: `test-${timestamp}@sonymusic.com`,
    username: `testuser${timestamp}`,
    message: `Test message ${timestamp}`,
    filename: `test-file-${timestamp}.txt`,
  };
}

// Cleanup helpers
export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function clearCookies(page: Page) {
  const context = page.context();
  await context.clearCookies();
}

// Debug helpers
export async function pauseIfDebug(page: Page) {
  if (process.env.DEBUG === "true") {
    await page.pause();
  }
}

export async function logTestInfo(testName: string, step: string) {
  console.log(`[${new Date().toISOString()}] ${testName}: ${step}`);
}

// Retry helpers
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Export all helpers as default
export default {
  login,
  logout,
  navigateToTab,
  waitForAPIResponse,
  waitForLoadingComplete,
  captureScreenshot,
  fillForm,
  submitForm,
  expectToastMessage,
  expectErrorMessage,
  generateTestEmail,
  generateTestData,
  clearLocalStorage,
  clearCookies,
  pauseIfDebug,
  logTestInfo,
  retryOperation,
};
