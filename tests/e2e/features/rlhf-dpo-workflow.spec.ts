/**
 * E2E Tests for RLHF DPO Training Workflow
 *
 * Tests the complete RLHF feedback pipeline:
 * 1. User gives negative feedback (thumbs down)
 * 2. Correction dialog appears
 * 3. User provides correction
 * 4. Preference pair is created
 * 5. Curator can verify and export
 */

import { test, expect } from "../fixtures/base-test";

test.describe("RLHF DPO Training Workflow", () => {
  // Skip feedback collection tests for now - they require full chat flow
  // These should be enabled once the chat panel has proper test IDs
  test.describe.skip("Feedback Collection", () => {
    test("should show thumbs up/down buttons on AI responses", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Wait for chat panel
      await page.waitForSelector('[data-testid="mac-chat-panel"]', { timeout: 10000 });

      // Send a test message
      const input = page.locator("textarea").first();
      await input.fill("What is AOMA?");
      await input.press("Enter");

      // Wait for AI response
      await page.waitForTimeout(3000);

      // Check for thumbs up button
      const thumbsUp = page.locator('button[title="This response was helpful"]');
      await expect(thumbsUp.first()).toBeVisible({ timeout: 10000 });

      // Check for thumbs down button
      const thumbsDown = page.locator('button[title="This response needs improvement"]');
      await expect(thumbsDown.first()).toBeVisible();
    });

    test("should record positive feedback without dialog", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Send a message and wait for response
      const input = page.locator("textarea").first();
      await input.fill("Hello");
      await input.press("Enter");
      await page.waitForTimeout(3000);

      // Click thumbs up
      const thumbsUp = page.locator('button[title="This response was helpful"]').first();
      await thumbsUp.click();

      // Button should change state (turn green)
      await expect(thumbsUp).toHaveClass(/text-green/);

      // No dialog should appear
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).not.toBeVisible();
    });

    test("should open correction dialog on negative feedback", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Send a message and wait for response
      const input = page.locator("textarea").first();
      await input.fill("What is the meaning of life?");
      await input.press("Enter");
      await page.waitForTimeout(3000);

      // Click thumbs down
      const thumbsDown = page.locator('button[title="This response needs improvement"]').first();
      await thumbsDown.click();

      // Dialog should appear
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Dialog should have key elements
      await expect(page.getByText("Help Us Improve")).toBeVisible();
      await expect(page.getByText("Your Question")).toBeVisible();
      await expect(page.getByText("Response That Needs Improvement")).toBeVisible();
      await expect(page.getByText("What Should It Have Said?")).toBeVisible();
    });

    test("should submit correction and create preference pair", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Send a message
      const input = page.locator("textarea").first();
      await input.fill("How do I authenticate with AOMA?");
      await input.press("Enter");
      await page.waitForTimeout(3000);

      // Click thumbs down
      const thumbsDown = page.locator('button[title="This response needs improvement"]').first();
      await thumbsDown.click();

      // Wait for dialog
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Enter correction
      const correctionTextarea = page.locator('[role="dialog"] textarea');
      await correctionTextarea.fill(
        "To authenticate with AOMA, use OAuth 2.0 with the /auth/token endpoint. You'll need your client_id and client_secret from the developer portal."
      );

      // Submit correction
      const submitButton = page.locator('[role="dialog"] button:has-text("Submit Correction")');
      await submitButton.click();

      // Dialog should close
      await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });

      // Thumbs down button should show as selected
      await expect(thumbsDown).toHaveClass(/text-red/);
    });

    test("should allow skipping correction", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Send a message
      const input = page.locator("textarea").first();
      await input.fill("Test question");
      await input.press("Enter");
      await page.waitForTimeout(3000);

      // Click thumbs down
      const thumbsDown = page.locator('button[title="This response needs improvement"]').first();
      await thumbsDown.click();

      // Wait for dialog
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Click skip button
      const skipButton = page.locator('[role="dialog"] button:has-text("Skip")');
      await skipButton.click();

      // Dialog should close
      await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Curator Dashboard", () => {
    test("should load curator dashboard", async ({ page }) => {
      await page.goto("/curator");
      await page.waitForLoadState("networkidle");

      // Should see main dashboard elements
      await expect(page.getByText("RLHF Curator Dashboard")).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("Collect preference data for DPO fine-tuning")).toBeVisible();
    });

    test("should display stats cards", async ({ page }) => {
      await page.goto("/curator");
      await page.waitForLoadState("networkidle");

      // Stats should be visible (use .first() for stats cards vs tabs)
      await expect(page.getByText("Total Feedback")).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("Pending Review")).toBeVisible();
      await expect(page.getByText("Positive Rate")).toBeVisible();
      await expect(page.locator('.text-xs:has-text("Preference Pairs")').first()).toBeVisible();
      await expect(page.getByText("Export Ready")).toBeVisible();
    });

    test("should have Review Queue tab", async ({ page }) => {
      await page.goto("/curator");
      await page.waitForLoadState("networkidle");

      // Review Queue should be default tab
      const reviewQueueTab = page.getByRole("tab", { name: /Review Queue/i });
      await expect(reviewQueueTab).toBeVisible({ timeout: 10000 });
      await expect(reviewQueueTab).toHaveAttribute("data-state", "active");
    });

    test("should have Preference Pairs tab", async ({ page }) => {
      await page.goto("/curator");
      await page.waitForLoadState("networkidle");

      const pairsTab = page.getByRole("tab", { name: /Preference Pairs/i });
      await expect(pairsTab).toBeVisible({ timeout: 10000 });

      // Click to switch
      await pairsTab.click();
      await expect(pairsTab).toHaveAttribute("data-state", "active");

      // Should see pairs-related content
      await expect(page.getByText("Preference Pairs for DPO Training")).toBeVisible();
    });

    test("should have Export tab with DPO export functionality", async ({ page }) => {
      await page.goto("/curator");
      await page.waitForLoadState("networkidle");

      const exportTab = page.getByRole("tab", { name: /Export/i });
      await expect(exportTab).toBeVisible({ timeout: 10000 });

      // Click to switch
      await exportTab.click();
      await expect(exportTab).toHaveAttribute("data-state", "active");

      // Should see export-related content
      await expect(page.getByText("Export DPO Training Data")).toBeVisible();
      await expect(page.getByRole("heading", { name: "JSONL Format" })).toBeVisible();
    });

    test("should show export format information", async ({ page }) => {
      await page.goto("/curator");
      await page.waitForLoadState("networkidle");

      const exportTab = page.getByRole("tab", { name: /Export/i });
      await exportTab.click();

      // Should show JSONL format example
      await expect(page.getByText(/prompt.*chosen.*rejected/i)).toBeVisible({ timeout: 5000 });

      // Should mention compatible frameworks
      await expect(page.getByText(/Hugging Face TRL|Axolotl|LLaMA-Factory/i)).toBeVisible();
    });
  });

  test.describe("Review Queue Functionality", () => {
    test("should display filter buttons", async ({ page }) => {
      await page.goto("/curator");
      await page.waitForLoadState("networkidle");

      // Filter buttons should be visible
      await expect(page.locator('button:has-text("All")')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('button:has-text("Negative")')).toBeVisible();
      await expect(page.locator('button:has-text("No Correction")')).toBeVisible();
    });

    test("should show correction input panel", async ({ page }) => {
      await page.goto("/curator");
      await page.waitForLoadState("networkidle");

      // Should see the correction panel
      await expect(page.getByText("Provide Correction")).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByText("Enter what the response SHOULD have been")
      ).toBeVisible();
    });
  });
});

// Skip data quality tests - requires full chat flow
test.describe.skip("RLHF Data Quality", () => {
  test("correction dialog should prevent empty submissions", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Send a message
    const input = page.locator("textarea").first();
    await input.fill("Test");
    await input.press("Enter");
    await page.waitForTimeout(3000);

    // Click thumbs down
    const thumbsDown = page.locator('button[title="This response needs improvement"]').first();
    await thumbsDown.click();

    // Wait for dialog
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Submit button should be disabled when textarea is empty
    const submitButton = page.locator('[role="dialog"] button:has-text("Submit Correction")');
    await expect(submitButton).toBeDisabled();

    // Enter some text
    const correctionTextarea = page.locator('[role="dialog"] textarea');
    await correctionTextarea.fill("Proper correction");

    // Now submit should be enabled
    await expect(submitButton).toBeEnabled();
  });
});
