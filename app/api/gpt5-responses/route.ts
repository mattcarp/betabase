import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * CORRECT GPT-5 Responses API Implementation
 *
 * This uses the ACTUAL Responses API (openai.responses.create) - NOT Vercel AI SDK!
 * Key features:
 * - Automatic conversation context via previous_response_id
 * - Built-in tools (web_search, file_search, computer_use)
 * - 50-80% token reduction vs Assistants API
 * - Direct access to GPT-5 reasoning capabilities
 */

// Lazy initialize OpenAI client
let openai: OpenAI | null = null;

const getOpenAIClient = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

// Store response IDs for conversation continuity
const responseIdCache = new Map<string, string>();

export async function POST(req: NextRequest) {
  try {
    const client = getOpenAIClient();
    if (!client) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    const body = await req.json();

    // Handle both useChat format (messages array) and direct format (message string)
    let message: string;
    let conversationId: string;
    let reasoningEffort: string;
    let verbosity: string;
    let tools: string[];
    let vectorStoreIds: string[];

    if (body.messages && Array.isArray(body.messages)) {
      // useChat format from Vercel AI SDK
      const lastUserMessage = body.messages.filter((m: any) => m.role === "user").pop();
      if (!lastUserMessage) {
        throw new Error("No user message found");
      }
      message = lastUserMessage.content;
      conversationId = body.conversationId || body.id || "default";
      reasoningEffort = body.reasoningEffort || "medium";
      verbosity = body.verbosity || "medium";
      tools = body.tools || [];
      vectorStoreIds = body.vectorStoreIds || ["vs_3dqHL3Wcmt1WrUof0qS4UQqo"];
    } else {
      // Direct format
      message = body.message;
      conversationId = body.conversationId || "default";
      reasoningEffort = body.reasoningEffort || "medium";
      verbosity = body.verbosity || "medium";
      tools = body.tools || ["web_search", "file_search"];
      vectorStoreIds = body.vectorStoreIds || ["vs_3dqHL3Wcmt1WrUof0qS4UQqo"];
    }

    const usePreviousContext = body.usePreviousContext !== false;
    const maxOutputTokens = body.maxOutputTokens || 4096;

    // Get previous response ID for conversation continuity
    const previousResponseId = usePreviousContext ? responseIdCache.get(conversationId) : undefined;

    // Create the response using the actual Responses API
    const response = await client.responses.create({
      model: "gpt-5", // Using full GPT-5 model
      input: message,

      // This is the KEY feature - maintains conversation context automatically!
      previous_response_id: previousResponseId,

      // GPT-5 specific parameters - updated format
      reasoning: {
        effort: reasoningEffort as "minimal" | "low" | "medium" | "high",
      },
      text: {
        verbosity: verbosity as "low" | "medium" | "high",
      },
      max_output_tokens: maxOutputTokens,

      // Enable built-in tools - these work out of the box!
      tools: tools.map((tool: string) => {
        if (tool === "file_search") {
          return {
            type: "file_search" as const,
            vector_store_ids: vectorStoreIds,
          };
        }
        return { type: "web_search" as const };
      }),

      // Stream the response
      stream: true,
    });

    // Handle streaming response in Vercel AI SDK format
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = "";
          let responseId = "";

          // Send initial stream data in Vercel AI format
          controller.enqueue(encoder.encode('0:"\n"\n'));

          for await (const chunk of response) {
            // Extract response ID from the first chunk
            if ((chunk as any).id && !responseId) {
              responseId = (chunk as any).id;
              // Store for future conversation continuity
              responseIdCache.set(conversationId, responseId);
            }

            // Stream the text output in Vercel AI format
            if ((chunk as any).output_text) {
              fullResponse += (chunk as any).output_text;
              // Format for Vercel AI SDK: 0:"text content"
              const escaped = JSON.stringify((chunk as any).output_text);
              controller.enqueue(encoder.encode(`0:${escaped}\n`));
            }

            // Handle tool calls if present
            if ((chunk as any).tool_calls) {
              for (const toolCall of (chunk as any).tool_calls) {
                // Format tool calls for Vercel AI SDK
                const toolData = JSON.stringify({
                  toolCallId: toolCall.id || crypto.randomUUID(),
                  toolName: toolCall.type,
                  args: toolCall.parameters || {},
                });
                controller.enqueue(encoder.encode(`9:${toolData}\n`));
              }
            }

            // Stream reasoning steps (custom data)
            if ((chunk as any).reasoning) {
              const reasoningData = JSON.stringify({
                type: "reasoning",
                content: (chunk as any).reasoning,
              });
              controller.enqueue(encoder.encode(`8:${reasoningData}\n`));
            }
          }

          // Send finish message in Vercel AI format
          const finishData = JSON.stringify({
            finishReason: "stop",
            usage: {
              promptTokens: 0,
              completionTokens: 0,
              totalTokens: 0,
            },
          });
          controller.enqueue(encoder.encode(`d:${finishData}\n`));
          controller.close();
        } catch (error) {
          // Send error in Vercel AI format
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          const errorData = JSON.stringify({
            error: errorMessage,
          });
          controller.enqueue(encoder.encode(`3:"${errorData}"\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Vercel-AI-Data-Stream": "v1",
      },
    });
  } catch (error: any) {
    console.error("GPT-5 Responses API Error:", error);

    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve a specific response
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const responseId = searchParams.get("responseId");

  if (!responseId) {
    return NextResponse.json({ error: "responseId required" }, { status: 400 });
  }

  const client = getOpenAIClient();
  if (!client) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  try {
    // Retrieve a specific response and its context
    const response = await client.responses.retrieve(responseId);

    return NextResponse.json({
      responseId: response.id,
      model: response.model,
      output: response.output_text,
      tools_used: (response as any).tool_calls,
      usage: response.usage,
      previous_response_id: response.previous_response_id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to retrieve response", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE endpoint to start a fresh conversation
export async function DELETE(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const conversationId = searchParams.get("conversationId");

  if (conversationId) {
    responseIdCache.delete(conversationId);
    return NextResponse.json({
      message: "Conversation reset",
      conversationId,
    });
  }

  // Clear all conversations
  responseIdCache.clear();
  return NextResponse.json({ message: "All conversations cleared" });
}
