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

import { test, expect, Page } from "@playwright/test";

const PRODUCTION_URL = "https://thebetabase.com";

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

async function sendMessageAndGetResponse(page: Page, message: string): Promise<string> {
  const chatInput = page.locator('textarea[placeholder*="Ask"], input[placeholder*="Ask"]').first();

  await chatInput.clear();
  await chatInput.fill(message);
  await page.keyboard.press("Enter");

  // Wait for response to appear
  await page.waitForTimeout(8000); // Give AI time to respond

  // Get the last assistant message
  const messages = await page.locator('[data-role="assistant"], .assistant-message, .ai-message').all();

  if (messages.length === 0) {
    throw new Error("No assistant response found");
  }

  const lastMessage = messages[messages.length - 1];
  const responseText = await lastMessage.textContent();

  return responseText || "";
}

test.describe("Anti-Hallucination Tests", () => {
  test.setTimeout(120000); // 2 minute timeout for AI responses

  test("should NOT fabricate details about non-existent AOMA features", async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    // Wait for page load
    await page.waitForSelector('textarea[placeholder*="Ask"], input[placeholder*="Ask"]', { timeout: 15000 });

    // Ask about a feature that likely doesn't exist in knowledge base
    const response = await sendMessageAndGetResponse(
      page,
      "What's new with AOMA 3 linking and AMEBA service integration?"
    );

    console.log("AI Response:", response);

    // Check if response contains hallucination patterns
    const hallucinationDetected = HALLUCINATION_PATTERNS.some(pattern => pattern.test(response));

    // Check if response properly admits lack of knowledge
    const safeResponseDetected = SAFE_RESPONSE_PATTERNS.some(pattern => pattern.test(response));

    if (hallucinationDetected) {
      // Log which pattern was detected
      const detectedPatterns = HALLUCINATION_PATTERNS.filter(p => p.test(response));
      console.error("HALLUCINATION DETECTED! Patterns found:", detectedPatterns.map(p => p.toString()));

      expect(hallucinationDetected,
        `AI fabricated specific details instead of admitting lack of knowledge. Response: ${response}`
      ).toBe(false);
    }

    // Response should either have safe admission OR no hallucination indicators
    expect(
      safeResponseDetected || !hallucinationDetected,
      `AI should admit lack of knowledge or not fabricate details. Got: ${response}`
    ).toBe(true);
  });

  test("should detect invented version numbers", async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForSelector('textarea[placeholder*="Ask"], input[placeholder*="Ask"]', { timeout: 15000 });

    const response = await sendMessageAndGetResponse(
      page,
      "Tell me about the new features in AOMA 3.0"
    );

    console.log("Version query response:", response);

    // Should NOT contain specific version assertions if not in knowledge base
    const versionPattern = /AOMA\s+3\.0.*features/i;
    const inventedVersion = versionPattern.test(response);

    const admitsIgnorance = SAFE_RESPONSE_PATTERNS.some(p => p.test(response));

    if (inventedVersion && !admitsIgnorance) {
      expect(false,
        `AI invented details about AOMA 3.0 instead of saying it doesn't know. Response: ${response}`
      ).toBe(true);
    }
  });

  test("should detect fabricated feature lists", async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForSelector('textarea[placeholder*="Ask"], input[placeholder*="Ask"]', { timeout: 15000 });

    const response = await sendMessageAndGetResponse(
      page,
      "List all the new AMEBA integration features"
    );

    console.log("Feature list response:", response);

    // Check for detailed numbered lists (common hallucination pattern)
    const hasDetailedList = /1\.\s+\w+.*\n\s*2\.\s+\w+.*\n\s*3\./s.test(response);
    const hasAMEBADetails = /AMEBA/i.test(response) && /integration|service|feature/i.test(response);
    const admitsIgnorance = SAFE_RESPONSE_PATTERNS.some(p => p.test(response));

    if (hasDetailedList && hasAMEBADetails && !admitsIgnorance) {
      expect(false,
        `AI created detailed list about AMEBA features instead of admitting lack of knowledge. Response: ${response}`
      ).toBe(true);
    }
  });

  test("should handle legitimate questions without false positives", async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForSelector('textarea[placeholder*="Ask"], input[placeholder*="Ask"]', { timeout: 15000 });

    // Generic question that should work even with limited knowledge base
    const response = await sendMessageAndGetResponse(
      page,
      "How do I use AOMA?"
    );

    console.log("Generic question response:", response);

    // Should get SOME response (either from knowledge base or admission)
    expect(response.length).toBeGreaterThan(20);

    // Response should be coherent (not error message)
    expect(response.toLowerCase()).not.toContain("error");
    expect(response.toLowerCase()).not.toContain("failed");
  });
});
