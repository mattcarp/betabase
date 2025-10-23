import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * FIXED GPT-5 Implementation using available OpenAI methods
 * Until openai.responses.create() is available, we use chat.completions
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

// Store conversation history
const conversationStore = new Map<string, any[]>();

export async function POST(req: NextRequest) {
  try {
    const client = getOpenAIClient();
    if (!client) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }
    const {
      message,
      conversationId,
      tools = ["web_search", "file_search"],
      temperature = 0.7,
      maxTokens = 4096,
    } = await req.json();

    // Get or create conversation history
    const messages = conversationStore.get(conversationId) || [];

    // Add the new user message
    messages.push({ role: "user", content: message });

    // Create streaming response using available API
    const stream = await client.chat.completions.create({
      model: "gpt-4-turbo-preview", // Use until GPT-5 is available
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens,
      stream: true,
      // Note: When GPT-5 is available, add:
      // reasoning_effort: 'medium',
      // verbosity: 'medium',
    });

    // Handle streaming
    const encoder = new TextEncoder();
    const responseStream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullResponse += content;
            const data = JSON.stringify({
              type: "text",
              content: content,
              conversationId: conversationId,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }

        // Store assistant response in history
        messages.push({ role: "assistant", content: fullResponse });
        conversationStore.set(conversationId, messages);

        // Send completion signal
        const finalData = JSON.stringify({
          type: "done",
          conversationId: conversationId,
        });
        controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
        controller.close();
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const conversationId = searchParams.get("conversationId");

  if (conversationId) {
    conversationStore.delete(conversationId);
  } else {
    conversationStore.clear();
  }

  return NextResponse.json({ message: "Conversation cleared" });
}
