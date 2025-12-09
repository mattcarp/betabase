#!/usr/bin/env npx tsx
/**
 * Import Release Notes to Vector Store
 *
 * Imports release notes with high priority for RAG retrieval.
 * Uses Gemini embeddings (768d) - SAME as all other vectors in the database.
 * Uses metadata to boost relevance for recent releases.
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Import Gemini embedding service
import { getGeminiEmbeddingService } from "../src/services/geminiEmbeddingService";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the release notes
const content = fs.readFileSync("tmp/pdf-extracted/AOMA-2.116.0-Release-Notes.txt", "utf-8");

async function main() {
  console.log("Generating Gemini embedding for AOMA 2.116.0 Release Notes...");

  const geminiService = getGeminiEmbeddingService();
  const embedding = await geminiService.generateEmbedding(content);
  console.log(`Embedding generated (${embedding.length} dimensions - Gemini 768d)`);

  // Metadata with priority boost for recent release notes
  const metadata = {
    title: "AOMA 2.116.0 Release Notes",
    release_date: "2025-12-09",
    priority: "high",
    version: "2.116.0",
    recency_boost: 1.5,  // Boost factor for RAG scoring
    jira_tickets: [
      "UST-2705", "UST-2714", "UST-2721", "UST-2723", "UST-2725",
      "UST-2744", "UST-2739", "UST-2742", "UST-2766", "UST-2763",
      "UST-2519", "UST-2704", "DA-812", "AOMA3-2934", "AOMA3-2917",
      "AOMA3-2902", "AOMA3-2876", "AOMA3-2857", "AOMA3-2871",
      "AOMA3-2828", "AOMA3-2898", "AOMA3-2642", "AOMA3-2930"
    ],
    features: [
      "Error Button Standardization",
      "Download Options",
      "Asset Swap UI Improvement",
      "Hive AI Detection",
      "Export Enhancements",
      "Linking Migration"
    ]
  };

  // Direct insert to siam_vectors with Gemini embedding
  // Table has TWO columns: embedding (1536d OpenAI) and embedding_gemini (768d Gemini)
  // We insert to embedding_gemini column for Gemini vectors
  const { data, error } = await supabase
    .from("siam_vectors")
    .upsert({
      organization: "sony-music",
      division: "digital-operations",
      app_under_test: "aoma",
      content: content,
      embedding_gemini: embedding,  // 768d Gemini embedding column
      source_type: "knowledge",  // Valid types: knowledge, jira, git, email, metrics, openai_import, cache
      source_id: "release-notes:AOMA-2.116.0-2025-12-09",  // Include type in source_id for clarity
      metadata: metadata,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "organization,division,app_under_test,source_type,source_id"
    })
    .select("id");

  if (error) {
    console.error("Error inserting:", error);
    process.exit(1);
  }

  console.log("Successfully inserted AOMA 2.116.0 Release Notes!");
  console.log("Vector ID:", data);
}

main().catch(console.error);
