import React, { useEffect, useState, useRef } from "react";
import { cn } from "../../lib/utils";

export interface RadialProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
  subLabel?: string;
  color?: "primary" | "secondary" | "accent" | "warning" | "danger" | "success";
  animated?: boolean;
  showValue?: boolean;
  glowEffect?: boolean;
  children?: React.ReactNode;
  onAnimationComplete?: () => void;
}

const colorMap = {
  primary: {
    stroke: "var(--jarvis-primary)",
    glow: "rgba(59, 130, 246, 0.6)",
    text: "text-[var(--jarvis-primary)]",
  },
  secondary: {
    stroke: "var(--jarvis-secondary)",
    glow: "rgba(0, 153, 204, 0.6)",
    text: "text-[var(--jarvis-secondary)]",
  },
  accent: {
    stroke: "var(--jarvis-accent)",
    glow: "rgba(16, 185, 129, 0.6)",
    text: "text-[var(--jarvis-accent)]",
  },
  warning: {
    stroke: "var(--jarvis-warning)",
    glow: "rgba(255, 170, 0, 0.6)",
    text: "text-[var(--jarvis-warning)]",
  },
  danger: {
    stroke: "var(--jarvis-danger)",
    glow: "rgba(255, 68, 68, 0.6)",
    text: "text-[var(--jarvis-danger)]",
  },
  success: {
    stroke: "var(--jarvis-accent)",
    glow: "rgba(16, 185, 129, 0.6)",
    text: "text-[var(--jarvis-accent)]",
  },
};

export const RadialProgress: React.FC<RadialProgressProps> = ({
  value,
  size = 120,
  strokeWidth = 8,
  className = "",
  label,
  subLabel,
  color = "primary",
  animated = true,
  showValue = true,
  glowEffect = true,
  children,
  onAnimationComplete,
}) => {
  const [animatedValue, setAnimatedValue] = useState(animated ? 0 : value);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  const colors = colorMap[color];
  const centerX = size / 2;
  const centerY = size / 2;

  // Animation effect
  useEffect(() => {
    if (!animated) {
      setAnimatedValue(value);
      return;
    }

    const duration = 1500; // 1.5 seconds
    const startValue = animatedValue;
    const targetValue = value;
    const valueDiff = targetValue - startValue;

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out-cubic)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + valueDiff * easeOutCubic;
      setAnimatedValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        startTimeRef.current = undefined;
        onAnimationComplete?.();
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, animated, animatedValue, onAnimationComplete]);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      data-testid="radial-progress"
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        data-testid="radial-progress-svg"
      >
        {/* Background circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-30"
        />

        {/* Progress circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn("transition-all duration-300 ease-out", glowEffect && "drop-shadow-md")}
          style={{
            filter: glowEffect ? `drop-shadow(0 0 8px ${colors.glow})` : undefined,
            transition: animated ? "stroke-dashoffset 0.3s ease-out" : "none",
          }}
        />

        {/* Inner glow effect */}
        {glowEffect && (
          <circle
            cx={centerX}
            cy={centerY}
            r={radius - strokeWidth / 2}
            stroke={colors.stroke}
            strokeWidth={1}
            fill="transparent"
            opacity={0.3}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-out"
          />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children ? (
          children
        ) : (
          <div className="text-center">
            {showValue && (
              <div className={cn("font-mono font-normal", colors.text)}>
                <span className="text-lg">{Math.round(animatedValue)}</span>
                <span className="text-sm opacity-80">%</span>
              </div>
            )}
            {label && (
              <div className="text-xs text-holographic opacity-90 mt-2 font-mono">{label}</div>
            )}
            {subLabel && <div className="text-xs opacity-60 mt-0.5">{subLabel}</div>}
          </div>
        )}
      </div>

      {/* Pulsing center dot for active states */}
      {animatedValue > 0 && (
        <div
          className={cn("absolute rounded-full animate-pulse", colors.text.replace("text-", "bg-"))}
          style={{
            width: 4,
            height: 4,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            boxShadow: `0 0 10px ${colors.glow}`,
            opacity: 0.8,
          }}
        />
      )}
    </div>
  );
};

export default RadialProgress;
