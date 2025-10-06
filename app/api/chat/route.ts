import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { aomaCache } from "../../../src/services/aomaCache";
import { aomaOrchestrator } from "../../../src/services/aomaOrchestrator";
import { aomaParallelQuery } from "../../../src/services/aomaParallelQuery";
import { modelConfig } from "../../../src/services/modelConfig";
import { trackRequest } from "../introspection/route";

// Allow streaming responses up to 60 seconds for AOMA queries
export const maxDuration = 60;

// Initialize OpenAI provider for Vercel AI SDK
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

// REMOVED: Client-side rate limiting
// Let OpenAI handle rate limits naturally - we'll catch 429s and show friendly errors
// This allows normal single-user usage while still handling rate limit errors gracefully

// Enhanced query for context
function enhanceQueryForContext(query: string): string {
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
}

// Knowledge object structure for structured responses
interface KnowledgeElement {
  type: 'context' | 'fact' | 'suggestion' | 'warning' | 'code' | 'reference';
  content: string;
  metadata?: {
    source?: string;
    confidence?: number;
    timestamp?: string;
    [key: string]: any;
  };
}

export async function GET(req: Request) {
  // Handle GET requests - return API info/status
  return new Response(
    JSON.stringify({
      status: 'ready',
      version: '1.0.0',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-5'],
      features: ['streaming', 'aoma-context', 'knowledge-base'],
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(req: Request) {
  const chatStartTime = Date.now();

  try {
    // Check for API key first
    if (!process.env.OPENAI_API_KEY && !process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      console.error("[API] OPENAI_API_KEY is not set in environment variables");
      return new Response(
        JSON.stringify({
          error: "OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment."
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json();
    const { messages = [], model, temperature = 0.7, systemPrompt } = body;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Convert UI messages to OpenAI format with NULL content validation
    // AI SDK v5 sends messages with 'parts' array, v4 uses 'content' string
    const openAIMessages: OpenAI.Chat.ChatCompletionMessageParam[] = messages
      .filter((msg: any) => {
        // Extract content from v5 parts array or v4 content string
        const content = msg.parts?.find((p: any) => p.type === 'text')?.text || msg.content;

        // Filter out messages with null, undefined, or empty content
        if (content == null || content === '') {
          console.warn(`[API] Filtering out message with invalid content:`, { role: msg.role, content, parts: msg.parts });
          return false;
        }
        return true;
      })
      .map((msg: any) => {
        // Extract content from v5 parts array or v4 content string
        const content = String(msg.parts?.find((p: any) => p.type === 'text')?.text || msg.content || '');

        if (msg.role === 'system') {
          return { role: 'system', content };
        } else if (msg.role === 'user') {
          return { role: 'user', content };
        } else if (msg.role === 'assistant') {
          return { role: 'assistant', content };
        }
        return { ...msg, content };
      });

    // Validate we have at least one message after filtering
    if (openAIMessages.length === 0) {
      console.error('[API] No valid messages after filtering null content');
      return new Response(
        JSON.stringify({ error: "No valid messages provided. All messages had null or empty content." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Initialize AOMA context and knowledge elements
    let aomaContext = "";
    let aomaConnectionStatus = "not-queried";
    const knowledgeElements: KnowledgeElement[] = [];

    // PERFORMANCE FIX: Add bypass flag to skip slow AOMA orchestration
    const bypassAOMA = process.env.NEXT_PUBLIC_BYPASS_AOMA === 'true';
    console.log(`🔧 AOMA bypass flag: ${bypassAOMA} (env: ${process.env.NEXT_PUBLIC_BYPASS_AOMA})`);
    
    // Check if we need AOMA context
    const latestUserMessage = messages
      .filter((m: any) => m.role === "user")
      .pop();

    if (!bypassAOMA && latestUserMessage && latestUserMessage.content) {
      const queryString = typeof latestUserMessage.content === "string"
        ? latestUserMessage.content
        : JSON.stringify(latestUserMessage.content);

      console.log(
        "🎯 Using LangChain orchestrator for AOMA:",
        queryString.substring(0, 100),
      );

      try {
        // SIMPLIFIED: Let the orchestrator (LangChain) handle ALL endpoint logic
        // No more manual parallel queries - orchestrator manages retries, fallbacks, tool selection
        const orchestratorResult = await aomaOrchestrator.executeOrchestration(queryString);

        if (orchestratorResult && (orchestratorResult.response || orchestratorResult.content)) {
          const contextContent = orchestratorResult.response || orchestratorResult.content;

          knowledgeElements.push({
            type: 'context',
            content: contextContent,
            metadata: {
              source: 'aoma-orchestrator',
              timestamp: new Date().toISOString(),
            }
          });

          aomaContext = `\n\n[AOMA Context:\n${contextContent}\n]`;
          aomaConnectionStatus = "success";
          console.log("✅ AOMA orchestration successful");
        } else {
          console.log("❌ AOMA orchestrator returned no content");
          aomaConnectionStatus = "failed";

          knowledgeElements.push({
            type: 'warning',
            content: 'The AOMA knowledge base is currently unavailable. This may be a temporary connection issue. If this persists, please contact matt@mattcarpenter.com for assistance.',
            metadata: {
              timestamp: new Date().toISOString(),
            }
          });
        }
      } catch (error) {
        console.error("❌ AOMA query error:", error);
        aomaConnectionStatus = "failed";

        knowledgeElements.push({
          type: 'warning',
          content: 'Unable to access AOMA resources due to a connection error. The AOMA-MCP server or knowledge bases may be offline. If this issue persists, please contact matt@mattcarpenter.com for support.',
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          }
        });
      }
    }

    // Enhanced system prompt that includes AOMA orchestration context
    const enhancedSystemPrompt = `${systemPrompt || "You are SIAM, an AI assistant for Sony Music."}

**CRITICAL ANTI-HALLUCINATION RULES:**
1. ONLY answer questions using the AOMA context provided below
2. If the context does not contain the answer, you MUST say: "I don't have that information in my knowledge base."
3. DO NOT make up information, fabricate details, or guess
4. DO NOT be overconfident about uncertain information
5. If AOMA context indicates an error or unavailability, inform the user and suggest contacting matt@mattcarpenter.com

**AOMA CONTEXT:**
${aomaContext}

**RESPONSE GUIDELINES:**
- If context is empty or insufficient: Admit you don't have the information
- If context contains relevant info: Answer based ONLY on that context and cite sources
- If there's a connection error: Explain the issue and provide contact information
- NEVER fabricate specific details like dates, numbers, names, or features that aren't in the context`;

    // Determine model based on AOMA involvement
    const hasAomaContent = aomaContext.trim() !== "";
    const useCase = hasAomaContent ? "aoma-query" : "chat";
    const modelSettings = modelConfig.getModelWithConfig(useCase);
    const selectedModel = model || modelSettings.model || "gpt-4o-mini";

    console.log(`🤖 Creating stream with model: ${selectedModel}`);
    console.log(`📊 Settings: temp=${modelSettings.temperature}, maxTokens=${modelSettings.maxTokens}`);
    console.log(`💬 Messages: ${openAIMessages.length} messages`);

    // Use Vercel AI SDK streamText for proper useChat hook compatibility
    console.log('⏳ Calling AI SDK streamText...');
    const result = streamText({
      model: openai(selectedModel),
      messages: openAIMessages, // Already in correct format after filtering/validation
      system: enhancedSystemPrompt, // Use system parameter instead of adding to messages array
      temperature: modelSettings.temperature || temperature,
      maxTokens: modelSettings.maxTokens || 4000,
    });

    console.log('✅ Stream created successfully');

    // Track successful request
    trackRequest('/api/chat', 'POST', Date.now() - chatStartTime, 200);

    // Return Vercel AI SDK response format (compatible with useChat hook)
    return result.toUIMessageStreamResponse();

  } catch (error) {
    console.error("Chat API error:", error);

    // Log full error details for debugging
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as any;
      console.error("OpenAI API Error Details:", {
        status: apiError.status,
        type: apiError.type,
        message: apiError.message,
        headers: apiError.response?.headers,
      });
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStr = String(error);

    // Check for specific OpenAI error types
    const is429RateLimit = errorMessage.includes('429') || errorStr.includes('429') ||
                          errorMessage.includes('rate_limit_exceeded') || errorStr.includes('rate_limit_exceeded');
    const isQuotaError = (errorMessage.includes('quota') || errorMessage.includes('insufficient_quota')) &&
                        !is429RateLimit; // Don't confuse rate limits with quota
    const isRateLimitError = is429RateLimit || errorMessage.includes('Rate limit');

    let userFriendlyMessage = "I'm experiencing technical difficulties. Please try again in a moment.";

    if (isRateLimitError) {
      userFriendlyMessage = "⚠️ Rate limit reached. GPT-5 has strict rate limits. Please wait 10-20 seconds before trying again.";
    } else if (isQuotaError) {
      userFriendlyMessage = "I've reached my OpenAI API quota limit. Please contact support or try again later when the quota resets.";
    }
    
    // Track error for introspection
    trackRequest('/api/chat', 'POST', Date.now() - chatStartTime, isQuotaError || isRateLimitError ? 429 : 500, errorMessage);
    
    return new Response(
      JSON.stringify({
        error: userFriendlyMessage,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      }),
      {
        status: isQuotaError || isRateLimitError ? 429 : 500,
        headers: { 
          "Content-Type": "application/json",
          "Retry-After": isQuotaError ? "3600" : isRateLimitError ? "60" : "10"
        },
      },
    );
  }
}