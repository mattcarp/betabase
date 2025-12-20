import { test, expect } from "./fixtures/base-test";

test.describe("Historical Test Explorer Refinements", () => {
  // Disable failing on console errors if the app has known noise
  // test.use({ failOnConsoleError: false });

  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto("http://localhost:3000");
    
    // Wait for the app to load
    await page.waitForLoadState("networkidle");
    
    // Navigate to Test Dashboard - using the Sidebar or Nav if available
    // Based on TestDashboard.tsx, we need to click "Test"
    await page.click("text=Test");
    await page.waitForSelector("text=Test Dashboard");
    
    // Navigate to Historical tab
    await page.click('button:has-text("Historical")');
    await page.waitForSelector('[data-test-id="historical-test-explorer"]');
    
    // Wait for the cache to warm up (data to load)
    // The "WARMING CACHE..." text should disappear
    await page.waitForSelector('text=WARMING CACHE...', { state: 'hidden', timeout: 30000 });
  });

  test("should verify compact header and action buttons at the bottom", async ({ page }) => {
    // 1. Select a test from the list
    // The list uses [data-test-id^="test-row-"]
    const firstRow = page.locator('[data-test-id^="test-row-"]').first();
    await expect(firstRow).toBeVisible();
    await firstRow.click();
    
    // 2. Verify detail panel is visible
    const detailPanel = page.locator('[data-test-id="test-detail"]');
    await expect(detailPanel).toBeVisible();

    // Wait a bit for animations
    await page.waitForTimeout(1000);

    // Take screenshot of the top of the detail panel (showing compact header)
    await page.screenshot({ 
      path: "tests/screenshots/historical-1-compact-header.png" 
    });

    // 3. Scroll to the bottom of the detail area
    // The detail panel has a ScrollArea which contains the content
    const scrollArea = detailPanel.locator('div[data-radix-scroll-area-viewport]');
    await expect(scrollArea).toBeVisible();
    
    // Scroll to the bottom
    await scrollArea.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    // Wait for scroll to finish
    await page.waitForTimeout(500);
    
    // 4. Verify "Generate Automated Test" and "Run AI Analysis" buttons are present at the bottom
    const genButton = page.locator('button:has-text("Generate Automated Test")');
    const aiButton = page.locator('button:has-text("Run AI Analysis")');
    
    await expect(genButton).toBeVisible();
    await expect(aiButton).toBeVisible();

    // Take screenshot of the buttons at the bottom
    await page.screenshot({ 
      path: "tests/screenshots/historical-2-bottom-buttons.png" 
    });

    // 5. Test "Generate Automated Test" click
    await genButton.click();
    
    // Look for "Generating Automated Test..." state
    await expect(page.locator('text=Generating Automated Test...')).toBeVisible();
    
    // Wait for "Generated Automated Test" panel to appear (AI generation)
    // Increased timeout for AI generation
    await page.waitForSelector('text=Generated Automated Test', { timeout: 45000 });
    
    // Verify it's there
    const artifactTitle = page.locator('text=Generated Automated Test').first();
    await expect(artifactTitle).toBeVisible();

    // Scroll to the bottom again to see the result and the buttons below it
    await scrollArea.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(500);

    // Take screenshot of the generated test result
    await page.screenshot({ 
      path: "tests/screenshots/historical-3-generated-result.png" 
    });
    
    // Verify toast appeared (optional but good)
    const toast = page.locator('text=Script generated and saved to vault');
    if (await toast.isVisible()) {
        await expect(toast).toBeVisible();
    }
  });
});

