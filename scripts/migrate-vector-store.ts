#!/usr/bin/env node

/**
 * EPIC VECTOR STORE MIGRATION SCRIPT
 * Run this to migrate all your OpenAI vector store data to Supabase!
 *
 * Usage: npm run migrate:vectors
 *
 * YOLO MODE ACTIVATED! 🚀
 */

// Load environment variables FIRST before any imports that use them
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Now import services that depend on environment variables
import { VectorStoreMigrationService } from "../src/services/vectorStoreMigration";

async function main() {
  console.log("\n");
  console.log("🚀 ============================================== 🚀");
  console.log("     OPENAI → SUPABASE VECTOR MIGRATION");
  console.log("     Making AOMA queries BLAZING FAST!");
  console.log("🚀 ============================================== 🚀");
  console.log("\n");

  // Check required environment variables
  const requiredEnvVars = [
    "OPENAI_API_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "VECTOR_STORE_ID",
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingVars.forEach((varName) => console.error(`   - ${varName}`));
    console.error("\nPlease set these in your .env.local file");
    process.exit(1);
  }

  console.log("✅ Environment variables loaded");
  console.log(`📍 OpenAI Vector Store ID: ${process.env.VECTOR_STORE_ID}`);
  console.log(`📍 Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log("\n");

  // Ask for confirmation
  console.log("⚠️  This will:");
  console.log("   1. Download all files from your OpenAI vector store");
  console.log("   2. Generate embeddings for each file");
  console.log("   3. Store everything in your Supabase vector database");
  console.log("   4. Make your queries 25x faster! 🔥");
  console.log("\n");
  console.log("Press Ctrl+C to cancel, or wait 3 seconds to continue...");

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log("\n");
  console.log("LET'S GO! 🚀");
  console.log("\n");

  try {
    // Create migration service
    const migrationService = new VectorStoreMigrationService(
      process.env.OPENAI_API_KEY,
      process.env.VECTOR_STORE_ID
    );

    // Run the migration
    const result = await migrationService.migrateAllFiles();

    // Verify the migration
    console.log("\n📋 Verifying migration...");
    const verification = await migrationService.verifyMigration();

    // Final summary
    console.log("\n");
    console.log("🎯 ============================================== 🎯");
    console.log("     MIGRATION SUMMARY");
    console.log("🎯 ============================================== 🎯");
    console.log(`   Total files processed: ${result.totalFiles}`);
    console.log(`   ✅ Successful: ${result.successfulMigrations}`);
    console.log(`   ❌ Failed: ${result.failedMigrations}`);
    console.log(`   ⏱️  Duration: ${(result.duration / 1000).toFixed(2)} seconds`);
    console.log(`   🔍 Verification: ${verification.match ? "PASSED ✅" : "NEEDS ATTENTION ⚠️"}`);

    if (result.errors.length > 0) {
      console.log("\n   Failed files:");
      result.errors.forEach((err) => {
        console.log(`     - ${err.filename}: ${err.error}`);
      });
    }

    console.log("🎯 ============================================== 🎯");
    console.log("\n");

    if (result.failedMigrations === 0 && verification.match) {
      console.log("🎉 PERFECT MIGRATION! Your vector store is now in Supabase!");
      console.log("🚀 Next step: Update the orchestrator to use Supabase!");
    } else if (result.failedMigrations > 0) {
      console.log("⚠️  Some files failed to migrate. You may want to retry them.");
    }

    process.exit(result.failedMigrations === 0 ? 0 : 1);
  } catch (error) {
    console.error("\n❌ Migration failed with error:", error);
    process.exit(1);
  }
}

// Run the migration
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
