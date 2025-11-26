import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getVectorColumnSchema() {
  console.log("\n=== Querying Vector Column Schema ===\n");

  // First, let's create a temporary function to query schema
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION get_vector_columns_info()
    RETURNS TABLE (
      table_name text,
      column_name text,
      data_type text,
      vector_dims text
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        c.table_name::text,
        c.column_name::text,
        c.udt_name::text as data_type,
        CASE 
          WHEN c.udt_name = 'vector' THEN 
            regexp_replace(format_type(a.atttypid, a.atttypmod), '[^0-9]', '', 'g')
          ELSE 'N/A'
        END as vector_dims
      FROM information_schema.columns c
      LEFT JOIN pg_attribute a ON (
        a.attrelid = (SELECT oid FROM pg_class WHERE relname = c.table_name AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
        AND a.attname = c.column_name
      )
      WHERE c.table_schema = 'public'
        AND (
          c.udt_name = 'vector' 
          OR c.column_name LIKE '%embedding%'
          OR c.column_name LIKE '%vector%'
        )
      ORDER BY c.table_name, c.column_name;
    END;
    $$;
  `;

  // Try to create the function (might fail if not admin)
  const { error: createError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
  
  if (createError) {
    console.log("Cannot create function directly, trying alternative approach...");
    
    // Alternative: Use the REST API to query directly
    // We'll check each suspected table's columns
    const suspectedEmptyTables = [
      "aqm_audio_knowledge",
      "siam_meeting_transcriptions",
      "siam_web_crawl_results", 
      "aoma_dom_structures",
      "aoma_ui_elements",
      "test_knowledge_base",
      "generated_tests",
      "firecrawl_analysis",
    ];

    console.log("Checking empty tables by attempting inserts with wrong dimension...\n");

    for (const tableName of suspectedEmptyTables) {
      // Try to insert a 1-dim vector and see what error we get
      const testVector = [0.1]; // 1-dimensional vector
      
      const { error } = await supabase
        .from(tableName)
        .insert({ embedding: testVector })
        .select();

      if (error) {
        // Parse error message to find expected dimensions
        const dimMatch = error.message.match(/expected (\d+) dimensions/);
        const colMatch = error.message.match(/column "(\w+)"/);
        
        if (dimMatch) {
          console.log(`${tableName}: embedding column expects ${dimMatch[1]} dimensions`);
        } else if (error.message.includes("column")) {
          console.log(`${tableName}: ${error.message.slice(0, 100)}`);
        } else {
          console.log(`${tableName}: ${error.message.slice(0, 100)}`);
        }
      }
    }
    return;
  }

  // If we could create the function, call it
  const { data, error } = await supabase.rpc('get_vector_columns_info');
  
  if (error) {
    console.error("Error calling function:", error.message);
    return;
  }

  console.table(data);
}

getVectorColumnSchema().catch(console.error);
