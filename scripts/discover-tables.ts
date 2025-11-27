import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
  console.log("🔍 Discovering Supabase tables...");
  
  // Query the information_schema to list tables
  // Note: This might be restricted by RLS/permissions for the anon key.
  // If this fails, we'll try a few common guesses.
  
  try {
    // We can't directly query information_schema via the JS client easily without a function
    // unless we have a specific RPC set up.
    // Instead, let's try to call a raw SQL query if possible (usually not with anon key).
    
    // ALTERNATIVE: Try to hit a known table and see if we can infer others, 
    // OR use the admin key if available (user mentioned "postgrest/supabable" - maybe I have service role?)
    
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let client = supabase;
    if (serviceRoleKey) {
        console.log("🔐 Using Service Role Key for discovery");
        client = createClient(supabaseUrl, serviceRoleKey);
    } else {
        console.log("⚠️ Using Anon Key (discovery might be limited)");
    }

    // Try to list tables via a custom RPC if it exists, or just guess common ones
    // But actually, the user said "tens of thousands of records".
    // Let's try to count rows in likely tables.
    
    const candidates = [
        "siam_vectors",
        "embeddings",
        "documents",
        "test_results",
        "test_executions",
        "test_runs",
        "jira_tickets",
        "github_commits",
        "aoma_vectors",
        "knowledge_base"
    ];

    for (const table of candidates) {
        const { count, error } = await client
            .from(table)
            .select("*", { count: "exact", head: true });
            
        if (error) {
            // console.log(`❌ ${table}: ${error.message}`);
        } else {
            console.log(`✅ ${table}: ${count} records`);
            
            // If we find records, sample one to see the structure
            if (count > 0) {
                const { data } = await client.from(table).select("*").limit(1);
                console.log(`   Sample:`, JSON.stringify(data[0], null, 2).substring(0, 200) + "...");
            }
        }
    }

  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

listTables();
