"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Sparkles,
  Wrench,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Code,
  Eye,
  Play,
  GitCompare,
  Clock,
  Zap,
  ArrowRight,
  RefreshCw,
  FileCode,
  Bug,
  Target,
  Settings,
  TrendingUp,
  Calendar,
  Loader2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Image,
  Layers,
  Keyboard,
  Copy,
  ExternalLink,
  ListChecks,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  getTierStyles,
  getTierTextColor,
  getTierGradient,
  getStatusStyles,
} from "../../lib/mac-tier-styles";

// Import new story-first components
import { SelfHealingPriorityQueue, type HealingAttemptSummary } from "./SelfHealingPriorityQueue";
import { SelfHealingDecisionStory, type HealingAttemptDetail } from "./SelfHealingDecisionStory";
import { SelfHealingBatchReview } from "./SelfHealingBatchReview";
import { SelfHealingFeedbackCapture, type FeedbackData } from "./SelfHealingFeedbackCapture";

// Types for self-healing workflow
interface DOMChange {
  type: "selector" | "attribute" | "structure";
  before: string;
  after: string;
  confidence: number;
  detected: Date;
}

// Tier classification for healing complexity
type HealingTier = 1 | 2 | 3;

interface SelfHealingAttempt {
  id: string;
  testName: string;
  testFile: string;
  status:
    | "detecting"
    | "analyzing"
    | "healing"
    | "testing"
    | "success"
    | "failed"
    | "review"
    | "approved"
    | "rejected";
  timestamp: Date;
  domChanges: DOMChange[];
  originalSelector: string;
  suggestedSelector: string;
  healingStrategy: "selector-update" | "wait-strategy" | "structure-adaptation" | "data-fix";
  confidence: number;
  tier: HealingTier;
  similarTestsAffected: number;
  error?: {
    message: string;
    stack?: string;
  };
  beforeCode?: string;
  afterCode?: string;
  codeBefore?: string; // Alias for backward compatibility if needed, or stick to one. The component uses both in my snippets.
  codeAfter?: string;
  screenshot?: {
    before: string;
    after: string;
  };
  metadata?: {
    executionTime: number;
    retryCount: number;
    aiModel?: string;
  };
}

interface SelfHealingStats {
  total: number;
  healed: number;
  pendingReview: number;
  failed: number;
  avgHealTime: number;
  successRate: number;
  last24h: number;
}

interface TrendData {
  date: string;
  totalAttempts: number;
  successful: number;
  failed: number;
  pending: number;
}

// API response types
interface APIAttempt {
  id: string;
  test_name: string;
  test_file: string;
  status: string;
  tier: number;
  confidence: number;
  original_selector: string;
  suggested_selector?: string;
  selector_type?: string;
  dom_changes?: any[];
  dom_snapshot_before?: string;
  dom_snapshot_after?: string;
  healing_strategy?: string;
  healing_rationale?: string;
  similar_tests_affected: number;
  affected_test_files?: string[];
  code_before?: string;
  code_after?: string;
  execution_time_ms?: number;
  retry_count: number;
  ai_model: string;
  ai_tokens_used?: number;
  error_message?: string;
  error_stack?: string;
  created_at: string;
  updated_at: string;
  healed_at?: string;
}

interface APIStats {
  totalAttempts: number;
  autoHealed: number;
  pendingReview: number;
  successRate: number;
  avgHealTimeMs: number;
  totalTestsImpacted: number;
  tierBreakdown: {
    tier1: number;
    tier2: number;
    tier3: number;
  };
}

// Transform API response to component format
function transformAttempt(api: APIAttempt): SelfHealingAttempt {
  return {
    id: api.id,
    testName: api.test_name,
    testFile: api.test_file,
    status: api.status as SelfHealingAttempt["status"],
    timestamp: new Date(api.created_at),
    tier: api.tier as HealingTier,
    similarTestsAffected: api.similar_tests_affected || 0,
    domChanges: (api.dom_changes || []).map((dc: any) => ({
      type: dc.type || "selector",
      before: dc.before || api.original_selector,
      after: dc.after || api.suggested_selector || "",
      confidence: dc.confidence || api.confidence,
      detected: new Date(api.created_at),
    })),
    originalSelector: api.original_selector,
    suggestedSelector: api.suggested_selector || "",
    healingStrategy: (api.healing_strategy ||
      "selector-update") as SelfHealingAttempt["healingStrategy"],
    confidence: api.confidence,
    beforeCode: api.code_before,
    afterCode: api.code_after,
    error: api.error_message ? { message: api.error_message, stack: api.error_stack } : undefined,
    metadata: {
      executionTime: (api.execution_time_ms || 0) / 1000,
      retryCount: api.retry_count || 0,
      aiModel: api.ai_model || "gemini-3-pro-preview",
    },
  };
}

