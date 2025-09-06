#!/usr/bin/env node

/**
 * Fallback build info generator - minimal version for container builds
 * This creates basic build info when the main script fails
 */

const fs = require("fs");
const path = require("path");

// Get current timestamp in ISO format
const buildTime = new Date().toISOString();
const buildHash =
  process.env.RAILWAY_GIT_COMMIT_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GIT_COMMIT_SHA ||
  "railway-build";

// Basic version
const appVersion = "0.1.0";

// Create .env.production.local file with build info
const envContent = `# Auto-generated build information (fallback)
NEXT_PUBLIC_APP_VERSION=${appVersion}
NEXT_PUBLIC_BUILD_HASH=${buildHash}
NEXT_PUBLIC_BUILD_TIME=${buildTime}
`;

// Write to .env.production.local
const envPath = path.join(process.cwd(), ".env.production.local");
fs.writeFileSync(envPath, envContent);

console.log("Build info generated (fallback):");
console.log(`  Version: ${appVersion}`);
console.log(`  Hash: ${buildHash.substring(0, 7)}`);
console.log(`  Time: ${buildTime}`);
