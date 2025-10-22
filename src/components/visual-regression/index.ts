/**
 * Visual Regression Testing Components
 * Export all visual regression components for easy importing
 */

export { ImageComparisonSlider } from "./ImageComparisonSlider";
export { VisualRegressionComparison } from "./VisualRegressionComparison";
export { VisualRegressionGallery } from "./VisualRegressionGallery";

// Re-export types for convenience
export type {
  VisualRegressionComparison as VisualRegressionComparisonType,
  ScreenshotData,
  DiffData,
  DiffRegion,
  ComparisonStatus,
  ComparisonComment,
  VisualRegressionTestResult,
} from "../../types/visual-regression";
