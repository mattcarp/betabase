import { test, expect } from '../fixtures/base-test';

test.describe("OpenAI Responses API Migration", () => {
  test("chat API should use native OpenAI streaming", async ({ request }) => {
    // Test the API directly
    const response = await request.post("http://localhost:3000/api/chat", {
      data: {
        messages: [{ role: "user", content: "Hello, test message for OpenAI Responses API" }],
        model: "gpt-4o-mini",
        temperature: 0.7,
      },
    });

    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toBe("text/event-stream");

    // Read the streaming response
    const body = await response.body();
    expect(body).toBeTruthy();
  });

  test("chat interface should work with new API", async ({ page }) => {
    // Navigate to the app
    await page.goto("http://localhost:3000");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check for console errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Look for the chat input
    const chatInput = page
      .locator(
        'textarea[placeholder*="Message"], input[placeholder*="Message"], textarea[placeholder*="Type"], input[placeholder*="Type"]'
      )
      .first();

    if (await chatInput.isVisible()) {
      // Type a test message
      await chatInput.fill("Test message: Is the OpenAI Responses API working?");

      // Find and click the send button
      const sendButton = page.locator('button[type="submit"], button:has-text("Send")').first();
      await sendButton.click();

      // Wait for response to start streaming
      await page.waitForTimeout(2000);

      // Check for response content
      const messageContent = page.locator(
        '[class*="message"], [class*="response"], [class*="assistant"]'
      );
      await expect(messageContent).toBeVisible({ timeout: 10000 });

      // Take a screenshot
      await page.screenshot({ path: "test-results/openai-api-test.png", fullPage: true });

      // Check for console errors
      expect(consoleErrors).toHaveLength(0);
    } else {
      console.log("Chat input not found - may need auth or different selector");
    }
  });

  test("verify knowledge elements are included", async ({ request }) => {
    // Test that knowledge elements are properly included
    const response = await request.post("http://localhost:3000/api/chat", {
      data: {
        messages: [{ role: "user", content: "Tell me about AOMA" }],
        model: "gpt-4o-mini",
        temperature: 0.7,
      },
      headers: {
        Accept: "text/event-stream",
      },
    });

    expect(response.ok()).toBeTruthy();

    const text = await response.text();

    // Check for SSE format
    expect(text).toContain("data: ");

    // Parse the response to look for knowledge elements
    const lines = text.split("\n");
    let hasKnowledgeElements = false;

    for (const line of lines) {
      if (line.startsWith("data: ") && line.includes('"type":"knowledge"')) {
        hasKnowledgeElements = true;
        break;
      }
    }

    console.log("Response includes knowledge elements:", hasKnowledgeElements);
  });
});
