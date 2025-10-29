"use client";

import React from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { Highlighter, StickyNote, Camera, Flag, X, Trash2, Download, Upload } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAnnotations } from "../../contexts/AnnotationContext";
import { AnnotationType } from "../../types/annotations";

interface AnnotationToolbarProps {
  className?: string;
  onExport?: () => void;
  onImport?: () => void;
}

export const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  className,
  onExport,
  onImport,
}) => {
  const { currentTool, setCurrentTool, annotations, clearAnnotations } = useAnnotations();

  const tools: Array<{
    type: AnnotationType;
    icon: React.ReactNode;
    label: string;
    color: string;
  }> = [
    {
      type: "highlight",
      icon: <Highlighter className="h-4 w-4" />,
      label: "Highlight",
      color: "text-yellow-500",
    },
    {
      type: "note",
      icon: <StickyNote className="h-4 w-4" />,
      label: "Note",
      color: "text-blue-500",
    },
    {
      type: "screenshot",
      icon: <Camera className="h-4 w-4" />,
      label: "Screenshot",
      color: "text-green-500",
    },
    {
      type: "flag",
      icon: <Flag className="h-4 w-4" />,
      label: "Flag Issue",
      color: "text-red-500",
    },
  ];

  const handleToolClick = (tool: AnnotationType) => {
    if (currentTool === tool) {
      setCurrentTool(null);
    } else {
      setCurrentTool(tool);
    }
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all annotations?")) {
      clearAnnotations();
    }
  };

  return (
    <Card
      className={cn(
        "mac-card",
        "fixed top-20 right-6 z-50 shadow-lg border-border bg-background/95 backdrop-blur-sm",
        className
      )}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-normal">Annotation Tools</span>
            {annotations.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {annotations.length}
              </Badge>
            )}
          </div>
          {currentTool && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 mac-button mac-button-outline"
              onClick={() => setCurrentTool(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <Separator />

        {/* Tool Buttons */}
        <div className="space-y-2">
          {tools.map((tool) => (
            <Button
              key={tool.type}
              variant={currentTool === tool.type ? "default" : "outline"}
              className={cn(
                "mac-button mac-button-primary",
                "w-full justify-start gap-2 transition-all",
                currentTool === tool.type && "ring-2 ring-primary"
              )}
              onClick={() => handleToolClick(tool.type)}
            >
              <span className={tool.color}>{tool.icon}</span>
              <span className="text-sm">{tool.label}</span>
            </Button>
          ))}
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs mac-button mac-button-outline"
            onClick={onExport}
            disabled={annotations.length === 0}
          >
            <Download className="h-3 w-3" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs mac-button mac-button-outline"
            onClick={onImport}
          >
            <Upload className="h-3 w-3" />
            Import
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="w-full gap-2 text-xs mac-button mac-button-primary"
            onClick={handleClearAll}
            disabled={annotations.length === 0}
          >
            <Trash2 className="h-3 w-3" />
            Clear All
          </Button>
        </div>

        {/* Current Tool Info */}
        {currentTool && (
          <div className="mt-4 p-2 rounded-md bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground">
              {currentTool === "highlight" && "Click and drag to draw highlights on the screen"}
              {currentTool === "note" && "Click anywhere to add a sticky note"}
              {currentTool === "screenshot" && "Click to capture screenshot (drag to crop)"}
              {currentTool === "flag" && "Click to flag an issue with severity level"}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
