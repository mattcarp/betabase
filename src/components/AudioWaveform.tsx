import { useState } from "react";
import { cn } from "../lib/utils";

interface AudioWaveformProps {
  isRecording: boolean;
  cclassName?: string;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  cursorColor?: string;
}

export default function AudioWaveform({
  isRecording,
  cclassName = "",
  height = 128,
  waveColor: _waveColor = "#3B82F6",
  progressColor: _progressColor = "#0080ff",
  cursorColor: _cursorColor = "#ffffff",
}: AudioWaveformProps) {
  const [isInitialized] = useState(true);

  return (
    <div cclassName={cn("wavesurfer-container", cclassName)}>
      <div
        cclassName="w-full bg-black/20 border border-blue-500/30 rounded-lg flex items-center justify-center"
        style={{ height: `${height}px` }}
        data-testid="audio-waveform-container"
      >
        <div cclassName="text-center">
          <div cclassName="text-blue-600 text-sm mb-2">
            {isRecording ? "🎤 Recording..." : "🌊 Audio Waveform"}
          </div>
          <div cclassName="text-xs text-blue-600/60">WaveSurfer.js integration coming soon</div>
        </div>
      </div>

      <div cclassName="mt-2 flex items-center justify-between text-xs text-blue-600">
        <span>Status: {isRecording ? "Recording" : "Ready"}</span>
        <span>{isInitialized ? "Placeholder Ready" : "Initializing..."}</span>
      </div>
    </div>
  );
}
