/**
 * Knowledge Upload API - Supabase pgvector
 * 
 * This is the CORRECT upload endpoint that stores documents in Supabase.
 * 
 * Architecture:
 * - Storage: Supabase PostgreSQL with pgvector extension
 * - Table: siam_vectors (multi-tenant: organization/division/app_under_test)
 * - Embeddings: Gemini text-embedding-004 (768 dimensions)
 * 
 * ⚠️  DO NOT use the legacy OpenAI vector store endpoints!
 * - /api/upload (DEPRECATED - uses OpenAI)
 * - /api/assistant (DEPRECATED - uses OpenAI vector stores)
 * - /api/vector-store/* (DEPRECATED - uses OpenAI)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseVectorService } from "@/services/supabaseVectorService";
import { DEFAULT_APP_CONTEXT } from "@/lib/supabase";

// PDF parsing - lazy loaded to avoid pdf-parse test file issue
let pdfParseModule: any = null;

async function getPdfParse() {
  if (!pdfParseModule) {
    // Dynamic require to avoid module-level test file loading
    pdfParseModule = require("pdf-parse");
  }
  return pdfParseModule;
}

// ============================================================================
// TEXT CHUNKING - Split large documents into overlapping chunks for better RAG
// ============================================================================
interface TextChunk {
  content: string;
  chunkIndex: number;
  totalChunks: number;
  startChar: number;
  endChar: number;
}

/**
 * Split text into overlapping chunks for better vector search retrieval.
 * Simple, robust implementation.
 * 
 * @param text - The full document text
 * @param chunkSize - Target size of each chunk in characters
 * @param overlap - Overlap between chunks in characters
 * @returns Array of text chunks with metadata
 */
function chunkText(text: string, chunkSize: number = 1500, overlap: number = 150): TextChunk[] {
  // Validate inputs
  if (!text || text.length === 0) {
    return [];
  }
  
  // If text is small enough, return as single chunk
  if (text.length <= chunkSize) {
    return [{
      content: text.trim(),
      chunkIndex: 0,
      totalChunks: 1,
      startChar: 0,
      endChar: text.length,
    }];
  }

  const chunks: TextChunk[] = [];
  const step = chunkSize - overlap;
  
  // Calculate total chunks upfront
  const totalChunks = Math.ceil((text.length - overlap) / step);

  for (let i = 0; i < totalChunks; i++) {
    const startIndex = i * step;
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    
    const chunkContent = text.substring(startIndex, endIndex).trim();
    
    if (chunkContent.length > 0) {
      chunks.push({
        content: chunkContent,
        chunkIndex: i,
        totalChunks,
        startChar: startIndex,
        endChar: endIndex,
      });
    }
  }
  
  return chunks;
}

// ============================================================================
// CHUNKING CONFIGURATION - Based on 2025 RAG research (NVIDIA/Chroma benchmarks)
// ============================================================================
// Research shows: 400-512 tokens (~1500-2000 chars) with 10-20% overlap
// RecursiveCharacterTextSplitter achieved 85-90% recall in Chroma's tests
// Factoid queries: 256-512 tokens | Analytical queries: 1024+ tokens
// Source: Firecrawl 2025 chunking benchmarks
const CHUNK_THRESHOLD = 1800; // Documents larger than this will be chunked
const CHUNK_SIZE = 1800; // ~450 tokens - optimal for mixed query types
const CHUNK_OVERLAP = 200; // ~11% overlap - industry standard 10-20%

