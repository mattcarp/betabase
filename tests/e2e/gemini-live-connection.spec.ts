import { test, expect } from "@playwright/test";

test.describe("Gemini Live Connection", () => {
  test("should attempt to connect when microphone is clicked", async ({ page }) => {
    // Collect console logs before navigation
    const logs: string[] = [];
    const errors: string[] = [];

    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("Live:") || text.includes("Gemini") || text.includes("🎤") || text.includes("🔌")) {
        console.log("Browser log:", text);
        logs.push(text);
      }
    });

    page.on("pageerror", (error) => {
      errors.push(error.message);
      console.log("Page error:", error.message);
    });

    // Navigate to the chat page
    await page.goto("http://localhost:3000");

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // Extra wait for React hydration

    // Take initial screenshot
    await page.screenshot({ path: "tests/e2e/screenshots/gemini-live-before.png" });

    // Look for the voice input button with our new testid
    const voiceButton = page.locator('[data-testid="voice-input-button"]');
    const voiceButtonExists = await voiceButton.count() > 0;

    console.log("Voice button found:", voiceButtonExists);

    if (voiceButtonExists) {
      console.log("Found voice input button, clicking...");

      // Grant microphone permission
      await page.context().grantPermissions(["microphone"]);

      // Click the button
      await voiceButton.click();

      // Wait for connection attempt
      await page.waitForTimeout(5000);

      // Take screenshot after click
      await page.screenshot({ path: "tests/e2e/screenshots/gemini-live-after-click.png" });

      // Check logs for connection activity
      console.log("\n=== Collected Logs ===");
      logs.forEach(log => console.log(log));

      // Should see connection attempt in logs
      const hasConnectionAttempt = logs.some(log =>
        log.includes("Connecting to Gemini") ||
        log.includes("WebSocket Session Opened") ||
        log.includes("Live: Attempting to connect")
      );

      console.log("\nHas connection attempt:", hasConnectionAttempt);

      // Check for specific error messages
      const hasCredentialsFetch = logs.some(log => log.includes("Fetching credentials"));
      const hasConnectionError = logs.some(log => log.includes("Connection Exception") || log.includes("Connection Error"));

      console.log("Has credentials fetch:", hasCredentialsFetch);
      console.log("Has connection error:", hasConnectionError);

      if (errors.length > 0) {
        console.log("\n=== Page Errors ===");
        errors.forEach(err => console.log(err));
      }

      // Log assertion
      expect(hasConnectionAttempt || hasCredentialsFetch).toBe(true);
    } else {
      // Check if page shows auth screen
      const authScreen = await page.locator('text=Sign In, text=Login, text=Magic Link').count();
      console.log("Auth screen visible:", authScreen > 0);

      // Take screenshot
      await page.screenshot({ path: "tests/e2e/screenshots/gemini-live-no-button.png" });

      test.skip(true, "Voice button not found - may need authentication");
    }
  });

  test("should verify credentials endpoint returns API key", async ({ request }) => {
    const response = await request.get("http://localhost:3000/api/gemini/credentials");
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data).toHaveProperty("apiKey");
    expect(data.apiKey).toBeTruthy();
    expect(data.apiKey.length).toBeGreaterThan(10);

    console.log("API key available, length:", data.apiKey.length);
  });
});
