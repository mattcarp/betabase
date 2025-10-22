/**
 * Lambda MCP Transcription Pipeline
 * Integrates Lambda MCP Audio Router with SIAM's Enhanced Audio Processor
 *
 * Features:
 * - Seamless routing between Lambda MCP and local processing
 * - Fallback to local processing if Lambda MCP fails
 * - Enhanced results with content analysis
 * - Real-time callback support
 * - Performance metrics and monitoring
 */

import {
  lambdaMcpAudioRouter,
  AudioProcessingRequest,
  AudioProcessingResponse,
} from "./lambdaMcpAudioRouter";
import {
  EnhancedAudioProcessor,
  EnhancedProcessingResult,
  ProcessingConfig,
  VoiceIsolationResult,
  TranscriptionResult,
  ContentAnalysisResult,
} from "./enhancedAudioProcessor";

export interface PipelineConfig extends ProcessingConfig {
  useLambdaMcp: boolean;
  fallbackToLocal: boolean;
  lambdaTimeout?: number;
  enableMetrics?: boolean;
}

export interface PipelineResult extends EnhancedProcessingResult {
  processingMode: "lambda-mcp" | "local" | "hybrid";
  lambdaAttempted: boolean;
  lambdaSuccess: boolean;
  fallbackUsed: boolean;
  metrics?: {
    lambdaLatency?: number;
    localLatency?: number;
    totalLatency: number;
    retryCount?: number;
  };
}

export class LambdaMcpTranscriptionPipeline {
  private config: PipelineConfig;
  private localProcessor: EnhancedAudioProcessor;
  private isProcessing = false;

  // Performance metrics
  private stats = {
    totalProcessed: 0,
    lambdaSuccessCount: 0,
    lambdaFailureCount: 0,
    fallbackCount: 0,
    averageLambdaLatency: 0,
    averageLocalLatency: 0,
  };

  constructor(config?: Partial<PipelineConfig>) {
    this.config = {
      // Default to Lambda MCP with local fallback
      useLambdaMcp: true,
      fallbackToLocal: true,
      lambdaTimeout: 28000,
      enableMetrics: true,

      // Enhanced Audio Processor config
      enableVoiceIsolation: true,
      enableRealTimeTranscription: true,
      enableContentAnalysis: true,
      transcriptionModel: "gpt-4o-transcribe",
      voiceIsolationQuality: "high",
      contentModerationLevel: "moderate",

      ...config,
    };

    // Initialize local processor for fallback
    this.localProcessor = new EnhancedAudioProcessor({
      enableVoiceIsolation: this.config.enableVoiceIsolation,
      enableRealTimeTranscription: this.config.enableRealTimeTranscription,
      enableContentAnalysis: this.config.enableContentAnalysis,
      transcriptionModel: this.config.transcriptionModel,
      voiceIsolationQuality: this.config.voiceIsolationQuality,
      contentModerationLevel: this.config.contentModerationLevel,
      realTimeCallbacks: this.config.realTimeCallbacks,
    });

    console.log("🎙️ Lambda MCP Transcription Pipeline initialized");
    console.log(`   Lambda MCP: ${this.config.useLambdaMcp ? "✅" : "❌"}`);
    console.log(`   Local Fallback: ${this.config.fallbackToLocal ? "✅" : "❌"}`);
    console.log(`   Timeout: ${this.config.lambdaTimeout}ms`);
  }

