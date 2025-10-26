import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
// import type OpenAI from "openai"; // Not needed for Vercel AI SDK
// import { aomaCache } from "../../../src/services/aomaCache";
import { aomaOrchestrator } from "../../../src/services/aomaOrchestrator";
// import { aomaParallelQuery } from "../../../src/services/aomaParallelQuery";
import { modelConfig } from "../../../src/services/modelConfig";
import { searchKnowledge } from "../../../src/services/knowledgeSearchService";

// Allow streaming responses up to 60 seconds for AOMA queries
export const maxDuration = 60;

// Initialize OpenAI provider for Vercel AI SDK (server-side only)
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Validate API key is configured
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

// REMOVED: Client-side rate limiting
// Let OpenAI handle rate limits naturally - we'll catch 429s and show friendly errors
// This allows normal single-user usage while still handling rate limit errors gracefully

// Enhanced query for context (currently unused)
/* function enhanceQueryForContext(query: string): string {
  const lowerQuery = query.toLowerCase();

  // SIAM-specific terms
  if (lowerQuery.includes("siam") && !lowerQuery.includes("sony")) {
    return `${query} [Context: SIAM is Sony Music's AI assistant that integrates with the AOMA platform for accessing enterprise resources]`;
  }

  // AOMA-specific terms
  if (lowerQuery.includes("aoma") && !lowerQuery.includes("sony")) {
    return `${query} [Context: AOMA is Sony Music's enterprise platform that integrates various tools including Jira, Git, knowledge bases, and email systems]`;
  }

  // Default case - no enhancement needed
  return query;
} */

// Knowledge object structure for structured responses
interface KnowledgeElement {
  type: "context" | "fact" | "suggestion" | "warning" | "code" | "reference";
  content: string;
  metadata?: {
    source?: string;
    confidence?: number;
    timestamp?: string;
    screenshot_path?: string; // NEW: Screenshot path for visual context
    [key: string]: any;
  };
}

// Input validation schemas
const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(10000).optional(), // 10KB limit per message, optional for v5 parts
  parts: z.array(z.any()).optional(), // For AI SDK v5 format
});

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50), // Max 50 messages in history
  model: z
    .enum(["gpt-5", "gpt-5-pro", "gpt-4o", "gpt-4o-mini", "o3", "o3-pro", "o4-mini"])
    .optional(),
  temperature: z.number().min(0).max(2).optional(),
  systemPrompt: z.string().max(5000).optional(), // 5KB limit for system prompt
});

