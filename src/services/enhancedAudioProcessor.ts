/**
 * Enhanced Audio Processing Service
 *
 * Modern audio processing pipeline:
 * Audio Input → ElevenLabs Voice Isolation → OpenAI Whisper STT → Content Analysis
 *
 * Features:
 * - ElevenLabs Voice Isolation for background noise removal
 * - OpenAI Whisper for high-accuracy transcription
 * - Explicit content detection and categorization
 * - Real-time and batch processing modes
 */

import { audioProcessor, AudioFeatures, AudioMetrics } from "./realTimeAudioProcessor";

// Types for the enhanced pipeline
export interface VoiceIsolationResult {
  success: boolean;
  isolatedAudio?: Blob;
  error?: string;
  processingTime: number;
}

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  confidence?: number;
  language?: string;
  error?: string;
  processingTime: number;
}

export interface ContentAnalysisResult {
  isExplicit: boolean;
  explicitScore: number; // 0-1 confidence
  contentType: "music" | "speech" | "conversation" | "lyrics" | "unknown";
  categories: string[];
  sentiment: "positive" | "negative" | "neutral";
  sentimentScore: number; // -1 to 1
  keywords: string[];
  containsLyrics: boolean;
  lyricsConfidence: number;
}

export interface EnhancedProcessingResult {
  voiceIsolation: VoiceIsolationResult;
  transcription: TranscriptionResult;
  contentAnalysis: ContentAnalysisResult;
  audioQuality: {
    originalMetrics: AudioMetrics;
    isolatedMetrics?: AudioMetrics;
  };
  totalProcessingTime: number;
}

export interface ProcessingConfig {
  enableVoiceIsolation: boolean;
  enableRealTimeTranscription: boolean;
  enableContentAnalysis: boolean;
  transcriptionModel: "whisper-1" | "gpt-4o-transcribe" | "gpt-4o-mini-transcribe";
  voiceIsolationQuality: "standard" | "high";
  contentModerationLevel: "strict" | "moderate" | "lenient";
  realTimeCallbacks?: {
    onVoiceIsolated?: (result: VoiceIsolationResult) => void;
    onTranscriptionChunk?: (chunk: string, isFinal: boolean) => void;
    onContentAnalysis?: (analysis: ContentAnalysisResult) => void;
  };
}

export class EnhancedAudioProcessor {
  private config: ProcessingConfig;
  private isProcessing = false;
  private processingStartTime = 0;

  // API keys from environment
  private readonly elevenLabsApiKey =
    process.env.ELEVENLABS_API_KEY || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  private readonly openAiApiKey =
    process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  // Processing statistics
  private stats = {
    totalProcessed: 0,
    averageProcessingTime: 0,
    successRate: 0,
    explicitContentDetected: 0,
  };

  constructor(config: Partial<ProcessingConfig> = {}) {
    this.config = {
      enableVoiceIsolation: true,
      enableRealTimeTranscription: true,
      enableContentAnalysis: true,
      transcriptionModel: "gpt-4o-transcribe",
      voiceIsolationQuality: "high",
      contentModerationLevel: "moderate",
      ...config,
    };

    if (!this.elevenLabsApiKey) {
      console.warn("⚠️ ElevenLabs API key not found - voice isolation will be disabled");
      this.config.enableVoiceIsolation = false;
    }

    if (!this.openAiApiKey) {
      console.warn("⚠️ OpenAI API key not found - transcription will be disabled");
      this.config.enableRealTimeTranscription = false;
    }

    console.log("🎵 Enhanced Audio Processor initialized");
    console.log(`   Voice Isolation: ${this.config.enableVoiceIsolation ? "✅" : "❌"}`);
    console.log(`   Transcription: ${this.config.enableRealTimeTranscription ? "✅" : "❌"}`);
    console.log(`   Content Analysis: ${this.config.enableContentAnalysis ? "✅" : "❌"}`);
    console.log(`   Model: ${this.config.transcriptionModel}`);
  }

