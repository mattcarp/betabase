#!/usr/bin/env npx tsx
/**
 * Migrate Missing Vectors to Gemini Embeddings
 *
 * Finds vectors without embedding_gemini and generates Gemini embeddings for them.
 * This ensures ALL vectors are searchable via the unified Gemini search.
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { getGeminiEmbeddingService } from "../src/services/geminiEmbeddingService";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const geminiService = getGeminiEmbeddingService();

async function migrateToGemini() {
  console.log("=== Migrating Missing Vectors to Gemini ===\n");

  // Get vectors without Gemini embeddings
  const { data: vectors, error } = await supabase
    .from("siam_vectors")
    .select("id, content, source_type, source_id")
    .eq("organization", "sony-music")
    .is("embedding_gemini", null)
    .limit(100);

  if (error) {
    console.error("Error fetching vectors:", error);
    process.exit(1);
  }

  if (!vectors || vectors.length === 0) {
    console.log("No vectors need migration. All vectors have Gemini embeddings.");
    return;
  }

  console.log(`Found ${vectors.length} vectors to migrate\n`);

  let success = 0;
  let failed = 0;

  for (const vector of vectors) {
    try {
      console.log(`[${success + failed + 1}/${vectors.length}] ${vector.source_type}:${vector.source_id}`);

      // Generate Gemini embedding
      const embedding = await geminiService.generateEmbedding(vector.content);

      // Update the vector
      const { error: updateError } = await supabase
        .from("siam_vectors")
        .update({ embedding_gemini: embedding })
        .eq("id", vector.id);

      if (updateError) {
        console.error(`  Failed: ${updateError.message}`);
        failed++;
      } else {
        console.log(`  Done (${embedding.length}d)`);
        success++;
      }

      // Rate limit - be gentle with Gemini API
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`  Error: ${err}`);
      failed++;
    }
  }

  console.log(`\n=== Migration Complete ===`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
}

migrateToGemini().catch(console.error);
