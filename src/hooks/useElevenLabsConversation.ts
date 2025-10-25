"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";
import { RealTimeAudioProcessor } from "../services/realTimeAudioProcessor";
import type { AudioFeatures, AudioMetrics } from "../services/realTimeAudioProcessor";

/**
 * Conversation State Machine States
 */
export type ConversationState =
  | "idle" // No one speaking
  | "user-speaking" // User actively speaking
  | "ai-speaking" // AI generating/playing response
  | "transitioning" // Brief state between turns
  | "interrupted"; // User interrupted AI mid-response

/**
 * Conversation Status
 */
export type ConversationStatus = "disconnected" | "connecting" | "connected" | "error";

/**
 * Conversation Configuration
 */
export interface ConversationConfig {
  agentId: string;
  mode?: "push-to-talk" | "voice-activated";
  vadSensitivity?: number; // 0-1, default 0.5
  interruptThreshold?: number; // Audio level threshold for interrupt, default 0.02
  autoReconnect?: boolean;
}

/**
 * Hook return type
 */
export interface UseElevenLabsConversationReturn {
  // Connection state
  status: ConversationStatus;
  isConnected: boolean;

  // Conversation control
  startConversation: (config: ConversationConfig) => Promise<void>;
  stopConversation: () => Promise<void>;
  pauseConversation: () => void;
  resumeConversation: () => void;
  toggleConversation: () => Promise<void>;

  // Turn-taking
  conversationState: ConversationState;
  interruptAgent: () => void;

  // Transcription
  userTranscript: string;
  aiTranscript: string;

  // Audio monitoring
  userAudioLevel: number;
  aiAudioLevel: number;
  isUserSpeaking: boolean;
  isAISpeaking: boolean;

  // Error handling
  error: Error | null;
  reconnect: () => Promise<void>;

  // Audio features for visualization
  audioFeatures: AudioFeatures | null;
  audioMetrics: AudioMetrics | null;
}

/**
 * Custom hook for ElevenLabs Conversational AI with interrupt handling and turn-taking
 *
 * This hook wraps the official @elevenlabs/react SDK and adds:
 * - Interrupt detection using Voice Activity Detection (VAD)
 * - Turn-taking state machine
 * - Audio level monitoring
 * - Automatic reconnection
 */
