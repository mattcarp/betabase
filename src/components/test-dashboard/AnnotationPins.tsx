"use client";

import React, { useMemo } from "react";
import { useAnnotations } from "../../contexts/AnnotationContext";
import { Annotation, AnnotationType } from "../../types/annotations";
import { Badge } from "../ui/badge";
import { Highlighter, StickyNote, Camera, Flag } from "lucide-react";
import { cn } from "../../lib/utils";

interface AnnotationPinsProps {
  currentStep: number;
  totalSteps: number;
  onPinClick?: (annotation: Annotation) => void;
  cclassName?: string;
}

interface PinInfo {
  annotation: Annotation;
  position: number; // 0-100 percentage on timeline
}

const getIconForType = (type: AnnotationType) => {
  switch (type) {
    case "highlight":
      return <Highlighter cclassName="h-3 w-3" />;
    case "note":
      return <StickyNote cclassName="h-3 w-3" />;
    case "screenshot":
      return <Camera cclassName="h-3 w-3" />;
    case "flag":
      return <Flag cclassName="h-3 w-3" />;
  }
};

const getColorForType = (type: AnnotationType) => {
  switch (type) {
    case "highlight":
      return "bg-yellow-500";
    case "note":
      return "bg-blue-500";
    case "screenshot":
      return "bg-green-500";
    case "flag":
      return "bg-red-500";
  }
};

export const AnnotationPins: React.FC<AnnotationPinsProps> = ({
  currentStep,
  totalSteps,
  onPinClick,
  cclassName,
}) => {
  const { annotations } = useAnnotations();

  const pins = useMemo<PinInfo[]>(() => {
    if (totalSteps === 0) return [];

    return annotations.map((annotation) => ({
      annotation,
      position: (annotation.timestamp / (totalSteps * 1000)) * 100,
    }));
  }, [annotations, totalSteps]);

  const getPreviewText = (annotation: Annotation): string => {
    switch (annotation.data.type) {
      case "note":
        return annotation.data.text || "Empty note";
      case "flag":
        return annotation.data.title;
      case "screenshot":
        return "Screenshot captured";
      case "highlight":
        return `${annotation.data.paths.length} highlights`;
      default:
        return "Annotation";
    }
  };

  if (pins.length === 0) return null;

  return (
    <div cclassName={cn("relative w-full h-8", cclassName)}>
      {/* Timeline bar */}
      <div cclassName="absolute inset-x-0 top-1/2 h-1 bg-muted/30 rounded-full" />

      {/* Pins */}
      {pins.map(({ annotation, position }) => (
        <div
          key={annotation.id}
          cclassName="absolute top-0 -translate-x-1/2 group"
          style={{ left: `${Math.min(Math.max(position, 0), 100)}%` }}
        >
          {/* Pin marker */}
          <button
            cclassName={cn(
              "relative flex items-center justify-center w-6 h-6 rounded-full",
              "border-2 border-background shadow-md transition-all",
              "hover:scale-125 hover:z-10",
              getColorForType(annotation.data.type)
            )}
            onClick={() => onPinClick?.(annotation)}
            title={getPreviewText(annotation)}
          >
            <span cclassName="text-white">{getIconForType(annotation.data.type)}</span>
          </button>

          {/* Tooltip on hover */}
          <div
            cclassName={cn(
              "absolute top-full left-1/2 -translate-x-1/2 mt-2",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "pointer-events-none z-50"
            )}
          >
            <div cclassName="bg-background border rounded-lg shadow-lg p-2 min-w-[150px]">
              <div cclassName="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  cclassName={cn("text-xs", getColorForType(annotation.data.type))}
                >
                  {annotation.data.type}
                </Badge>
              </div>
              <p cclassName="text-xs text-muted-foreground line-clamp-2">
                {getPreviewText(annotation)}
              </p>
              <p cclassName="text-xs text-muted-foreground mt-2">
                {new Date(annotation.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Count badge */}
      {annotations.length > 0 && (
        <div cclassName="absolute -top-1 right-0">
          <Badge variant="secondary" cclassName="text-xs">
            {annotations.length} annotation{annotations.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      )}
    </div>
  );
};
