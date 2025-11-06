#!/usr/bin/env node

/**
 * Deduplicate AOMA Legacy Embed URLs
 * 
 * Problem: Same servlet chain appears 50-100 times with different legacy-embed IDs
 * Solution: Keep newest version of each servlet chain, delete duplicates
 * Expected: 1000 docs → ~250-300 unique pages
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deduplicateLegacyEmbeds(dryRun = true) {
  console.log("🧹 AOMA Legacy Embed Deduplication\n");
  console.log(`Mode: ${dryRun ? "DRY RUN (no changes)" : "LIVE (will delete duplicates)"}\n`);
  console.log("═".repeat(70) + "\n");

  try {
    // Step 1: Get ALL firecrawl docs (with pagination)
    console.log("1️⃣ Fetching all firecrawl documents...");
    
    let allDocs = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: page, error: fetchError } = await supabase
        .from("siam_vectors")
        .select("id, source_id, created_at, metadata")
        .eq("source_type", "firecrawl")
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);

      if (fetchError) {
        throw new Error(`Failed to fetch documents: ${fetchError.message}`);
      }

      allDocs.push(...page);
      console.log(`   📄 Fetched ${page.length} docs (total: ${allDocs.length})`);

      hasMore = page.length === pageSize;
      from += pageSize;
    }

    console.log(`   ✅ Found ${allDocs.length} firecrawl documents total\n`);

    // Step 2: Group by canonical URL
    console.log("2️⃣ Grouping by canonical servlet chain...");
    
    const groups = {};
    const legacyEmbedPattern = /\/legacy-embed\/[A-Z0-9]+\//;

    allDocs.forEach((doc) => {
      if (legacyEmbedPattern.test(doc.source_id)) {
        // Legacy embed URL - normalize
        const canonical = doc.source_id.replace(legacyEmbedPattern, "/legacy-embed/CANONICAL/");
        
        if (!groups[canonical]) {
          groups[canonical] = [];
        }
        groups[canonical].push(doc);
      } else {
        // Modern URL - keep as-is
        if (!groups[doc.source_id]) {
          groups[doc.source_id] = [];
        }
        groups[doc.source_id].push(doc);
      }
    });

    const totalGroups = Object.keys(groups).length;
    const duplicateGroups = Object.values(groups).filter((docs) => docs.length > 1);

    console.log(`   ✅ Found ${totalGroups} unique pages`);
    console.log(`   ⚠️  Found ${duplicateGroups.length} pages with duplicates\n`);

    // Step 3: Identify duplicates to remove
    console.log("3️⃣ Identifying duplicates to remove...\n");

    const toDelete = [];
    const toKeep = [];
    const duplicateAnalysis = [];

    Object.entries(groups).forEach(([canonical, docs]) => {
      if (docs.length > 1) {
        // Multiple versions - keep newest, delete rest
        const sorted = [...docs].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        toKeep.push(sorted[0]);
        toDelete.push(...sorted.slice(1));

        duplicateAnalysis.push({
          canonicalUrl: canonical,
          totalVersions: docs.length,
          keeping: sorted[0].id,
          deleting: sorted.slice(1).map((d) => d.id),
        });

        // Log top 10 duplicate groups
        if (duplicateAnalysis.length <= 10) {
          console.log(`   📌 ${canonical}`);
          console.log(`      Versions: ${docs.length}`);
          console.log(`      Keep: ${sorted[0].source_id.substring(0, 80)}...`);
          console.log(`      Delete: ${sorted.length - 1} duplicates`);
        }
      } else {
        // Only one version - keep it
        toKeep.push(docs[0]);
      }
    });

    if (duplicateAnalysis.length > 10) {
      console.log(`   ... and ${duplicateAnalysis.length - 10} more duplicate groups`);
    }

    console.log("\n" + "═".repeat(70));
    console.log("\n📊 DEDUPLICATION SUMMARY\n");
    console.log(`Total Documents:        ${allDocs.length}`);
    console.log(`Unique Pages:           ${totalGroups}`);
    console.log(`Pages with Duplicates:  ${duplicateGroups.length}`);
    console.log(`Documents to Keep:      ${toKeep.length}`);
    console.log(`Documents to Delete:    ${toDelete.length}`);
    console.log(`Reduction:              ${((toDelete.length / allDocs.length) * 100).toFixed(1)}%`);

    // Storage savings
    const avgSize = allDocs.reduce((sum, d) => sum + (d.metadata?.contentLength || 0), 0) / allDocs.length;
    const storageReduction = (toDelete.length * avgSize) / 1024 / 1024;
    console.log(`Storage Savings:        ${storageReduction.toFixed(1)} MB`);

    console.log("\n" + "═".repeat(70) + "\n");

    // Step 4: Delete duplicates (if not dry run)
    if (!dryRun) {
      console.log("4️⃣ Deleting duplicates...\n");

      const deleteIds = toDelete.map((d) => d.id);
      const batchSize = 100;
      let deleted = 0;

      for (let i = 0; i < deleteIds.length; i += batchSize) {
        const batch = deleteIds.slice(i, i + batchSize);

        const { error: deleteError } = await supabase
          .from("siam_vectors")
          .delete()
          .in("id", batch);

        if (deleteError) {
          console.error(`   ❌ Batch ${Math.floor(i / batchSize) + 1} failed: ${deleteError.message}`);
        } else {
          deleted += batch.length;
          console.log(`   ✅ Batch ${Math.floor(i / batchSize) + 1}: Deleted ${batch.length} docs (total: ${deleted}/${deleteIds.length})`);
        }
      }

      console.log(`\n✅ Deduplication complete! Deleted ${deleted} duplicate documents.\n`);
    } else {
      console.log("ℹ️  DRY RUN MODE - No changes made");
      console.log("   Run with --live flag to actually delete duplicates\n");
    }

    // Step 5: Export analysis
    const outputPath = path.join(__dirname, "../docs/deduplication-analysis.json");
    fs.writeFileSync(
      outputPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          dryRun,
          summary: {
            totalDocs: allDocs.length,
            uniquePages: totalGroups,
            duplicatePages: duplicateGroups.length,
            toKeep: toKeep.length,
            toDelete: toDelete.length,
            reductionPercentage: ((toDelete.length / allDocs.length) * 100).toFixed(1),
            storageSavingsMB: storageReduction.toFixed(1),
          },
          duplicateGroups: duplicateAnalysis,
        },
        null,
        2
      )
    );

    console.log(`📄 Analysis exported to: ${outputPath}\n`);

    return {
      totalDocs: allDocs.length,
      uniquePages: totalGroups,
      toDelete: toDelete.length,
      deleted: !dryRun,
    };
  } catch (error) {
    console.error("\n❌ Deduplication failed:", error);
    throw error;
  }
}

// Parse command line args
const args = process.argv.slice(2);
const dryRun = !args.includes("--live");

// Run
if (require.main === module) {
  deduplicateLegacyEmbeds(dryRun)
    .then((result) => {
      console.log("✨ Deduplication script complete!");
      if (dryRun) {
        console.log("\n💡 To actually delete duplicates, run:");
        console.log("   node scripts/deduplicate-aoma-legacy-embeds.js --live\n");
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

module.exports = { deduplicateLegacyEmbeds };

