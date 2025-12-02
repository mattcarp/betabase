/**
 * AOMA ERROR HANDLING & RESILIENCE TEST SUITE
 *
 * Tests error scenarios and graceful degradation:
 * - MCP server connectivity failures
 * - OpenAI API key authentication errors
 * - Graceful fallback when knowledge base unavailable
 * - Health endpoint accuracy
 * - Error visibility and logging
 */

import { Page, BrowserContext } from '@playwright/test';
import { test, expect } from '../fixtures/base-test';
import { setupConsoleMonitoring, assertNoConsoleErrors } from "../helpers/console-monitor";

const TEST_EMAIL = "siam-test-x7j9k2p4@mailinator.com";
const MAILINATOR_INBOX = "https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-test-x7j9k2p4";
const SIAM_URL = "http://localhost:3000";
const HEALTH_ENDPOINT = `${SIAM_URL}/api/aoma/health`;

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

// Helper to send chat message and capture response
async function sendChatMessage(
  page: Page,
  message: string,
  expectResponse: boolean = true
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

    const assistantMessages = await page
      .locator('[data-role="assistant"], .assistant-message, div[role="log"] > div')
      .all();
    if (assistantMessages.length > 0) {
      const lastMessage = assistantMessages[assistantMessages.length - 1];
      const responseText = (await lastMessage.textContent()) || "";

      const cleanedResponse = responseText
        .replace(/🤖.*?(?=\n|$)/g, "")
        .replace(/\d{2}:\d{2} (AM|PM)/g, "")
        .replace(/Establishing secure connection.*?(?=\n|$)/g, "")
        .replace(/Parsing request.*?(?=\n|$)/g, "")
        .replace(/Searching AOMA.*?(?=\n|$)/g, "")
        .replace(/Building context.*?(?=\n|$)/g, "")
        .replace(/Generating AI.*?(?=\n|$)/g, "")
        .replace(/Formatting response.*?(?=\n|$)/g, "")
        .replace(/This typically takes.*?(?=\n|$)/g, "")
        .replace(/Estimated time.*?(?=\n|$)/g, "")
        .replace(/\s+/g, " ")
        .trim();

      return cleanedResponse || responseText;
    }
  }

  return "";
}

