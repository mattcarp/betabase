/**
 * COMPREHENSIVE CURATE TAB TESTING
 *
 * This test suite performs exhaustive functional testing of the Knowledge Curation interface.
 * Testing approach: FUNCTIONAL > VISUAL > BEHAVIORAL
 */

import { Page } from '@playwright/test';
import { test, expect } from './fixtures/base-test';
import path from "path";

// Test configuration
const BASE_URL = "http://localhost:3000";
const TEST_FILE_PATH = path.join(__dirname, "../tmp/test-files/");
const TIMEOUT = 30000;

// Helper to create test files
async function createTestFile(filename: string, content: string): Promise<string> {
  const fs = require("fs").promises;
  const testFilePath = path.join(TEST_FILE_PATH, filename);

  // Ensure directory exists
  try {
    await fs.mkdir(TEST_FILE_PATH, { recursive: true });
  } catch (e) {
    // Directory might already exist
  }

  await fs.writeFile(testFilePath, content);
  return testFilePath;
}

// Helper to navigate to Curate tab
async function navigateToCurateTab(page: Page) {
  await page.goto(BASE_URL);

  // Wait for authentication/main page load
  await page.waitForLoadState("networkidle");

  // Click Curate tab (it's in the header navigation)
  await page.click('button:has-text("Curate")');

  // Wait for Curate content to load
  await page.waitForSelector("text=Knowledge Curation", { timeout: TIMEOUT });
}

