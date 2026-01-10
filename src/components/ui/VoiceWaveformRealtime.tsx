"use client";

import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { cn } from "../../lib/utils";

/**
 * Waveform visualization style options
 */
export type WaveformStyle = "bars" | "line" | "mirrored" | "circular";

/**
 * Audio source type for the waveform
 */
export type AudioSourceType = "microphone" | "stream" | "element";

/**
 * Props for the VoiceWaveformRealtime component
 */
export interface VoiceWaveformRealtimeProps {
  /** Whether the waveform is actively recording/processing audio */
  isActive?: boolean;
  /** Audio source type */
  sourceType?: AudioSourceType;
  /** External MediaStream to visualize (for stream sourceType) */
  mediaStream?: MediaStream | null;
  /** External HTMLMediaElement to visualize (for element sourceType) */
  mediaElement?: HTMLMediaElement | null;
  /** Waveform visualization style */
  style?: WaveformStyle;
  /** Primary color for the waveform (CSS color value) */
  primaryColor?: string;
  /** Secondary color for gradient/mirrored effects */
  secondaryColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Number of frequency bars (for bars style) */
  barCount?: number;
  /** Gap between bars in pixels */
  barGap?: number;
  /** Minimum bar height in pixels */
  minBarHeight?: number;
  /** Line width for line style */
  lineWidth?: number;
  /** FFT size for audio analysis (power of 2, 32-32768) */
  fftSize?: 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096 | 8192 | 16384 | 32768;
  /** Smoothing time constant (0-1) */
  smoothingTimeConstant?: number;
  /** Height of the component in pixels */
  height?: number;
  /** Whether to show a glow effect when active */
  showGlow?: boolean;
  /** Callback when voice activity is detected */
  onVoiceActivity?: (isActive: boolean) => void;
  /** Callback with current audio level (0-1) */
  onAudioLevel?: (level: number) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  "data-testid"?: string;
}

/**
 * Ref handle for imperative control
 */
export interface VoiceWaveformRealtimeRef {
  /** Start audio processing */
  start: () => Promise<void>;
  /** Stop audio processing */
  stop: () => void;
  /** Get current audio level (0-1) */
  getAudioLevel: () => number;
  /** Check if currently processing */
  isProcessing: () => boolean;
}

/**
 * Voice Activity Detection threshold
 */
const VAD_THRESHOLD = 0.02;

/**
 * VoiceWaveformRealtime - Real-time waveform visualization using Web Audio API
 *
 * Renders live audio waveform from microphone input, MediaStream, or HTMLMediaElement.
 * Uses requestAnimationFrame for smooth 60fps rendering with minimal CPU overhead.
 */
