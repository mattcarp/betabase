#!/usr/bin/env ts-node

/**
 * Clean Duplicates Script
 *
 * Finds and removes duplicate vectors from the database
 * Uses the DeduplicationService to identify duplicates
 */

import { config } from "dotenv";
import { getDeduplicationService } from "@/services/deduplicationService";
import { supabase } from "@/lib/supabase";

// Load environment variables
config({ path: ".env.local" });

async function cleanDuplicates(options: {
  dryRun?: boolean;
  sourceType?: string;
  semanticThreshold?: number;
  keepNewest?: boolean;
}) {
  const { dryRun = false, sourceType, semanticThreshold = 0.95, keepNewest = true } = options;

  console.log("\n🧹 DUPLICATE CLEANING UTILITY\n");
  console.log("═".repeat(70));
  console.log(`\nOptions:`);
  console.log(`  Dry Run: ${dryRun ? "YES (no changes)" : "NO (will delete)"}`);
  console.log(`  Source Type: ${sourceType || "ALL"}`);
  console.log(`  Semantic Threshold: ${semanticThreshold}`);
  console.log(`  Keep: ${keepNewest ? "NEWEST" : "OLDEST"}`);
  console.log("\n" + "═".repeat(70) + "\n");

  // Get current counts
  console.log("📊 CURRENT STATE:\n");

  try {
    // let _query = supabase // Unused
    //   .from("aoma_unified_vectors")
    //   .select("source_type", { count: "exact", head: true });

    const { count: totalCount } = await supabase!
      .from("aoma_unified_vectors")
      .select("*", { count: "exact", head: true });

    console.log(`   Total vectors: ${totalCount || 0}`);

    // Get count by source type
    const { data: vectors } = await supabase!.from("aoma_unified_vectors").select("source_type");

    if (vectors) {
      const counts: Record<string, number> = {};
      vectors.forEach((v: any) => {
        counts[v.source_type] = (counts[v.source_type] || 0) + 1;
      });

      Object.entries(counts).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} vectors`);
      });
    }
  } catch (error: any) {
    console.error("   ❌ Failed to get current state:", error.message);
  }

  // Find duplicates
  console.log("\n🔍 FINDING DUPLICATES:\n");

  const dedupService = getDeduplicationService();

  const { duplicates, totalDuplicates } = await dedupService.findDuplicatesInDatabase({
    sourceType,
    semanticThreshold,
    keepNewest,
  });

  if (totalDuplicates === 0) {
    console.log("   ✅ No duplicates found! Database is clean.");
    return;
  }

  console.log(`   Found ${totalDuplicates} duplicates in ${duplicates.length} groups\n`);

  // Show sample duplicates
  console.log("📝 SAMPLE DUPLICATES:\n");
  duplicates.slice(0, 5).forEach((dup, index) => {
    console.log(`   Group ${index + 1}:`);
    console.log(`     Keep: ${dup.keepId}`);
    console.log(`     Remove: ${dup.removeIds.length} duplicates`);
    console.log(`     Reason: ${dup.reason}`);
  });

  if (duplicates.length > 5) {
    console.log(`   ... and ${duplicates.length - 5} more groups`);
  }

  // Remove duplicates
  if (!dryRun) {
    console.log("\n🗑️  REMOVING DUPLICATES:\n");

    const removeIds = duplicates.flatMap((dup) => dup.removeIds);
    const { removed, errors } = await dedupService.removeDuplicates(removeIds);

    console.log(`   ✅ Removed: ${removed}`);
    if (errors > 0) {
      console.log(`   ❌ Errors: ${errors}`);
    }

    // Show final counts
    console.log("\n📊 FINAL STATE:\n");

    const { count: finalCount } = await supabase!
      .from("aoma_unified_vectors")
      .select("*", { count: "exact", head: true });

    console.log(`   Total vectors: ${finalCount || 0}`);
    console.log(`   Removed: ${removed}`);
    console.log(`   Reduction: ${((removed / (finalCount! + removed)) * 100).toFixed(1)}%`);
  } else {
    console.log("\n💡 DRY RUN MODE - No changes made");
    console.log(`   Would remove ${totalDuplicates} duplicate vectors`);
    console.log(`\n   To actually remove duplicates, run without --dry-run flag`);
  }

  console.log("\n" + "═".repeat(70));
  console.log("\n✨ Duplicate cleaning complete!\n");
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: any = {
  dryRun: args.includes("--dry-run"),
  keepNewest: !args.includes("--keep-oldest"),
};

// Parse source type
const sourceTypeArg = args.find((arg) => arg.startsWith("--source="));
if (sourceTypeArg) {
  options.sourceType = sourceTypeArg.split("=")[1];
}

// Parse semantic threshold
const thresholdArg = args.find((arg) => arg.startsWith("--threshold="));
if (thresholdArg) {
  options.semanticThreshold = parseFloat(thresholdArg.split("=")[1]);
}

// Show help
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
🧹 Duplicate Cleaning Utility

Usage:
  npx ts-node scripts/clean-duplicates.ts [options]

Options:
  --dry-run              Run without making changes (preview only)
  --source=TYPE          Only check specific source type (e.g., --source=confluence)
  --threshold=N          Semantic similarity threshold (0-1, default: 0.95)
  --keep-oldest          Keep oldest instead of newest duplicates
  --help, -h             Show this help message

Examples:
  # Preview what would be removed
  npx ts-node scripts/clean-duplicates.ts --dry-run

  # Clean all duplicates
  npx ts-node scripts/clean-duplicates.ts

  # Clean only confluence duplicates
  npx ts-node scripts/clean-duplicates.ts --source=confluence

  # Use stricter similarity threshold (99%)
  npx ts-node scripts/clean-duplicates.ts --threshold=0.99

  # Keep oldest versions instead of newest
  npx ts-node scripts/clean-duplicates.ts --keep-oldest
`);
  process.exit(0);
}

// Run the cleaning
cleanDuplicates(options)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