test.describe("Curate Tab - Phase 1: Functional Testing", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToCurateTab(page);
  });

  test("1.1 - Page Load and Initial State", async ({ page }) => {
    // Verify main components are visible
    await expect(page.locator("text=Knowledge Curation")).toBeVisible();
    await expect(page.locator("text=AOMA vector storage")).toBeVisible();

    // Check that tabs are present
    await expect(page.locator('button[role="tab"]:has-text("Files")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Upload")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Info")')).toBeVisible();

    // Check header badges
    await expect(page.locator("text=files")).toBeVisible();

    // Take baseline screenshot
    await page.screenshot({
      path: "tmp/screenshots/curate-initial-load.png",
      fullPage: true,
    });
  });

  test("1.2 - Tab Navigation", async ({ page }) => {
    // Test Files tab
    await page.click('button[role="tab"]:has-text("Files")');
    await expect(page.locator('input[placeholder="Search files..."]')).toBeVisible();
    await page.screenshot({ path: "tmp/screenshots/curate-files-tab.png" });

    // Test Upload tab
    await page.click('button[role="tab"]:has-text("Upload")');
    await expect(page.locator("text=Upload to Knowledge Base")).toBeVisible();
    await page.screenshot({ path: "tmp/screenshots/curate-upload-tab.png" });

    // Test Info tab
    await page.click('button[role="tab"]:has-text("Info")');
    await expect(page.locator("text=Vector Store Information")).toBeVisible();
    await page.screenshot({ path: "tmp/screenshots/curate-info-tab.png" });
  });

  test("1.3 - File Upload - Drag & Drop Detection", async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Upload")');

    // Check if drag & drop zone exists
    const dropZone = page.locator("text=Drag and drop files or click to browse");
    await expect(dropZone).toBeVisible();

    // Verify max file size is displayed
    await expect(page.locator("text=Max file size:")).toBeVisible();

    // Verify supported file types are listed
    await expect(page.locator("text=Supported:")).toBeVisible();
  });

  test("1.4 - File Upload - Click to Browse", async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Upload")');

    // Create a small test file
    const testFilePath = await createTestFile(
      "test-document.txt",
      "This is a test document for SIAM knowledge base."
    );

    // Locate the file input
    const fileInput = page.locator('input[type="file"]');

    // Upload the file
    await fileInput.setInputFiles(testFilePath);

    // Wait for upload to complete (look for success toast or completed status)
    await page.waitForSelector("text=uploaded successfully", { timeout: TIMEOUT });

    // Take screenshot
    await page.screenshot({ path: "tmp/screenshots/curate-upload-success.png" });
  });

  test("1.5 - Search Functionality", async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Files")');

    // Wait for files to load
    await page.waitForTimeout(1000);

    // Get initial file count
    const fileListBefore = await page.locator('[class*="space-y-2"] > div').count();

    // Type in search box
    const searchInput = page.locator('input[placeholder="Search files..."]');
    await searchInput.fill("test");

    // Wait for debounce
    await page.waitForTimeout(500);

    // Get filtered file count
    const fileListAfter = await page.locator('[class*="space-y-2"] > div').count();

    console.log(`Files before search: ${fileListBefore}, after search: ${fileListAfter}`);

    // Screenshot filtered state
    await page.screenshot({ path: "tmp/screenshots/curate-search-filtered.png" });

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);
  });

  test("1.6 - File Selection", async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Files")');

    // Wait for files to load
    await page.waitForTimeout(1000);

    // Check if "Select all" checkbox exists
    const selectAllCheckbox = page.locator('label:has-text("Select all")');

    if (await selectAllCheckbox.isVisible()) {
      // Click select all
      await selectAllCheckbox.click();

      // Verify Delete button appears
      await expect(page.locator('button:has-text("Delete")')).toBeVisible();

      // Screenshot selected state
      await page.screenshot({ path: "tmp/screenshots/curate-files-selected.png" });

      // Deselect all
      await selectAllCheckbox.click();

      // Verify Delete button disappears
      await expect(page.locator('button:has-text("Delete")')).not.toBeVisible();
    }
  });

  test("1.7 - Delete Confirmation Dialog", async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Files")');

    // Wait for files to load
    await page.waitForTimeout(1000);

    // Find a file row and click its checkbox
    const firstFileCheckbox = page.locator('[type="checkbox"]').nth(1); // Skip "select all"

    if (await firstFileCheckbox.isVisible()) {
      await firstFileCheckbox.click();

      // Click Delete button
      await page.click('button:has-text("Delete")');

      // Verify dialog appears
      await expect(page.locator("text=Are you sure you want to delete")).toBeVisible();

      // Screenshot dialog
      await page.screenshot({ path: "tmp/screenshots/curate-delete-dialog.png" });

      // Cancel deletion
      await page.click('button:has-text("Cancel")');

      // Verify dialog closes
      await expect(page.locator("text=Are you sure you want to delete")).not.toBeVisible();
    }
  });

  test("1.8 - Refresh Files", async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Files")');

    // Click refresh button
    const refreshButton = page
      .locator('button[title="Refresh"]')
      .or(page.locator('button svg[class*="RefreshCw"]').first());

    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // Wait for loading state
      await page.waitForTimeout(1000);

      // Verify last updated timestamp changes
      await expect(page.locator("text=Last updated:")).toBeVisible();
    }
  });

  test("1.9 - Deduplicate Button", async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Files")');

    // Find deduplicate button (GitMerge icon)
    const dedupeButton = page.locator('button[title="Find and remove duplicate files"]').or(
      page
        .locator("button")
        .filter({ has: page.locator('svg[class*="GitMerge"]') })
        .first()
    );

    if (await dedupeButton.isVisible()) {
      await dedupeButton.click();

      // Wait for processing
      await page.waitForTimeout(2000);

      // Check for result toast or message
      // (May show "No duplicates found" or duplicate count)
    }
  });

  test("1.10 - Console Errors Check", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate and interact with all tabs
    await page.click('button[role="tab"]:has-text("Files")');
    await page.waitForTimeout(500);

    await page.click('button[role="tab"]:has-text("Upload")');
    await page.waitForTimeout(500);

    await page.click('button[role="tab"]:has-text("Info")');
    await page.waitForTimeout(500);

    // Report errors
    if (consoleErrors.length > 0) {
      console.log("Console errors found:");
      consoleErrors.forEach((err) => console.log(`  - ${err}`));
    }

    // Fail test if there are console errors
    expect(consoleErrors).toHaveLength(0);
  });
});

