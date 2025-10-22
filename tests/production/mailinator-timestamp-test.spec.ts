import { test, expect } from "@playwright/test";

test.describe("Production Mailinator Test with Timestamp Check", () => {
  const PROD_URL = "https://thebetabase.com";
  const TEST_EMAIL = "siam-test-x7j9k2p4@mailinator.com";

  test("Check build timestamp and test Mailinator auth", async ({ page, context }) => {
    console.log("🔍 Testing production deployment at thebetabase.com...\n");

    // Navigate to production
    await page.goto(PROD_URL, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Take screenshot of login page
    await page.screenshot({
      path: "test-results/production-login-page.png",
      fullPage: true,
    });

    // Look for build timestamp
    const timestampElement = await page
      .locator("text=/Built.*GMT/i, text=/v[0-9]+\.[0-9]+\.[0-9]+.*Built/i")
      .first();

    if (await timestampElement.isVisible()) {
      const timestampText = await timestampElement.textContent();
      console.log("📅 Build Timestamp Found:", timestampText);

      // Parse the date if possible
      if (timestampText) {
        const dateMatch = timestampText.match(/Built\s+([^,]+)/);
        if (dateMatch) {
          console.log("   Build Date:", dateMatch[1]);
        }

        const versionMatch = timestampText.match(/v([0-9]+\.[0-9]+\.[0-9]+)/);
        if (versionMatch) {
          console.log("   Version:", versionMatch[1]);
        }
      }
    } else {
      console.log("⚠️  No timestamp visible on login page");
    }

    console.log("\n📧 Testing Mailinator Authentication Flow...\n");

    // Check for login form
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    console.log("✅ Login form is visible");

    // Fill in Mailinator test email
    await page.fill('input[type="email"]', TEST_EMAIL);
    console.log(`✅ Entered test email: ${TEST_EMAIL}`);

    // Click send magic link
    await page.click('button:has-text("Send Magic Link")');
    console.log('✅ Clicked "Send Magic Link" button');

    // Wait for response
    await page.waitForTimeout(3000);

    // Check for success message or error
    const successMessage = page.locator(
      "text=/check your email/i, text=/magic link sent/i, text=/email sent/i"
    );
    const errorMessage = page.locator("text=/error/i, text=/failed/i, text=/invalid/i");

    if (await successMessage.isVisible()) {
      const messageText = await successMessage.textContent();
      console.log("✅ Magic link sent successfully!");
      console.log("   Message:", messageText);

      // Open Mailinator in new tab
      const mailPage = await context.newPage();
      const mailinatorUrl = `https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-test-x7j9k2p4`;

      console.log("\n📬 Checking Mailinator inbox...");
      console.log(`   URL: ${mailinatorUrl}`);

      await mailPage.goto(mailinatorUrl, { waitUntil: "networkidle" });
      await mailPage.waitForTimeout(3000);

      // Take screenshot of Mailinator inbox
      await mailPage.screenshot({
        path: "test-results/mailinator-inbox.png",
        fullPage: true,
      });

      // Look for recent emails
      const emailRows = await mailPage.locator('tr[ng-repeat*="email"]').count();
      console.log(`   Found ${emailRows} email(s) in inbox`);

      if (emailRows > 0) {
        // Click on the most recent email
        await mailPage.locator('tr[ng-repeat*="email"]').first().click();
        await mailPage.waitForTimeout(2000);

        console.log("✅ Opened most recent email");

        // Look for magic link
        const magicLinkFrame = mailPage.frameLocator("#html_msg_body");
        const links = await magicLinkFrame
          .locator('a[href*="magic"], a[href*="verify"], a[href*="confirm"]')
          .count();

        if (links > 0) {
          console.log(`✅ Found ${links} magic link(s) in email`);
        } else {
          console.log("⚠️  No magic links found in email body");
        }
      }

      await mailPage.close();
    } else if (await errorMessage.isVisible()) {
      const errorText = await errorMessage.textContent();
      console.log("❌ Error sending magic link:", errorText);
    } else {
      console.log("⚠️  No clear success or error message displayed");
    }

    // Check console for errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(
      (error) =>
        !error.includes("Failed to load resource") &&
        !error.includes("ResizeObserver") &&
        !error.includes("Non-Error promise rejection")
    );

    if (criticalErrors.length > 0) {
      console.log("\n⚠️  Console errors found:", criticalErrors);
    } else {
      console.log("\n✅ No critical console errors");
    }

    console.log("\n📊 Test Summary:");
    console.log("- Production URL: thebetabase.com");
    console.log("- Test Email: siam-test-x7j9k2p4@mailinator.com");
    console.log(
      "- Mailinator Inbox: https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-test-x7j9k2p4"
    );
  });
});
