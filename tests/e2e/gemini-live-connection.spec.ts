import { test, expect } from "@playwright/test";

test.describe("Gemini Live Connection", () => {
  test("push-to-talk: should start recording on pointer down, stop on pointer up", async ({ page }) => {
    // Collect console logs before navigation
    const logs: string[] = [];

    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("🎤") || text.includes("🔌") || text.includes("Live:") || text.includes("Gemini")) {
        console.log("Browser log:", text);
        logs.push(text);
      }
    });

    // Navigate to the chat page
    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Look for the voice input button
    const voiceButton = page.locator('[data-testid="voice-input-button"]');
    const voiceButtonExists = await voiceButton.count() > 0;

    if (!voiceButtonExists) {
      await page.screenshot({ path: "tests/e2e/screenshots/push-to-talk-no-button.png" });
      test.skip(true, "Voice button not found - may need authentication");
      return;
    }

    // Grant microphone permission
    await page.context().grantPermissions(["microphone"]);

    // Get button bounding box for pointer events
    const box = await voiceButton.boundingBox();
    expect(box).toBeTruthy();

    // Simulate PUSH (pointer down) - should start recording
    console.log("Simulating pointer DOWN (start recording)...");
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();

    // Wait for recording to start
    await page.waitForTimeout(3000);

    // Take screenshot while "recording"
    await page.screenshot({ path: "tests/e2e/screenshots/push-to-talk-recording.png" });

    // Check for push-to-talk START log
    const hasStartLog = logs.some(log => log.includes("push-to-talk START"));
    console.log("Has push-to-talk START:", hasStartLog);

    // Simulate RELEASE (pointer up) - should stop recording
    console.log("Simulating pointer UP (stop recording)...");
    await page.mouse.up();

    // Wait for stop to process
    await page.waitForTimeout(1000);

    // Take screenshot after release
    await page.screenshot({ path: "tests/e2e/screenshots/push-to-talk-released.png" });

    // Check for push-to-talk STOP log
    const hasStopLog = logs.some(log => log.includes("push-to-talk STOP"));
    console.log("Has push-to-talk STOP:", hasStopLog);

    // Print all logs
    console.log("\n=== All Logs ===");
    logs.forEach(log => console.log(log));

    // Verify push-to-talk behavior
    expect(hasStartLog).toBe(true);
    expect(hasStopLog).toBe(true);
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
