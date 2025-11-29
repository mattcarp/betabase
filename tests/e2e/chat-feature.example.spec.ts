import { Page } from '@playwright/test';
import { test, expect } from '../fixtures/base-test';
import TEST_CONFIG from "../test.config";

/**
 * Example test file showing best practices and patterns
 * This demonstrates how to structure tests in the SIAM project
 */

// Page Object for better maintainability
class SiamChatPage {
  constructor(private page: Page) {}

  async navigateToChat() {
    await this.page.click(TEST_CONFIG.selectors.chatTab);
    await this.page.waitForSelector(TEST_CONFIG.selectors.chatInput);
  }

  async sendMessage(message: string) {
    await this.page.fill(TEST_CONFIG.selectors.chatInput, message);
    await this.page.click(TEST_CONFIG.selectors.sendButton);
  }

  async getLastMessage() {
    const messages = this.page.locator(`${TEST_CONFIG.selectors.messageList} > div`);
    const count = await messages.count();
    if (count > 0) {
      return await messages.nth(count - 1).textContent();
    }
    return null;
  }

  async waitForResponse() {
    await this.page.waitForResponse(
      (response) => response.url().includes("/api/chat") && response.status() === 200,
      { timeout: TEST_CONFIG.timeouts.api }
    );
  }
}

test.describe("SIAM Chat Feature", () => {
  let chatPage: SiamChatPage;

  // Setup before all tests in this suite
  test.beforeAll(async () => {
    console.log("🚀 Starting Chat Feature tests");
  });

  // Setup before each test
  test.beforeEach(async ({ page }) => {
    chatPage = new SiamChatPage(page);
    await page.goto("/");

    // Handle authentication if needed
    const needsAuth = await page.locator(TEST_CONFIG.selectors.emailInput).isVisible();
    if (needsAuth) {
      // Login flow would go here
      console.log("⚠️ Authentication required - implement login flow");
    }
  });

  test.describe("Basic Functionality", () => {
    test("should load chat interface @e2e", async ({ page }) => {
      await chatPage.navigateToChat();

      // Verify chat elements are present
      await expect(page.locator(TEST_CONFIG.selectors.chatInput)).toBeVisible();
      await expect(page.locator(TEST_CONFIG.selectors.sendButton)).toBeVisible();

      // Take screenshot for visual verification
      await page.screenshot({
        path: `tests/screenshots/chat-interface-${Date.now()}.png`,
        fullPage: true,
      });
    });

    test("should send and receive messages @regression", async ({ page }) => {
      await chatPage.navigateToChat();

      const testMessage = "Hello, this is a test message";
      await chatPage.sendMessage(testMessage);

      // Wait for API response
      await chatPage.waitForResponse();

      // Verify message appears in chat
      const lastMessage = await chatPage.getLastMessage();
      expect(lastMessage).toContain(testMessage);
    });

    test("should handle empty messages gracefully", async ({ page }) => {
      await chatPage.navigateToChat();

      // Try to send empty message
      await page.click(TEST_CONFIG.selectors.sendButton);

      // Button should be disabled or show error
      const isDisabled = await page.locator(TEST_CONFIG.selectors.sendButton).isDisabled();
      const hasError = await page.locator(".error-message").isVisible();

      expect(isDisabled || hasError).toBeTruthy();
    });
  });

  test.describe("Advanced Features", () => {
    test("should handle markdown in messages @visual", async ({ page }) => {
      await chatPage.navigateToChat();

      const markdownMessage = "**Bold text** and *italic text* with `code`";
      await chatPage.sendMessage(markdownMessage);

      await page.waitForTimeout(2000); // Wait for rendering

      // Visual regression test
      await page.screenshot({
        path: `tests/screenshots/markdown-message.png`,
        clip: { x: 0, y: 0, width: 800, height: 600 },
      });
    });

    test.skip("should support file uploads @slow", async ({ page }) => {
      // Skip this test for now - implement when file upload is ready
      await chatPage.navigateToChat();

      // File upload logic would go here
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles("tests/fixtures/test-document.pdf");

      // Verify upload success
      await expect(page.locator(".upload-success")).toBeVisible();
    });
  });

  // Cleanup after each test
  test.afterEach(async ({ page }, testInfo) => {
    // Capture screenshot on failure
    if (testInfo.status !== "passed") {
      await page.screenshot({
        path: `tests/screenshots/failure-${testInfo.title}-${Date.now()}.png`,
        fullPage: true,
      });
    }
  });

  // Cleanup after all tests
  test.afterAll(async () => {
    console.log("✅ Chat Feature tests completed");
  });
});
