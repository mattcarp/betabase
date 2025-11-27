import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listTables() {
  console.log("🔍 Listing tables in public schema...");
  
  // We can't list tables directly with supabase-js easily without rpc, 
  // but we can try to select from a known table or use a system query if allowed.
  // Actually, let's try to run the migration content directly if we can't see the table.
  
  // But first, let's check if we can see ANY table.
  const { data, error } = await supabase.from("test_results").select("count").limit(1);
  
  if (error) {
    console.log("❌ Could not access test_results:", error.message);
  } else {
    console.log("✅ Accessed test_results. Table exists.");
  }

  const { data: rlhf, error: rlhfError } = await supabase.from("rlhf_feedback").select("count").limit(1);
  if (rlhfError) {
    console.log("❌ Could not access rlhf_feedback:", rlhfError.message);
  } else {
    console.log("✅ Accessed rlhf_feedback. Table exists.");
  }
}

listTables();
