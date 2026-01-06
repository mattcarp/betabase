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
  className?: string;
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
  className,
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
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
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
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card className="mac-card">
        <CardHeader className="mac-card">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{comparison.testName}</CardTitle>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
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

            <div className="flex items-center gap-2">
              {getStatusBadge(comparison.status)}
              <Button
                className="mac-button mac-button-outline"
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
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
        <Card className="mac-card">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-normal">
                  {comparison.diff.pixelDifference.toFixed(2)}%
                </div>
                <div className="text-sm text-muted-foreground">Pixel Difference</div>
              </div>
              <div>
                <div className="text-2xl font-normal">
                  {comparison.diff.pixelCount.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Changed Pixels</div>
              </div>
              <div>
                <div className="text-2xl font-normal">{comparison.diff.regions.length}</div>
                <div className="text-sm text-muted-foreground">Diff Regions</div>
              </div>
            </div>

            {comparison.diff.regions.length > 0 && (
              <div className="mt-4">
                <h4 className="mac-title">Difference Regions:</h4>
                <div className="space-y-1 text-xs">
                  {comparison.diff.regions.slice(0, 5).map((region, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          region.type === "added" && "border-green-500 text-green-500",
                          region.type === "removed" && "border-red-500 text-red-500",
                          region.type === "changed" && "border-yellow-500 text-yellow-500"
                        )}
                      >
                        {region.type}
                      </Badge>
                      <span className="text-muted-foreground">
                        x:{region.x} y:{region.y} {region.width}x{region.height}px
                      </span>
                    </div>
                  ))}
                  {comparison.diff.regions.length > 5 && (
                    <p className="mac-body text-muted-foreground">
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
        <Card className="mac-card">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={handleApprove}
                  disabled={isSubmitting}
                  className="mac-button flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Changes
                </Button>
                <Button onClick={handleReject}
                  disabled={isSubmitting || !comment.trim()}
                  variant="destructive"
                  className="mac-button mac-button-primary flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Changes
                </Button>
                <Button onClick={handleUpdateBaseline}
                  disabled={isSubmitting}
                  variant="outline"
                  className="mac-button mac-button-outline flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Update Baseline
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                {!comment.trim() && "Add a comment before rejecting changes"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Info */}
      {!isPending && comparison.approvedBy && (
        <Card className="mac-card border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-green-500" />
              <span>
                <strong>{comparison.approvedBy}</strong>{" "}
                {comparison.status === "approved" ? "approved" : "updated"} this comparison
              </span>
              {comparison.approvedAt && (
                <span className="text-muted-foreground">
                  on {new Date(comparison.approvedAt).toLocaleString()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      <Card className="mac-card">
        <CardHeader className="mac-card">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments ({localComments.length})
            </CardTitle>
            <Button
              className="mac-button mac-button-outline"
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
            >
              {showComments ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>

        {showComments && (
          <CardContent className="space-y-4">
            {/* Comment List */}
            {localComments.length > 0 && (
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-3">
                  {localComments.map((c) => (
                    <div key={c.id} className="border-l-2 border-muted pl-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-normal">{c.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {localComments.length > 0 && <Separator />}

            {/* Add Comment */}
            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment about this visual change..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                disabled={isSubmitting}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="mac-button mac-button-outline"
                  size="sm"
                  onClick={() => setComment("")}
                  disabled={!comment.trim() || isSubmitting}
                >
                  Clear
                </Button>
                <Button size="sm"
                  onClick={handleAddComment}
                  disabled={!comment.trim() || isSubmitting}
                 className="mac-button">
                  <Send className="h-3 w-3 mr-1" />
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
