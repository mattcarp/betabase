"use client";

import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";
import { Badge } from "./badge";
import { ScrollArea } from "./scroll-area";
import {
  Activity,
  Bone,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Layers,
  Eye,
  DollarSign,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Download,
  Copy,
  Settings,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";
import { calculateCost, formatCost } from "@/lib/introspection/cost-calculator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";
import { Switch } from "./switch";
import { LatencyWaterfall, extractLatencySegments } from "./LatencyWaterfall";
import { getTokenBudgets, formatTokenCount, type TokenBudget } from "@/lib/introspection/token-aggregator";
import type { RLHFFeedbackStats } from "@/lib/introspection/rlhf-query";
import { getQualityStatistics, type SimilarityStats, type CitationStats, type ConversationStats } from "@/lib/introspection/trace-statistics";

// Slow query threshold: 2 seconds
const SLOW_QUERY_THRESHOLD_MS = 2000;

interface ActivityTrace {
  id: string;
  name: string;
  runType: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: "success" | "error" | "pending";
  error?: string;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface AppHealthStatus {
  enabled: boolean;
  project: string;
  environment: string;
  tracingEnabled: boolean;
  hasSupabase: boolean;
  hasAIProvider: boolean;
  hasLangfuse?: boolean;
}

export function IntrospectionDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [traces, setTraces] = useState<ActivityTrace[]>([]);
  const [status, setStatus] = useState<AppHealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTrace, setSelectedTrace] = useState<ActivityTrace | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [traceObservations, setTraceObservations] = useState<any[]>([]);
  const [tokenBudgets, setTokenBudgets] = useState<{ daily: TokenBudget; weekly: TokenBudget; allTime: TokenBudget } | null>(null);
  const [showOnlySlowQueries, setShowOnlySlowQueries] = useState(false);
  const [rlhfStats, setRlhfStats] = useState<RLHFFeedbackStats | null>(null);
  const [qualityStats, setQualityStats] = useState<{ similarity: SimilarityStats; citations: CitationStats; conversations: ConversationStats } | null>(null);
  const [verboseLogging, setVerboseLogging] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("introspection-verbose-logging") === "true";
    }
    return false;
  });

  // Verbose logging helper
  const log = (message: string, ...args: any[]) => {
    if (verboseLogging) {
      console.log(`[Introspection] ${message}`, ...args);
    }
  };

  // Toggle verbose logging
  const toggleVerboseLogging = (enabled: boolean) => {
    setVerboseLogging(enabled);
    localStorage.setItem("introspection-verbose-logging", String(enabled));
    if (enabled) {
      console.log("[Introspection] Verbose logging enabled");
    } else {
      console.log("[Introspection] Verbose logging disabled");
    }
  };

  // Fetch app health status and recent activity traces
  const fetchIntrospectionData = async () => {
    log("Fetching introspection data...");
    setLoading(true);
    try {
      // Call the introspection API to get app health data
      const response = await fetch("/api/introspection", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        log("Received introspection data", {
          statusEnabled: data.status?.enabled,
          traceCount: data.traces?.length,
          hasRLHFStats: !!data.rlhfStats,
        });
        setStatus(data.status);
        setTraces(data.traces || []);
        setRlhfStats(data.rlhfStats || null);
      } else {
        log("Failed to fetch introspection data", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Failed to fetch introspection data:", error);
      log("Error fetching introspection data", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics when traces are loaded
  useEffect(() => {
    if (traces.length > 0) {
      const budgets = getTokenBudgets(traces);
      setTokenBudgets(budgets);

      const stats = getQualityStatistics(traces);
      setQualityStats(stats);
    }
  }, [traces]);

  useEffect(() => {
    if (isOpen) {
      fetchIntrospectionData();
      // Refresh every 5 seconds while open
      const interval = setInterval(fetchIntrospectionData, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Fetch detailed observations when a trace is selected
  const fetchTraceObservations = async (traceId: string) => {
    try {
      const response = await fetch(`/api/introspection?traceId=${traceId}`);
      if (response.ok) {
        const data = await response.json();
        setTraceObservations(data.observations || []);
      }
    } catch (error) {
      console.error("Failed to fetch trace observations:", error);
      setTraceObservations([]);
    }
  };

  // Handle trace selection
  const handleTraceClick = async (trace: ActivityTrace) => {
    setSelectedTrace(trace);
    setDetailsOpen(true);
    setTraceObservations([]); // Clear previous observations
    await fetchTraceObservations(trace.id);
  };

  // Export trace as JSON
  const handleExportTrace = () => {
    if (!selectedTrace) return;

    const exportData = {
      trace: selectedTrace,
      observations: traceObservations,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trace-${selectedTrace.id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy JSON to clipboard
  const handleCopyJSON = (data: any) => {
    const json = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(json);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "error":
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      case "pending":
        return <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  const getRunTypeColor = (runType: string) => {
    switch (runType) {
      case "tool":
        return "bg-blue-500/10 text-blue-500";
      case "chain":
        return "bg-purple-500/10 text-purple-500";
      case "llm":
        return "bg-green-500/10 text-green-500";
      case "retriever":
        return "bg-orange-500/10 text-orange-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const isSlowQuery = (duration?: number) => {
    return duration !== undefined && duration >= SLOW_QUERY_THRESHOLD_MS;
  };

  // Filter traces based on slow query toggle
  const displayedTraces = showOnlySlowQueries
    ? traces.filter(trace => isSlowQuery(trace.duration))
    : traces;

  // Calculate system status for button display
  const connectedServices = [status?.hasSupabase, status?.hasAIProvider].filter(Boolean).length;
  const totalServices = 2;
  const allSystemsOnline = connectedServices === totalServices;

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative flex items-center gap-2 mac-button mac-button-outline"
          >
            <Bone className="h-4 w-4" />
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono ${allSystemsOnline ? 'text-green-400' : 'text-yellow-400'}`}>
                {connectedServices}/{totalServices}
              </span>
              <span className="hidden sm:inline">Introspection</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[400px]">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bone className="h-4 w-4" />
              App Health Monitor
            </span>
            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
          </DropdownMenuLabel>

          {/* Token Budget Display */}
          {tokenBudgets && tokenBudgets.daily.traceCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-2 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Today:</span>
                  <span className="font-mono text-xs">
                    {formatTokenCount(tokenBudgets.daily.totalTokens)} tokens
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Weekly:</span>
                  <span className="font-mono text-xs">
                    {formatTokenCount(tokenBudgets.weekly.totalTokens)} tokens
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Est. Cost:</span>
                  <TooltipProvider>
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <span className="font-mono text-xs text-green-600 dark:text-green-400 cursor-help">
                          ${tokenBudgets.weekly.totalCost.toFixed(2)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs space-y-1">
                          <div className="font-semibold">7-Day Total</div>
                          <div>Traces: {tokenBudgets.weekly.traceCount}</div>
                          <div>
                            Tokens: {tokenBudgets.weekly.totalTokens.toLocaleString()}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </>
          )}

          {status && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-2.5 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">System Status:</span>
                  <span className={`flex items-center gap-1.5 font-medium ${status.tracingEnabled ? 'text-green-500' : 'text-yellow-500'}`}>
                    {status.tracingEnabled ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" />
                        Healthy
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5" />
                        Degraded
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Environment:</span>
                  <span className="font-mono text-xs text-foreground">{status.environment}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Database:</span>
                  <span className={`flex items-center gap-1.5 font-medium ${status.hasSupabase ? 'text-green-500' : 'text-red-500'}`}>
                    {status.hasSupabase ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" />
                        Connected
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5" />
                        Unavailable
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">AI Provider:</span>
                  <span className={`flex items-center gap-1.5 font-medium ${status.hasAIProvider ? 'text-green-500' : 'text-red-500'}`}>
                    {status.hasAIProvider ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" />
                        Connected
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5" />
                        Unavailable
                      </>
                    )}
                  </span>
                </div>
                {status.hasLangfuse !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Langfuse:</span>
                    <span className={`flex items-center gap-1.5 font-medium ${status.hasLangfuse ? 'text-green-500' : 'text-yellow-500'}`}>
                      {status.hasLangfuse ? (
                        <>
                          <CheckCircle className="h-3.5 w-3.5" />
                          Connected
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3.5 w-3.5" />
                          Unavailable
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* RLHF Feedback Summary */}
          {rlhfStats && rlhfStats.totalFeedback > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-2.5 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Feedback (24h):</span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <ThumbsUp className="h-3 w-3" />
                      {rlhfStats.positiveFeedback}
                    </span>
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                      <ThumbsDown className="h-3 w-3" />
                      {rlhfStats.negativeFeedback}
                    </span>
                  </div>
                </div>
                {rlhfStats.avgRating !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Avg Rating:</span>
                    <span className="font-mono text-xs">
                      {rlhfStats.avgRating.toFixed(1)}/5.0
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <a
                    href="/curate"
                    className="flex items-center gap-1 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Curator Workspace</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <span className="text-muted-foreground text-[10px]">
                    {rlhfStats.uniqueSessions} sessions
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Quality Statistics */}
          {qualityStats && (qualityStats.similarity.count > 0 || qualityStats.citations.totalResponses > 0) && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-2.5 text-xs space-y-2">
                {/* Similarity Scores */}
                {qualityStats.similarity.count > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Avg Similarity:</span>
                    <TooltipProvider>
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <span className={`font-mono text-xs ${
                            qualityStats.similarity.avg && qualityStats.similarity.avg < 0.7
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-green-600 dark:text-green-400"
                          } cursor-help`}>
                            {qualityStats.similarity.avg?.toFixed(3)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <div className="font-semibold">Similarity Range</div>
                            <div>Min: {qualityStats.similarity.min?.toFixed(3)}</div>
                            <div>Max: {qualityStats.similarity.max?.toFixed(3)}</div>
                            <div>Low (&lt;0.7): {qualityStats.similarity.lowSimilarityCount}</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}

                {/* Citation Usage */}
                {qualityStats.citations.totalResponses > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Avg Citations:</span>
                    <span className="font-mono text-xs">
                      {qualityStats.citations.avgCitationsPerResponse.toFixed(1)}
                    </span>
                  </div>
                )}

                {/* Conversation Depth */}
                {qualityStats.conversations.totalSessions > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Sessions (24h):</span>
                    <TooltipProvider>
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <span className="font-mono text-xs cursor-help">
                            {qualityStats.conversations.totalSessions}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <div>Total messages: {qualityStats.conversations.totalMessages}</div>
                            <div>
                              Avg msgs/session: {qualityStats.conversations.avgMessagesPerSession.toFixed(1)}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
            </>
          )}

          <DropdownMenuSeparator />

          <div className="px-2 py-2 flex items-center justify-between">
            <DropdownMenuLabel className="text-xs text-muted-foreground p-0">
              Recent API Activity
            </DropdownMenuLabel>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setShowOnlySlowQueries(!showOnlySlowQueries)}
            >
              <Clock className="h-3 w-3 mr-1" />
              {showOnlySlowQueries ? "Show All" : "Slow Only"}
            </Button>
          </div>

          <ScrollArea className="h-[300px]">
            {displayedTraces.length === 0 ? (
              <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                {showOnlySlowQueries ? (
                  <>
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No slow queries</p>
                    <p className="text-xs mt-2">All queries under 2 seconds</p>
                  </>
                ) : status?.tracingEnabled ? (
                  <>
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                    <p className="text-xs mt-2">API requests will appear here</p>
                  </>
                ) : (
                  <>
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>System starting up</p>
                    <p className="text-xs mt-2">Waiting for services to initialize</p>
                  </>
                )}
              </div>
            ) : (
              displayedTraces.map((trace) => {
                const metadata = trace.metadata as any;
                const isLLM = trace.runType === "llm";
                const isRetriever = trace.runType === "retriever";
                const isSlow = isSlowQuery(trace.duration);

                // Calculate cost for LLM traces
                const cost =
                  isLLM && metadata?.model && metadata?.promptTokens && metadata?.completionTokens
                    ? calculateCost(metadata.model, metadata.promptTokens, metadata.completionTokens)
                    : null;

                return (
                  <DropdownMenuItem
                    key={trace.id}
                    className={`flex flex-col items-start gap-2 py-2 cursor-pointer ${
                      isSlow ? "bg-amber-500/5 border-l-2 border-amber-500/60" : ""
                    }`}
                    onClick={() => handleTraceClick(trace)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(trace.status)}
                        {isSlow && (
                          <TooltipProvider>
                            <Tooltip delayDuration={200}>
                              <TooltipTrigger asChild>
                                <AlertCircle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs">Slow query (&gt;2s)</div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <span className="text-sm font-medium truncate max-w-[200px]">
                          {trace.name}
                        </span>
                      </div>
                      <ChevronRight className="h-3 w-3 opacity-50" />
                    </div>
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0 ${getRunTypeColor(trace.runType)}`}
                      >
                        {trace.runType}
                      </Badge>
                      <span className="text-muted-foreground">{formatTime(trace.startTime)}</span>
                      <span className="text-muted-foreground">{formatDuration(trace.duration)}</span>

                      {/* Show model for LLM traces */}
                      {isLLM && metadata?.model && (
                        <span className="text-muted-foreground font-mono text-[10px]">
                          {metadata.model}
                        </span>
                      )}

                      {/* Show tokens for LLM traces */}
                      {isLLM && metadata?.totalTokens && (
                        <span className="text-muted-foreground font-mono text-[10px]">
                          {metadata.totalTokens.toLocaleString()}t
                        </span>
                      )}

                      {/* Show cost for LLM traces */}
                      {isLLM && cost !== null && (
                        <TooltipProvider>
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 text-[10px] font-mono text-green-600 dark:text-green-400">
                                <DollarSign className="h-3 w-3" />
                                {formatCost(cost).replace("$", "")}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs space-y-1">
                                <div className="font-semibold">Estimated Cost</div>
                                <div>
                                  Input: {metadata.promptTokens.toLocaleString()} tokens
                                </div>
                                <div>
                                  Output: {metadata.completionTokens.toLocaleString()} tokens
                                </div>
                                <div className="text-muted-foreground text-[10px] mt-1">
                                  Based on {metadata.model} pricing
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {/* Show similarity scores for retriever traces */}
                      {isRetriever && metadata?.similarityScores && (
                        <span className="text-muted-foreground font-mono text-[10px]">
                          sim: {metadata.similarityScores.filter((s: any) => s != null).join(", ")}
                        </span>
                      )}
                    </div>
                    {trace.error && (
                      <span className="text-xs text-red-500 truncate w-full">{trace.error}</span>
                    )}
                  </DropdownMenuItem>
                );
              })
            )}
          </ScrollArea>

          {status?.tracingEnabled && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-2 space-y-2">
                <DropdownMenuItem
                  className="text-xs cursor-pointer"
                  onClick={() => {
                    // Refresh the introspection data
                    fetchIntrospectionData();
                  }}
                >
                  <Eye className="h-3 w-3 mr-2" />
                  Refresh Health Status
                </DropdownMenuItem>
                <div className="flex items-center justify-between px-2 py-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Settings className="h-3 w-3" />
                    Verbose Logging
                    {verboseLogging && (
                      <Badge variant="outline" className="h-4 px-1 text-[10px] bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700">
                        Active
                      </Badge>
                    )}
                  </div>
                  <Switch
                    checked={verboseLogging}
                    onCheckedChange={toggleVerboseLogging}
                    className="scale-75"
                  />
                </div>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Trace Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden bg-zinc-900 border-white/10">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="flex items-center gap-2">
                  {selectedTrace && getStatusIcon(selectedTrace.status)}
                  {selectedTrace?.name}
                </DialogTitle>
                <DialogDescription>Trace ID: {selectedTrace?.id}</DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportTrace}
                className="flex items-center gap-1"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </div>
          </DialogHeader>

          {selectedTrace && (
            <ScrollArea className="max-h-[500px] pr-4">
              <div className="space-y-3">
                {/* Latency Waterfall */}
                {traceObservations.length > 0 && (
                  <div>
                    <h4 className="mac-title">Latency Breakdown</h4>
                    <LatencyWaterfall
                      segments={extractLatencySegments(traceObservations)}
                      totalDuration={selectedTrace.duration}
                    />
                  </div>
                )}

                {/* Metadata */}
                <div>
                  <h4 className="mac-title">Metadata</h4>
                  <div className="bg-black/30 border border-white/5 rounded-lg p-4 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline" className={getRunTypeColor(selectedTrace.runType)}>
                        {selectedTrace.runType}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Time:</span>
                      <span>{new Date(selectedTrace.startTime).toLocaleString()}</span>
                    </div>
                    {selectedTrace.endTime && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">End Time:</span>
                        <span>{new Date(selectedTrace.endTime).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{formatDuration(selectedTrace.duration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge
                        variant={selectedTrace.status === "success" ? "default" : "destructive"}
                      >
                        {selectedTrace.status}
                      </Badge>
                    </div>
                    {/* LLM-specific metadata */}
                    {selectedTrace.runType === "llm" && selectedTrace.metadata && (
                      <>
                        {(selectedTrace.metadata as any).model && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Model:</span>
                            <span className="font-mono text-xs">{(selectedTrace.metadata as any).model}</span>
                          </div>
                        )}
                        {(selectedTrace.metadata as any).promptTokens && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Prompt Tokens:</span>
                            <span className="font-mono text-xs">{(selectedTrace.metadata as any).promptTokens.toLocaleString()}</span>
                          </div>
                        )}
                        {(selectedTrace.metadata as any).completionTokens && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Completion Tokens:</span>
                            <span className="font-mono text-xs">{(selectedTrace.metadata as any).completionTokens.toLocaleString()}</span>
                          </div>
                        )}
                        {(selectedTrace.metadata as any).totalTokens && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Tokens:</span>
                            <span className="font-mono text-xs font-semibold">{(selectedTrace.metadata as any).totalTokens.toLocaleString()}</span>
                          </div>
                        )}
                        {/* Cost display */}
                        {(() => {
                          const metadata = selectedTrace.metadata as any;
                          const cost =
                            metadata?.model && metadata?.promptTokens && metadata?.completionTokens
                              ? calculateCost(metadata.model, metadata.promptTokens, metadata.completionTokens)
                              : null;

                          if (cost !== null) {
                            return (
                              <div className="flex justify-between pt-2 border-t border-border">
                                <span className="text-muted-foreground font-semibold">Estimated Cost:</span>
                                <span className="font-mono text-sm font-bold text-green-600 dark:text-green-400">
                                  {formatCost(cost)}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </>
                    )}
                    {/* Retriever-specific metadata */}
                    {selectedTrace.runType === "retriever" && selectedTrace.metadata && (
                      <>
                        {(selectedTrace.metadata as any).vectorSearchCount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Vector Searches:</span>
                            <span className="font-mono text-xs">{(selectedTrace.metadata as any).vectorSearchCount}</span>
                          </div>
                        )}
                        {(selectedTrace.metadata as any).similarityScores && (selectedTrace.metadata as any).similarityScores.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Similarity Scores:</span>
                            <span className="font-mono text-xs">
                              {(selectedTrace.metadata as any).similarityScores.filter((s: any) => s != null).join(", ")}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    {/* Observation count */}
                    {selectedTrace.metadata && (selectedTrace.metadata as any).observationCount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Observations:</span>
                        <span className="font-mono text-xs">{(selectedTrace.metadata as any).observationCount}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Request Inspector */}
                {selectedTrace.inputs && (
                  <Collapsible>
                    <div className="flex items-center justify-between">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-2 p-0 h-auto hover:bg-transparent"
                        >
                          <h4 className="mac-title">Request</h4>
                          <ChevronRight className="h-3 w-3 transition-transform ui-state-open:rotate-90" />
                        </Button>
                      </CollapsibleTrigger>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyJSON(selectedTrace.inputs)}
                        className="h-6 px-2"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <CollapsibleContent>
                      <pre className="bg-black/30 border border-white/5 rounded-lg p-4 text-xs overflow-x-auto mt-2">
                        {JSON.stringify(selectedTrace.inputs, null, 2)}
                      </pre>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Response Inspector */}
                {selectedTrace.outputs && (
                  <Collapsible>
                    <div className="flex items-center justify-between">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-2 p-0 h-auto hover:bg-transparent"
                        >
                          <h4 className="mac-title">Response</h4>
                          <ChevronRight className="h-3 w-3 transition-transform ui-state-open:rotate-90" />
                        </Button>
                      </CollapsibleTrigger>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyJSON(selectedTrace.outputs)}
                        className="h-6 px-2"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <CollapsibleContent>
                      <pre className="bg-black/30 border border-white/5 rounded-lg p-4 text-xs overflow-x-auto mt-2">
                        {JSON.stringify(selectedTrace.outputs, null, 2)}
                      </pre>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Prompt Viewer (for LLM traces) */}
                {selectedTrace.runType === "llm" && selectedTrace.inputs && (
                  <Collapsible>
                    <div className="flex items-center justify-between">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-2 p-0 h-auto hover:bg-transparent"
                        >
                          <h4 className="mac-title">System Prompt</h4>
                          <ChevronRight className="h-3 w-3 transition-transform ui-state-open:rotate-90" />
                        </Button>
                      </CollapsibleTrigger>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const systemPrompt =
                            selectedTrace.inputs.messages?.find((m: any) => m.role === "system")?.content ||
                            selectedTrace.inputs.system ||
                            selectedTrace.inputs.systemPrompt;
                          if (systemPrompt) {
                            navigator.clipboard.writeText(
                              typeof systemPrompt === "string"
                                ? systemPrompt
                                : JSON.stringify(systemPrompt, null, 2)
                            );
                          }
                        }}
                        className="h-6 px-2"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <CollapsibleContent>
                      <div className="bg-black/30 border border-white/5 rounded-lg p-4 text-xs overflow-x-auto mt-2">
                        {(() => {
                          const systemPrompt =
                            selectedTrace.inputs.messages?.find((m: any) => m.role === "system")?.content ||
                            selectedTrace.inputs.system ||
                            selectedTrace.inputs.systemPrompt;

                          if (!systemPrompt) {
                            return <p className="text-muted-foreground italic">No system prompt found</p>;
                          }

                          if (typeof systemPrompt === "string") {
                            return <pre className="whitespace-pre-wrap">{systemPrompt}</pre>;
                          }

                          return <pre>{JSON.stringify(systemPrompt, null, 2)}</pre>;
                        })()}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Error */}
                {selectedTrace.error && (
                  <div>
                    <h4 className="mac-title text-sm font-normal mb-2 text-red-500">Error</h4>
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4 text-sm text-red-600 dark:text-red-400">
                      {selectedTrace.error}
                    </div>
                  </div>
                )}

                {/* Additional Metadata */}
                {selectedTrace.metadata && Object.keys(selectedTrace.metadata).length > 0 && (
                  <div>
                    <h4 className="mac-title">Additional Context</h4>
                    <pre className="bg-black/30 border border-white/5 rounded-lg p-4 text-xs overflow-x-auto mt-2">
                      {JSON.stringify(selectedTrace.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
