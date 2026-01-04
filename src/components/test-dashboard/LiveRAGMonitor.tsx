/**
 * Live RAG Monitor Component
 *
 * Real-time visualization of RAG pipeline decisions
 * Part of Test tab integration - Phase 6
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import {
  Activity,
  Lightbulb,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
} from "lucide-react";

interface RAGPipelineEvent {
  id: string;
  timestamp: string;
  query: string;
  strategy: "basic" | "context-aware" | "agentic";
  stages: {
    name: string;
    duration: number;
    status: "success" | "failed" | "skipped";
    details?: any;
  }[];
  totalDuration: number;
  confidence: number;
  documentsRetrieved: number;
  documentsReranked: number;
  agentSteps?: number;
}

export function LiveRAGMonitor() {
  const [events, setEvents] = useState<RAGPipelineEvent[]>([]);
  const [stats, setStats] = useState({
    avgDuration: 0,
    avgConfidence: 0,
    strategyDistribution: { basic: 0, "context-aware": 0, agentic: 0 },
  });

  useEffect(() => {
    // In production, this would connect to a WebSocket or polling endpoint
    // For now, we'll simulate with local storage or mock data
    loadRecentEvents();

    // Simulate real-time updates (in production, use WebSocket)
    const interval = setInterval(() => {
      loadRecentEvents();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadRecentEvents = () => {
    // Try to load from localStorage (events are stored by chat API)
    try {
      const stored = localStorage.getItem("rag-pipeline-events");
      if (stored) {
        const parsed: RAGPipelineEvent[] = JSON.parse(stored);
        setEvents(parsed.slice(-20)); // Keep last 20 events

        // Calculate stats
        if (parsed.length > 0) {
          const avgDuration = parsed.reduce((sum, e) => sum + e.totalDuration, 0) / parsed.length;
          const avgConfidence = parsed.reduce((sum, e) => sum + e.confidence, 0) / parsed.length;
          const strategyDistribution = {
            basic: parsed.filter((e) => e.strategy === "basic").length,
            "context-aware": parsed.filter((e) => e.strategy === "context-aware").length,
            agentic: parsed.filter((e) => e.strategy === "agentic").length,
          };

          setStats({ avgDuration, avgConfidence, strategyDistribution });
        }
      }
    } catch (error) {
      console.error("Failed to load RAG events:", error);
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case "basic":
        return "bg-muted/20 text-muted-foreground";
      case "context-aware":
        return "bg-blue-500/20 text-blue-300";
      case "agentic":
        return "bg-purple-500/20 text-purple-300";
      default:
        return "bg-muted/20 text-muted-foreground";
    }
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case "basic":
        return <Search className="h-3 w-3" />;
      case "context-aware":
        return <Lightbulb className="h-3 w-3" />;
      case "agentic":
        return <Activity className="h-3 w-3" />;
      default:
        return <Search className="h-3 w-3" />;
    }
  };

  return (
    <div className="h-full space-y-4">
      {/* Header with stats */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Activity className="h-5 w-5 text-green-400 animate-pulse" />
            Live RAG Pipeline Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-foreground">
                {stats.avgDuration.toFixed(0)}ms
              </div>
              <div className="text-xs text-muted-foreground">Avg Duration</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {(stats.avgConfidence * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Confidence</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{events.length}</div>
              <div className="text-xs text-muted-foreground">Recent Events</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Distribution */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-sm text-foreground">Strategy Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Basic RAG</span>
              <Badge className="bg-muted/20 text-muted-foreground">
                {stats.strategyDistribution.basic}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Context-Aware</span>
              <Badge className="bg-blue-500/20 text-blue-300">
                {stats.strategyDistribution["context-aware"]}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Agentic RAG</span>
              <Badge className="bg-purple-500/20 text-purple-300">
                {stats.strategyDistribution.agentic}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Timeline */}
      <Card className="bg-card/50 border-border flex-1">
        <CardHeader>
          <CardTitle className="text-sm text-foreground">Pipeline Events</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {events.length > 0 ? (
              <div className="space-y-3">
                {events.map((event) => (
                  <Card key={event.id} className="bg-card/30 border-border">
                    <CardContent className="p-4 space-y-2">
                      {/* Event header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Badge className={getStrategyColor(event.strategy)}>
                            {getStrategyIcon(event.strategy)}
                            <span className="ml-1">{event.strategy}</span>
                          </Badge>
                          <p className="text-xs text-foreground mt-2 line-clamp-1">{event.query}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                      </div>

                      {/* Pipeline stages */}
                      <div className="flex items-center gap-1 mt-2">
                        {event.stages.map((stage, idx) => (
                          <div
                            key={idx}
                            className="flex-1 h-2 rounded"
                            style={{
                              backgroundColor:
                                stage.status === "success"
                                  ? "rgba(34, 197, 94, 0.3)"
                                  : stage.status === "failed"
                                    ? "rgba(239, 68, 68, 0.3)"
                                    : "rgba(161, 161, 170, 0.3)",
                            }}
                            title={`${stage.name} (${stage.duration}ms) - ${stage.status}`}
                          />
                        ))}
                      </div>

                      {/* Event metrics */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.totalDuration}ms
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {(event.confidence * 100).toFixed(0)}% confidence
                        </span>
                        <span className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          {event.documentsRetrieved}→{event.documentsReranked} docs
                        </span>
                        {event.agentSteps && event.agentSteps > 0 && (
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            {event.agentSteps} agent steps
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Activity className="h-12 w-12 mb-4 text-muted-foreground" />
                <p className="text-sm">No pipeline events yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Events will appear here as users interact with the chat
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
