import { test } from "@playwright/test";

test.describe("Capture Test Tab Screenshot", () => {
  test.setTimeout(120000);

  test("capture test dashboard after MAC fix", async ({ page }) => {
    // Login via magic link flow
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.fill('input[type="email"]', "siam-prod-test@mailinator.com");
    await page.click('button[type="submit"]', { force: true });
    await page.waitForTimeout(5000);

    // Go to Mailinator
    await page.goto("https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-prod-test");
    await page.waitForTimeout(5000);

    // Click first email
    const emailRow = page.locator("tr.ng-scope").first();
    if (await emailRow.isVisible({ timeout: 10000 }).catch(() => false)) {
      await emailRow.click({ force: true });
      await page.waitForTimeout(3000);

      // Get magic link
      try {
        const frame = page.frameLocator("#html_msg_body");
        const link = frame.locator("a").first();
        const href = await link.getAttribute("href", { timeout: 5000 });
        if (href && href.includes("localhost")) {
          await page.goto(href);
          await page.waitForTimeout(3000);
        }
      } catch (e) {
        console.log("Could not extract magic link, continuing anyway");
      }
    }

    // Navigate to main app
    await page.goto("http://localhost:3000");
    await page.waitForTimeout(3000);

    // Click on Test tab
    const testTab = page.locator('button:has-text("Test"), a:has-text("Test"), [data-testid="test-tab"]');
    if (await testTab.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await testTab.first().click({ force: true });
      await page.waitForTimeout(3000);
    }

    // Capture the Test Dashboard
    await page.screenshot({
      path: "screenshots/tab-test.png",
      fullPage: true
    });

    // Also click Self-Healing tab if visible
    const selfHealingTab = page.locator('button:has-text("Self-Healing"), [role="tab"]:has-text("Self-Healing")');
    if (await selfHealingTab.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await selfHealingTab.first().click({ force: true });
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: "screenshots/tab-self-healing.png",
        fullPage: true
      });
    }

    // Click Unified tab
    const unifiedTab = page.locator('button:has-text("Unified"), [role="tab"]:has-text("Unified")');
    if (await unifiedTab.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await unifiedTab.first().click({ force: true });
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: "screenshots/tab-unified.png",
        fullPage: true
      });
    }

    console.log("Test tab screenshots captured!");
  });
});
