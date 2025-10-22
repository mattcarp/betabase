#!/usr/bin/env node

/**
 * TestSprite MCP Initialization Script
 * Ensures optimal configuration and startup
 */

const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config();

// Verify API Key
const apiKey = process.env.TESTSPRITE_API_KEY;
if (!apiKey) {
  console.error("❌ TestSprite API Key not found in environment");
  console.error("Please add TESTSPRITE_API_KEY to your .env file");
  process.exit(1);
}

// Initialize TestSprite configuration
const config = {
  apiKey: apiKey,
  projectId: "siam-project",
  baseUrl: process.env.VITE_BASE_URL || "http://localhost:3000",
  environment: process.env.NODE_ENV || "development",
  settings: require("./settings.json"),
  timestamp: new Date().toISOString(),
};

// Create initialization marker
fs.writeFileSync(path.join(__dirname, ".initialized"), JSON.stringify(config, null, 2));

console.log("✅ TestSprite MCP initialized successfully");
console.log("   API Key:", config.apiKey.substring(0, 20) + "...");
console.log("   Project:", config.projectId);
console.log("   Base URL:", config.baseUrl);
console.log("   Environment:", config.environment);
console.log(
  "   Optimization:",
  config.settings.optimization.parallelExecution ? "Enabled" : "Disabled"
);
console.log("   AI Features:", config.settings.ai.autoGenerateTests ? "Enabled" : "Disabled");

// Export for MCP usage
module.exports = config;
