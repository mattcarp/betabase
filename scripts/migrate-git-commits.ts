#!/usr/bin/env node

/**
 * Git Commits to Supabase Vector Migration Script
 * Vectorizes git commit history and stores in unified vector store
 *
 * Usage: npm run migrate:git-commits
 *
 * Part of Task #69: Implement Git Commit Vectorization
 */

// Load environment variables FIRST
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Initialize services manually to avoid import-time errors
console.log("Loading services...");

async function getServices() {
  // Verify environment variables are available before importing
  const requiredEnvVars = [
    "OPENAI_API_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
  }

  const { getGitVectorService } = await import("../src/services/gitVectorService");
  return { getGitVectorService };
}

interface MigrationOptions {
  repositoryPath?: string;
  maxCommits?: number;
  since?: string;
  branch?: string;
  skipExisting?: boolean;
  dryRun?: boolean;
}

async function main() {
  console.log("\n");
  console.log("🚀 ============================================ 🚀");
  console.log("     GIT COMMITS → SUPABASE VECTOR MIGRATION");
  console.log("     Making git history searchable with AI!");
  console.log("🚀 ============================================ 🚀");
  console.log("\n");

  // Check required environment variables
  const requiredEnvVars = [
    "OPENAI_API_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingVars.forEach((varName) => console.error(`   - ${varName}`));
    console.error("\nPlease set these in your .env.local file");
    process.exit(1);
  }

  console.log("✅ Environment variables loaded");
  console.log(`📍 Repository: ${process.cwd()}`);
  console.log(`📍 Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log("\n");

  // Parse command line arguments
  const options: MigrationOptions = {
    repositoryPath: process.cwd(),
    maxCommits: parseInt(process.env.GIT_MAX_COMMITS || "500"),
    since: process.env.GIT_SINCE || "6 months ago", // Default to last 6 months
    branch: process.env.GIT_BRANCH || "HEAD",
    skipExisting: process.env.GIT_SKIP_EXISTING === "true",
    dryRun: process.argv.includes("--dry-run"),
  };

  console.log("⚙️  Migration Configuration:");
  console.log(`   📂 Repository: ${options.repositoryPath}`);
  console.log(`   📊 Max commits: ${options.maxCommits}`);
  console.log(`   📅 Since: ${options.since}`);
  console.log(`   🌿 Branch: ${options.branch}`);
  console.log(`   🔄 Skip existing: ${options.skipExisting}`);
  console.log(`   🧪 Dry run: ${options.dryRun}`);
  console.log("\n");

  if (options.dryRun) {
    console.log("🧪 DRY RUN MODE - No data will be written to Supabase");
  } else {
    console.log("⚠️  This will:");
    console.log("   1. Extract git commit history from the repository");
    console.log("   2. Generate AI embeddings for each commit");
    console.log("   3. Store vectorized commits in Supabase");
    console.log("   4. Enable semantic search of your git history! 🔍");
  }

  console.log("\nPress Ctrl+C to cancel, or wait 3 seconds to continue...");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log("\n🚀 LET'S VECTORIZE THOSE COMMITS!\n");

  try {
    // Import services after environment verification
    const { getGitVectorService } = await getServices();
    const gitVectorService = getGitVectorService();

    // Extract commits first
    console.log("📥 Extracting git commits...");
    const commits = await gitVectorService.extractGitCommits(options.repositoryPath!, {
      maxCommits: options.maxCommits,
      since: options.since,
      branch: options.branch,
    });

    if (commits.length === 0) {
      console.log("⚠️  No commits found to process");
      process.exit(0);
    }

    console.log(`✅ Extracted ${commits.length} commits`);
    console.log(`📅 Date range: ${commits[commits.length - 1]?.date} → ${commits[0]?.date}`);
    console.log(
      `👥 Authors: ${[...new Set(commits.map((c) => c.author))].length} unique contributors`
    );

    // Show sample of commits
    console.log("\n📋 Sample commits to be vectorized:");
    commits.slice(0, 3).forEach((commit) => {
      console.log(
        `   ${commit.hash.substring(0, 7)} - ${commit.message.substring(0, 60)}${commit.message.length > 60 ? "..." : ""} (${commit.author})`
      );
    });
    if (commits.length > 3) {
      console.log(`   ... and ${commits.length - 3} more commits`);
    }

    if (options.dryRun) {
      console.log("\n🧪 DRY RUN COMPLETE - Would have vectorized", commits.length, "commits");
      console.log("Run without --dry-run to execute the migration");
      process.exit(0);
    }

    console.log("\n🔄 Starting vectorization...");

    // Perform the migration
    const result = await gitVectorService.vectorizeRepository(options.repositoryPath!, {
      maxCommits: options.maxCommits,
      since: options.since,
      branch: options.branch,
      skipExisting: options.skipExisting,
    });

    // Final results
    console.log("\n");
    console.log("🎯 ============================================ 🎯");
    console.log("     MIGRATION COMPLETE!");
    console.log("🎯 ============================================ 🎯");
    console.log(`   📊 Total commits processed: ${result.totalCommits}`);
    console.log(`   ✅ Successfully vectorized: ${result.successfulVectorizations}`);
    console.log(`   ❌ Failed: ${result.failedVectorizations}`);
    console.log(`   ⏱️  Duration: ${(result.duration / 1000).toFixed(2)} seconds`);
    console.log(
      `   🏆 Success rate: ${((result.successfulVectorizations / result.totalCommits) * 100).toFixed(1)}%`
    );

    if (result.errors.length > 0) {
      console.log("\n❌ Failed commits:");
      result.errors.slice(0, 5).forEach((err) => {
        console.log(`     ${err.commitHash}: ${err.error}`);
      });
      if (result.errors.length > 5) {
        console.log(`     ... and ${result.errors.length - 5} more errors`);
      }
    }

    console.log("🎯 ============================================ 🎯");
    console.log("\n");

    if (result.failedVectorizations === 0) {
      console.log("🎉 PERFECT MIGRATION! Your git history is now searchable!");
      console.log("💡 Try searching with: 'Show me commits about authentication'");
      console.log("💡 Or: 'Find commits by John Doe in the last month'");
    } else if (result.successfulVectorizations > 0) {
      console.log("✅ Migration mostly successful!");
      console.log(`🎉 ${result.successfulVectorizations} commits are now searchable!`);
    } else {
      console.log("❌ Migration failed - no commits were vectorized");
    }

    // Show how to search
    console.log("\n🔍 Next steps:");
    console.log(
      "   1. Use the AOMA orchestrator to search: 'Find commits about user authentication'"
    );
    console.log("   2. Query directly: gitVectorService.searchCommits('bug fix')");
    console.log("   3. Check stats: gitVectorService.getGitVectorStats()");

    process.exit(result.failedVectorizations === 0 ? 0 : 1);
  } catch (error) {
    console.error("\n💥 Migration failed with error:");
    console.error(error);

    const err = error as Error;
    // Check for common issues
    if (err.message.includes("git")) {
      console.error("\n💡 This might be a git-related issue:");
      console.error("   - Make sure you're in a git repository");
      console.error("   - Check that git is installed and accessible");
      console.error("   - Verify the repository path is correct");
    } else if (err.message.includes("Supabase") || err.message.includes("database")) {
      console.error("\n💡 This might be a database issue:");
      console.error("   - Check your Supabase URL and API keys");
      console.error("   - Verify the database migration has been run");
      console.error("   - Test database connectivity");
    } else if (err.message.includes("OpenAI") || err.message.includes("embedding")) {
      console.error("\n💡 This might be an OpenAI API issue:");
      console.error("   - Check your OpenAI API key");
      console.error("   - Verify you have sufficient API quota");
      console.error("   - Try reducing the max commits to process");
    }

    process.exit(1);
  }
}

// Add some helpful environment variable examples
if (process.argv.includes("--help")) {
  console.log("\n📖 Git Commits Migration Help");
  console.log("\nEnvironment variables:");
  console.log("  GIT_MAX_COMMITS=500     # Limit number of commits to process");
  console.log("  GIT_SINCE='1 year ago'  # Only commits since this date");
  console.log("  GIT_BRANCH='main'       # Branch to process");
  console.log("  GIT_SKIP_EXISTING=true  # Skip commits already vectorized");
  console.log("\nUsage:");
  console.log("  npm run migrate:git-commits           # Normal migration");
  console.log("  npm run migrate:git-commits --dry-run # Preview without changes");
  console.log("  npm run migrate:git-commits --help    # Show this help");
  process.exit(0);
}

// Run the migration
main().catch((error) => {
  console.error("💥 Unhandled error:", error);
  process.exit(1);
});
