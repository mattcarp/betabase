"use client";

import React from "react";
import { cn } from "../../lib/utils";
import { Card, CardContent, CardHeader } from "./card";

/**
 * MAC Design System Skeleton Components for Test Intelligence
 *
 * Uses the mac-shimmer animation for smooth loading states.
 * All skeletons match the exact shape of the content being loaded.
 */

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton building block
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={cn("mac-shimmer rounded", className)} />
);

/**
 * Test list item skeleton - matches HistoricalTestExplorer test items
 */
export const TestListItemSkeleton: React.FC = () => (
  <div className="flex items-center justify-between p-4 border-b border-border">
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" /> {/* ID badge */}
        <Skeleton className="h-4 w-48" /> {/* Title */}
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-3 w-24" /> {/* App name */}
        <Skeleton className="h-3 w-20" /> {/* Last run */}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Skeleton className="h-6 w-12 rounded-full" /> {/* Confidence badge */}
      <Skeleton className="h-5 w-5 rounded" /> {/* Priority badge */}
    </div>
  </div>
);

/**
 * Test detail panel skeleton - matches the right panel in HistoricalTestExplorer
 */
export const TestDetailSkeleton: React.FC = () => (
  <div className="space-y-6 p-6">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-3 w-32" /> {/* VAULT ID */}
      <Skeleton className="h-7 w-64" /> {/* Title */}
      <Skeleton className="h-4 w-40" /> {/* App badge */}
    </div>

    {/* Confidence Gauge */}
    <Card className="mac-card bg-card/50 border-border">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-40" /> {/* Card title */}
      </CardHeader>
      <CardContent className="flex flex-col items-center py-4">
        <Skeleton className="h-[120px] w-[120px] rounded-full" /> {/* Gauge */}
        <div className="mt-4 space-y-2 w-full max-w-[180px]">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </CardContent>
    </Card>

    {/* Execution Summary */}
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="mac-card-static bg-card/30 border-border">
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-3 w-12" /> {/* Label */}
            <Skeleton className="h-8 w-16" /> {/* Value */}
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Actions */}
    <div className="flex gap-2">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-9 w-28" />
    </div>
  </div>
);

/**
 * KPI stat card skeleton
 */
export const KPICardSkeleton: React.FC = () => (
  <Card className="mac-card-static border-border bg-card/50">
    <CardContent className="p-2">
      <Skeleton className="h-2.5 w-16 mb-2" /> {/* Label */}
      <Skeleton className="h-6 w-12" /> {/* Value */}
    </CardContent>
  </Card>
);

/**
 * Stats row skeleton - for dashboard hero stats
 */
export const StatsRowSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
    {Array.from({ length: count }).map((_, i) => (
      <KPICardSkeleton key={i} />
    ))}
  </div>
);

/**
 * AI Generator input skeleton
 */
export const AIGeneratorSkeleton: React.FC = () => (
  <div className="space-y-4">
    <Skeleton className="h-4 w-48" /> {/* Label */}
    <Skeleton className="h-[120px] w-full rounded-lg" /> {/* Textarea */}
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-7 w-24 rounded-full" />
      ))}
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-10 w-full" /> {/* Select 1 */}
      <Skeleton className="h-10 w-full" /> {/* Select 2 */}
    </div>
    <Skeleton className="h-12 w-full rounded-lg" /> {/* Button */}
  </div>
);

/**
 * Generated test card skeleton
 */
export const GeneratedTestSkeleton: React.FC = () => (
  <Card className="mac-card border-border">
    <CardHeader>
      <Skeleton className="h-6 w-48" /> {/* Title */}
      <Skeleton className="h-4 w-64 mt-2" /> {/* Description */}
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[300px] w-full rounded-lg" /> {/* Code block */}
    </CardContent>
  </Card>
);

/**
 * Radar chart skeleton
 */
export const RadarChartSkeleton: React.FC = () => (
  <div className="flex items-center justify-center h-[200px]">
    <Skeleton className="h-[160px] w-[160px] rounded-full" />
  </div>
);

/**
 * Sparkline row skeleton
 */
export const SparklineRowSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 py-1 px-2">
    <Skeleton className="w-28 h-3" /> {/* Label */}
    <Skeleton className="flex-1 h-6" /> {/* Chart */}
    <Skeleton className="w-12 h-3" /> {/* Value */}
  </div>
);

export default Skeleton;
