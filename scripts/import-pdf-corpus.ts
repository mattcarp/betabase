#!/usr/bin/env npx tsx
/**
 * Batch Import PDF Corpus to Vector Store
 *
 * Imports all extracted PDFs from the aoma-corpus.zip analysis.
 * Uses Gemini embeddings (768d) - same as all other vectors.
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
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
const gemini = getGeminiEmbeddingService();

const EXTRACTED_DIR = path.join(process.cwd(), "tmp", "pdf-extracted");

// Skip these files (already imported or not relevant)
const SKIP_FILES = [
  "AOMA-2.116.0-Release-Notes.txt", // Already imported
  "ffmpeg Documentation.txt", // Too large, generic FFmpeg docs
  "openai_openai-python_ The official Python library for the OpenAI API.txt", // OpenAI library docs, not AOMA
];

interface ImportResult {
  file: string;
  success: boolean;
  vectorId?: string;
  error?: string;
}

async function importFile(filepath: string): Promise<ImportResult> {
  const filename = path.basename(filepath);
  const content = fs.readFileSync(filepath, "utf-8");

  // Skip empty or very short files
  if (content.trim().length < 100) {
    return { file: filename, success: false, error: "Content too short" };
  }

  // Truncate very long content (Gemini has limits)
  const maxChars = 25000;
  const truncatedContent = content.length > maxChars
    ? content.substring(0, maxChars) + "\n\n[Content truncated for embedding]"
    : content;

  try {
    // Generate Gemini embedding
    const embedding = await gemini.generateEmbedding(truncatedContent);

    // Create source_id from filename
    const sourceId = "pdf:" + filename.replace(".txt", "").replace(/[^a-zA-Z0-9-_.]/g, "-");

    // Extract title from filename
    const title = filename
      .replace(".txt", "")
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const metadata = {
      title: title,
      source_file: filename,
      content_length: content.length,
      truncated: content.length > maxChars,
      imported_at: new Date().toISOString(),
      corpus: "aoma-corpus.zip",
    };

    // Insert with upsert
    const { data, error } = await supabase
      .from("siam_vectors")
      .upsert({
        organization: "sony-music",
        division: "digital-operations",
        app_under_test: "aoma",
        content: truncatedContent,
        embedding_gemini: embedding,
        source_type: "knowledge",
        source_id: sourceId,
        metadata: metadata,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "organization,division,app_under_test,source_type,source_id"
      })
      .select("id");

    if (error) {
      return { file: filename, success: false, error: error.message };
    }

    return {
      file: filename,
      success: true,
      vectorId: data?.[0]?.id
    };
  } catch (err) {
    return {
      file: filename,
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

async function main() {
  console.log("=== Importing PDF Corpus ===\n");

  // Get all .txt files
  const files = fs.readdirSync(EXTRACTED_DIR)
    .filter(f => f.endsWith(".txt"))
    .filter(f => !SKIP_FILES.includes(f));

  console.log(`Found ${files.length} files to import (skipping ${SKIP_FILES.length} excluded)\n`);

  const results: ImportResult[] = [];
  let success = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filepath = path.join(EXTRACTED_DIR, file);

    console.log(`[${i + 1}/${files.length}] ${file}`);

    const result = await importFile(filepath);
    results.push(result);

    if (result.success) {
      console.log(`  OK - ID: ${result.vectorId}`);
      success++;
    } else {
      console.log(`  FAIL - ${result.error}`);
      failed++;
    }

    // Rate limit - be gentle with Gemini API
    await new Promise(r => setTimeout(r, 300));
  }

  console.log("\n=== Import Complete ===");
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);

  // Show failed files
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log("\nFailed files:");
    for (const f of failures) {
      console.log(`  - ${f.file}: ${f.error}`);
    }
  }
}

main().catch(console.error);
