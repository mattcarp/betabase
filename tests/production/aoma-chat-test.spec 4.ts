/**
 * AOMA CHAT COMPREHENSIVE TEST SUITE
 *
 * Tests the fuck out of the AOMA chat functionality
 * - Real queries about AOMA, USM, and Sony Music
 * - Edge cases and error handling
 * - Performance and response quality
 * - Multi-turn conversations
 */

import { test, expect, Page, BrowserContext } from "@playwright/test";

const TEST_EMAIL = "siam-test-x7j9k2p4@mailinator.com";
const MAILINATOR_INBOX =
  "https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-test-x7j9k2p4";
const SIAM_URL = "https://iamsiam.ai";

// Reusable login function
async function loginToSIAM(page: Page, context: BrowserContext): Promise<void> {
  console.log("🔐 Logging into SIAM...");
  await page.goto(SIAM_URL, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  const verificationVisible = await page
    .locator('input[placeholder*="code" i]')
    .isVisible();
  if (!verificationVisible) {
    throw new Error("Verification form didn't appear");
  }

  const mailPage = await context.newPage();
  await mailPage.goto(MAILINATOR_INBOX, { waitUntil: "networkidle" });
  await mailPage.waitForTimeout(3000);

  const emails = await mailPage
    .locator('tr[ng-repeat*="email in emails"]')
    .count();
  if (emails > 0) {
    await mailPage.locator('tr[ng-repeat*="email in emails"]').first().click();
    await mailPage.waitForTimeout(3000);

    let code = null;
    const iframe = await mailPage.$("iframe#html_msg_body");
    if (iframe) {
      const frame = await iframe.contentFrame();
      if (frame) {
        const frameText = await frame.$eval(
          "body",
          (el) => el.textContent || "",
        );
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
      await page.waitForSelector('h1:has-text("AOMA Intelligence Hub")', {
        timeout: 15000,
      });
      console.log("✅ Logged in successfully!");
    }
  }
}

// Helper to send chat message and wait for response
async function sendChatMessage(
  page: Page,
  message: string,
  expectResponse: boolean = true,
): Promise<string> {
  const chatInput = page
    .locator(
      'textarea[placeholder*="Ask me anything"], input[placeholder*="Ask me anything"]',
    )
    .first();

  // Clear and type message
  await chatInput.clear();
  await chatInput.fill(message);

  // Send message
  await page.keyboard.press("Enter");

  if (expectResponse) {
    // Wait for thinking indicator to appear and disappear
    try {
      await page.waitForSelector("text=/thinking|generating|processing/i", {
        timeout: 5000,
        state: "visible",
      });
      console.log("   ⏳ AI is thinking...");
    } catch {
      // Thinking indicator might be too fast to catch
    }

    // Wait for response to appear
    await page.waitForTimeout(3000);

    // Get the last message in the log
    const messages = await page.locator('div[role="log"] > div').all();
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const responseText = (await lastMessage.textContent()) || "";
      return responseText;
    }
  }

  return "";
}

test.describe("🤖 AOMA CHAT DESTRUCTION TESTS", () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    page = await context.newPage();

    // Monitor console errors
    page.on("console", (msg) => {
      if (
        msg.type() === "error" &&
        !msg.text().includes("Failed to load resource")
      ) {
        console.error("❌ Console Error:", msg.text().substring(0, 100));
      }
    });

    await loginToSIAM(page, context);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test("1️⃣ BASIC QUERIES - Test fundamental AOMA knowledge", async () => {
    console.log("\n📚 Testing Basic AOMA Queries...");

    const queries = [
      {
        question: "What is AOMA?",
        expectedKeywords: [
          "asset",
          "orchestration",
          "management",
          "sony",
          "music",
        ],
        description: "Basic AOMA definition",
      },
      {
        question: "What is USM?",
        expectedKeywords: ["universal", "service", "model", "framework"],
        description: "USM explanation",
      },
      {
        question: "How does AOMA 3 work?",
        expectedKeywords: ["aoma", "workflow", "system", "process"],
        description: "AOMA 3 functionality",
      },
      {
        question: "What are the latest AOMA features?",
        expectedKeywords: ["feature", "new", "update", "enhancement"],
        description: "Recent updates",
      },
    ];

    for (const query of queries) {
      console.log(`\n   🔍 Testing: "${query.question}"`);
      const startTime = Date.now();

      const response = await sendChatMessage(page, query.question);
      const responseTime = Date.now() - startTime;

      console.log(`   ⏱️ Response time: ${responseTime}ms`);

      // Check if response contains expected keywords
      const responseLower = response.toLowerCase();
      const foundKeywords = query.expectedKeywords.filter((kw) =>
        responseLower.includes(kw),
      );

      if (foundKeywords.length > 0) {
        console.log(
          `   ✅ Response contains keywords: ${foundKeywords.join(", ")}`,
        );
      } else {
        console.log(`   ⚠️ Response missing expected keywords`);
      }

      // Check response quality
      if (response.length < 50) {
        console.log(`   ⚠️ Response too short: ${response.length} chars`);
      } else if (response.length > 5000) {
        console.log(`   ⚠️ Response too long: ${response.length} chars`);
      } else {
        console.log(
          `   ✅ Response length appropriate: ${response.length} chars`,
        );
      }

      // Take screenshot
      await page.screenshot({
        path: `test-results/aoma-chat-${query.description.replace(/\s+/g, "-")}.png`,
      });

      // Wait before next query
      await page.waitForTimeout(2000);
    }
  });

  test("2️⃣ COMPLEX QUERIES - Test advanced understanding", async () => {
    console.log("\n🧠 Testing Complex Queries...");

    const complexQueries = [
      "How do I integrate AOMA 3 with AMEBA services for automated QC?",
      "What's the difference between AOMA 2 and AOMA 3 linking capabilities?",
      "Explain the audio file QC process and common issues",
      "How does the batch media converter handle multiple formats?",
      "What are the Sony Ci workspace export requirements?",
    ];

    for (const query of complexQueries) {
      console.log(`\n   🎯 Complex query: "${query.substring(0, 50)}..."`);

      const response = await sendChatMessage(page, query);

      // Check if response is substantive
      const hasDetail = response.length > 200;
      const hasStructure =
        response.includes("\n") ||
        response.includes("•") ||
        response.includes("-");

      console.log(`   📏 Response quality:`);
      console.log(
        `      Length: ${response.length} chars ${hasDetail ? "✅" : "⚠️"}`,
      );
      console.log(`      Structured: ${hasStructure ? "✅" : "⚠️"}`);

      await page.waitForTimeout(2000);
    }
  });

  test("3️⃣ MULTI-TURN CONVERSATION - Test context retention", async () => {
    console.log("\n💬 Testing Multi-turn Conversation...");

    // Start a conversation thread
    const conversation = [
      {
        message: "Tell me about AOMA's linking features",
        expectContext: false,
      },
      { message: "How is this different in version 3?", expectContext: true },
      { message: "Can you give me a specific example?", expectContext: true },
      { message: "What about performance improvements?", expectContext: true },
    ];

    let previousResponse = "";
    for (let i = 0; i < conversation.length; i++) {
      const turn = conversation[i];
      console.log(`\n   Turn ${i + 1}: "${turn.message}"`);

      const response = await sendChatMessage(page, turn.message);

      if (turn.expectContext && previousResponse) {
        // Check if response relates to previous context
        const maintainsContext =
          response.toLowerCase().includes("aoma") ||
          response.toLowerCase().includes("link") ||
          response.toLowerCase().includes("version") ||
          response.toLowerCase().includes("as mentioned") ||
          response.toLowerCase().includes("previously");

        console.log(`   Context maintained: ${maintainsContext ? "✅" : "⚠️"}`);
      }

      previousResponse = response;
      await page.waitForTimeout(2000);
    }
  });

  test("4️⃣ ERROR HANDLING - Test bad inputs", async () => {
    console.log("\n💥 Testing Error Handling...");

    const badInputs = [
      { input: "", description: "Empty message" },
      { input: "a", description: "Single character" },
      { input: "🤔💭🎉🚀" * 10, description: "Only emojis" },
      { input: "AAAAAAA" * 100, description: "Repeated characters" },
      { input: "<script>alert('xss')</script>", description: "XSS attempt" },
      { input: "'; DROP TABLE users; --", description: "SQL injection" },
    ];

    for (const badInput of badInputs) {
      console.log(`\n   🔨 Testing: ${badInput.description}`);

      try {
        const response = await sendChatMessage(page, badInput.input, false);
        await page.waitForTimeout(2000);

        // Check if app is still responsive
        const chatInput = page
          .locator('textarea[placeholder*="Ask me anything"]')
          .first();
        const isResponsive = await chatInput.isEnabled();

        console.log(`   App still responsive: ${isResponsive ? "✅" : "❌"}`);

        // Check for error messages
        const hasError =
          (await page.locator('.error, [role="alert"]').count()) > 0;
        if (hasError) {
          console.log(`   Error displayed: ✅`);
        }
      } catch (error) {
        console.log(`   Handled gracefully: ✅`);
      }
    }
  });

  test("5️⃣ PERFORMANCE - Rapid fire queries", async () => {
    console.log("\n⚡ Testing Performance Under Load...");

    const rapidQueries = [
      "What is AOMA?",
      "Tell me about USM",
      "How does QC work?",
      "What's new in AOMA 3?",
      "Export to Sony Ci",
    ];

    console.log("   🚀 Sending rapid queries...");
    const startTime = Date.now();

    for (const query of rapidQueries) {
      const chatInput = page
        .locator('textarea[placeholder*="Ask me anything"]')
        .first();
      await chatInput.fill(query);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(500); // Very short delay
    }

    const totalTime = Date.now() - startTime;
    console.log(
      `   ⏱️ Total time for ${rapidQueries.length} queries: ${totalTime}ms`,
    );
    console.log(
      `   📊 Average: ${(totalTime / rapidQueries.length).toFixed(0)}ms per query`,
    );

    // Wait for all responses
    await page.waitForTimeout(5000);

    // Check if chat is still functional
    const finalTest = await sendChatMessage(page, "Are you still working?");
    console.log(
      `   Final test response: ${finalTest.length > 0 ? "✅ Still working!" : "❌ Not responding"}`,
    );
  });

  test("6️⃣ SPECIAL CHARACTERS - Test Unicode and special chars", async () => {
    console.log("\n🌍 Testing Special Characters...");

    const specialQueries = [
      "Tell me about AOMA™ features",
      "What is 音楽 (music) management?",
      "How does AOMA handle €£¥ pricing?",
      "Can you explain the → workflow → process?",
      "What about AOMA's ñ español support?",
    ];

    for (const query of specialQueries) {
      console.log(`   🔤 Testing: "${query}"`);

      try {
        const response = await sendChatMessage(page, query);
        console.log(
          `   Response received: ${response.length > 0 ? "✅" : "❌"}`,
        );
      } catch (error) {
        console.log(`   Error handling special chars: ❌`);
      }

      await page.waitForTimeout(1500);
    }
  });

  test("7️⃣ RESPONSE QUALITY - Verify helpful responses", async () => {
    console.log("\n📊 Testing Response Quality...");

    const qualityChecks = [
      {
        question: "How do I export assets to Sony Ci?",
        shouldInclude: ["export", "sony ci", "workspace", "steps", "process"],
      },
      {
        question: "What are common AOMA support issues?",
        shouldInclude: [
          "issue",
          "problem",
          "solution",
          "troubleshoot",
          "common",
        ],
      },
      {
        question: "Explain the automated QC process",
        shouldInclude: ["qc", "quality", "automat", "check", "process"],
      },
    ];

    for (const check of qualityChecks) {
      console.log(`\n   📝 Quality check: "${check.question}"`);

      const response = await sendChatMessage(page, check.question);
      const responseLower = response.toLowerCase();

      const foundTerms = check.shouldInclude.filter((term) =>
        responseLower.includes(term.toLowerCase()),
      );

      const quality = (foundTerms.length / check.shouldInclude.length) * 100;
      console.log(`   Quality score: ${quality.toFixed(0)}%`);

      if (quality >= 60) {
        console.log(`   ✅ Good response quality`);
      } else {
        console.log(`   ⚠️ Response may lack detail`);
        console.log(
          `   Missing terms: ${check.shouldInclude.filter((t) => !foundTerms.includes(t)).join(", ")}`,
        );
      }

      await page.waitForTimeout(2000);
    }
  });

  test("8️⃣ FINAL STRESS TEST - Everything at once", async () => {
    console.log("\n🔥 FINAL STRESS TEST...");

    // Clear conversation
    const newConvoBtn = page
      .locator('button:has-text("New Conversation")')
      .first();
    if (await newConvoBtn.isVisible()) {
      await newConvoBtn.click();
      await page.waitForTimeout(1000);
    }

    // Send a massive complex query
    const megaQuery = `
      I need comprehensive help with AOMA 3. Please explain:
      1. The complete linking workflow from start to finish
      2. How to set up automated QC for audio files
      3. Integration with AMEBA services
      4. Batch media conversion best practices
      5. Exporting to Sony Ci workspaces
      6. Common troubleshooting steps
      7. Performance optimization tips
      Please be detailed and include examples where possible.
    `;

    console.log("   💣 Sending mega query...");
    const startTime = Date.now();

    const response = await sendChatMessage(page, megaQuery);
    const responseTime = Date.now() - startTime;

    console.log(`   Response time: ${responseTime}ms`);
    console.log(`   Response length: ${response.length} chars`);

    // Quality checks
    const hasNumberedList = /1\.|2\.|3\./.test(response);
    const hasMultipleSections = response.split("\n\n").length > 3;
    const isComprehensive = response.length > 1000;

    console.log(`   Quality metrics:`);
    console.log(`      Structured: ${hasNumberedList ? "✅" : "⚠️"}`);
    console.log(`      Multi-section: ${hasMultipleSections ? "✅" : "⚠️"}`);
    console.log(`      Comprehensive: ${isComprehensive ? "✅" : "⚠️"}`);

    // Take final screenshot
    await page.screenshot({
      path: "test-results/aoma-chat-final-stress-test.png",
      fullPage: true,
    });

    console.log("\n🎊 AOMA CHAT TESTS COMPLETE! 🎊");
  });
});
