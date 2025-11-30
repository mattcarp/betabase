/**
 * ANTI-HALLUCINATION TEST SUITE
 *
 * Tests that the AI does NOT fabricate information when knowledge base lacks data.
 * This test does NOT know what the "correct" answer is - it only detects hallucination patterns.
 *
 * Hallucination indicators:
 * - Inventing specific version numbers (e.g., "AOMA 3", "v2.5")
 * - Creating fake feature names not in the context
 * - Making up specific dates or timelines
 * - Listing detailed steps for non-existent features
 * - Confident assertions about things not in knowledge base
 */

import { Page, BrowserContext } from '@playwright/test';
import { test, expect } from '../fixtures/base-test';

const PRODUCTION_URL = "http://localhost:3000";
const TEST_EMAIL = "siam-test-x7j9k2p4@mailinator.com";
const MAILINATOR_INBOX = "https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-test-x7j9k2p4";

// Patterns that indicate hallucination (making up specific details)
const HALLUCINATION_PATTERNS = [
  // Version numbers that don't exist
  /AOMA\s+[0-9]+/i, // "AOMA 3", "AOMA 2.5"
  /version\s+[0-9]+\.[0-9]+/i, // "version 2.5"
  /v[0-9]+\.[0-9]+/i, // "v3.0"

  // Specific fake feature names
  /AMEBA\s+service/i,
  /linking\s+service/i,

  // Detailed numbered lists (hallucination often includes confident step-by-step guides)
  /1\.\s+[A-Z][a-z]+.*\n\s*2\.\s+[A-Z][a-z]+.*\n\s*3\./s, // Numbered list with 3+ items

  // Confident assertions about specific technical details
  /consolidated\s+linker\s+service/i,
  /audit\s+trails\s+and\s+conflict-resolution/i,
  /safer\s+reprocessing\/backfill/i,
  /event-driven\s+enrichment\s+flow/i,

  // Dates and timelines that weren't provided
  /released\s+in\s+(January|February|March|April|May|June|July|August|September|October|November|December)/i,
  /coming\s+in\s+Q[1-4]/i,
];

// Safe responses that indicate proper behavior
const SAFE_RESPONSE_PATTERNS = [
  /I don't have that information/i,
  /knowledge base.*unavailable/i,
  /not available in.*context/i,
  /cannot find.*in.*knowledge base/i,
  /AOMA.*may be unavailable/i,
  /contact matt@mattcarpenter\.com/i,
];

