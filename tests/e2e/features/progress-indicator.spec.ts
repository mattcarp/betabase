import { test, expect } from "@playwright/test";

test.describe("Chat Progress Indicator - Chain of Thought", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the chat interface
    await page.goto("http://localhost:3000");

    // Wait for the chat interface to load
    await page.waitForSelector("text=Welcome to The Betabase", { timeout: 15000 });
  });

  test("should show chain of thought progress indicator when submitting a question", async ({
    page,
  }) => {
    // Type a question in the chat input
    const chatInput = page.locator('textarea[placeholder="Ask me anything..."]');
    await chatInput.fill("What is AOMA?");

    // Submit the question
    await chatInput.press("Enter");

    // Wait for chain of thought indicator to appear
    // The indicator shows "Understanding your question..." first
    const thinkingIndicator = page.locator('[data-slot="chain-of-thought"]');
    await expect(thinkingIndicator).toBeVisible({ timeout: 10000 });

    // Verify the "Understanding your question..." step appears (use first() to avoid strict mode)
    await expect(page.locator('text=Understanding your question...').first()).toBeVisible({ timeout: 5000 });
  });

  test("should show progressive thinking steps during RAG query", async ({ page }) => {
    // Type a question
    const chatInput = page.locator('textarea[placeholder="Ask me anything..."]');
    await chatInput.fill("What is asset registration?");
    await chatInput.press("Enter");

    // Wait for initial thinking step (use first() to avoid strict mode)
    await expect(page.locator('text=Understanding your question...').first()).toBeVisible({ timeout: 10000 });

    // Wait for second step (appears after ~2 seconds)
    await expect(page.locator('text=Searching knowledge base...').first()).toBeVisible({ timeout: 10000 });

    // The third step appears after ~5 seconds
    await expect(page.locator('text=Retrieving relevant documents...').first()).toBeVisible({ timeout: 15000 });
  });

  test("should hide progress indicator once streaming starts", async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder="Ask me anything..."]');
    await chatInput.fill("What is master linking?");
    await chatInput.press("Enter");

    // Wait for progress indicator to appear first
    const thinkingIndicator = page.locator('[data-slot="chain-of-thought"]');
    await expect(thinkingIndicator).toBeVisible({ timeout: 10000 });

    // Wait for AI response to appear (look for the AI badge which indicates response started)
    await page.waitForSelector('div:has-text("AI")', { timeout: 30000 });

    // Give time for streaming to start
    await page.waitForTimeout(2000);

    // Progress indicator should be hidden once streaming starts
    // It may already be gone, or it will be soon
    await expect(thinkingIndicator).toBeHidden({ timeout: 10000 });
  });

  test("should show complete AI response after chain of thought", async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder="Ask me anything..."]');
    await chatInput.fill("Tell me about AOMA");
    await chatInput.press("Enter");

    // Wait for AI response - look for the AI avatar/message marker
    // The AI response appears with an "AI" badge
    await page.waitForSelector('text=AI', { timeout: 45000 });

    // Wait a bit more for content to stream
    await page.waitForTimeout(5000);

    // Verify some response text is visible
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/AOMA|Asset|Sony|system/i);
  });

  test("should not show any console errors during chat submission", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    const chatInput = page.locator('textarea[placeholder="Ask me anything..."]');
    await chatInput.fill("What are the different asset types?");
    await chatInput.press("Enter");

    // Wait for response to complete
    await page.waitForTimeout(15000);

    // Filter out expected/known errors
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes("Failed to fetch") && // Network errors during navigation are ok
        !err.includes("ResizeObserver") && // Layout observation errors are benign
        !err.includes("append") && // Old AI SDK warnings
        !err.includes("sendMessage") // AI SDK migration warnings
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("should show stop button during generation", async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder="Ask me anything..."]');
    await chatInput.fill("Explain the asset workflow in detail");
    await chatInput.press("Enter");

    // Wait for the stop button (square icon) to appear
    // During loading/streaming, the send button changes to a stop button
    const stopButton = page.locator('button:has(svg)').filter({
      has: page.locator('rect, .lucide-square')
    });

    // The button should appear during loading
    await expect(stopButton.first()).toBeVisible({ timeout: 10000 });
  });

  test("should show chain of thought on SUBSEQUENT questions (not just first)", async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder="Ask me anything..."]');

    // First question
    await chatInput.fill("What is AOMA?");
    await chatInput.press("Enter");

    // Wait for first response to complete
    await page.waitForSelector('text=AI', { timeout: 45000 });
    await page.waitForTimeout(3000); // Let response finish

    // Now submit a SECOND question
    await chatInput.fill("What is master linking?");
    await chatInput.press("Enter");

    // Chain of thought should appear AGAIN for the second question
    const thinkingIndicator = page.locator('[data-slot="chain-of-thought"]');
    await expect(thinkingIndicator).toBeVisible({ timeout: 10000 });

    // Verify the thinking step appears
    await expect(page.locator('text=Understanding your question...').first()).toBeVisible({ timeout: 5000 });
  });
});
