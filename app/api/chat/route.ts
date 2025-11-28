import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
// import type OpenAI from "openai"; // Not needed for Vercel AI SDK
// import { aomaCache } from "../../../src/services/aomaCache";
import { aomaOrchestrator } from "../../../src/services/aomaOrchestrator";
// import { aomaParallelQuery } from "../../../src/services/aomaParallelQuery";
import { modelConfig } from "../../../src/services/modelConfig";
import { searchKnowledge } from "../../../src/services/knowledgeSearchService";
import { UnifiedRAGOrchestrator } from "../../../src/services/unifiedRAGOrchestrator";
import { getSessionStateManager } from "../../../src/lib/sessionStateManager";

// Allow streaming responses up to 60 seconds for AOMA queries
export const maxDuration = 60;

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
    .enum([
      // Gemini models (primary for RAG)
      "gemini-3-pro-preview",
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      // OpenAI models (fallback)
      "gpt-5",
      "gpt-5-pro",
      "gpt-4o",
      "gpt-4o-mini",
      "o3",
      "o3-pro",
      "o4-mini",
      // Claude models
      "claude-3-opus",
      "claude-3-sonnet",
      "claude-3-5-sonnet-20241022",
      "claude-3-haiku",
    ])
    .optional(),
  temperature: z.number().min(0).max(2).optional(),
  systemPrompt: z.string().max(5000).optional(), // 5KB limit for system prompt
  // Performance preference:
  // - mode: 'full' waits longer for AOMA (better quality, slower)
  // - mode: 'fast' prioritizes speed with shorter AOMA wait
  mode: z.enum(["fast", "full"]).optional(),
  waitForAOMA: z.boolean().optional(),
});

