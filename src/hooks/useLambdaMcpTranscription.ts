/**
 * Lambda MCP Transcription Hook
 * React hook for processing audio through Lambda MCP transcription pipeline
 */

import { useState, useCallback, useRef } from "react";

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  language?: string;
}

export interface ContentAnalysis {
  isExplicit: boolean;
  explicitScore: number;
  contentType: string;
  sentiment: string;
  keywords: string[];
}

export interface TranscriptionMetadata {
  processingMode: "lambda-mcp" | "local" | "hybrid";
  lambdaAttempted: boolean;
  lambdaSuccess: boolean;
  fallbackUsed: boolean;
  processingTime: number;
  metrics?: {
    lambdaLatency?: number;
    localLatency?: number;
    totalLatency: number;
    retryCount?: number;
  };
}

export interface UseLambdaMcpTranscriptionResult {
  // State
  isTranscribing: boolean;
  transcription: TranscriptionResult | null;
  contentAnalysis: ContentAnalysis | null;
  metadata: TranscriptionMetadata | null;
  error: string | null;

  // Actions
  transcribeAudio: (audioBlob: Blob) => Promise<void>;
  clearTranscription: () => void;
  cancelTranscription: () => void;

  // Health check
  checkHealth: () => Promise<{ healthy: boolean; stats: any }>;
}

export function useLambdaMcpTranscription(): UseLambdaMcpTranscriptionResult {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysis | null>(null);
  const [metadata, setMetadata] = useState<TranscriptionMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Transcribe audio through Lambda MCP pipeline
   */
  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setError(null);
    setTranscription(null);
    setContentAnalysis(null);
    setMetadata(null);

    try {
      console.log("🎤 Starting Lambda MCP transcription...");
      console.log(`   Audio size: ${(audioBlob.size / 1024).toFixed(1)}KB`);

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Prepare form data
      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.webm");
      formData.append(
        "options",
        JSON.stringify({
          enableVoiceIsolation: true,
          transcriptionModel: "gpt-4o-transcribe",
          language: "en",
        })
      );

      // Call Lambda MCP transcription API
      const response = await fetch("/api/lambda-mcp/transcribe", {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Transcription failed: ${response.status}`);
      }

      const result = await response.json();

      console.log("✅ Lambda MCP transcription completed");
      console.log(`   Mode: ${result.metadata.processingMode}`);
      console.log(`   Processing time: ${result.metadata.processingTime.toFixed(0)}ms`);

      // Update state with results
      setTranscription(result.transcription);
      setContentAnalysis(result.contentAnalysis);
      setMetadata(result.metadata);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("🛑 Transcription cancelled");
        setError("Transcription cancelled");
      } else {
        console.error("❌ Transcription error:", err);
        setError(err.message || "Transcription failed");
      }
    } finally {
      setIsTranscribing(false);
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Clear transcription results
   */
  const clearTranscription = useCallback(() => {
    setTranscription(null);
    setContentAnalysis(null);
    setMetadata(null);
    setError(null);
  }, []);

  /**
   * Cancel ongoing transcription
   */
  const cancelTranscription = useCallback(() => {
    if (abortControllerRef.current) {
      console.log("🛑 Cancelling transcription...");
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Check Lambda MCP health
   */
  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch("/api/lambda-mcp/transcribe");
      const data = await response.json();

      return {
        healthy: data.status === "healthy",
        stats: data.statistics,
        lambdaMcp: data.lambdaMcp,
      };
    } catch (error) {
      console.error("❌ Health check failed:", error);
      return {
        healthy: false,
        stats: null,
        error: error instanceof Error ? error.message : "Health check failed",
      };
    }
  }, []);

  return {
    isTranscribing,
    transcription,
    contentAnalysis,
    metadata,
    error,
    transcribeAudio,
    clearTranscription,
    cancelTranscription,
    checkHealth,
  };
}

export default useLambdaMcpTranscription;
