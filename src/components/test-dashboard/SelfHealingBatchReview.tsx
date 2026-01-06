"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Checkbox } from "../ui/checkbox";
import { Slider } from "../ui/slider";
import {
  CheckCircle2,
  XCircle,
  Layers,
  Zap,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { getTierStyles, getStatusStyles } from "../../lib/mac-tier-styles";
import type { HealingAttemptSummary, HealingTier } from "./SelfHealingPriorityQueue";

interface GroupedAttempts {
  groupKey: string;
  groupLabel: string;
  attempts: HealingAttemptSummary[];
  avgConfidence: number;
  totalImpact: number;
  tier: HealingTier;
}

interface SelfHealingBatchReviewProps {
  attempts: HealingAttemptSummary[];
  onBatchApprove: (attemptIds: string[]) => void;
  onBatchReject: (attemptIds: string[], reason: string) => void;
  isProcessing?: boolean;
}

// Group attempts by similar selector patterns
const groupBySelectorPattern = (attempts: HealingAttemptSummary[]): GroupedAttempts[] => {
  const groups = new Map<string, HealingAttemptSummary[]>();

  attempts.forEach((attempt) => {
    // Extract pattern from selector (e.g., data-testid becomes a group)
    const pattern = extractSelectorPattern(attempt.originalSelector);
    if (!groups.has(pattern)) {
      groups.set(pattern, []);
    }
    groups.get(pattern)!.push(attempt);
  });

  return Array.from(groups.entries()).map(([key, groupAttempts]) => ({
    groupKey: key,
    groupLabel: getPatternLabel(key),
    attempts: groupAttempts,
    avgConfidence: groupAttempts.reduce((sum, a) => sum + a.confidence, 0) / groupAttempts.length,
    totalImpact: groupAttempts.reduce((sum, a) => sum + a.similarTestsAffected, 0),
    tier: Math.max(...groupAttempts.map((a) => a.tier)) as HealingTier,
  }));
};

const extractSelectorPattern = (selector: string): string => {
  // Extract the type of selector for grouping
  if (selector.includes("data-testid")) return "testid";
  if (selector.includes("aria-label")) return "aria";
  if (selector.includes("[role=")) return "role";
  if (selector.startsWith("#")) return "id";
  if (selector.startsWith(".")) return "class";
  return "other";
};

const getPatternLabel = (pattern: string): string => {
  switch (pattern) {
    case "testid":
      return "Test ID Selectors";
    case "aria":
      return "Accessibility Selectors";
    case "role":
      return "Role-based Selectors";
    case "id":
      return "ID Selectors";
    case "class":
      return "Class Selectors";
    default:
      return "Other Selectors";
  }
};

const getTierColor = (tier: HealingTier) => {
  return getTierStyles(tier);
};

export const SelfHealingBatchReview: React.FC<SelfHealingBatchReviewProps> = ({
  attempts,
  onBatchApprove,
  onBatchReject,
  isProcessing,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confidenceThreshold, setConfidenceThreshold] = useState([85]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);

  // Filter to only pending review items
  const reviewableAttempts = attempts.filter(
    (a) => a.status === "review" || a.status === "analyzing" || a.status === "healing"
  );

  // Group by selector pattern
  const groups = useMemo(() => groupBySelectorPattern(reviewableAttempts), [reviewableAttempts]);

  // Calculate stats
  const autoApproveEligible = reviewableAttempts.filter(
    (a) => a.confidence * 100 >= confidenceThreshold[0]
  );

  const selectedAttempts = reviewableAttempts.filter((a) => selectedIds.has(a.id));
  const totalImpact = selectedAttempts.reduce((sum, a) => sum + a.similarTestsAffected, 0);

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleGroupSelection = (group: GroupedAttempts) => {
    const newSelected = new Set(selectedIds);
    const allSelected = group.attempts.every((a) => selectedIds.has(a.id));

    if (allSelected) {
      group.attempts.forEach((a) => newSelected.delete(a.id));
    } else {
      group.attempts.forEach((a) => newSelected.add(a.id));
    }
    setSelectedIds(newSelected);
  };

  const toggleItem = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectByConfidence = () => {
    const newSelected = new Set<string>();
    reviewableAttempts
      .filter((a) => a.confidence * 100 >= confidenceThreshold[0])
      .forEach((a) => newSelected.add(a.id));
    setSelectedIds(newSelected);
  };

  const handleBatchApprove = () => {
    if (selectedIds.size > 0) {
      onBatchApprove(Array.from(selectedIds));
      setSelectedIds(new Set());
      setShowBatchConfirm(false);
    }
  };

  if (reviewableAttempts.length === 0) {
    return (
      <Card className="mac-card border-white/10 bg-black/20">
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-400 opacity-50" />
            <div>
              <h3 className="mac-title">No Items for Batch Review</h3>
              <p className="text-sm text-muted-foreground mt-1">
                All healing attempts have been processed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Batch Controls */}
      <Card className="mac-card border-white/10 bg-black/20">
        <CardHeader className="mac-card pb-4">
          <CardTitle className="flex items-center justify-between font-light text-lg">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary-400" />
              <span>Batch Review Mode</span>
            </div>
            <Badge variant="outline" className="text-white/60 border-white/20">
              {reviewableAttempts.length} items pending
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Confidence Threshold Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">
                Auto-select by confidence threshold
              </label>
              <span className="text-sm font-mono text-primary-400">{confidenceThreshold[0]}%+</span>
            </div>
            <Slider
              value={confidenceThreshold}
              onValueChange={setConfidenceThreshold}
              min={60}
              max={99}
              step={1}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>60% (More items)</span>
              <span>99% (Fewer items)</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-white/5">
            <Button
              variant="teal"
              size="sm"
              onClick={selectByConfidence}
            >
              <Zap className="h-4 w-4 mr-2" />
              Select {autoApproveEligible.length} items at {confidenceThreshold[0]}%+
            </Button>
            <Button className="mac-button"
              variant="ghost" className="mac-button mac-button-outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              disabled={selectedIds.size === 0}
            >
              Clear Selection
            </Button>
          </div>

          {/* Selection Summary */}
          {selectedIds.size > 0 && (
            <div className="p-4 rounded-lg bg-primary-400/10 border border-primary-400/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="mac-title">
                    {selectedIds.size} healing{selectedIds.size !== 1 ? "s" : ""} selected
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Will fix {selectedIds.size + totalImpact} test
                    {selectedIds.size + totalImpact !== 1 ? "s" : ""} total (including {totalImpact}{" "}
                    similar)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button className="mac-button"
                    variant="outline" className="mac-button mac-button-outline"
                    size="sm"
                    onClick={() => onBatchReject(Array.from(selectedIds), "batch-reject")}
                    disabled={isProcessing}
                    className={cn("hover:opacity-80", getStatusStyles.error)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject All
                  </Button>
                  <Button className="mac-button"
                    size="sm"
                    onClick={() => setShowBatchConfirm(true)}
                    disabled={isProcessing}
                    className={cn("hover:opacity-80", getStatusStyles.success)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Approve All
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Confirmation Modal */}
      {showBatchConfirm && (
        <Card className="mac-card border-green-500/30 bg-green-500/5">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-green-500/20">
                <CheckCircle2 className="h-6 w-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="mac-title">Confirm Batch Approval</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You are about to approve {selectedIds.size} healing attempt
                  {selectedIds.size !== 1 ? "s" : ""}. This action will:
                </p>
                <ul className="mt-3 space-y-1 text-sm text-white/80">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-green-400" />
                    Apply selector changes to {selectedIds.size} test file
                    {selectedIds.size !== 1 ? "s" : ""}
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-green-400" />
                    Auto-heal {totalImpact} additional similar test
                    {totalImpact !== 1 ? "s" : ""}
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-green-400" />
                    Mark all as approved in the healing history
                  </li>
                </ul>
                <div className="flex items-center gap-3 mt-4">
                  <Button
                    onClick={handleBatchApprove}
                    disabled={isProcessing}
                    className={cn("mac-button", "hover:opacity-80", getStatusStyles.success)}
                  >
                    {isProcessing ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirm Approval
                      </>
                    )}
                  </Button>
                  <Button className="mac-button"
                    variant="ghost" className="mac-button mac-button-outline"
                    onClick={() => setShowBatchConfirm(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grouped Items */}
      <Card className="mac-card border-white/10 bg-black/20">
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="divide-y divide-white/5">
              {groups.map((group) => {
                const isExpanded = expandedGroups.has(group.groupKey);
                const allSelected = group.attempts.every((a) => selectedIds.has(a.id));
                const someSelected = group.attempts.some((a) => selectedIds.has(a.id));

                return (
                  <div key={group.groupKey}>
                    {/* Group Header */}
                    <div
                      className={cn(
                        "flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors",
                        isExpanded && "bg-white/5"
                      )}
                      onClick={() => toggleGroup(group.groupKey)}
                    >
                      <Checkbox
                        checked={someSelected && !allSelected ? "indeterminate" : allSelected}
                        onCheckedChange={() => toggleGroupSelection(group)}
                        onClick={(e) => e.stopPropagation()}
                        className="border-white/30"
                      />

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="mac-title">{group.groupLabel}</h4>
                          <Badge
                            variant="outline"
                            className="text-xs text-white/60 border-white/20"
                          >
                            {group.attempts.length} item{group.attempts.length !== 1 ? "s" : ""}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn("text-xs", getTierColor(group.tier))}
                          >
                            Tier {group.tier}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Avg confidence: {(group.avgConfidence * 100).toFixed(0)}% | Impact:{" "}
                          {group.totalImpact} similar tests
                        </p>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    {/* Expanded Items */}
                    {isExpanded && (
                      <div className="bg-black/30 divide-y divide-white/5">
                        {group.attempts.map((attempt) => (
                          <div
                            key={attempt.id}
                            className={cn(
                              "flex items-start gap-3 p-4 pl-12 hover:bg-white/5 transition-colors cursor-pointer",
                              selectedIds.has(attempt.id) && "bg-primary-400/5"
                            )}
                            onClick={() => toggleItem(attempt.id)}
                          >
                            <Checkbox
                              checked={selectedIds.has(attempt.id)}
                              onCheckedChange={() => toggleItem(attempt.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="border-white/30 mt-0.5"
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-white truncate">
                                  {attempt.testName}
                                </span>
                                <span className="text-xs font-mono text-primary-400">
                                  {(attempt.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="mt-1 p-2 rounded bg-black/40 font-mono text-xs">
                                <div className="text-red-400/70 line-through truncate">
                                  {attempt.originalSelector}
                                </div>
                                <div className="text-green-400 truncate">
                                  {attempt.suggestedSelector}
                                </div>
                              </div>
                              {attempt.similarTestsAffected > 0 && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Layers className="h-3 w-3" />
                                  {attempt.similarTestsAffected} similar test
                                  {attempt.similarTestsAffected !== 1 ? "s" : ""} will also be fixed
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Warning for mixed tiers */}
      {selectedAttempts.some((a) => a.tier === 3) && (
        <Card className="mac-card border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
              <div>
                <h4 className="mac-title">Selection includes Tier 3 items</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Tier 3 items typically require architect review. Consider reviewing these
                  individually before batch approval.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SelfHealingBatchReview;
