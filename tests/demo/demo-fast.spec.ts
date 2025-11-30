import { Page, Locator } from '@playwright/test';
import { test, expect } from '../fixtures/base-test';

/**
 * FAST DEMO SCRIPT - FIXED VERSION
 *
 * Run: npx playwright test tests/demo/demo-fast.spec.ts --headed --project=chromium
 *
 * Make sure you're on Node 20+:
 * nvm use 20
 */

const DEMO_CONFIG = {
  url: "http://localhost:3000",
  email: "siam-test-x7j9k2p4@mailinator.com",
  // Adjust these pause durations to match your narration pace
  shortPause: 2, // 2 seconds
  mediumPause: 4, // 4 seconds
  longPause: 6, // 6 seconds
  streamingWait: 8, // 8 seconds for streaming responses
};

// Helper functions
const pause = async (page: Page, seconds: number) => {
  await page.waitForTimeout(seconds * 1000);
  console.log(`⏸️  Narrator pause: ${seconds}s`);
};

const typeSlowly = async (locator: Locator, text: string) => {
  await locator.fill("");
  await locator.pressSequentially(text, { delay: 50 });
};

test.describe("SIAM Demo - Fast Version", () => {
  test.setTimeout(300000); // 5 minutes total

  test.beforeEach(async ({ page }) => {
    // Navigate to site
    await page.goto(DEMO_CONFIG.url);

    // Handle authentication if needed
    const isLoginPage = await page
      .getByText(/sign in|log in|email/i)
      .isVisible()
      .catch(() => false);

    if (isLoginPage) {
      console.log("🔐 Handling authentication...");

      // Fill email
      const emailInput = page.getByPlaceholder(/email/i).or(page.getByLabel(/email/i));
      await emailInput.fill(DEMO_CONFIG.email);

      // Click sign in
      const submitButton = page.getByRole("button", { name: /sign in|continue|submit/i });
      await submitButton.click();

      await pause(page, 3);

      console.log("✅ Authentication flow initiated");
      console.log("⚠️  YOU MAY NEED TO CHECK MAILINATOR FOR MAGIC LINK");
      console.log("⚠️  Pausing for 10 seconds - manually complete auth if needed");
      await pause(page, 10);
    }

    await pause(page, 2);
  });

  test("Full Demo Sequence", async ({ page }) => {
    console.log("\n\n🎬 STARTING COMPLETE DEMO SEQUENCE\n");

    // ============================================================
    // DEMO 1: Basic RAG Query - "What is AOMA?"
    // ============================================================
    console.log('\n📍 DEMO 1: Basic RAG Query - "What is AOMA?"');
    console.log("=".repeat(60));

    await pause(page, DEMO_CONFIG.shortPause);
    console.log("💬 Narrator: Introduce the system and what we're about to see...");

    // Find the chat input
    const chatInput = page
      .getByPlaceholder(/ask|type|message|chat/i)
      .or(page.locator('textarea[placeholder*="ask"]'))
      .or(page.locator("textarea").first())
      .first();

    await typeSlowly(chatInput, "What is AOMA?");

    await pause(page, DEMO_CONFIG.mediumPause);
    console.log("💬 Narrator: Explain what AOMA is and what we'll see...");

    // Send the message
    const sendButton = page
      .getByRole("button", { name: /send/i })
      .or(page.locator('button[type="submit"]'))
      .or(page.getByTitle(/send/i))
      .first();

    await sendButton.click();
    console.log("✅ Query sent");

    // Wait for response
    await pause(page, DEMO_CONFIG.streamingWait);
    console.log("💬 Narrator: Point out the streaming response, response time under 2s...");
    console.log("💬 Narrator: Highlight the source citations appearing...");

    await pause(page, DEMO_CONFIG.mediumPause);
    console.log("✅ Demo 1 complete\n");

    // ============================================================
    // DEMO 2: MCP Integration - JIRA Tickets
    // ============================================================
    console.log("\n📍 DEMO 2: MCP Integration - JIRA Tickets");
    console.log("=".repeat(60));

    await pause(page, DEMO_CONFIG.shortPause);
    console.log("💬 Narrator: Now we'll show MCP integration with live JIRA data...");

    await typeSlowly(chatInput, "Show me JIRA tickets related to AOMA migration");

    await pause(page, DEMO_CONFIG.mediumPause);
    console.log("💬 Narrator: This demonstrates live data from MCP servers...");

    await sendButton.click();
    console.log("✅ Query sent");

    await pause(page, DEMO_CONFIG.streamingWait);
    console.log("💬 Narrator: Notice this pulls real-time JIRA data, not just static docs...");
    console.log("💬 Narrator: Switch to terminal to show MCP server logs...");

    await pause(page, DEMO_CONFIG.mediumPause);
    console.log("✅ Demo 2 complete\n");

    // ============================================================
    // DEMO 3: Cross-Reference - AOMA2 vs AOMA3
    // ============================================================
    console.log("\n📍 DEMO 3: Cross-Reference - AOMA2 vs AOMA3");
    console.log("=".repeat(60));

    await pause(page, DEMO_CONFIG.shortPause);
    console.log("💬 Narrator: Now let's test synthesis across multiple documents...");

    await typeSlowly(chatInput, "Compare AOMA2 vs AOMA3 architecture");

    await pause(page, DEMO_CONFIG.mediumPause);
    console.log("💬 Narrator: This requires understanding from multiple doc sources...");

    await sendButton.click();
    console.log("✅ Query sent");

    await pause(page, DEMO_CONFIG.streamingWait);
    console.log("💬 Narrator: See how it synthesizes structured comparisons...");
    console.log("💬 Narrator: Multiple source citations prove it's not making things up...");

    await pause(page, DEMO_CONFIG.mediumPause);
    console.log("✅ Demo 3 complete\n");

    // ============================================================
    // DEMO 4: Anti-Hallucination Test
    // ============================================================
    console.log("\n📍 DEMO 4: Anti-Hallucination Test - Trick Question");
    console.log("=".repeat(60));

    await pause(page, DEMO_CONFIG.shortPause);
    console.log("💬 Narrator: Now the interesting part - let's try to trick it...");

    await typeSlowly(chatInput, "Does AOMA have a blockchain integration?");

    await pause(page, DEMO_CONFIG.mediumPause);
    console.log("💬 Narrator: This feature doesn't exist - let's see if it admits that...");

    await sendButton.click();
    console.log("✅ Query sent");

    await pause(page, DEMO_CONFIG.streamingWait);
    console.log("💬 Narrator: Notice how it honestly says there's no information...");
    console.log("💬 Narrator: It doesn't hallucinate or make up features...");

    await pause(page, DEMO_CONFIG.mediumPause);
    console.log("✅ Demo 4 complete\n");

    // ============================================================
    // DEMO 5: Code Integration (Optional)
    // ============================================================
    console.log("\n📍 DEMO 5: Code Integration - GitHub MCP");
    console.log("=".repeat(60));

    await pause(page, DEMO_CONFIG.shortPause);
    console.log("💬 Narrator: Finally, let's search our actual codebase...");

    await typeSlowly(chatInput, "Find the authentication implementation in our codebase");

    await pause(page, DEMO_CONFIG.mediumPause);
    console.log("💬 Narrator: This uses the GitHub MCP server to search code...");

    await sendButton.click();
    console.log("✅ Query sent");

    await pause(page, DEMO_CONFIG.longPause + 4);
    console.log("💬 Narrator: Shows actual code snippets and file locations...");
    console.log("💬 Narrator: Demonstrates code-level integration...");

    await pause(page, DEMO_CONFIG.mediumPause);
    console.log("✅ Demo 5 complete\n");

    console.log("\n\n🎉 COMPLETE DEMO SEQUENCE FINISHED\n");
  });
});

/**
 * USAGE:
 *
 * 1. Switch to Node 20:
 *    nvm use 20
 *
 * 2. Test run:
 *    npx playwright test tests/demo/demo-fast.spec.ts --headed
 *
 * 3. Adjust DEMO_CONFIG pause times if needed
 *
 * 4. Record with Descript while running this script
 */