// Extract text content from various file types
async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  // For text-based files, read directly
  if (
    fileType.includes("text") ||
    fileName.endsWith(".txt") ||
    fileName.endsWith(".md") ||
    fileName.endsWith(".json") ||
    fileName.endsWith(".csv")
  ) {
    return await file.text();
  }

  // For PDFs, use pdf-parse v1.1.1 (lazy loaded)
  if (fileName.endsWith(".pdf") || fileType === "application/pdf") {
    try {
      const pdfParse = await getPdfParse();
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const data = await pdfParse(buffer);
      
      console.log(`[PDF PARSE] Extracted ${data.numpages} pages, ${data.text.length} chars from ${file.name}`);
      return data.text;
    } catch (error) {
      console.error(`[PDF PARSE] Error parsing ${file.name}:`, error);
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // For DOCX files, we'd need a different parser (not implemented yet)
  if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) {
    throw new Error(
      `DOCX parsing not yet implemented. Please convert to PDF or use .txt, .md formats.`
    );
  }

  // Try to read as text anyway
  return await file.text();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    
    // Optional: Override default app context
    const organization = (formData.get("organization") as string) || DEFAULT_APP_CONTEXT.organization;
    const division = (formData.get("division") as string) || DEFAULT_APP_CONTEXT.division;
    const app_under_test = (formData.get("app_under_test") as string) || DEFAULT_APP_CONTEXT.app_under_test;
    
    // Optional metadata
    const sourceType = (formData.get("sourceType") as string) || "knowledge";
    const customMetadata = formData.get("metadata") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(`[KNOWLEDGE UPLOAD] Processing: ${file.name} (${file.size} bytes)`);
    console.log(`[KNOWLEDGE UPLOAD] Target: ${organization}/${division}/${app_under_test}`);

    // Extract text content
    const content = await extractTextFromFile(file);

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "File is empty or could not be read" },
        { status: 400 }
      );
    }

    console.log(`[KNOWLEDGE UPLOAD] Extracted ${content.length} characters`);

    // Sanitize content: remove null bytes and invalid Unicode that PostgreSQL can't handle
    const sanitizedContent = content
      .replace(/\x00/g, '') // Remove null bytes
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove other control chars except \t \n \r
      .replace(/\\u0000/g, '') // Remove escaped null bytes
      .normalize('NFD') // Normalize Unicode
      .replace(/[\uFFFE\uFFFF]/g, ''); // Remove BOM and invalid chars

    if (!sanitizedContent || sanitizedContent.trim().length === 0) {
      return NextResponse.json(
        { error: "File content was empty after sanitization" },
        { status: 400 }
      );
    }

    // Generate base source ID from filename
    const baseSourceId = `upload-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    // Store in Supabase using the vector service
    const vectorService = getSupabaseVectorService();
    
    // Determine if we need to chunk this document
    const shouldChunk = sanitizedContent.length > CHUNK_THRESHOLD;
    const vectorIds: string[] = [];

    if (shouldChunk) {
      // Chunk the document for better retrieval
      const chunks = chunkText(sanitizedContent, CHUNK_SIZE, CHUNK_OVERLAP);
      console.log(`[KNOWLEDGE UPLOAD] 📦 Chunking into ${chunks.length} parts (${sanitizedContent.length} chars)`);

      for (const chunk of chunks) {
        const chunkSourceId = `${baseSourceId}-chunk-${chunk.chunkIndex}`;
        
        // Build metadata for this chunk
        const chunkMetadata = {
          filename: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          // Chunking metadata
          isChunked: true,
          chunkIndex: chunk.chunkIndex,
          totalChunks: chunk.totalChunks,
          chunkStartChar: chunk.startChar,
          chunkEndChar: chunk.endChar,
          originalContentLength: sanitizedContent.length,
          parentSourceId: baseSourceId,
          ...(customMetadata ? JSON.parse(customMetadata) : {}),
        };

        const vectorId = await vectorService.upsertVector(
          organization,
          division,
          app_under_test,
          chunk.content,
          sourceType as any,
          chunkSourceId,
          chunkMetadata
        );
        vectorIds.push(vectorId);
        
        console.log(`[KNOWLEDGE UPLOAD] ✅ Chunk ${chunk.chunkIndex + 1}/${chunk.totalChunks} stored: ${vectorId}`);
      }

      return NextResponse.json({
        success: true,
        vectorIds,
        sourceId: baseSourceId,
        filename: file.name,
        contentLength: sanitizedContent.length,
        chunked: true,
        chunkCount: chunks.length,
        organization,
        division,
        app_under_test,
        message: `Successfully uploaded "${file.name}" as ${chunks.length} chunks to ${organization}/${division}/${app_under_test}`,
      });
    } else {
      // Store as single document (small file)
      const metadata = {
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        contentLength: sanitizedContent.length,
        originalLength: content.length,
        isChunked: false,
        ...(customMetadata ? JSON.parse(customMetadata) : {}),
      };

      const vectorId = await vectorService.upsertVector(
        organization,
        division,
        app_under_test,
        sanitizedContent,
        sourceType as any,
        baseSourceId,
        metadata
      );

      console.log(`[KNOWLEDGE UPLOAD] ✅ Stored with ID: ${vectorId}`);

      return NextResponse.json({
        success: true,
        vectorId,
        sourceId: baseSourceId,
        filename: file.name,
        contentLength: sanitizedContent.length,
        chunked: false,
        organization,
        division,
        app_under_test,
        message: `Successfully uploaded "${file.name}" to ${organization}/${division}/${app_under_test}`,
      });
    }
  } catch (error) {
    console.error("[KNOWLEDGE UPLOAD] Error:", error);
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to list vectors in the knowledge base
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organization = searchParams.get("organization") || DEFAULT_APP_CONTEXT.organization;
    const division = searchParams.get("division") || DEFAULT_APP_CONTEXT.division;
    const app_under_test = searchParams.get("app_under_test") || DEFAULT_APP_CONTEXT.app_under_test;

    const vectorService = getSupabaseVectorService();
    const stats = await vectorService.getVectorStats(organization, division, app_under_test);

    return NextResponse.json({
      organization,
      division,
      app_under_test,
      stats,
    });
  } catch (error) {
    console.error("[KNOWLEDGE UPLOAD] Error listing:", error);
    return NextResponse.json(
      {
        error: "Failed to list knowledge base",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove vectors
// If sourceId is provided: delete specific vector
// If deleteAll=true: delete ALL vectors of that sourceType (DANGER!)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get("sourceId");
    const deleteAll = searchParams.get("deleteAll") === "true";
    const sourceType = searchParams.get("sourceType") || "knowledge";
    const organization = searchParams.get("organization") || DEFAULT_APP_CONTEXT.organization;
    const division = searchParams.get("division") || DEFAULT_APP_CONTEXT.division;
    const app_under_test = searchParams.get("app_under_test") || DEFAULT_APP_CONTEXT.app_under_test;

    if (!sourceId && !deleteAll) {
      return NextResponse.json({ error: "sourceId is required (or use deleteAll=true to delete all)" }, { status: 400 });
    }

    const vectorService = getSupabaseVectorService();
    
    // If deleteAll, pass undefined for sourceId to delete all of that type
    const deletedCount = await vectorService.deleteVectorsBySource(
      organization,
      division,
      app_under_test,
      sourceType,
      deleteAll ? undefined : sourceId!
    );

    const message = deleteAll 
      ? `Deleted ALL ${deletedCount} ${sourceType} vector(s)`
      : `Deleted ${deletedCount} vector(s) with sourceId: ${sourceId}`;

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      deleteAll,
      message,
    });
  } catch (error) {
    console.error("[KNOWLEDGE UPLOAD] Delete error:", error);
    return NextResponse.json(
      {
        error: "Delete failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

