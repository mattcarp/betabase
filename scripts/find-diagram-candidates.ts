import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function findDiagramCandidates() {
  console.log("🔍 Searching for diagram-worthy tickets...");
  
  const keywords = ["workflow", "pipeline", "architecture", "dependency", "process flow", "state machine"];
  
  for (const keyword of keywords) {
    const { data, error } = await supabase
      .from("jira_tickets")
      .select("external_id, title, description, status")
      .textSearch("description", `'${keyword}'`)
      .limit(3);
      
    if (data && data.length > 0) {
      console.log(`\n✅ Found tickets for '${keyword}':`);
      data.forEach(t => {
        console.log(`   - [${t.external_id}] ${t.title} (${t.status})`);
        console.log(`     Snippet: ${t.description?.substring(0, 100)}...`);
      });
    }
  }
}

findDiagramCandidates();
