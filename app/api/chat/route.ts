import OpenAI from "openai";
import { aomaCache } from "../../../src/services/aomaCache";
import { aomaOrchestrator } from "../../../src/services/aomaOrchestrator";
import { aomaParallelQuery } from "../../../src/services/aomaParallelQuery";
import { modelConfig } from "../../../src/services/modelConfig";
import { trackRequest } from "../introspection/route";

// Allow streaming responses up to 60 seconds for AOMA queries
export const maxDuration = 60;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

// Simple rate limiter: Track last request time per IP/session
const requestTimestamps = new Map<string, number>();
const MIN_REQUEST_INTERVAL_MS = 1000; // Minimum 1 second between requests (Tier 5 allows 10,000 RPM)

function checkRateLimit(identifier: string): { allowed: boolean; waitTime?: number } {
  const now = Date.now();
  const lastRequest = requestTimestamps.get(identifier);

  if (lastRequest) {
    const timeSinceLastRequest = now - lastRequest;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
      const waitTime = MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest;
      return { allowed: false, waitTime };
    }
  }

  requestTimestamps.set(identifier, now);

  // Cleanup old entries (older than 1 minute)
  for (const [key, timestamp] of requestTimestamps.entries()) {
    if (now - timestamp > 60000) {
      requestTimestamps.delete(key);
    }
  }

  return { allowed: true };
}

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

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    // Rate limit check using IP or session identifier
    const identifier = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'anonymous';
    const rateLimitCheck = checkRateLimit(identifier);

    if (!rateLimitCheck.allowed) {
      console.warn(`[API] Rate limit exceeded for ${identifier}, wait ${rateLimitCheck.waitTime}ms`);
      return new Response(
        JSON.stringify({
          error: `Rate limit reached. Please wait ${Math.ceil((rateLimitCheck.waitTime || 0) / 1000)} seconds before sending another message.`,
          retryAfter: rateLimitCheck.waitTime,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((rateLimitCheck.waitTime || 0) / 1000)),
          },
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
    const openAIMessages: OpenAI.Chat.ChatCompletionMessageParam[] = messages
      .filter((msg: any) => {
        // Filter out messages with null, undefined, or empty content
        if (msg.content == null || msg.content === '') {
          console.warn(`[API] Filtering out message with invalid content:`, { role: msg.role, content: msg.content });
          return false;
        }
        return true;
      })
      .map((msg: any) => {
        // Ensure content is always a string
        const content = String(msg.content || '');
        
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
        "🎯 Executing parallel AOMA queries for:",
        queryString.substring(0, 100),
      );

      try {
        // Use parallel query service for better performance
        const aomaResult = await aomaParallelQuery.queryWithParallelFallback(
          queryString,
          "rapid" // Use rapid strategy for fastest response
        );

        if (aomaResult.success && aomaResult.content) {
          // Create knowledge element from AOMA response
          knowledgeElements.push({
            type: 'context',
            content: aomaResult.content,
            metadata: {
              source: aomaResult.metadata?.source || 'aoma-mesh',
              responseTime: aomaResult.metadata?.responseTime,
              timestamp: new Date().toISOString(),
            }
          });

          aomaContext = `\n\n[AOMA Context:\n${aomaResult.content}\n]`;
          aomaConnectionStatus = "success";
          console.log(`✅ AOMA query successful via ${aomaResult.metadata?.source} in ${Math.round(aomaResult.metadata?.responseTime || 0)}ms`);
        } else {
          // Fallback to orchestrator if parallel query fails
          console.log("⚠️ Parallel query failed, trying orchestrator...");
          
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
            
            aomaContext = `\n\n[AOMA Orchestrated Context:\n${contextContent}\n]`;
            aomaConnectionStatus = "success";
            console.log("✅ AOMA orchestration fallback successful");
          } else {
            console.log("❌ All AOMA queries failed");
            aomaConnectionStatus = "failed";
            
            knowledgeElements.push({
              type: 'warning',
              content: 'AOMA knowledge base is currently unavailable',
              metadata: {
                timestamp: new Date().toISOString(),
              }
            });
          }
        }
      } catch (error) {
        console.error("❌ AOMA query error:", error);
        aomaConnectionStatus = "failed";
        
        knowledgeElements.push({
          type: 'warning',
          content: 'Unable to access AOMA resources due to an error',
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          }
        });
      }
    }

    // Enhanced system prompt that includes AOMA orchestration context
    const enhancedSystemPrompt = `${systemPrompt || "You are SIAM, an AI assistant with access to Sony Music's AOMA orchestrated resources including knowledge base, Jira, Git, emails, and development context."}

${aomaContext}

When responding, structure your knowledge appropriately and include any relevant context from AOMA resources.`;

    // Add system message with enhanced prompt
    const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: enhancedSystemPrompt },
      ...openAIMessages,
    ];

    // Determine model based on AOMA involvement
    const hasAomaContent = aomaContext.trim() !== "";
    const useCase = hasAomaContent ? "aoma-query" : "chat";
    const modelSettings = modelConfig.getModelWithConfig(useCase);
    const selectedModel = model || modelSettings.model || "gpt-4o-mini";

    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: selectedModel,
      messages: allMessages,
      temperature: modelSettings.temperature || temperature,
      max_completion_tokens: modelSettings.maxTokens || 4000, // Updated from max_tokens (deprecated)
      stream: true,
    });

    // Create a TransformStream to handle the streaming response and convert to Vercel format
    const encoder = new TextEncoder();
    
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        try {
          // OpenAI chunks come as ChatCompletionChunk objects
          const choices = chunk.choices;
          
          if (choices && choices[0]?.delta?.content) {
            // Convert to Vercel AI SDK format for compatibility with useChat hook
            const vercelFormatChunk = {
              id: chunk.id,
              object: 'chat.completion.chunk',
              created: chunk.created || Date.now(),
              model: chunk.model || selectedModel,
              choices: [{
                index: 0,
                delta: {
                  content: choices[0].delta.content,
                  role: choices[0].delta.role
                },
                finish_reason: choices[0].finish_reason || null
              }]
            };
            
            // Send as SSE format
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(vercelFormatChunk)}\n\n`));
          }
          
          // Check if stream is finished
          if (choices && choices[0]?.finish_reason) {
            // Send knowledge elements as a custom event if any
            if (knowledgeElements.length > 0) {
              const knowledgeEvent = {
                type: 'knowledge',
                knowledge: knowledgeElements,
                metadata: {
                  model: selectedModel,
                  aomaConnectionStatus,
                  responseTime: Date.now() - chatStartTime,
                }
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(knowledgeEvent)}\n\n`));
            }
            
            // Send done signal
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          }
        } catch (e) {
          console.error('Transform error:', e);
        }
      },
    });

    // Track successful request
    trackRequest('/api/chat', 'POST', Date.now() - chatStartTime, 200);

    // Create readable stream from async iterator
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            await transformStream.writable.getWriter().write(chunk);
          }
          await transformStream.writable.close();
          
          // Pipe transformed data to response
          const reader = transformStream.readable.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    // Return SSE stream
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error("Chat API error:", error);

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
      userFriendlyMessage = "⚠️ Rate limit reached. Please wait a moment before sending another message.";
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