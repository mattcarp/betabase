"use client";

import React, { useState } from "react";
import { useAnnotations } from "../../contexts/AnnotationContext";
import { Annotation, NoteAnnotation } from "../../types/annotations";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { X, Edit2, Check, FileText } from "lucide-react";
import { cn } from "../../lib/utils";

interface StickyNoteLayerProps {
  enabled: boolean;
  timestamp: number;
  className?: string;
  onOpenDetailedEditor?: (noteId: string) => void;
}

interface StickyNoteProps {
  annotation: Annotation;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onOpenEditor: (id: string) => void;
}

const StickyNote: React.FC<StickyNoteProps> = ({
  annotation,
  onUpdate,
  onDelete,
  onOpenEditor,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState((annotation.data as NoteAnnotation).text);

  const handleSave = () => {
    onUpdate(annotation.id, text);
    setIsEditing(false);
  };

  const position = (annotation.data as NoteAnnotation).position;

  return (
    <Card
      className={cn(
        "absolute shadow-lg border-yellow-400/50 bg-yellow-100/95 dark:bg-yellow-900/95",
        "min-w-[200px] max-w-[300px]",
        "backdrop-blur-sm"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3 text-yellow-700 dark:text-yellow-300" />
            <span className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">Note</span>
          </div>
          <div className="flex items-center gap-1">
            {isEditing ? (
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleSave}>
                <Check className="h-3 w-3" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => onOpenEditor(annotation.id)}
                  title="Open detailed editor"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => onDelete(annotation.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[80px] text-sm bg-yellow-50 dark:bg-yellow-950 border-yellow-300"
            autoFocus
          />
        ) : (
          <p
            className="text-sm text-yellow-900 dark:text-yellow-100 whitespace-pre-wrap cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            {text || "Click to add note..."}
          </p>
        )}

        {/* Timestamp */}
        <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-400">
          {new Date(annotation.createdAt).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};

export const StickyNoteLayer: React.FC<StickyNoteLayerProps> = ({
  enabled,
  timestamp,
  className,
  onOpenDetailedEditor,
}) => {
  const { annotations, addAnnotation, updateAnnotation, deleteAnnotation } = useAnnotations();

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled) return;

    const annotation: Annotation = {
      id: `note-${Date.now()}`,
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
        type: "note",
        position: {
          x: e.clientX,
          y: e.clientY,
        },
        text: "",
      },
    };

    addAnnotation(annotation);
  };

  const handleUpdateNote = (id: string, text: string) => {
    const annotation = annotations.find((ann) => ann.id === id);
    if (!annotation) return;

    updateAnnotation(id, {
      data: {
        ...annotation.data,
        text,
      } as NoteAnnotation,
    });
  };

  const noteAnnotations = annotations.filter((ann) => ann.data.type === "note");

  return (
    <>
      {/* Click layer for adding notes */}
      {enabled && (
        <div
          className={cn("fixed inset-0 z-40 cursor-crosshair", className)}
          onClick={handleClick}
        />
      )}

      {/* Sticky notes display */}
      {noteAnnotations.map((annotation) => (
        <div key={annotation.id} className="fixed inset-0 z-50 pointer-events-none">
          <div className="relative w-full h-full">
            <div className="pointer-events-auto">
              <StickyNote
                annotation={annotation}
                onUpdate={handleUpdateNote}
                onDelete={deleteAnnotation}
                onOpenEditor={(id) => onOpenDetailedEditor?.(id)}
              />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
