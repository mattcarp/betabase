import { test, expect } from "@playwright/test";
import { setupConsoleMonitoring, assertNoConsoleErrors } from "../helpers/console-monitor";

test.describe("Chat Landing Page - AI Elements + MAC Theme", () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitoring(page, {
      ignoreWarnings: true,
      ignoreNetworkErrors: true,
    });
  });

  test.afterEach(async () => {
    assertNoConsoleErrors();
  });

  // Capture console logs for inspection
  test("loads and renders chat landing, captures screenshot and logs", async ({
    page,
  }) => {

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
