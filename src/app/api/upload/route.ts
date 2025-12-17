/**
 * ⚠️  DEPRECATED - This endpoint uses OpenAI vector stores
 * 
 * Use /api/knowledge/upload instead!
 * 
 * The correct architecture uses:
 * - Storage: Supabase PostgreSQL with pgvector extension
 * - Table: siam_vectors (multi-tenant)
 * - Embeddings: Gemini (768d) or OpenAI (1536d)
 * 
 * This file is kept for backward compatibility but should be migrated.
 * @deprecated Use /api/knowledge/upload instead
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const assistantId = formData.get("assistantId") as string;
    const purpose = (formData.get("purpose") as string) || "assistants";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a File object for OpenAI
    const openaiFile = new File([buffer], file.name, {
      type: file.type,
    });

    console.log(`[UPLOAD] Uploading file: ${file.name} (${file.size} bytes)`);

    // Upload to OpenAI
    const uploadedFile = await openai.files.create({
      file: openaiFile,
      purpose: purpose as any,
    });

    console.log(`[UPLOAD] File uploaded successfully: ${uploadedFile.id}`);

    // If assistant ID provided, attach to assistant's vector store
    if (assistantId) {
      try {
        // Get the assistant's vector store
        const assistant = await openai.beta.assistants.retrieve(assistantId);

        if (assistant.tool_resources?.file_search?.vector_store_ids?.[0]) {
          const vectorStoreId = assistant.tool_resources.file_search.vector_store_ids[0];

          // Add file to vector store
          await (openai.beta as any).vectorStores.files.create(vectorStoreId, {
            file_id: uploadedFile.id,
          });

          console.log(`[UPLOAD] File added to vector store: ${vectorStoreId}`);
        } else {
          // Create a new vector store if none exists
          const vectorStore = await (openai.beta as any).vectorStores.create({
            name: `SIAM Knowledge Base - ${new Date().toISOString()}`,
            file_ids: [uploadedFile.id],
          });

          // Update assistant with vector store
          await openai.beta.assistants.update(assistantId, {
            tool_resources: {
              file_search: {
                vector_store_ids: [vectorStore.id],
              },
            },
          });

          console.log(`[UPLOAD] Created new vector store: ${vectorStore.id}`);
        }
      } catch (error) {
        console.error("[UPLOAD] Error adding to vector store:", error);
        // Don't fail the upload if vector store fails
      }
    }

    return NextResponse.json({
      success: true,
      fileId: uploadedFile.id,
      fileName: file.name,
      fileSize: file.size,
      status: uploadedFile.status,
    });
  } catch (error) {
    console.error("[UPLOAD] Error:", error);
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // List uploaded files
    const files = await openai.files.list();

    return NextResponse.json({
      files: files.data.map((file) => ({
        id: file.id,
        filename: file.filename,
        bytes: file.bytes,
        createdAt: file.created_at,
        status: file.status,
      })),
    });
  } catch (error) {
    console.error("[UPLOAD] Error listing files:", error);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}