export async function GET(_req: Request) {
  // Handle GET requests - return API info/status
  return new Response(
    JSON.stringify({
      status: "ready",
      version: "1.0.0",
      models: ["gpt-4o", "gpt-4o-mini", "gpt-5"],
      features: ["streaming", "aoma-context", "knowledge-base"],
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export async function OPTIONS(_req: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function POST(req: Request) {
  // const chatStartTime = Date.now(); // Used for tracking (currently disabled)

  try {
    console.log("[API] ========== POST /api/chat REQUEST START ==========");
    console.log("[API] Timestamp:", new Date().toISOString());
    console.log("[API] NODE_ENV:", process.env.NODE_ENV);
    console.log("[API] NEXT_PUBLIC_BYPASS_AUTH:", process.env.NEXT_PUBLIC_BYPASS_AUTH);
    console.log("[API] OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);

    // ========================================
    // AUTHENTICATION CHECK (P0 CRITICAL FIX)
    // ========================================
    // Check if auth is bypassed for development
    // Note: NEXT_PUBLIC_ vars don't work reliably in API routes, so check both
    const bypassAuth =
      process.env.NEXT_PUBLIC_BYPASS_AUTH === "true" || process.env.NODE_ENV === "development";

    console.log("[API] Bypass auth:", bypassAuth);

    if (!bypassAuth) {
      console.log("[API] Checking authentication...");

      // Validate Supabase configuration before attempting auth check
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error("[API] Supabase configuration missing! Cannot perform authentication.");
        console.error("[API] NEXT_PUBLIC_SUPABASE_URL:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.error(
          "[API] NEXT_PUBLIC_SUPABASE_ANON_KEY:",
          !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        return new Response(
          JSON.stringify({
            error: "Service configuration error",
            code: "SUPABASE_CONFIG_MISSING",
            message:
              "Authentication is enabled but Supabase credentials are not configured. Please contact support.",
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing user sessions.
              }
            },
          },
        }
      );

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("[API] Session check error:", sessionError);
        return new Response(
          JSON.stringify({
            error: "Authentication error",
            details: process.env.NODE_ENV === "development" ? sessionError.message : undefined,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (!session) {
        console.warn("[API] Unauthorized chat attempt - no session");
        return new Response(JSON.stringify({ error: "Authentication required" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log(`[API] Authenticated request from user: ${session.user.email}`);
    } else {
      console.log("[API] BYPASS_AUTH enabled - skipping authentication check");
    }
    console.log("[API] ✅ Authentication check complete");
    // ========================================
    // END AUTHENTICATION CHECK
    // ========================================

    // Check for API key configuration
    if (!process.env.OPENAI_API_KEY) {
      console.error("[API] OPENAI_API_KEY is not set in environment variables");
      return new Response(
        JSON.stringify({
          error: "Service temporarily unavailable",
          code: "CONFIG_ERROR",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("[API] Parsing request body...");
    const body = await req.json();
    console.log("[API] Body parsed. Messages count:", body.messages?.length);

    // ========================================
    // INPUT VALIDATION (P0 CRITICAL FIX)
    // ========================================
    console.log("[API] Validating request...");
    const validation = ChatRequestSchema.safeParse(body);
    if (!validation.success) {
      console.warn("[API] Invalid request:", validation.error.errors);
      return new Response(
        JSON.stringify({
          error: "Invalid request format",
          details: process.env.NODE_ENV === "development" ? validation.error.errors : undefined,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { messages, model, temperature = 0.7, systemPrompt } = validation.data;
    // ========================================
    // END INPUT VALIDATION
    // ========================================

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Convert UI messages to Vercel AI SDK format with NULL content validation
    // AI SDK v5 sends messages with 'parts' array, v4 uses 'content' string
    const openAIMessages: any[] = messages
      .filter((msg: any) => {
        // Extract content from v5 parts array or v4 content string
        const content = msg.parts?.find((p: any) => p.type === "text")?.text || msg.content;

        // Filter out messages with null, undefined, or empty content
        if (content == null || content === "") {
          console.warn(`[API] Filtering out message with invalid content:`, {
            role: msg.role,
            content,
            parts: msg.parts,
          });
          return false;
        }

        // Filter out unsupported roles
        const supportedRoles = ["system", "user", "assistant", "tool"];
        if (!supportedRoles.includes(msg.role)) {
          console.warn(`Skipping message with unsupported role: ${msg.role}`);
          return false;
        }

        return true;
      })
      .map((msg: any) => {
        // Extract content from v5 parts array or v4 content string
        const content = String(
          msg.parts?.find((p: any) => p.type === "text")?.text || msg.content || ""
        );

        if (msg.role === "system") {
          return { role: "system", content };
        } else if (msg.role === "user") {
          return { role: "user", content };
        } else if (msg.role === "assistant") {
          return { role: "assistant", content };
        } else if (msg.role === "tool") {
          // Handle tool messages - convert to proper format
          return { role: "tool", content, tool_call_id: msg.tool_call_id || "unknown" };
        }
        // This should never happen due to filter above, but TypeScript needs this
        return { role: "user", content };
      });

    // Validate we have at least one message after filtering
    if (openAIMessages.length === 0) {
      console.error("[API] No valid messages after filtering null content");
      return new Response(
        JSON.stringify({
          error: "No valid messages provided. All messages had null or empty content.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize AOMA context and knowledge elements
    let aomaContext = "";
    let aomaConnectionStatus = "not-queried";
    const knowledgeElements: KnowledgeElement[] = [];

    // AOMA Integration Control (P0 CRITICAL FIX)
    // Only bypass AOMA in development if explicitly requested
    const bypassAOMA =
      process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_BYPASS_AOMA === "true";

    console.log(
      `🔧 AOMA bypass: ${bypassAOMA} (dev=${process.env.NODE_ENV === "development"}, flag=${process.env.NEXT_PUBLIC_BYPASS_AOMA})`
    );

    // Check if we need AOMA context
    const latestUserMessage = messages.filter((m: any) => m.role === "user").pop();

    // Extract content from AI SDK v5 parts format or v4 content format
    const messageContent = latestUserMessage?.parts?.find((p: any) => p.type === "text")?.text || latestUserMessage?.content;

    if (!bypassAOMA && latestUserMessage && messageContent) {
      const queryString =
        typeof messageContent === "string"
          ? messageContent
          : JSON.stringify(messageContent);

      console.log("🎯 Using LangChain orchestrator for AOMA:", queryString.substring(0, 100));

      // Performance tracking
      const perfStart = Date.now();
      let railwayStartTime: number, railwayEndTime: number;
      let supabaseStartTime: number, supabaseEndTime: number;

      try {
        // PARALLEL HYBRID APPROACH: Query both Railway MCP AND Supabase vector store
        // This gives us comprehensive coverage from all knowledge sources
        console.log("⏳ Starting parallel queries: AOMA orchestrator + Supabase vectors...");

        // Start Supabase knowledge search in parallel
        supabaseStartTime = Date.now();
        const ragPromise = searchKnowledge(queryString, {
          matchThreshold: 0.78,
          matchCount: 6,
        });

        // Wrap orchestrator call with timeout to prevent hanging
        // Railway typically responds in 10-15s, so 45s timeout is reasonable
        console.log("🚂 Starting Railway MCP query...");
        railwayStartTime = Date.now();
        const orchestratorResult = await Promise.race([
          aomaOrchestrator.executeOrchestration(queryString),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("AOMA orchestrator timeout after 45s")), 45000)
          ),
        ]) as any;
        railwayEndTime = Date.now();
        const railwayDuration = railwayEndTime - railwayStartTime;
        console.log(`⚡ Railway MCP responded in ${railwayDuration}ms`);

        if (orchestratorResult && (orchestratorResult.response || orchestratorResult.content)) {
          const contextContent = orchestratorResult.response || orchestratorResult.content;

          knowledgeElements.push({
            type: "context",
            content: contextContent,
            metadata: {
              source: "aoma-orchestrator",
              timestamp: new Date().toISOString(),
            },
          });

          aomaContext = `\n\n[AOMA Context:\n${contextContent}\n]`;
          aomaConnectionStatus = "success";
          console.log("✅ AOMA orchestration successful");
        } else {
          console.error("❌ AOMA orchestrator returned no content", orchestratorResult);
          aomaConnectionStatus = "failed";

          knowledgeElements.push({
            type: "warning",
            content:
              "The AOMA knowledge base is currently unavailable. This may be a temporary connection issue. If this persists, please contact matt@mattcarpenter.com for assistance.",
            metadata: {
              timestamp: new Date().toISOString(),
            },
          });
        }

        // Await Supabase RAG results and merge with AOMA context
        try {
          console.log("⏳ Waiting for Supabase vector search...");
          const rag = await ragPromise;
          supabaseEndTime = Date.now();
          const supabaseDuration = supabaseEndTime - supabaseStartTime;

          if (rag.results?.length) {
            console.log(
              `✅ Supabase returned ${rag.results.length} results in ${rag.durationMs}ms (total: ${supabaseDuration}ms)`
            );

            // Add top snippets to context with screenshot paths
            const snippets = rag.results
              .slice(0, 4)
              .map((r, i) => {
                const screenshotInfo = r.metadata?.screenshot_path
                  ? `\n📸 Screenshot: ${r.metadata.screenshot_path}`
                  : "";
                return `(${i + 1}) [${r.source_type}] ${r.content?.slice(0, 400)}${screenshotInfo}`;
              })
              .join("\n---\n");

            aomaContext += `\n\n[SUPABASE KNOWLEDGE]\n${snippets}`;
            aomaContext += `\n[CONTEXT_META]{"count":${rag.stats.count},"ms":${rag.durationMs},"sources":${JSON.stringify(
              rag.stats.sourcesCovered
            )}}`;

            // Add knowledge elements with screenshots
            rag.results.slice(0, 4).forEach((r) => {
              if (r.metadata?.screenshot_path) {
                knowledgeElements.push({
                  type: "reference",
                  content: r.content || "",
                  metadata: {
                    source: "supabase-vectors",
                    screenshot_path: r.metadata.screenshot_path,
                    timestamp: new Date().toISOString(),
                  },
                });
              }
            });

            knowledgeElements.push({
              type: "context",
              content: `Found ${rag.stats.count} relevant documents from ${rag.stats.sourcesCovered.join(", ")}`,
              metadata: {
                source: "supabase-vectors",
                duration: rag.durationMs,
                timestamp: new Date().toISOString(),
              },
            });
          } else {
            console.log("⚠️  Supabase vector search returned 0 results");
          }
        } catch (ragError) {
          console.warn("⚠️  Supabase RAG search failed:", ragError);
          // Don't fail the whole request if Supabase fails - we still have Railway MCP
        }

        // Performance summary
        const totalDuration = Date.now() - perfStart;
        console.log("📊 AOMA Query Performance Summary:", {
          totalMs: totalDuration,
          railwayMs: railwayEndTime ? railwayEndTime - railwayStartTime : "N/A",
          supabaseMs: supabaseEndTime ? supabaseEndTime - supabaseStartTime : "N/A",
          contextLength: aomaContext.length,
          status: aomaConnectionStatus,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDuration = Date.now() - perfStart;

        // Determine error source and type
        const errorType = errorMessage.includes("timeout")
          ? "TIMEOUT"
          : errorMessage.includes("ECONNREFUSED") || errorMessage.includes("unreachable")
            ? "CONNECTION_REFUSED"
            : errorMessage.includes("401") || errorMessage.includes("API key")
              ? "AUTH_ERROR"
              : errorMessage.includes("match_aoma_vectors")
                ? "SUPABASE_FUNCTION_MISSING"
                : "UNKNOWN";

        // Log comprehensive error details server-side
        console.error("❌ AOMA query error:", {
          errorType,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          query: queryString.substring(0, 100),
          durationMs: errorDuration,
          railwayDuration: railwayEndTime ? railwayEndTime - railwayStartTime : "N/A",
          supabaseDuration: supabaseEndTime ? supabaseEndTime - supabaseStartTime : "N/A",
          timestamp: new Date().toISOString(),
        });

        aomaConnectionStatus = "failed";

        // Provide specific user-facing error messages based on error type
        let userMessage = "AOMA knowledge base temporarily unavailable.";

        if (errorMessage.includes("API key") || errorMessage.includes("401")) {
          userMessage =
            "⚠️ AOMA MCP server authentication error. The OpenAI API key needs to be updated. Please contact support.";
          console.error("🔑 CRITICAL: AOMA MCP server has invalid OpenAI API key!");
        } else if (errorMessage.includes("unreachable") || errorMessage.includes("ECONNREFUSED")) {
          userMessage = "⚠️ AOMA MCP server is not responding. Please check that it's running.";
          console.error("🔌 CRITICAL: Cannot connect to AOMA MCP server!");
        } else if (errorMessage.includes("timeout")) {
          userMessage = "⚠️ AOMA query timed out. The server may be overloaded.";
        }

        knowledgeElements.push({
          type: "warning",
          content: userMessage,
          metadata: {
            timestamp: new Date().toISOString(),
            errorType: errorMessage.includes("API key")
              ? "auth_error"
              : errorMessage.includes("unreachable")
                ? "connection_error"
                : errorMessage.includes("timeout")
                  ? "timeout_error"
                  : "unknown_error",
          },
        });
      }
    }

    // Enhanced system prompt that includes AOMA orchestration context
    const enhancedSystemPrompt = aomaContext.trim()
      ? `${systemPrompt || "You are SIAM, an AI assistant for Sony Music with access to AOMA knowledge."}

**CRITICAL: AOMA KNOWLEDGE CONTEXT PROVIDED BELOW**
${aomaContext}

**MANDATORY RESPONSE PROTOCOL:**
1. ⚠️ **STOP AND READ THE CONTEXT ABOVE FIRST** - The AOMA knowledge context contains the authoritative information you MUST use
2. **ONLY answer from the context** - If the answer is in the context above, use ONLY that information
3. **If context is insufficient** - Explicitly state: "The AOMA documentation doesn't cover this specific question. I can only answer based on the provided knowledge base."
4. **NEVER fabricate** - Do not make up workflow steps, feature lists, UI details, or any other specifics not in the context
5. **No general knowledge fallback** - Do not use your training data about asset management systems - ONLY use the provided context

**FORBIDDEN BEHAVIORS:**
❌ Creating detailed workflow steps not in the context
❌ Making up AOMA feature names or UI elements
❌ Providing general "best practices" instead of context-based answers
❌ Claiming knowledge about AOMA features without citing the context

**REQUIRED BEHAVIOR:**
✅ Base your ENTIRE answer on the context above
✅ If the context is incomplete, say so explicitly
✅ Reference specific parts of the context in your answer
✅ If you're unsure, say: "The provided documentation doesn't cover this"`
      : `${systemPrompt || "You are SIAM, an AI assistant for Sony Music."}

**CURRENT STATUS:** AOMA knowledge base connection is unavailable.

**RESPONSE GUIDELINES:**
1. You can still provide helpful general information about enterprise asset management systems
2. Be honest that specific AOMA documentation isn't currently accessible
3. Suggest general best practices and common workflows
4. For Sony Music-specific details, suggest contacting matt@mattcarpenter.com

**DO NOT:**
- Fabricate specific Sony Music policies
- Make up AOMA features or URLs
- Claim access to documentation you don't have`;

    // Determine model based on AOMA involvement
    const hasAomaContent = aomaContext.trim() !== "";
    const useCase = hasAomaContent ? "aoma-query" : "chat";
    const modelSettings = modelConfig.getModelWithConfig(useCase);
    const selectedModel = model || modelSettings.model || "gpt-4o-mini";

    console.log(`🤖 Creating stream with model: ${selectedModel}`);
    console.log(
      `📊 Settings: temp=${modelSettings.temperature}, maxTokens=${modelSettings.maxTokens}`
    );
    console.log(`💬 Messages: ${openAIMessages.length} messages`);
    console.log(`📚 AOMA Context: ${hasAomaContent ? `${aomaContext.length} chars` : "NONE"}`);
    console.log(`🎯 Connection Status: ${aomaConnectionStatus}`);

    // Log context preview for debugging hallucination issues
    if (hasAomaContent && process.env.NODE_ENV === "development") {
      console.log("📄 AOMA Context Preview (first 500 chars):");
      console.log(aomaContext.substring(0, 500));
      console.log("...");
    }

    // Use Vercel AI SDK streamText for proper useChat hook compatibility
    console.log("⏳ Calling AI SDK streamText...");
    const result = streamText({
      model: openai(selectedModel),
      messages: openAIMessages, // Already in correct format after filtering/validation
      system: enhancedSystemPrompt, // Use system parameter instead of adding to messages array
      temperature: modelSettings.temperature || temperature,
      // Note: AI SDK handles token limits via the model config, not maxTokens parameter
    });

    console.log("✅ Stream created successfully");

    // Track successful request (disabled - trackRequest no longer exported from introspection)
    // trackRequest("/api/chat", "POST", Date.now() - chatStartTime, 200);

    // Return Vercel AI SDK response format (compatible with useChat hook)
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("❌ Chat API error:", error);
    console.error("❌ Error type:", typeof error);
    console.error("❌ Error name:", error instanceof Error ? error.name : "Unknown");
    console.error("❌ Error message:", error instanceof Error ? error.message : String(error));
    console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack trace");

    // Log full error details for debugging
    if (error && typeof error === "object" && "response" in error) {
      const apiError = error as any;
      console.error("OpenAI API Error Details:", {
        status: apiError.status,
        type: apiError.type,
        message: apiError.message,
        headers: apiError.response?.headers,
      });
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStr = String(error);

    // Check for specific OpenAI error types
    const is429RateLimit =
      errorMessage.includes("429") ||
      errorStr.includes("429") ||
      errorMessage.includes("rate_limit_exceeded") ||
      errorStr.includes("rate_limit_exceeded");
    const isQuotaError =
      (errorMessage.includes("quota") || errorMessage.includes("insufficient_quota")) &&
      !is429RateLimit; // Don't confuse rate limits with quota
    const isRateLimitError = is429RateLimit || errorMessage.includes("Rate limit");

    let userFriendlyMessage =
      "I'm experiencing technical difficulties. Please try again in a moment.";

    if (isRateLimitError) {
      userFriendlyMessage =
        "⚠️ Rate limit reached. GPT-5 has strict rate limits. Please wait 10-20 seconds before trying again.";
    } else if (isQuotaError) {
      userFriendlyMessage =
        "I've reached my OpenAI API quota limit. Please contact support or try again later when the quota resets.";
    }

    // Track error for introspection (disabled - trackRequest no longer exported from introspection)
    // trackRequest(
    //   "/api/chat",
    //   "POST",
    //   Date.now() - chatStartTime,
    //   isQuotaError || isRateLimitError ? 429 : 500,
    //   errorMessage
    // );

    return new Response(
      JSON.stringify({
        error: userFriendlyMessage,
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      }),
      {
        status: isQuotaError || isRateLimitError ? 429 : 500,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": isQuotaError ? "3600" : isRateLimitError ? "60" : "10",
        },
      }
    );
  }
}
