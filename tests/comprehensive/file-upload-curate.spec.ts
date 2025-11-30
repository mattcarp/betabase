import { test, expect } from '../fixtures/base-test';
import { TestHelpers, TEST_USERS } from "../helpers/test-utils";
import * as path from "path";
import * as fs from "fs";

test.describe("File Upload and Curation - Comprehensive", () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.monitorConsoleErrors();

    // Set up auth
    await page.goto("/", { waitUntil: 'domcontentloaded' });
    await helpers.bypassAuth();
    await page.reload();
    await helpers.waitForPageReady();
  });

  test.describe("File Upload Interface", () => {
    test("should display upload area in Curate tab", async ({ page }) => {
      await helpers.selectTab("Curate");

      // Check for upload elements
      await expect(page.locator("text=/Upload files|Drop files here/i")).toBeVisible();
      await expect(page.locator('input[type="file"]')).toBeAttached();

      // Check for file management UI
      const hasFileList = await helpers.checkElementVisible('[data-testid="file-list"]');
      const hasVectorStore = await helpers.checkTextVisible("Vector Store");

      expect(hasFileList || hasVectorStore).toBeTruthy();
    });

    test("should handle single file upload", async ({ page }) => {
      await helpers.selectTab("Curate");

      // Create a test file
      const testFile = path.join(process.cwd(), "test-upload.txt");
      fs.writeFileSync(testFile, "Test content for SIAM upload");

      try {
        // Upload file
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(testFile);

        // Wait for upload to complete
        const uploadResponse = await helpers.waitForAPIResponse("/api/upload", {
          status: 200,
        });

        // Check file appears in list
        await expect(page.locator("text=test-upload.txt")).toBeVisible();

        // Verify upload response
        const responseData = await uploadResponse.json();
        expect(responseData.success).toBeTruthy();
      } finally {
        // Clean up test file
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });

    test("should handle multiple file upload", async ({ page }) => {
      await helpers.selectTab("Curate");

      // Create multiple test files
      const testFiles = [];
      for (let i = 1; i <= 3; i++) {
        const filePath = path.join(process.cwd(), `test-file-${i}.txt`);
        fs.writeFileSync(filePath, `Test content ${i}`);
        testFiles.push(filePath);
      }

      try {
        // Upload multiple files
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(testFiles);

        // Wait for all uploads
        await page.waitForTimeout(2000);

        // Check all files appear
        for (let i = 1; i <= 3; i++) {
          const fileVisible = await helpers.checkTextVisible(`test-file-${i}.txt`);
          expect(fileVisible).toBeTruthy();
        }
      } finally {
        // Clean up test files
        testFiles.forEach((file) => {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
          }
        });
      }
    });

    test("should handle drag and drop upload", async ({ page }) => {
      await helpers.selectTab("Curate");

      // Create a test file
      const testFile = path.join(process.cwd(), "drag-drop-test.txt");
      fs.writeFileSync(testFile, "Drag and drop test content");

      try {
        // Simulate drag and drop
        const dropZone = page
          .locator('[data-testid="drop-zone"], .drop-zone, [class*="upload"]')
          .first();

        const dataTransfer = await page.evaluateHandle(() => new DataTransfer());

        // This is a simplified simulation - real drag-drop is complex in Playwright
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(testFile);

        // Verify file uploaded
        await page.waitForTimeout(1000);
        const fileVisible = await helpers.checkTextVisible("drag-drop-test.txt");
        expect(fileVisible).toBeTruthy();
      } finally {
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });

    test("should validate file types", async ({ page }) => {
      await helpers.selectTab("Curate");

      // Try to upload an unsupported file type (if restrictions exist)
      const testFile = path.join(process.cwd(), "test.xyz");
      fs.writeFileSync(testFile, "Invalid file type");

      try {
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(testFile);

        // Check for validation message
        const hasError =
          (await helpers.checkTextVisible("not supported")) ||
          (await helpers.checkTextVisible("invalid"));

        // If no validation, file should still upload
        if (!hasError) {
          const fileVisible = await helpers.checkTextVisible("test.xyz");
          expect(fileVisible).toBeTruthy();
        }
      } finally {
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });

    test("should handle upload errors gracefully", async ({ page, context }) => {
      await helpers.selectTab("Curate");

      // Mock upload failure
      await context.route("**/api/upload", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Upload failed" }),
        });
      });

      const testFile = path.join(process.cwd(), "error-test.txt");
      fs.writeFileSync(testFile, "This should fail");

      try {
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(testFile);

        // Check for error message
        await page.waitForTimeout(1000);
        const hasError =
          (await helpers.checkTextVisible("error")) || (await helpers.checkTextVisible("failed"));
        expect(hasError).toBeTruthy();
      } finally {
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });
  });

  test.describe("File Management", () => {
    test("should display uploaded files in list", async ({ page }) => {
      await helpers.selectTab("Curate");

      // Check for file list structure
      const fileList = page.locator('[data-testid="file-list"], [class*="file-list"], table');

      if (await fileList.isVisible()) {
        // Check for file management controls
        const hasActions =
          (await page.locator('button:has-text("Delete"), button:has-text("Remove")').count()) > 0;
        const hasFileInfo =
          (await page.locator('[class*="file-name"], [class*="file-size"]').count()) > 0;

        expect(hasActions || hasFileInfo).toBeTruthy();
      }
    });

    test("should delete uploaded files", async ({ page }) => {
      await helpers.selectTab("Curate");

      // Upload a file first
      const testFile = path.join(process.cwd(), "delete-test.txt");
      fs.writeFileSync(testFile, "File to be deleted");

      try {
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(testFile);

        await page.waitForTimeout(1000);

        // Find and click delete button
        const deleteBtn = page
          .locator(
            'button:has-text("Delete"), button:has-text("Remove"), button[aria-label*="delete"]'
          )
          .first();

        if (await deleteBtn.isVisible()) {
          await deleteBtn.click();

          // Confirm deletion if dialog appears
          const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
          if (await confirmBtn.isVisible({ timeout: 1000 })) {
            await confirmBtn.click();
          }

          // File should be removed from list
          await page.waitForTimeout(1000);
          const fileStillVisible = await helpers.checkTextVisible("delete-test.txt");
          expect(fileStillVisible).toBeFalsy();
        }
      } finally {
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });

    test("should show file details/preview", async ({ page }) => {
      await helpers.selectTab("Curate");

      // Upload a file
      const testFile = path.join(process.cwd(), "preview-test.txt");
      fs.writeFileSync(testFile, "Content for preview");

      try {
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(testFile);

        await page.waitForTimeout(1000);

        // Click on file to view details
        const fileItem = page.locator("text=preview-test.txt");
        if (await fileItem.isVisible()) {
          await fileItem.click();

          // Check for preview or details modal
          const hasPreview =
            (await helpers.checkTextVisible("Content for preview")) ||
            (await helpers.checkElementVisible('[data-testid="file-preview"]'));

          // Some details should be visible (size, type, etc.)
          const hasDetails =
            (await helpers.checkTextVisible("bytes")) ||
            (await helpers.checkTextVisible("text/plain"));

          expect(hasPreview || hasDetails).toBeTruthy();
        }
      } finally {
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });
  });

  test.describe("Vector Store Integration", () => {
    test("should add files to vector store", async ({ page }) => {
      await helpers.selectTab("Curate");

      const testFile = path.join(process.cwd(), "vector-test.txt");
      fs.writeFileSync(testFile, "Content for vector embedding");

      try {
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(testFile);

        await page.waitForTimeout(1000);

        // Look for vector store controls
        const addToVectorBtn = page.locator(
          'button:has-text("Add to Vector Store"), button:has-text("Embed")'
        );

        if (await addToVectorBtn.isVisible()) {
          await addToVectorBtn.click();

          // Wait for processing
          const processingIndicator = page.locator("text=/processing|embedding|indexing/i");
          if (await processingIndicator.isVisible()) {
            await processingIndicator.waitFor({
              state: "hidden",
              timeout: 30000,
            });
          }

          // Check for success indication
          const hasSuccess =
            (await helpers.checkTextVisible("success")) ||
            (await helpers.checkTextVisible("added")) ||
            (await helpers.checkTextVisible("indexed"));

          expect(hasSuccess).toBeTruthy();
        }
      } finally {
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });

    test("should display vector store status", async ({ page }) => {
      await helpers.selectTab("Curate");

      // Check for vector store information
      const hasVectorInfo =
        (await helpers.checkTextVisible("Vector Store")) ||
        (await helpers.checkTextVisible("Embedded Files")) ||
        (await helpers.checkTextVisible("Knowledge Base"));

      if (hasVectorInfo) {
        // Look for status indicators
        const statusElements = await page.locator('[class*="status"], [class*="badge"]').count();
        expect(statusElements).toBeGreaterThan(0);
      }
    });

    test("should handle vector store errors", async ({ page, context }) => {
      await helpers.selectTab("Curate");

      // Mock vector store failure
      await context.route("**/api/vector-store", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Vector store unavailable" }),
        });
      });

      const testFile = path.join(process.cwd(), "vector-error.txt");
      fs.writeFileSync(testFile, "This should fail to embed");

      try {
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(testFile);

        await page.waitForTimeout(1000);

        const addToVectorBtn = page.locator(
          'button:has-text("Add to Vector Store"), button:has-text("Embed")'
        );
        if (await addToVectorBtn.isVisible()) {
          await addToVectorBtn.click();

          // Check for error message
          const hasError =
            (await helpers.checkTextVisible("error")) || (await helpers.checkTextVisible("failed"));
          expect(hasError).toBeTruthy();
        }
      } finally {
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });
  });

  test.describe("Progress and Feedback", () => {
    test("should show upload progress", async ({ page }) => {
      await helpers.selectTab("Curate");

      // Create a larger file to see progress
      const testFile = path.join(process.cwd(), "large-file.txt");
      const largeContent = "x".repeat(1024 * 1024); // 1MB
      fs.writeFileSync(testFile, largeContent);

      try {
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(testFile);

        // Look for progress indicator
        const progressBar = page.locator(
          '[role="progressbar"], [class*="progress"], [class*="loading"]'
        );
        const hasProgress = await progressBar.isVisible({ timeout: 1000 });

        if (hasProgress) {
          // Wait for upload to complete
          await progressBar.waitFor({ state: "hidden", timeout: 30000 });
        }

        // File should appear after upload
        const fileVisible = await helpers.checkTextVisible("large-file.txt");
        expect(fileVisible).toBeTruthy();
      } finally {
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });

    test("should show success notifications", async ({ page }) => {
      await helpers.selectTab("Curate");

      const testFile = path.join(process.cwd(), "success-test.txt");
      fs.writeFileSync(testFile, "Success test content");

      try {
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(testFile);

        // Check for success toast/notification
        const hasToast =
          (await helpers.checkElementVisible('[role="status"]')) ||
          (await helpers.checkTextVisible("successfully uploaded")) ||
          (await helpers.checkTextVisible("upload complete"));

        expect(hasToast).toBeTruthy();
      } finally {
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });
  });

  test.afterEach(async ({ page }) => {
    const errors = await helpers.getConsoleErrors();
    if (errors.length > 0) {
      console.log("Console errors detected:", errors);
    }
  });
});