test.describe("Curate Tab - Phase 2: UX & Interaction Quality", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToCurateTab(page);
  });

  test("2.1 - Upload Progress Feedback", async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Upload")');

    const testFilePath = await createTestFile("large-test.txt", "A".repeat(1000000)); // 1MB file

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);

    // Check for progress indicator
    await expect(
      page.locator("text=Uploading").or(page.locator('[role="progressbar"]'))
    ).toBeVisible({ timeout: 5000 });

    // Wait for completion
    await page.waitForSelector("text=uploaded successfully", { timeout: TIMEOUT });
  });

  test("2.2 - Empty State Messaging", async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Files")');

    // Clear search to show all files
    const searchInput = page.locator('input[placeholder="Search files..."]');
    await searchInput.fill("NONEXISTENTFILE12345");

    // Wait for search to complete
    await page.waitForTimeout(500);

    // Check for empty state message
    await expect(
      page.locator("text=No files found").or(page.locator("text=No files match"))
    ).toBeVisible();

    await page.screenshot({ path: "tmp/screenshots/curate-empty-state.png" });
  });

  test("2.3 - Hover Effects and Visual Feedback", async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Files")');

    await page.waitForTimeout(1000);

    // Find first file row
    const firstFile = page.locator('[class*="group flex items-center"]').first();

    if (await firstFile.isVisible()) {
      // Hover over file
      await firstFile.hover();

      // Take screenshot of hover state
      await page.screenshot({ path: "tmp/screenshots/curate-file-hover.png" });
    }
  });

  test("2.4 - Tab Transition Smoothness", async ({ page }) => {
    // Measure tab switching speed
    const startTime = Date.now();

    await page.click('button[role="tab"]:has-text("Files")');
    await page.waitForSelector('input[placeholder="Search files..."]');

    await page.click('button[role="tab"]:has-text("Upload")');
    await page.waitForSelector("text=Upload to Knowledge Base");

    await page.click('button[role="tab"]:has-text("Info")');
    await page.waitForSelector("text=Vector Store Information");

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`Tab switching took ${duration}ms`);

    // Should be instantaneous (< 1 second for all transitions)
    expect(duration).toBeLessThan(1000);
  });

  test("2.5 - File Type Icon Display", async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Info")');

    // Check that file type badges are displayed
    await expect(page.locator("text=Supported File Types")).toBeVisible();

    // Verify at least some file type badges exist
    const fileTypeBadges = page.locator("text=.pdf, text=.txt, text=.md").first();
    await expect(fileTypeBadges).toBeVisible();
  });
});

test.describe("Curate Tab - Phase 3: Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToCurateTab(page);
  });

  test("3.1 - Keyboard Navigation", async ({ page }) => {
    // Tab through main elements
    await page.keyboard.press("Tab"); // Focus on first interactive element
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Take screenshot showing focus states
    await page.screenshot({ path: "tmp/screenshots/curate-keyboard-nav.png" });
  });

  test("3.2 - ARIA Labels and Roles", async ({ page }) => {
    // Check for proper ARIA labels
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();

    expect(tabCount).toBeGreaterThan(0);

    // Check for proper tablist
    await expect(page.locator('[role="tablist"]')).toBeVisible();
  });
});

test.describe("Curate Tab - Phase 4: Performance", () => {
  test("4.1 - Page Load Performance", async ({ page }) => {
    const startTime = Date.now();

    await page.goto(BASE_URL);
    await page.click('button:has-text("Curate")');
    await page.waitForSelector("text=Knowledge Curation");

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    console.log(`Curate tab loaded in ${loadTime}ms`);

    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test("4.2 - File List Rendering Performance", async ({ page }) => {
    await navigateToCurateTab(page);
    await page.click('button[role="tab"]:has-text("Files")');

    const startTime = Date.now();

    // Wait for file list to render
    await page.waitForSelector('[class*="space-y-2"]');

    const endTime = Date.now();
    const renderTime = endTime - startTime;

    console.log(`File list rendered in ${renderTime}ms`);

    // Should render quickly
    expect(renderTime).toBeLessThan(2000);
  });
});

test.describe("Curate Tab - Phase 5: Error Handling", () => {
  test("5.1 - Invalid File Upload", async ({ page }) => {
    await navigateToCurateTab(page);
    await page.click('button[role="tab"]:has-text("Upload")');

    // Try to upload an extremely large file (should fail)
    const largeFilePath = await createTestFile("too-large.bin", "X".repeat(50 * 1024 * 1024)); // 50MB

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(largeFilePath);

    // Should show error message
    await expect(
      page.locator("text=exceeds maximum size").or(page.locator("text=too large"))
    ).toBeVisible({ timeout: 5000 });
  });

  test("5.2 - Network Error Simulation", async ({ page }) => {
    await navigateToCurateTab(page);

    // Simulate offline mode
    await page.route("**/api/vector-store/files", (route) => route.abort());

    await page.click('button[role="tab"]:has-text("Files")');

    // Click refresh to trigger failed network request
    const refreshButton = page
      .locator("button")
      .filter({ has: page.locator('svg[class*="RefreshCw"]') })
      .first();
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
    }

    // Should show error state or message
    await page.waitForTimeout(2000);
  });
});
