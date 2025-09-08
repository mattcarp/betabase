/**
 * Professional Progress Indicator
 * Enterprise-grade progress display for Sony Music SIAM
 * No neon, no games, just professional data visualization
 */

"use client";

import React from "react";
import { cn } from "../../lib/utils";
import { Check, AlertCircle } from "lucide-react";

interface ProfessionalProgressProps {
  value: number; // 0-100
  label?: string;
  subLabel?: string;
  variant?: "default" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const variantStyles = {
  default: {
    bar: "bg-blue-600 dark:bg-blue-500",
    text: "text-gray-600 dark:text-gray-400",
    track: "bg-gray-100 dark:bg-gray-800"
  },
  success: {
    bar: "bg-green-600 dark:bg-green-500",
    text: "text-green-600 dark:text-green-500",
    track: "bg-gray-100 dark:bg-gray-800"
  },
  warning: {
    bar: "bg-amber-600 dark:bg-amber-500",
    text: "text-amber-600 dark:text-amber-500",
    track: "bg-gray-100 dark:bg-gray-800"
  },
  error: {
    bar: "bg-red-600 dark:bg-red-500",
    text: "text-red-600 dark:text-red-500",
    track: "bg-gray-100 dark:bg-gray-800"
  }
};

const sizeStyles = {
  sm: {
    height: "h-1.5",
    text: "text-xs",
    spacing: "space-y-1"
  },
  md: {
    height: "h-2",
    text: "text-sm",
    spacing: "space-y-1.5"
  },
  lg: {
    height: "h-2.5",
    text: "text-base",
    spacing: "space-y-2"
  }
};

export function ProfessionalProgress({
  value,
  label,
  subLabel,
  variant = "default",
  size = "md",
  showValue = true,
  className
}: ProfessionalProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];
  
  return (
    <div className={cn("w-full", sizes.spacing, className)}>
      {/* Header */}
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className={cn(sizes.text, "font-medium text-gray-700 dark:text-gray-300")}>
              {label}
            </span>
          )}
          {showValue && (
            <span className={cn(sizes.text, "font-mono", styles.text)}>
              {Math.round(clampedValue)}%
            </span>
          )}
        </div>
      )}
      
      {/* Progress Bar */}
      <div className={cn("w-full rounded-full overflow-hidden", styles.track, sizes.height)}>
        <div 
          className={cn(
            "h-full transition-all duration-500 ease-out rounded-full",
            styles.bar
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      
      {/* Sub Label */}
      {subLabel && (
        <p className={cn(sizes.text, "text-gray-500 dark:text-gray-400 mt-1")}>
          {subLabel}
        </p>
      )}
    </div>
  );
}

/**
 * Circular Professional Progress
 * Clean circular progress without game aesthetics
 */
export function CircularProfessionalProgress({
  value,
  label,
  size = 80,
  strokeWidth = 6,
  variant = "default",
  className,
  animated = true,
  showValue = true,
  glowEffect = false,  // Keep for compatibility but ignore
  color = "primary"    // Map old color prop
}: {
  value: number;
  label?: string;
  size?: number;
  strokeWidth?: number;
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
  animated?: boolean;
  showValue?: boolean;
  glowEffect?: boolean;
  color?: string;
  subLabel?: string;
}) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;
  
  // Map old color values to new variants
  const colorVariantMap: Record<string, string> = {
    primary: "default",
    secondary: "default",
    accent: "success",
    warning: "warning",
    danger: "error",
    success: "success"
  };
  
  const finalVariant = (colorVariantMap[color] || variant) as "default" | "success" | "warning" | "error";
  
  const colors = {
    default: "#3B82F6",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444"
  };
  
  return (
    <div className={cn("relative inline-flex", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors[finalVariant]}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            animated ? "transition-all duration-500 ease-out" : ""
          )}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {Math.round(clampedValue)}%
          </span>
        )}
        {label && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

// Export as RadialProgress for backward compatibility
export const RadialProgress = CircularProfessionalProgress;

/**
 * Step Progress Indicator
 * For multi-step processes without gaming aesthetics
 */
export function StepProgress({
  currentStep,
  totalSteps,
  labels,
  className
}: {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              {i > 0 && (
                <div 
                  className={cn(
                    "flex-1 h-0.5",
                    i <= currentStep - 1 
                      ? "bg-blue-600 dark:bg-blue-500" 
                      : "bg-gray-200 dark:bg-gray-700"
                  )}
                />
              )}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold",
                  i < currentStep
                    ? "bg-blue-600 dark:bg-blue-500 text-white"
                    : i === currentStep
                    ? "bg-blue-600 dark:bg-blue-500 text-white ring-4 ring-blue-100 dark:ring-blue-900"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                )}
              >
                {i < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < totalSteps - 1 && (
                <div 
                  className={cn(
                    "flex-1 h-0.5",
                    i < currentStep - 1 
                      ? "bg-blue-600 dark:bg-blue-500" 
                      : "bg-gray-200 dark:bg-gray-700"
                  )}
                />
              )}
            </div>
            {labels?.[i] && (
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {labels[i]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProfessionalProgress;