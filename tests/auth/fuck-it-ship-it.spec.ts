import { test, expect } from '../fixtures/base-test';

/**
 * FUCK IT, WE'LL DO IT LIVE!
 *
 * The simplest magic link test that actually works.
 * No Mailgun bullshit. No complex email APIs. Just testing.
 */

const MOCK_MAGIC_CODE = "424242"; // The answer to everything

test.describe("Magic Link Auth - Pragmatic Edition", () => {
  test("just fucking test the magic link flow", async ({ page }) => {
    console.log("🚀 Starting the simplest test that could possibly work");

    // Mock Cognito because who needs real emails for testing?
    await page.route("**/cognito-idp.**", async (route) => {
      const body = route.request().postData() || "";

      if (body.includes("ForgotPassword")) {
        // User requested magic link
        console.log("📧 Mocking: Magic link 'sent'");
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            CodeDeliveryDetails: {
              DeliveryMedium: "EMAIL",
              Destination: "test@*****.com",
            },
          }),
        });
      } else if (body.includes("ConfirmForgotPassword")) {
        // User is trying to verify code
        if (body.includes(MOCK_MAGIC_CODE)) {
          console.log("✅ Mocking: Code verified!");
          await route.fulfill({
            status: 200,
            body: JSON.stringify({}),
          });
        } else {
          console.log("❌ Mocking: Wrong code");
          await route.fulfill({
            status: 400,
            body: JSON.stringify({
              __type: "CodeMismatchException",
              message: "Invalid verification code",
            }),
          });
        }
      } else {
        await route.continue();
      }
    });

    // Now run the actual test
    await page.goto("http://localhost:3000");

    // Enter email (any email works since we're mocking)
    await page.fill('input[type="email"]', "test@sonymusic.com");
    await page.click('button:has-text("Send Magic Link")');

    // Should show verification form
    await expect(page.locator("h2")).toContainText("Enter Magic Link Code");

    // Enter our mock code
    await page.fill('input[type="text"]', MOCK_MAGIC_CODE);
    await page.click('button:has-text("Verify")');

    // Should be logged in
    await expect(page).toHaveURL(/.*dashboard.*/);

    console.log("🎉 Test passed! Who needs Mailgun anyway?");
  });

  test("test wrong code handling", async ({ page }) => {
    // Same mock setup
    await page.route("**/cognito-idp.**", async (route) => {
      const body = route.request().postData() || "";

      if (body.includes("ForgotPassword")) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            CodeDeliveryDetails: { DeliveryMedium: "EMAIL" },
          }),
        });
      } else if (body.includes("ConfirmForgotPassword")) {
        // Always reject to test error handling
        await route.fulfill({
          status: 400,
          body: JSON.stringify({
            __type: "CodeMismatchException",
            message: "Invalid verification code",
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("http://localhost:3000");
    await page.fill('input[type="email"]', "test@sonymusic.com");
    await page.click('button:has-text("Send Magic Link")');

    // Enter wrong code
    await page.fill('input[type="text"]', "999999");
    await page.click('button:has-text("Verify")');

    // Should show error
    await expect(page.locator("text=/invalid|incorrect|wrong/i")).toBeVisible();

    console.log("✅ Error handling works!");
  });
});

console.log(`
========================================
💡 PRO TIP: This test mocks Cognito entirely.
   
   Why? Because:
   - Mailgun is broken shit
   - Resend can't receive emails
   - Real email testing is slow
   - Mocking is fast and reliable
   
   For production, implement proper email testing.
   For today? Ship this and move on!
========================================
`);
