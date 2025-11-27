import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

console.log("Checking Supabase configuration...");
console.log("URL:", supabaseUrl ? "✅ Set" : "❌ Missing");
console.log("Service Key:", supabaseServiceKey ? "✅ Set" : "❌ Missing");
console.log("Database URL:", databaseUrl ? "✅ Set" : "❌ Missing");

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials. Cannot proceed.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSetup() {
  try {
    console.log("\nChecking for 'rlhf_feedback' table...");
    const { count, error } = await supabase
      .from("rlhf_feedback")
      .select("*", { count: "exact", head: true });

    if (error) {
      if (error.code === "42P01") { // Undefined table
        console.log("❌ Table 'rlhf_feedback' does NOT exist.");
        console.log("👉 Migration '007_rlhf_feedback_schema.sql' needs to be applied.");
      } else {
        console.error("❌ Error checking table:", error.message);
      }
    } else {
      console.log(`✅ Table 'rlhf_feedback' exists (Rows: ${count}).`);
    }

  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

checkSetup();
