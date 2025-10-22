"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  enhancedAudioProcessor,
  EnhancedProcessingResult,
  ProcessingConfig,
  ContentAnalysisResult,
} from "../services/enhancedAudioProcessor";
import { audioProcessor } from "../services/realTimeAudioProcessor";

interface UseEnhancedAudioProcessingOptions {
  onTranscriptionComplete?: (result: EnhancedProcessingResult) => void;
  onExplicitContentDetected?: (analysis: ContentAnalysisResult) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onEnd?: () => void;
  processingConfig?: Partial<ProcessingConfig>;
  autoStop?: boolean; // Stop recording after silence detection
  maxRecordingDuration?: number; // Maximum recording time in ms
}

export function useEnhancedAudioProcessing(options: UseEnhancedAudioProcessingOptions = {}) {
  // State management
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [lastResult, setLastResult] = useState<EnhancedProcessingResult | null>(null);
  const [explicitContentWarning, setExplicitContentWarning] = useState(false);
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysisResult | null>(null);

  // Recording management
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Configuration
  const processingConfig: ProcessingConfig = {
    enableVoiceIsolation: true,
    enableRealTimeTranscription: true,
    enableContentAnalysis: true,
    transcriptionModel: "gpt-4o-transcribe",
    voiceIsolationQuality: "high",
    contentModerationLevel: "moderate",
    realTimeCallbacks: {
      onVoiceIsolated: (result) => {
        console.log("🔊 Voice isolation completed:", result);
      },
      onTranscriptionChunk: (chunk, isFinal) => {
        if (isFinal) {
          setCurrentTranscript(chunk);
        }
      },
      onContentAnalysis: (analysis) => {
        setContentAnalysis(analysis);
        setExplicitContentWarning(analysis.isExplicit);

        if (analysis.isExplicit) {
          options.onExplicitContentDetected?.(analysis);
        }
      },
    },
    ...options.processingConfig,
  };

  // Update processor configuration
  useEffect(() => {
    enhancedAudioProcessor.updateConfig(processingConfig);
  }, []);

  /**
   * Start enhanced audio recording and processing
   */
  const startRecording = useCallback(async () => {
    if (isRecording) {
      console.warn("Recording already in progress");
      return;
    }

    try {
      console.log("🎤 Starting enhanced audio recording...");

      // Initialize real-time audio processor for live monitoring
      await audioProcessor.initialize({
        sampleRate: 44100,
        fftSize: 2048,
        enableVAD: true,
        enableFeatureExtraction: true,
      });

      // Start real-time processing for voice activity detection
      audioProcessor.startProcessing(
        (features) => {
          // Handle voice activity for auto-stop functionality
          if (options.autoStop && !features.voiceActivity && isRecording) {
            if (!silenceTimeoutRef.current) {
              silenceTimeoutRef.current = setTimeout(() => {
                console.log("🔇 Auto-stopping due to silence");
                stopRecording();
              }, 3000); // Stop after 3 seconds of silence
            }
          } else if (features.voiceActivity && silenceTimeoutRef.current) {
            // Cancel auto-stop if voice is detected again
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
          }
        },
        (metrics) => {
          // Log audio quality metrics
          if (metrics.audioQuality < 50) {
            console.warn("⚠️ Low audio quality detected:", metrics.audioQuality);
          }
        }
      );

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: false, // We'll use ElevenLabs for this
          autoGainControl: true,
        },
      });

      // Set up MediaRecorder for capturing audio data
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus", // High-quality format
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("🛑 Recording stopped, processing audio...");
        setIsRecording(false);
        setIsProcessing(true);

        try {
          // Create audio blob from recorded chunks
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm;codecs=opus",
          });

          console.log(`📁 Audio recorded: ${(audioBlob.size / 1024).toFixed(1)}KB`);

          // Process through enhanced pipeline
          const result = await enhancedAudioProcessor.processAudio(audioBlob);

          setLastResult(result);
          setCurrentTranscript(result.transcription.text || "");

          // Trigger completion callback
          options.onTranscriptionComplete?.(result);

          console.log("✅ Enhanced audio processing completed");
          console.log(`   Transcription: "${result.transcription.text}"`);
          console.log(`   Explicit: ${result.contentAnalysis.isExplicit ? "Yes" : "No"}`);
          console.log(`   Content Type: ${result.contentAnalysis.contentType}`);
        } catch (error) {
          console.error("❌ Enhanced audio processing failed:", error);
          options.onError?.(error as Error);
        } finally {
          setIsProcessing(false);
          options.onEnd?.();

          // Cleanup
          stream.getTracks().forEach((track) => track.stop());
          audioProcessor.stopProcessing();
        }
      };

      mediaRecorder.start(1000); // Capture in 1-second chunks
      setIsRecording(true);
      options.onStart?.();

      // Auto-stop after max duration
      if (options.maxRecordingDuration) {
        setTimeout(() => {
          if (isRecording) {
            console.log(`⏰ Auto-stopping after ${options.maxRecordingDuration}ms`);
            stopRecording();
          }
        }, options.maxRecordingDuration);
      }

      console.log("✅ Enhanced audio recording started");
    } catch (error) {
      console.error("❌ Failed to start enhanced audio recording:", error);
      setIsRecording(false);
      setIsProcessing(false);
      options.onError?.(error as Error);
    }
  }, [isRecording, options]);

  /**
   * Stop audio recording and trigger processing
   */
  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) {
      console.warn("No recording in progress");
      return;
    }

    console.log("🛑 Stopping enhanced audio recording...");

    // Clear any silence timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    // Stop recording
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
  }, [isRecording]);

  /**
   * Toggle recording on/off
   */
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  /**
   * Clear all transcription results
   */
  const clearResults = useCallback(() => {
    setCurrentTranscript("");
    setLastResult(null);
    setContentAnalysis(null);
    setExplicitContentWarning(false);
  }, []);

  /**
   * Process an existing audio file through the enhanced pipeline
   */
  const processAudioFile = useCallback(
    async (audioFile: File): Promise<EnhancedProcessingResult> => {
      if (isProcessing) {
        throw new Error("Another processing operation is already in progress");
      }

      setIsProcessing(true);

      try {
        console.log(
          `📁 Processing audio file: ${audioFile.name} (${(audioFile.size / 1024).toFixed(1)}KB)`
        );

        const result = await enhancedAudioProcessor.processAudio(audioFile);

        setLastResult(result);
        setCurrentTranscript(result.transcription.text || "");
        setContentAnalysis(result.contentAnalysis);
        setExplicitContentWarning(result.contentAnalysis.isExplicit);

        if (result.contentAnalysis.isExplicit) {
          options.onExplicitContentDetected?.(result.contentAnalysis);
        }

        options.onTranscriptionComplete?.(result);

        return result;
      } catch (error) {
        console.error("❌ Audio file processing failed:", error);
        options.onError?.(error as Error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, options]
  );

  /**
   * Get current processing statistics
   */
  const getProcessingStats = useCallback(() => {
    return enhancedAudioProcessor.getStats();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      audioProcessor.cleanup();
    };
  }, []);

  return {
    // State
    isRecording,
    isProcessing,
    currentTranscript,
    lastResult,
    explicitContentWarning,
    contentAnalysis,

    // Actions
    startRecording,
    stopRecording,
    toggleRecording,
    clearResults,
    processAudioFile,
    getProcessingStats,

    // Computed values
    recordingDuration: isRecording ? Date.now() - recordingStartTimeRef.current : 0,
    hasTranscript: !!currentTranscript,
    hasExplicitContent: explicitContentWarning,
    processingCapabilities: {
      voiceIsolation: processingConfig.enableVoiceIsolation,
      transcription: processingConfig.enableRealTimeTranscription,
      contentAnalysis: processingConfig.enableContentAnalysis,
    },
  };
}
