"use client";

import React, { useRef, useState, useEffect } from "react";
import { useAnnotations } from "../../contexts/AnnotationContext";
import { Annotation, DrawingPath, Position } from "../../types/annotations";
import { Button } from "../ui/button";
import { Palette, Eraser } from "lucide-react";
import { cn } from "../../lib/utils";

interface HighlighterCanvasProps {
  enabled: boolean;
  timestamp: number;
  cclassName?: string;
}

const COLORS = [
  { name: "Yellow", value: "var(--mac-highlight-yellow)" },
  { name: "Green", value: "var(--mac-highlight-green)" },
  { name: "Blue", value: "var(--mac-highlight-blue)" },
  { name: "Red", value: "var(--mac-highlight-red)" },
  { name: "Purple", value: "var(--mac-highlight-purple)" },
];

const WIDTHS = [3, 5, 8, 12];

export const HighlighterCanvas: React.FC<HighlighterCanvasProps> = ({
  enabled,
  timestamp,
  cclassName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Position[]>([]);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [selectedWidth, setSelectedWidth] = useState(WIDTHS[1]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const { addAnnotation, setIsDrawing: setContextDrawing } = useAnnotations();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redrawPaths();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  useEffect(() => {
    redrawPaths();
  }, [paths, currentPath]);

  const redrawPaths = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all completed paths
    paths.forEach((path) => {
      drawPath(ctx, path.points, path.color, path.width);
    });

    // Draw current path being drawn
    if (currentPath.length > 0) {
      drawPath(ctx, currentPath, selectedColor, selectedWidth);
    }
  };

  const drawPath = (
    ctx: CanvasRenderingContext2D,
    points: Position[],
    color: string,
    width: number
  ) => {
    if (points.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enabled) return;

    setIsDrawing(true);
    setContextDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setCurrentPath([
      {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      },
    ]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !enabled) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setCurrentPath((prev) => [
      ...prev,
      {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      },
    ]);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;

    setIsDrawing(false);
    setContextDrawing(false);

    if (currentPath.length > 0) {
      const newPath: DrawingPath = {
        points: currentPath,
        color: selectedColor,
        width: selectedWidth,
      };

      setPaths((prev) => [...prev, newPath]);

      // Save annotation if this is the first path or user finished drawing
      if (paths.length === 0 || !isDrawing) {
        saveAnnotation([...paths, newPath]);
      }

      setCurrentPath([]);
    }
  };

  const saveAnnotation = (allPaths: DrawingPath[]) => {
    const annotation: Annotation = {
      id: `highlight-${Date.now()}`,
      timestamp,
      pageState: {
        url: window.location.href,
        scrollPosition: {
          x: window.scrollX,
          y: window.scrollY,
        },
        viewportSize: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
      createdAt: new Date(),
      data: {
        type: "highlight",
        paths: allPaths,
      },
    };

    addAnnotation(annotation);
  };

  const handleClear = () => {
    setPaths([]);
    setCurrentPath([]);
  };

  if (!enabled) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        cclassName={cn(
          "fixed inset-0 z-40 pointer-events-auto",
          isDrawing && "cursor-crosshair",
          cclassName
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Tool Options */}
      <div cclassName="fixed top-32 right-6 z-50 space-y-2">
        <Button
          variant="outline"
          size="icon"
          cclassName="bg-background/95 backdrop-blur-sm mac-button mac-button-outline"
          onClick={() => setShowColorPicker(!showColorPicker)}
        >
          <Palette cclassName="h-4 w-4" />
        </Button>

        {showColorPicker && (
          <div cclassName="bg-background/95 backdrop-blur-sm border rounded-lg p-4 space-y-3 shadow-lg">
            {/* Color Selection */}
            <div cclassName="space-y-2">
              <p cclassName="text-xs font-medium">Color</p>
              <div cclassName="grid grid-cols-5 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.name}
                    cclassName={cn(
                      "w-8 h-8 rounded-md border-2 transition-all",
                      selectedColor === color.value
                        ? "border-primary scale-110"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setSelectedColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Width Selection */}
            <div cclassName="space-y-2">
              <p cclassName="text-xs font-medium">Width</p>
              <div cclassName="grid grid-cols-4 gap-2">
                {WIDTHS.map((width) => (
                  <button
                    key={width}
                    cclassName={cn(
                      "h-8 rounded-md border transition-all flex items-center justify-center",
                      selectedWidth === width
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background"
                    )}
                    onClick={() => setSelectedWidth(width)}
                  >
                    <div
                      cclassName="rounded-full bg-foreground"
                      style={{ width: width, height: width }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="icon"
          cclassName="bg-background/95 backdrop-blur-sm mac-button mac-button-outline"
          onClick={handleClear}
          title="Clear highlights"
        >
          <Eraser cclassName="h-4 w-4" />
        </Button>
      </div>
    </>
  );
};
