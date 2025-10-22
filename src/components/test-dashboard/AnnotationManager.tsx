"use client";

import React, { useState } from "react";
import { AnnotationProvider, useAnnotations } from "../../contexts/AnnotationContext";
import { AnnotationToolbar } from "./AnnotationToolbar";
import { HighlighterCanvas } from "./HighlighterCanvas";
import { StickyNoteLayer } from "./StickyNoteLayer";
import { ScreenshotCapture } from "./ScreenshotCapture";
import { FlagIssueLayer } from "./FlagIssueLayer";
import { AnnotationPins } from "./AnnotationPins";
import { MarkdownNoteEditor } from "./MarkdownNoteEditor";
import { Annotation } from "../../types/annotations";

interface AnnotationManagerContentProps {
  timestamp: number;
  totalSteps: number;
  currentStep: number;
  onExportAnnotations?: () => void;
  onImportAnnotations?: () => void;
}

const AnnotationManagerContent: React.FC<AnnotationManagerContentProps> = ({
  timestamp,
  totalSteps,
  currentStep,
  onExportAnnotations,
  onImportAnnotations,
}) => {
  const { currentTool, annotations, saveSession } = useAnnotations();
  const [editorNoteId, setEditorNoteId] = useState<string | null>(null);

  const handleExport = () => {
    if (onExportAnnotations) {
      onExportAnnotations();
    } else {
      // Default export logic
      const dataStr = JSON.stringify(annotations, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `annotations-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = () => {
    if (onImportAnnotations) {
      onImportAnnotations();
    } else {
      // Default import logic
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json";
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const importedAnnotations = JSON.parse(event.target?.result as string);
            // In a real implementation, we would validate and merge
            console.log("Imported annotations:", importedAnnotations);
            alert("Annotations imported successfully!");
          } catch (error) {
            console.error("Failed to import annotations:", error);
            alert("Failed to import annotations. Please check the file format.");
          }
        };
        reader.readAsText(file);
      };
      input.click();
    }
  };

  const handlePinClick = (annotation: Annotation) => {
    console.log("Pin clicked:", annotation);
    // Could navigate to the timestamp or show annotation details
    if (annotation.data.type === "note") {
      setEditorNoteId(annotation.id);
    }
  };

  return (
    <>
      {/* Floating Toolbar */}
      <AnnotationToolbar onExport={handleExport} onImport={handleImport} />

      {/* Annotation Tools */}
      <HighlighterCanvas enabled={currentTool === "highlight"} timestamp={timestamp} />
      <StickyNoteLayer
        enabled={currentTool === "note"}
        timestamp={timestamp}
        onOpenDetailedEditor={(noteId) => setEditorNoteId(noteId)}
      />
      <ScreenshotCapture enabled={currentTool === "screenshot"} timestamp={timestamp} />
      <FlagIssueLayer enabled={currentTool === "flag"} timestamp={timestamp} />

      {/* Markdown Editor Modal */}
      <MarkdownNoteEditor
        noteId={editorNoteId || ""}
        isOpen={!!editorNoteId}
        onClose={() => setEditorNoteId(null)}
      />
    </>
  );
};

interface AnnotationManagerProps {
  timestamp: number;
  totalSteps: number;
  currentStep: number;
  onExportAnnotations?: () => void;
  onImportAnnotations?: () => void;
}

export const AnnotationManager: React.FC<AnnotationManagerProps> = (props) => {
  return (
    <AnnotationProvider>
      <AnnotationManagerContent {...props} />
    </AnnotationProvider>
  );
};

// Export AnnotationPins separately for use in TraceViewer
export { AnnotationPins };
