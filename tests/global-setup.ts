import { chromium, FullConfig } from "@playwright/test";

/**
 * Global Setup for Dashboard-Integrated Playwright Tests
 * Prepares the test environment for dashboard integration
 */
async function globalSetup(config: FullConfig) {
  console.log("🚀 Setting up Playwright Dashboard Integration...");

  // Ensure results directory exists
  const fs = require("fs");
  const path = require("path");
  const resultsDir = path.join(process.cwd(), ".playwright-results");

  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
    console.log("📁 Created results directory:", resultsDir);
  }

  // Clean up any old result files
  const files = fs.readdirSync(resultsDir);
  for (const file of files) {
    if (file.endsWith(".json")) {
      fs.unlinkSync(path.join(resultsDir, file));
    }
  }
  console.log("🧹 Cleaned up old result files");

  // Set execution ID for this test run
  process.env.EXECUTION_ID = `exec_${Date.now()}`;
  console.log("🔧 Set execution ID:", process.env.EXECUTION_ID);

  // Optional: Start with a quick health check
  if (config.projects[0]?.use?.baseURL) {
    try {
      const browser = await chromium.launch();
      const page = await browser.newPage();
      await page.goto(config.projects[0].use.baseURL + "/api/health");
      const response = await page.textContent("body");
      console.log("🏥 Health check:", response ? "PASS" : "FAIL");
      await browser.close();
    } catch (error) {
      console.warn("⚠️ Health check failed:", error.message);
    }
  }

  console.log("✅ Global setup complete");
}

export default globalSetup;
