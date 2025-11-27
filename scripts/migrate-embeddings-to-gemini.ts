#!/usr/bin/env tsx
/**
 * Embedding Migration Script: OpenAI → Gemini
 * 
 * Migrates existing OpenAI embeddings (1536d) to Gemini embeddings (768d)
 * Runs in batches with progress tracking
 * 
 * Usage:
 *   tsx scripts/migrate-embeddings-to-gemini.ts [--dry-run] [--batch-size=100]
 */

import { supabaseAdmin } from "../src/lib/supabase";
import { getGeminiEmbeddingService } from "../src/services/geminiEmbeddingService";

interface MigrationStats {
  organization: string;
  division: string;
  app_under_test: string;
  source_type: string;
  total: number;
  migrated: number;
  failed: number;
  skipped: number;
}

interface MigrationOptions {
  dryRun: boolean;
  batchSize: number;
  organization?: string;
  division?: string;
  appUnderTest?: string;
  sourceTypes?: string[];
}

async function migrateEmbeddings(options: MigrationOptions) {
  const { dryRun, batchSize, organization, division, appUnderTest, sourceTypes } = options;
  
  console.log("🚀 Starting Gemini Embedding Migration");
  console.log("Configuration:", {
    dryRun,
    batchSize,
    filters: { organization, division, appUnderTest, sourceTypes },
  });
  
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not available. Check SUPABASE_SERVICE_ROLE_KEY");
  }
  
  const geminiService = getGeminiEmbeddingService();
  
  // Build filter query
  let query = supabaseAdmin
    .from("siam_vectors")
    .select("*")
    .is("embedding_gemini", null) // Only migrate docs without Gemini embeddings
    .not("embedding", "is", null); // Must have OpenAI embedding
  
  if (organization) query = query.eq("organization", organization);
  if (division) query = query.eq("division", division);
  if (appUnderTest) query = query.eq("app_under_test", appUnderTest);
  if (sourceTypes) query = query.in("source_type", sourceTypes);
  
  // Get total count
  const { count, error: countError } = await supabaseAdmin
    .from("siam_vectors")
    .select("*", { count: "exact", head: true })
    .is("embedding_gemini", null)
    .not("embedding", "is", null);
  
  if (countError) {
    throw new Error(`Failed to count documents: ${countError.message}`);
  }
  
  console.log(`\n📊 Found ${count} documents to migrate\n`);
  
  if (dryRun) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n");
  }
  
  // Get all documents in batches
  let offset = 0;
  let totalMigrated = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  
  const statsByContext = new Map<string, MigrationStats>();
  
  while (true) {
    const { data: documents, error } = await query
      .range(offset, offset + batchSize - 1);
    
    if (error) {
      console.error("❌ Error fetching documents:", error);
      throw error;
    }
    
    if (!documents || documents.length === 0) {
      break;
    }
    
    console.log(`\n📦 Processing batch: ${offset + 1} - ${offset + documents.length}`);
    
    // Process batch
    for (const doc of documents) {
      try {
        const contextKey = `${doc.organization}/${doc.division}/${doc.app_under_test}/${doc.source_type}`;
        
        if (!statsByContext.has(contextKey)) {
          statsByContext.set(contextKey, {
            organization: doc.organization,
            division: doc.division,
            app_under_test: doc.app_under_test,
            source_type: doc.source_type,
            total: 0,
            migrated: 0,
            failed: 0,
            skipped: 0,
          });
        }
        
        const stats = statsByContext.get(contextKey)!;
        stats.total++;
        
        // Skip if no content
        if (!doc.content || doc.content.trim().length === 0) {
          stats.skipped++;
          totalSkipped++;
          continue;
        }
        
        // Generate Gemini embedding
        const geminiEmbedding = await geminiService.generateEmbedding(doc.content);
        
        if (!dryRun) {
          // Update document with Gemini embedding
          const { error: updateError } = await supabaseAdmin
            .from("siam_vectors")
            .update({
              embedding_gemini: geminiEmbedding,
              embedding_source: "gemini",
              updated_at: new Date().toISOString(),
            })
            .eq("id", doc.id);
          
          if (updateError) {
            throw updateError;
          }
        }
        
        stats.migrated++;
        totalMigrated++;
        
        // Progress indicator
        if (totalMigrated % 10 === 0) {
          process.stdout.write(".");
        }
        
      } catch (error) {
        console.error(`\n❌ Failed to migrate document ${doc.id}:`, error);
        
        const contextKey = `${doc.organization}/${doc.division}/${doc.app_under_test}/${doc.source_type}`;
        const stats = statsByContext.get(contextKey);
        if (stats) {
          stats.failed++;
        }
        totalFailed++;
      }
    }
    
    offset += batchSize;
    
    // Update migration status in database
    if (!dryRun) {
      for (const [_, stats] of statsByContext) {
        const status = 
          stats.failed > 0 ? "failed" :
          stats.migrated === stats.total ? "completed" :
          "in_progress";
        
        await supabaseAdmin.from("embedding_migration_status").upsert({
          organization: stats.organization,
          division: stats.division,
          app_under_test: stats.app_under_test,
          source_type: stats.source_type,
          total_count: stats.total,
          migrated_count: stats.migrated,
          failed_count: stats.failed,
          status,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "organization,division,app_under_test,source_type",
        });
      }
    }
  }
  
  // Final summary
  console.log("\n\n📊 Migration Summary:");
  console.log("=".repeat(60));
  console.log(`Total Documents: ${count}`);
  console.log(`✅ Migrated: ${totalMigrated}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`⏭️  Skipped: ${totalSkipped}`);
  console.log("=".repeat(60));
  
  console.log("\n📈 Breakdown by Context:");
  for (const [context, stats] of statsByContext) {
    console.log(`\n${context}:`);
    console.log(`  Total: ${stats.total}`);
    console.log(`  Migrated: ${stats.migrated}`);
    console.log(`  Failed: ${stats.failed}`);
    console.log(`  Skipped: ${stats.skipped}`);
  }
  
  if (dryRun) {
    console.log("\n🔍 DRY RUN COMPLETE - No changes were made");
  } else {
    console.log("\n✅ MIGRATION COMPLETE!");
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: MigrationOptions = {
  dryRun: args.includes("--dry-run"),
  batchSize: 100,
};

const batchSizeArg = args.find(arg => arg.startsWith("--batch-size="));
if (batchSizeArg) {
  options.batchSize = parseInt(batchSizeArg.split("=")[1], 10);
}

const orgArg = args.find(arg => arg.startsWith("--organization="));
if (orgArg) {
  options.organization = orgArg.split("=")[1];
}

const divArg = args.find(arg => arg.startsWith("--division="));
if (divArg) {
  options.division = divArg.split("=")[1];
}

const appArg = args.find(arg => arg.startsWith("--app="));
if (appArg) {
  options.appUnderTest = appArg.split("=")[1];
}

// Run migration
migrateEmbeddings(options)
  .then(() => {
    console.log("\n🎉 Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration failed:", error);
    process.exit(1);
  });

