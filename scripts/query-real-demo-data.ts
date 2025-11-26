import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function queryRealData() {
  console.log("🔍 Querying Real Supabase Data for Demo...\n");

  // 1. Check knowledge_elements table (RAG data)
  console.log("📚 Knowledge Elements:");
  const { data: knowledgeData, error: knowledgeError } = await supabase
    .from("knowledge_elements")
    .select("id, content, metadata, source_type")
    .limit(5);

  if (knowledgeError) {
    console.error("Error:", knowledgeError.message);
  } else {
    console.log(`  Found ${knowledgeData?.length || 0} records`);
    knowledgeData?.forEach((item, i) => {
      console.log(`  ${i + 1}. Source: ${item.source_type}, Content preview: ${item.content.substring(0, 80)}...`);
    });
  }

  // 2. Check rlhf_feedback table
  console.log("\n💬 RLHF Feedback:");
  const { count: feedbackCount } = await supabase
    .from("rlhf_feedback")
    .select("*", { count: "exact", head: true });

  console.log(`  Total feedback records: ${feedbackCount || 0}`);

  const { data: recentFeedback } = await supabase
    .from("rlhf_feedback")
    .select("query, response, feedback_type, created_at")
    .order("created_at", { ascending: false })
    .limit(3);

  recentFeedback?.forEach((item, i) => {
    console.log(`  ${i + 1}. Query: "${item.query.substring(0, 60)}..."`);
    console.log(`     Feedback: ${item.feedback_type}`);
  });

  // 3. Check test_results table
  console.log("\n🧪 Test Results:");
  const { count: testCount } = await supabase
    .from("test_results")
    .select("*", { count: "exact", head: true });

  console.log(`  Total test records: ${testCount || 0}`);

  const { data: failedTests } = await supabase
    .from("test_results")
    .select("test_name, status, error_message")
    .eq("status", "failed")
    .limit(3);

  if (failedTests && failedTests.length > 0) {
    failedTests.forEach((test, i) => {
      console.log(`  ${i + 1}. ${test.test_name}: ${test.status}`);
    });
  } else {
    console.log("  No failed tests (great!)");
  }

  // 4. Search for AOMA-related content
  console.log("\n🎯 AOMA-Related Content:");
  const { data: aomaContent } = await supabase
    .from("knowledge_elements")
    .select("content, metadata")
    .ilike("content", "%AOMA%")
    .limit(5);

  console.log(`  Found ${aomaContent?.length || 0} AOMA-related documents`);
  aomaContent?.forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.content.substring(0, 100)}...`);
  });

  console.log("\n✅ Data discovery complete!");
  console.log("\n💡 Recommendation: Use these real queries for your demo:");
  console.log("   1. 'What is AOMA?' (should pull from real docs)");
  console.log("   2. 'Show me the AOMA architecture' (should generate diagram)");
  console.log("   3. Navigate to Curate tab to show real feedback");
}

queryRealData();
