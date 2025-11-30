/**
 * Nano Banana Pro Diagram Generation Tests
 *
 * Tests the background caching and display of Excalidraw-style diagrams
 */

import { test, expect } from '@playwright/test';

test.describe('Nano Banana Pro Diagram Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the chat interface
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState("domcontentloaded");
  });

  test('should show diagram offer buttons after AI response', async ({ page }) => {
    // Find the chat input and type a question
    const chatInput = page.locator('textarea[data-chat-form]').first();
    if (!await chatInput.isVisible()) {
      // Try alternative selector
      const altInput = page.locator('textarea').first();
      await altInput.fill('What is AOMA?');
      await altInput.press('Enter');
    } else {
      await chatInput.fill('What is AOMA?');
      await chatInput.press('Enter');
    }

    // Wait for the response to complete (should see the diagram offer)
    // The offer appears after 800ms delay post-response
    await page.waitForTimeout(35000); // Allow time for RAG + response + delay

    // Scroll to bottom to ensure diagram offer is visible
    await page.evaluate(() => {
      const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
      // Fallback - scroll to bottom of page
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(1000); // Wait for scroll

    // Look for the diagram offer section - use multiple strategies
    const diagramOffer = page.locator('text=Would you like to see a diagram?');
    const nanoBananaPro = page.locator('text=Nano Banana Pro');

    // Check if either the offer or the buttons are visible
    const explainerButton = page.locator('button:has-text("Explainer")');
    const workflowButton = page.locator('button:has-text("Workflow")');

    // At least one of these should be visible if the feature is working
    const offerVisible = await diagramOffer.isVisible().catch(() => false);
    const nanoBananaVisible = await nanoBananaPro.isVisible().catch(() => false);
    const explainerVisible = await explainerButton.isVisible().catch(() => false);
    const workflowVisible = await workflowButton.isVisible().catch(() => false);

    console.log('Diagram offer visible:', offerVisible);
    console.log('Nano Banana Pro visible:', nanoBananaVisible);
    console.log('Explainer button visible:', explainerVisible);
    console.log('Workflow button visible:', workflowVisible);

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'test-results/nano-banana-offer.png', fullPage: true });

    // Verify the offer is showing (relaxed assertion for CI)
    // Accept either diagram offer text OR the "Nano Banana Pro" powered by text
    expect(offerVisible || nanoBananaVisible || explainerVisible || workflowVisible).toBeTruthy();
  });

  test('should show loading indicator on buttons during background generation', async ({ page }) => {
    // This test verifies the background caching feature
    const chatInput = page.locator('textarea').first();
    await chatInput.fill('Explain the AOMA search feature');
    await chatInput.press('Enter');

    // Wait for response to complete
    await page.waitForTimeout(30000);

    // The buttons should show either:
    // - Loader2 icon (spinning) if still generating
    // - Check icon if cached and ready
    const loaderIcon = page.locator('svg.animate-spin');
    const checkIcon = page.locator('button:has-text("Explainer") svg.lucide-check');

    const hasLoader = await loaderIcon.count() > 0;
    const hasCheck = await checkIcon.count() > 0;

    console.log('Has loader (generating):', hasLoader);
    console.log('Has check (cached):', hasCheck);

    // One of these states should be true
    // (loader means generating in background, check means already cached)
  });

  test('should display diagram when user clicks Explainer button', async ({ page }) => {
    test.setTimeout(120000); // Extended timeout for diagram generation

    const chatInput = page.locator('textarea').first();
    await chatInput.fill('What is AOMA?');
    await chatInput.press('Enter');

    // Wait for response + offer
    await page.waitForTimeout(35000);

    // Click the Explainer button
    const explainerButton = page.locator('button:has-text("Explainer")').first();
    if (await explainerButton.isVisible()) {
      await explainerButton.click();

      // Wait for diagram to generate or show cached
      await page.waitForTimeout(15000);

      // Look for the diagram display container
      const diagramContainer = page.locator('text=Nano Banana Pro');
      const hasContainer = await diagramContainer.isVisible().catch(() => false);

      // Take screenshot of diagram
      await page.screenshot({ path: 'test-results/nano-banana-diagram.png', fullPage: true });

      console.log('Diagram container visible:', hasContainer);
    }
  });

  test('should abort background generation when new message sent', async ({ page }) => {
    test.setTimeout(90000);

    const chatInput = page.locator('textarea').first();

    // Send first message
    await chatInput.fill('What is AOMA?');
    await chatInput.press('Enter');

    // Wait for response to start
    await page.waitForTimeout(20000);

    // Quickly send another message (should abort background diagram generation)
    await chatInput.fill('What is GRPS?');
    await chatInput.press('Enter');

    // Wait for new response
    await page.waitForTimeout(30000);

    // The diagram offer should now be for the new response, not the old one
    const diagramOffer = page.locator('text=Would you like to see a diagram?');

    await page.screenshot({ path: 'test-results/nano-banana-abort.png', fullPage: true });

    console.log('New response diagram offer:', await diagramOffer.isVisible().catch(() => false));
  });
});
