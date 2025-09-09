import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record";

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
  waveColor = "#00ffff",
  progressColor = "#0080ff",
  cursorColor = "#ffffff",
}: AudioWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const recordPluginRef = useRef<RecordPlugin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize WaveSurfer - only once on mount
  useEffect(() => {
    if (!containerRef.current || wavesurferRef.current) return;

    try {
      console.log("🌊 Initializing WaveSurfer...");

      // Create WaveSurfer instance
      const wavesurfer = WaveSurfer.create({
        container: containerRef.current,
        waveColor,
        progressColor,
        cursorColor,
        height,
        normalize: true,
        backend: "WebAudio",
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
      });

      // Create record plugin
      const recordPlugin = wavesurfer.registerPlugin(
        RecordPlugin.create({
          scrollingWaveform: true,
          renderRecordedAudio: false,
        }),
      );

      wavesurferRef.current = wavesurfer;
      recordPluginRef.current = recordPlugin;
      setIsInitialized(true);

      console.log("✅ WaveSurfer initialized successfully");

      // Event listeners
      recordPlugin.on("record-start", () => {
        console.log("🎤 Recording started");
      });

      recordPlugin.on("record-end", () => {
        console.log("🛑 Recording stopped");
      });

      recordPlugin.on("record-data-available", (blob: Blob) => {
        console.log("📊 Audio data available:", blob.size, "bytes");
      });
    } catch (err: any) {
      console.error("❌ Failed to initialize WaveSurfer:", err);
      setError(err.message || "Failed to initialize audio waveform");
    }

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up WaveSurfer...");
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
      recordPluginRef.current = null;
      setIsInitialized(false);
    };
  }, []); // Empty dependency array - only run once on mount

  // Handle recording state changes
  useEffect(() => {
    if (!recordPluginRef.current || !isInitialized) return;

    const recordPlugin = recordPluginRef.current;

    if (isRecording) {
      // Start recording only if not already recording
      if (!recordPlugin.isRecording()) {
        recordPlugin.startRecording().catch((err: any) => {
          console.error("❌ Failed to start recording:", err);
          setError("Failed to start recording: " + err.message);
        });
      }
    } else {
      // Stop recording only if currently recording
      if (recordPlugin.isRecording()) {
        recordPlugin.stopRecording();
      }
    }
  }, [isRecording, isInitialized]);

  // Handle color and size changes without reinitializing
  useEffect(() => {
    if (!wavesurferRef.current || !isInitialized) return;

    // Update options if they exist
    const wavesurfer = wavesurferRef.current;
    if (wavesurfer.setOptions) {
      wavesurfer.setOptions({
        waveColor,
        progressColor,
        cursorColor,
        height,
      });
    }
  }, [waveColor, progressColor, cursorColor, height, isInitialized]);

  return (
    <div className={cn("wavesurfer-container", className)}>
      {error && (
        <div className="mb-2 p-2 bg-red-900/20 border border-red-500 rounded text-red-400 text-xs">
          {error}
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full"
        style={{ height: `${height}px` }}
        data-testid="audio-waveform-container"
      />

      <div className="mt-2 flex items-center justify-between text-xs text-cyan-400">
        <span>Status: {isRecording ? "Recording" : "Ready"}</span>
        <span>{isInitialized ? "WaveSurfer Ready" : "Initializing..."}</span>
      </div>
    </div>
  );
}
