import React, { useEffect, useState, useRef } from "react";
import { cn } from "../../lib/utils";

export interface HUDMeterProps {
  value: number; // 0-100
  maxValue?: number;
  minValue?: number;
  size?: number;
  thickness?: number;
  startAngle?: number; // degrees
  endAngle?: number; // degrees
  color?: "primary" | "secondary" | "accent" | "warning" | "danger" | "success";
  label?: string;
  unit?: string;
  animated?: boolean;
  showValue?: boolean;
  showTicks?: boolean;
  glowEffect?: boolean;
  className?: string;
  criticalThreshold?: number; // Show warning color above this
  warningThreshold?: number; // Show warning color above this
}

const colorMap = {
  primary: {
    stroke: "var(--jarvis-primary)",
    glow: "rgba(0, 212, 255, 0.6)",
    text: "text-jarvis-primary",
  },
  secondary: {
    stroke: "var(--jarvis-secondary)",
    glow: "rgba(0, 153, 204, 0.6)",
    text: "text-jarvis-secondary",
  },
  accent: {
    stroke: "var(--jarvis-accent)",
    glow: "rgba(0, 255, 136, 0.6)",
    text: "text-jarvis-accent",
  },
  warning: {
    stroke: "var(--jarvis-warning)",
    glow: "rgba(255, 170, 0, 0.6)",
    text: "text-jarvis-warning",
  },
  danger: {
    stroke: "var(--jarvis-danger)",
    glow: "rgba(255, 68, 68, 0.6)",
    text: "text-jarvis-danger",
  },
  success: {
    stroke: "var(--jarvis-accent)",
    glow: "rgba(0, 255, 136, 0.6)",
    text: "text-jarvis-accent",
  },
};

export const HUDMeter: React.FC<HUDMeterProps> = ({
  value,
  maxValue = 100,
  minValue = 0,
  size = 120,
  thickness = 8,
  startAngle = -135,
  endAngle = 135,
  color = "primary",
  label,
  unit = "%",
  animated = true,
  showValue = true,
  showTicks = true,
  glowEffect = true,
  className,
  criticalThreshold = 90,
  warningThreshold = 75,
}) => {
  const [animatedValue, setAnimatedValue] = useState(
    animated ? minValue : value,
  );
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();

  const radius = (size - thickness) / 2;
  const centerX = size / 2;
  const centerY = size / 2;

  // Determine color based on thresholds
  const getEffectiveColor = () => {
    if (criticalThreshold && value >= criticalThreshold) return "danger";
    if (warningThreshold && value >= warningThreshold) return "warning";
    return color;
  };

  const effectiveColor = getEffectiveColor();
  const colors = colorMap[effectiveColor];

  // Convert angles to radians
  const startAngleRad = (startAngle * Math.PI) / 180;
  const endAngleRad = (endAngle * Math.PI) / 180;
  const totalAngle = endAngleRad - startAngleRad;

  // Calculate progress
  const normalizedValue = Math.min(Math.max(animatedValue, minValue), maxValue);
  const progress = (normalizedValue - minValue) / (maxValue - minValue);
  const progressAngle = startAngleRad + progress * totalAngle;

  // Create arc path
  const createArcPath = (
    startAngle: number,
    endAngle: number,
    radius: number,
  ) => {
    const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  // Animation effect
  useEffect(() => {
    if (!animated) {
      setAnimatedValue(value);
      return;
    }

    const duration = 1000;
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
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, animated, animatedValue]);

  // Generate tick marks
  const generateTicks = () => {
    if (!showTicks) return [];

    const ticks = [];
    const numTicks = 5;

    for (let i = 0; i <= numTicks; i++) {
      const tickProgress = i / numTicks;
      const tickAngle = startAngleRad + tickProgress * totalAngle;
      const tickValue = minValue + tickProgress * (maxValue - minValue);

      const innerRadius = radius - thickness / 2 - 5;
      const outerRadius = radius - thickness / 2 + 5;

      const x1 = centerX + innerRadius * Math.cos(tickAngle);
      const y1 = centerY + innerRadius * Math.sin(tickAngle);
      const x2 = centerX + outerRadius * Math.cos(tickAngle);
      const y2 = centerY + outerRadius * Math.sin(tickAngle);

      // Label position
      const labelRadius = radius + 15;
      const labelX = centerX + labelRadius * Math.cos(tickAngle);
      const labelY = centerY + labelRadius * Math.sin(tickAngle);

      ticks.push({
        id: i,
        x1,
        y1,
        x2,
        y2,
        labelX,
        labelY,
        value: Math.round(tickValue),
      });
    }

    return ticks;
  };

  const ticks = generateTicks();

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      style={{ width: size + 40, height: size + 40 }}
      data-testid="hud-meter"
    >
      <svg
        width={size + 40}
        height={size + 40}
        className="absolute inset-0"
        data-testid="hud-meter-svg"
      >
        {/* Background arc */}
        <path
          d={createArcPath(startAngleRad, endAngleRad, radius)}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={thickness}
          strokeLinecap="round"
          fill="transparent"
        />

        {/* Progress arc */}
        <path
          d={createArcPath(startAngleRad, progressAngle, radius)}
          stroke={colors.stroke}
          strokeWidth={thickness}
          strokeLinecap="round"
          fill="transparent"
          style={{
            filter: glowEffect
              ? `drop-shadow(0 0 8px ${colors.glow})`
              : undefined,
            transition: animated ? "all 0.3s ease-out" : "none",
          }}
        />

        {/* Tick marks */}
        {ticks.map((tick) => (
          <g key={tick.id}>
            <line
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth={1}
            />
            <text
              x={tick.labelX}
              y={tick.labelY}
              fill="rgba(255, 255, 255, 0.6)"
              fontSize="10"
              fontFamily="monospace"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {tick.value}
            </text>
          </g>
        ))}

        {/* Center indicator */}
        <circle
          cx={centerX}
          cy={centerY}
          r={4}
          fill={colors.stroke}
          style={{
            filter: glowEffect
              ? `drop-shadow(0 0 6px ${colors.glow})`
              : undefined,
          }}
        />

        {/* Value indicator needle */}
        <line
          x1={centerX}
          y1={centerY}
          x2={centerX + (radius - thickness) * Math.cos(progressAngle)}
          y2={centerY + (radius - thickness) * Math.sin(progressAngle)}
          stroke={colors.stroke}
          strokeWidth={2}
          strokeLinecap="round"
          style={{
            filter: glowEffect
              ? `drop-shadow(0 0 4px ${colors.glow})`
              : undefined,
            transition: animated ? "all 0.3s ease-out" : "none",
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-center mt-4">
          {showValue && (
            <div className={cn("font-mono font-bold", colors.text)}>
              <span className="text-lg">{Math.round(normalizedValue)}</span>
              <span className="text-sm opacity-80">{unit}</span>
            </div>
          )}
          {label && (
            <div className="text-xs text-holographic opacity-90 mt-1 font-mono">
              {label}
            </div>
          )}
        </div>
      </div>

      {/* Critical/Warning indicators */}
      {value >= criticalThreshold && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-jarvis-danger rounded-full animate-pulse">
            <div className="w-2 h-2 bg-jarvis-danger rounded-full animate-ping absolute"></div>
          </div>
        </div>
      )}

      {value >= warningThreshold && value < criticalThreshold && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-jarvis-warning rounded-full animate-pulse">
            <div className="w-2 h-2 bg-jarvis-warning rounded-full animate-ping absolute"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HUDMeter;
