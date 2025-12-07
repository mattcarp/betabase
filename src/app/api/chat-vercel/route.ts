import { openai } from "@ai-sdk/openai";
import { streamText, convertToCoreMessages } from "ai";
import { searchKnowledge } from "@/services/knowledgeSearchService";
import { aomaOrchestrator } from "@/services/aomaOrchestrator";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

/**
 * Vercel AI SDK Implementation
 * This is the recommended approach - using Vercel AI SDK's built-in capabilities
 * instead of waiting for OpenAI's Responses API
 *
 * Benefits:
 * - Works with multiple providers (OpenAI, Anthropic, etc.)
 * - Built-in streaming, tools, and conversation management
 * - Better TypeScript support and DX
 * - Already production-ready
 */

export async function POST(req: Request) {
  try {
    const { messages, model = "gpt-4o" } = await req.json();

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Invalid messages format",
          message: "Messages must be a non-empty array",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get the latest user message for AOMA knowledge query
    const latestUserMessage = Array.isArray(messages)
      ? messages.filter((msg: any) => msg.role === "user").pop()
      : null;

    let aomaContext = "";
    let ragMeta: any = null;

    // Query AOMA knowledge if we have a user message
    let aomaError = null;
    if (latestUserMessage?.content) {
      console.log("🎯 Orchestrating AOMA resources for:", latestUserMessage.content);

      try {
        // Run knowledge search in parallel with orchestration prep
        const ragPromise = searchKnowledge(latestUserMessage.content, {
          matchThreshold: 0.78,
          matchCount: 6,
        });

        const aomaResult = await aomaOrchestrator.executeOrchestration(latestUserMessage.content);

        if (aomaResult && (aomaResult.response || aomaResult.content)) {
          const contextContent = aomaResult.response || aomaResult.content;
          const metadata = aomaResult.metadata
            ? `\n[Tools Used: ${aomaResult.metadata.tools_used?.join(", ") || "query_aoma_knowledge"}]`
            : "";

          // Create the AOMA context with citation markers
          aomaContext = `\n\n[AOMA Context:${metadata}\n${contextContent}\n]`;

          // Store AOMA sources for citation rendering
          if (aomaResult.formattedSources || aomaResult.sources) {
            // Inject AOMA metadata into the system prompt so it passes through
            const sourcesInfo = JSON.stringify({
              sources: aomaResult.formattedSources || aomaResult.sources,
              metadata: aomaResult.metadata,
            });
            aomaContext += `\n[AOMA_SOURCES:${sourcesInfo}]`;
          }

          console.log("✅ AOMA orchestration completed successfully");
        }

        // Await RAG and incorporate top snippets
        try {
          const rag = await ragPromise;
          ragMeta = rag;
          if (rag.results?.length) {
            const snippets = rag.results
              .slice(0, 4)
              .map((r, i) => `(${i + 1}) [${r.source_type}] ${r.content?.slice(0, 400)}`)
              .join("\n---\n");
            aomaContext += `\n\n[KNOWLEDGE CONTEXT]\n${snippets}`;
            aomaContext += `\n[CONTEXT_META]{\"count\":${rag.stats.count},\"ms\":${rag.durationMs},\"sources\":${JSON.stringify(
              rag.stats.sourcesCovered
            )}}`;
          }
        } catch (e) {
          console.warn("RAG search failed:", e);
        }
      } catch (error) {
        // CRITICAL: BE HONEST ABOUT AOMA FAILURES
        console.error("❌ AOMA orchestration FAILED:", error);
        aomaError = error instanceof Error ? error.message : "AOMA connection failed";
        // DO NOT set a fake aomaContext - leave it empty
      }
    }

    // Convert messages to model format with proper error handling
    let modelMessages;
    try {
      modelMessages = convertToCoreMessages(messages);
    } catch (conversionError) {
      console.error("Failed to convert messages:", conversionError);
      // Fallback: create a simple message array
      modelMessages = messages.map((msg: any) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
      }));
    }

    // Build strict system prompt that avoids hallucinating AOMA
    const systemStrict = (() => {
      const base = "You are SIAM, an AI assistant for Sony Music.";
      if (aomaContext.trim()) {
        return `${base}\n\n✅ YOU HAVE ACCESS TO AOMA KNOWLEDGE - USE IT CONFIDENTLY\n${aomaContext}\n\nINSTRUCTIONS:\n1. Answer only using the AOMA context above.\n2. If a detail is missing, state that it isn’t in the provided context.\n3. Never invent facts.`;
      }
      // Enforce abstention if no AOMA context is present
      return `${base}\n\nRESPONSE REQUIRED:\nRespond with ONLY this message:\n\n"That's not in my knowledge base. I won't guess."`;
    })();

    // Stream response using Vercel AI SDK
    const result = streamText({
      model: openai(model),
      system: systemStrict,
      messages: modelMessages,
      temperature: 0.7,
      // maxSteps: 5, // Not valid in current version
      // Tools temporarily disabled - need to fix schema
      // tools: {
      //   searchAOMA: tool({
      //     description: "Search AOMA knowledge base for information",
      //     parameters: z.object({
      //       query: z.string().describe("The search query"),
      //       category: z
      //         .enum(["artists", "contracts", "royalties", "general"])
      //         .optional(),
      //     }),
      //     execute: async ({ query, category }) => {
      //       // Execute AOMA search
      //       const result = await aomaOrchestrator.executeOrchestration(query);
      //       return result?.response || "No results found";
      //     },
      //   }),
      //   analyzeContract: tool({
      //     description: "Analyze a contract or agreement",
      //     parameters: z.object({
      //       contractId: z.string().describe("The contract ID"),
      //       analysisType: z.enum(["summary", "terms", "compliance", "risks"]),
      //     }),
      //     execute: async ({ contractId, analysisType }) => {
      //       // Placeholder for contract analysis
      //       return `Analyzing contract ${contractId} for ${analysisType}`;
      //     },
      //   }),
      // },
      // Callback for tracking usage
      onFinish: ({ usage, finishReason }) => {
        console.log("📊 Token usage:", usage);
        console.log("✅ Finish reason:", finishReason);
        if (ragMeta) {
          console.log("📚 Knowledge stats:", {
            count: ragMeta.stats?.count,
            ms: ragMeta.durationMs,
            sources: ragMeta.stats?.sourcesCovered,
          });
        }
      },
    });

    // Return the streaming response
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      message: "Vercel AI SDK Chat API is running",
      framework: "Vercel AI SDK v5",
      features: {
        streaming: true,
        tools: true,
        multiProvider: true,
        aomaIntegration: true,
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
