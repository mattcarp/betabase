import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("URL:", supabaseUrl ? supabaseUrl.substring(0, 20) + "..." : "MISSING");
console.log("Key:", supabaseServiceKey ? "PRESENT (Length: " + supabaseServiceKey.length + ")" : "MISSING");

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing credentials");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testLogging() {
  console.log("🧪 Testing Read Connection...");
  
  const { count, error: readError } = await supabaseAdmin
    .from("rlhf_feedback")
    .select("*", { count: "exact", head: true });

  if (readError) {
    console.error("❌ Read failed:", readError);
    console.dir(readError, { depth: null });
    return;
  }

  console.log(`✅ Read successful. Table has ${count} rows.`);

  console.log("🧪 Testing Write...");
  const testId = `test-session-${Date.now()}`;
  
  const payload = {
    session_id: testId,
    query: "Test query",
    response: "Test response",
    feedback_type: "rating",
    curator_email: "test-script@siam.ai",
    organization: "sony-music"
  };

  const { data, error } = await supabaseAdmin.from("rlhf_feedback").insert(payload).select();

  if (error) {
    console.error("❌ Insert failed:", error);
    console.dir(error, { depth: null });
  } else {
    console.log("✅ Insert successful!", data);
  }
}

testLogging();
