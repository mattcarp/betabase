/**
 * Fixit Chat API - Programmer-focused Code Assistant
 *
 * Streamlined chat endpoint for code debugging and understanding.
 * Focuses on git, jira, and codebase knowledge sources.
 *
 * Key differences from main /api/chat:
 * - Programmer-specific system prompt
 * - Code artifact response formatting
 * - Git commit history priority
 * - JIRA ticket integration
 */

import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod/v3";
import { searchKnowledge } from "@/services/knowledgeSearchService";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

// Input validation schemas
const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(10000).optional(),
  parts: z.array(z.any()).optional(),
});

const FixitRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  systemPrompt: z.string().max(10000).optional(),
  sourceTypes: z.array(z.string()).optional(),
});

// Programmer-focused system prompt
const PROGRAMMER_SYSTEM_PROMPT = `You are a senior software engineer assistant focused on helping developers understand and debug codebases.

You have access to:
- Git commit history and code changes
- JIRA tickets and issue tracking
- Confluence documentation
- Project knowledge base

When answering questions:
1. Be precise and technical - assume the user is a programmer
2. Reference specific files, functions, and line numbers when possible
3. Generate code snippets with syntax highlighting
4. Create Mermaid diagrams for architecture explanations
5. Link to relevant JIRA tickets when discussing bugs or features

For code responses, format them as artifacts that can be displayed:
\`\`\`artifact:code
{
  "title": "Description of the code",
  "language": "typescript",
  "filePath": "src/path/to/file.ts",
  "lineStart": 10,
  "lineEnd": 50,
  "source": "git"
}
\`\`\`
<code content here>
\`\`\`

For architecture diagrams:
\`\`\`artifact:diagram
{
  "title": "Architecture Diagram"
}
\`\`\`
<mermaid content here>
\`\`\`

When referencing JIRA tickets, use the format: JIRA-123
When discussing specific commits, mention the commit hash.

IMPORTANT: Always be helpful and provide actionable guidance. If you don't know something, say so clearly rather than guessing.`;

export async function GET(_req: Request) {
  return new Response(
    JSON.stringify({
      status: "ready",
      version: "1.0.0",
      provider: "google",
      model: "gemini-3-flash-preview",
      features: ["streaming", "code-artifacts", "git-search", "jira-integration"],
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export async function POST(req: Request) {
  try {
    console.log("[Fixit] ========== POST /api/fixit/chat ==========");

    // Validate API key
    if (!process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("[Fixit] No Google API key configured");
      return new Response(
        JSON.stringify({
          error: "Service configuration error",
          code: "CONFIG_ERROR",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Google provider
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
    });

    // Parse and validate request
    const body = await req.json();
    const validation = FixitRequestSchema.safeParse(body);
    if (!validation.success) {
      console.warn("[Fixit] Invalid request:", validation.error.errors);
      return new Response(
        JSON.stringify({
          error: "Invalid request format",
          details: process.env.NODE_ENV === "development" ? validation.error.errors : undefined,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages, systemPrompt, sourceTypes } = validation.data;

    // Convert messages to proper format
    const formattedMessages = messages
      .filter((msg: any) => {
        const content = msg.parts?.find((p: any) => p.type === "text")?.text || msg.content;
        return content != null && content !== "";
      })
      .map((msg: any) => {
        const content = String(
          msg.parts?.find((p: any) => p.type === "text")?.text || msg.content || ""
        );
        return { role: msg.role as "user" | "assistant" | "system", content };
      });

    if (formattedMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid messages provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get the latest user message for RAG
    const latestUserMessage = formattedMessages.filter((m) => m.role === "user").pop();
    const queryString = latestUserMessage?.content || "";

    // Search knowledge base with programmer-focused sources
    let contextBlock = "";
    let searchMetadata = null;

    if (queryString) {
      console.log(`[Fixit] Searching knowledge for: ${queryString.substring(0, 100)}...`);

      try {
        const searchResult = await searchKnowledge(queryString, {
          sourceTypes: (sourceTypes as any) || ["git", "jira", "confluence", "knowledge"],
          matchThreshold: 0.45,
          matchCount: 8,
          timeoutMs: 5000,
        });

        if (searchResult.results.length > 0) {
          // Format results for the prompt
          const contextParts = searchResult.results.map((r, i) => {
            const sourceLabel = r.source_type?.toUpperCase() || "KNOWLEDGE";
            const metadata = r.metadata || {};
            const title = metadata.title || metadata.file_path || metadata.ticket_key || `Source ${i + 1}`;

            let contextEntry = `[${sourceLabel}] ${title}\n`;

            // Add specific metadata for different source types
            if (r.source_type === "git" && metadata.file_path) {
              contextEntry += `File: ${metadata.file_path}\n`;
              if (metadata.commit_hash) {
                contextEntry += `Commit: ${metadata.commit_hash.slice(0, 7)}\n`;
              }
            }

            if (r.source_type === "jira" && metadata.ticket_key) {
              contextEntry += `Ticket: ${metadata.ticket_key}\n`;
              if (metadata.status) {
                contextEntry += `Status: ${metadata.status}\n`;
              }
            }

            contextEntry += `Content: ${r.content.slice(0, 800)}${r.content.length > 800 ? "..." : ""}\n`;

            return contextEntry;
          });

          contextBlock = `\n\n[KNOWLEDGE BASE CONTEXT]\nThe following information was retrieved from the codebase and documentation:\n\n${contextParts.join("\n---\n")}\n\n[END CONTEXT]`;

          searchMetadata = {
            sources: searchResult.stats.sourcesCovered,
            count: searchResult.stats.count,
            durationMs: searchResult.durationMs,
          };

          console.log(`[Fixit] Found ${searchResult.results.length} relevant documents`);
        }
      } catch (err) {
        console.error("[Fixit] Knowledge search failed:", err);
        // Continue without context - graceful degradation
      }
    }

    // Build the enhanced system prompt
    const finalSystemPrompt = (systemPrompt || PROGRAMMER_SYSTEM_PROMPT) + contextBlock;

    console.log(`[Fixit] Starting stream with ${formattedMessages.length} messages`);
    console.log(`[Fixit] Context length: ${contextBlock.length} chars`);

    // Stream the response
    const result = streamText({
      model: google("gemini-3-flash-preview"),
      messages: formattedMessages,
      system: finalSystemPrompt,
      temperature: 0.7,
      onFinish: ({ text }) => {
        console.log(`[Fixit] Stream finished. Response length: ${text.length} chars`);
      },
    });

    // Create a custom text stream response that sends plain text chunks
    // This is easier to parse on the client than the complex UI message format
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            // Send as data stream format: 0:"text"
            const data = `0:${JSON.stringify(chunk)}\n`;
            controller.enqueue(encoder.encode(data));
          }
          controller.close();
        } catch (error) {
          console.error("[Fixit] Stream error:", error);
          controller.error(error);
        }
      },
    });

    const response = new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

    // Attach search metadata
    if (searchMetadata) {
      response.headers.set("X-Search-Metadata", JSON.stringify(searchMetadata));
    }
    response.headers.set("Access-Control-Expose-Headers", "X-Search-Metadata");

    return response;
  } catch (error) {
    console.error("[Fixit] API error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        error: "An error occurred processing your request",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