export function useElevenLabsConversation(): UseElevenLabsConversationReturn {
  // State
  const [status, setStatus] = useState<ConversationStatus>("disconnected");
  const [conversationState, setConversationState] = useState<ConversationState>("idle");
  const [userTranscript, setUserTranscript] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");
  const [userAudioLevel, setUserAudioLevel] = useState(0);
  const [aiAudioLevel, setAiAudioLevel] = useState(0);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures | null>(null);
  const [audioMetrics, setAudioMetrics] = useState<AudioMetrics | null>(null);
  const [micMuted, setMicMuted] = useState(false); // CRITICAL: Control mic mute state

  // Refs
  const audioProcessorRef = useRef<RealTimeAudioProcessor | null>(null);
  const configRef = useRef<ConversationConfig | null>(null);
  const conversationTokenRef = useRef<string | null>(null);
  const isInterruptingRef = useRef(false);
  const volumeCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize official ElevenLabs hook
  // CRITICAL: Use controlled micMuted state to ensure microphone is active
  const conversation = useConversation({
    micMuted, // Controlled microphone state
    onConnect: async () => {
      console.log("🔗 ElevenLabs: Connected to conversation");
      setStatus("connected");
      setError(null);

      // Explicitly unmute microphone after connection
      console.log("🎤 Unmuting microphone...");
      setMicMuted(false);
      console.log("✅ Microphone should now be active");
    },
    onDisconnect: () => {
      console.log("🔌 ElevenLabs: Disconnected from conversation");

      // CRITICAL: Stop volume monitoring immediately to prevent "WebSocket CLOSING" errors
      if (volumeCheckIntervalRef.current) {
        clearInterval(volumeCheckIntervalRef.current);
        volumeCheckIntervalRef.current = null;
        console.log("⏹️ Volume monitoring stopped");
      }

      // Log disconnect details for debugging
      try {
        // @ts-ignore - Accessing internal WebSocket for debugging
        if (conversation?.connection) {
          console.log("🔍 Disconnect details:", {
            readyState: conversation.connection.readyState,
            // @ts-ignore
            closeCode: conversation.connection.closeCode,
            // @ts-ignore
            closeReason: conversation.connection.closeReason,
          });
        }
      } catch (e) {
        console.log("⚠️ Could not access disconnect details");
      }

      setStatus("disconnected");
      setConversationState("idle");

      // Auto-reconnect if enabled
      if (configRef.current?.autoReconnect) {
        console.log("🔄 Auto-reconnecting...");
        setTimeout(() => reconnect(), 2000);
      }
    },
    onError: (err) => {
      console.error("❌ ElevenLabs: Conversation error:", err);
      setError(err);
      setStatus("error");
    },
    onMessage: (message) => {
      console.log("📨 WebSocket message received:", JSON.stringify(message, null, 2));
      handleWebSocketMessage(message);
    },
  });

  /**
   * Monitor input volume periodically
   * CRITICAL: Only poll if connection is active to avoid "WebSocket already CLOSING" errors
   */
  useEffect(() => {
    if (status !== "connected") return;

    const volumeCheckInterval = setInterval(() => {
      // Check if still connected before polling volume
      if (status !== "connected") {
        console.log("⚠️ Skipping volume check - connection not active");
        return;
      }

      try {
        const inputVol = conversation.getInputVolume?.() ?? 0;
        const outputVol = conversation.getOutputVolume?.() ?? 0;
        console.log(`🎤 Audio levels - Input: ${(inputVol * 100).toFixed(1)}%, Output: ${(outputVol * 100).toFixed(1)}%`);

        // Store volumes for display
        setUserAudioLevel(inputVol);
        setAiAudioLevel(outputVol);
      } catch (error) {
        console.error("❌ Error getting volume levels:", error);
        // Stop polling on error
        clearInterval(volumeCheckInterval);
        volumeCheckIntervalRef.current = null;
      }
    }, 500);

    // Store interval ID in ref so onDisconnect can clear it
    volumeCheckIntervalRef.current = volumeCheckInterval;

    return () => {
      clearInterval(volumeCheckInterval);
      volumeCheckIntervalRef.current = null;
    };
  }, [status, conversation]);

  /**
   * Handle WebSocket messages from ElevenLabs
   */
  const handleWebSocketMessage = useCallback((message: any) => {
    console.log("📝 ElevenLabs message:", {
      type: message.type,
      hasContent: !!message.message || !!message.content || !!message.text,
    });

    switch (message.type) {
      case "user_transcript":
      case "user_transcript_partial":
        // User transcription
        const userText = message.message || message.content || message.text || "";
        if (userText) {
          console.log("🎤 User transcript:", userText);
          setUserTranscript(userText);
          setConversationState("user-speaking");
        }
        break;

      case "agent_response":
      case "agent_response_partial":
        // AI response
        const aiText = message.message || message.content || message.text || "";
        if (aiText) {
          console.log("🤖 AI response:", aiText);
          setAiTranscript(aiText);
          setConversationState("ai-speaking");
          setIsAISpeaking(true);
        }
        break;

      case "audio":
        // AI audio chunk
        console.log("🔊 AI audio chunk received");
        setIsAISpeaking(true);
        setConversationState("ai-speaking");
        // Note: Audio playback is handled by the ElevenLabs SDK
        break;

      case "conversation_initiation_metadata":
        console.log("📋 Conversation metadata:", message);
        break;

      case "agent_response_complete":
        // AI finished speaking
        console.log("✅ AI finished speaking");
        setIsAISpeaking(false);
        setConversationState("idle");
        break;

      default:
        console.log("❓ Unknown message type:", message.type);
    }
  }, []);

  /**
   * Initialize audio processor for VAD
   * DISABLED: ElevenLabs SDK handles audio internally via WebRTC
   * Our custom processor conflicts with the SDK's audio capture
   */
  // useEffect(() => {
  //   if (!audioProcessorRef.current) {
  //     audioProcessorRef.current = new RealTimeAudioProcessor();
  //     audioProcessorRef.current.initialize({
  //       enableVAD: true,
  //       vadSensitivity: configRef.current?.vadSensitivity || 0.5,
  //     });
  //   }

  //   return () => {
  //     audioProcessorRef.current?.cleanup();
  //   };
  // }, []);

  /**
   * Monitor audio features for interrupt detection
   */
  const handleAudioFeatures = useCallback(
    (features: AudioFeatures) => {
      setAudioFeatures(features);
      setUserAudioLevel(features.rms);
      setIsUserSpeaking(features.voiceActivity);

      // Interrupt detection logic
      if (
        conversationState === "ai-speaking" &&
        features.voiceActivity &&
        features.rms > (configRef.current?.interruptThreshold || 0.02) &&
        !isInterruptingRef.current
      ) {
        console.log("🚨 Interrupt detected - user speaking over AI");
        console.log(`   RMS: ${features.rms.toFixed(4)}, VAD: ${features.voiceActivity}`);

        // Trigger interrupt
        isInterruptingRef.current = true;
        interruptAgent();

        // Reset interrupt flag after delay
        setTimeout(() => {
          isInterruptingRef.current = false;
        }, 1000);
      }
    },
    [conversationState]
  );

  /**
   * Handle audio metrics
   */
  const handleAudioMetrics = useCallback((metrics: AudioMetrics) => {
    setAudioMetrics(metrics);
  }, []);

  /**
   * Get WebRTC conversation token from server (secure)
   */
  const getConversationToken = async (agentId: string): Promise<string> => {
    console.log("🔐 Requesting WebRTC conversation token from server...");

    const response = await fetch("/api/elevenlabs/conversation-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agentId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get conversation token");
    }

    const data = await response.json();
    console.log("✅ WebRTC conversation token received");

    return data.conversationToken;
  };

  /**
   * Start conversation
   */
  const startConversation = useCallback(
    async (config: ConversationConfig) => {
      try {
        setStatus("connecting");
        setError(null);
        configRef.current = config;

        console.log("🚀 Starting ElevenLabs WebRTC conversation...", config);

        // Get WebRTC conversation token from server (secure)
        // The ElevenLabs SDK will handle microphone permissions via WebRTC
        const conversationToken = await getConversationToken(config.agentId);
        conversationTokenRef.current = conversationToken;

        // IMPORTANT: Don't start our custom audio processor
        // The ElevenLabs SDK handles audio capture internally via WebRTC
        // Starting our own processor creates conflicts and prevents the SDK from receiving audio
        // Our custom processor is only for additional VAD analysis if needed later

        // Start conversation with WebRTC token
        // FIXED: Use conversationToken (WebRTC) instead of signedUrl (WebSocket)
        // WebRTC provides better real-time audio streaming and microphone handling
        await conversation.startSession({
          conversationToken,
          connectionType: "webrtc", // Explicitly specify WebRTC mode
        } as any);

        console.log("✅ WebRTC conversation started successfully");
        setConversationState("idle");
      } catch (err) {
        console.error("❌ Failed to start conversation:", err);
        setError(err as Error);
        setStatus("error");
        throw err;
      }
    },
    [conversation, handleAudioFeatures, handleAudioMetrics]
  );

  /**
   * Stop conversation
   */
  const stopConversation = useCallback(async () => {
    try {
      console.log("🛑 Stopping conversation...");

      // Stop audio processor
      // audioProcessorRef.current?.stopProcessing(); // DISABLED: Not using custom processor

      // End conversation
      await conversation.endSession();

      setStatus("disconnected");
      setConversationState("idle");
      setUserTranscript("");
      setAiTranscript("");
      setIsUserSpeaking(false);
      setIsAISpeaking(false);

      console.log("✅ Conversation stopped");
    } catch (err) {
      console.error("❌ Failed to stop conversation:", err);
      setError(err as Error);
    }
  }, [conversation]);

  /**
   * Pause conversation
   * NOTE: Custom audio processor disabled - ElevenLabs SDK handles audio
   */
  const pauseConversation = useCallback(() => {
    console.log("⏸️ Pausing conversation...");
    // audioProcessorRef.current?.stopProcessing();
    // Note: ElevenLabs SDK doesn't have a native pause
  }, []);

  /**
   * Resume conversation
   * NOTE: Custom audio processor disabled - ElevenLabs SDK handles audio
   */
  const resumeConversation = useCallback(async () => {
    console.log("▶️ Resuming conversation...");
    // if (configRef.current?.mode === "voice-activated" && audioProcessorRef.current) {
    //   await audioProcessorRef.current.startProcessing(handleAudioFeatures, handleAudioMetrics);
    // }
  }, [handleAudioFeatures, handleAudioMetrics]);

  /**
   * Toggle conversation (start/stop)
   */
  const toggleConversation = useCallback(async () => {
    if (status === "connected") {
      await stopConversation();
    } else if (configRef.current) {
      await startConversation(configRef.current);
    } else {
      throw new Error("No configuration available");
    }
  }, [status, startConversation, stopConversation]);

  /**
   * Interrupt AI agent (user speaks over AI)
   */
  const interruptAgent = useCallback(() => {
    console.log("⚡ Interrupting AI agent...");

    // Update state
    setConversationState("interrupted");
    setIsAISpeaking(false);

    // Send interrupt signal to WebSocket (if supported by SDK)
    // Note: Check ElevenLabs SDK documentation for interrupt method
    if ((conversation as any).interrupt) {
      (conversation as any).interrupt();
    }

    // Transition to user-speaking state
    setTimeout(() => {
      setConversationState("user-speaking");
    }, 100);
  }, [conversation]);

  /**
   * Reconnect after disconnect
   */
  const reconnect = useCallback(async () => {
    if (configRef.current) {
      console.log("🔄 Reconnecting...");
      await startConversation(configRef.current);
    }
  }, [startConversation]);

  return {
    // Connection state
    status,
    isConnected: status === "connected",

    // Conversation control
    startConversation,
    stopConversation,
    pauseConversation,
    resumeConversation,
    toggleConversation,

    // Turn-taking
    conversationState,
    interruptAgent,

    // Transcription
    userTranscript,
    aiTranscript,

    // Audio monitoring
    userAudioLevel,
    aiAudioLevel,
    isUserSpeaking,
    isAISpeaking,

    // Error handling
    error,
    reconnect,

    // Audio features for visualization
    audioFeatures,
    audioMetrics,
  };
}
