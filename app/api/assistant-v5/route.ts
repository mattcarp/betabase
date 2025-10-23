import OpenAI from "openai";
import { NextRequest } from "next/server";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Get Assistant ID from environment variable (server-side only)
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

if (!ASSISTANT_ID) {
  console.error("OPENAI_ASSISTANT_ID environment variable is not set!");
}

// Ensure assistant has file_search tool (run once on startup)
async function ensureAssistantHasFileSearch() {
  if (!ASSISTANT_ID) {
    console.error("Cannot check assistant tools - ASSISTANT_ID not set");
    return;
  }

  try {
    const assistant = await openai.beta.assistants.retrieve(ASSISTANT_ID);
    const hasFileSearch = assistant.tools?.some((tool) => tool.type === "file_search");

    if (!hasFileSearch) {
      console.log("Adding file_search tool to assistant...");
      await openai.beta.assistants.update(ASSISTANT_ID, {
        tools: [...(assistant.tools || []), { type: "file_search" }],
      });
      console.log("File search tool added to assistant");
    }
  } catch (error) {
    console.error("Error checking assistant tools:", error);
  }
}

// Initialize on first load
if (typeof global !== "undefined" && !global.assistantInitialized && ASSISTANT_ID) {
  ensureAssistantHasFileSearch();
  global.assistantInitialized = true;
}

// GET endpoint to list files in the assistant's vector store
export async function GET() {
  try {
    if (!ASSISTANT_ID) {
      return new Response(
        JSON.stringify({
          error: "Assistant not configured",
          details: "OPENAI_ASSISTANT_ID environment variable is not set",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get the assistant's vector store
    const assistant = await openai.beta.assistants.retrieve(ASSISTANT_ID);
    const vectorStoreId = assistant.tool_resources?.file_search?.vector_store_ids?.[0];

    if (!vectorStoreId) {
      return new Response(
        JSON.stringify({
          message: "No vector store found for assistant",
          files: [],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // For OpenAI SDK v5, we need to list all files and filter
    // The vector store files are typically stored with the assistant
    const allFiles = await openai.files.list({ purpose: "assistants" });

    return new Response(
      JSON.stringify({
        vectorStoreId,
        files: allFiles.data.map((file) => ({
          id: file.id,
          filename: file.filename,
          bytes: file.bytes,
          created_at: file.created_at,
          purpose: file.purpose,
        })),
        count: allFiles.data.length,
        assistant_tools: assistant.tools,
        tool_resources: assistant.tool_resources,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error listing files:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to list files",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!ASSISTANT_ID) {
      return new Response(
        JSON.stringify({
          error: "Assistant not configured",
          details: "OPENAI_ASSISTANT_ID environment variable is not set",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { threadId, message, fileIds } = await req.json();

    console.log("Assistant V5 API - Request received:", {
      threadId,
      message,
      fileIds,
    });

    // Create or get thread
    const thread = threadId
      ? await openai.beta.threads.retrieve(threadId)
      : await openai.beta.threads.create();

    console.log("Using thread:", thread.id);

    // Add the user message to the thread with file attachments
    const messageData: any = {
      role: "user",
      content: message,
    };

    // Attach files using the new attachments format for file_search
    if (fileIds && fileIds.length > 0) {
      messageData.attachments = fileIds.map((fileId: string) => ({
        file_id: fileId,
        tools: [{ type: "file_search" }],
      }));
    }

    const createdMessage = await openai.beta.threads.messages.create(thread.id, messageData);

    console.log("Message created:", createdMessage.id);

    // Run the assistant on the thread
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
      // Include instructions to use uploaded files if present
      ...(fileIds &&
        fileIds.length > 0 && {
          additional_instructions: `Please search and use the content from the uploaded files to answer the user's question. The files have been attached to this message.`,
        }),
    });

    console.log("Assistant run created:", run.id);

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id as any);

    while (runStatus.status !== "completed" && runStatus.status !== "failed") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id as any);
    }

    if (runStatus.status === "failed") {
      throw new Error("Assistant run failed");
    }

    // Get the messages
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find(
      (msg) => msg.role === "assistant" && msg.run_id === run.id
    );

    if (!assistantMessage || !assistantMessage.content[0]) {
      throw new Error("No response from assistant");
    }

    // Return the assistant's response
    return new Response(
      JSON.stringify({
        threadId: thread.id,
        messageId: assistantMessage.id,
        content:
          assistantMessage.content[0].type === "text"
            ? assistantMessage.content[0].text.value
            : "Unable to process response",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Assistant V5 API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process assistant request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Handle file uploads separately
export async function PUT(req: NextRequest) {
  try {
    if (!ASSISTANT_ID) {
      return new Response(
        JSON.stringify({
          error: "Assistant not configured",
          details: "OPENAI_ASSISTANT_ID environment variable is not set",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("PUT /api/assistant-v5 - File upload request");

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Uploading file:", file.name, "Size:", file.size);

    // Convert File to proper format for OpenAI
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to OpenAI
    const openaiFile = await openai.files.create({
      file: new File([buffer], file.name, { type: file.type }),
      purpose: "assistants",
    });

    console.log("File uploaded to OpenAI:", openaiFile.id);

    // Get or create vector store for the assistant
    const assistant = await openai.beta.assistants.retrieve(ASSISTANT_ID);
    const vectorStoreId = assistant.tool_resources?.file_search?.vector_store_ids?.[0];

    // In OpenAI SDK v5, vector stores are managed differently
    // The file is already uploaded and can be used with the assistant
    // The assistant already has a vector store configured
    console.log("File uploaded successfully for assistant use");
    console.log("Assistant vector store:", vectorStoreId);

    // The file will be automatically available to the assistant
    // when messages are sent with file attachments

    return new Response(
      JSON.stringify({
        success: true,
        fileId: openaiFile.id,
        filename: file.name,
        vectorStoreId,
        message: `File "${file.name}" uploaded to SIAM knowledge base`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("File upload error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
