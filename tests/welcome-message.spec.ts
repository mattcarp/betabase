import { test, expect } from "@playwright/test";

test.describe("Welcome Message", () => {
  test("should display 'Welcome to The Betabase' not 'Welcome to the New Conversation'", async ({
    page,
  }) => {
    // Navigate to the application
    await page.goto("http://localhost:3000");

    // Wait for the welcome message to appear (more specific than networkidle)
    await page.waitForSelector("h2", { timeout: 10000 });

    // Check that the correct welcome message is displayed
    await expect(page.locator("h2:has-text('Welcome to The Betabase')")).toBeVisible({
      timeout: 5000,
    });

    // Ensure the wrong message is NOT displayed
    await expect(page.locator("text='Welcome to the New Conversation'")).not.toBeVisible();

    // Also check the text content directly
    const welcomeHeading = await page
      .locator("h2")
      .filter({ hasText: /Welcome to/ })
      .textContent();
    expect(welcomeHeading).toBe("Welcome to The Betabase");

  test("should maintain correct welcome message after conversation interactions", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000");
    await page.waitForSelector("h2", { timeout: 10000 });

    // Initial check
    await expect(page.locator("h2:has-text('Welcome to The Betabase')")).toBeVisible({
      timeout: 5000,
    });

    // Click on a suggestion to start a conversation
    const suggestion = page
      .locator("button")
      .filter({ hasText: "How does the new automated QC" })
      .first();
    if (await suggestion.isVisible()) {
      await suggestion.click();

      // Wait for the message to be sent
      await page.waitForTimeout(1000);

      // Navigate back to a new conversation
      const newConvoButton = page
        .locator("button")
        .filter({ hasText: /New Conversation|New Thread|New Chat/ })
        .first();
      if (await newConvoButton.isVisible()) {
        await newConvoButton.click();
        await page.waitForTimeout(500);

        // Verify the welcome message is still correct
        const welcomeVisible = await page
          .locator("h2:has-text('Welcome to The Betabase')")
          .isVisible();
        if (welcomeVisible) {
          await expect(page.locator("h2:has-text('Welcome to The Betabase')")).toBeVisible();
        }
      }
    }
  });

  test("should never show 'Welcome to the New Conversation' text", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.waitForSelector("h2", { timeout: 10000 });

    // Search the entire page content for the incorrect text
    const pageContent = await page.content();
    expect(pageContent).not.toContain("Welcome to the New Conversation");

    // Also check visible text
    const visibleText = await page.locator("body").textContent();
    expect(visibleText).not.toContain("Welcome to the New Conversation");

    // Check specifically in the welcome area
    const welcomeArea = page
      .locator("div")
      .filter({ has: page.locator("h2").filter({ hasText: /Welcome to/ }) })
      .first();
    const welcomeAreaText = await welcomeArea.textContent();
    expect(welcomeAreaText).toContain("Welcome to The Betabase");
    expect(welcomeAreaText).not.toContain("Welcome to the New Conversation");
  });
});
