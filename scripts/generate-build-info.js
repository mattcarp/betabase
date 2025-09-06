#!/usr/bin/env node

/**
 * Generate build information at build time
 * This script creates environment variables that are injected into the build
 */

const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

// Get package version
const packageJson = require("../package.json");
const appVersion = packageJson.version || "0.1.0";

// Get git commit hash or use Vercel's environment variable
let buildHash = process.env.VERCEL_GIT_COMMIT_SHA || "dev";
if (buildHash === "dev") {
  try {
    buildHash = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch (error) {
    console.warn('Could not get git hash, using "dev"');
  }
}

// Get current timestamp in ISO format and Unix timestamp
const now = new Date();
const buildTime = now.toISOString();
const buildTimestamp = Math.floor(now.getTime() / 1000); // Unix timestamp for easier timezone conversion

// Create .env.production.local file with build info
const envContent = `# Auto-generated build information
NEXT_PUBLIC_APP_VERSION=${appVersion}
NEXT_PUBLIC_BUILD_HASH=${buildHash}
NEXT_PUBLIC_BUILD_TIME=${buildTime}
NEXT_PUBLIC_BUILD_TIMESTAMP=${buildTimestamp}
`;

// Write to .env.production.local (which takes precedence over .env.production)
const envPath = path.join(__dirname, "..", ".env.production.local");
fs.writeFileSync(envPath, envContent);

console.log("Build info generated:");
console.log(`  Version: ${appVersion}`);
console.log(`  Hash: ${buildHash.substring(0, 7)}`);
console.log(`  Time: ${buildTime}`);
console.log(`  Written to: ${envPath}`);
