/**
 * Visual Regression Testing Types
 * Types for screenshot comparison, diff detection, and approval workflow
 */

export interface VisualRegressionComparison {
  id: string;
  testResultId: string;
  testName: string;
  baseline: ScreenshotData;
  current: ScreenshotData;
  diff?: DiffData;
  status: ComparisonStatus;
  approvedBy?: string;
  approvedAt?: Date;
  comments: ComparisonComment[];
  metadata?: {
    browser?: string;
    viewport?: { width: number; height: number };
    timestamp: Date;
  };
}

export interface ScreenshotData {
  url: string;
  width: number;
  height: number;
  capturedAt: Date;
  checksum?: string;
}

export interface DiffData {
  diffImageUrl: string;
  pixelDifference: number; // Percentage 0-100
  pixelCount: number; // Number of pixels that differ
  totalPixels: number;
  regions: DiffRegion[];
}

export interface DiffRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "added" | "removed" | "changed";
}

export type ComparisonStatus =
  | "pending" // Awaiting review
  | "approved" // Differences approved
  | "rejected" // Differences rejected, test must be fixed
  | "baseline-updated"; // New baseline set

export interface ComparisonComment {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
  x?: number; // Optional coordinates for pinned comments
  y?: number;
}

export interface VisualRegressionTestResult {
  testId: string;
  testName: string;
  suite: string;
  comparisons: VisualRegressionComparison[];
  overallStatus: ComparisonStatus;
  timestamp: Date;
}
