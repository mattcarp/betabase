import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

// Tables and their embedding columns
const VECTOR_TABLES = [
  { table: "siam_vectors", columns: ["embedding", "embedding_gemini"] },
  { table: "jira_tickets", columns: ["embedding"] },
  { table: "crawled_pages", columns: ["content_embedding"] },
  { table: "wiki_documents", columns: ["embedding"] },
  { table: "code_files", columns: ["embedding"] },
  { table: "app_pages", columns: ["embedding"] },
  { table: "git_commits", columns: ["embedding"] },
  { table: "test_results", columns: ["embedding"] },
  { table: "beta_base_scenarios", columns: ["embedding", "search_vector"] },
];

async function checkVectorDimensions() {
  console.log("\n=== Checking Vector Column Dimensions ===\n");

  const results: any[] = [];

  for (const { table, columns } of VECTOR_TABLES) {
    for (const column of columns) {
      try {
        // Use vector_dims() function to get dimensions of first non-null vector
        const { data, error } = await supabase.rpc('check_vector_dimension', {
          p_table: table,
          p_column: column
        });

        if (error) {
          // RPC doesn't exist, try raw query approach
          // Get a sample and check array length via different method
          const { data: sample, error: sampleError } = await supabase
            .from(table)
            .select(`id, ${column}`)
            .not(column, 'is', null)
            .limit(1)
            .single();

          if (sampleError) {
            results.push({ 
              table, 
              column, 
              dimensions: "No data or error",
              rowsWithData: 0
            });
            continue;
          }

          // The vector comes back as a string like "[0.1,0.2,...]" from Supabase
          const vectorStr = sample?.[column];
          let dims = "Unknown";
          
          if (typeof vectorStr === 'string' && vectorStr.startsWith('[')) {
            // Count commas + 1 to get dimensions
            dims = (vectorStr.match(/,/g) || []).length + 1;
          } else if (Array.isArray(vectorStr)) {
            dims = vectorStr.length;
          }

          // Get count of rows with embeddings
          const { count } = await supabase
            .from(table)
            .select("*", { count: "exact", head: true })
            .not(column, 'is', null);

          results.push({ 
            table, 
            column, 
            dimensions: dims,
            rowsWithData: count || 0
          });
        } else {
          results.push({ table, column, dimensions: data, rowsWithData: "?" });
        }
      } catch (err) {
        results.push({ table, column, dimensions: `Error: ${err}`, rowsWithData: 0 });
      }
    }
  }

  // Print results
  console.log("Vector Column Analysis:\n");
  console.table(results);

  // Summary
  console.log("\n=== Summary ===\n");
  
  const has1536 = results.filter(r => r.dimensions === 1536);
  const has768 = results.filter(r => r.dimensions === 768);
  const other = results.filter(r => r.dimensions !== 1536 && r.dimensions !== 768 && r.rowsWithData > 0);

  console.log(`Columns with 1536 dimensions (OpenAI): ${has1536.length}`);
  has1536.forEach(r => console.log(`  - ${r.table}.${r.column} (${r.rowsWithData} rows)`));
  
  console.log(`\nColumns with 768 dimensions (Gemini): ${has768.length}`);
  has768.forEach(r => console.log(`  - ${r.table}.${r.column} (${r.rowsWithData} rows)`));

  console.log(`\nOther/Empty columns: ${other.length}`);
  other.forEach(r => console.log(`  - ${r.table}.${r.column}: ${r.dimensions}`));

  // Calculate migration scope
  const totalToMigrate = results
    .filter(r => r.dimensions === 1536)
    .reduce((sum, r) => sum + (r.rowsWithData || 0), 0);
  
  console.log(`\n🎯 Total embeddings to migrate from 1536→768: ${totalToMigrate}`);

  return results;
}

checkVectorDimensions().catch(console.error);
