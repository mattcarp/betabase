import { useState } from "react";
import { cn } from "../lib/utils";

interface AudioWaveformProps {
  isRecording: boolean;
  className?: string;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  cursorColor?: string;
}

export default function AudioWaveform({
  isRecording,
  className = "",
  height = 128,
  waveColor = "#3B82F6",
  progressColor = "#0080ff",
  cursorColor = "#ffffff",
}: AudioWaveformProps) {
  const [isInitialized] = useState(true);

  return (
    <div className={cn("wavesurfer-container", className)}>
      <div
        className="w-full bg-black/20 border border-blue-500/30 rounded-lg flex items-center justify-center"
        style={{ height: `${height}px` }}
        data-testid="audio-waveform-container"
      >
        <div className="text-center">
          <div className="text-blue-600 text-sm mb-2">
            {isRecording ? "🎤 Recording..." : "🌊 Audio Waveform"}
          </div>
          <div className="text-xs text-blue-600/60">
            WaveSurfer.js integration coming soon
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-blue-600">
        <span>Status: {isRecording ? "Recording" : "Ready"}</span>
        <span>{isInitialized ? "Placeholder Ready" : "Initializing..."}</span>
      </div>
    </div>
  );
}