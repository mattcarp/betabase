import React, { useImperativeHandle, forwardRef, useEffect } from "react";
import { Mic, MicOff, Loader2, AlertCircle, Radio, Activity } from "lucide-react";
import AudioWaveform from "./AudioWaveform";
import { useElevenLabsConversation } from "../hooks/useElevenLabsConversation";
import type { ConversationState } from "../hooks/useElevenLabsConversation";
import { getElevenLabsAgentId } from "@/config/apiKeys";

interface ConversationalAIProps {
  agentId?: string;
  className?: string;
  onTranscriptionUpdate?: (transcription: string) => void;
  onConversationStateChange?: (state: ConversationState) => void;
  mode?: "push-to-talk" | "voice-activated";
  vadSensitivity?: number;
  interruptThreshold?: number;
}

interface ConversationalAIRef {
  startConversation: () => Promise<void>;
  stopConversation: () => Promise<void>;
  toggleConversation: () => Promise<void>;
  interruptAgent: () => void;
}

const ConversationalAI = forwardRef<ConversationalAIRef, ConversationalAIProps>(
  (
    {
      agentId,
      className = "",
      onTranscriptionUpdate,
      onConversationStateChange,
      mode = "voice-activated", // Changed from push-to-talk to voice-activated
      vadSensitivity = 0.5,
      interruptThreshold = 0.02,
    },
    ref
  ) => {
    // Get agent ID from props or config
    const effectiveAgentId = agentId || getElevenLabsAgentId();

    // Use the real ElevenLabs conversation hook
    const {
      status,
      isConnected,
      startConversation: startConv,
      stopConversation: stopConv,
      toggleConversation: _toggleConv,
      conversationState,
      interruptAgent,
      userTranscript,
      aiTranscript,
      userAudioLevel,
      aiAudioLevel,
      isUserSpeaking,
      isAISpeaking,
      error: conversationError,
      audioFeatures,
      audioMetrics,
    } = useElevenLabsConversation();

    // Notify parent of transcription updates
    useEffect(() => {
      if (userTranscript) {
        onTranscriptionUpdate?.(userTranscript);
      }
    }, [userTranscript, onTranscriptionUpdate]);

    // Notify parent of conversation state changes
    useEffect(() => {
      onConversationStateChange?.(conversationState);
    }, [conversationState, onConversationStateChange]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      startConversation: async () => {
        await startConv({
          agentId: effectiveAgentId,
          mode,
          vadSensitivity,
          interruptThreshold,
          autoReconnect: false, // Disabled to debug WebSocket disconnect issue
        });
      },
      stopConversation: async () => {
        await stopConv();
      },
      toggleConversation: async () => {
        if (isConnected) {
          await stopConv();
        } else {
          await startConv({
            agentId: effectiveAgentId,
            mode,
            vadSensitivity,
            interruptThreshold,
            autoReconnect: false, // Disabled to debug WebSocket disconnect issue
          });
        }
      },
      interruptAgent,
    }));

    // Handler for toggle button
    const handleToggle = async () => {
      if (isConnected) {
        await stopConv();
      } else {
        await startConv({
          agentId: effectiveAgentId,
          mode,
          vadSensitivity,
          interruptThreshold,
          autoReconnect: false, // Disabled to debug WebSocket disconnect issue
        });
      }
    };

    // Get conversation state display info
    const getStateInfo = (state: ConversationState) => {
      switch (state) {
        case "idle":
          return { text: "Idle", color: "text-gray-400", icon: null };
        case "user-speaking":
          return {
            text: "You're speaking",
            color: "text-blue-400",
            icon: <Mic className="w-4 h-4 animate-pulse" />,
          };
        case "ai-speaking":
          return {
            text: "AI speaking",
            color: "text-green-400",
            icon: <Radio className="w-4 h-4 animate-pulse" />,
          };
        case "transitioning":
          return {
            text: "Transitioning",
            color: "text-yellow-400",
            icon: <Activity className="w-4 h-4" />,
          };
        case "interrupted":
          return {
            text: "Interrupted",
            color: "text-orange-400",
            icon: <AlertCircle className="w-4 h-4" />,
          };
        default:
          return { text: "Unknown", color: "text-gray-400", icon: null };
      }
    };

    const stateInfo = getStateInfo(conversationState);
    const displayError = conversationError?.message || null;

    return (
      <div className={`conversational-ai-panel ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="mac-title text-lg font-semibold text-holographic">
            ElevenLabs Conversational AI
          </h3>
          <div className="flex items-center gap-2">
            {/* Connection status */}
            {isConnected && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
            {status === "connecting" && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
            {status === "error" && <AlertCircle className="w-4 h-4 text-red-400" />}
            <span className={`text-sm ${isConnected ? "text-green-400" : "text-gray-400"}`}>
              {status === "connecting"
                ? "Connecting..."
                : isConnected
                  ? "Connected"
                  : status === "error"
                    ? "Error"
                    : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Agent ID warning */}
        {!effectiveAgentId && (
          <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-500 rounded text-yellow-400 text-sm">
            Set NEXT_PUBLIC_ELEVENLABS_AGENT_ID environment variable to enable ElevenLabs
            integration
          </div>
        )}

        {/* Error display */}
        {displayError && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded text-red-400 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{displayError}</span>
            </div>
          </div>
        )}

        {/* Conversation state indicator */}
        {isConnected && (
          <div className="mb-4 p-4 bg-blue-900/10 border border-blue-500/30 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {stateInfo.icon}
                <span className={`text-sm font-medium ${stateInfo.color}`}>{stateInfo.text}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  <span>User: {(userAudioLevel * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span>AI: {(aiAudioLevel * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mode indicator and volume control */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Mode:</span>
            <span className="font-medium text-blue-400">
              {mode === "push-to-talk" ? "Push-to-Talk" : "Voice-Activated"}
            </span>
            {mode === "voice-activated" && (
              <span className="text-gray-500">(VAD: {(vadSensitivity * 100).toFixed(0)}%)</span>
            )}
          </div>

          {/* Volume Control */}
          {isConnected && (
            <div className="flex items-center gap-4">
              <label className="text-xs text-gray-400 min-w-[80px]">AI Volume:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                defaultValue="1"
                onChange={(e) => {
                  const volume = parseFloat(e.target.value);
                  console.log(`🔊 Setting AI volume to ${(volume * 100).toFixed(0)}%`);
                  (conversation as any).setVolume?.({ volume });
                }}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleToggle}
            disabled={status === "connecting" || !effectiveAgentId}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isConnected
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            } ${status === "connecting" || !effectiveAgentId ? "opacity-50 cursor-not-allowed" : ""}`}
            data-testid="toggle-conversation"
          >
            {status === "connecting" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isConnected ? (
              <MicOff size={20} />
            ) : (
              <Mic size={20} />
            )}
            {status === "connecting"
              ? "Connecting..."
              : isConnected
                ? "Stop Conversation"
                : "Start Conversation"}
          </button>

          {/* Interrupt button (only when AI is speaking) */}
          {isAISpeaking && (
            <button
              onClick={interruptAgent}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-all"
              data-testid="interrupt-button"
            >
              Interrupt
            </button>
          )}
        </div>

        {/* Transcription displays */}
        <div className="space-y-4">
          {/* User transcription */}
          <div className="transcription-display">
            <h4 className="mac-title text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Your Speech:
            </h4>
            <div className="p-4 bg-blue-900/10 border border-blue-500/30 rounded-lg min-h-[60px]">
              {userTranscript ? (
                <p className="text-white text-sm">{userTranscript}</p>
              ) : (
                <p className="text-gray-400 text-sm italic">
                  {isConnected && isUserSpeaking
                    ? "Listening..."
                    : isConnected
                      ? "Waiting for your input..."
                      : "Start conversation to begin"}
                </p>
              )}
            </div>
          </div>

          {/* AI transcription */}
          <div className="transcription-display">
            <h4 className="mac-title text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
              <Radio className="w-4 h-4" />
              AI Response:
            </h4>
            <div className="p-4 bg-green-900/10 border border-green-500/30 rounded-lg min-h-[60px]">
              {aiTranscript ? (
                <p className="text-white text-sm">{aiTranscript}</p>
              ) : (
                <p className="text-gray-400 text-sm italic">
                  {isConnected ? "AI will respond here..." : "No response yet"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Audio waveform visualization */}
        {isConnected && (
          <div className="mt-4">
            <AudioWaveform isRecording={isUserSpeaking || isAISpeaking} />
          </div>
        )}

        {/* Debug info (optional, can be hidden in production) */}
        {process.env.NODE_ENV === "development" && isConnected && (
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>Agent ID: {effectiveAgentId}</p>
            <p>State: {conversationState}</p>
            {audioFeatures && (
              <>
                <p>Voice Activity: {audioFeatures.voiceActivity ? "Yes" : "No"}</p>
                <p>SPL: {audioFeatures.spl.toFixed(1)} dB</p>
                <p>RMS: {audioFeatures.rms.toFixed(4)}</p>
              </>
            )}
            {audioMetrics && (
              <>
                <p>Quality Score: {audioMetrics.audioQuality.toFixed(0)}/100</p>
                <p>VAD Confidence: {(audioMetrics.vadConfidence * 100).toFixed(0)}%</p>
              </>
            )}
          </div>
        )}
      </div>
    );
  }
);

ConversationalAI.displayName = "ConversationalAI";

export default ConversationalAI;
