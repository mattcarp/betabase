"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  Send,
  Download,
  RotateCcw,
  Calendar,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { ImageComparisonSlider } from "./ImageComparisonSlider";
import {
  VisualRegressionComparison as ComparisonType,
  ComparisonComment,
  ComparisonStatus,
} from "../../types/visual-regression";

interface VisualRegressionComparisonProps {
  comparison: ComparisonType;
  onApprove?: (id: string, comment?: string) => Promise<void>;
  onReject?: (id: string, reason: string) => Promise<void>;
  onUpdateBaseline?: (id: string) => Promise<void>;
  onAddComment?: (id: string, comment: string) => Promise<void>;
  cclassName?: string;
}

/**
 * VisualRegressionComparison Component
 *
 * Complete visual regression testing interface featuring:
 * - Side-by-side screenshot comparison with interactive slider
 * - Diff highlighting with pixel difference calculation
 * - Approve/reject workflow buttons
 * - Comment thread for collaboration
 * - Baseline update functionality
 * - Metadata display (browser, viewport, timestamp)
 */
export const VisualRegressionComparison: React.FC<VisualRegressionComparisonProps> = ({
  comparison,
  onApprove,
  onReject,
  onUpdateBaseline,
  onAddComment,
  cclassName,
}) => {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [localComments, setLocalComments] = useState<ComparisonComment[]>(
    comparison.comments || []
  );

  // Status badge styling
  const getStatusBadge = (status: ComparisonStatus) => {
    const variants = {
      pending: { variant: "secondary" as const, text: "Pending Review", icon: MessageSquare },
      approved: { variant: "default" as const, text: "Approved", icon: CheckCircle },
      rejected: { variant: "destructive" as const, text: "Rejected", icon: XCircle },
      "baseline-updated": {
        variant: "default" as const,
        text: "Baseline Updated",
        icon: RotateCcw,
      },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} cclassName="flex items-center gap-1">
        <Icon cclassName="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  // Handle approve action
  const handleApprove = async () => {
    if (!onApprove) return;

    setIsSubmitting(true);
    try {
      await onApprove(comparison.id, comment || undefined);
      setComment("");
    } catch (error) {
      console.error("Failed to approve comparison:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reject action
  const handleReject = async () => {
    if (!onReject || !comment.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    setIsSubmitting(true);
    try {
      await onReject(comparison.id, comment);
      setComment("");
    } catch (error) {
      console.error("Failed to reject comparison:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update baseline
  const handleUpdateBaseline = async () => {
    if (!onUpdateBaseline) return;

    if (
      !confirm(
        "Are you sure you want to update the baseline? This will replace the current baseline screenshot."
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdateBaseline(comparison.id);
    } catch (error) {
      console.error("Failed to update baseline:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle add comment
  const handleAddComment = async () => {
    if (!comment.trim() || !onAddComment) return;

    setIsSubmitting(true);
    try {
      await onAddComment(comparison.id, comment);

      // Optimistically add comment to local state
      const newComment: ComparisonComment = {
        id: `temp-${Date.now()}`,
        author: "Current User", // Replace with actual user
        content: comment,
        createdAt: new Date(),
      };
      setLocalComments([...localComments, newComment]);
      setComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download comparison data
  const handleDownload = () => {
    const data = {
      testName: comparison.testName,
      status: comparison.status,
      pixelDifference: comparison.diff?.pixelDifference,
      baseline: comparison.baseline,
      current: comparison.current,
      comments: localComments,
      metadata: comparison.metadata,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visual-regression-${comparison.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isPending = comparison.status === "pending";
  const pixelDiff = comparison.diff?.pixelDifference || 0;

  return (
    <div cclassName={cn("space-y-6", cclassName)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div cclassName="flex items-center justify-between">
            <div cclassName="space-y-1">
              <CardTitle cclassName="text-lg">{comparison.testName}</CardTitle>
              <div cclassName="flex items-center gap-3 text-sm text-muted-foreground">
                <div cclassName="flex items-center gap-1">
                  <Calendar cclassName="h-3 w-3" />
                  {comparison.metadata?.timestamp
                    ? new Date(comparison.metadata.timestamp).toLocaleString()
                    : "Unknown date"}
                </div>
                {comparison.metadata?.browser && (
                  <span>Browser: {comparison.metadata.browser}</span>
                )}
                {comparison.metadata?.viewport && (
                  <span>
                    Viewport: {comparison.metadata.viewport.width}x
                    {comparison.metadata.viewport.height}
                  </span>
                )}
              </div>
            </div>

            <div cclassName="flex items-center gap-2">
              {getStatusBadge(comparison.status)}
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download cclassName="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Image Comparison */}
      <ImageComparisonSlider
        baselineUrl={comparison.baseline.url}
        currentUrl={comparison.current.url}
        diffUrl={comparison.diff?.diffImageUrl}
        width={Math.max(comparison.baseline.width, comparison.current.width)}
        height={Math.max(comparison.baseline.height, comparison.current.height)}
        pixelDifference={pixelDiff}
      />

      {/* Diff Details */}
      {comparison.diff && (
        <Card>
          <CardContent cclassName="pt-6">
            <div cclassName="grid grid-cols-3 gap-4 text-center">
              <div>
                <div cclassName="text-2xl font-bold">
                  {comparison.diff.pixelDifference.toFixed(2)}%
                </div>
                <div cclassName="text-sm text-muted-foreground">Pixel Difference</div>
              </div>
              <div>
                <div cclassName="text-2xl font-bold">
                  {comparison.diff.pixelCount.toLocaleString()}
                </div>
                <div cclassName="text-sm text-muted-foreground">Changed Pixels</div>
              </div>
              <div>
                <div cclassName="text-2xl font-bold">{comparison.diff.regions.length}</div>
                <div cclassName="text-sm text-muted-foreground">Diff Regions</div>
              </div>
            </div>

            {comparison.diff.regions.length > 0 && (
              <div cclassName="mt-4">
                <h4 cclassName="text-sm font-medium mb-2">Difference Regions:</h4>
                <div cclassName="space-y-1 text-xs">
                  {comparison.diff.regions.slice(0, 5).map((region, idx) => (
                    <div key={idx} cclassName="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        cclassName={cn(
                          region.type === "added" && "border-green-500 text-green-500",
                          region.type === "removed" && "border-red-500 text-red-500",
                          region.type === "changed" && "border-yellow-500 text-yellow-500"
                        )}
                      >
                        {region.type}
                      </Badge>
                      <span cclassName="text-muted-foreground">
                        x:{region.x} y:{region.y} {region.width}x{region.height}px
                      </span>
                    </div>
                  ))}
                  {comparison.diff.regions.length > 5 && (
                    <p cclassName="text-muted-foreground">
                      ... and {comparison.diff.regions.length - 5} more regions
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {isPending && (
        <Card>
          <CardContent cclassName="pt-6">
            <div cclassName="space-y-4">
              <div cclassName="flex gap-2">
                <Button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  cclassName="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle cclassName="h-4 w-4 mr-2" />
                  Approve Changes
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={isSubmitting || !comment.trim()}
                  variant="destructive"
                  cclassName="flex-1"
                >
                  <XCircle cclassName="h-4 w-4 mr-2" />
                  Reject Changes
                </Button>
                <Button
                  onClick={handleUpdateBaseline}
                  disabled={isSubmitting}
                  variant="outline"
                  cclassName="flex-1"
                >
                  <RotateCcw cclassName="h-4 w-4 mr-2" />
                  Update Baseline
                </Button>
              </div>

              <div cclassName="text-xs text-muted-foreground text-center">
                {!comment.trim() && "Add a comment before rejecting changes"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Info */}
      {!isPending && comparison.approvedBy && (
        <Card cclassName="border-green-500/20 bg-green-500/5">
          <CardContent cclassName="pt-6">
            <div cclassName="flex items-center gap-2 text-sm">
              <User cclassName="h-4 w-4 text-green-500" />
              <span>
                <strong>{comparison.approvedBy}</strong>{" "}
                {comparison.status === "approved" ? "approved" : "updated"} this comparison
              </span>
              {comparison.approvedAt && (
                <span cclassName="text-muted-foreground">
                  on {new Date(comparison.approvedAt).toLocaleString()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <div cclassName="flex items-center justify-between">
            <CardTitle cclassName="text-base flex items-center gap-2">
              <MessageSquare cclassName="h-4 w-4" />
              Comments ({localComments.length})
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
              {showComments ? <EyeOff cclassName="h-4 w-4" /> : <Eye cclassName="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>

        {showComments && (
          <CardContent cclassName="space-y-4">
            {/* Comment List */}
            {localComments.length > 0 && (
              <ScrollArea cclassName="h-[200px] pr-4">
                <div cclassName="space-y-3">
                  {localComments.map((c) => (
                    <div key={c.id} cclassName="border-l-2 border-muted pl-3">
                      <div cclassName="flex items-center gap-2 mb-1">
                        <span cclassName="text-sm font-medium">{c.author}</span>
                        <span cclassName="text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p cclassName="text-sm text-muted-foreground">{c.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {localComments.length > 0 && <Separator />}

            {/* Add Comment */}
            <div cclassName="space-y-2">
              <Textarea
                placeholder="Add a comment about this visual change..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                disabled={isSubmitting}
              />
              <div cclassName="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setComment("")}
                  disabled={!comment.trim() || isSubmitting}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!comment.trim() || isSubmitting}
                >
                  <Send cclassName="h-3 w-3 mr-1" />
                  Add Comment
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default VisualRegressionComparison;
