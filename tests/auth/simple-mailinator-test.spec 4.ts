/**
 * DEAD SIMPLE MAGIC LINK TEST
 *
 * Uses Mailinator because it just works.
 * No setup. No DNS. No webhooks. No complications.
 */

import { test, expect } from "@playwright/test";
import axios from "axios";

// Use a unique email to avoid conflicts
const TEST_EMAIL = `siam-test-${Date.now()}@mailinator.com`;
const MAILINATOR_API_KEY = "get-free-key-from-mailinator.com"; // Optional for public inbox

async function getMagicCodeFromMailinator(email: string): Promise<string | null> {
  const inbox = email.split("@")[0];

  // Mailinator public API - no key needed for public inboxes!
  const response = await axios
    .get(`https://www.mailinator.com/api/v2/domains/mailinator.com/inboxes/${inbox}`, {
      headers: {
        Accept: "application/json",
      },
    })
    .catch(() => null);

  if (!response?.data?.msgs?.[0]) {
    // Try the simpler public endpoint
    const publicUrl = `https://www.mailinator.com/v3/index.jsp?zone=public&query=${inbox}`;
    console.log(`Check manually if needed: ${publicUrl}`);
    return null;
  }

  // Get the latest message
  const messageId = response.data.msgs[0].id;
  const msgResponse = await axios.get(
    `https://www.mailinator.com/api/v2/domains/mailinator.com/inboxes/${inbox}/messages/${messageId}`
  );

  const body = msgResponse.data.body || msgResponse.data.text;
  const match = body.match(/\b(\d{6})\b/);
  return match ? match[1] : null;
}

test("simple production login with Mailinator", async ({ page }) => {
  console.log(`📧 Test email: ${TEST_EMAIL}`);
  console.log(
    `📬 Check inbox: https://www.mailinator.com/v3/index.jsp?zone=public&query=${TEST_EMAIL.split("@")[0]}`
  );

  // 1. Go to production
  await page.goto("https://thebetabase.com");

  // 2. Request magic link
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.click('button[type="submit"]');

  // 3. Wait for verification form
  await expect(page.locator("h2")).toContainText(/enter|verification|magic/i, {
    timeout: 15000,
  });

  // 4. Get code from Mailinator (poll for 30 seconds)
  let code = null;
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(3000);
    code = await getMagicCodeFromMailinator(TEST_EMAIL);
    if (code) break;
  }

  if (!code) {
    throw new Error(
      `No code found. Check: https://www.mailinator.com/v3/index.jsp?zone=public&query=${TEST_EMAIL.split("@")[0]}`
    );
  }

  // 5. Enter code and login
  await page.fill('input[type="text"]', code);
  await page.click('button[type="submit"]');

  // 6. Verify logged in
  await page.waitForURL(/\/(dashboard|chat|app)/, { timeout: 15000 });

  console.log("✅ Logged in successfully!");
});
