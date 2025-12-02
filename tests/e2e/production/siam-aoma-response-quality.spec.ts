/**
 * AOMA Response Quality & Content Validation
 * 
 * Purpose: Capture and validate actual AOMA responses
 * - Verify response quality and relevance
 * - Measure performance
 * - Save responses for manual review
 */

import { test, expect } from '../fixtures/base-test';
import * as fs from "fs";
import * as path from "path";

const TEST_QUERIES = [
  {
    query: "How do I upload assets to AOMA?",
    expectedKeywords: ["upload", "asset", "submit", "file"],
    category: "Procedural",
  },
  {
    query: "What metadata fields are required for audio assets?",
    expectedKeywords: ["metadata", "field", "audio", "required"],
    category: "Technical",
  },
  {
    query: "How does AOMA registration workflow work?",
    expectedKeywords: ["registration", "workflow", "process", "status"],
    category: "Procedural",
  },
  {
    query: "What file formats does AOMA support?",
    expectedKeywords: ["format", "file", "support", "type"],
    category: "Factual",
  },
  {
    query: "How do I search for assets in AOMA?",
    expectedKeywords: ["search", "find", "asset", "query"],
    category: "Procedural",
  },
];

const RESULTS_DIR = path.join(__dirname, "../../test-results/aoma-responses");

