import { test } from "@playwright/test";

test.describe("Self-Healing UI Screenshots", () => {
  test.setTimeout(120000);

  test("capture UI screenshots", async ({ page }) => {
    // Navigate to login
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({ path: "screenshots/01-login.png", fullPage: true });

    // Fill email and submit with force
    await page.fill('input[type="email"]', "siam-prod-test@mailinator.com");
    await page.screenshot({ path: "screenshots/02-email-filled.png", fullPage: true });

    // Force click the button
    await page.click('button[type="submit"]', { force: true });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "screenshots/03-after-submit.png", fullPage: true });

    // Go to Mailinator
    await page.goto("https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-prod-test");
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "screenshots/04-mailinator.png", fullPage: true });

    // Click first email row with force
    const emailRow = page.locator("tr.ng-scope").first();
    if (await emailRow.isVisible({ timeout: 10000 }).catch(() => false)) {
      await emailRow.click({ force: true });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: "screenshots/05-email-view.png", fullPage: true });

      // Get magic link from iframe
      try {
        const frame = page.frameLocator("#html_msg_body");
        const link = frame.locator("a").first();
        const href = await link.getAttribute("href", { timeout: 5000 });
        if (href && href.includes("localhost")) {
          await page.goto(href);
          await page.waitForTimeout(3000);
          await page.screenshot({ path: "screenshots/06-authenticated.png", fullPage: true });
        }
      } catch (e) {
        console.log("Could not extract magic link");
      }
    }

    // Navigate back to app
    await page.goto("http://localhost:3000");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "screenshots/07-main-app.png", fullPage: true });

    console.log("Screenshots captured!");
  });
});
