/**
 * Lambda MCP Audio Router Service
 * Routes audio processing through the Lambda MCP server for the SIAM transcription pipeline
 *
 * Handles:
 * - Audio routing to Lambda MCP server
 * - 30-second Lambda timeout constraints
 * - Audio chunking for large files
 * - Retry logic with exponential backoff
 * - Error handling and fallbacks
 */

import { getMcpLambdaUrl } from '../config/apiKeys';

export interface AudioRouterConfig {
  lambdaUrl: string;
  timeout: number; // milliseconds
  maxRetries: number;
  chunkSize: number; // bytes
  enableChunking: boolean;
}

export interface AudioProcessingRequest {
  audioData: Blob | ArrayBuffer;
  metadata?: {
    format?: string;
    sampleRate?: number;
    channels?: number;
    duration?: number;
  };
  options?: {
    enableVoiceIsolation?: boolean;
    transcriptionModel?: 'whisper-1' | 'gpt-4o-transcribe';
    language?: string;
  };
}

export interface AudioProcessingResponse {
  success: boolean;
  transcription?: {
    text: string;
    confidence?: number;
    language?: string;
    segments?: Array<{
      text: string;
      start: number;
      end: number;
    }>;
  };
  voiceIsolation?: {
    applied: boolean;
    quality?: number;
  };
  metadata?: {
    processingTime: number;
    chunkCount?: number;
    model?: string;
  };
  error?: string;
  retryCount?: number;
}

export interface ChunkProcessingResult {
  chunkIndex: number;
  success: boolean;
  transcription?: string;
  error?: string;
  processingTime: number;
}

class LambdaMcpAudioRouter {
  private config: AudioRouterConfig;
  private isProcessing = false;
  private abortController: AbortController | null = null;

  constructor(config?: Partial<AudioRouterConfig>) {
    this.config = {
      lambdaUrl: getMcpLambdaUrl(),
      timeout: 28000, // 28 seconds (leave 2s buffer for Lambda's 30s limit)
      maxRetries: 3,
      chunkSize: 5 * 1024 * 1024, // 5MB chunks (well under Lambda limits)
      enableChunking: true,
      ...config,
    };

    console.log('🎤 Lambda MCP Audio Router initialized');
    console.log(`   Lambda URL: ${this.config.lambdaUrl}`);
    console.log(`   Timeout: ${this.config.timeout}ms`);
    console.log(`   Max Retries: ${this.config.maxRetries}`);
  }

  /**
   * Process audio through Lambda MCP server
   */
  async processAudio(request: AudioProcessingRequest): Promise<AudioProcessingResponse> {
    const startTime = performance.now();

    console.log('🚀 Lambda MCP Audio Router: Starting audio processing...');

    try {
      // Convert to Blob if needed
      const audioBlob = request.audioData instanceof Blob
        ? request.audioData
        : new Blob([request.audioData], { type: request.metadata?.format || 'audio/webm' });

      console.log(`   Audio size: ${(audioBlob.size / 1024).toFixed(1)}KB`);

      // Determine if chunking is needed
      const shouldChunk = this.config.enableChunking && audioBlob.size > this.config.chunkSize;

      if (shouldChunk) {
        console.log('📦 Audio file is large, processing in chunks...');
        return await this.processAudioInChunks(audioBlob, request);
      } else {
        console.log('📤 Processing audio in single request...');
        return await this.processSingleAudio(audioBlob, request);
      }

    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error('❌ Lambda MCP Audio Router: Processing failed:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown processing error',
        metadata: {
          processingTime,
        },
      };
    }
  }

  /**
   * Process audio in a single request
   */
  private async processSingleAudio(
    audioBlob: Blob,
    request: AudioProcessingRequest,
    retryCount = 0
  ): Promise<AudioProcessingResponse> {
    const startTime = performance.now();

    try {
      // Create abort controller for timeout
      this.abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        this.abortController?.abort();
      }, this.config.timeout);

      // Prepare form data for Lambda MCP server
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('options', JSON.stringify(request.options || {}));
      formData.append('metadata', JSON.stringify(request.metadata || {}));

      console.log(`🔄 Sending audio to Lambda MCP server (attempt ${retryCount + 1}/${this.config.maxRetries + 1})...`);

