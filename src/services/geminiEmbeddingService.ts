/**
 * Gemini Embedding Service - STUB
 * Real implementation disabled for demo
 */

export function getGeminiEmbeddingService() {
  return {
    generateEmbedding: async (text: string) => {
      // Return dummy embedding for now
      return new Array(768).fill(0);
    }
  };
}

export class GeminiEmbeddingService {
  async generateEmbedding(text: string) {
    return new Array(768).fill(0);
  }
}
