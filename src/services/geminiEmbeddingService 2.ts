/**
 * Gemini Embedding Service
 * 
 * Handles embedding generation using Google's Gemini text-embedding-004 model (768 dimensions)
 * Part of the Advanced RLHF RAG Implementation
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiEmbeddingService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY environment variable is required for Gemini embeddings");
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
  }

  /**
   * Generate embedding using Gemini text-embedding-004
   * Returns 768-dimensional vector
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.model.embedContent(text);
      const embedding = result.embedding.values;
      
      if (embedding.length !== 768) {
        throw new Error(`Expected 768 dimensions, got ${embedding.length}`);
      }
      
      return embedding;
    } catch (error) {
      console.error("❌ Gemini embedding generation failed:", error);
      throw new Error(`Gemini embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch generate embeddings for multiple texts
   * Processes in chunks to respect rate limits
   */
  async generateEmbeddingsBatch(
    texts: string[],
    options: {
      batchSize?: number;
      onProgress?: (completed: number, total: number) => void;
    } = {}
  ): Promise<number[][]> {
    const { batchSize = 10, onProgress } = options;
    const embeddings: number[][] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map(text => this.generateEmbedding(text))
      );
      embeddings.push(...batchEmbeddings);
      
      if (onProgress) {
        onProgress(i + batch.length, texts.length);
      }
      
      // Small delay to respect rate limits
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return embeddings;
  }
}

// Singleton instance
let geminiEmbeddingService: GeminiEmbeddingService | null = null;

export function getGeminiEmbeddingService(): GeminiEmbeddingService {
  if (!geminiEmbeddingService) {
    geminiEmbeddingService = new GeminiEmbeddingService();
  }
  return geminiEmbeddingService;
}

