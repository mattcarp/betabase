/**
 * Annotation Tools - Export Index
 * Centralized exports for all annotation-related components
 */

export { AnnotationManager, AnnotationPins } from "../AnnotationManager";
export { AnnotationToolbar } from "../AnnotationToolbar";
export { HighlighterCanvas } from "../HighlighterCanvas";
export { StickyNoteLayer } from "../StickyNoteLayer";
export { ScreenshotCapture } from "../ScreenshotCapture";
export { FlagIssueLayer } from "../FlagIssueLayer";
export { MarkdownNoteEditor } from "../MarkdownNoteEditor";

export { AnnotationProvider, useAnnotations } from "../../../contexts/AnnotationContext";
export type {
  Annotation,
  AnnotationType,
  AnnotationData,
  AnnotationPin,
  AnnotationSession,
  SeverityLevel,
  HighlightAnnotation,
  NoteAnnotation,
  ScreenshotAnnotation,
  FlagAnnotation,
} from "../../../types/annotations";
