import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTableSchemas() {
  const tables = ["jira_ticket_embeddings", "git_file_embeddings", "siam_git_files", "siam_jira_tickets", "crawler_documents"];

  for (const table of tables) {
    console.log(`\n=== ${table} ===`);
    
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .limit(2);

    if (error) {
      console.log("Error:", error.message);
      continue;
    }

    if (data && data.length > 0) {
      console.log("Columns:", Object.keys(data[0]).join(", "));
      console.log("\nSample row (truncated):");
      const sample = data[0];
      for (const [key, value] of Object.entries(sample)) {
        let display = String(value);
        if (display.length > 100) {
          display = display.slice(0, 100) + "...";
        }
        console.log(`  ${key}: ${display}`);
      }
    } else {
      console.log("No data");
    }
  }
}

checkTableSchemas().catch(console.error);
