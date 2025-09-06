#!/usr/bin/env node

/**
 * EPIC VECTOR STORE MIGRATION RUNNER
 * This wrapper ensures environment variables are loaded before any module imports
 */

// Load environment variables FIRST
require("dotenv").config({
  path: require("path").resolve(process.cwd(), ".env.local"),
});

// Verify critical environment variables
const requiredVars = [
  "OPENAI_API_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "VECTOR_STORE_ID",
];

const missing = requiredVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error("❌ Missing required environment variables:");
  missing.forEach((v) => console.error(`   - ${v}`));
  process.exit(1);
}

// Now run the actual migration with tsx
const { spawn } = require("child_process");
const migration = spawn("npx", ["tsx", "scripts/migrate-vector-store.ts"], {
  stdio: "inherit",
  env: process.env,
});

migration.on("close", (code) => {
  process.exit(code);
});
