import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// GET endpoint to fetch file content for preview
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    console.log("[FILE_CONTENT] Fetching content for file:", fileId);

    // Retrieve file content from OpenAI
    const fileContent = await openai.files.content(fileId);

    // Convert the response to text
    const contentText = await fileContent.text();

    // Limit content size to prevent huge responses (max 50KB)
    const maxLength = 50000;
    const truncatedContent =
      contentText.length > maxLength
        ? contentText.substring(0, maxLength) + "\n\n... (content truncated for preview)"
        : contentText;

    return NextResponse.json({
      success: true,
      fileId,
      content: truncatedContent,
      size: contentText.length,
      truncated: contentText.length > maxLength,
    });
  } catch (error) {
    console.error("[FILE_CONTENT] Error fetching file content:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch file content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
