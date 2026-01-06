"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  AlertTriangle,
  Bug,
  CheckCircle,
  Clock,
  Code,
  Copy,
  ExternalLink,
  FileCode,
  GitCompare,
  Image,
  Layers,
  Loader2,
  Play,
  Sparkles,
  Target,
  Wrench,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { HealingTier, HealingStatus } from "./SelfHealingPriorityQueue";

// Full healing attempt type with all details
export interface HealingAttemptDetail {
  id: string;
  testName: string;
  testFile: string;
  testLineNumber?: number;
  status: HealingStatus;
  tier: HealingTier;
  confidence: number;
  similarTestsAffected: number;
  affectedTestFiles?: string[];
  healingStrategy: "selector-update" | "wait-strategy" | "structure-adaptation" | "data-fix";
  timestamp: Date;
  originalSelector: string;
  suggestedSelector: string;
  selectorType?: string;
  healingRationale?: string;
  domChanges?: Array<{
    type: string;
    before?: string;
    after?: string;
    details?: string;
  }>;
  codeBefore?: string;
  codeAfter?: string;
  screenshot?: {
    before?: string;
    after?: string;
  };
  errorMessage?: string;
  errorStack?: string;
  executionTimeMs?: number;
  aiModel?: string;
  aiTokensUsed?: number;
}

interface SelfHealingDecisionStoryProps {
  attempt: HealingAttemptDetail;
  onApprove: (id: string) => void;
  onApproveAndTest?: (id: string) => void;
  onReject: (id: string, reason: string, notes?: string) => void;
  onEscalate?: (id: string) => void;
  onApplyFix?: (id: string) => void;
  isApplying?: boolean;
  onBack?: () => void;
}

