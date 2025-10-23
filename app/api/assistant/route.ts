import { OpenAI } from "openai";
import { NextRequest, NextResponse } from "next/server";

// Initialize OpenAI client for assistant API
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY is not set in environment variables");
}

const openaiClient = new OpenAI({
  apiKey: apiKey || "",
});

// Get Assistant ID from environment variable
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID || "asst_VvOHL1c4S6YapYKun4mY29fM";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, action, fileIds } = body;

    // Handle file upload action
    if (action === "upload") {
      const formData = await req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      // Upload file to OpenAI - using proper File constructor
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create a proper File object for OpenAI
      const fileForUpload = new File([buffer], file.name, {
        type: file.type || "text/plain",
      });

      const uploadedFile = await openaiClient.files.create({
        file: fileForUpload,
        purpose: "assistants",
      });

      // Attach file to assistant's vector store
      const assistant = await openaiClient.beta.assistants.retrieve(ASSISTANT_ID);

      // Check if assistant has a vector store
      if (assistant.tool_resources?.file_search?.vector_store_ids?.[0]) {
        const vectorStoreId = assistant.tool_resources.file_search.vector_store_ids[0];

        // Add file to vector store
        await (openaiClient.beta as any).vectorStores.files.create(vectorStoreId, {
          file_id: uploadedFile.id,
        });
      } else {
        // Create a new vector store if none exists
        const vectorStore = await (openaiClient.beta as any).vectorStores.create({
          name: "SIAM Knowledge Base",
          file_ids: [uploadedFile.id],
        });

        // Update assistant with vector store
        await openaiClient.beta.assistants.update(ASSISTANT_ID, {
          tool_resources: {
            file_search: {
              vector_store_ids: [vectorStore.id],
            },
          },
        });
      }

      return NextResponse.json({
        success: true,
        fileId: uploadedFile.id,
        filename: file.name,
        message: `File "${file.name}" uploaded successfully to knowledge base`,
      });
    }

    // Handle chat with assistant
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Create a thread
    const thread = await openaiClient.beta.threads.create();

    // Add messages to thread
    for (const message of messages) {
      await openaiClient.beta.threads.messages.create(thread.id, {
        role: message.role as "user" | "assistant",
        content: message.content,
      });
    }

    // Run the assistant
    const run = await openaiClient.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
      // Include file IDs if provided
      ...(fileIds && {
        additional_instructions: `Consider these uploaded files: ${fileIds.join(", ")}`,
      }),
    });

    console.log("Run created:", {
      runId: run.id,
      threadId: thread.id,
      status: run.status,
    });

    // Wait for completion and stream response
    let runStatus = run;

    while (runStatus.status !== "completed") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openaiClient.beta.threads.runs.retrieve(thread.id, runStatus.id as any);

      if (runStatus.status === "failed" || runStatus.status === "cancelled") {
        return NextResponse.json({ error: "Assistant run failed" }, { status: 500 });
      }
    }

    // Get the assistant's response
    const messagesResponse = await openaiClient.beta.threads.messages.list(thread.id);
    const assistantMessage = messagesResponse.data[0];

    // For now, return a simple JSON response
    // TODO: Convert to streaming response compatible with Vercel AI SDK
    return NextResponse.json({
      content:
        assistantMessage.content[0].type === "text"
          ? assistantMessage.content[0].text.value
          : "Response not available",
      threadId: thread.id,
      runId: run.id,
    });
  } catch (error) {
    console.error("Assistant API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process assistant request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Handle file upload separately
export async function PUT(req: NextRequest) {
  try {
    console.log("PUT /api/assistant - File upload request received");

    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("Uploading file:", file.name, "Size:", file.size);

    // Upload file to OpenAI - using proper File constructor
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a proper File object for OpenAI
    const fileForUpload = new File([buffer], file.name, {
      type: file.type || "text/plain",
    });

    const uploadedFile = await openaiClient.files.create({
      file: fileForUpload,
      purpose: "assistants",
    });

    // Get assistant
    const assistant = await openaiClient.beta.assistants.retrieve(ASSISTANT_ID);

    // Get or create vector store
    let vectorStoreId: string;

    if (assistant.tool_resources?.file_search?.vector_store_ids?.[0]) {
      vectorStoreId = assistant.tool_resources.file_search.vector_store_ids[0];
    } else {
      // Create a new vector store
      const vectorStore = await (openaiClient.beta as any).vectorStores.create({
        name: "SIAM Knowledge Base",
      });
      vectorStoreId = vectorStore.id;

      // Update assistant with vector store
      await openaiClient.beta.assistants.update(ASSISTANT_ID, {
        tool_resources: {
          file_search: {
            vector_store_ids: [vectorStoreId],
          },
        },
      });
    }

    // Add file to vector store
    await (openaiClient.beta as any).vectorStores.files.create(vectorStoreId, {
      file_id: uploadedFile.id,
    });

    return NextResponse.json({
      success: true,
      fileId: uploadedFile.id,
      filename: file.name,
      message: `File "${file.name}" uploaded to SIAM knowledge base`,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
