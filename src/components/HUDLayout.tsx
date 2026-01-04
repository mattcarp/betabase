import { useState } from "react";
import { CircularHUD, CircularNavigation } from "./ui/CircularHUD";
import AudioWaveform from "./AudioWaveform";
import { SystemHealthMonitor } from "./SystemHealthMonitor";
import ConversationalAI from "./ConversationalAI";
import { Mic, FileText, Lightbulb, Activity, Settings, MessageCircle } from "lucide-react";

interface HUDLayoutProps {
  children?: React.ReactNode;
  className?: string;
  isRecording: boolean;
  transcription: string;
  waveform: number[];
  onToggleSettings: () => void;
}

export function HUDLayout({
  isRecording,
  transcription,
  waveform: _waveform,
  onToggleSettings,
  className = "",
}: HUDLayoutProps) {
  const [activePanel, setActivePanel] = useState("transcription");

  const navigationItems = [
    {
      id: "audio",
      icon: <Mic className="w-6 h-6" />,
      label: "Audio Waveform",
      onClick: () => setActivePanel("audio"),
      isActive: activePanel === "audio",
    },
    {
      id: "transcription",
      icon: <FileText className="w-6 h-6" />,
      label: "Live Transcription",
      onClick: () => setActivePanel("transcription"),
      isActive: activePanel === "transcription",
    },
    {
      id: "insights",
      icon: <Lightbulb className="w-6 h-6" />,
      label: "AI Insights",
      onClick: () => setActivePanel("insights"),
      isActive: activePanel === "insights",
    },
    {
      id: "elevenlabs",
      icon: <MessageCircle className="w-6 h-6" />,
      label: "ElevenLabs AI",
      onClick: () => setActivePanel("elevenlabs"),
      isActive: activePanel === "elevenlabs",
    },
    {
      id: "system",
      icon: <Activity className="w-6 h-6" />,
      label: "System Health",
      onClick: () => setActivePanel("system"),
      isActive: activePanel === "system",
    },
    {
      id: "settings",
      icon: <Settings className="w-6 h-6" />,
      label: "Settings",
      onClick: onToggleSettings,
      isActive: false,
    },
  ];

  const renderActivePanel = () => {
    switch (activePanel) {
      case "audio":
        return (
          <div className="glass-panel p-6 w-80 h-80 flex flex-col items-center justify-center animate-pulse-slow">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-500/10 rounded-lg animate-gradient-xy"></div>
            <h3 className="mac-title text-holographic text-lg mb-4 font-mono tracking-wider">
              <span>AUDIO VISUALIZATION</span>
            </h3>
            <AudioWaveform
              isRecording={isRecording}
              className="w-full h-32 border border-blue-500/30 rounded-lg p-2"
            />
            <div className="mt-4 text-blue-600 font-mono text-sm">
              <div className={`inline-flex items-center ${isRecording ? "animate-pulse" : ""}`}>
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${isRecording ? "bg-red-500 animate-ping" : "bg-green-500"}`}
                ></div>
                {isRecording ? "● RECORDING ACTIVE" : "○ READY TO RECORD"}
              </div>
            </div>
          </div>
        );
      case "insights":
        return (
          <div className="glass-panel p-6 w-80 h-80 overflow-y-auto">
            <h3 className="mac-title text-holographic text-lg mb-4 font-mono tracking-wider">
              <span>AI INSIGHTS</span>
            </h3>
            <div className="space-y-4">
              <div className="hud-element p-4 border border-blue-500/30 rounded-lg hover:border-blue-600/50 transition-all duration-300">
                <div className="text-blue-600 text-sm font-mono">SENTIMENT ANALYSIS</div>
                <div className="text-green-400 mt-2 font-mono">● NEUTRAL ●</div>
                <div className="w-full bg-muted rounded-full h-1 mt-2">
                  <div className="bg-green-400 h-1 rounded-full" style={{ width: "65%" }}></div>
                </div>
              </div>
              <div className="hud-element p-4 border border-blue-500/30 rounded-lg hover:border-blue-600/50 transition-all duration-300">
                <div className="text-blue-600 text-sm font-mono">KEY TOPICS DETECTED</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-2 bg-blue-500/20 text-blue-300 rounded text-xs font-mono">
                    TECHNOLOGY
                  </span>
                  <span className="px-2 py-2 bg-purple-500/20 text-purple-300 rounded text-xs font-mono">
                    AUDIO
                  </span>
                  <span className="px-2 py-2 bg-blue-500/20 text-blue-300 rounded text-xs font-mono">
                    AI
                  </span>
                </div>
              </div>
              <div className="hud-element p-4 border border-blue-500/30 rounded-lg hover:border-blue-600/50 transition-all duration-300">
                <div className="text-blue-600 text-sm font-mono">PROCESSING STATUS</div>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  <span className="text-green-400 text-xs font-mono">
                    REAL-TIME ANALYSIS ACTIVE
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      case "elevenlabs":
        return (
          <div className="glass-panel p-0 w-80 h-80 overflow-hidden border border-blue-500/30">
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-r from-blue-500/20 to-blue-500/20 flex items-center px-4">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
              <span className="text-blue-300 text-xs font-mono">ELEVENLABS AI ACTIVE</span>
            </div>
            <ConversationalAI
              agentId={process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "demo-agent-siam-dev"}
              className="w-full h-full pt-8"
              onTranscriptionUpdate={() => {
                // Voice transcription update (silent in production)
              }}
              onConversationStateChange={() => {
                // Voice conversation state change (silent in production)
              }}
            />
          </div>
        );
      case "system":
        return (
          <div className="glass-panel p-6 w-80 h-80 overflow-y-auto">
            <h3 className="mac-title text-holographic text-lg mb-4 font-mono tracking-wider">
              <span>SYSTEM STATUS</span>
            </h3>
            <SystemHealthMonitor className="w-full" />
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-blue-600">CPU:</span>
                <span className="text-green-400">OPTIMAL</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-blue-600">MEMORY:</span>
                <span className="text-green-400">STABLE</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-blue-600">NETWORK:</span>
                <span className="text-green-400">CONNECTED</span>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="glass-panel p-6 w-80 h-80 overflow-y-auto">
            <h3 className="mac-title text-holographic text-lg mb-4 font-mono tracking-wider">
              <span>LIVE TRANSCRIPTION</span>
            </h3>
            <div className="hud-element p-4 min-h-32 border border-blue-500/30 rounded-lg">
              <div
                className="text-blue-300 text-sm font-mono whitespace-pre-wrap"
                data-test-id="transcription-display"
              >
                {transcription || (
                  <div className="text-center opacity-60">
                    <div className="animate-pulse mb-2">🎤</div>
                    <div>READY TO TRANSCRIBE...</div>
                    <div className="text-xs mt-2 opacity-40">Speak to begin transcription</div>
                  </div>
                )}
              </div>
              {isRecording && (
                <div className="absolute bottom-2 right-2 flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-red-400 text-xs font-mono">LIVE</span>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden ${className} bg-black`}>
      {/* Animated background grid with depth */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
               linear-gradient(rgba(0, 255, 255, 0.15) 1px, transparent 1px),
               linear-gradient(90deg, rgba(0, 255, 255, 0.15) 1px, transparent 1px),
               radial-gradient(circle at 50% 50%, rgba(0, 255, 255, 0.05) 0%, transparent 70%)
             `,
          backgroundSize: "20px 20px, 20px 20px, 400px 400px",
          animation: "gridPulse 4s ease-in-out infinite",
        }}
      />

      {/* Corner HUD elements */}
      <div className="absolute top-4 left-4 text-blue-600/60 font-mono text-xs">
        <div>S.I.A.M. v2.0</div>
        <div className="animate-pulse">● ONLINE</div>
      </div>

      <div className="absolute top-4 right-4 text-blue-600/60 font-mono text-xs">
        <div>{new Date().toLocaleTimeString()}</div>
        <div>SYSTEM: OPERATIONAL</div>
      </div>

      {/* Main circular HUD container with enhanced effects */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-[600px] h-[600px] rounded-full border border-blue-500/20 animate-pulse"></div>
        <div
          className="absolute w-[550px] h-[550px] rounded-full border border-blue-500/30 animate-pulse"
          style={{ animationDelay: "0.5s" }}
        ></div>

        <CircularHUD
          size={500}
          isActive={isRecording}
          pulseEffect={true}
          className="z-10 shadow-2xl shadow-blue-500/20"
        >
          {renderActivePanel()}
        </CircularHUD>

        {/* Navigation overlay */}
        <CircularNavigation items={navigationItems} radius={280} size={56} className="z-20" />
      </div>

      {/* Status indicators */}
      <div className="absolute bottom-4 left-4 flex flex-col space-y-2">
        <div className="text-blue-600/60 font-mono text-xs flex items-center">
          <div
            className={`w-2 h-2 rounded-full mr-2 ${isRecording ? "bg-red-500 animate-pulse" : "bg-green-500"}`}
          ></div>
          {isRecording ? "RECORDING" : "STANDBY"}
        </div>
      </div>

      {/* Animated corner brackets */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500/50"></div>
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500/50"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500/50"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500/50"></div>
    </div>
  );
}
