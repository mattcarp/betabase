/**
 * Embedding Service for Knowledge API
 *
 * Generates 768-dimensional embeddings using Gemini text-embedding-004
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCachedEmbedding, setCachedEmbedding } from './cache';

let genAI: GoogleGenerativeAI | null = null;
let embeddingModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

function getEmbeddingModel() {
  if (!embeddingModel) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable is required');
    }
    genAI = new GoogleGenerativeAI(apiKey);
    embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  }
  return embeddingModel;
}

export interface EmbeddingResult {
  embedding: number[];
  cached: boolean;
  duration_ms: number;
}

/**
 * Generate embedding for a query string
 * Uses cache to avoid redundant API calls
 */
export async function generateEmbedding(query: string): Promise<EmbeddingResult> {
  const start = performance.now();

  // Check cache first
  const cached = getCachedEmbedding(query);
  if (cached) {
    return {
      embedding: cached,
      cached: true,
      duration_ms: Math.round(performance.now() - start),
    };
  }

  // Generate new embedding
  const model = getEmbeddingModel();
  const result = await model.embedContent(query);
  const embedding = result.embedding.values;

  // Validate dimension
  if (embedding.length !== 768) {
    throw new Error(`Expected 768 dimensions, got ${embedding.length}`);
  }

  // Cache the embedding
  setCachedEmbedding(query, embedding);

  return {
    embedding,
    cached: false,
    duration_ms: Math.round(performance.now() - start),
  };
}
