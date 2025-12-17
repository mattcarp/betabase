/**
 * Langfuse Observability Client
 * 
 * Provides tracing for:
 * - LLM generations (Gemini API calls)
 * - Vector search operations (Supabase pgvector)
 * - RAG pipeline orchestration
 * 
 * @see https://langfuse.com/docs/sdk/typescript
 */

import { Langfuse } from "langfuse";

// Singleton instance
let langfuseInstance: Langfuse | null = null;

/**
 * Get or create the Langfuse client instance
 */
export function getLangfuse(): Langfuse {
  if (!langfuseInstance) {
    const secretKey = process.env.LANGFUSE_SECRET_KEY;
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
    const baseUrl = process.env.LANGFUSE_BASEURL;

    if (!secretKey || !publicKey) {
      console.warn("[Langfuse] Missing credentials - tracing disabled");
      // Return a no-op client that won't break the app
      return createNoOpLangfuse();
    }

    langfuseInstance = new Langfuse({
      secretKey,
      publicKey,
      baseUrl: baseUrl || "https://us.cloud.langfuse.com",
      // Flush events before serverless function ends
      flushAt: 1,
      flushInterval: 0,
    });

    console.log("[Langfuse] Client initialized successfully");
  }

  return langfuseInstance;
}

/**
 * Create a no-op Langfuse instance for when credentials are missing
 */
function createNoOpLangfuse(): Langfuse {
  return {
    trace: () => createNoOpTrace(),
    generation: () => ({ end: () => {}, update: () => {} }),
    span: () => ({ end: () => {}, update: () => {} }),
    score: () => {},
    flush: async () => {},
    shutdownAsync: async () => {},
  } as unknown as Langfuse;
}

function createNoOpTrace() {
  return {
    generation: () => ({ end: () => {}, update: () => {} }),
    span: () => ({ end: () => {}, update: () => {} }),
    score: () => {},
    update: () => {},
  };
}

/**
 * Trace a complete chat request
 */
export function traceChat(options: {
  sessionId?: string;
  userId?: string;
  input: string;
  metadata?: Record<string, any>;
}) {
  const langfuse = getLangfuse();
  
  const trace = langfuse.trace({
    name: "chat-request",
    sessionId: options.sessionId,
    userId: options.userId,
    input: options.input,
    metadata: {
      ...options.metadata,
      timestamp: new Date().toISOString(),
    },
  });

  return {
    trace,
    
    /**
     * Trace a vector search operation
     */
    traceVectorSearch(searchOptions: {
      query: string;
      provider: "gemini" | "openai";
      threshold: number;
      topK: number;
    }) {
      const span = trace.span({
        name: "vector-search",
        input: searchOptions,
        metadata: {
          provider: searchOptions.provider,
          threshold: searchOptions.threshold,
          topK: searchOptions.topK,
        },
      });

      return {
        end(results: {
          count: number;
          topSimilarity?: number;
          durationMs: number;
          sources?: string[];
        }) {
          span.end({
            output: results,
            metadata: {
              resultCount: results.count,
              topSimilarity: results.topSimilarity,
              durationMs: results.durationMs,
            },
          });
        },
      };
    },

    /**
     * Trace an embedding generation
     */
    traceEmbedding(embeddingOptions: {
      text: string;
      provider: "gemini" | "openai";
      model: string;
    }) {
      const span = trace.span({
        name: "embedding-generation",
        input: { textLength: embeddingOptions.text.length },
        metadata: {
          provider: embeddingOptions.provider,
          model: embeddingOptions.model,
        },
      });

      return {
        end(results: {
          dimensions: number;
          durationMs: number;
        }) {
          span.end({
            output: { dimensions: results.dimensions },
            metadata: { durationMs: results.durationMs },
          });
        },
      };
    },

    /**
     * Trace an LLM generation (Gemini API call)
     */
    traceGeneration(generationOptions: {
      model: string;
      systemPrompt?: string;
      messages: Array<{ role: string; content: string }>;
      temperature?: number;
    }) {
      const generation = trace.generation({
        name: "llm-generation",
        model: generationOptions.model,
        input: generationOptions.messages,
        modelParameters: {
          temperature: generationOptions.temperature,
        },
        metadata: {
          systemPromptLength: generationOptions.systemPrompt?.length || 0,
          messageCount: generationOptions.messages.length,
        },
      });

      return {
        end(results: {
          output: string;
          finishReason?: string;
          usage?: {
            promptTokens?: number;
            completionTokens?: number;
            totalTokens?: number;
          };
          durationMs: number;
        }) {
          generation.end({
            output: results.output,
            usage: results.usage,
            metadata: {
              finishReason: results.finishReason,
              durationMs: results.durationMs,
              outputLength: results.output?.length || 0,
            },
          });
        },

        /**
         * Update with streaming progress
         */
        update(partialOutput: string) {
          generation.update({
            completionStartTime: new Date(),
            metadata: {
              streamingProgress: partialOutput.length,
            },
          });
        },
      };
    },

    /**
     * Trace RAG orchestration
     */
    traceRAG(ragOptions: {
      strategy: string;
      useContextAware: boolean;
      useAgenticRAG: boolean;
      useRLHFSignals: boolean;
    }) {
      const span = trace.span({
        name: "rag-orchestration",
        input: ragOptions,
        metadata: ragOptions,
      });

      return {
        end(results: {
          confidence: number;
          documentsRetrieved: number;
          documentsAfterRerank: number;
          agentIterations?: number;
          durationMs: number;
        }) {
          span.end({
            output: results,
            metadata: {
              confidence: results.confidence,
              documentsRetrieved: results.documentsRetrieved,
              documentsAfterRerank: results.documentsAfterRerank,
              agentIterations: results.agentIterations,
              durationMs: results.durationMs,
            },
          });
        },
      };
    },

    /**
     * Record a score for the response
     */
    score(scoreOptions: {
      name: string;
      value: number;
      comment?: string;
    }) {
      trace.score({
        name: scoreOptions.name,
        value: scoreOptions.value,
        comment: scoreOptions.comment,
      });
    },

    /**
     * Update trace with final output
     */
    end(output: string, metadata?: Record<string, any>) {
      trace.update({
        output,
        metadata: {
          ...metadata,
          completedAt: new Date().toISOString(),
        },
      });
    },
  };
}

/**
 * Flush all pending events (important for serverless!)
 */
export async function flushLangfuse(): Promise<void> {
  const langfuse = getLangfuse();
  await langfuse.flush();
}

/**
 * Shutdown Langfuse gracefully
 */
export async function shutdownLangfuse(): Promise<void> {
  if (langfuseInstance) {
    await langfuseInstance.shutdownAsync();
    langfuseInstance = null;
  }
}

export default getLangfuse;
