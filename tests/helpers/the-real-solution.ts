/**
 * THE REAL SOLUTION: Combining Services That Actually Work
 *
 * Fuck Mailgun's broken ass. Here's what we'll actually use:
 */

// ==========================================
// Option 1: Use Resend to SEND + Email Testing Service to RECEIVE
// ==========================================

// Use Resend for sending (it's fucking great at this)
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

// But for RECEIVING test emails from Cognito, use one of these:

// 1. Ethereal (instant, no signup, free)
import nodemailer from "nodemailer";

export async function setupEtherealInbox() {
  // Generate test account on the fly
  const testAccount = await nodemailer.createTestAccount();

  console.log("✅ Test email created:", testAccount.user);
  console.log("📧 Password:", testAccount.pass);
  console.log("🔗 View messages at: https://ethereal.email/messages");

  // Configure Cognito/SES to send here
  return {
    email: testAccount.user, // e.g., ethel.wehner@ethereal.email
    password: testAccount.pass,
    smtp: {
      host: "smtp.ethereal.email",
      port: 587,
      user: testAccount.user,
      pass: testAccount.pass,
    },
  };
}

// 2. Mailosaur (built for testing, has API)
export function setupMailosaur() {
  // Mailosaur gives you a test inbox with full API access
  // Free tier: 2 email addresses, 50 emails/month
  return {
    serverId: "your-server-id",
    serverDomain: "your-server-id.mailosaur.net",
    apiKey: process.env.MAILOSAUR_API_KEY,
    testEmail: `anything@your-server-id.mailosaur.net`,
  };
}

// 3. TestMail.app (simple, has API)
export function setupTestMail() {
  // Free tier: unlimited inboxes, 100 emails
  return {
    apiKey: process.env.TESTMAIL_API_KEY,
    namespace: "your-namespace",
    testEmail: `test.{uuid}@inbox.testmail.app`,
  };
}

// ==========================================
// Option 2: Just Mock the Whole Fucking Thing
// ==========================================

export function mockCognitoForTesting(page) {
  const MOCK_CODE = "123456";

  return page.route("**/cognito-idp.**", (route) => {
    const body = route.request().postData() || "";

    if (body.includes("ForgotPassword")) {
      console.log("🎭 Mocking Cognito: Sending magic link...");
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          CodeDeliveryDetails: {
            DeliveryMedium: "EMAIL",
            Destination: "t***@e***.com",
          },
        }),
      });
    } else if (body.includes("ConfirmForgotPassword")) {
      if (body.includes(MOCK_CODE)) {
        console.log("✅ Mocking Cognito: Code accepted!");
        route.fulfill({ status: 200, body: "{}" });
      } else {
        console.log("❌ Mocking Cognito: Wrong code!");
        route.fulfill({
          status: 400,
          body: JSON.stringify({
            __type: "CodeMismatchException",
            message: "Invalid code",
          }),
        });
      }
    } else {
      route.continue();
    }
  });
}

// ==========================================
// Option 3: Use Your Existing Resend for a Different Flow
// ==========================================

// Since you have Resend, you could bypass Cognito entirely
// and implement your own magic link system:

export async function sendMagicLinkViaResend(email: string) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Store code in your database/cache with expiry
  await storeVerificationCode(email, code);

  // Send via Resend (this part works beautifully)
  await resend.emails.send({
    from: "SIAM <noreply@your-domain.com>",
    to: email,
    subject: "Your SIAM Magic Link",
    html: `
      <h2>Your verification code</h2>
      <p>Enter this code to sign in:</p>
      <h1 style="font-size: 32px; letter-spacing: 8px;">${code}</h1>
      <p>This code expires in 10 minutes.</p>
    `,
  });

  return code;
}

// For testing, you can track sent emails via Resend webhooks
export async function setupResendWebhook() {
  // Resend will POST to your endpoint when emails are:
  // - sent, delivered, opened, clicked, bounced, complained
  // This is great for monitoring but doesn't help with
  // retrieving magic link codes from Cognito
}

// ==========================================
// THE VERDICT
// ==========================================

/**
 * For your SIAM testing needs:
 *
 * 1. SHORT TERM: Mock Cognito entirely (fastest, most reliable)
 * 2. MEDIUM TERM: Use Ethereal or TestMail for real email testing
 * 3. LONG TERM: Implement your own magic links with Resend
 *
 * Fuck Mailgun. Their shit is broken and they don't want free users.
 * Resend is great for SENDING but can't help with RECEIVING.
 *
 * Just mock it for now and ship your tests!
 */