export const VoiceWaveformRealtime = forwardRef<VoiceWaveformRealtimeRef, VoiceWaveformRealtimeProps>(
  (
    {
      isActive = false,
      sourceType = "microphone",
      mediaStream = null,
      mediaElement = null,
      style = "bars",
      primaryColor = "var(--mac-primary-blue-400, #3B82F6)",
      secondaryColor = "var(--mac-primary-blue-600, #2563EB)",
      backgroundColor = "transparent",
      barCount = 64,
      barGap = 2,
      minBarHeight = 2,
      lineWidth = 2,
      fftSize = 256,
      smoothingTimeConstant = 0.8,
      height = 80,
      showGlow = true,
      onVoiceActivity,
      onAudioLevel,
      onError,
      className,
      "data-testid": testId = "voice-waveform-realtime",
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const currentLevelRef = useRef<number>(0);
    const wasVoiceActiveRef = useRef<boolean>(false);

    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    /**
     * Initialize Web Audio API context and analyser
     */
    const initAudio = useCallback(async () => {
      try {
        // Create AudioContext
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) {
          throw new Error("Web Audio API not supported in this browser");
        }

        audioContextRef.current = new AudioContextClass();

        // Create analyser node
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = smoothingTimeConstant;
        analyserRef.current = analyser;

        // Create data array for frequency data
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

        // Connect source based on sourceType
        if (sourceType === "microphone") {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          });
          streamRef.current = stream;
          sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        } else if (sourceType === "stream" && mediaStream) {
          sourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStream);
        } else if (sourceType === "element" && mediaElement) {
          sourceRef.current = audioContextRef.current.createMediaElementSource(mediaElement);
          // Connect to destination for playback
          analyser.connect(audioContextRef.current.destination);
        }

        if (sourceRef.current) {
          sourceRef.current.connect(analyser);
        }

        setIsProcessing(true);
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to initialize audio");
        setError(error);
        onError?.(error);
        console.error("VoiceWaveformRealtime: Audio initialization failed", err);
      }
    }, [sourceType, mediaStream, mediaElement, fftSize, smoothingTimeConstant, onError]);

    /**
     * Cleanup audio resources
     */
    const cleanup = useCallback(() => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }

      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }

      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      setIsProcessing(false);
    }, []);

    /**
     * Calculate RMS level from frequency data
     */
    const calculateLevel = useCallback((dataArray: Uint8Array): number => {
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = dataArray[i] / 255;
        sum += normalized * normalized;
      }
      return Math.sqrt(sum / dataArray.length);
    }, []);

    /**
     * Draw bars style waveform
     */
    const drawBars = useCallback((
      ctx: CanvasRenderingContext2D,
      dataArray: Uint8Array,
      width: number,
      height: number
    ) => {
      const barWidth = (width - (barCount - 1) * barGap) / barCount;
      const sliceWidth = Math.floor(dataArray.length / barCount);

      // Create gradient
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, secondaryColor);
      gradient.addColorStop(1, primaryColor);
      ctx.fillStyle = gradient;

      for (let i = 0; i < barCount; i++) {
        // Average the slice values
        let sum = 0;
        for (let j = 0; j < sliceWidth; j++) {
          sum += dataArray[i * sliceWidth + j];
        }
        const average = sum / sliceWidth;
        const barHeight = Math.max(minBarHeight, (average / 255) * height);

        const x = i * (barWidth + barGap);
        const y = (height - barHeight) / 2;

        // Draw rounded bar
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
        ctx.fill();
      }
    }, [barCount, barGap, minBarHeight, primaryColor, secondaryColor]);

    /**
     * Draw line style waveform
     */
    const drawLine = useCallback((
      ctx: CanvasRenderingContext2D,
      dataArray: Uint8Array,
      width: number,
      height: number
    ) => {
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();

      const sliceWidth = width / dataArray.length;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 255;
        const y = (1 - v) * height * 0.5 + height * 0.25;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();
    }, [primaryColor, lineWidth]);

    /**
     * Draw mirrored style waveform
     */
    const drawMirrored = useCallback((
      ctx: CanvasRenderingContext2D,
      dataArray: Uint8Array,
      width: number,
      height: number
    ) => {
      const barWidth = (width - (barCount - 1) * barGap) / barCount;
      const sliceWidth = Math.floor(dataArray.length / barCount);
      const centerY = height / 2;

      // Create gradient for top half
      const gradientTop = ctx.createLinearGradient(0, centerY, 0, 0);
      gradientTop.addColorStop(0, secondaryColor);
      gradientTop.addColorStop(1, primaryColor);

      // Create gradient for bottom half
      const gradientBottom = ctx.createLinearGradient(0, centerY, 0, height);
      gradientBottom.addColorStop(0, secondaryColor);
      gradientBottom.addColorStop(1, primaryColor);

      for (let i = 0; i < barCount; i++) {
        let sum = 0;
        for (let j = 0; j < sliceWidth; j++) {
          sum += dataArray[i * sliceWidth + j];
        }
        const average = sum / sliceWidth;
        const barHeight = Math.max(minBarHeight / 2, (average / 255) * (height / 2));

        const x = i * (barWidth + barGap);

        // Draw top bar
        ctx.fillStyle = gradientTop;
        ctx.beginPath();
        ctx.roundRect(x, centerY - barHeight, barWidth, barHeight, barWidth / 2);
        ctx.fill();

        // Draw bottom bar (mirrored)
        ctx.fillStyle = gradientBottom;
        ctx.beginPath();
        ctx.roundRect(x, centerY, barWidth, barHeight, barWidth / 2);
        ctx.fill();
      }
    }, [barCount, barGap, minBarHeight, primaryColor, secondaryColor]);

    /**
     * Draw circular style waveform
     */
    const drawCircular = useCallback((
      ctx: CanvasRenderingContext2D,
      dataArray: Uint8Array,
      width: number,
      height: number
    ) => {
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 3;
      const bars = Math.min(barCount, 128);
      const angleStep = (Math.PI * 2) / bars;

      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";

      const sliceWidth = Math.floor(dataArray.length / bars);

      for (let i = 0; i < bars; i++) {
        let sum = 0;
        for (let j = 0; j < sliceWidth; j++) {
          sum += dataArray[i * sliceWidth + j];
        }
        const average = sum / sliceWidth;
        const barLength = Math.max(minBarHeight, (average / 255) * radius);

        const angle = i * angleStep - Math.PI / 2;
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barLength);
        const y2 = centerY + Math.sin(angle) * (radius + barLength);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }, [barCount, primaryColor, lineWidth, minBarHeight]);

    /**
     * Animation loop for rendering
     */
    const draw = useCallback(() => {
      if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) {
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Get frequency data
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      // Calculate current level
      const level = calculateLevel(dataArrayRef.current);
      currentLevelRef.current = level;
      onAudioLevel?.(level);

      // Voice activity detection
      const isVoiceActive = level > VAD_THRESHOLD;
      if (isVoiceActive !== wasVoiceActiveRef.current) {
        wasVoiceActiveRef.current = isVoiceActive;
        onVoiceActivity?.(isVoiceActive);
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      if (backgroundColor !== "transparent") {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw waveform based on style
      switch (style) {
        case "bars":
          drawBars(ctx, dataArrayRef.current, canvas.width, canvas.height);
          break;
        case "line":
          drawLine(ctx, dataArrayRef.current, canvas.width, canvas.height);
          break;
        case "mirrored":
          drawMirrored(ctx, dataArrayRef.current, canvas.width, canvas.height);
          break;
        case "circular":
          drawCircular(ctx, dataArrayRef.current, canvas.width, canvas.height);
          break;
      }

      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(draw);
    }, [
      style,
      backgroundColor,
      calculateLevel,
      onAudioLevel,
      onVoiceActivity,
      drawBars,
      drawLine,
      drawMirrored,
      drawCircular,
    ]);

    /**
     * Start processing
     */
    const start = useCallback(async () => {
      if (isProcessing) return;
      await initAudio();
      animationFrameRef.current = requestAnimationFrame(draw);
    }, [isProcessing, initAudio, draw]);

    /**
     * Stop processing
     */
    const stop = useCallback(() => {
      cleanup();
    }, [cleanup]);

    // Expose imperative methods via ref
    useImperativeHandle(ref, () => ({
      start,
      stop,
      getAudioLevel: () => currentLevelRef.current,
      isProcessing: () => isProcessing,
    }), [start, stop, isProcessing]);

    // Handle isActive prop changes
    useEffect(() => {
      if (isActive) {
        start();
      } else {
        stop();
      }

      return () => {
        cleanup();
      };
    }, [isActive, start, stop, cleanup]);

    // Handle canvas resize
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width } = entry.contentRect;
          canvas.width = width * window.devicePixelRatio;
          canvas.height = height * window.devicePixelRatio;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
          }
        }
      });

      resizeObserver.observe(canvas.parentElement || canvas);

      return () => {
        resizeObserver.disconnect();
      };
    }, [height]);

    return (
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-lg",
          showGlow && isProcessing && "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
          className
        )}
        style={{ height: `${height}px` }}
        data-testid={testId}
        role="img"
        aria-label={isProcessing ? "Audio waveform visualization active" : "Audio waveform visualization inactive"}
        aria-live="polite"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{
            display: "block",
            backgroundColor: backgroundColor === "transparent" ? undefined : backgroundColor,
          }}
        />

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center text-sm text-destructive">
              <p className="font-medium">Audio Error</p>
              <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
            </div>
          </div>
        )}

        {/* Inactive state placeholder */}
        {!isProcessing && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-muted-foreground/30 rounded-full"
                  style={{
                    height: `${20 + Math.sin(i * 0.5) * 10}px`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Screen reader status */}
        <span className="sr-only">
          {isProcessing
            ? `Audio waveform is active. Current level: ${Math.round(currentLevelRef.current * 100)}%`
            : "Audio waveform is inactive"
          }
        </span>
      </div>
    );
  }
);

VoiceWaveformRealtime.displayName = "VoiceWaveformRealtime";

export default VoiceWaveformRealtime;
