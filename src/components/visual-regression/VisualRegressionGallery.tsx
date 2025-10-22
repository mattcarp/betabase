"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Grid3x3,
  List,
  Download,
  RefreshCw,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  VisualRegressionComparison,
  ComparisonStatus,
  VisualRegressionTestResult,
} from "../../types/visual-regression";

interface VisualRegressionGalleryProps {
  testResult: VisualRegressionTestResult;
  onSelectComparison: (comparison: VisualRegressionComparison) => void;
  onRefresh?: () => Promise<void>;
  onExport?: () => void;
  className?: string;
  viewMode?: "grid" | "list";
}

/**
 * VisualRegressionGallery Component
 *
 * Gallery view of all visual regression comparisons for a test suite.
 * Features:
 * - Grid and list view modes
 * - Filtering by status (pending, approved, rejected)
 * - Search by test name
 * - Quick status overview
 * - Thumbnail previews with diff indicators
 * - Bulk operations
 */
export const VisualRegressionGallery: React.FC<VisualRegressionGalleryProps> = ({
  testResult,
  onSelectComparison,
  onRefresh,
  onExport,
  className,
  viewMode: initialViewMode = "grid",
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);
  const [filterStatus, setFilterStatus] = useState<ComparisonStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter comparisons
  const filteredComparisons = testResult.comparisons.filter((comparison) => {
    const matchesStatus = filterStatus === "all" || comparison.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      comparison.testName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: testResult.comparisons.length,
    pending: testResult.comparisons.filter((c) => c.status === "pending").length,
    approved: testResult.comparisons.filter((c) => c.status === "approved").length,
    rejected: testResult.comparisons.filter((c) => c.status === "rejected").length,
    baselineUpdated: testResult.comparisons.filter((c) => c.status === "baseline-updated").length,
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error("Failed to refresh:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get status icon and color
  const getStatusDisplay = (status: ComparisonStatus) => {
    const displays = {
      pending: {
        icon: AlertTriangle,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/20",
      },
      approved: {
        icon: CheckCircle,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/20",
      },
      rejected: {
        icon: XCircle,
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/20",
      },
      "baseline-updated": {
        icon: RefreshCw,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20",
      },
    };

    return displays[status] || displays.pending;
  };

  // Render comparison card
  const renderComparisonCard = (comparison: VisualRegressionComparison) => {
    const statusDisplay = getStatusDisplay(comparison.status);
    const StatusIcon = statusDisplay.icon;
    const pixelDiff = comparison.diff?.pixelDifference || 0;

    if (viewMode === "grid") {
      return (
        <Card
          key={comparison.id}
          className={cn(
            "cursor-pointer transition-all hover:shadow-lg",
            statusDisplay.borderColor,
            statusDisplay.bgColor
          )}
          onClick={() => onSelectComparison(comparison)}
        >
          <CardContent className="p-4 space-y-3">
            {/* Thumbnail */}
            <div className="relative aspect-video bg-muted rounded overflow-hidden">
              <img
                src={comparison.current.url}
                alt={comparison.testName}
                className="w-full h-full object-cover"
              />
              {comparison.diff && pixelDiff > 0 && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                  <Badge variant="destructive" className="text-xs">
                    {pixelDiff.toFixed(1)}% diff
                  </Badge>
                </div>
              )}
              <div className={cn("absolute top-2 right-2", statusDisplay.color)}>
                <StatusIcon className="h-5 w-5" />
              </div>
            </div>

            {/* Info */}
            <div>
              <h4 className="text-sm font-medium truncate">{comparison.testName}</h4>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  {comparison.metadata?.timestamp
                    ? new Date(comparison.metadata.timestamp).toLocaleDateString()
                    : "No date"}
                </span>
                {comparison.comments.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {comparison.comments.length} comments
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    } else {
      // List view
      return (
        <Card
          key={comparison.id}
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            statusDisplay.borderColor
          )}
          onClick={() => onSelectComparison(comparison)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Thumbnail */}
              <div className="relative w-32 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                <img
                  src={comparison.current.url}
                  alt={comparison.testName}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium truncate">{comparison.testName}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <StatusIcon className={cn("h-3 w-3", statusDisplay.color)} />
                  <span className="text-xs text-muted-foreground capitalize">
                    {comparison.status.replace("-", " ")}
                  </span>
                  {pixelDiff > 0 && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {pixelDiff.toFixed(2)}% difference
                      </span>
                    </>
                  )}
                  {comparison.comments.length > 0 && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {comparison.comments.length} comments
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Date */}
              <div className="text-xs text-muted-foreground flex-shrink-0">
                {comparison.metadata?.timestamp
                  ? new Date(comparison.metadata.timestamp).toLocaleString()
                  : "Unknown"}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{testResult.testName}</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                </Button>
                {onExport && (
                  <Button variant="outline" size="sm" onClick={onExport}>
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
                <div className="text-xs text-muted-foreground">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
                <div className="text-xs text-muted-foreground">Rejected</div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={filterStatus}
                onValueChange={(v) => setFilterStatus(v as ComparisonStatus | "all")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ({stats.total})</SelectItem>
                  <SelectItem value="pending">Pending ({stats.pending})</SelectItem>
                  <SelectItem value="approved">Approved ({stats.approved})</SelectItem>
                  <SelectItem value="rejected">Rejected ({stats.rejected})</SelectItem>
                  <SelectItem value="baseline-updated">
                    Updated ({stats.baselineUpdated})
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-1 border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Gallery */}
      <ScrollArea className="h-[600px]">
        {filteredComparisons.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-[400px] text-muted-foreground">
              No comparisons found matching your filters
            </CardContent>
          </Card>
        ) : (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-2"
            )}
          >
            {filteredComparisons.map(renderComparisonCard)}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default VisualRegressionGallery;
