#!/usr/bin/env npx tsx
/**
 * Check embedding status across all vectors
 * Identifies which vectors have OpenAI vs Gemini embeddings
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmbeddingStatus() {
  console.log("=== Embedding Status Analysis ===\n");

  // Total count
  const { count: total } = await supabase
    .from("siam_vectors")
    .select("*", { count: "exact", head: true })
    .eq("organization", "sony-music");

  console.log(`Total vectors: ${total}`);

  // Count with Gemini embeddings
  const { count: withGemini } = await supabase
    .from("siam_vectors")
    .select("*", { count: "exact", head: true })
    .eq("organization", "sony-music")
    .not("embedding_gemini", "is", null);

  console.log(`With Gemini embedding (768d): ${withGemini}`);

  // Count without Gemini (need re-embedding)
  const { count: withoutGemini } = await supabase
    .from("siam_vectors")
    .select("*", { count: "exact", head: true })
    .eq("organization", "sony-music")
    .is("embedding_gemini", null);

  console.log(`WITHOUT Gemini embedding (need migration): ${withoutGemini}`);

  // Get source type breakdown for vectors missing Gemini
  if (withoutGemini && withoutGemini > 0) {
    console.log("\n=== Vectors Missing Gemini Embeddings by Source ===");
    const { data: missing } = await supabase
      .from("siam_vectors")
      .select("source_type")
      .eq("organization", "sony-music")
      .is("embedding_gemini", null)
      .limit(1000);

    const byType: Record<string, number> = {};
    for (const v of missing || []) {
      byType[v.source_type] = (byType[v.source_type] || 0) + 1;
    }
    console.log(byType);
  }

  console.log("\n=== Recommendation ===");
  if (withoutGemini === 0 || withoutGemini === null) {
    console.log("All vectors have Gemini embeddings. Search will work correctly.");
  } else {
    console.log(`${withoutGemini} vectors need Gemini embeddings generated.`);
    console.log("Run: npx tsx scripts/migrate-missing-to-gemini.ts");
  }
}

checkEmbeddingStatus().catch(console.error);