test.describe("AOMA Response Quality Validation", () => {
  test.beforeAll(async () => {
    // Ensure results directory exists
    if (!fs.existsSync(RESULTS_DIR)) {
      fs.mkdirSync(RESULTS_DIR, { recursive: true });
    }
  });

  for (const testCase of TEST_QUERIES) {
    test(`AOMA Query: "${testCase.query}"`, async ({ page }) => {
      console.log(`\n${"=".repeat(70)}`);
      console.log(`📋 Category: ${testCase.category}`);
      console.log(`❓ Query: "${testCase.query}"`);
      console.log(`🎯 Expected keywords: ${testCase.expectedKeywords.join(", ")}`);
      console.log(`${"=".repeat(70)}\n`);

      // Navigate to chat
      await page.goto("http://localhost:3000/", { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState("networkidle");

      // Find chat input
      const chatInput = page.locator('textarea[name="message"]');
      await expect(chatInput).toBeVisible({ timeout: 10000 });

      // Send query and measure time
      const startTime = Date.now();
      await chatInput.fill(testCase.query);
      
      // Take screenshot of query
      await page.screenshot({
        path: path.join(RESULTS_DIR, `${testCase.category}-query.png`),
      });

      await chatInput.press("Enter");
      console.log(`⏱️  Query sent at ${Date.now() - startTime}ms`);

      // Wait for response by checking for new content appearing
      // Look for typical response indicators
      await Promise.race([
        page.waitForSelector('text=/upload|asset|AOMA|metadata|search|workflow/i', { timeout: 20000 }),
        page.waitForTimeout(20000),
      ]);
      
      // Give a moment for full response to render
      await page.waitForTimeout(3000);

      const duration = Date.now() - startTime;
      console.log(`⏱️  Total response time: ${duration}ms`);

      // Get all text content from the page
      const bodyText = await page.locator("body").textContent() || "";
      
      // Try multiple selectors to find response
      let responseText = "";
      
      // Try getting from specific message containers
      const responseParagraphs = page.locator('main p, article p, [role="article"] p, div[class*="message"] p');
      const pCount = await responseParagraphs.count();
      
      console.log(`📨 Response paragraphs found: ${pCount}`);

      if (pCount > 0) {
        // Get all paragraphs and join them
        const texts = [];
        for (let i = 0; i < Math.min(pCount, 20); i++) {
          const text = await responseParagraphs.nth(i).textContent();
          if (text && text.trim() && !text.includes(testCase.query)) {
            texts.push(text.trim());
          }
        }
        responseText = texts.join("\n\n");
      }
      
      // Fallback: Get main content area
      if (!responseText || responseText.length < 50) {
        responseText = await page.locator('main').textContent() || bodyText.substring(0, 2000);
      }

      console.log(`\n📝 RESPONSE (${responseText.length} chars):`);
      console.log(`${"─".repeat(70)}`);
      console.log(responseText.substring(0, 500));
      if (responseText.length > 500) {
        console.log(`\n... (${responseText.length - 500} more characters)\n`);
      }
      console.log(`${"─".repeat(70)}\n`);

      // Check for expected keywords
      const lowerResponse = responseText.toLowerCase();
      const foundKeywords = testCase.expectedKeywords.filter((kw) =>
        lowerResponse.includes(kw.toLowerCase())
      );

      console.log(`✅ Keywords found: ${foundKeywords.join(", ")} (${foundKeywords.length}/${testCase.expectedKeywords.length})`);

      // Take screenshot of response
      await page.screenshot({
        path: path.join(RESULTS_DIR, `${testCase.category}-${testCase.query.substring(0, 30).replace(/[^a-z0-9]/gi, "-")}-response.png`),
        fullPage: true,
      });

      // Save response to file
      const resultFile = path.join(
        RESULTS_DIR,
        `${testCase.category}-${Date.now()}.json`
      );

      fs.writeFileSync(
        resultFile,
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            category: testCase.category,
            query: testCase.query,
            response: responseText,
            duration,
            expectedKeywords: testCase.expectedKeywords,
            foundKeywords,
            keywordMatchRate: `${foundKeywords.length}/${testCase.expectedKeywords.length}`,
            responseLength: responseText.length,
          },
          null,
          2
        )
      );

      console.log(`💾 Saved to: ${resultFile}\n`);

      // Assertions
      expect(responseText.length).toBeGreaterThan(50); // Should have substantial response
      expect(duration).toBeLessThan(5000); // Should be fast
      expect(foundKeywords.length).toBeGreaterThanOrEqual(2); // Should match at least 2 keywords
    });
  }

  test("Aggregate response quality summary", async () => {
    // Read all saved responses
    const files = fs.readdirSync(RESULTS_DIR).filter((f) => f.endsWith(".json"));
    
    console.log(`\n${"=".repeat(70)}`);
    console.log(`📊 AOMA RESPONSE QUALITY SUMMARY`);
    console.log(`${"=".repeat(70)}\n`);

    const results = files.map((file) => {
      const content = fs.readFileSync(path.join(RESULTS_DIR, file), "utf8");
      return JSON.parse(content);
    });

    if (results.length === 0) {
      console.log("⚠️  No results found - run individual tests first");
      return;
    }

    // Calculate metrics
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const avgResponseLength = results.reduce((sum, r) => sum + r.responseLength, 0) / results.length;
    const avgKeywordMatch = results.reduce((sum, r) => {
      const [found, total] = r.keywordMatchRate.split("/").map(Number);
      return sum + found / total;
    }, 0) / results.length;

    console.log(`Total Queries Tested: ${results.length}`);
    console.log(`Average Response Time: ${avgDuration.toFixed(0)}ms`);
    console.log(`Average Response Length: ${avgResponseLength.toFixed(0)} chars`);
    console.log(`Average Keyword Match: ${(avgKeywordMatch * 100).toFixed(1)}%`);

    console.log(`\n📈 Performance by Category:`);
    const byCategory = results.reduce((acc, r) => {
      if (!acc[r.category]) acc[r.category] = [];
      acc[r.category].push(r);
      return acc;
    }, {} as Record<string, any[]>);

    Object.entries(byCategory).forEach(([category, items]) => {
      const avgTime = items.reduce((sum, i) => sum + i.duration, 0) / items.length;
      console.log(`   ${category}: ${avgTime.toFixed(0)}ms avg (${items.length} queries)`);
    });

    console.log(`\n🎯 Quality Assessment:`);
    console.log(`   Response Speed: ${avgDuration < 1000 ? "✅ EXCELLENT" : avgDuration < 2000 ? "✅ GOOD" : "⚠️ ACCEPTABLE"} (${avgDuration.toFixed(0)}ms)`);
    console.log(`   Keyword Relevance: ${avgKeywordMatch > 0.8 ? "✅ EXCELLENT" : avgKeywordMatch > 0.6 ? "✅ GOOD" : "⚠️ NEEDS IMPROVEMENT"} (${(avgKeywordMatch * 100).toFixed(1)}%)`);
    console.log(`   Response Length: ${avgResponseLength > 200 ? "✅ SUBSTANTIAL" : "⚠️ BRIEF"} (${avgResponseLength.toFixed(0)} chars avg)`);

    console.log(`\n${"=".repeat(70)}\n`);

    // Save summary
    fs.writeFileSync(
      path.join(RESULTS_DIR, "SUMMARY.json"),
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          totalQueries: results.length,
          avgDuration,
          avgResponseLength,
          avgKeywordMatch,
          byCategory,
        },
        null,
        2
      )
    );
  });
});

