import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Get the vector store ID from the assistant
async function getVectorStoreId(assistantId: string): Promise<string | null> {
  try {
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    return assistant.tool_resources?.file_search?.vector_store_ids?.[0] || null;
  } catch (error) {
    console.error("Error getting vector store ID:", error);
    return null;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const resolvedParams = await params;
    const fileId = resolvedParams.fileId;
    const assistantId =
      request.nextUrl.searchParams.get("assistantId") || "asst_VvOHL1c4S6YapYKun4mY29fM";

    console.log(`[VECTOR_STORE] Deleting file ${fileId} from assistant ${assistantId}`);

    // Get vector store ID from assistant
    const vectorStoreId = await getVectorStoreId(assistantId);

    if (!vectorStoreId) {
      return NextResponse.json(
        { error: "No vector store found for this assistant" },
        { status: 404 }
      );
    }

    // Track deletion results
    let vectorStoreDeleted = false;
    let fileDeleted = false;
    const errors = [];

    // Delete from vector store
    try {
      await (openai.beta as any).vectorStores.files.delete(vectorStoreId, fileId);
      console.log(`[VECTOR_STORE] Removed file ${fileId} from vector store`);
      vectorStoreDeleted = true;
    } catch (error) {
      console.error(`[VECTOR_STORE] Error removing from vector store:`, error);
      errors.push(
        `Vector store deletion failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Delete the file from OpenAI
    try {
      await openai.files.delete(fileId);
      console.log(`[VECTOR_STORE] Deleted file ${fileId} from OpenAI`);
      fileDeleted = true;
    } catch (error) {
      console.error(`[VECTOR_STORE] Error deleting file from OpenAI:`, error);
      errors.push(
        `File deletion failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Return appropriate response based on what succeeded
    if (vectorStoreDeleted || fileDeleted) {
      return NextResponse.json({
        success: true,
        fileId,
        message: "File deleted successfully",
        partial: !vectorStoreDeleted || !fileDeleted,
        errors: errors.length > 0 ? errors : undefined,
      });
    } else {
      // Both deletions failed
      return NextResponse.json(
        {
          error: "Failed to delete file from both vector store and file storage",
          details: errors,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[VECTOR_STORE] Error deleting file:", error);
    return NextResponse.json(
      {
        error: "Failed to delete file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const resolvedParams = await params;
    const fileId = resolvedParams.fileId;

    // Get file details from OpenAI
    const file = await openai.files.retrieve(fileId);

    return NextResponse.json({
      id: file.id,
      filename: file.filename,
      bytes: file.bytes,
      created_at: file.created_at,
      purpose: file.purpose,
      status: file.status,
    });
  } catch (error) {
    console.error("[VECTOR_STORE] Error getting file details:", error);
    return NextResponse.json(
      {
        error: "Failed to get file details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 404 }
    );
  }
}
