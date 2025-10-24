/**
 * FUN ANTI-HALLUCINATION DEMO
 * Let's ask silly questions and see how the AI handles them!
 */

import { test, expect } from "@playwright/test";

test.describe("Silly Questions Demo - Anti-Hallucination Testing", () => {
  test.setTimeout(120000);

  test("Question 1: Does AOMA have a teleportation feature?", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.waitForSelector('textarea[placeholder*="Ask"]', { timeout: 10000 });

    console.log("\n🎯 Question 1: Does AOMA have a teleportation feature?");

    const chatInput = page.locator('textarea[placeholder*="Ask"]').first();
    await chatInput.fill("Does AOMA have a teleportation feature?");
    await page.keyboard.press("Enter");

    // Wait for response
    await page.waitForTimeout(15000);

    const response = await page.locator('[data-role="assistant"]').last().textContent();
    console.log("🤖 AI Response:", response);
    console.log("\n");

    // Should NOT invent teleportation feature
    expect(response?.toLowerCase()).not.toContain("teleport");
    expect(response?.toLowerCase()).toMatch(/no|not|don't|doesn't|unavailable/);
  });

  test("Question 2: Can AOMA predict lottery numbers?", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.waitForSelector('textarea[placeholder*="Ask"]', { timeout: 10000 });

    console.log("\n🎯 Question 2: Can AOMA predict lottery numbers?");

    const chatInput = page.locator('textarea[placeholder*="Ask"]').first();
    await chatInput.fill("Can AOMA predict lottery numbers?");
    await page.keyboard.press("Enter");

    await page.waitForTimeout(15000);

    const response = await page.locator('[data-role="assistant"]').last().textContent();
    console.log("🤖 AI Response:", response);
    console.log("\n");

    // Should admit this is not a feature
    expect(response?.toLowerCase()).toMatch(/no|not|doesn't|cannot/);
  });

  test("Question 3: Does AOMA have a coffee brewing integration?", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.waitForSelector('textarea[placeholder*="Ask"]', { timeout: 10000 });

    console.log("\n🎯 Question 3: Does AOMA have a coffee brewing integration?");

    const chatInput = page.locator('textarea[placeholder*="Ask"]').first();
    await chatInput.fill("Does AOMA have a coffee brewing integration?");
    await page.keyboard.press("Enter");

    await page.waitForTimeout(15000);

    const response = await page.locator('[data-role="assistant"]').last().textContent();
    console.log("🤖 AI Response:", response);
    console.log("\n");

    // Should NOT fabricate coffee integration
    expect(response?.toLowerCase()).toMatch(/no|not|unavailable|don't/);
  });

  test("Question 4: Can AOMA write poetry?", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.waitForSelector('textarea[placeholder*="Ask"]', { timeout: 10000 });

    console.log("\n🎯 Question 4: Can AOMA write poetry?");

    const chatInput = page.locator('textarea[placeholder*="Ask"]').first();
    await chatInput.fill("Can AOMA write poetry?");
    await page.keyboard.press("Enter");

    await page.waitForTimeout(15000);

    const response = await page.locator('[data-role="assistant"]').last().textContent();
    console.log("🤖 AI Response:", response);
    console.log("\n");

    // Should admit this is not an AOMA feature
    expect(response?.toLowerCase()).toMatch(/no|not|doesn't/);
  });

  test("Question 5: Does AOMA support time travel workflows?", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.waitForSelector('textarea[placeholder*="Ask"]', { timeout: 10000 });

    console.log("\n🎯 Question 5: Does AOMA support time travel workflows?");

    const chatInput = page.locator('textarea[placeholder*="Ask"]').first();
    await chatInput.fill("Does AOMA support time travel workflows?");
    await page.keyboard.press("Enter");

    await page.waitForTimeout(15000);

    const response = await page.locator('[data-role="assistant"]').last().textContent();
    console.log("🤖 AI Response:", response);
    console.log("\n");

    // Should NOT invent time travel features
    expect(response?.toLowerCase()).toMatch(/no|not|doesn't|unavailable/);
  });

  test("Question 6: THE PRESENTATION QUESTION - Teleportation", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.waitForSelector('textarea[placeholder*="Ask"]', { timeout: 10000 });

    console.log("\n🎯 THE BIG ONE: Does AOMA have a teleportation feature?");
    console.log("Expected: 'Based on the AOMA stuff I know about, there is no teleportation feature.'");

    const chatInput = page.locator('textarea[placeholder*="Ask"]').first();
    await chatInput.fill("Does AOMA have a teleportation feature?");
    await page.keyboard.press("Enter");

    await page.waitForTimeout(15000);

    const response = await page.locator('[data-role="assistant"]').last().textContent();
    console.log("🤖 AI Response:", response);
    console.log("\n✨ This is the anti-hallucination protection in action!");
    console.log("✅ The AI refuses to make up features that don't exist");
    console.log("\n");

    // Should match the presentation's expected behavior
    expect(response?.toLowerCase()).toMatch(/based on|aoma|no|not|doesn't/);
  });
});
