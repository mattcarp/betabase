#!/usr/bin/env ts-node

/**
 * Quick database status check
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkStatus() {
  console.log("🔍 Checking database status...\n");

  // Check siam_vectors
  const { data: vectors, error: vectorsError } = await supabase
    .from("siam_vectors")
    .select("source_type, count");

  if (vectorsError) {
    console.error("❌ Error checking vectors:", vectorsError.message);
  } else {
    console.log("📦 siam_vectors:");
    if (vectors && vectors.length > 0) {
      vectors.forEach((v) => console.log(`   ${v.source_type}: ${v.count} records`));
    } else {
      console.log("   No data yet");
    }
  }

  // Get total count
  const { count, error: countError } = await supabase
    .from("siam_vectors")
    .select("*", { count: "exact", head: true });

  if (!countError) {
    console.log(`\n📊 Total vectors: ${count || 0}`);
  }

  // Check other Sony Music tables
  const tables = ["wiki_documents", "jira_tickets", "jira_ticket_embeddings"];

  for (const table of tables) {
    const { count: tableCount } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (tableCount !== null) {
      console.log(`📦 ${table}: ${tableCount} records`);
    }
  }
}

checkStatus().catch(console.error);
