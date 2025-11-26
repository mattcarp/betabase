/**
 * PHASE 2: Re-embed ALL documents using Gemini
 * 
 * REVISED: Now handles 13 tables, 37,452 embeddings
 * 
 * This script:
 * - Processes tables in priority order (largest first)
 * - Is resumable (tracks progress in database)
 * - Respects rate limits
 * - Can be stopped and restarted safely
 * 
 * Usage: 
 *   npx tsx migrations/phase2-reembed-gemini.ts
 *   npx tsx migrations/phase2-reembed-gemini.ts --table=jira_ticket_embeddings
 *   npx tsx migrations/phase2-reembed-gemini.ts --batch-size=100
 */

import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const googleApiKey = process.env.GOOGLE_API_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

if (!googleApiKey) {
  console.error("Missing GOOGLE_API_KEY for Gemini embeddings");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(googleApiKey);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

// ALL table configurations - ordered by size (largest first)
interface TableConfig {
  table: string;
  idColumn: string;
  embeddingColumn: string;
  geminiColumn: string;
  contentExtractor: (row: any) => string;
  estimatedRows: number;
}

const TABLE_CONFIGS: TableConfig[] = [
  {
    table: "jira_ticket_embeddings",
    idColumn: "id",
    embeddingColumn: "embedding",
    geminiColumn: "embedding_gemini",
    contentExtractor: (row) => row.summary || "",
    estimatedRows: 16563,
  },
  {
    table: "siam_vectors",
    idColumn: "id",
    embeddingColumn: "embedding",
    geminiColumn: "embedding_gemini",
    contentExtractor: (row) => row.content || "",
    estimatedRows: 15245,
  },
  {
    table: "git_file_embeddings",
    idColumn: "id",
    embeddingColumn: "embedding",
    geminiColumn: "embedding_gemini",
    // This table has content=NULL, use file_path + metadata as fallback
    contentExtractor: (row) => {
      if (row.content) return row.content;
      // Fallback to file path info
      const parts = [row.file_path];
      if (row.metadata?.description) parts.push(row.metadata.description);
      return parts.filter(Boolean).join(" | ");
    },
    estimatedRows: 4091,
  },
  {
    table: "jira_tickets",
    idColumn: "id",
    embeddingColumn: "embedding",
    geminiColumn: "embedding_gemini",
    contentExtractor: (row) => [row.key, row.summary, row.description].filter(Boolean).join(" | "),
    estimatedRows: 1406,
  },
  {
    table: "crawled_pages",
    idColumn: "id",
    embeddingColumn: "content_embedding",
    geminiColumn: "embedding_gemini",
    contentExtractor: (row) => row.content || row.markdown_content || "",
    estimatedRows: 916,
  },
  {
    table: "code_files",
    idColumn: "id",
    embeddingColumn: "embedding",
    geminiColumn: "embedding_gemini",
    contentExtractor: (row) => row.content || "",
    estimatedRows: 503,
  },
  {
    table: "wiki_documents",
    idColumn: "id",
    embeddingColumn: "embedding",
    geminiColumn: "embedding_gemini",
    contentExtractor: (row) => row.content || "",
    estimatedRows: 394,
  },
  {
    table: "app_pages",
    idColumn: "id",
    embeddingColumn: "embedding",
    geminiColumn: "embedding_gemini",
    contentExtractor: (row) => row.content || "",
    estimatedRows: 128,
  },
  {
    table: "git_commits",
    idColumn: "id",
    embeddingColumn: "embedding",
    geminiColumn: "embedding_gemini",
    contentExtractor: (row) => [row.message, row.author, row.files_changed].filter(Boolean).join(" | "),
    estimatedRows: 99,
  },
  {
    table: "test_results",
    idColumn: "id",
    embeddingColumn: "embedding",
    geminiColumn: "embedding_gemini",
    contentExtractor: (row) => [row.test_name, row.description, row.result].filter(Boolean).join(" | "),
    estimatedRows: 10,
  },
  {
    table: "siam_git_files",
    idColumn: "id",
    embeddingColumn: "embedding",
    geminiColumn: "embedding_gemini",
    contentExtractor: (row) => row.content || "",
    estimatedRows: 3,
  },
  {
    table: "siam_jira_tickets",
    idColumn: "id",
    embeddingColumn: "embedding",
    geminiColumn: "embedding_gemini",
    contentExtractor: (row) => row.content || "",
    estimatedRows: 2,
  },
  {
    table: "crawler_documents",
    idColumn: "id",
    embeddingColumn: "embedding",
    geminiColumn: "embedding_gemini",
    contentExtractor: (row) => row.content || row.markdown_content || "",
    estimatedRows: 1,
  },
];

async function generateGeminiEmbedding(text: string): Promise<number[]> {
  const truncated = text.slice(0, 8000); // Gemini limit
  const result = await embeddingModel.embedContent(truncated);
  return result.embedding.values;
}

async function updateProgress(table: string, migrated: number, failed: number, status: string, lastId?: string) {
  await supabase
    .from("embedding_migration_progress")
    .update({
      migrated_rows: migrated,
      failed_rows: failed,
      status,
      last_processed_id: lastId,
      updated_at: new Date().toISOString(),
      ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}),
      ...(status === "in_progress" && migrated === 0 ? { started_at: new Date().toISOString() } : {}),
    })
    .eq("table_name", table);
}

