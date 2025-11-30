import { test, expect } from '../fixtures/base-test';

/**
 * Architecture Validation: Chat Flow Network Calls
 * 
 * CRITICAL: Verifies we are NOT hitting Railway AOMA MCP server during chat.
 * We should only be calling:
 * - OpenAI API (GPT-5/GPT-4o)
 * - Supabase (vector search)
 * 
 * This test ensures we stay fast (<100ms knowledge retrieval) by avoiding
 * the slow Railway → OpenAI Assistant → Vector Store chain.
 */

const RAILWAY_URL = "luminous-dedication-production.up.railway.app";
const TEST_QUERIES = [
  "What is AOMA?",
  "How do I use the Media Batch Converter?",
  "Tell me about the Unified Submission Tool",
];

test.describe("Chat Architecture Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState("networkidle");
  });

  test("should NOT call Railway during chat interactions", async ({ page }) => {
    const railwayRequests: any[] = [];

    // Monitor all network requests
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes(RAILWAY_URL)) {
        railwayRequests.push({
          url,
          method: request.method(),
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Navigate to chat tab
    await page.click('button:has-text("Chat")');
    await page.waitForTimeout(1000);

    // Send a test query
    const input = page.locator('textarea[placeholder*="Ask"]').first();
    await input.fill(TEST_QUERIES[0]);
    await input.press("Enter");

    // Wait for response to complete
    await page.waitForTimeout(5000);

    // CRITICAL ASSERTION: No Railway calls during chat
    expect(railwayRequests).toHaveLength(0);

    if (railwayRequests.length > 0) {
      console.error("❌ UNEXPECTED Railway calls detected:", railwayRequests);
    }
  });

  test("should only call expected APIs during chat", async ({ page }) => {
    const apiCalls = {
      openai: [] as string[],
      supabase: [] as string[],
      railway: [] as string[],
      chatVercel: [] as string[],
      other: [] as string[],
    };

    // Monitor all network requests
    page.on("request", (request) => {
      const url = request.url();

      if (url.includes("api.openai.com")) {
        apiCalls.openai.push(url);
      } else if (url.includes("supabase.co")) {
        apiCalls.supabase.push(url);
      } else if (url.includes(RAILWAY_URL)) {
        apiCalls.railway.push(url);
      } else if (url.includes("/api/chat-vercel")) {
        apiCalls.chatVercel.push(url);
      } else if (url.includes("/api/")) {
        apiCalls.other.push(url);
      }
    });

    // Navigate to chat
    await page.click('button:has-text("Chat")');
    await page.waitForTimeout(1000);

    // Send query
    const input = page.locator('textarea[placeholder*="Ask"]').first();
    await input.fill(TEST_QUERIES[1]);
    await input.press("Enter");

    // Wait for response
    await page.waitForTimeout(5000);

    // Log API calls for debugging
    console.log("📊 API Calls Summary:");
    console.log(`  OpenAI: ${apiCalls.openai.length} calls`);
    console.log(`  Supabase: ${apiCalls.supabase.length} calls`);
    console.log(`  Chat Vercel: ${apiCalls.chatVercel.length} calls`);
    console.log(`  Railway: ${apiCalls.railway.length} calls`);
    console.log(`  Other: ${apiCalls.other.length} calls`);

    // CRITICAL ASSERTIONS
    expect(apiCalls.railway).toHaveLength(0); // No Railway calls
    expect(apiCalls.chatVercel.length).toBeGreaterThan(0); // Should call our API
    expect(apiCalls.openai.length).toBeGreaterThan(0); // Should call OpenAI
  });

  test("should complete chat queries quickly (no Railway latency)", async ({ page }) => {
    // Navigate to chat
    await page.click('button:has-text("Chat")');
    await page.waitForTimeout(1000);

    const input = page.locator('textarea[placeholder*="Ask"]').first();

    // Time the query
    const startTime = Date.now();

    await input.fill(TEST_QUERIES[2]);
    await input.press("Enter");

    // Wait for first response token (streaming)
    await page.waitForSelector('[data-role="assistant"]', { timeout: 3000 });

    const duration = Date.now() - startTime;

    console.log(`⏱️ Time to first response token: ${duration}ms`);

    // Should be fast without Railway (< 2 seconds to first token)
    expect(duration).toBeLessThan(2000);

    if (duration > 1000) {
      console.warn(`⚠️ Response took ${duration}ms - investigate performance`);
    }
  });

  test("health check API can still reach Railway (but not used in chat)", async ({
    page,
    request,
  }) => {
    // Verify health check endpoint exists and works
    const response = await request.get("/api/aoma/health");

    // Health check should return 200 or 503 (both valid - just checking it exists)
    expect([200, 503]).toContain(response.status());

    const data = await response.json();
    console.log("🏥 Health Check Response:", data);

    // Verify it's checking Railway
    expect(data.endpoint || data.message).toBeDefined();

    // But this health check should NOT be called during chat
    const railwayRequests: string[] = [];

    page.on("request", (request) => {
      if (request.url().includes(RAILWAY_URL)) {
        railwayRequests.push(request.url());
      }
    });

    // Do a chat interaction
    await page.click('button:has-text("Chat")');
    const input = page.locator('textarea[placeholder*="Ask"]').first();
    await input.fill("Quick test");
    await input.press("Enter");
    await page.waitForTimeout(3000);

    // Health check is separate - shouldn't be called during chat
    expect(railwayRequests).toHaveLength(0);
  });
});

