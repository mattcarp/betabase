import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSearchVector() {
  const { data, error } = await supabase
    .from("beta_base_scenarios")
    .select("id, search_vector")
    .not("search_vector", "is", null)
    .limit(3);

  if (error) {
    console.log("Error:", error.message);
    return;
  }

  console.log("beta_base_scenarios.search_vector samples:\n");
  data?.forEach((row, i) => {
    console.log(`Row ${i + 1}:`);
    console.log(`  Type: ${typeof row.search_vector}`);
    console.log(`  Value preview: ${String(row.search_vector).slice(0, 200)}...`);
    console.log("");
  });
}

checkSearchVector();
