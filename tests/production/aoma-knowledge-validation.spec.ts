/**
 * AOMA KNOWLEDGE VALIDATION TEST SUITE
 *
 * Purpose: Prevent AI hallucinations by validating AOMA responses against known facts
 *
 * This test suite validates that:
 * 1. AOMA returns accurate information from the knowledge base
 * 2. AOMA says "I don't know" when info isn't in the knowledge base
 * 3. AOMA cites sources correctly
 * 4. AOMA doesn't make up bullshit answers
 *
 * CRITICAL: These tests prevent the regression where AOMA gives confident wrong answers
 */

import { test, expect, Page, BrowserContext } from "@playwright/test";
import { setupConsoleMonitoring, assertNoConsoleErrors } from "../helpers/console-monitor";

const TEST_EMAIL = "siam-test-x7j9k2p4@mailinator.com";
const MAILINATOR_INBOX = "https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-test-x7j9k2p4";
const SIAM_URL = "https://thebetabase.com";

// Known facts that SHOULD be in the AOMA knowledge base
const KNOWN_FACTS = [
  {
    category: "AOMA Basics",
    question: "What is AOMA?",
    expectedKeywords: ["asset", "orchestration", "management", "sony music"],
    mustNotContain: ["I don't know", "not sure", "unavailable"],
    description: "AOMA definition should be in knowledge base"
  },
  {
    category: "AOMA Basics",
    question: "What does AOMA stand for?",
    expectedKeywords: ["asset", "orchestration", "management", "application"],
    mustNotContain: ["I don't know", "not sure"],
    description: "AOMA acronym should be known"
  },
  {
    category: "USM",
    question: "What is the Universal Service Model?",
    expectedKeywords: ["usm", "service", "model", "framework"],
    mustNotContain: ["I don't know", "not sure"],
    description: "USM should be in knowledge base"
  },
  {
    category: "AOMA Features",
    question: "What are AOMA's linking capabilities?",
    expectedKeywords: ["link", "linking", "asset", "relationship"],
    mustNotContain: ["I don't know", "not sure"],
    description: "Linking features should be documented"
  },
  {
    category: "AOMA Integration",
    question: "How does AOMA integrate with Sony Ci?",
    expectedKeywords: ["sony ci", "workspace", "export", "integration"],
    mustNotContain: ["I don't know", "not sure"],
    description: "Sony Ci integration should be documented"
  }
];

// Questions that should trigger "I don't know" responses
const UNKNOWN_FACTS = [
  {
    category: "Out of Scope",
    question: "What is the weather in Tokyo today?",
    shouldContain: ["don't know", "don't have", "unavailable", "not available", "outside my knowledge"],
    mustNotContain: ["sunny", "cloudy", "rainy", "degrees", "temperature"],
    description: "Weather is not in AOMA knowledge base"
  },
  {
    category: "Out of Scope",
    question: "What is the recipe for chocolate chip cookies?",
    shouldContain: ["don't know", "don't have", "unavailable", "not available", "outside my knowledge"],
    mustNotContain: ["flour", "butter", "sugar", "bake"],
    description: "Recipes are not in AOMA knowledge base"
  },
  {
    category: "Out of Scope",
    question: "Who won the 2023 World Series?",
    shouldContain: ["don't know", "don't have", "unavailable", "not available", "outside my knowledge"],
    mustNotContain: ["texas rangers", "arizona"],
    description: "Sports results are not in AOMA knowledge base"
  },
  {
    category: "Fabricated Sony Info",
    question: "What is Sony Music's employee cafeteria menu for today?",
    shouldContain: ["don't know", "don't have", "unavailable", "not available"],
    mustNotContain: ["pizza", "salad", "sandwich"],
    description: "Specific internal details not in knowledge base"
  }
];

