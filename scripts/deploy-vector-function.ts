#!/usr/bin/env tsx
/**
 * Deploy match_aoma_vectors function to Supabase
 * This script deploys the vector search function required for fast AOMA queries
 */

import { supabaseAdmin } from "../src/lib/supabase";
import * as fs from "fs";
import * as path from "path";

async function deployVectorFunction() {
  console.log("🚀 Deploying match_aoma_vectors function to Supabase...");

  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not initialized");
  }

  // Read the SQL file
  const sqlPath = path.join(__dirname, "../sql/create-match-aoma-vectors-function.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  console.log("📄 Read SQL file:", sqlPath);
  console.log(`📏 SQL length: ${sql.length} characters`);

  try {
    // Execute the SQL
    const { data, error } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: sql,
    });

    if (error) {
      // Try direct query execution if exec_sql doesn't exist
      console.log("⚠️  exec_sql RPC not found, trying direct query...");

      const { error: queryError } = await (supabaseAdmin as any)
        .from("_sql")
        .insert({ query: sql });

      if (queryError) {
        throw queryError;
      }
    }

    console.log("✅ Successfully deployed match_aoma_vectors function!");
    console.log("📊 Response:", data);
  } catch (error) {
    console.error("❌ Failed to deploy function:", error);
    console.error("\n📋 Please manually execute the SQL in Supabase SQL Editor:");
    console.error("https://supabase.com/dashboard/project/kfxetwuuzljhybfgmpuc/sql/new");
    console.error("\n💡 The SQL has been copied to your clipboard.");
    process.exit(1);
  }
}

deployVectorFunction().catch(console.error);
