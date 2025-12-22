/**
 * Query Embedding Service
 * 
 * Uses AI SDK v6's native Google embedding support with TASK TYPES
 * for optimized retrieval performance.
 * 
 * Key improvement: Uses RETRIEVAL_QUERY task type for user queries,
 * which optimizes embeddings for finding relevant documents.
 * 
 * Note: Your existing documents were embedded without task types.
 * This is fine - task types primarily help queries find the right docs.
 * 
 * Part of RAG Overhaul - Option C (Google-only, no Cohere)
 */

import { google } from "@ai-sdk/google";
import { embed, embedMany } from "ai";

/**
 * Task types for Google embeddings
 * 
 * RETRIEVAL_QUERY: For user questions (what you embed at query time)
 * RETRIEVAL_DOCUMENT: For knowledge base documents
 * SEMANTIC_SIMILARITY: General similarity matching
 * CLASSIFICATION: Text classification tasks
 * CLUSTERING: Grouping similar content
 * QUESTION_ANSWERING: Optimized for Q&A scenarios
 */
export type EmbeddingTaskType =
  | "RETRIEVAL_QUERY"
  | "RETRIEVAL_DOCUMENT"
  | "SEMANTIC_SIMILARITY"
  | "CLASSIFICATION"
  | "CLUSTERING"
  | "QUESTION_ANSWERING";

export interface QueryEmbeddingOptions {
  taskType?: EmbeddingTaskType;
  outputDimensionality?: number; // Default 768 for text-embedding-004
}

/**
 * Generate embedding for a user query
 * 
 * Uses RETRIEVAL_QUERY task type by default, which optimizes
 * the embedding for finding relevant documents.
 * 
 * @param query - The user's question or search query
 * @param options - Optional configuration
 * @returns 768-dimensional embedding vector
 */
export async function embedQuery(
  query: string,
  options: QueryEmbeddingOptions = {}
): Promise<number[]> {
  const {
    taskType = "RETRIEVAL_QUERY",
    outputDimensionality = 768,
  } = options;

  try {
    const { embedding } = await embed({
      model: google.embedding("text-embedding-004"),
      value: query,
      providerOptions: {
        google: {
          taskType,
          outputDimensionality,
        },
      },
    });

    if (embedding.length !== outputDimensionality) {
      console.warn(
        `⚠️ Expected ${outputDimensionality} dimensions, got ${embedding.length}`
      );
    }

    return embedding;
  } catch (error) {
    console.error("❌ Query embedding failed:", error);
    throw new Error(
      `Query embedding failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate embeddings for multiple queries in batch
 * 
 * @param queries - Array of query strings
 * @param options - Optional configuration
 * @returns Array of 768-dimensional embedding vectors
 */
export async function embedQueries(
  queries: string[],
  options: QueryEmbeddingOptions = {}
): Promise<number[][]> {
  const {
    taskType = "RETRIEVAL_QUERY",
    outputDimensionality = 768,
  } = options;

  try {
    const { embeddings } = await embedMany({
      model: google.embedding("text-embedding-004"),
      values: queries,
      providerOptions: {
        google: {
          taskType,
          outputDimensionality,
        },
      },
    });

    return embeddings;
  } catch (error) {
    console.error("❌ Batch query embedding failed:", error);
    throw new Error(
      `Batch query embedding failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate embedding for a document (for indexing)
 * 
 * Uses RETRIEVAL_DOCUMENT task type, optimized for being found by queries.
 * 
 * @param content - The document content to embed
 * @param options - Optional configuration
 * @returns 768-dimensional embedding vector
 */
export async function embedDocument(
  content: string,
  options: Omit<QueryEmbeddingOptions, "taskType"> = {}
): Promise<number[]> {
  return embedQuery(content, {
    ...options,
    taskType: "RETRIEVAL_DOCUMENT",
  });
}

/**
 * Generate embeddings for multiple documents in batch
 * 
 * @param contents - Array of document content strings
 * @param options - Optional configuration
 * @returns Array of 768-dimensional embedding vectors
 */
export async function embedDocuments(
  contents: string[],
  options: Omit<QueryEmbeddingOptions, "taskType"> = {}
): Promise<number[][]> {
  return embedQueries(contents, {
    ...options,
    taskType: "RETRIEVAL_DOCUMENT",
  });
}

/**
 * Calculate cosine similarity between two vectors
 * 
 * @param a - First vector
 * @param b - Second vector
 * @returns Similarity score between -1 and 1
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Query Embedding Service class (for compatibility with existing code)
 */
export class QueryEmbeddingService {
  private defaultOptions: QueryEmbeddingOptions;

  constructor(options: QueryEmbeddingOptions = {}) {
    this.defaultOptions = options;
  }

  async generateQueryEmbedding(query: string): Promise<number[]> {
    return embedQuery(query, this.defaultOptions);
  }

  async generateDocumentEmbedding(content: string): Promise<number[]> {
    return embedDocument(content, this.defaultOptions);
  }

  async generateQueryEmbeddingsBatch(queries: string[]): Promise<number[][]> {
    return embedQueries(queries, this.defaultOptions);
  }

  async generateDocumentEmbeddingsBatch(contents: string[]): Promise<number[][]> {
    return embedDocuments(contents, this.defaultOptions);
  }
}

// Singleton instance
let queryEmbeddingService: QueryEmbeddingService | null = null;

export function getQueryEmbeddingService(): QueryEmbeddingService {
  if (!queryEmbeddingService) {
    queryEmbeddingService = new QueryEmbeddingService();
  }
  return queryEmbeddingService;
}
