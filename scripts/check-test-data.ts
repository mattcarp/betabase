
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
  console.log("🔍 Checking 'test_results' table...");

  // Count total rows
  const { count, error: countError } = await supabase
    .from("test_results")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("❌ Error counting rows:", countError);
    return;
  }

  console.log(`📊 Total Tests: ${count}`);

  // Find tests with screenshots (checking screenshot_url column)
  const { data: withUrl, error: urlError } = await supabase
    .from("test_results")
    .select("id, test_name, screenshot_url, created_at")
    .not("screenshot_url", "is", null)
    .limit(5);

  if (urlError) console.error("Error checking screenshot_url:", urlError);

  console.log(`📸 Tests with screenshot_url: ${withUrl?.length || 0} found in sample.`);
  if (withUrl && withUrl.length > 0) {
      console.log("   Example:", withUrl[0]);
  }

  // Find tests with metadata->screenshots
  // Note: metadata is JSONB, so we query it differently or just fetch and filter in JS for this check
  const { data: withMetadata, error: metaError } = await supabase
    .from("test_results")
    .select("id, test_name, metadata")
    .not("metadata", "is", null)
    .limit(100); // Fetch a batch to scan

  if (metaError) console.error("Error checking metadata:", metaError);

  const metadataHasScreenshots = withMetadata?.filter(r => 
    r.metadata?.screenshots && Array.isArray(r.metadata.screenshots) && r.metadata.screenshots.length > 0
  );

  console.log(`📸 Tests with metadata.screenshots: ${metadataHasScreenshots?.length || 0} found in sample.`);
  if (metadataHasScreenshots && metadataHasScreenshots.length > 0) {
      console.log("   Example:", metadataHasScreenshots[0]);
  }
}

checkData();
