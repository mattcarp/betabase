"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { MoveHorizontal } from "lucide-react";

interface ImageComparisonSliderProps {
  baselineUrl: string;
  currentUrl: string;
  diffUrl?: string;
  width?: number;
  height?: number;
  pixelDifference?: number;
  className?: string;
  onPositionChange?: (position: number) => void;
}

/**
 * ImageComparisonSlider Component
 *
 * Provides a draggable slider to compare baseline and current screenshots.
 * Features:
 * - Side-by-side image comparison with draggable divider
 * - Visual diff overlay mode
 * - Pixel difference percentage display
 * - Responsive and touch-friendly
 */
export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
  baselineUrl,
  currentUrl,
  diffUrl,
  width = 800,
  height = 600,
  pixelDifference = 0,
  className,
  onPositionChange,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // 0-100 percentage
  const [isDragging, setIsDragging] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mouse/touch move
  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

    setSliderPosition(percentage);
    onPositionChange?.(percentage);
  };

  // Mouse events
  const handleMouseDown = () => setIsDragging(true);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch events
  const handleTouchStart = () => setIsDragging(true);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  // Keyboard controls for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setSliderPosition(Math.max(0, sliderPosition - 1));
    } else if (e.key === "ArrowRight") {
      setSliderPosition(Math.min(100, sliderPosition + 1));
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Badge
            variant={showDiff ? "outline" : "default"}
            className="cursor-pointer"
            onClick={() => setShowDiff(false)}
          >
            Side-by-Side
          </Badge>
          {diffUrl && (
            <Badge
              variant={showDiff ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setShowDiff(true)}
            >
              Diff Overlay
            </Badge>
          )}
        </div>

        {pixelDifference > 0 && (
          <Badge
            variant={
              pixelDifference < 1 ? "default" : pixelDifference < 5 ? "secondary" : "destructive"
            }
            className="text-xs"
          >
            {pixelDifference.toFixed(2)}% difference
          </Badge>
        )}
      </div>

      {/* Comparison Container */}
      <Card
        ref={containerRef}
        className={cn("relative overflow-hidden select-none", isDragging && "cursor-grabbing")}
        style={{ width, height }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {!showDiff ? (
          <>
            {/* Baseline Image (Left/Bottom) */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
              }}
            >
              <img
                src={baselineUrl}
                alt="Baseline screenshot"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                draggable={false}
              />
              <div className="absolute top-2 left-2 bg-green-500/90 text-white px-2 py-1 rounded text-xs font-medium">
                Baseline
              </div>
            </div>

            {/* Current Image (Right/Top) */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: `inset(0 0 0 ${sliderPosition}%)`,
              }}
            >
              <img
                src={currentUrl}
                alt="Current screenshot"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                draggable={false}
              />
              <div className="absolute top-2 right-2 bg-blue-500/90 text-white px-2 py-1 rounded text-xs font-medium">
                Current
              </div>
            </div>

            {/* Slider Handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10"
              style={{ left: `${sliderPosition}%` }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              {/* Handle Grip */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing">
                <MoveHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </>
        ) : (
          /* Diff Overlay Mode */
          <div className="relative w-full h-full">
            {/* Base current image */}
            <img
              src={currentUrl}
              alt="Current screenshot"
              className="absolute inset-0 w-full h-full object-contain opacity-50"
              draggable={false}
            />

            {/* Diff overlay */}
            {diffUrl && (
              <img
                src={diffUrl}
                alt="Difference overlay"
                className="absolute inset-0 w-full h-full object-contain mix-blend-multiply"
                draggable={false}
              />
            )}

            <div className="absolute top-2 left-2 bg-yellow-500/90 text-white px-2 py-1 rounded text-xs font-medium">
              Diff Overlay
            </div>
          </div>
        )}
      </Card>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Baseline (Expected)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Current (Actual)</span>
        </div>
        {showDiff && diffUrl && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Removed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded"></div>
              <span>Added</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Changed</span>
            </div>
          </>
        )}
      </div>

      {/* Instructions */}
      <p className="text-xs text-muted-foreground text-center">
        {!showDiff
          ? "Drag the slider or use arrow keys to compare images"
          : "Viewing difference overlay - Red: removed, Green: added, Yellow: changed"}
      </p>
    </div>
  );
};

export default ImageComparisonSlider;
