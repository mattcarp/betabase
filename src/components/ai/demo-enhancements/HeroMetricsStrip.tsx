"use client";

import { cn } from "../../../lib/utils";
import { Database, Cpu, Clock, Zap, TrendingUp } from "lucide-react";

interface HeroMetricsStripProps {
  vectorCount?: number;
  embeddingModel?: string;
  avgLatencyMs?: number;
  cacheHitRate?: number;
  queryCount?: number;
  className?: string;
  compact?: boolean;
}

/**
 * Hero Metrics Strip - displays key RAG stats at a glance
 * Real count: siam_vectors (15,245) + jira_tickets (10,927) + wiki_documents (396) = 26,568
 */
export function HeroMetricsStrip({
  vectorCount = 26568,
  embeddingModel = "Gemini",
  avgLatencyMs = 280,
  cacheHitRate,
  queryCount,
  className,
  compact = false,
}: HeroMetricsStripProps) {
  const metrics = [
    {
      icon: Database,
      label: "Vectors",
      value: vectorCount.toLocaleString(),
      highlight: true,
      color: "text-emerald-400",
    },
    {
      icon: Cpu,
      label: "Embeddings",
      value: embeddingModel,
      color: "text-blue-400",
    },
    {
      icon: Clock,
      label: "Avg Latency",
      value: `${avgLatencyMs}ms`,
      color: "text-yellow-400",
    },
    ...(cacheHitRate !== undefined
      ? [
          {
            icon: Zap,
            label: "Cache Hit",
            value: `${Math.round(cacheHitRate * 100)}%`,
            color: "text-purple-400",
          },
        ]
      : []),
    ...(queryCount !== undefined
      ? [
          {
            icon: TrendingUp,
            label: "Queries",
            value: queryCount.toLocaleString(),
            color: "text-cyan-400",
          },
        ]
      : []),
  ];

  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-4 px-3 py-1.5",
          "bg-card/70 border border-border/50 rounded-full",
          "backdrop-blur-sm",
          className
        )}
      >
        {metrics.slice(0, 3).map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div key={idx} className="flex items-center gap-1.5">
              <Icon className={cn("h-3.5 w-3.5", metric.color)} />
              <span
                className={cn(
                  "text-xs font-medium",
                  metric.highlight ? "text-white" : "text-foreground"
                )}
              >
                {metric.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-6 px-6 py-3",
        "bg-gradient-to-r from-card/80 via-card/90 to-card/80",
        "border-y border-border/30",
        "backdrop-blur-sm",
        className
      )}
    >
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        return (
          <div
            key={idx}
            className={cn(
              "flex items-center gap-2 px-3 py-1",
              metric.highlight && "bg-emerald-500/10 rounded-lg border border-emerald-500/20"
            )}
          >
            <Icon className={cn("h-4 w-4", metric.color)} />
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {metric.label}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  metric.highlight ? "text-emerald-300" : "text-foreground"
                )}
              >
                {metric.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default HeroMetricsStrip;
