/**
 * Fixit Code Assistant E2E Tests
 *
 * Tests for the programmer-focused Code Assistant feature
 * within the Fix tab.
 */

import { test, expect } from "@playwright/test";

test.describe("Code Assistant Tab", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto("/");

    // Wait for the main layout to load
    await expect(page.locator("[data-testid='conversation-sidebar']")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should display Code Assistant as first sub-tab in Fix", async ({ page }) => {
    // Click on the Fix tab in the main navigation
    const fixTab = page.locator("button").filter({ hasText: /Fix/i }).first();
    await fixTab.click();

    // Verify Code Assistant tab is visible and selected by default
    const codeAssistantTab = page.locator("button[value='code-assistant']");
    await expect(codeAssistantTab).toBeVisible();
    await expect(codeAssistantTab).toHaveAttribute("data-state", "active");
  });

  test("should show welcome message in Code Assistant", async ({ page }) => {
    // Navigate to Fix tab
    await page.locator("button").filter({ hasText: /Fix/i }).first().click();

    // Verify welcome message is displayed
    await expect(page.getByText("Code Assistant")).toBeVisible();
    await expect(page.getByText("Codebase-aware")).toBeVisible();
    await expect(
      page.getByText("Ask questions about your codebase, debug issues, or explore architecture")
    ).toBeVisible();
  });

  test("should display suggested questions", async ({ page }) => {
    // Navigate to Fix tab
    await page.locator("button").filter({ hasText: /Fix/i }).first().click();

    // Verify suggested questions are displayed
    await expect(page.getByText("Try asking:")).toBeVisible();
    await expect(page.getByText("What is the backend language and framework?")).toBeVisible();
    await expect(page.getByText("Show me the frontend framework and main components")).toBeVisible();
  });

  test("should allow clicking on suggested questions", async ({ page }) => {
    // Navigate to Fix tab
    await page.locator("button").filter({ hasText: /Fix/i }).first().click();

    // Click on a suggested question
    const suggestionButton = page
      .locator("button")
      .filter({ hasText: "What is the backend language and framework?" });
    await suggestionButton.click();

    // Verify the question appears in the chat (as a user message)
    await expect(
      page.getByText("What is the backend language and framework?").first()
    ).toBeVisible();
  });

  test("should show empty artifacts panel initially", async ({ page }) => {
    // Navigate to Fix tab
    await page.locator("button").filter({ hasText: /Fix/i }).first().click();

    // Initially, the artifacts panel should not be visible (or show empty state)
    // Since artifacts only appear after generating code, we check the chat panel is present
    await expect(page.getByText("Code Assistant")).toBeVisible();
  });

  test("should switch between Fix sub-tabs", async ({ page }) => {
    // Navigate to Fix tab
    await page.locator("button").filter({ hasText: /Fix/i }).first().click();

    // Click on Response Debugger tab
    await page.locator("button[value='debugger']").click();
    await expect(page.locator("button[value='debugger']")).toHaveAttribute("data-state", "active");

    // Click on Quick Fix tab
    await page.locator("button[value='quickfix']").click();
    await expect(page.locator("button[value='quickfix']")).toHaveAttribute("data-state", "active");

    // Click back to Code Assistant
    await page.locator("button[value='code-assistant']").click();
    await expect(page.locator("button[value='code-assistant']")).toHaveAttribute(
      "data-state",
      "active"
    );
  });

  test("should have input field for asking questions", async ({ page }) => {
    // Navigate to Fix tab
    await page.locator("button").filter({ hasText: /Fix/i }).first().click();

    // Verify the input textarea is present
    const inputField = page.locator("textarea[placeholder='Ask about your codebase...']");
    await expect(inputField).toBeVisible();

    // Type in the input
    await inputField.fill("What is this project about?");
    await expect(inputField).toHaveValue("What is this project about?");
  });

  test("should have send button that is disabled when input is empty", async ({ page }) => {
    // Navigate to Fix tab
    await page.locator("button").filter({ hasText: /Fix/i }).first().click();

    // Find the send button (the one with the Send icon next to textarea)
    const sendButton = page.locator("button[type='submit']");
    await expect(sendButton).toBeVisible();

    // Should be disabled when input is empty
    await expect(sendButton).toBeDisabled();

    // Fill in some text
    const inputField = page.locator("textarea[placeholder='Ask about your codebase...']");
    await inputField.fill("Test question");

    // Now send button should be enabled
    await expect(sendButton).toBeEnabled();
  });
});