// Reusable login function
async function loginToSIAM(page: Page, context: BrowserContext): Promise<void> {
  console.log("🔐 Logging into SIAM...");
  await page.goto(PRODUCTION_URL, { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.click('button[type="submit"]');

  // Wait for success dialog to appear (Magic Link Sent!)
  console.log("⏳ Waiting for magic link success dialog...");
  await page.waitForSelector("text=/Magic Link Sent/i", { timeout: 15000 });

  // Wait a bit for dialog to auto-dismiss and verification input to appear
  await page.waitForTimeout(2000);

  // Now wait for verification code input to be visible
  console.log("⏳ Waiting for verification code input...");
  const verificationVisible = await page
    .locator('input[type="text"]')
    .first()
    .isVisible({ timeout: 10000 })
    .catch(() => false);
  if (!verificationVisible) {
    throw new Error("Verification form didn't appear");
  }

  const mailPage = await context.newPage();
  await mailPage.goto(MAILINATOR_INBOX, { waitUntil: "networkidle" });
  await mailPage.waitForTimeout(3000);

  const emails = await mailPage.locator('tr[ng-repeat*="email in emails"]').count();
  if (emails > 0) {
    await mailPage.locator('tr[ng-repeat*="email in emails"]').first().click();
    await mailPage.waitForTimeout(3000);

    let code = null;
    const iframe = await mailPage.$("iframe#html_msg_body");
    if (iframe) {
      const frame = await iframe.contentFrame();
      if (frame) {
        const frameText = await frame.$eval("body", (el) => el.textContent || "");
        const match = frameText.match(/\b(\d{6})\b/);
        if (match) code = match[1];
      }
    }

    if (!code) {
      const pageText = await mailPage.content();
      const match = pageText.match(/\b(\d{6})\b/);
      if (match) code = match[1];
    }

    await mailPage.close();

    if (code) {
      await page.fill('input[type="text"]', code);
      await page.click('button[type="submit"]');
      await page.waitForSelector(
        'h1:has-text("Welcome to The Betabase"), textarea[placeholder*="Ask"]',
        {
          timeout: 15000,
        }
      );
      console.log("✅ Logged in successfully!");
    }
  }
}

async function sendMessageAndGetResponse(page: Page, message: string): Promise<string> {
  const chatInput = page.locator('textarea[placeholder*="Ask"], input[placeholder*="Ask"]').first();

  await chatInput.clear();
  await chatInput.fill(message);

  // Count messages before sending
  const messageCountBefore = await page.locator('div[role="log"] > div').count();
  console.log(`   📊 Messages before: ${messageCountBefore}`);

  await page.keyboard.press("Enter");

  // Wait for processing indicator
  try {
    await page.waitForSelector("text=/processing|thinking|generating/i", {
      timeout: 5000,
      state: "visible",
    });
    console.log("   ⏳ AI is thinking...");
  } catch {
    // Processing might be too fast
  }

  // Wait for a new message to appear (AI response) - AOMA can take up to 90 seconds
  console.log("   ⏳ Waiting for AI response (up to 90s)...");
  try {
    await page.waitForFunction(
      (expectedCount) => {
        const messages = document.querySelectorAll('div[role="log"] > div');
        return messages.length > expectedCount;
      },
      messageCountBefore,
      { timeout: 90000 }
    );
    console.log("   ✅ Response received!");
  } catch (e) {
    console.log("   ⚠️ Response timeout after 90s");
    throw new Error("AI did not respond within 90 seconds");
  }

  // Wait for DOM to settle
  await page.waitForTimeout(3000);

  // Get all assistant messages
  const assistantMessages = await page
    .locator('[data-role="assistant"], .assistant-message, div[role="log"] > div')
    .all();

  if (assistantMessages.length === 0) {
    throw new Error("No assistant response found after waiting");
  }

  const lastMessage = assistantMessages[assistantMessages.length - 1];
  const responseText = (await lastMessage.textContent()) || "";

  // Clean up the response (remove timestamps, loading indicators)
  const cleanedResponse = responseText
    .replace(/🤖.*?(?=\n|$)/g, "")
    .replace(/\d{2}:\d{2} (AM|PM)/g, "")
    .replace(/Establishing secure connection.*?(?=\n|$)/g, "")
    .replace(/Parsing request.*?(?=\n|$)/g, "")
    .replace(/Searching AOMA.*?(?=\n|$)/g, "")
    .replace(/Building context.*?(?=\n|$)/g, "")
    .replace(/Generating AI.*?(?=\n|$)/g, "")
    .replace(/Formatting response.*?(?=\n|$)/g, "")
    .replace(/\s+/g, " ")
    .trim();

  console.log(`   💬 Response length: ${cleanedResponse.length} chars`);
  return cleanedResponse || responseText;
}

test.describe("Anti-Hallucination Tests", () => {
  test.setTimeout(180000); // 3 minute timeout for AI responses + login

  let context: BrowserContext;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test("should NOT fabricate details about non-existent AOMA features", async () => {
    const page = await context.newPage();

    // Login first
    await loginToSIAM(page, context);

    // Ask about a feature that likely doesn't exist in knowledge base
    const response = await sendMessageAndGetResponse(
      page,
      "What's new with AOMA 3 linking and AMEBA service integration?"
    );

    console.log("AI Response:", response);

    // Check if response contains hallucination patterns
    const hallucinationDetected = HALLUCINATION_PATTERNS.some((pattern) => pattern.test(response));

    // Check if response properly admits lack of knowledge
    const safeResponseDetected = SAFE_RESPONSE_PATTERNS.some((pattern) => pattern.test(response));

    if (hallucinationDetected) {
      // Log which pattern was detected
      const detectedPatterns = HALLUCINATION_PATTERNS.filter((p) => p.test(response));
      console.error(
        "HALLUCINATION DETECTED! Patterns found:",
        detectedPatterns.map((p) => p.toString())
      );

      expect(
        hallucinationDetected,
        `AI fabricated specific details instead of admitting lack of knowledge. Response: ${response}`
      ).toBe(false);
    }

    // Response should either have safe admission OR no hallucination indicators
    expect(
      safeResponseDetected || !hallucinationDetected,
      `AI should admit lack of knowledge or not fabricate details. Got: ${response}`
    ).toBe(true);
  });

  test("should detect invented version numbers", async () => {
    const page = await context.newPage();
    await loginToSIAM(page, context);

    const response = await sendMessageAndGetResponse(
      page,
      "Tell me about the new features in AOMA 3.0"
    );

    console.log("Version query response:", response);

    // Should NOT contain specific version assertions if not in knowledge base
    const versionPattern = /AOMA\s+3\.0.*features/i;
    const inventedVersion = versionPattern.test(response);

    const admitsIgnorance = SAFE_RESPONSE_PATTERNS.some((p) => p.test(response));

    if (inventedVersion && !admitsIgnorance) {
      expect(
        false,
        `AI invented details about AOMA 3.0 instead of saying it doesn't know. Response: ${response}`
      ).toBe(true);
    }
  });

  test("should detect fabricated feature lists", async () => {
    const page = await context.newPage();
    await loginToSIAM(page, context);

    const response = await sendMessageAndGetResponse(
      page,
      "List all the new AMEBA integration features"
    );

    console.log("Feature list response:", response);

    // Check for detailed numbered lists (common hallucination pattern)
    const hasDetailedList = /1\.\s+\w+.*\n\s*2\.\s+\w+.*\n\s*3\./s.test(response);
    const hasAMEBADetails =
      /AMEBA/i.test(response) && /integration|service|feature/i.test(response);
    const admitsIgnorance = SAFE_RESPONSE_PATTERNS.some((p) => p.test(response));

    if (hasDetailedList && hasAMEBADetails && !admitsIgnorance) {
      expect(
        false,
        `AI created detailed list about AMEBA features instead of admitting lack of knowledge. Response: ${response}`
      ).toBe(true);
    }
  });

  test("should handle legitimate questions without false positives", async () => {
    const page = await context.newPage();
    await loginToSIAM(page, context);

    // Generic question that should work even with limited knowledge base
    const response = await sendMessageAndGetResponse(page, "How do I use AOMA?");

    console.log("Generic question response:", response);

    // Should get SOME response (either from knowledge base or admission)
    expect(response.length).toBeGreaterThan(20);

    // Response should be coherent (not error message)
    expect(response.toLowerCase()).not.toContain("error");
    expect(response.toLowerCase()).not.toContain("failed");
  });
});
