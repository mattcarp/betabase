import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
// OpenAI removed - using Gemini-only setup
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from 'zod/v3';
// import type OpenAI from "openai"; // Not needed for Vercel AI SDK
// import { aomaCache } from "../../../src/services/aomaCache";
import { aomaOrchestrator } from "@/services/aomaOrchestrator";
// import { aomaParallelQuery } from "../../../src/services/aomaParallelQuery";
import { modelConfig } from "@/services/modelConfig";
import {
  synthesizeContext,
  formatContextForPrompt,
  type VectorResult,
} from "@/services/contextSynthesizer";
import { searchKnowledge } from "@/services/knowledgeSearchService";
import { UnifiedRAGOrchestrator } from "@/services/unifiedRAGOrchestrator";
import { getSessionStateManager } from "@/lib/sessionStateManager";
import { DEFAULT_APP_CONTEXT } from "@/lib/supabase";
// Langfuse observability
import { traceChat, flushLangfuse } from "@/lib/langfuse";
// Intent classifier for intelligent source routing (RAG optimization)
import { classifyIntent, type IntentClassification } from "@/services/intentClassifier";

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
      // Gemini 3.x models (primary for RAG) - Dec 2025
      "gemini-3-flash-preview",   // Released Dec 17, 2025 - 3x faster!
      // Gemini 2.x models (legacy)
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
      models: ["gemini-3-flash-preview", "gemini-2.5-pro", "gemini-2.5-flash", "gpt-5", "gpt-4o"],
      features: [
        "streaming",
        "aoma-context",
        "knowledge-base",
        "gemini-3-flash-speed",
        "thinking-level",
      ],
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

    // Initialize Gemini provider (Gemini-only setup - no OpenAI)
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
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

    const { messages, model, temperature = 0.7, systemPrompt, mode, waitForAOMA } = validation.data;
    // ========================================
    // END INPUT VALIDATION
    // ========================================

    // ========================================
    // LANGFUSE TRACING INITIALIZATION
    // ========================================
    // Extract the latest user message for tracing
    const traceUserMessage = messages.filter((m: any) => m.role === "user").pop();
    const traceInput = traceUserMessage?.parts?.find((p: any) => p.type === "text")?.text || 
                       traceUserMessage?.content || "";
    
    // Initialize Langfuse trace for this chat request
    const langfuseTrace = traceChat({
      sessionId: `chat_${Date.now()}`,
      input: typeof traceInput === "string" ? traceInput : JSON.stringify(traceInput),
      metadata: {
        model: model || "default",
        mode: mode || "full",
        messageCount: messages.length,
      },
    });
    console.log("[Langfuse] Trace initialized");
    // ========================================
    // END LANGFUSE TRACING INITIALIZATION
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

      console.log("🎯 Querying Supabase vectors:", queryString.substring(0, 100));
      console.log("⏱️  PERFORMANCE: Vector query starting...");

      // Performance tracking
      const perfStart = Date.now();
      let vectorStartTime: number | null = null;
      let vectorEndTime: number | null = null;

      // ========================================
      // PHASE 0: INTENT CLASSIFICATION (NEW!)
      // ========================================
      // Classify query intent to route to relevant sources only
      // This prevents noise from irrelevant tables and improves response quality
      let intentResult: IntentClassification | null = null;
      const intentStartTime = Date.now();
      
      try {
        intentResult = await classifyIntent(queryString, {
          fallbackSources: ['knowledge', 'jira'], // Safe defaults
        });
        
        const intentDuration = Date.now() - intentStartTime;
        console.log(`🎯 [Intent] Classification complete in ${intentDuration}ms`);
        console.log(`   Query type: ${intentResult.queryType}`);
        console.log(`   Sources: [${intentResult.relevantSources.join(', ')}]`);
        console.log(`   Confidence: ${(intentResult.confidence * 100).toFixed(0)}%`);
        console.log(`   Reasoning: ${intentResult.reasoning}`);
        
        // Add intent metadata for debugging
        knowledgeElements.push({
          type: "context",
          content: `Query classified as "${intentResult.queryType}" - searching: ${intentResult.relevantSources.join(', ')}`,
          metadata: {
            source: "intent-classifier",
            queryType: intentResult.queryType,
            confidence: intentResult.confidence,
            reasoning: intentResult.reasoning,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (intentError) {
        console.warn("⚠️ [Intent] Classification failed, using all sources:", intentError);
        // Continue without intent classification - will use all sources
      }

      try {
        // ========================================
        // PHASE 1: ADVANCED RAG with UnifiedRAGOrchestrator
        // ========================================
        console.log("🌟 Executing Advanced RAG (re-ranking, agentic, context-aware)...");
        const ragStartTime = Date.now();

        // Langfuse: Start RAG tracing
        const ragTrace = langfuseTrace.traceRAG({
          strategy: "unified",
          useContextAware: true,
          useAgenticRAG: queryString.split(" ").length > 15,
          useRLHFSignals: true,
        });

        // Add query to session history
        await sessionManager.addToHistory(sessionId, {
          query: queryString,
          timestamp: new Date().toISOString(),
          userId: "current-user", // TODO: Get from session
        });

        // Determine query complexity to decide on agentic RAG
        const queryComplexity = queryString.split(" ").length > 15 ? 8 : 5; // Simple heuristic

        try {
          const ragResult = await unifiedRAG.query(queryString, {
            sessionId,
            ...DEFAULT_APP_CONTEXT, // organization: 'sony-music', division: 'digital-operations', app_under_test: 'aoma'
            useContextAware: true,
            useAgenticRAG: queryComplexity > 7,
            useRLHFSignals: true,
            topK: 5,
            targetConfidence: 0.7,
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
            finalDocs: ragResult.documents.length,
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
              confidence: ragResult.metadata.confidence,
            });
          }

          // Langfuse: End RAG tracing with results
          ragTrace.end({
            confidence: ragResult.metadata.confidence,
            documentsRetrieved: ragResult.documents.length,
            documentsAfterRerank: ragResult.documents.length,
            agentIterations: ragResult.metadata.agentIterations || 0,
            durationMs: ragDuration,
          });
        } catch (ragError) {
          console.error("❌ Advanced RAG failed:", ragError);
          // Langfuse: End RAG tracing with failure
          ragTrace.end({
            confidence: 0,
            documentsRetrieved: 0,
            documentsAfterRerank: 0,
            durationMs: Date.now() - ragStartTime,
          });
          // Continue with standard AOMA retrieval
        }

        // ========================================
        // PHASE 2: Vector Orchestrator (Supabase-only, ~100ms)
        // ========================================
        // Direct Supabase pgvector queries - no external services
        console.log("🚀 Querying vector orchestrator (Supabase pgvector)...");

        // Langfuse: Start vector search tracing
        const vectorTrace = langfuseTrace.traceVectorSearch({
          query: queryString,
          provider: "gemini",
          threshold: 0.50,
          topK: 10,
        });

        // Fast timeout - Supabase queries should complete in <500ms
        const preferFast = mode === "fast" || waitForAOMA === false;
        const defaultTimeout = preferFast ? 2000 : 5000; // Much shorter - Supabase is fast
        const orchestratorTimeoutMs = Number(
          process.env.VECTOR_ORCHESTRATOR_TIMEOUT_MS || String(defaultTimeout)
        );
        console.log(`🔀 Starting vector query (${orchestratorTimeoutMs}ms timeout)...`);
        
        // Pass classified sources to orchestrator if available
        const orchestratorOptions = intentResult?.relevantSources 
          ? { sourceTypes: intentResult.relevantSources as string[] }
          : undefined;
        
        if (orchestratorOptions?.sourceTypes) {
          console.log(`🎯 Routing to sources: [${orchestratorOptions.sourceTypes.join(', ')}]`);
        }
        
        vectorStartTime = Date.now();
        const orchestratorResult = (await Promise.race([
          aomaOrchestrator.executeOrchestration(queryString, orchestratorOptions),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error(`Vector query timeout after ${orchestratorTimeoutMs}ms`)),
              orchestratorTimeoutMs
            )
          ),
        ])) as any;
        vectorEndTime = Date.now();
        const vectorDuration = vectorEndTime - vectorStartTime;
        console.log(`⚡ Vector query completed in ${vectorDuration}ms`);

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

        if (
          contextContent ||
          (orchestratorResult.sources && orchestratorResult.sources.length > 0)
        ) {
          // NEW: Synthesize raw vector results into human-friendly context
          // This prevents dumping 17 raw Jira tickets on the user
          let synthesizedCtx = null;
          if (orchestratorResult.sources && orchestratorResult.sources.length > 0) {
            console.log(
              "🧠 Synthesizing context from",
              orchestratorResult.sources.length,
              "sources..."
            );
            const synthStart = Date.now();

            // Convert to VectorResult format
            const vectorResults: VectorResult[] = orchestratorResult.sources.map((s: any) => ({
              content: s.content || "",
              source_type: s.source_type || "unknown",
              source_id: s.source_id,
              similarity: s.similarity,
              metadata: s.metadata,
            }));

            synthesizedCtx = await synthesizeContext(queryString, vectorResults);
            console.log(`✅ Synthesis completed in ${synthesizedCtx.synthesisTimeMs}ms`);
            console.log(`📊 Key insights: ${synthesizedCtx.keyInsights.length}`);
          }

          // Use synthesized context if available, otherwise fall back to raw
          const formattedContext = synthesizedCtx
            ? formatContextForPrompt(synthesizedCtx)
            : contextContent;

          knowledgeElements.push({
            type: "context",
            content: formattedContext,
            metadata: {
              source: "aoma-orchestrator",
              synthesized: !!synthesizedCtx,
              synthesisTimeMs: synthesizedCtx?.synthesisTimeMs,
              timestamp: new Date().toISOString(),
            },
          });

          aomaContext = `\n\n[AOMA Context:\n${formattedContext}\n]`;
          aomaConnectionStatus = "success";
          console.log("✅ Vector orchestration successful");
          console.log(
            `📝 Context length: ${formattedContext?.length || 0} chars (${synthesizedCtx ? "synthesized" : "raw"})`
          );
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
          console.log(
            `✅ Orchestrator returned ${orchestratorResult.sources.length} merged results`
          );

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
          const supabaseCount = orchestratorResult.sources.filter(
            (s: any) => s.source === "supabase"
          ).length;
          const openaiCount = orchestratorResult.sources.filter(
            (s: any) => s.source === "openai"
          ).length;
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
          vectorEndTime != null && vectorStartTime != null
            ? vectorEndTime - vectorStartTime
            : "N/A";
        console.log("📊 Vector Query Performance Summary:", {
          totalMs: totalDuration,
          orchestratorMs,
          contextLength: aomaContext.length,
          status: aomaConnectionStatus,
          sources: orchestratorResult.sources?.length || 0,
        });
        console.log(
          `⏱️  PERFORMANCE: Vector query completed in ${totalDuration}ms - streaming will now start`
        );

        // Langfuse: End vector search tracing
        vectorTrace.end({
          count: orchestratorResult.sources?.length || 0,
          topSimilarity: orchestratorResult.sources?.[0]?.similarity,
          durationMs: totalDuration,
          sources: orchestratorResult.sources?.slice(0, 5).map((s: any) => s.source_type),
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
        const vectorDuration =
          vectorEndTime != null && vectorStartTime != null
            ? vectorEndTime - vectorStartTime
            : "N/A";

        console.error("❌ Vector query error:", {
          errorType,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          query: queryString.substring(0, 100),
          durationMs: errorDuration,
          vectorDuration,
          timestamp: new Date().toISOString(),
        });

        // Langfuse: End vector search tracing with error
        vectorTrace.end({
          count: 0,
          durationMs: errorDuration,
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
      ? `${systemPrompt || "You are SIAM, a helpful AI assistant for Sony Music employees."}

**YOUR KNOWLEDGE:**
${aomaContext}

**HOW TO RESPOND:**
1. Answer like a knowledgeable colleague - direct, helpful, conversational
2. Lead with the ANSWER, not the source. Don't say "According to the knowledge base..."
3. If the knowledge mentions Jira tickets, mention 2-3 specific ticket numbers as examples, then summarize what they tell you.
4. If asked about counts or specific numbers you don't have, say so briefly
5. Keep responses concise - 2-3 paragraphs max unless the user asks for more detail

**USING CODE KNOWLEDGE (IMPORTANT!):**
Your knowledge may include source code from the AOMA codebase. Use this intelligently:

1. CODE IS HIDDEN KNOWLEDGE - Don't show code snippets unless the user specifically asks
2. USE CODE TO VERIFY FACTS - If you see how something is implemented, use that to give accurate answers
3. TRANSLATE TECHNICAL TO HUMAN - If the code shows a complex process, explain it simply
4. TROUBLESHOOTING INTELLIGENCE:
   - If user mentions a 500 error → That's a BACKEND/API error, not the UI. Say "This is a server-side error. The UI team would need to coordinate with the backend team."
   - If user mentions a JavaScript error or UI glitch → That's likely in the Angular frontend code
   - If you see the error message in the code, explain what triggers it and how to fix it
5. KNOWN ERROR-TO-CODE MAPPINGS (use this to connect errors to code):
   - "Asset Upload Sorting Failed" → The sorting logic is in:
     * src/app/module-unified-submission-tool/shared/store/reducers/ust-dolby.reducers.ts (lines 184-273)
     * src/app/module-unified-submission-tool/shared/store/reducers/ust-wav24.reducer.ts
     The code uses: dolbyData.sort((a,b) => a.sequence - b.sequence).sort((a,b) => a.side - b.side)
     If files arrive out of order or have invalid sequence/side metadata, sorting fails.
   - "Invalid Product ID" → Product validation happens in the product-linking service. The system expects 10-char alphanumeric IDs starting with 'P'.
   - Aspera errors (error code 36, disk write failed) → Transfer errors in ust-cc-ttml-aspera.reducers.ts (lines 1-79). Usually means destination disk full or network issues.
   When you see these errors, AUTOMATICALLY explain the underlying code behavior. When user asks for code, show the file path, line numbers, AND a code snippet.
   
   **CODE FORMATTING (IMPORTANT FOR BEAUTIFUL DISPLAY):**
   When showing code snippets, use this format for the language tag:
   \`\`\`typescript:src/app/module-unified-submission-tool/shared/store/reducers/ust-dolby.reducers.ts
   // Your code here (lines 184-273)
   \`\`\`
   This format (language:filepath) enables the beautiful code artifact display with file header, traffic lights, and line numbers.
6. BE HELPFUL, NOT CODEY - Say "The system validates the product ID before linking" not "The validateProductId() function in product-linking.service.ts..."
6. ONLY MENTION FILE LOCATIONS if the user asks "where in the code" or "which file"
7. If you found relevant code, you can say: "I checked the implementation and..." without showing the code

**NEVER DO THIS:**
- Don't dump raw ticket data or technical IDs
- Don't list every source you consulted
- Don't say "Based on the context provided..."
- Don't use corporate jargon unless the user does
- Don't show code blocks unless specifically asked
- Don't list function names, class names, or technical identifiers unprompted

**DO THIS INSTEAD:**
- Answer the question directly in plain English
- If you found relevant Jira tickets, summarize their themes (e.g., "Several teams are working on metadata improvements")
- If you used code knowledge, mention it subtly: "Looking at how this works internally..." 
- Offer to dive deeper if the user wants specifics: "Would you like me to show you the relevant code?"

**DIAGRAMS:**
- Only create diagrams if the user asks
- If a diagram would help, offer: "Would you like a visual diagram of this?"

**META DEMO MODE (Special!):**
If the user says "I'm recording a demo" or "create an infographic" or "show me a visual":
- Acknowledge: "I can generate a hand-drawn infographic using Gemini image generation!"
- Suggest they click the diagram offer button that appears
- This triggers Nano Banana Pro (Gemini image generation) instead of Mermaid
- The system literally creates its own demo slides while being demoed - very meta!

Remember: You're talking to a Sony Music technical support person who wants accurate, helpful answers. They're not developers - translate technical knowledge into support-friendly language.`
      : `${systemPrompt || "You are SIAM, a helpful AI assistant for Sony Music."}

I don't have any relevant information about that in my knowledge base. Could you try rephrasing your question, or ask about something related to AOMA (Asset and Offering Management Application)?`;

    // Determine model based on AOMA involvement
    const hasAomaContent = aomaContext.trim() !== "";
    const useCase = hasAomaContent ? "aoma-query" : "chat";
    const modelSettings = modelConfig.getModelWithConfig(useCase);
    const selectedModel = model || modelSettings.model || "gpt-4o-mini";

    console.log(`🤖 Creating stream with model: ${selectedModel}`);
    console.log(
      `📊 Settings: temp=${modelSettings.temperature}, maxTokens=${modelSettings.maxOutputTokens}`
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
    const supportsTemperature = !selectedModel.startsWith("o");

    // Gemini-only setup - all models use Google provider
    const modelProvider = google(selectedModel);

    console.log(`🤖 Using Google Gemini provider for model: ${selectedModel}`);

    // Langfuse: Start LLM generation tracing
    const generationStartTime = Date.now();
    const generationTrace = langfuseTrace.traceGeneration({
      model: selectedModel,
      systemPrompt: enhancedSystemPrompt,
      messages: openAIMessages.map((m: any) => ({ role: m.role, content: String(m.content || "").substring(0, 500) })),
      temperature: supportsTemperature ? (modelSettings.temperature || temperature) : undefined,
    });

    const result = streamText({
      model: modelProvider,
      messages: openAIMessages, // Already in correct format after filtering/validation
      system: enhancedSystemPrompt, // Use system parameter instead of adding to messages array
      // Only include temperature for models that support it (not o-series)
      ...(supportsTemperature && { temperature: modelSettings.temperature || temperature }),
      // Note: AI SDK handles token limits via the model config, not maxTokens parameter
      // Attach RAG metadata to the stream for client-side display
      onFinish: async ({ text, finishReason, usage }) => {
        // RAG metadata will be available in response headers
        console.log("✅ Stream finished. RAG metadata:", ragMetadata);
        
        // Langfuse: End generation tracing with final output
        generationTrace.end({
          output: text,
          finishReason: finishReason,
          usage: usage ? {
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            totalTokens: usage.totalTokens,
          } : undefined,
          durationMs: Date.now() - generationStartTime,
        });

        // Langfuse: End the overall trace
        langfuseTrace.end(text, {
          model: selectedModel,
          hasAomaContent,
          aomaConnectionStatus,
          finishReason,
        });

        // Langfuse: Flush events (critical for serverless!)
        await flushLangfuse();
        console.log("[Langfuse] Events flushed");
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
        response.headers.set("X-RAG-Metadata", JSON.stringify(ragMetadata));
        console.log("📊 RAG Metadata attached to response:", ragMetadata);
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
      userFriendlyMessage = "⚠️ Rate limit reached. Please wait 10-20 seconds before trying again.";
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

    // Langfuse: Try to flush any pending traces on error
    try {
      await flushLangfuse();
    } catch (flushError) {
      console.error("[Langfuse] Failed to flush on error:", flushError);
    }

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
