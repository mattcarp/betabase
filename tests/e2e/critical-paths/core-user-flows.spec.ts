import { test, expect } from "@playwright/test";
import {
  navigateTo,
  bypassDevAuth,
  waitForNoConsoleErrors,
  reliableExpectVisible,
  typeAndSubmit,
} from "../../helpers/reliable-test-utils";

const LOCAL = process.env.BASE_URL || "http://localhost:3000";

test.describe("Critical Path: Core User Flows", () => {
  test.beforeEach(async ({ page }) => {
    await bypassDevAuth(page);
  });

  test("Authentication: login -> session -> logout", async ({ page }) => {
    await navigateTo(page, `${LOCAL}/login`);
    await reliableExpectVisible(page, '[data-test-id="login-form"]');
    await typeAndSubmit(page, 'input[name="email"]', "dev@siam.local");
    await typeAndSubmit(page, 'input[name="password"]', "devpass");
    await page.waitForURL(/\/dashboard/i, { timeout: 30_000 });
    await waitForNoConsoleErrors(page);
    await reliableExpectVisible(page, '[data-test-id="dashboard-root"]');

    // logout path (selector is a placeholder; adjust as app dictates)
    await page.click('[data-test-id="user-menu-button"]');
    await page.click('[data-test-id="logout-button"]');
    await page.waitForURL(/\/login/i);
  });

  test("Navigation: tabs and routing", async ({ page }) => {
    await navigateTo(page, `${LOCAL}/`);
    await reliableExpectVisible(page, '[data-test-id="navbar"]');
    await page.click('[data-test-id="nav-chat"]');
    await page.waitForURL(/\/chat/i);
    await reliableExpectVisible(page, '[data-test-id="chat-root"]');
  });

  test("File Upload: single file happy path", async ({ page }) => {
    await navigateTo(page, `${LOCAL}/upload`);
    await reliableExpectVisible(page, '[data-test-id="upload-input"]');
    const filePath = "test-uploads/sample.txt";
    await page.setInputFiles('[data-test-id="upload-input"]', filePath);
    await page.click('[data-test-id="upload-submit"]');
    await reliableExpectVisible(page, '[data-test-id="upload-success"]');
  });

  test("Chat: send and receive message baseline", async ({ page }) => {
    await navigateTo(page, `${LOCAL}/chat`);
    await reliableExpectVisible(page, '[data-test-id="chat-input"]');
    await page.fill('[data-test-id="chat-input"]', "Hello, Siam!");
    await page.click('[data-test-id="chat-send"]');
    await expect(page.locator('[data-test-id="chat-message"]').last()).toContainText(
      /hello, siam!/i
    );
  });
});

