import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES_TO_BACKUP = [
  "siam_vectors",
  "jira_tickets", 
  "crawled_pages",
  "wiki_documents",
  "code_files",
  "app_pages",
  "git_commits",
  "test_results",
  "beta_base_scenarios",
];

async function backupTable(tableName: string, backupDir: string) {
  console.log(`\nBacking up ${tableName}...`);
  
  // Get count first
  const { count } = await supabase
    .from(tableName)
    .select("*", { count: "exact", head: true });
  
  console.log(`  Total rows: ${count}`);
  
  if (!count || count === 0) {
    console.log(`  Skipping empty table`);
    return { table: tableName, rows: 0, file: null };
  }
  
  // Fetch in batches of 1000
  const batchSize = 1000;
  const allRows: any[] = [];
  
  for (let offset = 0; offset < count; offset += batchSize) {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .range(offset, offset + batchSize - 1);
    
    if (error) {
      console.error(`  Error at offset ${offset}:`, error.message);
      continue;
    }
    
    if (data) {
      allRows.push(...data);
      console.log(`  Fetched ${allRows.length} / ${count} rows`);
    }
  }
  
  // Save to JSON file
  const filename = `${backupDir}/${tableName}.json`;
  fs.writeFileSync(filename, JSON.stringify(allRows, null, 2));
  console.log(`  Saved to ${filename}`);
  
  return { table: tableName, rows: allRows.length, file: filename };
}

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backupDir = `/Users/matt/Documents/Projects/siam/backups/backup-${timestamp}`;
  
  console.log("=== SIAM Database Backup ===\n");
  console.log(`Backup directory: ${backupDir}`);
  console.log(`Supabase URL: ${supabaseUrl}`);
  
  // Create backup directory
  fs.mkdirSync(backupDir, { recursive: true });
  
  const results: any[] = [];
  
  for (const table of TABLES_TO_BACKUP) {
    try {
      const result = await backupTable(table, backupDir);
      results.push(result);
    } catch (err) {
      console.error(`  Failed to backup ${table}:`, err);
      results.push({ table, error: String(err) });
    }
  }
  
  // Save manifest
  const manifest = {
    timestamp: new Date().toISOString(),
    supabaseUrl,
    tables: results,
    totalRows: results.reduce((sum, r) => sum + (r.rows || 0), 0),
  };
  
  fs.writeFileSync(`${backupDir}/manifest.json`, JSON.stringify(manifest, null, 2));
  
  console.log("\n=== Backup Summary ===\n");
  console.table(results);
  console.log(`\nTotal rows backed up: ${manifest.totalRows}`);
  console.log(`Manifest saved to: ${backupDir}/manifest.json`);
}

main().catch(console.error);
