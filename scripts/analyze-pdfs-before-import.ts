#!/usr/bin/env npx tsx
/**
 * Pre-Import PDF Analysis Script
 *
 * Analyzes PDFs before importing to prevent the "Disneyland effect"
 * where duplicate/similar content overweights RAG responses.
 *
 * Process:
 * 1. Unzip PDF archive to tmp directory
 * 2. Extract text from each PDF
 * 3. Generate Gemini embeddings
 * 4. Query existing vectors for similarity matches
 * 5. Score and decide: IMPORT | SKIP | SUPERSEDE | REVIEW
 * 6. Output JSON report for human review
 *
 * Usage:
 *   npx tsx scripts/analyze-pdfs-before-import.ts [path-to-zip]
 *
 * Example:
 *   npx tsx scripts/analyze-pdfs-before-import.ts ~/Downloads/AOMA\ Ttransfers\ -\ Code\ and\ Data/aoma-corpus.zip
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables (both .env and .env.local)
dotenv.config();
dotenv.config({ path: ".env.local" });

import {
  extractPdfsFromDirectory,
  saveExtractedText,
  calculateContentHash,
  type ExtractedPDF,
} from "./lib/pdf-extractor";

import {
  makeDeduplicationDecision,
  formatDecision,
  type DeduplicationDecision,
  type VectorRecord,
} from "./lib/dedup-scorer";

// Configuration
const CONFIG = {
  organization: "sony-music",
  division: "digital-operations",
  appUnderTest: "aoma",
  similarityThreshold: 0.85,
  scoreDifferenceThreshold: 0.1,
  outputDir: path.join(process.cwd(), "tmp"),
  extractedDir: path.join(process.cwd(), "tmp", "pdf-extracted"),
};

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in environment");
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Gemini embedding function
async function generateGeminiEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY");
  }

  // Truncate text to avoid API limits (Gemini has ~25K token limit for embeddings)
  const maxChars = 25000;
  const truncatedText = text.length > maxChars ? text.substring(0, maxChars) : text;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text: truncatedText }] },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

// Query existing vectors for similarity
async function findSimilarVectors(
  embedding: number[],
  threshold: number = 0.85,
  limit: number = 5
): Promise<Array<VectorRecord & { similarity: number }>> {
  const { data, error } = await supabase.rpc("match_siam_vectors_gemini", {
    p_organization: CONFIG.organization,
    p_division: CONFIG.division,
    p_app_under_test: CONFIG.appUnderTest,
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit,
    filter_source_types: null,
  });

  if (error) {
    console.error("Vector search error:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    content: row.content,
    source_type: row.source_type,
    source_id: row.source_id,
    created_at: row.created_at || new Date().toISOString(),
    metadata: row.metadata || {},
    similarity: row.similarity,
  }));
}

// Analysis report structure
interface AnalysisReport {
  timestamp: string;
  sourceArchive: string;
  totalPdfs: number;
  extractionErrors: number;
  decisions: {
    import: number;
    skip: number;
    supersede: number;
    review: number;
  };
  details: Array<{
    filename: string;
    contentLength: number;
    pageCount: number;
    contentHash: string;
    decision: DeduplicationDecision;
  }>;
  errors: Array<{ file: string; error: string }>;
}

// Main analysis function
async function analyzePdfs(zipPath: string): Promise<AnalysisReport> {
  console.log("\n=== PDF Pre-Import Analysis ===\n");
  console.log(`Source: ${zipPath}`);
  console.log(`Target: ${CONFIG.organization}/${CONFIG.division}/${CONFIG.appUnderTest}`);
  console.log(`Similarity threshold: ${CONFIG.similarityThreshold}`);
  console.log("");

  // Ensure output directories exist
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  fs.mkdirSync(CONFIG.extractedDir, { recursive: true });

  // Clear previous extractions
  const existingFiles = fs.readdirSync(CONFIG.extractedDir);
  for (const file of existingFiles) {
    fs.unlinkSync(path.join(CONFIG.extractedDir, file));
  }

  // Unzip the archive
  console.log("Extracting archive...");
  const extractTarget = path.join(CONFIG.outputDir, "pdf-source");
  fs.mkdirSync(extractTarget, { recursive: true });

  // Clear previous extraction
  try {
    execSync(`rm -rf "${extractTarget}"/*`, { stdio: "pipe" });
  } catch {
    // Directory might be empty
  }

  execSync(`unzip -o -q "${zipPath}" -d "${extractTarget}"`, {
    stdio: "inherit",
  });

  // Find and extract PDFs
  console.log("\nExtracting PDF text content...");
  const { extracted, errors } = await extractPdfsFromDirectory(extractTarget, {
    recursive: true,
  });

  console.log(`\nExtracted ${extracted.length} PDFs, ${errors.length} errors\n`);

  // Save extracted text for inspection
  console.log("Saving extracted text files...");
  for (const pdf of extracted) {
    saveExtractedText(pdf, CONFIG.extractedDir);
  }

  // Analyze each PDF against existing vectors
  console.log("\nAnalyzing against existing vectors...\n");
  const report: AnalysisReport = {
    timestamp: new Date().toISOString(),
    sourceArchive: zipPath,
    totalPdfs: extracted.length,
    extractionErrors: errors.length,
    decisions: { import: 0, skip: 0, supersede: 0, review: 0 },
    details: [],
    errors,
  };

  for (let i = 0; i < extracted.length; i++) {
    const pdf = extracted[i];
    console.log(`[${i + 1}/${extracted.length}] ${pdf.filename}`);

    try {
      // Generate embedding for PDF content
      console.log("  Generating embedding...");
      const embedding = await generateGeminiEmbedding(pdf.text);

      // Find similar existing vectors
      console.log("  Searching for similar vectors...");
      const similar = await findSimilarVectors(
        embedding,
        CONFIG.similarityThreshold
      );

      // Get the best match (if any)
      const bestMatch = similar.length > 0 ? similar[0] : null;
      const similarity = bestMatch?.similarity || 0;

      // Make deduplication decision
      const pdfDate =
        pdf.metadata.modificationDate ||
        pdf.metadata.creationDate ||
        new Date();

      const decision = makeDeduplicationDecision(
        pdf.filename,
        pdf.contentLength,
        pdfDate,
        bestMatch,
        similarity,
        {
          similarityThreshold: CONFIG.similarityThreshold,
          scoreDifferenceThreshold: CONFIG.scoreDifferenceThreshold,
        }
      );

      // Update counts
      report.decisions[decision.action.toLowerCase() as keyof typeof report.decisions]++;

      // Store detail
      report.details.push({
        filename: pdf.filename,
        contentLength: pdf.contentLength,
        pageCount: pdf.pageCount,
        contentHash: calculateContentHash(pdf.text),
        decision,
      });

      // Print decision
      console.log(formatDecision(decision));
      console.log("");

      // Rate limiting - be gentle with APIs
      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error(`  ERROR: ${errorMsg}`);
      report.errors.push({ file: pdf.filename, error: errorMsg });
    }
  }

  return report;
}

// Generate summary output
function printSummary(report: AnalysisReport): void {
  console.log("\n=== Analysis Summary ===\n");
  console.log(`Total PDFs analyzed: ${report.totalPdfs}`);
  console.log(`Extraction errors: ${report.extractionErrors}`);
  console.log("");
  console.log("Decisions:");
  console.log(`  [+] IMPORT:    ${report.decisions.import} (new content, no similar vectors)`);
  console.log(`  [-] SKIP:      ${report.decisions.skip} (existing content is better)`);
  console.log(`  [^] SUPERSEDE: ${report.decisions.supersede} (new content is better)`);
  console.log(`  [?] REVIEW:    ${report.decisions.review} (manual review needed)`);
  console.log("");

  if (report.decisions.supersede > 0) {
    console.log("SUPERSEDE items (new content will replace existing):");
    for (const detail of report.details) {
      if (detail.decision.action === "SUPERSEDE") {
        console.log(`  - ${detail.filename}`);
        if (detail.decision.existingMatch) {
          console.log(`    Replaces: ${detail.decision.existingMatch.source_id}`);
        }
      }
    }
    console.log("");
  }

  if (report.decisions.review > 0) {
    console.log("REVIEW items (need manual decision):");
    for (const detail of report.details) {
      if (detail.decision.action === "REVIEW") {
        console.log(`  - ${detail.filename}`);
        console.log(`    Reason: ${detail.decision.reason}`);
      }
    }
    console.log("");
  }

  console.log("Next steps:");
  console.log("1. Review the detailed report at: tmp/pdf-analysis-report.json");
  console.log("2. Check extracted text at: tmp/pdf-extracted/");
  console.log("3. Manually review REVIEW items");
  console.log("4. Run import script with approved decisions");
}

// Main entry point
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Default to the known location
    const defaultPath =
      "/Users/matt/Downloads/AOMA Ttransfers - Code and Data/aoma-corpus.zip";
    if (fs.existsSync(defaultPath)) {
      args.push(defaultPath);
    } else {
      console.error("Usage: npx tsx scripts/analyze-pdfs-before-import.ts <path-to-zip>");
      console.error("\nExample:");
      console.error(
        '  npx tsx scripts/analyze-pdfs-before-import.ts "~/Downloads/AOMA Ttransfers - Code and Data/aoma-corpus.zip"'
      );
      process.exit(1);
    }
  }

  const zipPath = args[0].replace(/^~/, process.env.HOME || "");

  if (!fs.existsSync(zipPath)) {
    console.error(`File not found: ${zipPath}`);
    process.exit(1);
  }

  try {
    const report = await analyzePdfs(zipPath);

    // Save report
    const reportPath = path.join(CONFIG.outputDir, "pdf-analysis-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nDetailed report saved to: ${reportPath}`);

    printSummary(report);
  } catch (error) {
    console.error("Analysis failed:", error);
    process.exit(1);
  }
}

main();
