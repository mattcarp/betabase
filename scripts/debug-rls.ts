import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function debugRLS() {
  console.log("🔍 Debugging RLS Policies...");

  // 1. Try to read (should work)
  const { data: readData, error: readError } = await supabase
    .from("rlhf_feedback")
    .select("*")
    .limit(1);

  if (readError) {
    console.error("❌ Read failed:", readError);
  } else {
    console.log("✅ Read successful. Count:", readData.length);
  }

  // 2. Try to insert a dummy record
  const dummyRecord = {
    session_id: "debug-session-" + Date.now(),
    query: "debug query",
    response: "debug response",
    feedback_type: "thumbs_up",
    feedback_value: { score: 1 },
    curator_email: "debug@siam.ai",
    organization: "sony-music",
    division: "mso",
    app_under_test: "debug",
  };

  console.log("📝 Attempting insert with service role key...");
  const { data: insertData, error: insertError } = await supabase
    .from("rlhf_feedback")
    .insert(dummyRecord)
    .select();

  if (insertError) {
    console.error("❌ Insert failed:", insertError);
    console.error("   Details:", JSON.stringify(insertError, null, 2));
    console.error("   Hint: Check if 'service_role' policy exists on 'rlhf_feedback' table.");
  } else {
    console.log("✅ Insert successful:", insertData);
    
    // Clean up
    await supabase.from("rlhf_feedback").delete().eq("session_id", dummyRecord.session_id);
  }
}

debugRLS();
