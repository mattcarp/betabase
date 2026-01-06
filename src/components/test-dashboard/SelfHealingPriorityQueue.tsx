"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Layers,
  Zap,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { getTierStyles, getRiskStyles } from "../../lib/mac-tier-styles";

// Types aligned with SelfHealingTestViewer
export type HealingTier = 1 | 2 | 3;
export type HealingStatus =
  | "detecting"
  | "analyzing"
  | "healing"
  | "testing"
  | "success"
  | "failed"
  | "review"
  | "approved"
  | "rejected";

export interface HealingAttemptSummary {
  id: string;
  testName: string;
  testFile: string;
  status: HealingStatus;
  tier: HealingTier;
  confidence: number;
  similarTestsAffected: number;
  healingStrategy: "selector-update" | "wait-strategy" | "structure-adaptation" | "data-fix";
  timestamp: Date;
  originalSelector: string;
  suggestedSelector: string;
}

interface SelfHealingPriorityQueueProps {
  attempts: HealingAttemptSummary[];
  onSelectAttempt: (attempt: HealingAttemptSummary) => void;
  onQuickApprove?: (attemptId: string) => void;
  selectedId?: string;
  isLoading?: boolean;
}

// Risk assessment based on confidence and tier
const getRiskLevel = (
  confidence: number,
  tier: HealingTier
): { level: "LOW" | "MEDIUM" | "HIGH"; explanation: string } => {
  if (confidence >= 0.95 && tier === 1) {
    return { level: "LOW", explanation: "High confidence semantic match" };
  }
  if (confidence >= 0.8 || tier === 2) {
    return { level: "MEDIUM", explanation: "Structural change detected" };
  }
  return { level: "HIGH", explanation: "Complex change - manual review recommended" };
};

const getRiskColor = (level: "LOW" | "MEDIUM" | "HIGH") => {
  return getRiskStyles(level);
};

const getLocalTierLabel = (tier: HealingTier) => {
  switch (tier) {
    case 1:
      return {
        label: "Auto-Approve Candidate",
        color: getTierStyles(1),
      };
    case 2:
      return {
        label: "Review Required",
        color: getTierStyles(2),
      };
    case 3:
      return { label: "Architect Review", color: getTierStyles(3) };
  }
};