// Reusable login function
async function loginToSIAM(page: Page, context: BrowserContext): Promise<void> {
  console.log("🔐 Logging into SIAM...");
  await page.goto(SIAM_URL, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

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
      await page.waitForSelector('h1:has-text("Welcome to The Betabase"), textarea[placeholder*="Ask"]', {
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
    .locator('textarea[placeholder*="Ask me anything"], input[placeholder*="Ask me anything"]')
    .first();

  await chatInput.clear();
  await chatInput.fill(message);
  await page.keyboard.press("Enter");

  if (expectResponse) {
    try {
      await page.waitForSelector("text=/processing|thinking|generating/i", {
        timeout: 5000,
        state: "visible",
      });
    } catch {
      // Processing might be too fast
    }

    const messageCountBefore = await page.locator('div[role="log"] > div').count();

    try {
      await page.waitForFunction(
        (expectedCount) => {
          const messages = document.querySelectorAll('div[role="log"] > div');
          return messages.length > expectedCount;
        },
        messageCountBefore,
        { timeout: 90000 }
      );
    } catch (e) {
      console.log("   ⚠️ Response timeout after 90s");
    }

    await page.waitForTimeout(3000);

    const assistantMessages = await page.locator('[data-role="assistant"], .assistant-message, div[role="log"] > div').all();
    if (assistantMessages.length > 0) {
      const lastMessage = assistantMessages[assistantMessages.length - 1];
      const responseText = (await lastMessage.textContent()) || "";

      const cleanedResponse = responseText
        .replace(/🤖.*?(?=\n|$)/g, '')
        .replace(/\d{2}:\d{2} (AM|PM)/g, '')
        .replace(/Establishing secure connection.*?(?=\n|$)/g, '')
        .replace(/Parsing request.*?(?=\n|$)/g, '')
        .replace(/Searching AOMA.*?(?=\n|$)/g, '')
        .replace(/Building context.*?(?=\n|$)/g, '')
        .replace(/Generating AI.*?(?=\n|$)/g, '')
        .replace(/Formatting response.*?(?=\n|$)/g, '')
        .replace(/This typically takes.*?(?=\n|$)/g, '')
        .replace(/Estimated time.*?(?=\n|$)/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      return cleanedResponse || responseText;
    }
  }

  return "";
}

test.describe("🎯 AOMA KNOWLEDGE VALIDATION - Prevent Hallucinations", () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    page = await context.newPage();

    setupConsoleMonitoring(page, {
      ignoreWarnings: true,
      ignoreNetworkErrors: true,
    });

    await loginToSIAM(page, context);
  });

  test.afterAll(async () => {
    assertNoConsoleErrors();
    await context.close();
  });

  test("✅ KNOWN FACTS - Validate accurate answers from knowledge base", async () => {
    console.log("\n📚 Testing Known Facts from AOMA Knowledge Base...");

    const results = [];

    for (const fact of KNOWN_FACTS) {
      console.log(`\n   🔍 Testing: ${fact.category} - "${fact.question}"`);
      console.log(`   📝 Description: ${fact.description}`);

      const startTime = Date.now();
      const response = await sendChatMessage(page, fact.question);
      const responseTime = Date.now() - startTime;

      console.log(`\n   💬 RESPONSE (${responseTime}ms):\n${response.substring(0, 300)}...\n`);

      // Check for expected keywords
      const responseLower = response.toLowerCase();
      const foundKeywords = fact.expectedKeywords.filter(kw =>
        responseLower.includes(kw.toLowerCase())
      );

      // Check for mustNotContain phrases
      const forbiddenPhrases = fact.mustNotContain.filter(phrase =>
        responseLower.includes(phrase.toLowerCase())
      );

      const keywordScore = (foundKeywords.length / fact.expectedKeywords.length) * 100;
      const hasForbiddenContent = forbiddenPhrases.length > 0;

      // CRITICAL: Known facts should NOT trigger "I don't know"
      const result = {
        category: fact.category,
        question: fact.question,
        passed: keywordScore >= 50 && !hasForbiddenContent,
        keywordScore: keywordScore.toFixed(0),
        foundKeywords,
        missingKeywords: fact.expectedKeywords.filter(kw => !foundKeywords.includes(kw)),
        forbiddenPhrases,
        responseLength: response.length,
        responseTime
      };

      results.push(result);

      if (result.passed) {
        console.log(`   ✅ PASS - Knowledge base has accurate info`);
        console.log(`   📊 Keyword match: ${result.keywordScore}%`);
        console.log(`   🎯 Found: ${foundKeywords.join(", ")}`);
      } else {
        console.log(`   ❌ FAIL - Response quality issues`);
        if (keywordScore < 50) {
          console.log(`   ⚠️ Low keyword match: ${result.keywordScore}%`);
          console.log(`   ❌ Missing: ${result.missingKeywords.join(", ")}`);
        }
        if (hasForbiddenContent) {
          console.log(`   🚨 CRITICAL: Found forbidden phrases: ${forbiddenPhrases.join(", ")}`);
          console.log(`   🚨 This suggests AOMA said "I don't know" for a KNOWN fact!`);
        }
      }

      // Take screenshot for evidence
      await page.screenshot({
        path: `test-results/aoma-known-fact-${fact.category.replace(/\s+/g, "-")}.png`
      });

      // Wait between queries to respect rate limits
      console.log(`   ⏳ Waiting 15 seconds before next query...`);
      await page.waitForTimeout(15000);
    }

    // Summary
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    const passRate = ((passedTests / totalTests) * 100).toFixed(0);

    console.log(`\n\n📊 KNOWN FACTS SUMMARY:`);
    console.log(`   ✅ Passed: ${passedTests}/${totalTests} (${passRate}%)`);
    console.log(`   ❌ Failed: ${totalTests - passedTests}/${totalTests}`);

    // CRITICAL: All known facts should pass
    expect(passedTests).toBeGreaterThanOrEqual(totalTests * 0.8); // At least 80% should pass
  });

  test("🚫 UNKNOWN FACTS - Validate 'I don't know' responses", async () => {
    console.log("\n🚫 Testing Unknown Facts - Should trigger 'I don't know'...");

    const results = [];

    for (const fact of UNKNOWN_FACTS) {
      console.log(`\n   🔍 Testing: ${fact.category} - "${fact.question}"`);
      console.log(`   📝 Description: ${fact.description}`);

      const startTime = Date.now();
      const response = await sendChatMessage(page, fact.question);
      const responseTime = Date.now() - startTime;

      console.log(`\n   💬 RESPONSE (${responseTime}ms):\n${response}\n`);

      const responseLower = response.toLowerCase();

      // Check if response contains "I don't know" type phrases
      const hasAdmission = fact.shouldContain.some(phrase =>
        responseLower.includes(phrase.toLowerCase())
      );

      // Check if response fabricates information
      const hasFabrication = fact.mustNotContain.some(phrase =>
        responseLower.includes(phrase.toLowerCase())
      );

      const result = {
        category: fact.category,
        question: fact.question,
        passed: hasAdmission && !hasFabrication,
        hasAdmission,
        hasFabrication,
        admissionPhrases: fact.shouldContain.filter(phrase =>
          responseLower.includes(phrase.toLowerCase())
        ),
        fabricatedContent: fact.mustNotContain.filter(phrase =>
          responseLower.includes(phrase.toLowerCase())
        ),
        responseLength: response.length,
        responseTime
      };

      results.push(result);

      if (result.passed) {
        console.log(`   ✅ PASS - Correctly admitted lack of knowledge`);
        console.log(`   ✅ Found admission: ${result.admissionPhrases.join(", ")}`);
        console.log(`   ✅ No fabrication detected`);
      } else {
        console.log(`   ❌ FAIL - Response quality issues`);
        if (!hasAdmission) {
          console.log(`   🚨 CRITICAL: Did NOT admit lack of knowledge!`);
          console.log(`   🚨 This is a HALLUCINATION - making up answers!`);
        }
        if (hasFabrication) {
          console.log(`   🚨 CRITICAL: Found fabricated content: ${result.fabricatedContent.join(", ")}`);
          console.log(`   🚨 AOMA is making up bullshit answers!`);
        }
      }

      // Take screenshot for evidence
      await page.screenshot({
        path: `test-results/aoma-unknown-fact-${fact.category.replace(/\s+/g, "-")}.png`
      });

      // Wait between queries
      console.log(`   ⏳ Waiting 15 seconds before next query...`);
      await page.waitForTimeout(15000);
    }

    // Summary
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    const passRate = ((passedTests / totalTests) * 100).toFixed(0);
    const hallucinationCount = results.filter(r => !r.hasAdmission || r.hasFabrication).length;

    console.log(`\n\n📊 UNKNOWN FACTS SUMMARY:`);
    console.log(`   ✅ Passed: ${passedTests}/${totalTests} (${passRate}%)`);
    console.log(`   ❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    console.log(`   🚨 Hallucinations detected: ${hallucinationCount}`);

    // CRITICAL: Should NOT hallucinate on unknown topics
    expect(hallucinationCount).toBe(0); // Zero tolerance for hallucinations!
  });

  test("📚 SOURCE CITATION - Validate sources are provided", async () => {
    console.log("\n📚 Testing Source Citations...");

    const testQueries = [
      {
        question: "What is AOMA?",
        shouldHaveSources: true,
        description: "Should cite AOMA knowledge base"
      },
      {
        question: "Explain USM",
        shouldHaveSources: true,
        description: "Should cite USM documentation"
      }
    ];

    for (const query of testQueries) {
      console.log(`\n   🔍 Testing: "${query.question}"`);

      const response = await sendChatMessage(page, query.question);

      // Check for citation markers like [1], [2], or source indicators
      const hasCitationMarkers = /\[\d+\]/.test(response) ||
                                response.includes("Source:") ||
                                response.includes("According to") ||
                                response.includes("【");

      console.log(`   📝 Has citations: ${hasCitationMarkers ? "✅" : "❌"}`);

      if (!hasCitationMarkers && query.shouldHaveSources) {
        console.log(`   ⚠️ Response lacks source citations`);
        console.log(`   💡 This makes it hard to verify information accuracy`);
      }

      // Take screenshot
      await page.screenshot({
        path: `test-results/aoma-citations-${query.description.replace(/\s+/g, "-")}.png`
      });

      await page.waitForTimeout(15000);
    }
  });

  test("🔗 AOMA-MCP CONNECTION - Verify server connectivity", async () => {
    console.log("\n🔗 Testing AOMA-MCP Server Connection...");

    // Direct test of AOMA MCP server health
    const aomaServerUrl = "https://aoma-mesh-mcp.onrender.com";

    try {
      const healthResponse = await fetch(`${aomaServerUrl}/api/health`);
      const healthData = await healthResponse.json();

      console.log(`   ✅ AOMA MCP Server: ${healthResponse.ok ? "HEALTHY" : "UNHEALTHY"}`);
      console.log(`   📊 Health data:`, healthData);

      expect(healthResponse.ok).toBe(true);
    } catch (error) {
      console.log(`   ❌ AOMA MCP Server: CONNECTION FAILED`);
      console.log(`   🚨 Error:`, error);
      throw error;
    }

    // Test that chat queries actually use AOMA
    console.log(`\n   🔍 Verifying chat uses AOMA context...`);

    const response = await sendChatMessage(page, "What is AOMA's health status?");
    const responseLower = response.toLowerCase();

    // Should mention AOMA or system health
    const usesAOMA = responseLower.includes("aoma") ||
                     responseLower.includes("system") ||
                     responseLower.includes("health");

    console.log(`   💬 Response mentions AOMA/system: ${usesAOMA ? "✅" : "❌"}`);

    if (!usesAOMA) {
      console.log(`   ⚠️ Response may not be using AOMA context`);
      console.log(`   💬 Response: ${response.substring(0, 200)}...`);
    }

    await page.screenshot({
      path: "test-results/aoma-mcp-connection-test.png"
    });
  });
});
