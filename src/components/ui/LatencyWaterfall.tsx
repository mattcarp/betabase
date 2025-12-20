"use client";

/**
 * Latency Waterfall Component
 *
 * Visual component showing latency breakdown across different operations.
 * Displays a horizontal bar chart with color-coded segments for:
 * - Embedding generation (blue)
 * - Vector search (orange)
 * - LLM generation (green)
 * - Other operations (gray)
 */

import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

export interface LatencySegment {
  name: string;
  duration: number; // in milliseconds
  type: "embedding" | "vector" | "llm" | "other";
  metadata?: Record<string, unknown>;
}

interface LatencyWaterfallProps {
  segments: LatencySegment[];
  totalDuration?: number; // Optional: if provided, used as denominator for percentages
  className?: string;
}

const TYPE_COLORS: Record<LatencySegment["type"], { bg: string; text: string; label: string }> = {
  embedding: {
    bg: "bg-blue-500",
    text: "text-blue-500",
    label: "Embedding",
  },
  vector: {
    bg: "bg-orange-500",
    text: "text-orange-500",
    label: "Vector Search",
  },
  llm: {
    bg: "bg-green-500",
    text: "text-green-500",
    label: "LLM Generation",
  },
  other: {
    bg: "bg-gray-500",
    text: "text-gray-500",
    label: "Other",
  },
};

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${(ms / 60000).toFixed(2)}m`;
}

export function LatencyWaterfall({ segments, totalDuration, className = "" }: LatencyWaterfallProps) {
  // Calculate total if not provided
  const calculatedTotal = totalDuration || segments.reduce((sum, seg) => sum + seg.duration, 0);

  // If no segments or zero duration, show empty state
  if (segments.length === 0 || calculatedTotal === 0) {
    return (
      <div className={`p-4 text-center text-sm text-muted-foreground ${className}`}>
        No latency data available
      </div>
    );
  }

  // Calculate percentage for each segment
  const segmentsWithPercentage = segments.map((seg) => ({
    ...seg,
    percentage: (seg.duration / calculatedTotal) * 100,
  }));

  // Calculate cumulative percentages for positioning
  let cumulativePercentage = 0;
  const segmentsWithPosition = segmentsWithPercentage.map((seg) => {
    const start = cumulativePercentage;
    cumulativePercentage += seg.percentage;
    return {
      ...seg,
      start,
    };
  });

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Total duration header */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Total Duration</span>
        <span className="font-mono font-semibold">{formatDuration(calculatedTotal)}</span>
      </div>

      {/* Waterfall bar */}
      <TooltipProvider>
        <div className="relative h-8 w-full bg-muted rounded-lg overflow-hidden">
          {segmentsWithPosition.map((segment, index) => {
            const colors = TYPE_COLORS[segment.type];

            return (
              <Tooltip key={index} delayDuration={100}>
                <TooltipTrigger asChild>
                  <div
                    className={`absolute h-full ${colors.bg} opacity-80 hover:opacity-100 transition-opacity cursor-pointer border-r border-background`}
                    style={{
                      left: `${segment.start}%`,
                      width: `${segment.percentage}%`,
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs space-y-1">
                    <div className="font-semibold">{segment.name}</div>
                    <div className={colors.text}>{colors.label}</div>
                    <div className="font-mono">{formatDuration(segment.duration)}</div>
                    <div className="text-muted-foreground">
                      {segment.percentage.toFixed(1)}% of total
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {segmentsWithPosition.map((segment, index) => {
          const colors = TYPE_COLORS[segment.type];

          return (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${colors.bg}`} />
              <span className="text-muted-foreground">
                {segment.name}:{" "}
                <span className="font-mono font-medium">{formatDuration(segment.duration)}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Breakdown table for detailed view */}
      <div className="mt-4 space-y-1 text-xs">
        {segmentsWithPosition.map((segment, index) => {
          const colors = TYPE_COLORS[segment.type];

          return (
            <div key={index} className="flex items-center justify-between py-1 border-b border-border">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
                <span className="text-muted-foreground">{segment.name}</span>
                <span className={`text-[10px] ${colors.text}`}>{colors.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono">{formatDuration(segment.duration)}</span>
                <span className="text-muted-foreground w-12 text-right">
                  {segment.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Helper function to extract latency segments from Langfuse trace observations
 */
export function extractLatencySegments(observations: any[]): LatencySegment[] {
  if (!observations || observations.length === 0) {
    return [];
  }

  const segments: LatencySegment[] = [];

  for (const obs of observations) {
    if (!obs.startTime || !obs.endTime) continue;

    const startTime = new Date(obs.startTime).getTime();
    const endTime = new Date(obs.endTime).getTime();
    const duration = endTime - startTime;

    if (duration <= 0) continue;

    // Determine segment type based on observation type and name
    let type: LatencySegment["type"] = "other";
    const name = obs.name?.toLowerCase() || "";

    if (obs.type === "GENERATION") {
      type = "llm";
    } else if (obs.type === "SPAN") {
      if (name.includes("embed") || name.includes("embedding")) {
        type = "embedding";
      } else if (name.includes("vector") || name.includes("search") || name.includes("retriev")) {
        type = "vector";
      }
    }

    segments.push({
      name: obs.name || `${obs.type} ${obs.id.slice(0, 8)}`,
      duration,
      type,
      metadata: {
        id: obs.id,
        type: obs.type,
        level: obs.level,
      },
    });
  }

  return segments;
}
