#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Checks version and MCP connection status of deployed SIAM app
 */

const https = require("https");
const { execSync } = require("child_process");

const DEPLOYMENT_URL = "https://siam-app-mc.netlify.app";
const MCP_LAMBDA_URL =
  "https://ochwh4pvfaigb65koqxgf33ruy0rxnhy.lambda-url.us-east-2.on.aws";

async function fetchWithTimeout(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () =>
        resolve({
          status: res.statusCode,
          data,
          headers: res.headers,
        }),
      );
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    req.on("error", reject);
  });
}

async function checkDeployment() {
  console.log("🚀 SIAM Deployment Verification\n");

  // Get local version info
  const localCommit = execSync("git rev-parse --short HEAD").toString().trim();
  const packageVersion = require("../package.json").version;

  console.log(`📍 Local Info:`);
  console.log(`   Version: ${packageVersion}`);
  console.log(`   Commit: ${localCommit}`);
  console.log("");

  try {
    // Check deployment status
    console.log("🌐 Checking deployment...");
    const deploymentResponse = await fetchWithTimeout(DEPLOYMENT_URL);

    if (deploymentResponse.status === 200) {
      console.log("✅ Deployment is live");

      // Extract version from HTML
      const versionMatch = deploymentResponse.data.match(
        /v\d+\.\d+\.\d+-[a-f0-9]{7}/,
      );
      if (versionMatch) {
        const deployedVersion = versionMatch[0];
        console.log(`📦 Deployed Version: ${deployedVersion}`);

        const expectedVersion = `v${packageVersion}-${localCommit}`;
        if (deployedVersion === expectedVersion) {
          console.log("✅ Version matches local commit");
        } else {
          console.log(`⚠️  Version mismatch! Expected: ${expectedVersion}`);
        }
      } else {
        console.log("❌ Could not extract version from deployment");
      }
    } else {
      console.log(`❌ Deployment error: HTTP ${deploymentResponse.status}`);
    }

    console.log("");

    // Check MCP Lambda health
    console.log("🔌 Checking AOMA-MCP Lambda...");
    try {
      const mcpResponse = await fetchWithTimeout(`${MCP_LAMBDA_URL}/health`);

      if (mcpResponse.status === 200) {
        console.log("✅ MCP Lambda is responding");
        console.log(`   Response: ${mcpResponse.data}`);
      } else if (mcpResponse.status === 403) {
        console.log("🔐 MCP Lambda requires authentication (expected)");
        console.log("   This is normal - the Lambda is working but needs auth");
      } else {
        console.log(`⚠️  MCP Lambda status: HTTP ${mcpResponse.status}`);
      }
    } catch (mcpError) {
      console.log(`❌ MCP Lambda error: ${mcpError.message}`);
    }

    console.log("");
    console.log("🎯 Summary:");
    console.log(`   App URL: ${DEPLOYMENT_URL}`);
    console.log(`   MCP URL: ${MCP_LAMBDA_URL}`);
    console.log(`   Expected Version: v${packageVersion}-${localCommit}`);
  } catch (error) {
    console.error(`❌ Verification failed: ${error.message}`);
  }
}

checkDeployment();