export async function GET(_req: Request) {
  // Handle GET requests - return API info/status
  return new Response(
    JSON.stringify({
      status: "ready",
      version: "1.0.0",
      models: ["gemini-2.5-pro", "gemini-2.5-flash", "gpt-5", "gpt-4o", "gpt-4o-mini"],
      features: ["streaming", "aoma-context", "knowledge-base", "gemini-2m-context"],
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
    console.log("[API] GOOGLE_API_KEY present:", !!process.env.GOOGLE_API_KEY);
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

    // ========================================
    // API KEY VALIDATION
    // ========================================
    // Check for API key configuration
    if (!process.env.GOOGLE_API_KEY) {
      console.error("[API] GOOGLE_API_KEY is not set in environment variables");
      return new Response(
        JSON.stringify({
          error: "Service temporarily unavailable",
          code: "CONFIG_ERROR",
          message: "Google AI API key is not configured. Please contact support.",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("[API] OPENAI_API_KEY is not set in environment variables");
      return new Response(
        JSON.stringify({
          error: "Service temporarily unavailable",
          code: "CONFIG_ERROR",
          message: "OpenAI API key is not configured. Please contact support.",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize providers after validation
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log("[API] ✅ AI providers initialized");
    // ========================================
    // END API KEY VALIDATION
    // ========================================

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

    const { messages, model, temperature = 0.7, systemPrompt, mode, waitForAOMA } =
      validation.data;
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
    
    // Initialize Advanced RAG Orchestrator and Session Manager
    const unifiedRAG = new UnifiedRAGOrchestrator();
    const sessionManager = getSessionStateManager();
    let ragMetadata: any = null;
    
    // Generate session ID (use conversation ID if available)
    const sessionId = `session_${Date.now()}`;

    // Lightweight intent detection to decide if we need AOMA at all
    function needsAOMAIntent(text: string): boolean {
      const q = (text || "").toLowerCase();
      // Heuristic: only hit AOMA for clearly domain-specific queries
      const keywords = [
        "aoma",
        "asset and offering",
        "sony",
        "usm",
        "unified session manager",
        "dam",
        "metadata",
        // Additional variants to reduce false negatives
        "aoma mesh",
        "aoma portal",
        "offering management",
        "asset management (aoma)",
      ];
      return keywords.some((k) => q.includes(k));
    }

    // AOMA Integration Control (P0 CRITICAL FIX)
    // Only bypass AOMA in development if explicitly requested
    const bypassAOMA =
      process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_BYPASS_AOMA === "true";

    console.log(
      `🔧 AOMA bypass: ${bypassAOMA} (dev=${process.env.NODE_ENV === "development"}, flag=${process.env.NEXT_PUBLIC_BYPASS_AOMA})`
    );

    // Always attempt to retrieve AOMA context for any user query (no keyword gating)
    const latestUserMessage = messages.filter((m: any) => m.role === "user").pop();

    // Extract content from AI SDK v5 parts format or v4 content format
    const messageContent =
      latestUserMessage?.parts?.find((p: any) => p.type === "text")?.text ||
      latestUserMessage?.content;

    if (!bypassAOMA && latestUserMessage && messageContent) {
      const queryString =
        typeof messageContent === "string" ? messageContent : JSON.stringify(messageContent);

      console.log("🎯 Using LangChain orchestrator for AOMA:", queryString.substring(0, 100));
      console.log("⏱️  PERFORMANCE: AOMA query starting (this blocks streaming response)...");

      // Performance tracking
        const perfStart = Date.now();
      let railwayStartTime: number | null = null;
      let railwayEndTime: number | null = null;
      let supabaseStartTime: number | null = null;
      let supabaseEndTime: number | null = null;

      try {
        // ========================================
        // PHASE 1: ADVANCED RAG with UnifiedRAGOrchestrator
        // ========================================
        console.log("🌟 Executing Advanced RAG (re-ranking, agentic, context-aware)...");
        const ragStartTime = Date.now();
        
        // Add query to session history
        await sessionManager.addToHistory(sessionId, {
          query: queryString,
          timestamp: new Date().toISOString(),
          userId: 'current-user' // TODO: Get from session
        });
        
        // Determine query complexity to decide on agentic RAG
        const queryComplexity = queryString.split(' ').length > 15 ? 8 : 5; // Simple heuristic
        
        try {
          const ragResult = await unifiedRAG.query(queryString, {
            sessionId,
            organization: 'sony-music',
            division: 'mso',
            app_under_test: 'siam',
            useContextAware: true,
            useAgenticRAG: queryComplexity > 7,
            useRLHFSignals: true,
            topK: 5,
            targetConfidence: 0.7
          });
          
          const ragDuration = Date.now() - ragStartTime;
          console.log(`✅ Advanced RAG completed in ${ragDuration}ms`);
          console.log(`📊 Strategy used: ${ragResult.metadata.strategy}`);
          console.log(`🎯 Confidence: ${(ragResult.metadata.confidence * 100).toFixed(1)}%`);
          
          // Store RAG metadata for response
          ragMetadata = {
            strategy: ragResult.metadata.strategy,
            documentsReranked: ragResult.metadata.usedContextAware,
            agentSteps: ragResult.metadata.agentIterations || 0,
            confidence: ragResult.metadata.confidence,
            timeMs: ragResult.metadata.totalTimeMs,
            initialDocs: ragResult.documents.length,
            finalDocs: ragResult.documents.length
          };
          
          // Add RAG-enhanced documents to knowledge elements
          if (ragResult.documents && ragResult.documents.length > 0) {
            ragResult.documents.slice(0, 3).forEach((doc: any) => {
              knowledgeElements.push({
                type: "reference",
                content: doc.content || doc.text || "",
                metadata: {
                  source: "advanced-rag",
                  strategy: ragResult.metadata.strategy,
                  confidence: ragResult.metadata.confidence,
                  timestamp: new Date().toISOString(),
                },
              });
            });
          }
          
          // Record successful retrieval in session
          if (ragResult.metadata.confidence > 0.7) {
            await sessionManager.recordSuccessfulRetrieval(sessionId, {
              query: queryString,
              documents: ragResult.documents,
              confidence: ragResult.metadata.confidence
            });
          }
          
        } catch (ragError) {
          console.error("❌ Advanced RAG failed:", ragError);
          // Continue with standard AOMA retrieval
        }
        
        // ========================================
        // PHASE 2: AOMA Orchestrator (existing system)
        // ========================================
        // Use orchestrator which now handles BOTH Supabase and OpenAI sources internally
        // with intelligent merging and deduplication
        console.log("🚀 Querying AOMA orchestrator (handles Supabase + OpenAI internally)...");

        // Wrap orchestrator call with timeout to prevent hanging
        // PERFORMANCE: use short, env-configurable timeout to avoid blocking streaming
        const preferFast = mode === "fast" || waitForAOMA === false;
        const defaultTimeout = preferFast ? 5000 : 20000; // default to full-quality wait unless fast mode
        const orchestratorTimeoutMs = Number(
          process.env.AOMA_ORCHESTRATOR_TIMEOUT_MS || String(defaultTimeout)
        );
        console.log(
          `🔀 Starting unified orchestrator query (${orchestratorTimeoutMs}ms timeout)...`
        );
        railwayStartTime = Date.now();
        const orchestratorResult = (await Promise.race([
          aomaOrchestrator.executeOrchestration(queryString),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error(`AOMA orchestrator timeout after ${orchestratorTimeoutMs}ms`)),
              orchestratorTimeoutMs
            )
          ),
        ])) as any;
        railwayEndTime = Date.now();
        const railwayDuration = railwayEndTime - railwayStartTime;
        console.log(`⚡ Orchestrator responded in ${railwayDuration}ms`);

        // Handle different response formats from the orchestrator
        let contextContent = null;
        
        if (orchestratorResult) {
          // Try direct response/content fields first
          contextContent = orchestratorResult.response || orchestratorResult.content;
          
          // If not found, check for nested result structure (from /api/aoma endpoint)
          if (!contextContent && orchestratorResult.result?.content) {
            const contentArray = orchestratorResult.result.content;
            if (Array.isArray(contentArray) && contentArray.length > 0) {
              const textItem = contentArray.find((item: any) => item.type === "text");
              if (textItem?.text) {
                try {
                  const parsed = JSON.parse(textItem.text);
                  contextContent = parsed.response;
                } catch (e) {
                  contextContent = textItem.text;
                }
              }
            }
          }
        }

        if (contextContent) {
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
          console.log(`📝 Context content length: ${contextContent?.length || 0} chars`);
          console.log(`📝 aomaContext length: ${aomaContext?.length || 0} chars`);
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

        // Orchestrator now handles both Supabase and OpenAI internally with intelligent merging
        // Extract sources from merged results for knowledge elements
        if (orchestratorResult.sources && Array.isArray(orchestratorResult.sources)) {
          console.log(`✅ Orchestrator returned ${orchestratorResult.sources.length} merged results`);
          
          // Add source information to knowledge elements
          orchestratorResult.sources.slice(0, 6).forEach((source: any) => {
            if (source.metadata?.screenshot_path) {
              knowledgeElements.push({
                type: "reference",
                content: source.content || "",
                metadata: {
                  source: source.source || "merged",
                  source_type: source.source_type,
                  screenshot_path: source.metadata.screenshot_path,
                  timestamp: new Date().toISOString(),
                },
              });
            }
          });

          // Add summary of sources
          const supabaseCount = orchestratorResult.sources.filter((s: any) => s.source === 'supabase').length;
          const openaiCount = orchestratorResult.sources.filter((s: any) => s.source === 'openai').length;
          knowledgeElements.push({
            type: "context",
            content: `Found ${orchestratorResult.sources.length} results (${supabaseCount} from Supabase, ${openaiCount} from OpenAI)`,
            metadata: {
              source: "merged-results",
              supabaseCount,
              openaiCount,
              timestamp: new Date().toISOString(),
            },
          });
        }

        // Performance summary
        const totalDuration = Date.now() - perfStart;
        const orchestratorMs =
          railwayEndTime != null && railwayStartTime != null
            ? railwayEndTime - railwayStartTime
            : "N/A";
        console.log("📊 AOMA Query Performance Summary:", {
          totalMs: totalDuration,
          orchestratorMs,
          contextLength: aomaContext.length,
          status: aomaConnectionStatus,
          sources: orchestratorResult.sources?.length || 0,
        });
        console.log(`⏱️  PERFORMANCE: Unified orchestrator query completed in ${totalDuration}ms - streaming will now start`);
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
        const railwayDuration =
          railwayEndTime != null && railwayStartTime != null
            ? railwayEndTime - railwayStartTime
            : "N/A";
        const supabaseDuration =
          supabaseEndTime != null && supabaseStartTime != null
            ? supabaseEndTime - supabaseStartTime
            : "N/A";

        console.error("❌ AOMA query error:", {
          errorType,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          query: queryString.substring(0, 100),
          durationMs: errorDuration,
          railwayDuration,
          supabaseDuration,
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

**✅ YOU HAVE ACCESS TO AOMA KNOWLEDGE - USE IT CONFIDENTLY**
${aomaContext}

**CRITICAL INSTRUCTIONS:**
1. Answer ONLY using the AOMA context above
2. Use natural, conversational language - speak directly to the user
3. Do NOT reference "interfaces", "screens shown", or "displays" - just explain the functionality
4. If asked for counts/statistics, say "I can't provide exact counts, but I can describe what I know"
5. If a detail is missing, say "That's not in my current knowledge base"
6. NEVER invent or infer facts beyond the provided context, UNLESS the user explicitly asks for a hypothetical example, generic diagram, or general explanation.
7. When explaining complex processes, architectures, or flows, OR when explicitly asked, generate a Mermaid diagram using \`mermaid\` code blocks.
8. **DIAGRAM SYNTAX RULES** (CRITICAL - follow exactly):
   - Use \`flowchart TD\` or \`flowchart LR\` instead of \`graph\`.
   - ALWAYS use complete 6-character hex colors (e.g., \`#2ecc71\`, NOT \`#2ec\` or truncated values).
   - ALWAYS close all shapes properly: \`((text))\` for circles, \`[text]\` for rectangles, \`{text}\` for diamonds.
   - ALWAYS end classDef lines with semicolons.
   - NEVER truncate or abbreviate syntax - write complete valid Mermaid.
   - Example:
   \`\`\`mermaid
   flowchart LR
     classDef start fill:#2ecc71,stroke:#27ae60,stroke-width:2px,color:#ffffff;
     classDef process fill:#3498db,stroke:#2980b9,stroke-width:2px,color:#ffffff;
     classDef decision fill:#f39c12,stroke:#d35400,stroke-width:2px,color:#ffffff;

     A((Start)):::start --> B[Process]:::process;
     B --> C{Valid?}:::decision;
     C -- Yes --> D[Done]:::process;
     C -- No --> E[Retry]:::process;
   \`\`\`
9. **JIRA VISUALIZATION**: If the context contains Jira tickets, ALWAYS generate a Mermaid diagram showing the ticket's workflow state, dependencies, or a timeline.

**EXAMPLES OF GOOD vs BAD RESPONSES:**
❌ BAD: "From the interface shown, AOMA provides..."
✅ GOOD: "AOMA provides..."

❌ BAD: "The screen displays three options..."
✅ GOOD: "AOMA offers three options..."

❌ BAD: "There are 904 Jira tickets."
✅ GOOD: "I can't provide exact counts, but AOMA has extensive Jira integration for tracking tickets and issues."`
      : `${systemPrompt || "You are SIAM, an AI assistant for Sony Music."}

**RESPONSE REQUIRED:**
Respond with ONLY this message:

"That's not in my knowledge base. I won't guess."`;

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

    // O-series models (o1, o3, o4) don't support temperature - they use fixed reasoning
    const supportsTemperature = !selectedModel.startsWith('o');

    // Determine which provider to use based on model
    const isGeminiModel = selectedModel.startsWith('gemini-');
    const modelProvider = isGeminiModel ? google(selectedModel) : openai(selectedModel);
    
    console.log(`🤖 Using ${isGeminiModel ? 'Google Gemini' : 'OpenAI'} provider for model: ${selectedModel}`);

    const result = streamText({
      model: modelProvider,
      messages: openAIMessages, // Already in correct format after filtering/validation
      system: enhancedSystemPrompt, // Use system parameter instead of adding to messages array
      // Only include temperature for models that support it (not o-series)
      ...(supportsTemperature && { temperature: modelSettings.temperature || temperature }),
      // Note: AI SDK handles token limits via the model config, not maxTokens parameter
      // Attach RAG metadata to the stream for client-side display
      onFinish: async ({ text, finishReason }) => {
        // RAG metadata will be available in response headers
        console.log('✅ Stream finished. RAG metadata:', ragMetadata);
      },
    });

    console.log("✅ Stream created successfully");

    // Track successful request (disabled - trackRequest no longer exported from introspection)
    // trackRequest("/api/chat", "POST", Date.now() - chatStartTime, 200);

    // Return Vercel AI SDK response format (compatible with useChat hook)
    const response = result.toUIMessageStreamResponse();
    try {
      // Attach RAG metadata as custom header for client-side badge display
      if (ragMetadata) {
        response.headers.set('X-RAG-Metadata', JSON.stringify(ragMetadata));
        console.log('📊 RAG Metadata attached to response:', ragMetadata);
      }
      
      // Attach basic Server-Timing if we captured AOMA timings
      const timings: string[] = [];
      // Note: variables may be undefined if AOMA was skipped
      // We rely on logs for full detail; this header is best-effort
      // Add simple milestone for visibility
      timings.push("app;desc=api-chat");
      response.headers.set("Server-Timing", timings.join(", "));
    } catch {}
    return response;
  } catch (error) {
    console.error("❌ Chat API error:", error);
    console.error("❌ Error type:", typeof error);
    console.error("❌ Error name:", error instanceof Error ? error.name : "Unknown");
    console.error("❌ Error message:", error instanceof Error ? error.message : String(error));
    console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack trace");

    // Log full error details for debugging
    if (error && typeof error === "object" && "response" in error) {
      const apiError = error as any;
      console.error("AI API Error Details:", {
        status: apiError.status,
        type: apiError.type,
        message: apiError.message,
        headers: apiError.response?.headers,
      });
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStr = String(error);

    // Check for specific AI API error types
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
        "⚠️ Rate limit reached. Please wait 10-20 seconds before trying again.";
    } else if (isQuotaError) {
      userFriendlyMessage =
        "I've reached my AI API quota limit. Please contact support or try again later when the quota resets.";
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
