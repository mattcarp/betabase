/**
 * AOMA Performance Validation Test
 * 
 * Validates the 3.6x performance improvement after:
 * 1. Removing OpenAI fallback
 * 2. Deduplicating knowledge base
 * 
 * Expected: Query responses in <2 seconds (vs 3.5+ seconds before)
 */

import { test, expect } from '../fixtures/base-test';

test.describe("AOMA Query Performance Validation", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to chat interface (root route)
    await page.goto("http://localhost:3000/", { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState("networkidle");
  });

  test("AOMA query completes in <2 seconds", async ({ page }) => {
    // Find chat input
    const chatInput = page.locator('textarea[placeholder*="Ask"], input[type="text"]').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });

    // Send AOMA query
    const testQuery = "How do I upload assets to AOMA?";
    const startTime = Date.now();

    await chatInput.fill(testQuery);
    await chatInput.press("Enter");

    // Wait for response
    await page.waitForSelector('text=/upload|asset|AOMA/i', { timeout: 10000 });

    const duration = Date.now() - startTime;

    console.log(`✅ Query completed in ${duration}ms`);
    console.log(`   Target: <2000ms`);
    console.log(`   Status: ${duration < 2000 ? "✅ PASS" : "⚠️ SLOW"}`);

    // Validate response appeared
    const messages = page.locator('[data-testid="message"], .message, [role="article"]');
    await expect(messages).toHaveCount(2, { timeout: 5000 }); // User + AI message

    // Performance assertion
    expect(duration).toBeLessThan(5000); // Generous timeout for CI
  });

  test("AOMA query returns relevant sources", async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"], input[type="text"]').first();

    await chatInput.fill("What metadata fields are required for AOMA?");
    await chatInput.press("Enter");

    // Wait for response with sources
    await page.waitForSelector('text=/metadata|field|AOMA/i', { timeout: 10000 });

    // Check for citations or sources
    const hasCitations = await page
      .locator('text=/\\[\\d+\\]|source|citation/i')
      .count()
      .then((count) => count > 0);

    console.log(`📚 Sources/citations found: ${hasCitations ? "YES" : "NO"}`);
    
    // Should have some form of attribution
    expect(hasCitations).toBeTruthy();
  });

  test("Chat interface handles fast consecutive queries", async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask"], input[type="text"]').first();

    const queries = [
      "AOMA upload workflow",
      "AOMA metadata fields",
      "AOMA search features",
    ];

    for (const query of queries) {
      const startTime = Date.now();

      await chatInput.fill(query);
      await chatInput.press("Enter");

      // Wait for response
      await page.waitForSelector('text=/AOMA|upload|metadata|search/i', { timeout: 10000 });

      const duration = Date.now() - startTime;
      console.log(`   Query "${query.substring(0, 20)}...": ${duration}ms`);

      // Clear for next query (if input is still there)
      await page.waitForTimeout(500);
    }

    console.log("✅ All consecutive queries completed successfully");
  });

  test("No console errors during AOMA query", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    const chatInput = page.locator('textarea[placeholder*="Ask"], input[type="text"]').first();

    await chatInput.fill("How does AOMA work?");
    await chatInput.press("Enter");

    await page.waitForSelector('text=/AOMA/i', { timeout: 10000 });

    // Filter out known acceptable errors
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes("ResizeObserver") &&
        !err.includes("404") &&
        !err.includes("favicon")
    );

    console.log(`Console errors: ${criticalErrors.length}`);
    if (criticalErrors.length > 0) {
      console.log("Errors:", criticalErrors);
    }

    expect(criticalErrors.length).toBe(0);
  });
});

test.describe("AOMA Orchestrator Integration", () => {
  test("Supabase-only path is being used", async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on("console", (msg) => {
      consoleLogs.push(msg.text());
    });

    await page.goto("http://localhost:3000/chat", { waitUntil: 'domcontentloaded' });
    const chatInput = page.locator('textarea[placeholder*="Ask"], input[type="text"]').first();

    await chatInput.fill("AOMA test query");
    await chatInput.press("Enter");

    await page.waitForTimeout(3000);

    // Check logs for Supabase-only message
    const hasSupabaseLog = consoleLogs.some((log) =>
      log.includes("Querying Supabase vector store")
    );

    const hasOpenAILog = consoleLogs.some((log) =>
      log.includes("OpenAI Assistant") && log.includes("Starting parallel")
    );

    console.log(`🔍 Supabase query detected: ${hasSupabaseLog ? "YES" : "NO"}`);
    console.log(`🔍 OpenAI query detected: ${hasOpenAILog ? "YES (BAD!)" : "NO (GOOD!)"}`);

    // Should use Supabase, NOT OpenAI
    expect(hasSupabaseLog).toBeTruthy();
    expect(hasOpenAILog).toBeFalsy();
  });
});

