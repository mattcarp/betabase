"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { cn } from "../../lib/utils";
import { Spinner } from "./spinner";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  CheckCircle,
  XCircle,
  MessageSquare,
  Bug,
  FileText,
  Zap,
  Clock,
  Database,
} from "lucide-react";
import { toast } from "sonner";

// ============================================================================
// Types - mirrored from zeitgeistService
// ============================================================================

interface ZeitgeistTopic {
  id: string;
  question: string;
  score: number;  // rawScore from API
  frequency: number;
  trend: 'rising' | 'stable' | 'falling';
  hasGoodAnswer: boolean;
  answerConfidence: number;
  sources: Array<{
    type: string;
    count?: number;
    weight: number;
  }>;
  category: 'rlhf' | 'jira' | 'test_failure' | 'chat_history' | 'mixed';
  lastSeen: string;
}

interface ZeitgeistStats {
  totalTopics: number;
  withGoodAnswers: number;
  lastRefresh: string | null;
  sourceBreakdown: {
    rlhf: number;
    jira: number;
    test: number;
  };
  cacheStatus: 'fresh' | 'stale' | 'empty';
}

interface ZeitgeistPanelProps {
  className?: string;
}

// ============================================================================
// Helper Components
// ============================================================================

function TrendIndicator({ trend }: { trend: 'rising' | 'stable' | 'falling' }) {
  switch (trend) {
    case 'rising':
      return (
        <div className="flex items-center gap-1 text-[var(--mac-status-success-text)]">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="text-xs">Rising</span>
        </div>
      );
    case 'falling':
      return (
        <div className="flex items-center gap-1 text-[var(--mac-status-error-text)]">
          <TrendingDown className="h-3.5 w-3.5" />
          <span className="text-xs">Falling</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1 text-[var(--mac-text-secondary)]">
          <Minus className="h-3.5 w-3.5" />
          <span className="text-xs">Stable</span>
        </div>
      );
  }
}

function SourceBadge({ category }: { category: ZeitgeistTopic['category'] }) {
  const config: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
    rlhf: {
      icon: <MessageSquare className="h-3 w-3" />,
      label: "RLHF",
      className: "bg-[var(--mac-primary-blue-400)]/10 border-[var(--mac-primary-blue-400)]/30 text-[var(--mac-primary-blue-400)]"
    },
    jira: {
      icon: <FileText className="h-3 w-3" />,
      label: "Jira",
      className: "bg-[var(--mac-accent-orange-400)]/10 border-[var(--mac-accent-orange-400)]/30 text-[var(--mac-accent-orange-400)]"
    },
    test_failure: {
      icon: <Bug className="h-3 w-3" />,
      label: "Test",
      className: "bg-[var(--mac-status-error-bg)] border-[var(--mac-status-error-border)] text-[var(--mac-status-error-text)]"
    },
    chat_history: {
      icon: <MessageSquare className="h-3 w-3" />,
      label: "Chat",
      className: "bg-[var(--mac-accent-purple-400)]/10 border-[var(--mac-accent-purple-400)]/30 text-[var(--mac-accent-purple-400)]"
    },
    mixed: {
      icon: <Zap className="h-3 w-3" />,
      label: "Mixed",
      className: "bg-[var(--mac-surface-elevated)] border-[var(--mac-utility-border)] text-[var(--mac-text-secondary)]"
    }
  };

  const { icon, label, className } = config[category] || config.mixed;

  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-light flex items-center gap-1", className)}
    >
      {icon}
      {label}
    </Badge>
  );
}

function ScoreBar({ score, maxScore = 1.0 }: { score: number; maxScore?: number }) {
  const percentage = Math.min((score / maxScore) * 100, 100);

  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-2 bg-[var(--mac-surface-background)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--mac-primary-blue-400)] to-[var(--mac-accent-purple-400)] rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-[var(--mac-text-secondary)] font-light w-8 text-right">
        {(score * 100).toFixed(0)}
      </span>
    </div>
  );
}

