import { test, expect } from "@playwright/test";

test.describe("Chat Landing Page - AI Elements + MAC Theme", () => {
  // Capture console logs for inspection
  test("loads and renders chat landing, captures screenshot and logs", async ({
    page,
  }) => {
    const consoleLogs: string[] = [];
    page.on("console", (msg) => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });

    // App container present
    await expect(page.getByTestId("app-container")).toBeVisible();

    // Header title present (chat tab)
    await expect(page.getByText("SIAM Intelligence Hub").first()).toBeVisible();

    // Prompt input present
    const promptForm = page.locator('form:has(textarea[name="message"])');
    await expect(promptForm).toBeVisible();

    // Take a full-page screenshot
    await page.screenshot({
      path: "test-results/chat-landing.png",
      fullPage: true,
    });

    // Emit logs to stdout for CI artifacts
    console.log("\n--- Chat Landing Console Logs ---");
    for (const line of consoleLogs) console.log(line);
  });
});
