/**
 * SIAM Chat API Route - Tools-Based Architecture
 * 
 * This is a simplified version of the chat route that uses AI SDK tools
 * instead of manual orchestration. The LLM decides when to search.
 * 
 * Key differences from route.ts:
 * - No manual intent classification (LLM picks tools)
 * - No manual orchestration (AI SDK handles tool loop)
 * - No synthesis step (LLM synthesizes naturally)
 * - ~200 lines instead of ~1000 lines
 * 
 * To use: rename this to route.ts (backup the original first!)
 */

import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from 'zod';

// Tools and dynamic prompt
import { siamTools } from "@/services/siamTools";
import { buildDynamicPrompt } from "@/services/skillLoader";
import { modelConfig } from "@/services/modelConfig";

// Langfuse observability
import { traceChat, flushLangfuse } from "@/lib/langfuse";

export const maxDuration = 60;

// Input validation
const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(10000).optional(),
  parts: z.array(z.any()).optional(),
});

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  systemPrompt: z.string().max(5000).optional(),
});

export async function POST(req: Request) {
  const requestStart = Date.now();
  
  try {
    // ========================================
    // AUTH CHECK (simplified)
    // ========================================
    const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true" || 
                       process.env.NODE_ENV === "development";

    if (!bypassAuth) {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: (cookiesToSet) => {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {}
            },
          },
        }
      );

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return new Response(JSON.stringify({ error: "Authentication required" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // ========================================
    // VALIDATE REQUEST
    // ========================================
    const body = await req.json();
    const validation = ChatRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request", details: validation.error.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages, model, temperature = 0.7 } = validation.data;

    // ========================================
    // EXTRACT USER MESSAGE
    // ========================================
    const latestUserMessage = messages.filter((m) => m.role === "user").pop();
    const userQuery = latestUserMessage?.parts?.find((p: any) => p.type === "text")?.text ||
                      latestUserMessage?.content || "";

    // Convert messages to proper format
    const formattedMessages = messages
      .filter((msg) => {
        const content = msg.parts?.find((p: any) => p.type === "text")?.text || msg.content;
        return content != null && content !== "";
      })
      .map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: String(msg.parts?.find((p: any) => p.type === "text")?.text || msg.content || ""),
      }));

    if (formattedMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid messages provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // LANGFUSE TRACING
    // ========================================
    const langfuseTrace = traceChat({
      sessionId: `chat_${Date.now()}`,
      input: userQuery,
      metadata: { model: model || "default", architecture: "tools-based" },
    });

    // ========================================
    // BUILD DYNAMIC SYSTEM PROMPT
    // ========================================
    // The skill loader gives us a lean prompt based on the query
    const dynamicPromptResult = buildDynamicPrompt(userQuery, {});
    
    console.log(`🎨 [Skills] Loaded: [${dynamicPromptResult.skills.join(', ')}]`);
    console.log(`📊 [Skills] Estimated tokens: ${dynamicPromptResult.estimatedTokens}`);

    // ========================================
    // INITIALIZE MODEL
    // ========================================
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY!,
    });

    const modelSettings = modelConfig.getModelWithConfig("aoma-query");
    const selectedModel = model || modelSettings.model || "gemini-2.0-flash";
    const modelProvider = google(selectedModel);

    console.log(`🤖 Model: ${selectedModel}`);
    console.log(`🔧 Tools available: ${Object.keys(siamTools).join(', ')}`);

    // ========================================
    // STREAM WITH TOOLS
    // ========================================
    // This is the magic - the LLM decides when to use tools!
    const generationStart = Date.now();
    
    const result = streamText({
      model: modelProvider,
      system: dynamicPromptResult.prompt,
      messages: formattedMessages,
      tools: siamTools,
      maxSteps: 5, // Allow up to 5 tool calls per request
      temperature,
      
      onFinish: async ({ text, finishReason, usage, steps }) => {
        // Log tool usage for debugging
        const toolCalls = steps?.flatMap(s => s.toolCalls || []) || [];
        console.log(`✅ Stream finished`);
        console.log(`   Tool calls: ${toolCalls.length}`);
        console.log(`   Tools used: ${[...new Set(toolCalls.map(t => t.toolName))].join(', ') || 'none'}`);
        console.log(`   Duration: ${Date.now() - generationStart}ms`);
        
        // Langfuse tracing
        langfuseTrace.end(text, {
          model: selectedModel,
          finishReason,
          toolCalls: toolCalls.length,
          toolsUsed: [...new Set(toolCalls.map(t => t.toolName))],
        });
        
        await flushLangfuse();
      },
    });

    console.log(`⏱️  Time to stream start: ${Date.now() - requestStart}ms`);
    
    return result.toUIMessageStreamResponse();

  } catch (error) {
    console.error("❌ Chat API error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isRateLimit = errorMessage.includes("429") || errorMessage.includes("rate_limit");

    await flushLangfuse().catch(() => {});

    return new Response(
      JSON.stringify({
        error: isRateLimit 
          ? "Rate limit reached. Please wait a moment."
          : "An error occurred. Please try again.",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      }),
      {
        status: isRateLimit ? 429 : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Keep GET and OPTIONS for completeness
export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ready",
      version: "2.0.0-tools",
      architecture: "AI SDK Tools",
      features: ["streaming", "tools", "dynamic-prompts"],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
