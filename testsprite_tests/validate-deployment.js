#!/usr/bin/env node

/**
 * Quick deployment validation before running comprehensive tests
 */

const https = require("https");
const http = require("http");

const DEPLOYMENT_URL = process.env.SIAM_TEST_URL || "http://localhost:3000";

async function validateDeployment() {
  console.log("🌐 Validating SIAM deployment...");
  console.log(`📍 URL: ${DEPLOYMENT_URL}`);

  return new Promise((resolve) => {
    const startTime = Date.now();

    const req = https.get(DEPLOYMENT_URL, (res) => {
      const responseTime = Date.now() - startTime;

      console.log(`📊 Response Status: ${res.statusCode}`);
      console.log(`⏰ Response Time: ${responseTime}ms`);
      console.log(`🏷️ Content-Type: ${res.headers["content-type"]}`);

      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        const isHtml =
          res.headers["content-type"] &&
          res.headers["content-type"].includes("html");
        const hasReactContent = data.includes("react") || data.includes("SIAM");

        console.log(`📄 Response contains HTML: ${isHtml ? "Yes" : "No"}`);
        console.log(
          `⚛️ Contains React/SIAM content: ${hasReactContent ? "Yes" : "No"}`,
        );

        if (res.statusCode === 200) {
          console.log("✅ Deployment is accessible and responding");
          resolve({ success: true, statusCode: res.statusCode, responseTime });
        } else {
          console.log(`⚠️ Deployment returned status ${res.statusCode}`);
          resolve({ success: false, statusCode: res.statusCode, responseTime });
        }
      });
    });

    req.on("error", (error) => {
      console.log(`❌ Error connecting to deployment: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.setTimeout(10000, () => {
      console.log("⏰ Request timeout after 10 seconds");
      req.abort();
      resolve({ success: false, error: "Timeout" });
    });
  });
}

async function checkPrerequisites() {
  console.log("\n🔧 Checking prerequisites...");

  // Check if Playwright is available
  try {
    const { execSync } = require("child_process");
    const playwrightVersion = execSync("npx playwright --version", {
      encoding: "utf8",
    });
    console.log(`✅ Playwright: ${playwrightVersion.trim()}`);
  } catch (error) {
    console.log("❌ Playwright not found or not working");
    return false;
  }

  // Check if TestSprite is available
  try {
    const testspritePackage = require("@testsprite/playwright/package.json");
    console.log(`✅ TestSprite: ${testspritePackage.version}`);
  } catch (error) {
    console.log(
      "⚠️ TestSprite package not found - tests may run without visual regression",
    );
  }

  return true;
}

async function main() {
  console.log("🧪 SIAM TestSprite Pre-flight Validation");
  console.log("=".repeat(40));

  const deploymentResult = await validateDeployment();
  const prerequisitesOk = await checkPrerequisites();

  console.log("\n📋 Validation Summary:");
  console.log("=".repeat(25));
  console.log(
    `🌐 Deployment accessible: ${deploymentResult.success ? "✅" : "❌"}`,
  );
  console.log(`🔧 Prerequisites ready: ${prerequisitesOk ? "✅" : "❌"}`);

  if (deploymentResult.success && prerequisitesOk) {
    console.log("\n🎉 All checks passed! Ready to run TestSprite tests.");
    console.log("👉 Run: node run-comprehensive-tests.js");
    return true;
  } else {
    console.log("\n⚠️ Some checks failed, but tests may still be valuable.");
    console.log("💡 Consider running tests anyway to capture current state.");
    return false;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { validateDeployment, checkPrerequisites };
