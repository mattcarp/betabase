import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkEmbeddingDetails() {
  console.log("\n=== Detailed Embedding Analysis ===\n");

  // Check siam_vectors - the main table with multiple embedding columns
  console.log("--- siam_vectors ---");
  
  const { data: siamSample, error: siamError } = await supabase
    .from("siam_vectors")
    .select("id, embedding, embedding_gemini, embedding_source")
    .limit(5);

  if (siamError) {
    console.log("Error:", siamError.message);
  } else if (siamSample && siamSample.length > 0) {
    for (const row of siamSample) {
      const embDim = Array.isArray(row.embedding) ? row.embedding.length : "NULL/Invalid";
      const gemDim = Array.isArray(row.embedding_gemini) ? row.embedding_gemini.length : "NULL";
      console.log(`ID ${row.id}: embedding=${embDim}d, embedding_gemini=${gemDim}, source=${row.embedding_source || "NULL"}`);
    }
  }

  // Count how many have gemini embeddings
  const { count: geminiCount } = await supabase
    .from("siam_vectors")
    .select("*", { count: "exact", head: true })
    .not("embedding_gemini", "is", null);
  
  const { count: totalCount } = await supabase
    .from("siam_vectors")
    .select("*", { count: "exact", head: true });

  console.log(`\nGemini embeddings populated: ${geminiCount} / ${totalCount}`);

  // Check embedding_source values
  const { data: sources } = await supabase
    .from("siam_vectors")
    .select("embedding_source")
    .not("embedding_source", "is", null)
    .limit(100);

  if (sources && sources.length > 0) {
    const uniqueSources = [...new Set(sources.map(s => s.embedding_source))];
    console.log("Embedding sources found:", uniqueSources);
  }

  // Check other tables for dimensions
  console.log("\n--- Checking dimensions across tables ---\n");

  const tables = [
    { name: "wiki_documents", col: "embedding" },
    { name: "crawled_pages", col: "content_embedding" },
    { name: "jira_tickets", col: "embedding" },
    { name: "code_files", col: "embedding" },
    { name: "app_pages", col: "embedding" },
    { name: "git_commits", col: "embedding" },
    { name: "test_results", col: "embedding" },
    { name: "beta_base_scenarios", col: "embedding" },
  ];

  for (const { name, col } of tables) {
    const { data, error } = await supabase
      .from(name)
      .select(col)
      .not(col, "is", null)
      .limit(1);

    if (error) {
      console.log(`${name}.${col}: Error - ${error.message}`);
    } else if (data && data.length > 0 && Array.isArray(data[0][col])) {
      console.log(`${name}.${col}: ${data[0][col].length} dimensions`);
    } else {
      console.log(`${name}.${col}: No data or not an array`);
    }
  }

  // Check beta_base_scenarios search_vector
  console.log("\n--- beta_base_scenarios.search_vector ---");
  const { data: betaData } = await supabase
    .from("beta_base_scenarios")
    .select("search_vector")
    .not("search_vector", "is", null)
    .limit(1);
  
  if (betaData && betaData.length > 0) {
    const sv = betaData[0].search_vector;
    console.log(`search_vector type: ${typeof sv}, isArray: ${Array.isArray(sv)}, length: ${Array.isArray(sv) ? sv.length : 'N/A'}`);
  } else {
    console.log("search_vector: No data");
  }
}

checkEmbeddingDetails().catch(console.error);
