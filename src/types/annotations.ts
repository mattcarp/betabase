/**
 * Annotation Types and Data Models
 * For test dashboard annotation tools
 */

export type AnnotationType = "highlight" | "note" | "screenshot" | "flag";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

export interface Position {
  x: number;
  y: number;
}

export interface DrawingPath {
  points: Position[];
  color: string;
  width: number;
}

export interface HighlightAnnotation {
  type: "highlight";
  paths: DrawingPath[];
}

export interface NoteAnnotation {
  type: "note";
  position: Position;
  text: string;
  markdownContent?: string;
}

export interface ScreenshotAnnotation {
  type: "screenshot";
  dataUrl: string;
  cropArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface FlagAnnotation {
  type: "flag";
  position: Position;
  severity: SeverityLevel;
  title: string;
  description: string;
}

export interface BaseAnnotation {
  id: string;
  timestamp: number;
  pageState: {
    url: string;
    scrollPosition: { x: number; y: number };
    viewportSize: { width: number; height: number };
  };
  createdAt: Date;
  updatedAt?: Date;
}

export type AnnotationData =
  | HighlightAnnotation
  | NoteAnnotation
  | ScreenshotAnnotation
  | FlagAnnotation;

export interface Annotation extends BaseAnnotation {
  data: AnnotationData;
}

export interface AnnotationPin {
  annotationId: string;
  timestamp: number;
  type: AnnotationType;
  previewText?: string;
}

export interface AnnotationSession {
  sessionId: string;
  annotations: Annotation[];
  createdAt: Date;
  lastModified: Date;
}