  /**
   * Process audio through the integrated pipeline
   */
  async processAudio(audioData: Blob | ArrayBuffer): Promise<PipelineResult> {
    const startTime = performance.now();
    this.isProcessing = true;

    console.log("🎤 Lambda MCP Transcription Pipeline: Starting processing...");

    try {
      let processingMode: "lambda-mcp" | "local" | "hybrid" = "local";
      let lambdaAttempted = false;
      let lambdaSuccess = false;
      let fallbackUsed = false;
      let lambdaLatency: number | undefined;
      let localLatency: number | undefined;
      let retryCount: number | undefined;

      let transcriptionResult: TranscriptionResult | undefined;
      let voiceIsolationResult: VoiceIsolationResult | undefined;
      let contentAnalysis: ContentAnalysisResult | undefined;

      // Attempt Lambda MCP processing first
      if (this.config.useLambdaMcp) {
        lambdaAttempted = true;
        const lambdaStartTime = performance.now();

        console.log("🚀 Attempting Lambda MCP processing...");

        try {
          const lambdaRequest: AudioProcessingRequest = {
            audioData,
            options: {
              enableVoiceIsolation: this.config.enableVoiceIsolation,
              transcriptionModel: this.config.transcriptionModel,
              language: "en",
            },
          };

          const lambdaResponse = await lambdaMcpAudioRouter.processAudio(lambdaRequest);
          lambdaLatency = performance.now() - lambdaStartTime;
          retryCount = lambdaResponse.retryCount;

          if (lambdaResponse.success && lambdaResponse.transcription) {
            lambdaSuccess = true;
            processingMode = "lambda-mcp";

            console.log(`✅ Lambda MCP processing succeeded in ${lambdaLatency.toFixed(0)}ms`);

            // Convert Lambda response to our format
            transcriptionResult = {
              success: true,
              text: lambdaResponse.transcription.text,
              confidence: lambdaResponse.transcription.confidence,
              language: lambdaResponse.transcription.language,
              processingTime: lambdaResponse.metadata?.processingTime || 0,
            };

            voiceIsolationResult = {
              success: lambdaResponse.voiceIsolation?.applied || false,
              processingTime: 0,
            };

            // Perform content analysis locally on the transcription
            if (this.config.enableContentAnalysis && transcriptionResult.text) {
              console.log("🔍 Performing local content analysis on Lambda transcription...");
              contentAnalysis = await this.performContentAnalysis(transcriptionResult.text);
            }
          } else {
            throw new Error(lambdaResponse.error || "Lambda MCP processing failed");
          }
        } catch (error) {
          lambdaLatency = performance.now() - lambdaStartTime;
          console.error(
            `❌ Lambda MCP processing failed after ${lambdaLatency.toFixed(0)}ms:`,
            error
          );

          // Fall back to local processing if enabled
          if (this.config.fallbackToLocal) {
            console.log("🔄 Falling back to local processing...");
            fallbackUsed = true;
            processingMode = "hybrid";

            const localStartTime = performance.now();
            const localResult = await this.localProcessor.processAudio(audioData);
            localLatency = performance.now() - localStartTime;

            transcriptionResult = localResult.transcription;
            voiceIsolationResult = localResult.voiceIsolation;
            contentAnalysis = localResult.contentAnalysis;

            console.log(`✅ Local fallback completed in ${localLatency.toFixed(0)}ms`);
          } else {
            throw error;
          }
        }
      } else {
        // Use local processing only
        console.log("🏠 Using local processing (Lambda MCP disabled)...");
        const localStartTime = performance.now();
        const localResult = await this.localProcessor.processAudio(audioData);
        localLatency = performance.now() - localStartTime;

        transcriptionResult = localResult.transcription;
        voiceIsolationResult = localResult.voiceIsolation;
        contentAnalysis = localResult.contentAnalysis;

        console.log(`✅ Local processing completed in ${localLatency.toFixed(0)}ms`);
      }

      // Build final result
      const totalLatency = performance.now() - startTime;

      const result: PipelineResult = {
        voiceIsolation: voiceIsolationResult || {
          success: false,
          error: "Voice isolation not performed",
          processingTime: 0,
        },
        transcription: transcriptionResult || {
          success: false,
          error: "Transcription failed",
          processingTime: 0,
        },
        contentAnalysis: contentAnalysis || this.getDefaultContentAnalysis(),
        audioQuality: {
          originalMetrics: this.getDefaultAudioMetrics(),
        },
        totalProcessingTime: totalLatency,
        processingMode,
        lambdaAttempted,
        lambdaSuccess,
        fallbackUsed,
        metrics: this.config.enableMetrics
          ? {
              lambdaLatency,
              localLatency,
              totalLatency,
              retryCount,
            }
          : undefined,
      };

      // Update statistics
      this.updateStats(result);

      // Trigger callbacks
      this.triggerCallbacks(result);

      console.log(`✅ Pipeline processing completed in ${totalLatency.toFixed(0)}ms`);
      console.log(`   Mode: ${processingMode}`);
      console.log(`   Lambda success: ${lambdaSuccess ? "✅" : "❌"}`);
      console.log(`   Fallback used: ${fallbackUsed ? "✅" : "❌"}`);

      return result;
    } catch (error) {
      console.error("❌ Pipeline processing failed:", error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Perform content analysis on transcribed text
   */
  private async performContentAnalysis(text: string): Promise<ContentAnalysisResult> {
    try {
      const { explicitContentDetector } = await import("./explicitContentDetector");
      const explicitResult = await explicitContentDetector.detectExplicitContent(text);

      return {
        isExplicit: explicitResult.isExplicit,
        explicitScore: explicitResult.confidence,
        contentType: this.classifyContentType(text),
        categories: [],
        sentiment: "neutral",
        sentimentScore: 0,
        keywords: this.extractKeywords(text),
        containsLyrics: false,
        lyricsConfidence: 0,
      };
    } catch (error) {
      console.error("❌ Content analysis failed:", error);
      return this.getDefaultContentAnalysis();
    }
  }

  /**
   * Simple content type classification
   */
  private classifyContentType(text: string): ContentAnalysisResult["contentType"] {
    const lowerText = text.toLowerCase();

    if (/verse|chorus|bridge|lyrics/.test(lowerText)) return "lyrics";
    if (/music|song|album/.test(lowerText)) return "music";
    if (/hello|hi|conversation/.test(lowerText)) return "conversation";
    if (text.length > 50) return "speech";
    return "unknown";
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
    ]);
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))
      .slice(0, 10);
  }

  /**
   * Default content analysis
   */
  private getDefaultContentAnalysis(): ContentAnalysisResult {
    return {
      isExplicit: false,
      explicitScore: 0,
      contentType: "unknown",
      categories: [],
      sentiment: "neutral",
      sentimentScore: 0,
      keywords: [],
      containsLyrics: false,
      lyricsConfidence: 0,
    };
  }

  /**
   * Default audio metrics
   */
  private getDefaultAudioMetrics() {
    return {
      peakLevel: 0.8,
      averageLevel: 0.4,
      signalToNoiseRatio: 15,
      clippingDetected: false,
      frequencyPeaks: [440],
      dominantFrequency: 440,
      vadConfidence: 0.9,
      audioQuality: 85,
    };
  }

  /**
   * Update processing statistics
   */
  private updateStats(result: PipelineResult): void {
    this.stats.totalProcessed++;

    if (result.lambdaAttempted) {
      if (result.lambdaSuccess) {
        this.stats.lambdaSuccessCount++;
      } else {
        this.stats.lambdaFailureCount++;
      }
    }

    if (result.fallbackUsed) {
      this.stats.fallbackCount++;
    }

    if (result.metrics?.lambdaLatency) {
      this.stats.averageLambdaLatency =
        (this.stats.averageLambdaLatency * (this.stats.lambdaSuccessCount - 1) +
          result.metrics.lambdaLatency) /
        this.stats.lambdaSuccessCount;
    }

    if (result.metrics?.localLatency) {
      this.stats.averageLocalLatency =
        (this.stats.averageLocalLatency * (this.stats.fallbackCount - 1) +
          result.metrics.localLatency) /
        this.stats.fallbackCount;
    }
  }

  /**
   * Trigger configured callbacks
   */
  private triggerCallbacks(result: PipelineResult): void {
    const callbacks = this.config.realTimeCallbacks;
    if (!callbacks) return;

    try {
      if (callbacks.onVoiceIsolated && result.voiceIsolation.success) {
        callbacks.onVoiceIsolated(result.voiceIsolation);
      }

      if (
        callbacks.onTranscriptionChunk &&
        result.transcription.success &&
        result.transcription.text
      ) {
        callbacks.onTranscriptionChunk(result.transcription.text, true);
      }

      if (callbacks.onContentAnalysis) {
        callbacks.onContentAnalysis(result.contentAnalysis);
      }
    } catch (error) {
      console.error("❌ Callback error:", error);
    }
  }

  /**
   * Health check for Lambda MCP server
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    return await lambdaMcpAudioRouter.healthCheck();
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return {
      ...this.stats,
      lambdaSuccessRate: this.stats.lambdaSuccessCount / Math.max(this.stats.totalProcessed, 1),
      fallbackRate: this.stats.fallbackCount / Math.max(this.stats.totalProcessed, 1),
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...config };

    // Update local processor config too
    this.localProcessor.updateConfig({
      enableVoiceIsolation: this.config.enableVoiceIsolation,
      enableRealTimeTranscription: this.config.enableRealTimeTranscription,
      enableContentAnalysis: this.config.enableContentAnalysis,
      transcriptionModel: this.config.transcriptionModel,
      voiceIsolationQuality: this.config.voiceIsolationQuality,
      contentModerationLevel: this.config.contentModerationLevel,
      realTimeCallbacks: this.config.realTimeCallbacks,
    });

    console.log("🔧 Lambda MCP Transcription Pipeline configuration updated");
  }

  /**
   * Get current configuration
   */
  getConfig(): PipelineConfig {
    return { ...this.config };
  }

  /**
   * Check if currently processing
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalProcessed: 0,
      lambdaSuccessCount: 0,
      lambdaFailureCount: 0,
      fallbackCount: 0,
      averageLambdaLatency: 0,
      averageLocalLatency: 0,
    };
  }
}

// Export singleton instance
export const lambdaMcpTranscriptionPipeline = new LambdaMcpTranscriptionPipeline();

export default lambdaMcpTranscriptionPipeline;
