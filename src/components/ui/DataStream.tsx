import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

export interface DataStreamProps {
  data: number[];
  height?: number;
  width?: number;
  color?: "primary" | "secondary" | "accent" | "warning" | "danger";
  animated?: boolean;
  showGrid?: boolean;
  showLabels?: boolean;
  label?: string;
  cclassName?: string;
  streamSpeed?: number; // ms between updates
  maxDataPoints?: number;
  glowEffect?: boolean;
}

const colorMap = {
  primary: {
    stroke: "var(--jarvis-primary)",
    glow: "rgba(0, 212, 255, 0.6)",
    fill: "rgba(0, 212, 255, 0.1)",
  },
  secondary: {
    stroke: "var(--jarvis-secondary)",
    glow: "rgba(0, 153, 204, 0.6)",
    fill: "rgba(0, 153, 204, 0.1)",
  },
  accent: {
    stroke: "var(--jarvis-accent)",
    glow: "rgba(0, 255, 136, 0.6)",
    fill: "rgba(0, 255, 136, 0.1)",
  },
  warning: {
    stroke: "var(--jarvis-warning)",
    glow: "rgba(255, 170, 0, 0.6)",
    fill: "rgba(255, 170, 0, 0.1)",
  },
  danger: {
    stroke: "var(--jarvis-danger)",
    glow: "rgba(255, 68, 68, 0.6)",
    fill: "rgba(255, 68, 68, 0.1)",
  },
};

export const DataStream: React.FC<DataStreamProps> = ({
  data,
  height = 100,
  width = 300,
  color = "primary",
  animated = true,
  showGrid = true,
  showLabels = false,
  label,
  cclassName,
  streamSpeed = 50,
  maxDataPoints = 50,
  glowEffect = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [internalData, setInternalData] = useState<number[]>([]);

  const colors = colorMap[color];

  // Update internal data when props change
  useEffect(() => {
    const newData = data.slice(-maxDataPoints);
    setInternalData(newData);
  }, [data, maxDataPoints]);

  // Canvas drawing function
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;

      // Horizontal grid lines
      for (let i = 0; i <= 4; i++) {
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vertical grid lines
      for (let i = 0; i <= 8; i++) {
        const x = (width / 8) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }

    if (internalData.length < 2) return;

    // Normalize data to canvas height
    const maxValue = Math.max(...internalData, 1);
    const minValue = Math.min(...internalData, 0);
    const range = maxValue - minValue || 1;

    const normalizedData = internalData.map(
      (value) => height - ((value - minValue) / range) * height
    );

    // Draw filled area under the curve
    ctx.fillStyle = colors.fill;
    ctx.beginPath();
    ctx.moveTo(0, height);

    normalizedData.forEach((y, index) => {
      const x = (index / (internalData.length - 1)) * width;
      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Draw the main line with glow effect
    if (glowEffect) {
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 8;
    }

    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.beginPath();
    normalizedData.forEach((y, index) => {
      const x = (index / (internalData.length - 1)) * width;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";

    // Draw data points
    ctx.fillStyle = colors.stroke;
    normalizedData.forEach((y, index) => {
      const x = (index / (internalData.length - 1)) * width;
      if (index === normalizedData.length - 1) {
        // Highlight the latest point
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();

        if (glowEffect) {
          ctx.shadowColor = colors.glow;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, 2 * Math.PI);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.shadowColor = "transparent";
        }
      }
    });

    // Draw value labels if enabled
    if (showLabels && internalData.length > 0) {
      ctx.fillStyle = colors.stroke;
      ctx.font = "10px monospace";
      ctx.textAlign = "right";

      const latestValue = internalData[internalData.length - 1];
      const latestY = normalizedData[normalizedData.length - 1];

      ctx.fillText(latestValue?.toFixed(1) || "0.0", width - 5, (latestY || 0) - 5);
    }
  };

  // Animation loop - separated from data updates to prevent infinite loops
  useEffect(() => {
    if (!animated) {
      drawChart();
      return;
    }

    let animationId: number;
    const animate = () => {
      drawChart();
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [animated, width, height, showGrid, showLabels, color, glowEffect]);

  // Redraw when data changes
  useEffect(() => {
    if (!animated) {
      drawChart();
    }
  }, [internalData]);

  return (
    <div cclassName={cn("relative", cclassName)} data-testid="data-stream">
      {label && <div cclassName="text-xs text-holographic opacity-90 mb-2 font-mono">{label}</div>}
      <div
        cclassName="relative border border-jarvis-primary/20 rounded bg-black/20 backdrop-blur-sm"
        style={{ width, height }}
      >
        <canvas ref={canvasRef} cclassName="absolute inset-0" style={{ width, height }} />

        {/* Scanning line effect */}
        {animated && (
          <div
            cclassName="absolute top-0 bottom-0 w-0.5 bg-jarvis-primary/60 animate-pulse"
            style={{
              right: 0,
              background: `linear-gradient(to bottom, transparent, ${colors.stroke}, transparent)`,
              boxShadow: `0 0 10px ${colors.glow}`,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DataStream;
