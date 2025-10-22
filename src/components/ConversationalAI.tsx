import React, { useState, useImperativeHandle, forwardRef, useRef, useEffect } from "react";
// import { useConversation } from "@elevenlabs/react"; // TODO: Add to package.json
const useConversation = () => ({
  status: { value: "idle" },
  start: () => {},
  stop: () => {},
  endSession: () => {},
}); // Mock for now
import { Mic, MicOff } from "lucide-react";
import { getAIInsights, getPipelineStatus } from "../services/bridge";
import { RealTimeAudioProcessor } from "../services/realTimeAudioProcessor";
import AudioWaveform from "./AudioWaveform";

interface ConversationalAIProps {
  agentId?: string;
  className?: string;
  onTranscriptionUpdate?: (transcription: string) => void;
  onConversationStateChange?: (state: any) => void;
}

interface ConversationalAIRef {
  startConversation: () => Promise<void>;
  stopConversation: () => Promise<void>;
  toggleConversation: () => Promise<void>;
  testTranscription: () => void;
}

const ConversationalAI = forwardRef<ConversationalAIRef, ConversationalAIProps>(
  (
    {
      agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "",
      className = "",
      onTranscriptionUpdate,
      onConversationStateChange,
    },
    ref
  ) => {
    const [currentTranscription, setCurrentTranscription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [transcription, setTranscription] = useState("");
    const [pipelineStatus, setPipelineStatus] = useState<any>(null);
    const [aiInsights, setAIInsights] = useState<any>(null);
    const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);
    const audioProcessorRef = useRef<RealTimeAudioProcessor | null>(null);

    const onFrequencyData = (data: Uint8Array) => {
      setFrequencyData(data);
    };

    // Initialize ElevenLabs conversation with proper event handlers for real-time transcription
    const conversation = useConversation();

    // Set up event handlers
    useEffect(() => {
      const handleConnect = () => {
        console.log("🔗 ElevenLabs: Connected to conversation");
        setIsConnected(true);
        setError(null);
      };

      const handleDisconnect = () => {
        console.log("🔌 ElevenLabs: Disconnected from conversation");
        setIsConnected(false);
        setIsLoading(false);
      };

      const handleMessage = (message: any) => {
        console.log("📝 ElevenLabs: Raw message received:", {
          type: message.type,
          message: message.message,
          content: message.content,
          text: message.text,
          fullMessage: message,
        });

        // Handle different message types according to ElevenLabs docs
        if (message.type === "user_transcript" || message.type === "user_transcript_partial") {
          // Real-time user transcription - this is what we want!
          const transcriptText = message.message || message.content || message.text || "";
          console.log("🎤 User transcript captured:", transcriptText);
          if (transcriptText) {
            console.log("🎯 Setting current transcription:", transcriptText);
            setCurrentTranscription(transcriptText);
            console.log("🎯 Calling onTranscriptionUpdate with:", transcriptText);
            onTranscriptionUpdate?.(transcriptText);
          }
        } else if (message.type === "agent_response" || message.type === "agent_response_partial") {
          // Agent response
          console.log("🤖 Agent response:", message.message || message.content || message.text);
        } else if (message.type === "conversation_initiation_metadata") {
          // Conversation metadata
          console.log("📋 Conversation metadata:", message);
        } else if (message.type === "audio") {
          // Audio data - don't log this as it's binary
          console.log("🔊 Audio data received (not logging binary data)");
        } else {
          // Log all other message types to understand what we're getting
          console.log("❓ Unknown message type:", message.type, "Full message:", message);

          // Fallback for any message with content that might be transcription
          if (message.message || message.content || message.text) {
            const content = message.message || message.content || message.text;
            console.log("💬 Fallback transcription capture:", content);
            setCurrentTranscription(content);
            onTranscriptionUpdate?.(content);
          }
        }
      };

      const handleError = (error: any) => {
        console.error("❌ ElevenLabs: Conversation error:", error);
        setError(error.message || "Conversation error occurred");
        setIsLoading(false);
      };

      // TODO: Set up event listeners when the conversation API supports it
      // For now, these handlers are ready for when the API is available
    }, [onTranscriptionUpdate]);

    // Start conversation
    const startConversation = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("🚀 Starting ElevenLabs conversation...");

        if (!agentId) {
          throw new Error("Agent ID is required");
        }

        conversation.start();
        console.log("✅ ElevenLabs conversation started successfully");
      } catch (err: any) {
        console.error("❌ Failed to start conversation:", err);
        setError(err.message || "Failed to start conversation");
        setIsLoading(false);
      }
    };

    // Stop conversation
    const stopConversation = async () => {
      try {
        console.log("🛑 Stopping ElevenLabs conversation...");
        conversation.stop();
        console.log("✅ ElevenLabs conversation stopped successfully");
      } catch (err: any) {
        console.error("❌ Failed to stop conversation:", err);
        setError(err.message || "Failed to stop conversation");
      } finally {
        setIsLoading(false);
      }
    };

    // Toggle conversation
    const toggleConversation = async () => {
      if (conversation.status.value === "connected") {
        await stopConversation();
      } else {
        await startConversation();
      }
    };

    // Test transcription function
    const testTranscription = () => {
      const testText = `Test transcription at ${new Date().toLocaleTimeString()}`;
      console.log("🧪 Test transcription:", testText);
      setCurrentTranscription(testText);
      onTranscriptionUpdate?.(testText);
    };

    useEffect(() => {
      // Web-only environment - no Electron IPC
      const ipcRenderer = null;
      // Initialize the audio processor
      if (!audioProcessorRef.current) {
        audioProcessorRef.current = new RealTimeAudioProcessor();
        audioProcessorRef.current.initialize();
      }

      const onTranscription = (text: string) => {
        setTranscription(text);
        // Web environment - no IPC communication needed
      };

      const onWaveformData = (data: Float32Array) => {
        // This is not used by AudioWaveform, but can be used for other visualizations
      };

      const onError = (err: string) => {
        setError(err);
      };

      const handleStartRecording = () => {
        handleToggleRecording();
      };

      const handleStopRecording = () => {
        if (isRecording) {
          handleToggleRecording();
        }
      };

      const handleGetTranscription = () => {
        // Web environment - transcription handled locally
      };

      const handleGetWaveformData = () => {
        // This would need to be implemented in the audio processor
      };

      // Web environment - no IPC event listeners needed

      // Fetch initial status and insights
      fetchStatusAndInsights();

      const interval = setInterval(fetchStatusAndInsights, 5000); // Poll every 5 seconds

      return () => {
        clearInterval(interval);
        audioProcessorRef.current?.stopProcessing();
        // Web environment - no IPC cleanup needed
      };
    }, [isRecording, transcription]);

    const fetchStatusAndInsights = async () => {
      // ... existing code ...
    };

    const handleToggleRecording = async () => {
      setError(null);
      if (isRecording) {
        audioProcessorRef.current?.stopProcessing();
        setIsRecording(false);
      } else {
        try {
          if (!audioProcessorRef.current) {
            audioProcessorRef.current = new RealTimeAudioProcessor();
            await audioProcessorRef.current.initialize();
          }
          await audioProcessorRef.current.startProcessing(
            (features) => {
              /* onAudioFeatures */
            },
            (metrics) => {
              /* onAudioMetrics */
            },
            onFrequencyData
          );
          setIsRecording(true);
        } catch (err: any) {
          setError(err.message || "Failed to start recording.");
          setIsRecording(false);
        }
      }
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      startConversation,
      stopConversation,
      toggleConversation,
      testTranscription,
    }));

    return (
      <div className={`conversational-ai-panel ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-holographic">ElevenLabs AI</h3>
          <div className="flex items-center gap-2">
            {isConnected && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
            <span className="text-sm text-blue-600">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        {!agentId && (
          <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500 rounded text-yellow-400 text-sm">
            Set NEXT_PUBLIC_ELEVENLABS_AGENT_ID environment variable to enable ElevenLabs
            integration
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={toggleConversation}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isRecording
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-blue-400 hover:bg-blue-700 text-white"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            data-testid="toggle-recording"
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            {isLoading ? "Loading..." : isRecording ? "Stop Recording" : "Start Recording"}
          </button>

          <button
            onClick={testTranscription}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all"
            data-testid="test-transcription"
          >
            Test Transcription
          </button>
        </div>

        <div className="transcription-display">
          <h4 className="text-sm font-medium text-blue-600 mb-2">Live Transcription:</h4>
          <div className="p-3 bg-gray-900/50 border border-blue-500/30 rounded-lg min-h-[100px]">
            {currentTranscription ? (
              <p className="text-white text-sm">{currentTranscription}</p>
            ) : (
              <p className="text-gray-400 text-sm italic">
                {isRecording
                  ? "Listening for speech..."
                  : 'Click "Start Recording" to begin transcription'}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-400">
          <p>Status: {conversation.status.value}</p>
          <p>Agent ID: {agentId || "Not configured"}</p>
        </div>

        <AudioWaveform isRecording={isRecording} />
      </div>
    );
  }
);

ConversationalAI.displayName = "ConversationalAI";

export default ConversationalAI;
