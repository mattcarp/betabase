
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

async function findAomaVectors() {
  console.log("🔍 Searching for 'AOMA' related vectors in Supabase...");

  try {
    // Simple text search on the content column
    const { data, error } = await supabase
      .from("siam_vectors")
      .select("content, source_id, metadata")
      .ilike("content", "%AOMA%")
      .limit(5);

    if (error) {
      console.error("❌ Error querying 'siam_vectors':", error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log(`✅ Found ${data.length} vectors matching 'AOMA':`);
      data.forEach((row, i) => {
        console.log(`\n--- Result ${i + 1} ---`);
        console.log(`Source: ${row.source_id}`);
        console.log(`Content: ${row.content.substring(0, 200)}...`);
      });
    } else {
      console.log("⚠️ No vectors found matching 'AOMA' in 'siam_vectors'.");
      console.log("Checking 'documents' table as fallback...");
      
      const { data: docData, error: docError } = await supabase
        .from("documents")
        .select("content, metadata")
        .ilike("content", "%AOMA%")
        .limit(5);

      if (docError) {
         console.error("❌ Error querying 'documents':", docError.message);
      } else if (docData && docData.length > 0) {
        console.log(`✅ Found ${docData.length} documents matching 'AOMA':`);
        docData.forEach((row, i) => {
          console.log(`\n--- Result ${i + 1} ---`);
          console.log(`Content: ${row.content.substring(0, 200)}...`);
        });
      } else {
        console.log("⚠️ No documents found matching 'AOMA'.");
      }
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

findAomaVectors();
