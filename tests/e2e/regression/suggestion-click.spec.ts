import { test, expect } from "@playwright/test";

/**
 * Regression Test: Suggestion Click Insert-Only Behavior
 *
 * When clicking a suggestion bubble on the landing page, the text should be
 * inserted into the chat input field WITHOUT auto-sending. User can then
 * review/edit and submit manually.
 */
test.describe("Suggestion Click Regression", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the chat page
    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");
  });

  test("clicking suggestion inserts text into input field without auto-sending", async ({
    page,
  }) => {
    // Wait for suggestions to appear
    const suggestionButton = page.locator("button").filter({
      hasText: /asset types|AWS S3|permission levels|AOMA/i,
    }).first();

    await expect(suggestionButton).toBeVisible({ timeout: 10000 });

    // Get the suggestion text before clicking
    const suggestionText = await suggestionButton.textContent();
    expect(suggestionText).toBeTruthy();

    // Get the input field
    const inputField = page.locator('textarea[placeholder*="Ask me anything"]');
    await expect(inputField).toBeVisible();

    // Verify input is initially empty
    await expect(inputField).toHaveValue("");

    // Click the suggestion
    await suggestionButton.click();

    // Wait for input to be populated
    await page.waitForTimeout(200);

    // CRITICAL ASSERTION: Input field should now contain the suggestion text
    const inputValue = await inputField.inputValue();
    expect(inputValue.length).toBeGreaterThan(10); // Should have substantial text
    expect(inputValue.toLowerCase()).toContain("aoma"); // All suggestions mention AOMA

    // Verify input field is focused (cursor should be in field)
    await expect(inputField).toBeFocused();

    // CRITICAL: No messages should have been sent yet
    // The chat log should NOT show a user message bubble
    const userMessages = page.locator('[data-role="user"]');
    await expect(userMessages).toHaveCount(0);
  });

  test("suggestion text persists in input field", async ({ page }) => {
    // Wait for any suggestion button
    const suggestionButton = page.locator("button").filter({
      hasText: /asset types|storage tiers|permission levels/i,
    }).first();

    await expect(suggestionButton).toBeVisible({ timeout: 10000 });
    const suggestionText = (await suggestionButton.textContent()) || "";

    // Click suggestion
    await suggestionButton.click();
    await page.waitForTimeout(300);

    // Get input field value
    const inputField = page.locator('textarea[placeholder*="Ask me anything"]');
    const inputValue = await inputField.inputValue();

    // Wait a bit more to ensure no race conditions clear the input
    await page.waitForTimeout(500);

    // Value should still be there (not cleared by any useEffect)
    const inputValueAfterWait = await inputField.inputValue();
    expect(inputValueAfterWait).toBe(inputValue);
    expect(inputValueAfterWait.length).toBeGreaterThan(0);
  });
});