async function migrateTable(config: TableConfig, batchSize: number = 50) {
  const { table, idColumn, embeddingColumn, geminiColumn, contentExtractor } = config;
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Starting migration for: ${table}`);
  console.log(`${"=".repeat(60)}`);

  // Get current progress
  const { data: progress } = await supabase
    .from("embedding_migration_progress")
    .select("*")
    .eq("table_name", table)
    .single();

  if (progress?.status === "completed") {
    console.log(`✅ ${table} already completed, skipping.`);
    return;
  }

  let migrated = progress?.migrated_rows || 0;
  let failed = progress?.failed_rows || 0;
  const lastProcessedId = progress?.last_processed_id;

  await updateProgress(table, migrated, failed, "in_progress");

  // Count rows that need embedding
  const { count: pendingCount } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .not(embeddingColumn, "is", null)
    .is(geminiColumn, null);

  console.log(`Rows pending: ${pendingCount}`);

  // Process in batches
  let processedInRun = 0;
  
  while (true) {
    // Build query for rows that have old embedding but no Gemini embedding
    let query = supabase
      .from(table)
      .select("*")
      .not(embeddingColumn, "is", null)
      .is(geminiColumn, null)
      .order(idColumn, { ascending: true })
      .limit(batchSize);

    const { data: rows, error } = await query;

    if (error) {
      console.error(`Error fetching rows from ${table}:`, error.message);
      await updateProgress(table, migrated, failed, "failed");
      return;
    }

    if (!rows || rows.length === 0) {
      console.log(`\n✅ ${table} migration complete!`);
      await updateProgress(table, migrated, failed, "completed");
      break;
    }

    console.log(`\nProcessing batch of ${rows.length} rows...`);

    for (const row of rows) {
      try {
        const content = contentExtractor(row);
        
        if (!content || content.trim().length === 0) {
          console.log(`  ⚠️  Skipping ${row[idColumn]} - no content`);
          failed++;
          continue;
        }

        const embedding = await generateGeminiEmbedding(content);
        
        if (embedding.length !== 768) {
          throw new Error(`Unexpected embedding dimension: ${embedding.length}`);
        }

        // Update the row with new embedding
        const updateData: any = { [geminiColumn]: embedding };
        
        // Add embedding_source if column exists
        try {
          updateData.embedding_source = "gemini";
        } catch {}

        const { error: updateError } = await supabase
          .from(table)
          .update(updateData)
          .eq(idColumn, row[idColumn]);

        if (updateError) {
          throw updateError;
        }

        migrated++;
        processedInRun++;
        process.stdout.write(`\r  Progress: ${migrated} migrated, ${failed} failed (${processedInRun} this run)`);

      } catch (err: any) {
        failed++;
        console.error(`\n  ❌ Failed ${row[idColumn]}:`, err.message || err);
      }

      // Small delay to respect rate limits (Gemini: 1500 RPM = 25 RPS)
      await new Promise(r => setTimeout(r, 50));
    }

    // Update progress after each batch
    const lastId = String(rows[rows.length - 1][idColumn]);
    await updateProgress(table, migrated, failed, "in_progress", lastId);
  }

  console.log(`\n${table}: ${migrated} migrated, ${failed} failed`);
}

async function main() {
  const args = process.argv.slice(2);
  const tableArg = args.find(a => a.startsWith("--table="))?.split("=")[1];
  const batchSize = parseInt(args.find(a => a.startsWith("--batch-size="))?.split("=")[1] || "50");

  console.log("\n" + "=".repeat(60));
  console.log("SIAM Embedding Migration: OpenAI (1536) -> Gemini (768)");
  console.log("=".repeat(60));
  console.log(`Total tables: 13`);
  console.log(`Total embeddings: ~37,452`);
  console.log(`Batch size: ${batchSize}`);
  console.log(`Target table: ${tableArg || "ALL"}`);
  console.log("");

  if (tableArg) {
    const config = TABLE_CONFIGS.find(c => c.table === tableArg);
    if (!config) {
      console.error(`Unknown table: ${tableArg}`);
      console.log("Available tables:");
      TABLE_CONFIGS.forEach(c => console.log(`  - ${c.table} (~${c.estimatedRows} rows)`));
      process.exit(1);
    }
    await migrateTable(config, batchSize);
  } else {
    // Process all tables in order
    for (const config of TABLE_CONFIGS) {
      await migrateTable(config, batchSize);
    }
  }

  // Print final summary
  console.log("\n" + "=".repeat(60));
  console.log("MIGRATION SUMMARY");
  console.log("=".repeat(60));

  const { data: summary } = await supabase
    .from("embedding_migration_progress")
    .select("*")
    .order("total_rows", { ascending: false });

  if (summary) {
    console.table(summary.map(s => ({
      table: s.table_name,
      total: s.total_rows,
      migrated: s.migrated_rows,
      failed: s.failed_rows,
      status: s.status
    })));

    const totalMigrated = summary.reduce((sum, s) => sum + (s.migrated_rows || 0), 0);
    const totalFailed = summary.reduce((sum, s) => sum + (s.failed_rows || 0), 0);
    console.log(`\nTotal migrated: ${totalMigrated}`);
    console.log(`Total failed: ${totalFailed}`);
  }
}

main().catch(console.error);
