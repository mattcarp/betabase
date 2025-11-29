import { Page, Locator } from '@playwright/test';
import { test, expect } from '../fixtures/base-test';

/**
 * DIFFERENTIATED DEMO - Showcasing Unique Features
 *
 * This demo emphasizes what makes SIAM different from generic chatbots:
 * 1. System diagram generation
 * 2. Live system introspection via AOMA mesh MCP
 * 3. Real-time data integration (not just docs)
 * 4. AI testing infrastructure (teased)
 *
 * Run: npx playwright test tests/demo/demo-differentiated.spec.ts --headed
 */

const DEMO_CONFIG = {
  url: "https://thebetabase.com",
  email: "siam-test-x7j9k2p4@mailinator.com",
  shortPause: 2,
  mediumPause: 4,
  longPause: 6,
  streamingWait: 8,
  diagramWait: 12, // Longer for diagram generation
};

const pause = async (page: Page, seconds: number) => {
  await page.waitForTimeout(seconds * 1000);
  console.log(`⏸️  Pause: ${seconds}s`);
};

const typeSlowly = async (locator: Locator, text: string) => {
  await locator.fill("");
  await locator.pressSequentially(text, { delay: 50 });
};

test.describe("SIAM Demo - Points of Differentiation", () => {
  test.setTimeout(300000);

  test.beforeEach(async ({ page }) => {
    await page.goto(DEMO_CONFIG.url);

    const isLoginPage = await page
      .getByText(/sign in|log in|email/i)
      .isVisible()
      .catch(() => false);
    if (isLoginPage) {
      console.log("🔐 Authentication flow...");
      const emailInput = page.getByPlaceholder(/email/i).or(page.getByLabel(/email/i));
      await emailInput.fill(DEMO_CONFIG.email);
      const submitButton = page.getByRole("button", { name: /sign in|continue|submit/i });
      await submitButton.click();
      await pause(page, 10);
    }

    await pause(page, 2);
  });

  test("Full Differentiated Demo", async ({ page }) => {
    console.log("\n\n🎬 SIAM DEMO - POINTS OF DIFFERENTIATION\n");
    console.log("💬 OPENING: This demo runs on our AI testing infrastructure...");
    console.log("💬 OPENING: 59 automated tests, Playwright + Vitest, full CI/CD...");
    console.log(
      "💬 OPENING: But testing is a different video. Today: unique chatbot capabilities...\n"
    );

    await pause(page, DEMO_CONFIG.mediumPause);

    const chatInput = page
      .getByPlaceholder(/ask|type|message|chat/i)
      .or(page.locator("textarea").first())
      .first();

    const sendButton = page
      .getByRole("button", { name: /send/i })
      .or(page.locator('button[type="submit"]'))
      .first();

    // ============================================================
    // DEMO 1: Basic Context - What is AOMA?
    // ============================================================
    console.log("\n📍 DEMO 1: Establishing Context");
    console.log("=".repeat(60));

    await pause(page, DEMO_CONFIG.shortPause);
    console.log("💬 Quick context: What is AOMA?");

    await typeSlowly(chatInput, "What is AOMA?");
    await pause(page, DEMO_CONFIG.shortPause);
    await sendButton.click();

    await pause(page, DEMO_CONFIG.streamingWait);
    console.log("💬 Standard RAG response with citations. Nothing special yet...");
    console.log("✅ Demo 1 complete\n");

    // ============================================================
    // DEMO 2: DIFFERENTIATION - AOMA Mesh MCP Server
    // ============================================================
    console.log("\n📍 DEMO 2: LIVE SYSTEM DATA via AOMA Mesh MCP");
    console.log("=".repeat(60));

    await pause(page, DEMO_CONFIG.shortPause);
    console.log("💬 Now the interesting part - LIVE data from AOMA systems...");
    console.log("💬 Not scraping docs - actual API integration via custom MCP server...");

    await typeSlowly(chatInput, "What is the current state of the AOMA production environment?");

    await pause(page, DEMO_CONFIG.mediumPause);
    console.log("💬 This query hits our AOMA mesh MCP server in real-time...");
    console.log("💬 The MCP maintains persistent connection to AOMA APIs...");

    await sendButton.click();

    await pause(page, DEMO_CONFIG.streamingWait);
    console.log("💬 Notice: real-time data, not historical documentation...");
    console.log("💬 This is POINT OF DIFFERENTIATION #1: Live system integration...");
    console.log("✅ Demo 2 complete\n");

    // ============================================================
    // DEMO 3: DIFFERENTIATION - System Diagram Generation
    // ============================================================
    console.log("\n📍 DEMO 3: SYSTEM DIAGRAM GENERATION");
    console.log("=".repeat(60));

    await pause(page, DEMO_CONFIG.shortPause);
    console.log("💬 Most chatbots only return text. Watch this...");

    await typeSlowly(
      chatInput,
      "Generate a system architecture diagram for AOMA showing all integration points"
    );

    await pause(page, DEMO_CONFIG.mediumPause);
    console.log("💬 It's not just describing the architecture...");
    console.log("💬 It's actually GENERATING a visual diagram...");

    await sendButton.click();

    await pause(page, DEMO_CONFIG.diagramWait);
    console.log("💬 POINT OF DIFFERENTIATION #2: Visual diagram generation...");
    console.log("💬 Mermaid diagrams, system flows, architecture visualizations...");
    console.log("💬 Transforms abstract system knowledge into actionable visuals...");
    console.log("✅ Demo 3 complete\n");

    // ============================================================
    // DEMO 4: DIFFERENTIATION - System Introspection
    // ============================================================
    console.log("\n📍 DEMO 4: SYSTEM INTROSPECTION - The Secret Sauce");
    console.log("=".repeat(60));

    await pause(page, DEMO_CONFIG.shortPause);
    console.log("💬 Here's where it gets really interesting...");
    console.log("💬 Not just answering questions about systems...");
    console.log("💬 Actually ANALYZING system relationships via MCP...");

    await typeSlowly(
      chatInput,
      "Analyze the dependencies and integration health between AOMA and downstream systems"
    );

    await pause(page, DEMO_CONFIG.mediumPause);
    console.log("💬 It's interrogating the AOMA mesh MCP server...");
    console.log("💬 Understanding system topology, not just documentation...");

    await sendButton.click();

    await pause(page, DEMO_CONFIG.streamingWait);
    console.log("💬 POINT OF DIFFERENTIATION #3: System introspection...");
    console.log("💬 Understands how systems interact, dependencies, health status...");
    console.log("💬 This is knowledge that exists in the RUNNING system, not docs...");
    console.log("✅ Demo 4 complete\n");

    // ============================================================
    // DEMO 5: Anti-Hallucination (Standard but Important)
    // ============================================================
    console.log("\n📍 DEMO 5: ANTI-HALLUCINATION - Honesty Test");
    console.log("=".repeat(60));

    await pause(page, DEMO_CONFIG.shortPause);
    console.log("💬 Let's test trustworthiness with a trick question...");

    await typeSlowly(chatInput, "Does AOMA have a quantum computing integration?");

    await pause(page, DEMO_CONFIG.mediumPause);
    console.log("💬 This feature doesn't exist - will it admit that?");

    await sendButton.click();

    await pause(page, DEMO_CONFIG.streamingWait);
    console.log('💬 Notice: honest "no information available" response...');
    console.log("💬 Doesn't fabricate features or make up capabilities...");
    console.log("💬 Critical for enterprise trust...");
    console.log("✅ Demo 5 complete\n");

    // ============================================================
    // DEMO 6: Multi-System Cross-Reference
    // ============================================================
    console.log("\n📍 DEMO 6: CROSS-SYSTEM ANALYSIS");
    console.log("=".repeat(60));

    await pause(page, DEMO_CONFIG.shortPause);
    console.log("💬 Finally: cross-system intelligence...");

    await typeSlowly(chatInput, "How do changes in AOMA3 impact our downstream reporting systems?");

    await pause(page, DEMO_CONFIG.mediumPause);
    console.log("💬 This requires understanding multiple systems...");
    console.log("💬 MCP servers for AOMA, reporting systems, integration points...");
    console.log("💬 Synthesizing cross-system dependencies...");

    await sendButton.click();

    await pause(page, DEMO_CONFIG.streamingWait + 2);
    console.log("💬 POINT OF DIFFERENTIATION #4: Multi-system reasoning...");
    console.log("💬 Not isolated knowledge silos - connected system intelligence...");
    console.log("✅ Demo 6 complete\n");

    console.log("\n\n🎉 DIFFERENTIATED DEMO COMPLETE\n");
    console.log("KEY TAKEAWAYS:");
    console.log("  1. Live system data via custom AOMA mesh MCP");
    console.log("  2. Visual diagram generation (not just text)");
    console.log("  3. System introspection and health analysis");
    console.log("  4. Multi-system cross-reference and impact analysis");
    console.log("  5. Trust through anti-hallucination");
    console.log("\nAnd all of this backed by comprehensive AI testing infrastructure...");
    console.log("(But that's the next video!)\n");
  });
});

/**
 * KEY DIFFERENTIATORS TO EMPHASIZE IN NARRATION:
 *
 * 1. AOMA MESH MCP SERVER
 *    - Custom integration, not generic scraping
 *    - Real-time data, not static docs
 *    - Persistent API connections
 *
 * 2. SYSTEM DIAGRAM GENERATION
 *    - Visual outputs, not just text
 *    - Mermaid, architecture diagrams
 *    - Actionable visualizations
 *
 * 3. SYSTEM INTROSPECTION
 *    - Analyzes running systems
 *    - Understands topology and health
 *    - Knowledge from systems themselves
 *
 * 4. MULTI-SYSTEM INTELLIGENCE
 *    - Cross-system dependencies
 *    - Impact analysis
 *    - Connected knowledge, not silos
 *
 * 5. AI TESTING (TEASE ONLY)
 *    - 59 automated tests
 *    - Playwright + Vitest
 *    - Separate video topic
 */