      // Call Lambda MCP server
      const response = await fetch(`${this.config.lambdaUrl}/transcribe`, {
        method: 'POST',
        body: formData,
        signal: this.abortController.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Lambda MCP server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const processingTime = performance.now() - startTime;

      console.log(`✅ Lambda MCP processing completed in ${processingTime.toFixed(0)}ms`);

      return {
        success: true,
        transcription: result.transcription,
        voiceIsolation: result.voiceIsolation,
        metadata: {
          processingTime,
          model: result.model,
        },
        retryCount,
      };

    } catch (error: any) {
      const processingTime = performance.now() - startTime;

      // Handle timeout
      if (error.name === 'AbortError') {
        console.error(`⏱️ Lambda MCP request timed out after ${this.config.timeout}ms`);

        // Retry with exponential backoff
        if (retryCount < this.config.maxRetries) {
          const backoffDelay = Math.pow(2, retryCount) * 1000;
          console.log(`🔄 Retrying in ${backoffDelay}ms...`);
          await this.delay(backoffDelay);
          return await this.processSingleAudio(audioBlob, request, retryCount + 1);
        }
      }

      // Handle other errors
      console.error('❌ Lambda MCP single audio processing failed:', error);

      // Retry logic
      if (retryCount < this.config.maxRetries && this.isRetryableError(error)) {
        const backoffDelay = Math.pow(2, retryCount) * 1000;
        console.log(`🔄 Retrying in ${backoffDelay}ms...`);
        await this.delay(backoffDelay);
        return await this.processSingleAudio(audioBlob, request, retryCount + 1);
      }

      return {
        success: false,
        error: error.message || 'Lambda MCP processing failed',
        metadata: {
          processingTime,
        },
        retryCount,
      };
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Process large audio files in chunks
   */
  private async processAudioInChunks(
    audioBlob: Blob,
    request: AudioProcessingRequest
  ): Promise<AudioProcessingResponse> {
    const startTime = performance.now();
    const chunks = this.chunkAudioBlob(audioBlob);

    console.log(`📦 Processing ${chunks.length} audio chunks...`);

    const chunkResults: ChunkProcessingResult[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`   Processing chunk ${i + 1}/${chunks.length} (${(chunk.size / 1024).toFixed(1)}KB)...`);

      const chunkStartTime = performance.now();

      try {
        const chunkRequest: AudioProcessingRequest = {
          audioData: chunk,
          metadata: {
            ...request.metadata,
            chunkIndex: i,
            totalChunks: chunks.length,
          },
          options: request.options,
        };

        const chunkResult = await this.processSingleAudio(chunk, chunkRequest);

        chunkResults.push({
          chunkIndex: i,
          success: chunkResult.success,
          transcription: chunkResult.transcription?.text,
          error: chunkResult.error,
          processingTime: performance.now() - chunkStartTime,
        });

        console.log(`   ✅ Chunk ${i + 1} processed successfully`);

      } catch (error) {
        console.error(`   ❌ Chunk ${i + 1} failed:`, error);
        chunkResults.push({
          chunkIndex: i,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown chunk error',
          processingTime: performance.now() - chunkStartTime,
        });
      }
    }

    // Combine chunk results
    const totalProcessingTime = performance.now() - startTime;
    const successfulChunks = chunkResults.filter(r => r.success);
    const failedChunks = chunkResults.filter(r => !r.success);

    console.log(`📊 Chunk processing summary:`);
    console.log(`   Total chunks: ${chunks.length}`);
    console.log(`   Successful: ${successfulChunks.length}`);
    console.log(`   Failed: ${failedChunks.length}`);
    console.log(`   Total time: ${totalProcessingTime.toFixed(0)}ms`);

    if (successfulChunks.length === 0) {
      return {
        success: false,
        error: 'All audio chunks failed to process',
        metadata: {
          processingTime: totalProcessingTime,
          chunkCount: chunks.length,
        },
      };
    }

    // Combine transcriptions from successful chunks
    const combinedTranscription = successfulChunks
      .sort((a, b) => a.chunkIndex - b.chunkIndex)
      .map(r => r.transcription)
      .filter(Boolean)
      .join(' ');

    return {
      success: true,
      transcription: {
        text: combinedTranscription,
        confidence: successfulChunks.length / chunks.length, // Chunk success rate
      },
      metadata: {
        processingTime: totalProcessingTime,
        chunkCount: chunks.length,
      },
    };
  }

  /**
   * Chunk audio blob into smaller pieces
   */
  private chunkAudioBlob(audioBlob: Blob): Blob[] {
    const chunks: Blob[] = [];
    const chunkSize = this.config.chunkSize;
    let offset = 0;

    while (offset < audioBlob.size) {
      const end = Math.min(offset + chunkSize, audioBlob.size);
      const chunk = audioBlob.slice(offset, end, audioBlob.type);
      chunks.push(chunk);
      offset = end;
    }

    return chunks;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'NetworkError',
      'FetchError',
    ];

    const errorMessage = error.message || error.toString();
    return retryableErrors.some(retryable => errorMessage.includes(retryable));
  }

  /**
   * Delay helper for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cancel ongoing processing
   */
  cancelProcessing(): void {
    if (this.abortController) {
      console.log('🛑 Cancelling Lambda MCP audio processing...');
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Check if currently processing
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AudioRouterConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('🔧 Lambda MCP Audio Router configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): AudioRouterConfig {
    return { ...this.config };
  }

  /**
   * Health check for Lambda MCP server
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const startTime = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.lambdaUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const latency = performance.now() - startTime;

      if (!response.ok) {
        return {
          healthy: false,
          latency,
          error: `Health check failed: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();

      return {
        healthy: true,
        latency,
      };

    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  }
}

// Export singleton instance
export const lambdaMcpAudioRouter = new LambdaMcpAudioRouter();

export default lambdaMcpAudioRouter;