export const SelfHealingPriorityQueue: React.FC<SelfHealingPriorityQueueProps> = ({
  attempts,
  onSelectAttempt,
  onQuickApprove,
  selectedId,
  isLoading,
}) => {
  const [sortBy, setSortBy] = React.useState<"impact" | "confidence" | "time">("impact");
  const [filterTier, setFilterTier] = React.useState<HealingTier | "all">("all");

  // Filter to only show items needing review
  const pendingAttempts = attempts.filter(
    (a) => a.status === "review" || a.status === "analyzing" || a.status === "healing"
  );

  // Apply filters
  const filteredAttempts = pendingAttempts.filter(
    (a) => filterTier === "all" || a.tier === filterTier
  );

  // Sort attempts
  const sortedAttempts = [...filteredAttempts].sort((a, b) => {
    switch (sortBy) {
      case "impact":
        return b.similarTestsAffected - a.similarTestsAffected;
      case "confidence":
        return b.confidence - a.confidence;
      case "time":
        return b.timestamp.getTime() - a.timestamp.getTime();
      default:
        return 0;
    }
  });

  // Stats
  const autoApproveCount = pendingAttempts.filter((a) => a.confidence >= 0.95).length;
  const tier2Count = pendingAttempts.filter((a) => a.tier === 2).length;
  const tier3Count = pendingAttempts.filter((a) => a.tier === 3).length;

  if (pendingAttempts.length === 0) {
    return (
      <Card className="mac-card border-white/10 bg-black/20">
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 mx-auto text-green-400 opacity-50" />
            <div>
              <h3 className="mac-title">All Caught Up</h3>
              <p className="text-sm text-muted-foreground mt-1">
                No healing attempts require your attention right now.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mac-card border-white/10 bg-black/20">
      <CardHeader className="mac-card pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-light text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <span>{pendingAttempts.length} Tests Need Your Attention</span>
          </CardTitle>
        </div>

        {/* Summary Badges */}
        <div className="flex items-center gap-2 mt-3">
          {autoApproveCount > 0 && (
            <Badge variant="outline" className={getTierStyles(1)}>
              <Zap className="h-3 w-3 mr-1" />
              {autoApproveCount} ready for auto-approve
            </Badge>
          )}
          {tier2Count > 0 && (
            <Badge variant="outline" className={getTierStyles(2)}>
              {tier2Count} need review
            </Badge>
          )}
          {tier3Count > 0 && (
            <Badge variant="outline" className={getTierStyles(3)}>
              {tier3Count} need architect
            </Badge>
          )}
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Filter:</span>
          </div>
          <div className="flex gap-1">
            {(["all", 1, 2, 3] as const).map((tier) => (
              <Button
                key={tier}
                variant={filterTier === tier ? "default" : "ghost"}
                size="sm"
                className="mac-button h-7 text-xs"
                onClick={() => setFilterTier(tier)}
              >
                {tier === "all" ? "All" : `Tier ${tier}`}
              </Button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="h-7 text-xs bg-black/40 border border-white/10 rounded px-2 text-white"
            >
              <option value="impact">Impact</option>
              <option value="confidence">Confidence</option>
              <option value="time">Recent</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="mac-card">
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {sortedAttempts.map((attempt, index) => {
              const risk = getRiskLevel(attempt.confidence, attempt.tier);
              const tierInfo = getLocalTierLabel(attempt.tier);

              return (
                <div
                  key={attempt.id}
                  className={cn(
                    "rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md group",
                    "bg-black/20 hover:bg-black/30",
                    selectedId === attempt.id && "ring-2 ring-primary-500 bg-primary-500/5"
                  )}
                  onClick={() => onSelectAttempt(attempt)}
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/5 text-sm font-light text-muted-foreground">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="mac-title">{attempt.testName}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{attempt.testFile}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-xs", tierInfo.color)}>
                      {tierInfo.label}
                    </Badge>
                  </div>

                  {/* Selector Change Preview */}
                  <div className="mb-3 p-2 rounded bg-black/40 font-mono text-xs">
                    <div className="text-red-400/70 line-through truncate">
                      {attempt.originalSelector}
                    </div>
                    <div className="text-green-400 truncate">{attempt.suggestedSelector}</div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4">
                    {/* Impact */}
                    {attempt.similarTestsAffected > 0 && (
                      <div className="flex items-center gap-1.5 text-primary-400">
                        <Layers className="h-3.5 w-3.5" />
                        <span className="text-xs">
                          {attempt.similarTestsAffected} similar test
                          {attempt.similarTestsAffected !== 1 ? "s" : ""} affected
                        </span>
                      </div>
                    )}

                    {/* Risk Level */}
                    <Badge variant="outline" className={cn("text-xs", getRiskColor(risk.level))}>
                      Risk: {risk.level}
                    </Badge>

                    {/* Confidence */}
                    <span className="text-xs text-muted-foreground font-mono">
                      {(attempt.confidence * 100).toFixed(0)}% confidence
                    </span>

                    {/* Time */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                      <Clock className="h-3 w-3" />
                      {attempt.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {/* Action Row */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <p className="text-xs text-muted-foreground italic">{risk.explanation}</p>
                    <div className="flex items-center gap-2">
                      {/* Quick approve for high confidence */}
                      {attempt.confidence >= 0.95 && onQuickApprove && (
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn("mac-button", "h-7 text-xs hover:opacity-80", getTierStyles(1))}
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickApprove(attempt.id);
                          }}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Quick Approve
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mac-button h-7 text-xs group-hover:bg-primary-500/10 group-hover:text-primary-400"
                      >
                        Review Now
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SelfHealingPriorityQueue;
