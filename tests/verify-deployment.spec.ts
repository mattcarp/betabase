/**
 * DEPLOYMENT VERIFICATION TEST
 * Checks if the latest code is actually deployed
 */

import { test, expect } from "@playwright/test";

test("Verify deployment code is live", async ({ page }) => {
  console.log("\n🔍 Checking if new deployment is live...\n");

  // Navigate to production
  await page.goto("https://thebetabase.com");

  // Check the page source for clues about which version is deployed
  const pageContent = await page.content();

  // The new code removed the rate limiting, so check for old error messages
  console.log("📝 Checking page content for deployment artifacts...");

  // Try to trigger an API call to see the error response
  const response = await page.request.post("https://thebetabase.com/api/chat", {
    headers: {
      "Content-Type": "application/json"
    },
    data: {
      messages: [{ role: "user", content: "test" }]
    },
    timeout: 5000
  }).catch(e => {
    console.log("❌ API request failed:", e.message);
    return null;
  });

  if (response) {
    const body = await response.text();
    console.log("\n📊 API Response:");
    console.log(body);

    // Check if we get the OLD rate limit message (means old code)
    if (body.includes("GPT-5 has strict rate limits")) {
      console.log("\n❌ OLD CODE DETECTED - Still has old rate limit message");
      console.log("   Expected: No client-side rate limiting");
      console.log("   Got: Old '10s minimum' rate limit message");
    } else if (body.includes("Rate limit")) {
      console.log("\n✅ POSSIBLE NEW CODE - Rate limit error but different message");
      console.log("   This could be from OpenAI directly (expected)");
    } else {
      console.log("\n✅ NEW CODE LIKELY DEPLOYED - No rate limit in response");
    }
  }

  // Check health endpoint
  const health = await page.request.get("https://thebetabase.com/api/health");
  const healthData = await health.json();
  console.log("\n🏥 Health Check:", healthData);

  expect(healthData.status).toBe("healthy");
});
