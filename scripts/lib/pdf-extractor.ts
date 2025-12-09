/**
 * PDF Text Extraction Module
 *
 * Extracts text content from PDF files for embedding generation
 * and deduplication analysis.
 */

import * as fs from "fs";
import * as path from "path";

// pdf-parse v2 uses class-based API
import { PDFParse } from "pdf-parse";

export interface ExtractedPDF {
  filename: string;
  filepath: string;
  text: string;
  pageCount: number;
  contentLength: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
  extractedAt: Date;
}

export interface ExtractionResult {
  success: boolean;
  data?: ExtractedPDF;
  error?: string;
}

/**
 * Extract text content from a single PDF file
 * Uses pdf-parse v2 class-based API
 */
export async function extractPdfText(
  filepath: string
): Promise<ExtractionResult> {
  let parser: InstanceType<typeof PDFParse> | null = null;

  try {
    const dataBuffer = fs.readFileSync(filepath);

    // pdf-parse v2 class-based API
    parser = new PDFParse({ data: dataBuffer });

    // Get text content
    const textResult = await parser.getText();

    // Get metadata/info
    const infoResult = await parser.getInfo();

    const extracted: ExtractedPDF = {
      filename: path.basename(filepath),
      filepath: filepath,
      text: textResult.text.trim(),
      pageCount: infoResult.total,
      contentLength: textResult.text.length,
      metadata: {
        title: infoResult.info?.Title,
        author: infoResult.info?.Author,
        subject: infoResult.info?.Subject,
        creator: infoResult.info?.Creator,
        creationDate: infoResult.info?.CreationDate
          ? parseDate(String(infoResult.info.CreationDate))
          : undefined,
        modificationDate: infoResult.info?.ModDate
          ? parseDate(String(infoResult.info.ModDate))
          : undefined,
      },
      extractedAt: new Date(),
    };

    return { success: true, data: extracted };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown extraction error",
    };
  } finally {
    // Always clean up parser resources
    if (parser) {
      try {
        await parser.destroy();
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Extract text from all PDFs in a directory
 */
export async function extractPdfsFromDirectory(
  dirPath: string,
  options: { recursive?: boolean } = {}
): Promise<{ extracted: ExtractedPDF[]; errors: { file: string; error: string }[] }> {
  const extracted: ExtractedPDF[] = [];
  const errors: { file: string; error: string }[] = [];

  const pdfFiles = findPdfFiles(dirPath, options.recursive ?? false);
  console.log(`Found ${pdfFiles.length} PDF files to process`);

  for (const pdfFile of pdfFiles) {
    console.log(`Extracting: ${path.basename(pdfFile)}`);
    const result = await extractPdfText(pdfFile);

    if (result.success && result.data) {
      extracted.push(result.data);
    } else {
      errors.push({ file: pdfFile, error: result.error || "Unknown error" });
    }
  }

  return { extracted, errors };
}

/**
 * Find all PDF files in a directory
 * Excludes macOS metadata files (._* prefix) and __MACOSX directories
 */
function findPdfFiles(dirPath: string, recursive: boolean): string[] {
  const pdfFiles: string[] = [];

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    // Skip macOS metadata
    if (entry.name.startsWith("._") || entry.name === "__MACOSX") {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory() && recursive) {
      // Skip __MACOSX directories
      if (entry.name === "__MACOSX") continue;
      pdfFiles.push(...findPdfFiles(fullPath, recursive));
    } else if (
      entry.isFile() &&
      entry.name.toLowerCase().endsWith(".pdf") &&
      !entry.name.startsWith("._") // Extra check for metadata files
    ) {
      pdfFiles.push(fullPath);
    }
  }

  return pdfFiles;
}

/**
 * Parse PDF date strings (format: D:YYYYMMDDHHmmSS)
 */
function parseDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;

  // PDF date format: D:YYYYMMDDHHmmSS or variations
  const match = dateStr.match(
    /D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/
  );
  if (match) {
    const [, year, month, day, hour = "00", min = "00", sec = "00"] = match;
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(min),
      parseInt(sec)
    );
  }

  // Try standard date parsing as fallback
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * Save extracted text to a file for inspection
 */
export function saveExtractedText(
  extracted: ExtractedPDF,
  outputDir: string
): void {
  const outputPath = path.join(
    outputDir,
    extracted.filename.replace(".pdf", ".txt")
  );
  const content = `# ${extracted.filename}
# Pages: ${extracted.pageCount}
# Content Length: ${extracted.contentLength} characters
# Extracted: ${extracted.extractedAt.toISOString()}
# Title: ${extracted.metadata.title || "N/A"}
# Author: ${extracted.metadata.author || "N/A"}
# Created: ${extracted.metadata.creationDate?.toISOString() || "N/A"}
# Modified: ${extracted.metadata.modificationDate?.toISOString() || "N/A"}
---

${extracted.text}
`;
  fs.writeFileSync(outputPath, content, "utf-8");
}

/**
 * Calculate content hash for exact duplicate detection
 */
export function calculateContentHash(text: string): string {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * Normalize text for better comparison (remove extra whitespace, lowercase)
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();
}