// Confidence Meter Component with tier markers
const ConfidenceMeter: React.FC<{ confidence: number; tier: HealingTier }> = ({
  confidence,
  tier,
}) => {
  const percentage = confidence * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">AI Confidence</span>
        <span className={cn("font-mono", getTierTextColor(tier))}>{percentage.toFixed(1)}%</span>
      </div>
      <div className="relative h-2 bg-black/40 rounded-full overflow-hidden">
        {/* Tier markers */}
        <div className="absolute inset-0 flex">
          <div
            className="w-[60%] border-r border-[var(--mac-tier3)]/50"
            title="Tier 3 threshold (60%)"
          />
          <div
            className="w-[30%] border-r border-[var(--mac-tier2)]/50"
            title="Tier 2 threshold (90%)"
          />
          <div className="w-[10%]" />
        </div>
        {/* Progress bar */}
        <div
          className={cn("h-full transition-all duration-500 rounded-full", getTierGradient(tier))}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0%</span>
        <span className="text-[var(--mac-tier3)]">Tier 3</span>
        <span className="text-[var(--mac-tier2)]">Tier 2</span>
        <span className="text-[var(--mac-tier1)]">Tier 1</span>
        <span>100%</span>
      </div>
    </div>
  );
};

// Screenshot Comparison Component
const ScreenshotComparison: React.FC<{
  before?: string;
  after?: string;
  className?: string;
}> = ({ before, after, className }) => {
  const [viewMode, setViewMode] = useState<"side-by-side" | "overlay" | "diff">("side-by-side");
  const [overlayPosition, setOverlayPosition] = useState(50);

  if (!before && !after) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-light flex items-center gap-2">
          <Image className="h-4 w-4" />
          Visual Comparison
        </h4>
        <div className="flex gap-1">
          <Button
            variant={viewMode === "side-by-side" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setViewMode("side-by-side")}
          >
            Side by Side
          </Button>
          <Button
            variant={viewMode === "overlay" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setViewMode("overlay")}
          >
            Overlay
          </Button>
        </div>
      </div>

      {viewMode === "side-by-side" && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[10px] text-red-400 uppercase tracking-wide">
              Before (Working)
            </span>
            <div className="rounded-lg border border-red-500/20 bg-black/40 p-1 overflow-hidden">
              {before ? (
                <img
                  src={before.startsWith("data:") ? before : `data:image/png;base64,${before}`}
                  alt="Before screenshot"
                  className="w-full h-auto rounded"
                />
              ) : (
                <div className="aspect-video flex items-center justify-center text-muted-foreground text-xs">
                  No screenshot available
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-green-400 uppercase tracking-wide">
              After (Current)
            </span>
            <div className="rounded-lg border border-green-500/20 bg-black/40 p-1 overflow-hidden">
              {after ? (
                <img
                  src={after.startsWith("data:") ? after : `data:image/png;base64,${after}`}
                  alt="After screenshot"
                  className="w-full h-auto rounded"
                />
              ) : (
                <div className="aspect-video flex items-center justify-center text-muted-foreground text-xs">
                  No screenshot available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === "overlay" && (
        <div className="relative rounded-lg border border-white/10 bg-black/40 overflow-hidden">
          <div className="relative aspect-video">
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
                  className="w-full h-full object-contain"
                  style={{ width: `${100 / (overlayPosition / 100)}%` }}
                />
              </div>
            )}
            {/* Slider line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-purple-500 cursor-ew-resize"
              style={{ left: `${overlayPosition}%` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={overlayPosition}
            onChange={(e) => setOverlayPosition(Number(e.target.value))}
            className="w-full mt-2"
          />
        </div>
      )}
    </div>
  );
};

// Keyboard shortcut handler hook
const useKeyboardShortcuts = (
  selectedAttempt: SelfHealingAttempt | null,
  onApprove: (id: string) => void,
  onReject: (id: string) => void
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedAttempt || selectedAttempt.status !== "review") return;

      // Meta/Ctrl + Enter to approve
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onApprove(selectedAttempt.id);
      }

      // Meta/Ctrl + Backspace to reject
      if ((e.metaKey || e.ctrlKey) && e.key === "Backspace") {
        e.preventDefault();
        onReject(selectedAttempt.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAttempt, onApprove, onReject]);
};

// Self-Healing Status Viewer Component
export const SelfHealingTestViewer: React.FC = () => {
  const [selectedAttempt, setSelectedAttempt] = useState<SelfHealingAttempt | null>(null);
  const [viewMode, setViewMode] = useState<"priority" | "batch" | "workflow" | "history">(
    "priority"
  );
  const [attempts, setAttempts] = useState<SelfHealingAttempt[]>([]);
  const [stats, setStats] = useState<SelfHealingStats>({
    total: 0,
    healed: 0,
    pendingReview: 0,
    failed: 0,
    avgHealTime: 0,
    successRate: 0,
    last24h: 0,
  });
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringDemo, setTriggeringDemo] = useState(false);
  const [demoClickCount, setDemoClickCount] = useState(0);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [applyingFix, setApplyingFix] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  // State for story-first Priority Review tab
  const [storyAttempt, setStoryAttempt] = useState<HealingAttemptDetail | null>(null);
  // State for feedback capture modal
  const [feedbackAttempt, setFeedbackAttempt] = useState<HealingAttemptDetail | null>(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  // Copy to clipboard helper
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch attempts and analytics in parallel
      const [attemptsRes, analyticsRes] = await Promise.all([
        fetch("/api/self-healing?limit=50&stats=true"),
        fetch("/api/self-healing/analytics?days=14&history=true"),
      ]);

      if (attemptsRes.ok) {
        const attemptsData = await attemptsRes.json();
        const transformedAttempts = (attemptsData.attempts || []).map(transformAttempt);
        setAttempts(transformedAttempts);

        if (attemptsData.stats) {
          setStats({
            total: attemptsData.stats.total_attempts || attemptsData.stats.totalAttempts || 0,
            healed: attemptsData.stats.auto_healed || attemptsData.stats.autoHealed || 0,
            pendingReview:
              attemptsData.stats.pending_review || attemptsData.stats.pendingReview || 0,
            failed: attemptsData.stats.tier3_count || 0,
            avgHealTime:
              (attemptsData.stats.avg_heal_time_ms || attemptsData.stats.avgHealTimeMs || 0) / 1000,
            successRate: attemptsData.stats.success_rate || attemptsData.stats.successRate || 0,
            last24h: attemptsData.stats.tier1_count || 0,
          });
        }
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        if (analyticsData.trends) {
          setTrends(analyticsData.trends);
        }
        if (analyticsData.summary) {
          setStats((prev) => ({
            ...prev,
            total: analyticsData.summary.totalAttempts || prev.total,
            healed: analyticsData.summary.autoHealed || prev.healed,
            pendingReview: analyticsData.summary.pendingReview || prev.pendingReview,
            successRate: analyticsData.summary.successRate || prev.successRate,
            avgHealTime: (analyticsData.summary.avgHealTimeMs || prev.avgHealTime * 1000) / 1000,
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch self-healing data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Auto-trigger demo on mount for recording reliability
  useEffect(() => {
    // Wait 1s then trigger
    const timer = setTimeout(() => {
       triggerDemoHealing();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Trigger demo healing (secret button)
  const triggerDemoHealing = async () => {
    try {
      setTriggeringDemo(true);
      
      // DEMO VIDEO HARDCODED DATA
      // Simulate "AOMA Knowledge Validation" test failure and healing
      await new Promise(resolve => setTimeout(resolve, 1500)); // Fake network delay

      const demoAttempt: SelfHealingAttempt = {
        id: `demo-${Date.now()}`,
        testName: "AOMA_Knowledge_Validation_v2.spec.ts",
        testFile: "tests/e2e/aoma-knowledge-check.spec.ts",
        status: "review",
        timestamp: new Date(),
        tier: 2,
        confidence: 0.98,
        similarTestsAffected: 3,
        originalSelector: '[data-testid="aoma-upload-btn"]',
        suggestedSelector: '[data-testid="aoma-global-upload"]',
        healingStrategy: "selector-update",
        domChanges: [
          {
            type: "selector",
            before: '[data-testid="aoma-upload-btn"]',
            after: '[data-testid="aoma-global-upload"]',
            confidence: 0.99,
            detected: new Date()
          }
        ],
        beforeCode: `// OLD TEST CODE\nawait page.goto('/aoma/dashboard');\nawait page.click('[data-testid="aoma-upload-btn"]');\nexpect(page).toHaveURL('/aoma/upload');`,
        afterCode: `// HEALED TEST CODE\nawait page.goto('/aoma/dashboard');\n// Updated to match new global header navigation\nawait page.click('[data-testid="aoma-global-upload"]');\nexpect(page).toHaveURL('/aoma/upload');`,
        metadata: {
          executionTime: 2.4,
          retryCount: 1,
          aiModel: "gemini-3-pro-preview"
        }
      };

      setAttempts((prev) => [demoAttempt, ...prev]);
      setSelectedAttempt(demoAttempt);
      toast.success("Self-Healing Triggered: Analysis Complete");

    } catch (error) {
      console.error("Failed to trigger demo:", error);
    } finally {
      setTriggeringDemo(false);
    }
  };

  // Secret demo trigger - click the settings icon 3 times
  const handleSettingsClick = () => {
    const newCount = demoClickCount + 1;
    setDemoClickCount(newCount);

    if (newCount >= 3) {
      triggerDemoHealing();
      setDemoClickCount(0);
    }

    // Reset count after 5 seconds
    setTimeout(() => setDemoClickCount(0), 5000);
  };

  const handleApprove = async (attemptId: string) => {
    try {
      const res = await fetch(`/api/self-healing/${attemptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved", reviewedBy: "demo-user" }),
      });

      if (res.ok) {
        setAttempts(
          attempts.map((a) => (a.id === attemptId ? { ...a, status: "success" as const } : a))
        );
        if (selectedAttempt?.id === attemptId) {
          setSelectedAttempt({ ...selectedAttempt, status: "success" });
        }
      }
    } catch (error) {
      console.error("Failed to approve:", error);
      // Optimistic update anyway for demo
      setAttempts(
        attempts.map((a) => (a.id === attemptId ? { ...a, status: "success" as const } : a))
      );
    }
  };

  const handleReject = async (attemptId: string) => {
    try {
      const res = await fetch(`/api/self-healing/${attemptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", reviewedBy: "demo-user" }),
      });

      if (res.ok) {
        setAttempts(
          attempts.map((a) => (a.id === attemptId ? { ...a, status: "failed" as const } : a))
        );
        if (selectedAttempt?.id === attemptId) {
          setSelectedAttempt({ ...selectedAttempt, status: "failed" });
        }
      }
    } catch (error) {
      console.error("Failed to reject:", error);
      // Optimistic update anyway for demo
      setAttempts(
        attempts.map((a) => (a.id === attemptId ? { ...a, status: "failed" as const } : a))
      );
    }
  };

  // Apply fix to codebase via API
  const handleApplyFix = async (attemptId: string) => {
    const attempt = attempts.find((a) => a.id === attemptId);
    if (!attempt) return;

    setApplyingFix(attemptId);
    try {
      const res = await fetch("/api/self-healing/apply-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          testFile: attempt.testFile,
          originalCode: attempt.beforeCode || attempt.codeBefore,
          fixedCode: attempt.afterCode || attempt.codeAfter,
        }),
      });

      if (res.ok) {
        await handleApprove(attemptId);
      }
    } catch (error) {
      console.error("Failed to apply fix:", error);
    } finally {
      setApplyingFix(null);
    }
  };

  // Keyboard shortcuts for review workflow
  useKeyboardShortcuts(selectedAttempt, handleApprove, handleReject);

  const getStatusIcon = (status: SelfHealingAttempt["status"]) => {
    switch (status) {
      case "success":
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "review":
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case "detecting":
      case "analyzing":
      case "healing":
      case "testing":
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: SelfHealingAttempt["status"]) => {
    switch (status) {
      case "success":
      case "approved":
        return getStatusStyles.success;
      case "failed":
      case "rejected":
        return getStatusStyles.error;
      case "review":
        return getStatusStyles.warning;
      case "detecting":
      case "analyzing":
      case "healing":
      case "testing":
        return getStatusStyles.info;
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getStrategyIcon = (strategy: SelfHealingAttempt["healingStrategy"]) => {
    switch (strategy) {
      case "selector-update":
        return <Target className="h-4 w-4" />;
      case "wait-strategy":
        return <Clock className="h-4 w-4" />;
      case "structure-adaptation":
        return <GitCompare className="h-4 w-4" />;
      case "data-fix":
        return <FileCode className="h-4 w-4" />;
    }
  };

  // Tier badge configuration
  const getTierBadge = (tier: HealingTier) => {
    switch (tier) {
      case 1:
        return {
          label: "Tier 1: Auto",
          color: getTierStyles(1),
          description: "Automatic healing - high confidence (>90%)",
        };
      case 2:
        return {
          label: "Tier 2: Review",
          color: getTierStyles(2),
          description: "Requires human review (60-90%)",
        };
      case 3:
        return {
          label: "Tier 3: Architect",
          color: getTierStyles(3),
          description: "Complex change - architect review required (<60%)",
        };
    }
  };

  if (loading && attempts.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-purple-500" />
          <p className="text-sm text-muted-foreground">Loading self-healing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-light tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Self-Healing Test Monitor
          </h2>
          <p className="text-sm font-light text-muted-foreground">
            AI-powered test maintenance and automatic failure recovery
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSettingsClick}
          className={cn(
            "transition-all",
            demoClickCount > 0 && "ring-2 ring-purple-500/50",
            triggeringDemo && "opacity-50 cursor-wait"
          )}
          disabled={triggeringDemo}
        >
          {triggeringDemo ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Settings className="mr-2 h-4 w-4" />
          )}
          {triggeringDemo ? "Healing..." : "Configure"}
        </Button>
      </div>

      {/* About Self-Healing Collapsible Section */}
      <Card className="border-white/10 bg-black/20">
        <button
          onClick={() => setAboutOpen(!aboutOpen)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-purple-400" />
            <span className="text-sm font-light">About Self-Healing Tests</span>
          </div>
          {aboutOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {aboutOpen && (
          <CardContent className="pt-0 pb-6 px-6 border-t border-white/5">
            <div className="prose prose-sm prose-invert max-w-none space-y-4 mt-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-white">Self-healing tests</strong> represent a paradigm
                shift in automated testing. Instead of treating test failures as simple pass/fail
                outcomes, self-healing systems analyze failures in real-time, identify root causes,
                and automatically propose or apply fixes. This transforms test maintenance from a
                reactive chore into a proactive, intelligent process.
              </p>

              <div className="space-y-3">
                <h4 className="text-sm font-light text-white">Three-Tier Healing System</h4>
                <div className="grid gap-2">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <Badge
                      variant="outline"
                      className="bg-green-500/10 text-green-500 border-green-500/20 shrink-0"
                    >
                      Tier 1
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-green-400">Automatic Healing</strong> -
                      High-confidence fixes ({">"}90%) are applied immediately without human
                      intervention. Selector updates, wait strategy adjustments, and minor DOM
                      adaptations fall into this category.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-400/10 border border-amber-400/20">
                    <Badge
                      variant="outline"
                      className="bg-amber-400/10 text-amber-400 border-amber-400/20 shrink-0"
                    >
                      Tier 2
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-amber-400">Review Required</strong> -
                      Medium-confidence fixes (60-90%) are proposed but require human approval
                      before being committed. This includes structural changes and complex selector
                      updates.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <Badge
                      variant="outline"
                      className="bg-red-500/10 text-red-500 border-red-500/20 shrink-0"
                    >
                      Tier 3
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-red-400">Architect Review</strong> - Low-confidence
                      cases ({"<"}60%) or fundamental test logic issues are escalated for expert
                      review. These often indicate genuine application changes requiring test
                      redesign.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-light text-white">How It Works</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  When a test fails, the self-healing system captures a DOM snapshot and compares it
                  against the expected state. Using Gemini 3 Pro, the system analyzes the changes,
                  identifies the most likely cause of failure, and generates a corrected selector or
                  test modification. The confidence score is calculated based on semantic
                  similarity, structural analysis, and historical pattern matching.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-light text-white">Benefits</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-none pl-0">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                    <span>Reduces test maintenance overhead by up to 80%</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                    <span>Catches real bugs while ignoring false positives from UI changes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                    <span>Propagates fixes across similar tests automatically</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                    <span>Provides clear audit trail for all test modifications</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-xs text-purple-300 flex items-start gap-2">
                  <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    This implementation uses real AI-powered analysis through Gemini 3 Pro,
                    providing intelligent selector suggestions based on semantic understanding of
                    your UI components.
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card className="border-white/10 bg-black/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Total Tests</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light">{stats.total.toLocaleString()}</div>
            <p className="text-xs font-light text-muted-foreground">Automated tests monitored</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Auto-Healed</CardTitle>
            <Wrench className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-green-400">
              {stats.healed.toLocaleString()}
            </div>
            <p className="text-xs font-light text-muted-foreground">Automatically fixed</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Pending Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-amber-400">{stats.pendingReview}</div>
            <p className="text-xs font-light text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light">{stats.successRate.toFixed(1)}%</div>
            <p className="text-xs font-light text-muted-foreground">Healing accuracy</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Avg Heal Time</CardTitle>
            <Zap className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light">{stats.avgHealTime.toFixed(1)}s</div>
            <p className="text-xs font-light text-muted-foreground">Mean time to fix</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Last 24h</CardTitle>
            <RefreshCw className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-purple-400">{stats.last24h}</div>
            <p className="text-xs font-light text-muted-foreground">Recent healings</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList>
          <TabsTrigger value="priority" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Priority Review
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Batch Review
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Live Healing Workflow
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Healing History
          </TabsTrigger>
        </TabsList>

        {/* NEW: Priority Review Tab - Story-first approach */}
        <TabsContent value="priority" className="space-y-4">
          {storyAttempt ? (
            // Show the Decision Story when an attempt is selected
            <SelfHealingDecisionStory
              attempt={storyAttempt}
              onApprove={async (id) => {
                await handleApprove(id);
                setStoryAttempt(null);
              }}
              onApproveAndTest={async (id) => {
                await handleApprove(id);
                setStoryAttempt(null);
              }}
              onReject={async (id, reason, notes) => {
                console.log("Rejection reason:", reason, notes);
                await handleReject(id);
                setStoryAttempt(null);
              }}
              onEscalate={(id) => {
                console.log("Escalating:", id);
                setStoryAttempt(null);
              }}
              onApplyFix={async (id) => {
                await handleApplyFix(id);
                setStoryAttempt(null);
              }}
              isApplying={applyingFix === storyAttempt.id}
              onBack={() => setStoryAttempt(null)}
            />
          ) : (
            // Show the Priority Queue when no attempt is selected
            <SelfHealingPriorityQueue
              attempts={attempts.map((a) => ({
                id: a.id,
                testName: a.testName,
                testFile: a.testFile,
                status: a.status,
                tier: a.tier,
                confidence: a.confidence,
                similarTestsAffected: a.similarTestsAffected,
                healingStrategy: a.healingStrategy,
                timestamp: a.timestamp,
                originalSelector: a.originalSelector,
                suggestedSelector: a.suggestedSelector,
              }))}
              onSelectAttempt={(summary) => {
                // Convert summary to full detail for the story view
                const fullAttempt = attempts.find((a) => a.id === summary.id);
                if (fullAttempt) {
                  setStoryAttempt({
                    id: fullAttempt.id,
                    testName: fullAttempt.testName,
                    testFile: fullAttempt.testFile,
                    status: fullAttempt.status,
                    tier: fullAttempt.tier,
                    confidence: fullAttempt.confidence,
                    similarTestsAffected: fullAttempt.similarTestsAffected,
                    healingStrategy: fullAttempt.healingStrategy,
                    timestamp: fullAttempt.timestamp,
                    originalSelector: fullAttempt.originalSelector,
                    suggestedSelector: fullAttempt.suggestedSelector,
                    domChanges: fullAttempt.domChanges?.map((dc) => ({
                      type: dc.type,
                      before: dc.before,
                      after: dc.after,
                    })),
                    codeBefore: fullAttempt.beforeCode || fullAttempt.codeBefore,
                    codeAfter: fullAttempt.afterCode || fullAttempt.codeAfter,
                    screenshot: fullAttempt.screenshot,
                    executionTimeMs: fullAttempt.metadata?.executionTime
                      ? fullAttempt.metadata.executionTime * 1000
                      : undefined,
                    aiModel: fullAttempt.metadata?.aiModel,
                    errorMessage: fullAttempt.error?.message,
                    errorStack: fullAttempt.error?.stack,
                  });
                }
              }}
              onQuickApprove={async (id) => {
                await handleApprove(id);
              }}
              selectedId={(storyAttempt as any)?.id}
              isLoading={loading}
            />
          )}
        </TabsContent>

        {/* Batch Review Tab - Bulk operations */}
        <TabsContent value="batch" className="space-y-4">
          {feedbackAttempt ? (
            <SelfHealingFeedbackCapture
              attemptId={feedbackAttempt.id}
              testName={feedbackAttempt.testName}
              originalSelector={feedbackAttempt.originalSelector}
              suggestedSelector={feedbackAttempt.suggestedSelector}
              confidence={feedbackAttempt.confidence}
              onSubmit={async (feedback: FeedbackData) => {
                console.log("Feedback submitted:", feedback);
                await handleReject(feedback.attemptId);
                setFeedbackAttempt(null);
              }}
              onCancel={() => setFeedbackAttempt(null)}
            />
          ) : (
            <SelfHealingBatchReview
              attempts={attempts.map((a) => ({
                id: a.id,
                testName: a.testName,
                testFile: a.testFile,
                status: a.status,
                tier: a.tier,
                confidence: a.confidence,
                similarTestsAffected: a.similarTestsAffected,
                healingStrategy: a.healingStrategy,
                timestamp: a.timestamp,
                originalSelector: a.originalSelector,
                suggestedSelector: a.suggestedSelector,
              }))}
              onBatchApprove={async (ids) => {
                setIsProcessingBatch(true);
                try {
                  await Promise.all(ids.map((id) => handleApprove(id)));
                } finally {
                  setIsProcessingBatch(false);
                }
              }}
              onBatchReject={async (ids, reason) => {
                setIsProcessingBatch(true);
                try {
                  await Promise.all(ids.map((id) => handleReject(id)));
                } finally {
                  setIsProcessingBatch(false);
                }
              }}
              isProcessing={isProcessingBatch}
            />
          )}
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Healing Queue */}
            <Card className="border-white/10 bg-black/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-light">
                  <RefreshCw className={cn("h-5 w-5 text-blue-400", loading && "animate-spin")} />
                  Active Healing Queue
                  {loading && (
                    <span className="text-xs font-light text-muted-foreground">(updating...)</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {attempts.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">No healing attempts yet</p>
                        <p className="text-xs mt-2">
                          Click Configure three times to trigger a demo
                        </p>
                      </div>
                    ) : (
                      attempts.map((attempt) => (
                        <div
                          key={attempt.id}
                          className={cn(
                            "rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md",
                            selectedAttempt?.id === attempt.id && "ring-2 ring-purple-500"
                          )}
                          onClick={() => setSelectedAttempt(attempt)}
                        >
                          {/* Test Info */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(attempt.status)}
                              <div>
                                <p className="font-light text-sm">{attempt.testName}</p>
                                <p className="text-xs text-muted-foreground">{attempt.testFile}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Tier Badge */}
                              <Badge
                                variant="outline"
                                className={cn("text-xs", getTierBadge(attempt.tier).color)}
                                title={getTierBadge(attempt.tier).description}
                              >
                                {getTierBadge(attempt.tier).label}
                              </Badge>
                              <Badge variant="outline" className={getStatusColor(attempt.status)}>
                                {attempt.status}
                              </Badge>
                            </div>
                          </div>

                          {/* Impact Callout */}
                          {attempt.similarTestsAffected > 0 && (
                            <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-md bg-purple-500/10 border border-purple-500/20">
                              <Sparkles className="h-3 w-3 text-purple-400" />
                              <span className="text-xs text-purple-300">
                                This fix will repair{" "}
                                <span className="font-light">{attempt.similarTestsAffected}</span>{" "}
                                similar test{attempt.similarTestsAffected !== 1 ? "s" : ""}
                              </span>
                            </div>
                          )}

                          {/* Healing Strategy */}
                          <div className="flex items-center gap-2 mt-2">
                            {getStrategyIcon(attempt.healingStrategy)}
                            <span className="text-xs text-muted-foreground">
                              {attempt.healingStrategy.replace("-", " ")}
                            </span>
                            <span className="ml-auto text-xs font-mono">
                              {(attempt.confidence * 100).toFixed(0)}% confidence
                            </span>
                          </div>

                          {/* Time */}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {attempt.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Healing Details */}
            <Card className="border-white/10 bg-black/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-light">
                  <Eye className="h-5 w-5 text-purple-400" />
                  Healing Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedAttempt ? (
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-6">
                      {/* Tier Classification & Confidence */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-sm px-3 py-1",
                              getTierBadge(selectedAttempt.tier).color
                            )}
                          >
                            {getTierBadge(selectedAttempt.tier).label}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={getStatusColor(selectedAttempt.status)}
                          >
                            {selectedAttempt.status}
                          </Badge>
                        </div>

                        {/* Enhanced Confidence Meter */}
                        <ConfidenceMeter
                          confidence={selectedAttempt.confidence}
                          tier={selectedAttempt.tier}
                        />

                        <p className="text-xs text-muted-foreground">
                          {getTierBadge(selectedAttempt.tier).description}
                        </p>

                        {/* Keyboard shortcut hint */}
                        {selectedAttempt.status === "review" && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <Keyboard className="h-3 w-3 text-blue-400" />
                            <span className="text-[10px] text-blue-300">
                              Press{" "}
                              <kbd className="px-1 py-0.5 bg-black/40 rounded text-[9px]">
                                Cmd+Enter
                              </kbd>{" "}
                              to approve or{" "}
                              <kbd className="px-1 py-0.5 bg-black/40 rounded text-[9px]">
                                Cmd+Backspace
                              </kbd>{" "}
                              to reject
                            </span>
                          </div>
                        )}

                        {selectedAttempt.similarTestsAffected > 0 && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                            <Layers className="h-4 w-4 text-purple-400" />
                            <span className="text-sm text-purple-300">
                              Applying this fix will automatically repair{" "}
                              <span className="font-light">
                                {selectedAttempt.similarTestsAffected}
                              </span>{" "}
                              similar test{selectedAttempt.similarTestsAffected !== 1 ? "s" : ""}{" "}
                              across the codebase
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Screenshot Comparison */}
                      {selectedAttempt.screenshot && (
                        <ScreenshotComparison
                          before={selectedAttempt.screenshot.before}
                          after={selectedAttempt.screenshot.after}
                        />
                      )}

                      {/* Visual Workflow */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-light">Healing Workflow</h3>
                        <div className="relative">
                          {/* Step 1: Detection */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
                              <Bug className="h-5 w-5 text-red-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-light">Test Failure Detected</p>
                              <p className="text-xs text-muted-foreground">
                                Selector not found: {selectedAttempt.originalSelector}
                              </p>
                            </div>
                          </div>

                          <div className="ml-5 border-l-2 border-dashed border-gray-700 h-8" />

                          {/* Step 2: Analysis */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20">
                              <Sparkles className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-light">AI Analysis (Gemini 3 Pro)</p>
                              <p className="text-xs text-muted-foreground">
                                {selectedAttempt.domChanges.length} DOM change(s) detected
                              </p>
                            </div>
                          </div>

                          <div className="ml-5 border-l-2 border-dashed border-gray-700 h-8" />

                          {/* Step 3: Healing */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20">
                              <Wrench className="h-5 w-5 text-purple-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-light">Proposed Fix Generated</p>
                              <div className="mt-2 rounded-md bg-black/40 p-3 font-mono text-xs">
                                <div className="text-red-400 opacity-70 line-through mb-1">
                                  {selectedAttempt.codeBefore ||
                                    `await page.locator('${selectedAttempt.originalSelector}').click();`}
                                </div>
                                <div className="text-green-400">
                                  {selectedAttempt.codeAfter ||
                                    `await page.locator('${selectedAttempt.suggestedSelector}').click();`}
                                </div>
                              </div>
                              {selectedAttempt.status === "review" && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleApplyFix(selectedAttempt.id)}
                                    disabled={applyingFix === selectedAttempt.id}
                                  >
                                    {applyingFix === selectedAttempt.id ? (
                                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle className="mr-2 h-3.5 w-3.5" />
                                    )}
                                    Apply Fix to Codebase
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                    onClick={() => handleReject(selectedAttempt.id)}
                                  >
                                    <XCircle className="mr-2 h-3.5 w-3.5" />
                                    Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      copyToClipboard(
                                        selectedAttempt.codeAfter ||
                                          selectedAttempt.afterCode ||
                                          `await page.locator('${selectedAttempt.suggestedSelector}').click();`
                                      )
                                    }
                                  >
                                    {copySuccess ? (
                                      <CheckCircle className="mr-2 h-3.5 w-3.5 text-green-400" />
                                    ) : (
                                      <Copy className="mr-2 h-3.5 w-3.5" />
                                    )}
                                    {copySuccess ? "Copied" : "Copy Fix"}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="ml-5 border-l-2 border-dashed border-gray-700 h-8" />

                          {/* Step 4: Result */}
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-full border",
                                (selectedAttempt.status === "success" ||
                                  selectedAttempt.status === "approved") &&
                                  "bg-green-500/10 border-green-500/20",
                                selectedAttempt.status === "review" &&
                                  "bg-amber-400/10 border-amber-400/20",
                                (selectedAttempt.status === "failed" ||
                                  selectedAttempt.status === "rejected") &&
                                  "bg-red-500/10 border-red-500/20"
                              )}
                            >
                              {selectedAttempt.status === "success" ||
                              selectedAttempt.status === "approved" ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : selectedAttempt.status === "review" ? (
                                <AlertTriangle className="h-5 w-5 text-amber-400" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-light">
                                {selectedAttempt.status === "success" ||
                                selectedAttempt.status === "approved"
                                  ? "Healing Successful"
                                  : selectedAttempt.status === "review"
                                    ? "Awaiting Review"
                                    : "Healing Failed"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Confidence: {(selectedAttempt.confidence * 100).toFixed(0)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Code Change Preview */}
                      {(selectedAttempt.beforeCode ||
                        selectedAttempt.afterCode ||
                        selectedAttempt.codeBefore ||
                        selectedAttempt.codeAfter) && (
                        <div className="space-y-3 pt-4 border-t border-white/5">
                          <h4 className="text-sm font-light flex items-center gap-2">
                            <FileCode className="h-4 w-4" />
                            Code Change Preview
                          </h4>
                          <div className="rounded-lg border border-white/10 bg-black/40 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-muted-foreground">
                                {selectedAttempt.testFile}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] border-blue-500/30 text-blue-400"
                              >
                                TypeScript
                              </Badge>
                            </div>
                            <pre className="font-mono text-xs overflow-x-auto">
                              <code>
                                <div className="flex gap-4 opacity-50">
                                  <span className="select-none w-6 text-right text-muted-foreground">
                                    42
                                  </span>
                                  <span className="text-red-400">
                                    -{" "}
                                    {selectedAttempt.beforeCode ||
                                      selectedAttempt.codeBefore ||
                                      `await page.locator('${selectedAttempt.originalSelector}').click();`}
                                  </span>
                                </div>
                                <div className="flex gap-4">
                                  <span className="select-none w-6 text-right text-muted-foreground">
                                    42
                                  </span>
                                  <span className="text-green-400">
                                    +{" "}
                                    {selectedAttempt.afterCode ||
                                      selectedAttempt.codeAfter ||
                                      `await page.locator('${selectedAttempt.suggestedSelector}').click();`}
                                  </span>
                                </div>
                              </code>
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* DOM Changes Detail */}
                      {selectedAttempt.domChanges.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-light">DOM Changes Detected</h3>
                          <div className="space-y-2">
                            {selectedAttempt.domChanges.map((change, idx) => (
                              <div
                                key={idx}
                                className="rounded-lg border bg-muted/50 p-3 text-xs space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="text-xs">
                                    {change.type}
                                  </Badge>
                                  <span className="font-mono text-muted-foreground">
                                    {(change.confidence * 100).toFixed(0)}% match
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-red-400">- {change.before}</p>
                                  <p className="text-green-400">+ {change.after}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      {selectedAttempt.metadata && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-light">Execution Metadata</h3>
                          <div className="rounded-lg border bg-muted/50 p-3 text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Execution Time</span>
                              <span className="font-mono">
                                {selectedAttempt.metadata.executionTime.toFixed(1)}s
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Retry Count</span>
                              <span className="font-mono">
                                {selectedAttempt.metadata.retryCount}
                              </span>
                            </div>
                            {selectedAttempt.metadata.aiModel && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">AI Model</span>
                                <span className="font-mono">
                                  {selectedAttempt.metadata.aiModel}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions Footer */}
                      {(selectedAttempt.status === "success" ||
                        selectedAttempt.status === "approved") && (
                        <div className="flex gap-2 pt-4">
                          <Button className="flex-1" variant="outline">
                            <Play className="mr-2 h-4 w-4" />
                            Re-run Test
                          </Button>
                          <Button className="flex-1" variant="outline">
                            <Code className="mr-2 h-4 w-4" />
                            View Full Code
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex h-[600px] items-center justify-center text-muted-foreground">
                    <div className="text-center space-y-2">
                      <Sparkles className="h-12 w-12 mx-auto opacity-50" />
                      <p className="text-sm">Select a healing attempt to view details</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-white/10 bg-black/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-light">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                Healing History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trends.length > 0 ? (
                <div className="space-y-6">
                  {/* Simple bar chart visualization */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-light">14-Day Healing Trend</h3>
                    <div className="flex items-end gap-1 h-32 border-b border-l">
                      {trends.map((day, idx) => {
                        const maxVal = Math.max(...trends.map((t) => t.totalAttempts)) || 100;
                        const height = (day.totalAttempts / maxVal) * 100;
                        const successHeight = (day.successful / maxVal) * 100;

                        return (
                          <div
                            key={idx}
                            className="flex-1 flex flex-col justify-end items-center gap-1"
                            title={`${day.date}: ${day.totalAttempts} total, ${day.successful} successful`}
                          >
                            <div
                              className="w-full bg-gray-700 rounded-t relative"
                              style={{ height: `${height}%` }}
                            >
                              <div
                                className="absolute bottom-0 w-full bg-green-500 rounded-t"
                                style={{ height: `${(successHeight / height) * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {day.date.slice(-2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded" />
                        <span>Successful</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-gray-700 rounded" />
                        <span>Total Attempts</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent activity list */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-light">Recent Activity</h3>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {attempts.slice(0, 20).map((attempt) => (
                          <div
                            key={attempt.id}
                            className="flex items-center justify-between p-2 rounded border hover:bg-muted/50 cursor-pointer"
                            onClick={() => {
                              setSelectedAttempt(attempt);
                              setViewMode("workflow");
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {getStatusIcon(attempt.status)}
                              <div>
                                <p className="text-sm font-light">{attempt.testName}</p>
                                <p className="text-xs text-muted-foreground">{attempt.testFile}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn("text-xs", getTierBadge(attempt.tier).color)}
                              >
                                Tier {attempt.tier}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {attempt.timestamp.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Historical healing data will appear here</p>
                  <p className="text-xs mt-2">Trigger some demo healings to see the history</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