// Screenshot Comparison Component
const ScreenshotComparison: React.FC<{
  before?: string;
  after?: string;
}> = ({ before, after }) => {
  const [viewMode, setViewMode] = useState<"side-by-side" | "overlay">("side-by-side");
  const [overlayPosition, setOverlayPosition] = useState(50);

  if (!before && !after) {
    return (
      <div className="rounded-lg border border-white/10 bg-black/20 p-8 text-center">
        <Image className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">
          No screenshots captured for this healing attempt
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="mac-title">
          <Image className="h-4 w-4" />
          Visual Comparison
        </h4>
        <div className="flex gap-1">
          <Button
            variant={viewMode === "side-by-side" ? "default" : "ghost"}
            size="sm"
            className="mac-button h-7 text-xs"
            onClick={() => setViewMode("side-by-side")}
          >
            Side by Side
          </Button>
          <Button
            variant={viewMode === "overlay" ? "default" : "ghost"}
            size="sm"
            className="mac-button h-7 text-xs"
            onClick={() => setViewMode("overlay")}
          >
            Overlay
          </Button>
        </div>
      </div>

      {viewMode === "side-by-side" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <span className="text-xs text-red-400 uppercase tracking-wide font-light">
              Before (Failed)
            </span>
            <div className="rounded-lg border border-red-500/20 bg-black/40 p-1.5 overflow-hidden aspect-video flex items-center justify-center">
              {before ? (
                <img
                  src={before.startsWith("data:") ? before : `data:image/png;base64,${before}`}
                  alt="Before screenshot"
                  className="max-w-full max-h-full object-contain rounded"
                />
              ) : (
                <span className="text-xs text-muted-foreground">No screenshot</span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-xs text-green-400 uppercase tracking-wide font-light">
              After (Current)
            </span>
            <div className="rounded-lg border border-green-500/20 bg-black/40 p-1.5 overflow-hidden aspect-video flex items-center justify-center">
              {after ? (
                <img
                  src={after.startsWith("data:") ? after : `data:image/png;base64,${after}`}
                  alt="After screenshot"
                  className="max-w-full max-h-full object-contain rounded"
                />
              ) : (
                <span className="text-xs text-muted-foreground">No screenshot</span>
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === "overlay" && (before || after) && (
        <div className="space-y-2">
          <div className="relative rounded-lg border border-white/10 bg-black/40 overflow-hidden aspect-video">
            {before && (
              <img
                src={before.startsWith("data:") ? before : `data:image/png;base64,${before}`}
                alt="Before screenshot"
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}
            {after && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${overlayPosition}%` }}
              >
                <img
                  src={after.startsWith("data:") ? after : `data:image/png;base64,${after}`}
                  alt="After screenshot"
                  className="h-full object-contain"
                  style={{ width: `${100 / (overlayPosition / 100)}%` }}
                />
              </div>
            )}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-primary-500 cursor-ew-resize"
              style={{ left: `${overlayPosition}%` }}
            />
          </div>
          <input className="mac-input"
            type="range"
            min="0"
            max="100"
            value={overlayPosition}
            onChange={(e) => setOverlayPosition(Number(e.target.value))}
            className="w-full accent-primary-500"
          />
        </div>
      )}
    </div>
  );
};

// Section Component for consistent styling
const StorySection: React.FC<{
  title: string;
  icon: React.ReactNode;
  iconColor?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}> = ({
  title,
  icon,
  iconColor = "text-primary-400",
  children,
  collapsible = false,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 overflow-hidden">
      <button
        className={cn("mac-button", 
          "w-full flex items-center justify-between p-4 text-left",
          collapsible && "hover:bg-white/5 cursor-pointer"
        )}
        onClick={() => collapsible && setIsOpen(!isOpen)}
        disabled={!collapsible}
      >
        <div className="flex items-center gap-3">
          <div className={cn("h-5 w-5", iconColor)}>{icon}</div>
          <span className="text-sm font-light text-white">{title}</span>
        </div>
        {collapsible &&
          (isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ))}
      </button>
      {(!collapsible || isOpen) && <div className="px-4 pb-4 pt-0">{children}</div>}
    </div>
  );
};

export const SelfHealingDecisionStory: React.FC<SelfHealingDecisionStoryProps> = ({
  attempt,
  onApprove,
  onApproveAndTest,
  onReject,
  onEscalate,
  onApplyFix,
  isApplying,
  onBack,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [rejectNotes, setRejectNotes] = useState("");

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Tier styling
  const getTierInfo = (tier: HealingTier) => {
    switch (tier) {
      case 1:
        return {
          label: "Tier 1: Auto-Approve Candidate",
          color: "bg-green-500/10 text-green-400 border-green-500/20",
          description: "High confidence (>90%) - Safe for automatic healing",
        };
      case 2:
        return {
          label: "Tier 2: Review Required",
          color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          description: "Medium confidence (60-90%) - Human review recommended",
        };
      case 3:
        return {
          label: "Tier 3: Architect Review",
          color: "bg-red-500/10 text-red-400 border-red-500/20",
          description: "Low confidence (<60%) - Complex change requiring expert review",
        };
    }
  };

  const tierInfo = getTierInfo(attempt.tier);

  // Risk assessment
  const getRisk = () => {
    if (attempt.confidence >= 0.95) return { level: "LOW", color: "text-green-400" };
    if (attempt.confidence >= 0.7) return { level: "MEDIUM", color: "text-amber-400" };
    return { level: "HIGH", color: "text-red-400" };
  };
  const risk = getRisk();

  // Healing strategy info
  const getStrategyInfo = (strategy: string) => {
    switch (strategy) {
      case "selector-update":
        return {
          icon: <Target className="h-4 w-4" />,
          label: "Selector Update",
          description: "Element identifier changed",
        };
      case "wait-strategy":
        return {
          icon: <Clock className="h-4 w-4" />,
          label: "Wait Strategy",
          description: "Timing or async issue",
        };
      case "structure-adaptation":
        return {
          icon: <GitCompare className="h-4 w-4" />,
          label: "Structure Adaptation",
          description: "DOM structure changed",
        };
      case "data-fix":
        return {
          icon: <FileCode className="h-4 w-4" />,
          label: "Data Fix",
          description: "Test data needs update",
        };
      default:
        return { icon: <Wrench className="h-4 w-4" />, label: "Unknown", description: "" };
    }
  };
  const strategyInfo = getStrategyInfo(attempt.healingStrategy);

  // Calculate estimated time saved
  const estimatedTimeSaved = Math.round((attempt.similarTestsAffected + 1) * 15); // 15 min per manual fix

  // Rejection reasons
  const rejectionReasons = [
    {
      value: "app_broke",
      label: "App broke - selector was correct",
      description: "This is a real bug, not a test issue",
    },
    {
      value: "wrong_suggestion",
      label: "AI suggested wrong fix",
      description: "The proposed selector is incorrect",
    },
    {
      value: "intentional_change",
      label: "Intentional change - test redesign needed",
      description: "Feature changed, test needs rewriting",
    },
    {
      value: "needs_manual",
      label: "Needs manual fix",
      description: "Too complex for automated healing",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="mac-button text-muted-foreground">
            <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
            Back to Queue
          </Button>
        )}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-sm px-3 py-1", tierInfo.color)}>
            {tierInfo.label}
          </Badge>
          <span className={cn("text-sm font-mono", risk.color)}>Risk: {risk.level}</span>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)] pr-4">
        <div className="space-y-4">
          {/* 1. WHAT HAPPENED */}
          <StorySection title="What Happened" icon={<Bug />} iconColor="text-red-400">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {attempt.healingRationale ||
                  `The selector "${attempt.originalSelector}" is no longer valid. The AI detected changes in the DOM structure and generated a fix.`}
              </p>
              <div className="flex items-center gap-3">
                {strategyInfo.icon}
                <div>
                  <span className="text-sm font-light text-white">{strategyInfo.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {strategyInfo.description}
                  </span>
                </div>
              </div>
            </div>
          </StorySection>

          {/* 2. WHY IT FAILED */}
          <StorySection title="Why It Failed" icon={<AlertTriangle />} iconColor="text-amber-400">
            <div className="space-y-3">
              <div className="rounded-md bg-black/40 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <FileCode className="h-3.5 w-3.5" />
                  <span>{attempt.testFile}</span>
                  {attempt.testLineNumber && <span>:line {attempt.testLineNumber}</span>}
                </div>
                <code className="text-xs font-mono text-red-400">
                  {attempt.codeBefore ||
                    `await page.locator('${attempt.originalSelector}').click();`}
                </code>
              </div>
              {attempt.errorMessage && (
                <div className="text-xs text-red-400/80 bg-red-500/10 rounded p-2 border border-red-500/20">
                  {attempt.errorMessage}
                </div>
              )}
              {attempt.domChanges && attempt.domChanges.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">DOM Changes Detected:</span>
                  {attempt.domChanges.map((change, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-black/30 rounded p-2 border border-white/5"
                    >
                      <Badge variant="outline" className="text-[10px] mb-1">
                        {change.type}
                      </Badge>
                      {change.before && <div className="text-red-400/70">- {change.before}</div>}
                      {change.after && <div className="text-green-400">+ {change.after}</div>}
                      {change.details && (
                        <div className="text-muted-foreground mt-1">{change.details}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </StorySection>

          {/* 3. PROPOSED FIX */}
          <StorySection title="Proposed Fix" icon={<Wrench />} iconColor="text-primary-400">
            <div className="space-y-4">
              {/* Confidence Meter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">AI Confidence</span>
                  <span className={cn("font-mono", risk.color)}>
                    {(attempt.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="relative h-2 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500 rounded-full",
                      attempt.confidence >= 0.9 && "bg-gradient-to-r from-green-500 to-green-400",
                      attempt.confidence >= 0.6 &&
                        attempt.confidence < 0.9 &&
                        "bg-gradient-to-r from-amber-500 to-amber-400",
                      attempt.confidence < 0.6 && "bg-gradient-to-r from-red-500 to-red-400"
                    )}
                    style={{ width: `${attempt.confidence * 100}%` }}
                  />
                </div>
              </div>

              {/* Code Diff */}
              <div className="rounded-lg border border-white/10 bg-black/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">Code Change</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mac-button h-6 text-xs"
                    onClick={() =>
                      copyToClipboard(
                        attempt.codeAfter ||
                          `await page.locator('${attempt.suggestedSelector}').click();`
                      )
                    }
                  >
                    {copySuccess ? (
                      <CheckCircle className="h-3 w-3 mr-1 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    {copySuccess ? "Copied" : "Copy"}
                  </Button>
                </div>
                <pre className="font-mono text-xs overflow-x-auto">
                  <code>
                    <div className="text-red-400/70 line-through mb-1">
                      -{" "}
                      {attempt.codeBefore ||
                        `await page.locator('${attempt.originalSelector}').click();`}
                    </div>
                    <div className="text-green-400">
                      +{" "}
                      {attempt.codeAfter ||
                        `await page.locator('${attempt.suggestedSelector}').click();`}
                    </div>
                  </code>
                </pre>
              </div>

              {/* AI Model Info */}
              {attempt.aiModel && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-primary-400" />
                  <span>Generated by {attempt.aiModel}</span>
                  {attempt.executionTimeMs && (
                    <span className="ml-2">in {(attempt.executionTimeMs / 1000).toFixed(1)}s</span>
                  )}
                  {attempt.aiTokensUsed && (
                    <span className="ml-2">({attempt.aiTokensUsed} tokens)</span>
                  )}
                </div>
              )}
            </div>
          </StorySection>

          {/* 4. VISUAL PROOF */}
          <StorySection
            title="Visual Proof"
            icon={<Image />}
            iconColor="text-blue-400"
            collapsible={true}
            defaultOpen={!!attempt.screenshot?.before || !!attempt.screenshot?.after}
          >
            <ScreenshotComparison
              before={attempt.screenshot?.before}
              after={attempt.screenshot?.after}
            />
          </StorySection>

          {/* 5. IMPACT ANALYSIS */}
          <StorySection title="Impact Analysis" icon={<Layers />} iconColor="text-cyan-400">
            <div className="space-y-4">
              {/* Impact Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-primary-500/10 border border-primary-500/20 p-3 text-center">
                  <div className="text-2xl font-light text-primary-400">
                    {attempt.similarTestsAffected}
                  </div>
                  <div className="text-xs text-muted-foreground">Similar Tests</div>
                </div>
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center">
                  <div className="text-2xl font-light text-green-400">{estimatedTimeSaved}m</div>
                  <div className="text-xs text-muted-foreground">Time Saved</div>
                </div>
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-center">
                  <div className="text-2xl font-light text-blue-400">
                    {attempt.affectedTestFiles?.length || 1}
                  </div>
                  <div className="text-xs text-muted-foreground">Test Files</div>
                </div>
              </div>

              {/* Affected Files */}
              {attempt.affectedTestFiles && attempt.affectedTestFiles.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">Affected Test Files:</span>
                  <div className="space-y-1">
                    {attempt.affectedTestFiles.slice(0, 5).map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs bg-black/30 rounded px-2 py-1"
                      >
                        <FileCode className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{file}</span>
                      </div>
                    ))}
                    {attempt.affectedTestFiles.length > 5 && (
                      <span className="text-xs text-muted-foreground">
                        +{attempt.affectedTestFiles.length - 5} more files
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="rounded-lg bg-gradient-to-r from-primary-500/10 to-blue-500/10 border border-primary-500/20 p-4">
                <p className="text-sm text-white/90">
                  Approving this fix will automatically heal{" "}
                  <strong className="text-primary-400">
                    {attempt.similarTestsAffected} similar test
                    {attempt.similarTestsAffected !== 1 ? "s" : ""}
                  </strong>{" "}
                  across the codebase, saving an estimated{" "}
                  <strong className="text-green-400">{estimatedTimeSaved} minutes</strong> of manual
                  work.
                </p>
              </div>
            </div>
          </StorySection>

          {/* 6. DECISION */}
          <Card className="mac-card border-white/10 bg-black/20">
            <CardHeader className="mac-card pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-sm font-light text-white">Decision</span>
              </div>
            </CardHeader>
            <CardContent className="mac-card">
              {attempt.status === "review" ? (
                <div className="space-y-4">
                  {/* Primary Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="mac-button bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => (onApplyFix ? onApplyFix(attempt.id) : onApprove(attempt.id))}
                      disabled={isApplying}
                    >
                      {isApplying ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Approve & Apply
                    </Button>
                    {onApproveAndTest && (
                      <Button
                        variant="outline"
                        className="mac-button border-green-500/30 text-green-400 hover:bg-green-500/10"
                        onClick={() => onApproveAndTest(attempt.id)}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Approve & Test First
                      </Button>
                    )}
                  </div>

                  {/* Secondary Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                    <Button
                      variant="outline"
                      className="mac-button border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onClick={() => setShowRejectModal(true)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    {attempt.tier !== 3 && onEscalate && (
                      <Button
                        variant="outline"
                        className="mac-button border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        onClick={() => onEscalate(attempt.id)}
                      >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Escalate to Tier 3
                      </Button>
                    )}
                    <Button variant="ghost" className="mac-button ml-auto" asChild>
                      <a
                        href={`vscode://file/${attempt.testFile}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open in VS Code
                      </a>
                    </Button>
                  </div>

                  {/* Rejection Modal */}
                  {showRejectModal && (
                    <div className="mt-4 p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                      <h4 className="mac-title">
                        Why are you rejecting this fix?
                      </h4>
                      <div className="space-y-2 mb-4">
                        {rejectionReasons.map((reason) => (
                          <label
                            key={reason.value}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                              rejectReason === reason.value
                                ? "border-red-500/50 bg-red-500/10"
                                : "border-white/10 hover:border-white/20"
                            )}
                          >
                            <input className="mac-input"
                              type="radio"
                              name="rejectReason"
                              value={reason.value}
                              checked={rejectReason === reason.value}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="mt-0.5 accent-red-500"
                            />
                            <div>
                              <span className="text-sm text-white">{reason.label}</span>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {reason.description}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                      <textarea
                        placeholder="Additional notes (optional)"
                        value={rejectNotes}
                        onChange={(e) => setRejectNotes(e.target.value)}
                        className="w-full h-20 px-3 py-2 text-sm bg-black/40 border border-white/10 rounded-lg resize-none focus:outline-none focus:border-primary-500/50"
                      />
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          className="mac-button border-red-500/30 text-red-400 hover:bg-red-500/10"
                          onClick={() => {
                            onReject(attempt.id, rejectReason, rejectNotes);
                            setShowRejectModal(false);
                          }}
                          disabled={!rejectReason}
                        >
                          Confirm Rejection
                        </Button>
                        <Button className="mac-button"
                          variant="ghost" className="mac-button mac-button-outline"
                          onClick={() => {
                            setShowRejectModal(false);
                            setRejectReason("");
                            setRejectNotes("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-black/20">
                  {attempt.status === "success" || attempt.status === "approved" ? (
                    <>
                      <CheckCircle className="h-6 w-6 text-green-400" />
                      <div>
                        <span className="text-sm text-white">Healing Approved</span>
                        <p className="text-xs text-muted-foreground">
                          Fix has been applied to the codebase
                        </p>
                      </div>
                    </>
                  ) : attempt.status === "failed" || attempt.status === "rejected" ? (
                    <>
                      <XCircle className="h-6 w-6 text-red-400" />
                      <div>
                        <span className="text-sm text-white">Healing Rejected</span>
                        <p className="text-xs text-muted-foreground">
                          Manual intervention required
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                      <div>
                        <span className="text-sm text-white">Processing</span>
                        <p className="text-xs text-muted-foreground">AI analysis in progress...</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export default SelfHealingDecisionStory;
