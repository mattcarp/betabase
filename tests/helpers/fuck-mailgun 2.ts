/**
 * FUCK MAILGUN - Alternative Testing Strategy
 *
 * Since Mailgun are being assholes, let's use alternatives
 */

// Option 1: Mock Cognito entirely for local testing
export const MOCK_MAGIC_CODE = "123456";

export function setupCognitoMocking(page) {
  return page.route("**/cognito-idp.**", (route) => {
    const body = route.request().postData();

    if (body?.includes("ForgotPassword")) {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          CodeDeliveryDetails: {
            DeliveryMedium: "EMAIL",
          },
        }),
      });
    } else if (body?.includes("ConfirmForgotPassword")) {
      // Accept our mock code
      if (body.includes(MOCK_MAGIC_CODE)) {
        route.fulfill({ status: 200, body: "{}" });
      } else {
        route.fulfill({
          status: 400,
          body: JSON.stringify({
            message: "Invalid code",
          }),
        });
      }
    } else {
      route.continue();
    }
  });
}

// Option 2: Use Ethereal (instant, free, no signup)
import nodemailer from "nodemailer";

export async function createTestInbox() {
  const account = await nodemailer.createTestAccount();
  console.log("Test email:", account.user);
  console.log("View messages at: https://ethereal.email/messages");
  return account;
}

// Option 3: Just use Mailinator like you already have
export const MAILINATOR_TEST = "siam-test-x7j9k2p4@mailinator.com";
