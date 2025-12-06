/**
 * CRITICAL CURATE FUNCTIONALITY TEST
 *
 * This test MUST FAIL if the Curate tab is broken.
 * It checks for actual upload functionality, not just tab existence.
 */

import { test, expect } from '../e2e/fixtures/base-test';

test.describe("CRITICAL: Curate Tab Functionality", () => {
  test("MUST have file upload capability - FAIL if missing", async ({ page }) => {
    console.log("🚨 CRITICAL TEST: Checking Curate tab upload functionality");

    await page.goto("http://localhost:3000", { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Navigate to Curate tab
    const curateTab = page.locator("text=Curate");
    await expect(curateTab).toBeVisible({ timeout: 5000 });
    await curateTab.click();
    await page.waitForTimeout(2000);

    // Take screenshot for evidence
    await page.screenshot({
      path: "test-results/critical-curate-check.png",
      fullPage: true,
    });

    // CRITICAL CHECKS - These MUST pass
    const fileInputs = await page.locator('input[type="file"]').count();
    const uploadButtons = await page
      .locator(
        'button:has-text("Upload"), button:has-text("upload"), button:has-text("Choose"), button:has-text("Select")'
      )
      .count();
    const dropZones = await page
      .locator(
        '[data-testid*="drop"], .drop-zone, .upload-zone, *:has-text("drag"), *:has-text("Drop")'
      )
      .count();

    console.log("📊 CRITICAL RESULTS:");
    console.log(`   File inputs: ${fileInputs}`);
    console.log(`   Upload buttons: ${uploadButtons}`);
    console.log(`   Drop zones: ${dropZones}`);

    // FAIL THE TEST IF NOTHING IS FOUND
    const hasAnyUploadUI = fileInputs > 0 || uploadButtons > 0 || dropZones > 0;

    if (!hasAnyUploadUI) {
      console.error("❌ CRITICAL FAILURE: No upload UI elements found in Curate tab!");
      console.error("   This means:");
      console.error("   - Users CANNOT upload files to AOMA knowledge base");
      console.error("   - Core curation functionality is BROKEN");
      console.error("   - This is a P0 BLOCKER for deployment");

      // Get page content for debugging
      const pageText = await page.textContent("body");
      console.error("\n📄 Page content sample:");
      console.error(pageText?.substring(0, 500));

      // Check if there's an error message
      const errorElements = await page
        .locator('[role="alert"], .error, *:has-text("error")')
        .count();
      if (errorElements > 0) {
        console.error(`\n⚠️ Found ${errorElements} error elements on page`);
      }
    }

    expect(
      hasAnyUploadUI,
      `❌ CRITICAL: Curate tab has NO upload functionality! ` +
        `File inputs: ${fileInputs}, Upload buttons: ${uploadButtons}, Drop zones: ${dropZones}`
    ).toBeTruthy();

    console.log("✅ Curate tab has upload UI elements");
  });

  test("MUST show AOMA knowledge base context", async ({ page }) => {
    await page.goto("http://localhost:3000", { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const curateTab = page.locator("text=Curate");
    await curateTab.click();
    await page.waitForTimeout(2000);

    // Check for AOMA-related context
    const aomaReferences = await page
      .locator('*:has-text("AOMA"), *:has-text("knowledge base"), *:has-text("vector store")')
      .count();

    console.log(`📊 AOMA context elements: ${aomaReferences}`);

    expect(
      aomaReferences,
      "❌ CRITICAL: No AOMA knowledge base context found in Curate tab"
    ).toBeGreaterThan(0);
  });

  test("MUST NOT show console errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("http://localhost:3000", { waitUntil: 'domcontentloaded' });
    const curateTab = page.locator("text=Curate");
    await curateTab.click();
    await page.waitForTimeout(3000);

    console.log(`📊 Console errors found: ${consoleErrors.length}`);

    if (consoleErrors.length > 0) {
      console.error("❌ Console errors detected:");
      consoleErrors.forEach((err, i) => {
        console.error(`   ${i + 1}. ${err.substring(0, 200)}`);
      });
    }

    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes("Failed to load resource") && !err.includes("404") && !err.includes("favicon")
    );

    expect(criticalErrors.length, `❌ Found ${criticalErrors.length} critical console errors`).toBe(
      0
    );
  });
});
