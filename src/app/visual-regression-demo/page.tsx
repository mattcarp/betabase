"use client";

import React, { useState } from "react";
import {
  VisualRegressionComparison,
  VisualRegressionGallery,
  VisualRegressionComparisonType,
  VisualRegressionTestResult,
} from "@/components/visual-regression";
import { visualRegressionService } from "@/services/visualRegressionService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

/**
 * Visual Regression Demo Page
 * Demonstrates the visual regression testing tool with mock data
 */
export default function VisualRegressionDemoPage() {
  const [selectedComparison, setSelectedComparison] =
    useState<VisualRegressionComparisonType | null>(null);

  // Mock data for demonstration
  const mockTestResult: VisualRegressionTestResult = {
    testId: "test-1",
    testName: "SIAM Visual Regression Test Suite",
    suite: "Visual Tests",
    overallStatus: "pending",
    timestamp: new Date(),
    comparisons: [
      {
        id: "comp-1",
        testResultId: "test-1",
        testName: "Login Page Dark Theme",
        baseline: {
          url: "https://placehold.co/1920x1080/1a1a1a/ffffff?text=Baseline+Screenshot",
          width: 1920,
          height: 1080,
          capturedAt: new Date(Date.now() - 86400000),
        },
        current: {
          url: "https://placehold.co/1920x1080/2a2a2a/ffffff?text=Current+Screenshot",
          width: 1920,
          height: 1080,
          capturedAt: new Date(),
        },
        diff: {
          diffImageUrl: "https://placehold.co/1920x1080/ffff00/000000?text=Diff+Overlay",
          pixelDifference: 2.3,
          pixelCount: 47692,
          totalPixels: 2073600,
          regions: [
            { x: 100, y: 200, width: 400, height: 300, type: "changed" },
            { x: 600, y: 400, width: 200, height: 150, type: "added" },
            { x: 1200, y: 100, width: 300, height: 200, type: "removed" },
          ],
        },
        status: "pending",
        comments: [
          {
            id: "comment-1",
            author: "Matt Carpenter",
            content: "This looks like a background color change. Need to verify if intentional.",
            createdAt: new Date(Date.now() - 3600000),
          },
        ],
        metadata: {
          browser: "Chrome 120",
          viewport: { width: 1920, height: 1080 },
          timestamp: new Date(),
        },
      },
      {
        id: "comp-2",
        testResultId: "test-1",
        testName: "Chat Interface Message Bubble",
        baseline: {
          url: "https://placehold.co/1920x1080/1a1a1a/00ff00?text=Chat+Baseline",
          width: 1920,
          height: 1080,
          capturedAt: new Date(Date.now() - 86400000),
        },
        current: {
          url: "https://placehold.co/1920x1080/1a1a1a/00ff00?text=Chat+Current",
          width: 1920,
          height: 1080,
          capturedAt: new Date(),
        },
        diff: {
          diffImageUrl: "https://placehold.co/1920x1080/ff0000/ffffff?text=Chat+Diff",
          pixelDifference: 0.8,
          pixelCount: 16588,
          totalPixels: 2073600,
          regions: [{ x: 800, y: 400, width: 300, height: 100, type: "changed" }],
        },
        status: "approved",
        approvedBy: "Fiona Burgess",
        approvedAt: new Date(Date.now() - 1800000),
        comments: [],
        metadata: {
          browser: "Firefox 121",
          viewport: { width: 1920, height: 1080 },
          timestamp: new Date(),
        },
      },
      {
        id: "comp-3",
        testResultId: "test-1",
        testName: "Dashboard Analytics Cards",
        baseline: {
          url: "https://placehold.co/1920x1080/0a0a0a/ffffff?text=Dashboard+Baseline",
          width: 1920,
          height: 1080,
          capturedAt: new Date(Date.now() - 86400000),
        },
        current: {
          url: "https://placehold.co/1920x1080/0f0f0f/ffffff?text=Dashboard+Current",
          width: 1920,
          height: 1080,
          capturedAt: new Date(),
        },
        diff: {
          diffImageUrl: "https://placehold.co/1920x1080/ff6600/000000?text=Dashboard+Diff",
          pixelDifference: 5.2,
          pixelCount: 107827,
          totalPixels: 2073600,
          regions: [
            { x: 200, y: 300, width: 500, height: 400, type: "changed" },
            { x: 900, y: 200, width: 400, height: 500, type: "changed" },
          ],
        },
        status: "rejected",
        comments: [
          {
            id: "comment-2",
            author: "Test Engineer",
            content: "Rejected: Card spacing is inconsistent with design system. Please fix.",
            createdAt: new Date(Date.now() - 7200000),
          },
        ],
        metadata: {
          browser: "Safari 17",
          viewport: { width: 1920, height: 1080 },
          timestamp: new Date(),
        },
      },
      {
        id: "comp-4",
        testResultId: "test-1",
        testName: "Settings Page Form Elements",
        baseline: {
          url: "https://placehold.co/1920x1080/151515/ffffff?text=Settings+Baseline",
          width: 1920,
          height: 1080,
          capturedAt: new Date(Date.now() - 86400000),
        },
        current: {
          url: "https://placehold.co/1920x1080/151515/ffffff?text=Settings+Current",
          width: 1920,
          height: 1080,
          capturedAt: new Date(),
        },
        status: "baseline-updated",
        comments: [],
        metadata: {
          browser: "Edge 120",
          viewport: { width: 1920, height: 1080 },
          timestamp: new Date(),
        },
      },
    ],
  };

  // Handler functions
  const handleApprove = async (id: string, comment?: string) => {
    console.log("Approving comparison:", id, comment);
    await visualRegressionService.approveComparison(id, comment);
    alert("Comparison approved successfully!");
  };

  const handleReject = async (id: string, reason: string) => {
    console.log("Rejecting comparison:", id, reason);
    await visualRegressionService.rejectComparison(id, reason);
    alert("Comparison rejected successfully!");
  };

  const handleUpdateBaseline = async (id: string) => {
    console.log("Updating baseline for:", id);
    await visualRegressionService.updateBaseline(id);
    alert("Baseline updated successfully!");
  };

  const handleAddComment = async (id: string, comment: string) => {
    console.log("Adding comment to:", id, comment);
    await visualRegressionService.addComment(id, comment);
  };

  const handleRefresh = async () => {
    console.log("Refreshing comparisons...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const handleExport = () => {
    console.log("Exporting comparisons...");
    const data = JSON.stringify(mockTestResult, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "visual-regression-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Visual Regression Testing Tool Demo</CardTitle>
            <p className="text-muted-foreground mt-2">
              Comprehensive visual regression testing with side-by-side comparison, diff
              highlighting, and approval workflow.
            </p>
          </CardHeader>
        </Card>

        {/* Main Content */}
        {!selectedComparison ? (
          /* Gallery View */
          <VisualRegressionGallery
            testResult={mockTestResult}
            onSelectComparison={setSelectedComparison}
            onRefresh={handleRefresh}
            onExport={handleExport}
            viewMode="grid"
          />
        ) : (
          /* Detail View */
          <div className="space-y-4">
            <Button variant="outline" onClick={() => setSelectedComparison(null)} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Gallery
            </Button>

            <VisualRegressionComparison
              comparison={selectedComparison}
              onApprove={handleApprove}
              onReject={handleReject}
              onUpdateBaseline={handleUpdateBaseline}
              onAddComment={handleAddComment}
            />
          </div>
        )}

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✅ Side-by-side image comparison with draggable slider</li>
              <li>
                ✅ Diff overlay mode with color-coded changes (red=removed, green=added,
                yellow=changed)
              </li>
              <li>✅ Pixel difference percentage calculation</li>
              <li>✅ Approve/reject workflow with comments</li>
              <li>✅ Update baseline functionality</li>
              <li>✅ Comment threads for collaboration</li>
              <li>✅ Gallery view with filtering and search</li>
              <li>✅ Grid and list view modes</li>
              <li>✅ Export comparison data</li>
              <li>✅ Integration with test results</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
