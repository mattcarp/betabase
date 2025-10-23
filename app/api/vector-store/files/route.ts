import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Get Assistant ID from environment variable
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID || "asst_VvOHL1c4S6YapYKun4mY29fM";

export async function GET(_request: NextRequest) {
  try {
    // Get the assistant's vector store
    const assistant = await openai.beta.assistants.retrieve(ASSISTANT_ID);
    const vectorStoreId = assistant.tool_resources?.file_search?.vector_store_ids?.[0];

    // List all files with purpose "assistants"
    // In SDK v5, files uploaded with purpose "assistants" are available to the assistant
    const allFiles = await openai.files.list({ purpose: "assistants" });

    // Format files for the UI
    const formattedFiles = allFiles.data.map((file) => ({
      id: file.id,
      filename: file.filename,
      bytes: file.bytes,
      created_at: file.created_at,
      status: "ready",
      purpose: file.purpose,
    }));

    return NextResponse.json({
      files: formattedFiles,
      vectorStoreId: vectorStoreId || null,
      totalFiles: formattedFiles.length,
    });
  } catch (error) {
    console.error("[VECTOR_STORE] Error listing files:", error);
    return NextResponse.json(
      {
        error: "Failed to list vector store files",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a file from the vector store
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    console.log("Deleting file:", fileId);

    // Delete the file from OpenAI
    await openai.files.delete(fileId);

    return NextResponse.json({
      success: true,
      message: `File ${fileId} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      {
        error: "Failed to delete file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
