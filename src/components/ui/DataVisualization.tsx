import React, { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "../../lib/utils";
import { CircularProfessionalProgress as RadialProgress } from "@/components/ui/ProfessionalProgress"

export interface DataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

export interface WaveformData {
  frequencies: number[];
  amplitudes: number[];
  timeData: number[];
}

export interface DataVisualizationProps {
  className?: string;
  data?: DataPoint[];
  waveformData?: WaveformData;
  type?: "waveform" | "spectrum" | "realtime" | "hybrid";
  width?: number;
  height?: number;
  color?: "primary" | "secondary" | "accent" | "warning" | "danger";
  showGrid?: boolean;
  animated?: boolean;
  glowEffect?: boolean;
  showMetrics?: boolean;
  onDataUpdate?: (data: DataPoint[]) => void;
}

const colorMap = {
  primary: {
    main: "var(--jarvis-primary)",
    glow: "rgba(0, 212, 255, 0.6)",
    gradient: "rgba(0, 212, 255, 0.3)",
  },
  secondary: {
    main: "var(--jarvis-secondary)",
    glow: "rgba(0, 153, 204, 0.6)",
    gradient: "rgba(0, 153, 204, 0.3)",
  },
  accent: {
    main: "var(--jarvis-accent)",
    glow: "rgba(0, 255, 136, 0.6)",
    gradient: "rgba(0, 255, 136, 0.3)",
  },
  warning: {
    main: "var(--jarvis-warning)",
    glow: "rgba(255, 170, 0, 0.6)",
    gradient: "rgba(255, 170, 0, 0.3)",
  },
  danger: {
    main: "var(--jarvis-danger)",
    glow: "rgba(255, 68, 68, 0.6)",
    gradient: "rgba(255, 68, 68, 0.3)",
  },
};

export const DataVisualization: React.FC<DataVisualizationProps> = ({
  className = "",
  data = [],
  waveformData,
  type = "realtime",
  width = 400,
  height = 200,
  color = "primary",
  showGrid = true,
  animated = true,
  glowEffect = true,
  showMetrics = true,
  onDataUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [metrics, setMetrics] = useState({
    peak: 0,
    average: 0,
    frequency: 0,
    quality: 85,
  });

  const colors = colorMap[color];

  // Generate empty data points for initialization
  const generateEmptyData = useCallback((): DataPoint[] => {
    return [];
  }, []);

  // Update metrics based on current data
  const updateMetrics = useCallback((currentData: DataPoint[]) => {
    if (currentData.length === 0) return;

    const values = currentData.map((d) => d.value);
    const peak = Math.max(...values);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const frequency =
      currentData.length > 1 &&
      currentData[currentData.length - 1] &&
      currentData[currentData.length - 2]
        ? 1000 /
          (currentData[currentData.length - 1]!.timestamp -
            currentData[currentData.length - 2]!.timestamp)
        : 0;

    setMetrics({
      peak: Math.round(peak),
      average: Math.round(average),
      frequency: Math.round(frequency * 10) / 10,
      quality: Math.round(85 + (average / 100) * 15),
    });
  }, []);

  // Draw visualization on canvas
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, currentData: DataPoint[]) => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Set up styles
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Draw grid if enabled
      if (showGrid) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;

        // Horizontal lines
        for (let i = 0; i <= 4; i++) {
          const y = (height / 4) * i;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Vertical lines
        for (let i = 0; i <= 8; i++) {
          const x = (width / 8) * i;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      }

      if (currentData.length < 2) return;

      // Draw waveform based on type
      switch (type) {
        case "waveform":
          drawWaveform(ctx, currentData);
          break;
        case "spectrum":
          drawSpectrum(ctx, currentData);
          break;
        case "realtime":
          drawRealtime(ctx, currentData);
          break;
        case "hybrid":
          drawHybrid(ctx, currentData);
          break;
      }
    },
    [width, height, showGrid, type, colors, glowEffect],
  );

  const drawWaveform = (
    ctx: CanvasRenderingContext2D,
    currentData: DataPoint[],
  ) => {
    const step = width / (currentData.length - 1);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, colors.main);
    gradient.addColorStop(1, colors.gradient);

    // Draw filled area
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, height);

    currentData.forEach((point, index) => {
      const x = index * step;
      const y = height - (point.value / 100) * height;
      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Draw line with glow effect
    if (glowEffect) {
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 10;
    }

    ctx.strokeStyle = colors.main;
    ctx.lineWidth = 2;
    ctx.beginPath();

    currentData.forEach((point, index) => {
      const x = index * step;
      const y = height - (point.value / 100) * height;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawSpectrum = (
    ctx: CanvasRenderingContext2D,
    currentData: DataPoint[],
  ) => {
    const barWidth = width / currentData.length;

    currentData.forEach((point, index) => {
      const barHeight = (point.value / 100) * height;
      const x = index * barWidth;
      const y = height - barHeight;

      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(0, y, 0, height);
      gradient.addColorStop(0, colors.main);
      gradient.addColorStop(1, colors.gradient);

      ctx.fillStyle = gradient;

      if (glowEffect) {
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 5;
      }

      ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
      ctx.shadowBlur = 0;
    });
  };

  const drawRealtime = (
    ctx: CanvasRenderingContext2D,
    currentData: DataPoint[],
  ) => {
    const step = width / (currentData.length - 1);

    // Draw multiple lines with different opacities for depth effect
    for (let layer = 0; layer < 3; layer++) {
      ctx.strokeStyle = `${colors.main}${(0.3 + layer * 0.3).toString(16).padStart(2, "0")}`;
      ctx.lineWidth = 3 - layer;

      if (glowEffect && layer === 0) {
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 8;
      }

      ctx.beginPath();

      currentData.forEach((point, index) => {
        const x = index * step;
        const offset = layer * 2;
        const y = height - ((point.value + offset) / 100) * height;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          const prevX = (index - 1) * step;
          const prevY =
            height -
            ((currentData[index - 1]?.value || 0 + offset) / 100) * height;

          // Smooth curves
          const cpX = (prevX + x) / 2;
          ctx.quadraticCurveTo(cpX, prevY, x, y);
        }
      });

      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  };

  const drawHybrid = (
    ctx: CanvasRenderingContext2D,
    currentData: DataPoint[],
  ) => {
    // Combine waveform and spectrum
    drawWaveform(ctx, currentData);

    // Add spectrum overlay with lower opacity
    ctx.globalAlpha = 0.3;
    drawSpectrum(ctx, currentData.slice(0, Math.floor(currentData.length / 2)));
    ctx.globalAlpha = 1;
  };

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let currentData = data.length > 0 ? data : generateEmptyData();
    if (currentData.length > 0) {
      updateMetrics(currentData);
    }

    const animate = () => {
      // Only draw when we have real data
      if (currentData.length > 0) {
        draw(ctx, currentData);
      }

      if (animated && data.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, animated, draw, generateEmptyData, updateMetrics]);

  // Update data when external data changes
  useEffect(() => {
    if (data.length > 0) {
      updateMetrics(data);
      onDataUpdate?.(data);
    }
  }, [data, updateMetrics, onDataUpdate]);

  return (
    <div className={cn("relative", className)} data-testid="data-visualization">
      {/* Canvas for visualization */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block bg-transparent"
        style={{
          filter: glowEffect
            ? `drop-shadow(0 0 5px ${colors.glow})`
            : undefined,
        }}
      />

      {/* Metrics overlay */}
      {showMetrics && (
        <div className="absolute top-2 right-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <RadialProgress
              value={metrics.peak}
              size={40}
              strokeWidth={3}
              color="danger"
              label="PEAK"
              showValue={false}
              glowEffect={false}
            />
            <RadialProgress
              value={metrics.average}
              size={40}
              strokeWidth={3}
              color="accent"
              label="AVG"
              showValue={false}
              glowEffect={false}
            />
          </div>

          <div className="text-xs text-holographic font-mono space-y-1">
            <div className="flex justify-between">
              <span className="opacity-70">FREQ:</span>
              <span className="text-[var(--jarvis-primary)]">
                {metrics.frequency}Hz
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">QUAL:</span>
              <span className="text-[var(--jarvis-accent)]">
                {metrics.quality}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Type indicator */}
      <div className="absolute bottom-2 left-2">
        <div className="text-xs text-holographic font-mono opacity-60 uppercase">
          {type}
        </div>
      </div>
    </div>
  );
};

export default DataVisualization;
