import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import * as path from "path";

/**
 * Curate Page Object
 * Handles file upload and curation functionality
 */
export class CuratePage extends BasePage {
  private readonly selectors = {
    // Tab navigation
    curateTab: 'button[role="tab"]:has-text("Curate")',

    // Upload area
    uploadArea: '[data-testid="upload-area"], .upload-zone, [role="button"]:has-text("Upload")',
    fileInput: 'input[type="file"]',
    dropZone: '[data-testid="drop-zone"], .drop-zone',

    // File management
    fileList: '[data-testid="file-list"], .file-list',
    fileItem: '[data-testid="file-item"], .file-item',
    fileName: '[data-testid="file-name"], .file-name',
    deleteButton: '[data-testid="delete-file"], button[aria-label="Delete"]',

    // Vector store
    vectorStoreSection: '[data-testid="vector-store"], .vector-store',
    vectorStoreStatus: '[data-testid="vector-status"], .vector-status',

    // Progress indicators
    uploadProgress: '[data-testid="upload-progress"], .progress',
    uploadSuccess: '[data-testid="upload-success"], .success-message',
    uploadError: '[data-testid="upload-error"], .error-message',
  };

  constructor(page: Page) {
    super(page);
  }
  async navigate(): Promise<void> {
    await this.page.goto("/");
    await this.selectCurateTab();
  }

  async selectCurateTab(): Promise<void> {
    await this.page.click(this.selectors.curateTab);
    await this.page.waitForTimeout(500); // Brief wait for tab animation
  }

  async uploadFile(filePath: string): Promise<void> {
    const absolutePath = path.resolve(filePath);
    const fileInput = this.page.locator(this.selectors.fileInput);

    // Set the file input
    await fileInput.setInputFiles(absolutePath);

    // Wait for upload to complete
    await this.waitForUploadComplete();
  }

  async uploadMultipleFiles(filePaths: string[]): Promise<void> {
    const absolutePaths = filePaths.map((p) => path.resolve(p));
    const fileInput = this.page.locator(this.selectors.fileInput);

    await fileInput.setInputFiles(absolutePaths);
    await this.waitForUploadComplete();
  }

  async waitForUploadComplete(): Promise<void> {
    // Wait for success message or file to appear in list
    await Promise.race([
      this.page.waitForSelector(this.selectors.uploadSuccess, {
        timeout: this.timeout.medium,
      }),
      this.page.waitForSelector(this.selectors.fileItem, {
        timeout: this.timeout.medium,
      }),
    ]);
  }
  async getUploadedFiles(): Promise<string[]> {
    const fileItems = this.page.locator(this.selectors.fileName);
    const count = await fileItems.count();
    const files: string[] = [];

    for (let i = 0; i < count; i++) {
      const name = await fileItems.nth(i).textContent();
      if (name) files.push(name.trim());
    }

    return files;
  }

  async deleteFile(fileName: string): Promise<void> {
    // Find the file item containing the name
    const fileItem = this.page.locator(this.selectors.fileItem).filter({ hasText: fileName });

    // Click delete button within that item
    await fileItem.locator(this.selectors.deleteButton).click();

    // Wait for file to be removed
    await this.page.waitForFunction(
      (name) => !document.querySelector(`[data-testid="file-item"]:has-text("${name}")`),
      fileName,
      { timeout: this.timeout.short }
    );
  }

  async isVectorStoreReady(): Promise<boolean> {
    const status = await this.page.textContent(this.selectors.vectorStoreStatus);
    return status?.toLowerCase().includes("ready") || false;
  }

  async hasUploadError(): Promise<boolean> {
    return this.isVisible(this.selectors.uploadError);
  }

  async getUploadError(): Promise<string> {
    return this.getText(this.selectors.uploadError);
  }
}
