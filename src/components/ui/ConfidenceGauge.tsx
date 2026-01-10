"use client";

import React from "react";
import { cn } from "../../lib/utils";

interface ConfidenceGaugeProps {
  value: number; // 0-100
  size?: "sm" | "md" | "lg";
  showBreakdown?: boolean;
  breakdown?: {
    scriptDepth?: number;
    context?: number;
    stability?: number;
    visualPenalty?: number;
  };
  className?: string;
}

/**
 * MAC Design System Confidence Gauge
 *
 * A circular gauge that displays automation confidence scores (0-100%)
 * with optional breakdown of contributing factors.
 *
 * Uses design system colors:
 * - High (>=70%): --mac-data-teal
 * - Medium (40-69%): --mac-data-coral
 * - Low (<40%): --mac-data-error
 */
export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({
  value,
  size = "lg",
  showBreakdown = false,
  breakdown,
  className,
}) => {
  // Clamp value between 0-100
  const normalizedValue = Math.max(0, Math.min(100, value));

  // Size configurations
  const sizes = {
    sm: { diameter: 60, stroke: 4, fontSize: "text-lg", labelSize: "text-[8px]" },
    md: { diameter: 90, stroke: 6, fontSize: "text-2xl", labelSize: "text-[9px]" },
    lg: { diameter: 120, stroke: 8, fontSize: "text-5xl", labelSize: "text-[10px]" },
  };

  const config = sizes[size];
  const radius = (config.diameter - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  // Color based on confidence level
  const getColor = (val: number) => {
    if (val >= 70) return "var(--mac-data-teal)";
    if (val >= 40) return "var(--mac-data-coral)";
    return "var(--mac-data-error)";
  };

  const getLabel = (val: number) => {
    if (val >= 70) return "HIGH";
    if (val >= 40) return "MED";
    return "LOW";
  };

  const color = getColor(normalizedValue);
  const label = getLabel(normalizedValue);

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Circular Gauge */}
      <div className="relative" style={{ width: config.diameter, height: config.diameter }}>
        <svg
          width={config.diameter}
          height={config.diameter}
          viewBox={`0 0 ${config.diameter} ${config.diameter}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={config.diameter / 2}
            cy={config.diameter / 2}
            r={radius}
            fill="none"
            stroke="var(--mac-utility-border)"
            strokeWidth={config.stroke}
            className="opacity-30"
          />
          {/* Progress arc */}
          <circle
            cx={config.diameter / 2}
            cy={config.diameter / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(config.fontSize, "font-extralight tabular-nums")}
            style={{ color }}
          >
            {normalizedValue}
          </span>
          <span className={cn(config.labelSize, "uppercase tracking-[0.15em] text-muted-foreground font-medium")}>
            {label}
          </span>
        </div>
      </div>

      {/* Breakdown section */}
      {showBreakdown && breakdown && (
        <div className="w-full max-w-[180px] space-y-1.5">
          <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground text-center mb-2">
            Score Breakdown
          </div>
          {breakdown.scriptDepth !== undefined && (
            <BreakdownRow label="Script Depth" value={breakdown.scriptDepth} />
          )}
          {breakdown.context !== undefined && (
            <BreakdownRow label="Context" value={breakdown.context} />
          )}
          {breakdown.stability !== undefined && (
            <BreakdownRow label="Stability" value={breakdown.stability} />
          )}
          {breakdown.visualPenalty !== undefined && (
            <BreakdownRow label="Visual Penalty" value={breakdown.visualPenalty} negative />
          )}
        </div>
      )}
    </div>
  );
};

interface BreakdownRowProps {
  label: string;
  value: number;
  negative?: boolean;
}

const BreakdownRow: React.FC<BreakdownRowProps> = ({ label, value, negative }) => {
  const displayValue = negative ? value : `+${value}`;
  const textColor = negative ? "text-rose-400" : "text-emerald-400";

  return (
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-mono tabular-nums", textColor)}>
        {displayValue}
      </span>
    </div>
  );
};

/**
 * Skeleton loading state for ConfidenceGauge
 */
export const ConfidenceGaugeSkeleton: React.FC<{ size?: "sm" | "md" | "lg" }> = ({
  size = "lg"
}) => {
  const sizes = {
    sm: 60,
    md: 90,
    lg: 120,
  };

  const diameter = sizes[size];

  return (
    <div
      className="rounded-full mac-shimmer"
      style={{ width: diameter, height: diameter }}
    />
  );
};

export default ConfidenceGauge;
