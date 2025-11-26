import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Checking Supabase connection...");
console.log("URL:", supabaseUrl ? "Set" : "Missing");
console.log("Key:", supabaseAnonKey ? "Set" : "Missing");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  try {
    // Check for 'embeddings' table (or whatever the main vector table is named)
    // Based on supabase.ts, the interface is SIAMVector, but the table name isn't explicitly exported there.
    // Common names: 'embeddings', 'documents', 'vectors'.
    // Let's try 'embeddings' first as implied by the interface.
    
    console.log("Querying 'siam_vectors' table...");
    const { count, error } = await supabase
      .from("siam_vectors")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("❌ Error querying 'siam_vectors':", JSON.stringify(error, null, 2));
      
      // Try 'documents' as fallback
      console.log("Querying 'documents' table...");
      const { count: docCount, error: docError } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true });
        
      if (docError) {
         console.error("❌ Error querying 'documents':", JSON.stringify(docError, null, 2));
      } else {
         console.log(`✅ Found ${docCount} records in 'documents' table.`);
      }
      
    } else {
      console.log(`✅ Found ${count} records in 'siam_vectors' table.`);
    }

  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

checkData();