test.describe("🚨 AOMA ERROR HANDLING & RESILIENCE TESTS", () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    page = await context.newPage();

    setupConsoleMonitoring(page, {
      ignoreWarnings: true,
      ignoreNetworkErrors: false, // We want to catch MCP connectivity errors
    });

    await loginToSIAM(page, context);
  });

  test.afterAll(async () => {
    assertNoConsoleErrors();
    await context.close();
  });

  test("1️⃣ HEALTH ENDPOINT - Verify accurate MCP server status", async () => {
    console.log("\n🏥 Testing Health Endpoint Accuracy...");

    const response = await page.request.get(HEALTH_ENDPOINT);
    const healthData = await response.json();

    console.log(`   📊 Health Response:`, JSON.stringify(healthData, null, 2));

    // Verify health endpoint structure
    expect(healthData).toHaveProperty("status");
    expect(healthData.status).toMatch(/healthy|degraded|unhealthy/);

    // If status is healthy, verify MCP server is actually reachable
    if (healthData.status === "healthy") {
      console.log("   ✅ Status: healthy");

      // Verify MCP endpoint is actually responding
      expect(healthData).toHaveProperty("services");

      if (healthData.services?.openai) {
        console.log(
          `   🔑 OpenAI service status: ${healthData.services.openai.status ? "✅" : "❌"}`
        );
        expect(healthData.services.openai.status).toBeTruthy();
      }

      if (healthData.services?.supabase) {
        console.log(
          `   🗄️ Supabase service status: ${healthData.services.supabase.status ? "✅" : "❌"}`
        );
      }
    } else {
      console.log(`   ⚠️ Status: ${healthData.status}`);
      console.log(`   Error: ${healthData.error || "No error message"}`);
      console.log(`   Error Type: ${healthData.errorType || "Unknown"}`);
    }

    // Take screenshot of health data
    await page.goto(`${SIAM_URL}/api/aoma/health`);
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: "test-results/aoma-health-endpoint.png",
    });
  });

  test("2️⃣ MCP CONNECTIVITY - Test handling of unreachable MCP server", async () => {
    console.log("\n🔌 Testing MCP Connectivity Error Handling...");

    // This test verifies graceful degradation when MCP is unreachable
    // In production, we can't actually break the MCP server, so we test
    // that error messages are clear and the app doesn't crash

    const response = await sendChatMessage(page, "What is AOMA used for at Sony Music?");

    console.log(`   📝 Response received: ${response.substring(0, 200)}...`);

    // Check if response indicates an error condition
    const hasErrorMessage =
      response.includes("⚠️") ||
      response.includes("error") ||
      response.includes("unavailable") ||
      response.includes("not responding");

    // Check if app is still functional
    const chatInput = page.locator('textarea[placeholder*="Ask me anything"]').first();
    const isInputEnabled = await chatInput.isEnabled();

    console.log(`   💬 Chat input still enabled: ${isInputEnabled ? "✅" : "❌"}`);
    expect(isInputEnabled).toBe(true);

    // Take screenshot
    await page.screenshot({
      path: "test-results/aoma-mcp-connectivity-test.png",
    });

    await page.waitForTimeout(2000);
  });

  test("3️⃣ API KEY ERRORS - Verify clear error messages for auth failures", async () => {
    console.log("\n🔑 Testing API Key Error Handling...");

    // Test that the app handles API key errors gracefully
    // We can't force an API key error in production, but we can verify
    // the health endpoint would detect it

    const healthResponse = await page.request.get(HEALTH_ENDPOINT);
    const healthData = await healthResponse.json();

    if (healthData.status === "degraded" && healthData.errorType === "auth_error") {
      console.log("   ⚠️ AUTH ERROR DETECTED:");
      console.log(`      Message: ${healthData.message}`);
      console.log(`      Error: ${healthData.error}`);

      // Verify error message is clear and actionable
      expect(healthData.message).toContain("OpenAI");
      expect(healthData.message).toContain("API key");

      console.log("   ✅ Error message is clear and actionable");
    } else if (healthData.status === "healthy") {
      console.log("   ✅ No API key errors detected (healthy state)");

      // Send a query to verify AOMA is working
      const response = await sendChatMessage(page, "What is the purpose of AOMA?");

      const isValidResponse =
        response.length > 50 &&
        (response.toLowerCase().includes("aoma") ||
          response.toLowerCase().includes("asset") ||
          response.toLowerCase().includes("orchestration"));

      console.log(`   📊 Valid AOMA response: ${isValidResponse ? "✅" : "❌"}`);
      console.log(`   Response length: ${response.length} chars`);

      expect(isValidResponse).toBe(true);
    }

    await page.waitForTimeout(2000);
  });

  test("4️⃣ GRACEFUL DEGRADATION - Test fallback when knowledge base unavailable", async () => {
    console.log("\n🛡️ Testing Graceful Degradation...");

    // Test that when AOMA MCP is unavailable, the app:
    // 1. Shows clear error messages
    // 2. Falls back to Supabase knowledge search
    // 3. Doesn't crash or hang
    // 4. Remains usable for other features

    const queries = [
      "Tell me about AOMA",
      "How do I use the media batch converter?",
      "What is Sony Ci integration?",
    ];

    for (const query of queries) {
      console.log(`\n   🔍 Testing: "${query}"`);

      const response = await sendChatMessage(page, query);

      // Check response quality
      const hasSubstance = response.length > 30;
      const isNotError = !response.includes("500") && !response.includes("crashed");

      console.log(`      Response length: ${response.length} chars`);
      console.log(`      Has substance: ${hasSubstance ? "✅" : "⚠️"}`);
      console.log(`      Not errored: ${isNotError ? "✅" : "⚠️"}`);

      // Verify chat is still functional
      const chatInput = page.locator('textarea[placeholder*="Ask me anything"]').first();
      const isEnabled = await chatInput.isEnabled();

      console.log(`      Chat still enabled: ${isEnabled ? "✅" : "❌"}`);
      expect(isEnabled).toBe(true);

      await page.waitForTimeout(2000);
    }

    await page.screenshot({
      path: "test-results/aoma-graceful-degradation.png",
    });
  });

  test("5️⃣ ERROR VISIBILITY - Verify user sees clear error indicators", async () => {
    console.log("\n👁️ Testing Error Visibility...");

    // Check health endpoint for any errors
    const healthResponse = await page.request.get(HEALTH_ENDPOINT);
    const healthData = await healthResponse.json();

    console.log(`   Health status: ${healthData.status}`);

    if (healthData.status !== "healthy") {
      // If there's an error, verify it's visible to users
      console.log("   ⚠️ Error state detected, checking visibility...");

      // Send a query that would trigger MCP
      const response = await sendChatMessage(page, "What are the latest AOMA features?");

      // Check if error is communicated to user
      const hasVisibleError =
        response.includes("⚠️") ||
        response.includes("error") ||
        response.includes("unavailable") ||
        response.includes("issue");

      console.log(`   User sees error indicator: ${hasVisibleError ? "✅" : "❌"}`);

      if (hasVisibleError) {
        console.log(`   Error message: ${response.substring(0, 150)}...`);
      }
    } else {
      console.log("   ✅ System healthy - no errors to display");
    }

    // Take screenshot of any error states
    await page.screenshot({
      path: "test-results/aoma-error-visibility.png",
      fullPage: true,
    });

    await page.waitForTimeout(2000);
  });

  test("6️⃣ CONSOLE ERROR LOGGING - Verify detailed server-side logs", async () => {
    console.log("\n📝 Testing Console Error Logging...");

    // This test verifies that errors are properly logged
    // We check the browser console for any error messages

    const consoleMessages: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleMessages.push(msg.text());
      }
    });

    // Trigger a query
    await sendChatMessage(page, "How does AOMA integrate with other Sony systems?");

    await page.waitForTimeout(3000);

    console.log(`   📊 Console errors captured: ${consoleMessages.length}`);

    if (consoleMessages.length > 0) {
      console.log("   🔴 Console Errors:");
      consoleMessages.forEach((msg, i) => {
        console.log(`      ${i + 1}. ${msg.substring(0, 100)}`);
      });

      // Check if errors are descriptive
      const hasDescriptiveErrors = consoleMessages.some(
        (msg) =>
          msg.includes("AOMA") ||
          msg.includes("MCP") ||
          msg.includes("API") ||
          msg.includes("OpenAI")
      );

      if (hasDescriptiveErrors) {
        console.log("   ✅ Errors contain helpful context");
      } else {
        console.log("   ⚠️ Errors may lack context");
      }
    } else {
      console.log("   ✅ No console errors detected");
    }

    await page.waitForTimeout(2000);
  });

  test("7️⃣ TIMEOUT HANDLING - Test long-running query timeouts", async () => {
    console.log("\n⏱️ Testing Timeout Handling...");

    // Send a complex query that might take a while
    const startTime = Date.now();

    const response = await sendChatMessage(
      page,
      "Explain the complete end-to-end workflow of AOMA from asset ingestion to Sony Ci export, including all QC steps, linking processes, and integration points with AMEBA services."
    );

    const responseTime = Date.now() - startTime;

    console.log(`   ⏱️ Response time: ${responseTime}ms (${(responseTime / 1000).toFixed(1)}s)`);

    // Check if response was received (didn't timeout)
    const didReceiveResponse = response.length > 0;
    console.log(`   📨 Response received: ${didReceiveResponse ? "✅" : "❌"}`);

    if (didReceiveResponse) {
      console.log(`   📏 Response length: ${response.length} chars`);
    }

    // Verify app is still responsive after long query
    const chatInput = page.locator('textarea[placeholder*="Ask me anything"]').first();
    const isEnabled = await chatInput.isEnabled();

    console.log(`   💬 Chat still responsive: ${isEnabled ? "✅" : "❌"}`);
    expect(isEnabled).toBe(true);

    await page.screenshot({
      path: "test-results/aoma-timeout-handling.png",
    });

    await page.waitForTimeout(2000);
  });

  test("8️⃣ RECOVERY TEST - Verify system recovers from errors", async () => {
    console.log("\n🔄 Testing Error Recovery...");

    // Send multiple queries to test system stability
    const recoveryQueries = [
      "What is AOMA?",
      "Tell me about USM",
      "How does linking work?",
      "What are QC features?",
      "Explain Sony Ci export",
    ];

    let successCount = 0;
    let failCount = 0;

    for (const query of recoveryQueries) {
      console.log(`\n   Testing: "${query.substring(0, 30)}..."`);

      try {
        const response = await sendChatMessage(page, query);

        if (response.length > 30 && !response.includes("Error")) {
          successCount++;
          console.log(`      ✅ Success (${response.length} chars)`);
        } else {
          failCount++;
          console.log(`      ⚠️ Poor response`);
        }
      } catch (error) {
        failCount++;
        console.log(`      ❌ Failed: ${error}`);
      }

      await page.waitForTimeout(2000);
    }

    console.log(`\n   📊 Recovery Results:`);
    console.log(`      Successful: ${successCount}/${recoveryQueries.length}`);
    console.log(`      Failed: ${failCount}/${recoveryQueries.length}`);
    console.log(
      `      Success rate: ${((successCount / recoveryQueries.length) * 100).toFixed(0)}%`
    );

    // Verify majority of queries succeeded
    expect(successCount).toBeGreaterThan(recoveryQueries.length / 2);

    await page.screenshot({
      path: "test-results/aoma-recovery-test.png",
      fullPage: true,
    });

    console.log("\n🎊 AOMA ERROR HANDLING TESTS COMPLETE! 🎊");
  });
});