function KBStatus({ hasGoodAnswer, confidence }: { hasGoodAnswer: boolean; confidence: number }) {
  if (hasGoodAnswer) {
    return (
      <div className="flex items-center gap-1 text-[var(--mac-status-success-text)]" title={`Confidence: ${(confidence * 100).toFixed(0)}%`}>
        <CheckCircle className="h-4 w-4" />
        <span className="text-xs">{(confidence * 100).toFixed(0)}%</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-[var(--mac-status-warning-text)]" title="No strong KB match">
      <XCircle className="h-4 w-4" />
      <span className="text-xs">Gap</span>
    </div>
  );
}

function CacheStatusBadge({ status }: { status: 'fresh' | 'stale' | 'empty' }) {
  const config = {
    fresh: {
      className: "mac-status-connected",
      label: "Fresh"
    },
    stale: {
      className: "mac-status-warning",
      label: "Stale"
    },
    empty: {
      className: "mac-status-badge bg-[var(--mac-surface-elevated)] text-[var(--mac-text-secondary)]",
      label: "Empty"
    }
  };

  const { className, label } = config[status];

  return (
    <Badge variant="secondary" className={cn("text-xs font-light", className)}>
      {label}
    </Badge>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ZeitgeistPanel({ className }: ZeitgeistPanelProps) {
  const [topics, setTopics] = useState<ZeitgeistTopic[]>([]);
  const [stats, setStats] = useState<ZeitgeistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load trending data
  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/zeitgeist/trending");
      if (response.ok) {
        const data = await response.json();
        setTopics(data.topics || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error("[ZeitgeistPanel] Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh zeitgeist
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/zeitgeist/refresh", { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success("Zeitgeist refreshed", {
            description: `Analyzed ${data.analysis?.topicsAnalyzed || 0} topics in ${data.analysis?.duration || 0}ms`
          });
          await loadData();
        } else {
          toast.error("Refresh failed", { description: data.error });
        }
      }
    } catch (error) {
      console.error("[ZeitgeistPanel] Refresh error:", error);
      toast.error("Failed to refresh zeitgeist");
    } finally {
      setRefreshing(false);
    }
  };

  // Load on mount
  useEffect(() => {
    loadData();
  }, []);

  // Format relative time
  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className={cn(
      "mac-card",
      "bg-[var(--mac-surface-elevated)]",
      "border-[var(--mac-utility-border)]",
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-light text-[var(--mac-text-primary)]">
              <TrendingUp className="h-5 w-5 text-[var(--mac-accent-purple-400)]" />
              Zeitgeist Intelligence
            </CardTitle>
            <CardDescription className="font-light text-[var(--mac-text-secondary)]">
              Hot topics aggregated from RLHF, Jira, and test signals
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {stats && <CacheStatusBadge status={stats.cacheStatus} />}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className={cn(
                "mac-button-outline",
                "hover:border-[var(--mac-primary-blue-400)]",
                "hover:bg-[var(--mac-state-hover)]"
              )}
            >
              {refreshing ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <>
            {/* Stats Row */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={cn(
                  "p-3 rounded-lg",
                  "bg-[var(--mac-surface-card)]",
                  "border border-[var(--mac-utility-border)]"
                )}>
                  <div className="text-xs text-[var(--mac-text-secondary)] font-light">Total Topics</div>
                  <div className="text-2xl font-light text-[var(--mac-text-primary)]">{stats.totalTopics}</div>
                </div>
                <div className={cn(
                  "p-3 rounded-lg",
                  "bg-[var(--mac-surface-card)]",
                  "border border-[var(--mac-utility-border)]"
                )}>
                  <div className="text-xs text-[var(--mac-text-secondary)] font-light">KB Coverage</div>
                  <div className="text-2xl font-light text-[var(--mac-status-success-text)]">
                    {stats.totalTopics > 0
                      ? Math.round((stats.withGoodAnswers / stats.totalTopics) * 100)
                      : 0}%
                  </div>
                </div>
                <div className={cn(
                  "p-3 rounded-lg",
                  "bg-[var(--mac-surface-card)]",
                  "border border-[var(--mac-utility-border)]"
                )}>
                  <div className="text-xs text-[var(--mac-text-secondary)] font-light flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Last Refresh
                  </div>
                  <div className="text-lg font-light text-[var(--mac-text-primary)]">
                    {formatRelativeTime(stats.lastRefresh)}
                  </div>
                </div>
                <div className={cn(
                  "p-3 rounded-lg",
                  "bg-[var(--mac-surface-card)]",
                  "border border-[var(--mac-utility-border)]"
                )}>
                  <div className="text-xs text-[var(--mac-text-secondary)] font-light flex items-center gap-1">
                    <Database className="h-3 w-3" /> Sources
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[var(--mac-primary-blue-400)]" title="RLHF signals">
                      R:{stats.sourceBreakdown.rlhf}
                    </span>
                    <span className="text-xs text-[var(--mac-accent-orange-400)]" title="Jira signals">
                      J:{stats.sourceBreakdown.jira}
                    </span>
                    <span className="text-xs text-[var(--mac-status-error-text)]" title="Test failure signals">
                      T:{stats.sourceBreakdown.test}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Topics Table */}
            {topics.length > 0 ? (
              <div className={cn(
                "rounded-lg overflow-hidden",
                "border border-[var(--mac-utility-border)]"
              )}>
                <table className="w-full">
                  <thead>
                    <tr className="bg-[var(--mac-surface-card)]">
                      <th className="px-4 py-2 text-left text-xs font-light text-[var(--mac-text-secondary)]">Question</th>
                      <th className="px-4 py-2 text-left text-xs font-light text-[var(--mac-text-secondary)] w-28">Score</th>
                      <th className="px-4 py-2 text-left text-xs font-light text-[var(--mac-text-secondary)] w-20">Trend</th>
                      <th className="px-4 py-2 text-left text-xs font-light text-[var(--mac-text-secondary)] w-16">KB</th>
                      <th className="px-4 py-2 text-left text-xs font-light text-[var(--mac-text-secondary)] w-20">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topics.slice(0, 15).map((topic, idx) => (
                      <tr
                        key={topic.id || idx}
                        className={cn(
                          "border-t border-[var(--mac-utility-border)]",
                          "hover:bg-[var(--mac-state-hover)]",
                          "transition-colors"
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-light text-[var(--mac-text-primary)] line-clamp-2">
                            {topic.question}
                          </div>
                          <div className="text-xs text-[var(--mac-text-muted)] mt-0.5">
                            {topic.frequency > 1 ? `${topic.frequency}x` : ''} {formatRelativeTime(topic.lastSeen)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <ScoreBar score={topic.score} />
                        </td>
                        <td className="px-4 py-3">
                          <TrendIndicator trend={topic.trend} />
                        </td>
                        <td className="px-4 py-3">
                          <KBStatus hasGoodAnswer={topic.hasGoodAnswer} confidence={topic.answerConfidence} />
                        </td>
                        <td className="px-4 py-3">
                          <SourceBadge category={topic.category} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={cn(
                "flex flex-col items-center justify-center py-12",
                "text-[var(--mac-text-secondary)]"
              )}>
                <TrendingUp className="h-10 w-10 mb-4 opacity-30" />
                <p className="font-light">No trending topics found</p>
                <p className="text-xs text-[var(--mac-text-muted)]">Click refresh to gather signals</p>
              </div>
            )}

            {/* Knowledge Gap Alert */}
            {stats && stats.totalTopics > 0 && stats.withGoodAnswers < stats.totalTopics * 0.7 && (
              <div className={cn(
                "p-4 rounded-lg",
                "bg-[var(--mac-status-warning-bg)]",
                "border border-[var(--mac-status-warning-border)]"
              )}>
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-[var(--mac-status-warning-text)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-light text-[var(--mac-status-warning-text)]">
                      Knowledge Gap Detected
                    </p>
                    <p className="text-xs text-[var(--mac-text-secondary)] mt-1">
                      {stats.totalTopics - stats.withGoodAnswers} of {stats.totalTopics} trending topics lack strong KB answers.
                      Consider adding documentation for these areas.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