  /**
   * Process audio through the complete pipeline
   */
  async processAudio(audioData: Blob | ArrayBuffer): Promise<EnhancedProcessingResult> {
    this.processingStartTime = performance.now();
    this.isProcessing = true;

    console.log("🎤 Starting enhanced audio processing pipeline...");

    try {
      // Convert input to Blob if needed
      const audioBlob =
        audioData instanceof Blob ? audioData : new Blob([audioData], { type: "audio/webm" });

      // Get original audio quality metrics
      const originalMetrics = await this.getAudioMetrics(audioBlob);

      // Step 1: Voice Isolation (ElevenLabs)
      let voiceIsolationResult: VoiceIsolationResult;
      let processedAudio = audioBlob;

      if (this.config.enableVoiceIsolation) {
        console.log("🔊 Applying voice isolation...");
        voiceIsolationResult = await this.isolateVoice(audioBlob);
        if (voiceIsolationResult.success && voiceIsolationResult.isolatedAudio) {
          processedAudio = voiceIsolationResult.isolatedAudio;
        }
      } else {
        voiceIsolationResult = {
          success: false,
          error: "Voice isolation disabled",
          processingTime: 0,
        };
      }

      // Step 2: Speech-to-Text Transcription (OpenAI Whisper)
      let transcriptionResult: TranscriptionResult;

      if (this.config.enableRealTimeTranscription) {
        console.log("📝 Transcribing audio...");
        transcriptionResult = await this.transcribeAudio(processedAudio);
      } else {
        transcriptionResult = {
          success: false,
          error: "Transcription disabled",
          processingTime: 0,
        };
      }

      // Step 3: Content Analysis
      let contentAnalysis: ContentAnalysisResult;

      if (
        this.config.enableContentAnalysis &&
        transcriptionResult.success &&
        transcriptionResult.text
      ) {
        console.log("🔍 Analyzing content...");
        contentAnalysis = await this.analyzeContent(transcriptionResult.text);
      } else {
        contentAnalysis = this.getDefaultContentAnalysis();
      }

      // Get processed audio quality metrics
      const isolatedMetrics = voiceIsolationResult.success
        ? await this.getAudioMetrics(processedAudio)
        : undefined;

      const totalTime = performance.now() - this.processingStartTime;

      const result: EnhancedProcessingResult = {
        voiceIsolation: voiceIsolationResult,
        transcription: transcriptionResult,
        contentAnalysis,
        audioQuality: {
          originalMetrics,
          isolatedMetrics,
        },
        totalProcessingTime: totalTime,
      };

      // Update statistics
      this.updateStats(result);

      // Trigger callbacks
      this.triggerCallbacks(result);

      console.log(`✅ Enhanced audio processing completed in ${totalTime.toFixed(0)}ms`);
      console.log(`   Explicit content: ${contentAnalysis.isExplicit ? "⚠️ Yes" : "✅ No"}`);
      console.log(`   Content type: ${contentAnalysis.contentType}`);

      return result;
    } catch (error) {
      console.error("❌ Enhanced audio processing failed:", error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * ElevenLabs Voice Isolation
   */
  private async isolateVoice(audioBlob: Blob): Promise<VoiceIsolationResult> {
    const startTime = performance.now();

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);

      // Set audio format for better processing
      if (this.config.voiceIsolationQuality === "high") {
        formData.append("file_format", "pcm_s16le_16");
      }

      const response = await fetch("https://api.elevenlabs.io/v1/audio-isolation", {
        method: "POST",
        headers: {
          "xi-api-key": this.elevenLabsApiKey!,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const isolatedAudioBlob = await response.blob();
      const processingTime = performance.now() - startTime;

      console.log(`🔊 Voice isolation completed in ${processingTime.toFixed(0)}ms`);
      console.log(`   Original size: ${(audioBlob.size / 1024).toFixed(1)}KB`);
      console.log(`   Isolated size: ${(isolatedAudioBlob.size / 1024).toFixed(1)}KB`);

      return {
        success: true,
        isolatedAudio: isolatedAudioBlob,
        processingTime,
      };
    } catch (error: any) {
      const processingTime = performance.now() - startTime;
      console.error("❌ Voice isolation failed:", error);

      return {
        success: false,
        error: error.message,
        processingTime,
      };
    }
  }

  /**
   * OpenAI Whisper Transcription
   */
  private async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    const startTime = performance.now();

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      formData.append("model", this.config.transcriptionModel);
      formData.append("response_format", "verbose_json");
      formData.append("language", "en"); // Can be made configurable

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.openAiApiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const processingTime = performance.now() - startTime;

      console.log(`📝 Transcription completed in ${processingTime.toFixed(0)}ms`);
      console.log(`   Text length: ${result.text.length} characters`);
      console.log(`   Language: ${result.language || "unknown"}`);

      return {
        success: true,
        text: result.text,
        confidence: result.confidence,
        language: result.language,
        processingTime,
      };
    } catch (error: any) {
      const processingTime = performance.now() - startTime;
      console.error("❌ Transcription failed:", error);

      return {
        success: false,
        error: error.message,
        processingTime,
      };
    }
  }

  /**
   * Content Analysis and Categorization using Enhanced Explicit Content Detector
   */
  private async analyzeContent(text: string): Promise<ContentAnalysisResult> {
    try {
      // Import explicit content detector
      const { explicitContentDetector } = await import("./explicitContentDetector");

      // Enhanced explicit content detection with industry-standard libraries
      const explicitResult = await explicitContentDetector.detectExplicitContent(text);

      // Content type classification
      const contentType = this.classifyContentType(text);

      // Lyrics detection
      const lyricsAnalysis = this.detectLyrics(text);

      // Sentiment analysis
      const sentimentAnalysis = this.analyzeSentiment(text);

      // Extract keywords
      const keywords = this.extractKeywords(text);

      return {
        isExplicit: explicitResult.isExplicit,
        explicitScore: explicitResult.confidence,
        contentType,
        categories: this.categorizeContent(text, contentType),
        sentiment: sentimentAnalysis.sentiment,
        sentimentScore: sentimentAnalysis.score,
        keywords,
        containsLyrics: lyricsAnalysis.containsLyrics,
        lyricsConfidence: lyricsAnalysis.confidence,
      };
    } catch (error) {
      console.error("❌ Content analysis failed:", error);
      // Fallback to basic detection if enhanced detector fails
      const explicitAnalysis = this.detectExplicitContent(text);
      const contentType = this.classifyContentType(text);
      const lyricsAnalysis = this.detectLyrics(text);
      const sentimentAnalysis = this.analyzeSentiment(text);
      const keywords = this.extractKeywords(text);

      return {
        isExplicit: explicitAnalysis.isExplicit,
        explicitScore: explicitAnalysis.score,
        contentType,
        categories: this.categorizeContent(text, contentType),
        sentiment: sentimentAnalysis.sentiment,
        sentimentScore: sentimentAnalysis.score,
        keywords,
        containsLyrics: lyricsAnalysis.containsLyrics,
        lyricsConfidence: lyricsAnalysis.confidence,
      };
    }
  }

  /**
   * Explicit content detection using keyword analysis and patterns
   */
  private detectExplicitContent(text: string): { isExplicit: boolean; score: number } {
    // Basic explicit content detection
    // In production, you might want to use a more sophisticated service

    const explicitKeywords = [
      // Add your explicit keywords here - being careful about false positives
      "explicit",
      "nsfw",
      "adult",
      "inappropriate",
    ];

    const lowerText = text.toLowerCase();
    let explicitMatches = 0;

    for (const keyword of explicitKeywords) {
      if (lowerText.includes(keyword)) {
        explicitMatches++;
      }
    }

    // Check for excessive profanity patterns
    const profanityPatterns = [
      /f\*+k|f\.\.\.|f---/gi,
      /s\*+t|s\.\.\.|s---/gi,
      // Add more patterns as needed
    ];

    let profanityMatches = 0;
    for (const pattern of profanityPatterns) {
      const matches = text.match(pattern);
      if (matches) profanityMatches += matches.length;
    }

    const totalWords = text.split(/\s+/).length;
    const explicitScore = Math.min(
      (explicitMatches + profanityMatches) / Math.max(totalWords, 1),
      1
    );

    // Adjust threshold based on moderation level
    const thresholds = {
      strict: 0.01,
      moderate: 0.05,
      lenient: 0.1,
    };

    const threshold = thresholds[this.config.contentModerationLevel];

    return {
      isExplicit: explicitScore > threshold,
      score: explicitScore,
    };
  }

  /**
   * Content type classification
   */
  private classifyContentType(text: string): ContentAnalysisResult["contentType"] {
    const lowerText = text.toLowerCase();

    // Lyrics indicators
    const lyricsIndicators = [
      /verse|chorus|bridge|hook/i,
      /\[verse|\[chorus|\[bridge|\[outro|\[intro/i,
      /repeat|x2|x3|x4/i,
      /oh+|ah+|yeah+|na na|la la/i,
    ];

    // Music indicators
    const musicIndicators = [
      /song|track|album|artist|band/i,
      /music|melody|rhythm|beat/i,
      /singing|vocalist|instrumental/i,
    ];

    // Conversation indicators
    const conversationIndicators = [
      /hello|hi|hey|goodbye|bye/i,
      /how are you|what's up|see you/i,
      /thank you|thanks|please|sorry/i,
    ];

    // Check patterns
    if (lyricsIndicators.some((pattern) => pattern.test(text))) {
      return "lyrics";
    }

    if (musicIndicators.some((pattern) => pattern.test(text))) {
      return "music";
    }

    if (conversationIndicators.some((pattern) => pattern.test(text))) {
      return "conversation";
    }

    // Default to speech for other content
    return text.length > 50 ? "speech" : "unknown";
  }

  /**
   * Lyrics detection with confidence scoring
   */
  private detectLyrics(text: string): { containsLyrics: boolean; confidence: number } {
    const lyricsPatterns = [
      /\[verse\]|\[chorus\]|\[bridge\]|\[outro\]|\[intro\]/gi,
      /verse \d+|chorus \d+/gi,
      /(oh|ah|yeah|na na|la la) (oh|ah|yeah|na na|la la)/gi,
      /repeat x\d+/gi,
    ];

    let matches = 0;
    for (const pattern of lyricsPatterns) {
      const found = text.match(pattern);
      if (found) matches += found.length;
    }

    // Check for repetitive patterns common in lyrics
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts = new Map<string, number>();

    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }

    // Look for repeated phrases
    let repetitiveScore = 0;
    for (const [word, count] of wordCounts.entries()) {
      if (count > 2 && word.length > 2) {
        repetitiveScore += count / words.length;
      }
    }

    const confidence = Math.min(matches * 0.2 + repetitiveScore * 0.8, 1);

    return {
      containsLyrics: confidence > 0.3,
      confidence,
    };
  }

  /**
   * Simple sentiment analysis
   */
  private analyzeSentiment(text: string): {
    sentiment: ContentAnalysisResult["sentiment"];
    score: number;
  } {
    // Simple sentiment analysis - in production, you might want to use a dedicated service
    const positiveWords = [
      "good",
      "great",
      "awesome",
      "excellent",
      "wonderful",
      "amazing",
      "love",
      "happy",
      "joy",
    ];
    const negativeWords = [
      "bad",
      "terrible",
      "awful",
      "horrible",
      "hate",
      "angry",
      "sad",
      "frustrated",
      "annoyed",
    ];

    const lowerText = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (lowerText.includes(word)) positiveCount++;
    }

    for (const word of negativeWords) {
      if (lowerText.includes(word)) negativeCount++;
    }

    const totalSentimentWords = positiveCount + negativeCount;
    if (totalSentimentWords === 0) {
      return { sentiment: "neutral", score: 0 };
    }

    const score = (positiveCount - negativeCount) / totalSentimentWords;

    if (score > 0.2) return { sentiment: "positive", score };
    if (score < -0.2) return { sentiment: "negative", score };
    return { sentiment: "neutral", score };
  }

  /**
   * Extract relevant keywords
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - remove common stop words
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
      "of",
      "with",
      "by",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "should",
      "could",
      "can",
      "may",
      "might",
      "must",
      "shall",
    ]);

    return text
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))
      .slice(0, 10); // Top 10 keywords
  }

  /**
   * Categorize content based on type and analysis
   */
  private categorizeContent(
    text: string,
    contentType: ContentAnalysisResult["contentType"]
  ): string[] {
    const categories: string[] = [contentType];

    const lowerText = text.toLowerCase();

    // Add genre-based categories
    if (lowerText.includes("music") || lowerText.includes("song")) {
      categories.push("musical");
    }

    if (lowerText.includes("conversation") || lowerText.includes("interview")) {
      categories.push("conversational");
    }

    if (lowerText.includes("story") || lowerText.includes("narrative")) {
      categories.push("storytelling");
    }

    if (lowerText.includes("news") || lowerText.includes("report")) {
      categories.push("informational");
    }

    return [...new Set(categories)]; // Remove duplicates
  }

  /**
   * Get audio quality metrics from blob
   */
  private async getAudioMetrics(audioBlob: Blob): Promise<AudioMetrics> {
    // This would require analyzing the audio blob
    // For now, return default metrics
    // In a full implementation, you'd decode the audio and analyze it

    return {
      peakLevel: 0.8,
      averageLevel: 0.4,
      signalToNoiseRatio: 15,
      clippingDetected: false,
      frequencyPeaks: [440, 880, 1760],
      dominantFrequency: 440,
      vadConfidence: 0.9,
      audioQuality: 85,
    };
  }

  /**
   * Default content analysis for error cases
   */
  private getDefaultContentAnalysis(): ContentAnalysisResult {
    return {
      isExplicit: false,
      explicitScore: 0,
      contentType: "unknown",
      categories: ["unknown"],
      sentiment: "neutral",
      sentimentScore: 0,
      keywords: [],
      containsLyrics: false,
      lyricsConfidence: 0,
    };
  }

  /**
   * Update processing statistics
   */
  private updateStats(result: EnhancedProcessingResult): void {
    this.stats.totalProcessed++;

    const wasSuccessful = result.transcription.success && result.voiceIsolation.success;
    this.stats.successRate =
      (this.stats.successRate * (this.stats.totalProcessed - 1) + (wasSuccessful ? 1 : 0)) /
      this.stats.totalProcessed;

    this.stats.averageProcessingTime =
      (this.stats.averageProcessingTime * (this.stats.totalProcessed - 1) +
        result.totalProcessingTime) /
      this.stats.totalProcessed;

    if (result.contentAnalysis.isExplicit) {
      this.stats.explicitContentDetected++;
    }
  }

  /**
   * Trigger configured callbacks
   */
  private triggerCallbacks(result: EnhancedProcessingResult): void {
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
   * Get processing statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ProcessingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("🔧 Enhanced audio processor configuration updated");
  }

  /**
   * Check if processor is currently processing
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
      averageProcessingTime: 0,
      successRate: 0,
      explicitContentDetected: 0,
    };
  }
}

// Export singleton instance
export const enhancedAudioProcessor = new EnhancedAudioProcessor();

export default enhancedAudioProcessor;
