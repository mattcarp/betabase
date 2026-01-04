import React from "react";
import { cn } from "../lib/utils";

interface SkeletonProps {
  className?: string;
  animate?: boolean;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, animate = true, style }) => (
  <div
    className={cn(
      "bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20 rounded",
      animate && "animate-pulse",
      className
    )}
    style={style}
    data-testid="skeleton-loader"
  />
);

// Specialized skeleton components for different UI sections

export const AudioWaveformSkeleton: React.FC = () => (
  <div className="space-y-3" data-testid="audio-waveform-skeleton">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-16" />
    </div>
    <div className="flex items-end space-x-1 h-32">
      {Array.from({ length: 40 }).map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1 bg-[var(--jarvis-primary)]/20"
          style={{
            height: `${Math.random() * 80 + 20}%`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
    <div className="flex space-x-2">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-8 w-20 rounded" />
    </div>
  </div>
);

export const TranscriptionSkeleton: React.FC = () => (
  <div className="space-y-4" data-testid="transcription-skeleton">
    <div className="flex items-center space-x-2">
      <Skeleton className="h-5 w-5 rounded-full bg-[var(--jarvis-primary)]/30" />
      <Skeleton className="h-4 w-32" />
    </div>
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4" style={{ width: `${Math.random() * 40 + 60}%` }} />
          {Math.random() > 0.5 && (
            <Skeleton className="h-4" style={{ width: `${Math.random() * 60 + 40}%` }} />
          )}
        </div>
      ))}
    </div>
    <div className="flex items-center space-x-2 pt-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
);

export const AIInsightsSkeleton: React.FC = () => (
  <div className="space-y-6" data-testid="ai-insights-skeleton">
    {/* Header */}
    <div className="flex items-center space-x-3">
      <Skeleton className="h-8 w-8 rounded-full bg-[var(--jarvis-accent)]/30" />
      <Skeleton className="h-5 w-28" />
    </div>

    {/* Insight cards */}
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="space-y-3 p-4 border border-border/30 rounded-lg">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex space-x-2 mt-4">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

export const SystemMonitorSkeleton: React.FC = () => (
  <div className="space-y-4" data-testid="system-monitor-skeleton">
    {/* CPU/Memory metrics */}
    {["CPU Usage", "Memory", "Network"].map((metric) => (
      <div key={metric} className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="w-full bg-muted/20 rounded-full h-2">
          <Skeleton
            className="h-2 rounded-full bg-[var(--jarvis-success)]/40"
            style={{ width: `${Math.random() * 60 + 20}%` }}
          />
        </div>
      </div>
    ))}

    {/* Status indicators */}
    <div className="grid grid-cols-2 gap-4 mt-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-2">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  </div>
);

export const CircularHUDSkeleton: React.FC<{ size?: number }> = ({ size = 400 }) => (
  <div
    className="relative flex items-center justify-center"
    style={{ width: size, height: size }}
    data-testid="circular-hud-skeleton"
  >
    {/* Outer ring */}
    <Skeleton
      className="absolute inset-0 rounded-full border-4 border-[var(--jarvis-primary)]/20"
      animate={false}
    />

    {/* Inner content */}
    <div className="text-center space-y-3">
      <Skeleton className="h-6 w-24 mx-auto" />
      <Skeleton className="h-4 w-32 mx-auto" />
      <div className="flex space-x-2 justify-center">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-2 w-2 rounded-full" />
        ))}
      </div>
    </div>

    {/* Animated pulse effect */}
    <div
      className="absolute inset-4 rounded-full border-2 border-[var(--jarvis-primary)]/30 animate-ping"
      style={{ animationDuration: "3s" }}
    />
  </div>
);

// Panel skeleton that adapts to panel type
interface PanelSkeletonProps {
  panelType: "audio" | "transcription" | "ai-insights" | "system-monitor" | "default";
  className?: string;
}

export const PanelSkeleton: React.FC<PanelSkeletonProps> = ({ panelType, className }) => {
  const renderSkeletonContent = () => {
    switch (panelType) {
      case "audio":
        return <AudioWaveformSkeleton />;
      case "transcription":
        return <TranscriptionSkeleton />;
      case "ai-insights":
        return <AIInsightsSkeleton />;
      case "system-monitor":
        return <SystemMonitorSkeleton />;
      default:
        return (
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        );
    }
  };

  return (
    <div className={cn("p-4", className)} data-testid="panel-skeleton">
      {renderSkeletonContent()}
    </div>
  );
};

// Loading overlay with enhanced visual feedback
interface LoadingOverlayProps {
  message?: string;
  progress?: number;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = "Loading...",
  progress,
  className,
}) => (
  <div
    className={cn(
      "fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm",
      className
    )}
    data-testid="loading-overlay"
  >
    <div className="glass-panel p-8 flex flex-col items-center gap-6 max-w-sm w-full mx-4">
      {/* Circular progress indicator */}
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-muted/30"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            className="text-[var(--jarvis-primary)] animate-pulse"
            pathLength="100"
            strokeDasharray={progress ? `${progress} ${100 - progress}` : "20 80"}
            style={{
              animation: progress ? "none" : "spin 2s linear infinite",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-[var(--jarvis-primary)] rounded-full animate-pulse" />
        </div>
      </div>

      {/* Loading message */}
      <div className="text-center space-y-2">
        <div className="text-holographic font-mono text-lg">{message}</div>
        {progress !== undefined && (
          <div className="text-[var(--jarvis-secondary)] text-sm font-mono">
            {Math.round(progress)}% Complete
          </div>
        )}
      </div>

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="w-full bg-muted/30 rounded-full h-1">
          <div
            className="bg-[var(--jarvis-primary)] h-1 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  </div>
);

export default {
  Skeleton,
  AudioWaveformSkeleton,
  TranscriptionSkeleton,
  AIInsightsSkeleton,
  SystemMonitorSkeleton,
  CircularHUDSkeleton,
  PanelSkeleton,
  LoadingOverlay,
};
