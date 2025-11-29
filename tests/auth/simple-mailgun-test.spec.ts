/**
 * SIMPLE MAILGUN SETUP FOR SIAM TESTING
 *
 * Fuck it, let's just use what you already have!
 */

// Step 1: Create a test email address at your sandbox domain
const TEST_EMAIL = "test@sandbox49c351db5fa3448da004612643bf99d3.mailgun.org";

// Step 2: Add this email as an authorized recipient in Mailgun dashboard
// (You'll need to verify it via email)

// Step 3: Configure your test to use this email
import { test, expect } from '../fixtures/base-test';
import axios from "axios";

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = "sandbox49c351db5fa3448da004612643bf99d3.mailgun.org";

async function getLatestEmail(toEmail: string, sinceTimestamp?: number) {
  const timestamp = sinceTimestamp || Math.floor(Date.now() / 1000) - 300; // Last 5 minutes

  // Get events from Mailgun
  const response = await axios.get(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/events`, {
    auth: {
      username: "api",
      password: MAILGUN_API_KEY,
    },
    params: {
      event: "stored",
      to: toEmail,
      begin: timestamp,
      ascending: "no",
      limit: 1,
    },
  });

  const event = response.data.items[0];
  if (!event || !event.storage) {
    return null;
  }

  // Get the actual message content
  const messageResponse = await axios.get(event.storage.url, {
    auth: {
      username: "api",
      password: MAILGUN_API_KEY,
    },
  });

  return messageResponse.data;
}

function extractMagicCode(emailBody: string): string | null {
  // Look for 6-digit code in email
  const match = emailBody.match(/\b(\d{6})\b/);
  return match ? match[1] : null;
}

test("magic link flow with Mailgun", async ({ page }) => {
  const testEmail = TEST_EMAIL;
  const startTime = Math.floor(Date.now() / 1000);

  // Request magic link
  await page.goto("http://localhost:3000");
  await page.fill('input[type="email"]', testEmail);
  await page.click('button[type="submit"]');

  // Wait for verification form
  await expect(page.locator("h2")).toContainText("Enter Magic Link Code");

  // Poll Mailgun for the email (give it up to 30 seconds)
  let email = null;
  for (let i = 0; i < 10; i++) {
    console.log(`Checking for email... (attempt ${i + 1})`);
    email = await getLatestEmail(testEmail, startTime);
    if (email) break;
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  expect(email).toBeTruthy();

  // Extract code
  const code = extractMagicCode(email["body-plain"] || email["body-html"]);
  expect(code).toMatch(/^\d{6}$/);

  console.log(`Got magic code: ${code}`);

  // Enter code
  await page.fill('input[type="text"]', code);
  await page.click('button[type="submit"]');

  // Should be logged in
  await page.waitForURL("**/dashboard/**");
});