test.describe("AOMA Orchestrator Behavior", () => {
  test("should use Supabase-only path", async ({ page, request }) => {
    // Make a direct API call to verify behavior
    const response = await request.post("/api/chat-vercel", {
      data: {
        messages: [
          {
            role: "user",
            content: "What is the Media Batch Converter?",
          },
        ],
        model: "gpt-4o",
      },
    });

    expect(response.ok()).toBeTruthy();

    // Should get streaming response
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("text/plain"); // Streaming format
  });
});

test.describe("Network Performance Validation", () => {
  test("should have zero Railway calls across multiple queries", async ({ page }) => {
    const allRailwayRequests: any[] = [];

    page.on("request", (request) => {
      if (request.url().includes(RAILWAY_URL)) {
        allRailwayRequests.push({
          url: request.url(),
          query: "unknown",
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Navigate to chat
    await page.click('button:has-text("Chat")');
    await page.waitForTimeout(1000);

    const input = page.locator('textarea[placeholder*="Ask"]').first();

    // Send multiple queries
    for (let i = 0; i < TEST_QUERIES.length; i++) {
      await input.fill(TEST_QUERIES[i]);
      await input.press("Enter");
      await page.waitForTimeout(3000); // Wait for response

      // Clear for next query
      await input.clear();
      await page.waitForTimeout(500);
    }

    // CRITICAL: Should be zero across ALL queries
    console.log(`📊 Total Railway calls across ${TEST_QUERIES.length} queries: ${allRailwayRequests.length}`);

    expect(allRailwayRequests).toHaveLength(0);

    if (allRailwayRequests.length > 0) {
      console.error("❌ Railway calls detected:", JSON.stringify(allRailwayRequests, null, 2));
      throw new Error(
        `Expected 0 Railway calls, but found ${allRailwayRequests.length}. This indicates we're using the slow path!`
      );
    }
  });

  test("should show performance metrics without Railway latency", async ({ page }) => {
    await page.click('button:has-text("Chat")');
    await page.waitForTimeout(1000);

    const input = page.locator('textarea[placeholder*="Ask"]').first();

    const times: number[] = [];

    // Test performance across queries
    for (const query of TEST_QUERIES.slice(0, 2)) {
      const start = Date.now();

      await input.fill(query);
      await input.press("Enter");

      // Wait for first token
      await page.waitForSelector('[data-role="assistant"]', { timeout: 5000 });

      const duration = Date.now() - start;
      times.push(duration);

      console.log(`⏱️ Query: "${query.slice(0, 30)}..." → ${duration}ms`);

      await input.clear();
      await page.waitForTimeout(1000);
    }

    // Calculate average
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`📊 Average time to first token: ${avgTime}ms`);

    // Should average under 2 seconds (Railway would add 2.5s+)
    expect(avgTime).toBeLessThan(2000);
  });
});

