#!/usr/bin/env tsx

/**
 * Check all Supabase tables and their row counts
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local
config({ path: '.env.local' });

async function checkTables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials");
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log("🔍 Checking Supabase Tables...\n");
  console.log("=" .repeat(50));
  
  // List of tables to check
  const tables = [
    'aoma_unified_vectors',
    'firecrawl_analysis',
    'test_results',
    'test_runs',
    'test_executions',
    'test_knowledge_base',
    'aoma_migration_status'
  ];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: Table not found or access denied`);
      } else {
        console.log(`📊 ${table}: ${count?.toLocaleString() || 0} rows`);
      }
    } catch (e) {
      console.log(`❌ ${table}: Error checking table`);
    }
  }
  
  // Try a direct query to check if vectors exist with different approach
  console.log("\n" + "=" .repeat(50));
  console.log("🔍 Checking Vector Data Directly...\n");
  
  try {
    const { data: vectors, error } = await supabase
      .from('aoma_unified_vectors')
      .select('id, source_type, created_at')
      .limit(5);
    
    if (error) {
      console.log("❌ Error querying vectors:", error.message);
    } else if (vectors && vectors.length > 0) {
      console.log(`✅ Found ${vectors.length} sample vectors:`);
      vectors.forEach(v => {
        console.log(`   - ${v.source_type} (${new Date(v.created_at).toLocaleDateString()})`);
      });
    } else {
      console.log("📝 No vectors found in aoma_unified_vectors table");
      console.log("   This is expected if you haven't run the migration yet");
    }
  } catch (e) {
    console.log("Error checking vectors:", e);
  }
  
  // Check if pgvector extension is enabled
  console.log("\n" + "=" .repeat(50));
  console.log("🔧 Checking pgvector Extension...\n");
  
  try {
    const { data, error } = await supabase
      .rpc('pg_extension_installed', { extension_name: 'vector' });
    
    if (error) {
      // Try alternative check
      const { data: extensions } = await supabase
        .from('pg_extension')
        .select('extname')
        .eq('extname', 'vector')
        .single();
      
      if (extensions) {
        console.log("✅ pgvector extension is installed");
      } else {
        console.log("⚠️  pgvector extension status unknown");
      }
    } else {
      console.log(data ? "✅ pgvector extension is installed" : "❌ pgvector extension NOT installed");
    }
  } catch (e) {
    console.log("⚠️  Could not check pgvector status");
  }
}

// Run the check
checkTables()
  .then(() => {
    console.log("\n✨ Check complete!");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Error:", error);
    process.exit(1);
  });