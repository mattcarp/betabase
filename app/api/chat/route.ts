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
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function POST(req: Request) {
  const chatStartTime = Date.now();
  
  try {
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

    // Convert UI messages to OpenAI format
    const openAIMessages: OpenAI.Chat.ChatCompletionMessageParam[] = messages.map((msg: any) => {
      if (msg.role === 'system') {
        return { role: 'system', content: msg.content };
      } else if (msg.role === 'user') {
        return { role: 'user', content: msg.content };
      } else if (msg.role === 'assistant') {
        return { role: 'assistant', content: msg.content };
      }
      return msg;
    });

    // Initialize AOMA context and knowledge elements
    let aomaContext = "";
    let aomaConnectionStatus = "not-queried";
    const knowledgeElements: KnowledgeElement[] = [];

    // Check if we need AOMA context
    const latestUserMessage = messages
      .filter((m: any) => m.role === "user")
      .pop();

    if (latestUserMessage && latestUserMessage.content) {
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
      max_tokens: modelSettings.maxTokens || 4000,
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
    const isQuotaError = errorMessage.includes('quota') || errorMessage.includes('insufficient_quota');
    const isRateLimitError = errorMessage.includes('rate_limit') || errorMessage.includes('Rate limit');
    
    let userFriendlyMessage = "I'm experiencing technical difficulties. Please try again in a moment.";
    
    if (isQuotaError) {
      userFriendlyMessage = "I've reached my OpenAI API quota limit. Please contact support or try again later when the quota resets.";
    } else if (isRateLimitError) {
      userFriendlyMessage = "I'm currently handling too many requests. Please wait a moment and try again.";
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