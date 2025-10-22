/**
 * Visual Regression Service
 * Handles API interactions for visual regression testing
 */

import {
  VisualRegressionComparison,
  VisualRegressionTestResult,
  ComparisonStatus,
  DiffData,
} from "../types/visual-regression";

export class VisualRegressionService {
  private apiBase = "/api/visual-regression";

  /**
   * Get all visual regression comparisons for a test
   */
  async getTestComparisons(testId: string): Promise<VisualRegressionTestResult> {
    const response = await fetch(`${this.apiBase}/test/${testId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch comparisons: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a specific comparison by ID
   */
  async getComparison(comparisonId: string): Promise<VisualRegressionComparison> {
    const response = await fetch(`${this.apiBase}/comparison/${comparisonId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch comparison: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Approve a visual regression comparison
   */
  async approveComparison(
    comparisonId: string,
    comment?: string
  ): Promise<VisualRegressionComparison> {
    const response = await fetch(`${this.apiBase}/comparison/${comparisonId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comment,
        approvedBy: "current-user", // Replace with actual user from auth context
        approvedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to approve comparison: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Reject a visual regression comparison
   */
  async rejectComparison(
    comparisonId: string,
    reason: string
  ): Promise<VisualRegressionComparison> {
    const response = await fetch(`${this.apiBase}/comparison/${comparisonId}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason,
        rejectedBy: "current-user", // Replace with actual user from auth context
        rejectedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to reject comparison: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update baseline screenshot
   */
  async updateBaseline(comparisonId: string): Promise<VisualRegressionComparison> {
    const response = await fetch(`${this.apiBase}/comparison/${comparisonId}/update-baseline`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        updatedBy: "current-user", // Replace with actual user from auth context
        updatedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update baseline: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Add a comment to a comparison
   */
  async addComment(
    comparisonId: string,
    comment: string,
    coordinates?: { x: number; y: number }
  ): Promise<VisualRegressionComparison> {
    const response = await fetch(`${this.apiBase}/comparison/${comparisonId}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comment,
        author: "current-user", // Replace with actual user from auth context
        coordinates,
        createdAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add comment: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate diff between two screenshots
   * This would typically be handled server-side using image processing libraries
   */
  async generateDiff(
    baselineUrl: string,
    currentUrl: string
  ): Promise<DiffData> {
    const response = await fetch(`${this.apiBase}/diff/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        baselineUrl,
        currentUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate diff: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Upload a screenshot
   */
  async uploadScreenshot(
    file: File,
    metadata: {
      testId: string;
      testName: string;
      type: "baseline" | "current";
    }
  ): Promise<{ url: string; width: number; height: number }> {
    const formData = new FormData();
    formData.append("screenshot", file);
    formData.append("metadata", JSON.stringify(metadata));

    const response = await fetch(`${this.apiBase}/screenshot/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload screenshot: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Batch approve comparisons
   */
  async batchApprove(
    comparisonIds: string[],
    comment?: string
  ): Promise<VisualRegressionComparison[]> {
    const response = await fetch(`${this.apiBase}/batch/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comparisonIds,
        comment,
        approvedBy: "current-user",
        approvedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to batch approve: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get comparison history for a test
   */
  async getComparisonHistory(
    testName: string,
    limit = 10
  ): Promise<VisualRegressionComparison[]> {
    const response = await fetch(
      `${this.apiBase}/history/${encodeURIComponent(testName)}?limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Export comparisons as JSON
   */
  async exportComparisons(testId: string): Promise<Blob> {
    const response = await fetch(`${this.apiBase}/test/${testId}/export`);

    if (!response.ok) {
      throw new Error(`Failed to export comparisons: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Get statistics for visual regression tests
   */
  async getStatistics(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    averageDiff: number;
  }> {
    const response = await fetch(`${this.apiBase}/statistics`);

    if (!response.ok) {
      throw new Error(`Failed to fetch statistics: ${response.statusText}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const visualRegressionService = new VisualRegressionService();
