/**
 * Feedback Timeline Component
 *
 * Shows chronological history of feedback for queries
 * Part of Fix tab in Phase 5.4
 * 
 * Created 2025-12-16: Implemented for RLHF demo
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { ScrollArea } from "./scroll-area";
import { 
  Clock, 
  RefreshCw, 
  ThumbsUp, 
  ThumbsDown, 
  Edit3, 
  CheckCircle, 
  XCircle,
  FileCode,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Filter
} from "lucide-react";
import { useSupabaseClient } from "../../hooks/useSupabaseClient";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface TimelineEvent {
  id: string;
  query: string;
  response: string;
  thumbs_up: boolean | null;
  rating: number | null;
  status: string;
  severity: string | null;
  suggested_correction: string | null;
  curator_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  session_id: string;
  model_used: string | null;
}

interface FeedbackTimelineProps {
  className?: string;
}

export function FeedbackTimeline({ className }: FeedbackTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "negative" | "corrected" | "approved">("all");
  const supabase = useSupabaseClient();

  useEffect(() => {
    loadTimeline();
  }, [filter]);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("rlhf_feedback")
        .select("id, query, user_query, response, feedback_type, feedback_value, feedback_metadata, status, created_at, updated_at, session_id, model_used, reviewed_at")
        .order("created_at", { ascending: false })
        .limit(50);

      // Apply filters
      if (filter === "negative") {
        query = query.or("feedback_type.eq.thumbs_down,status.eq.rejected");
      } else if (filter === "corrected") {
        query = query.filter("feedback_metadata->>correction", "neq", "null");
      } else if (filter === "approved") {
        query = query.eq("status", "approved");
      }

      const { data, error } = await query;

      if (error) {
        console.error("Failed to load timeline:", error);
        toast.error("Failed to load feedback timeline");
      } else {
        setEvents(data?.map(item => ({
          ...item,
          query: item.query || item.user_query || "Unknown query",
          response: item.response || "",
          thumbs_up: item.feedback_type === "thumbs_up",
          rating: item.feedback_value?.score ?? null,
          severity: item.feedback_metadata?.severity ?? null,
          suggested_correction: item.feedback_metadata?.correction ?? null,
          curator_notes: item.feedback_metadata?.notes ?? null
        })) || []);
      }
    } catch (error) {
      console.error("Error loading timeline:", error);
      toast.error("Error loading timeline");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getEventIcon = (event: TimelineEvent) => {
    if (event.suggested_correction) return <Edit3 className="h-4 w-4 text-cyan-400" />;
    if (event.status === "approved") return <CheckCircle className="h-4 w-4 text-green-400" />;
    if (event.status === "rejected") return <XCircle className="h-4 w-4 text-red-400" />;
    if (event.thumbs_up === true) return <ThumbsUp className="h-4 w-4 text-green-400" />;
    if (event.thumbs_up === false) return <ThumbsDown className="h-4 w-4 text-red-400" />;
    return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
  };

  const getEventColor = (event: TimelineEvent) => {
    if (event.status === "approved") return "border-l-green-500";
    if (event.status === "rejected") return "border-l-red-500";
    if (event.suggested_correction) return "border-l-cyan-500";
    if (event.thumbs_up === false || (event.rating && event.rating < 3)) return "border-l-orange-500";
    if (event.thumbs_up === true || (event.rating && event.rating >= 4)) return "border-l-green-500";
    return "border-l-border";
  };

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(event.created_at).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  return (
    <Card className={cn("mac-card", "h-full flex flex-col bg-card/50 border-border", className)}>
      <CardHeader className="mac-card">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Clock className="h-5 w-5 text-primary-400" />
              Feedback Timeline
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Track feedback history and improvement loop
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadTimeline}
            disabled={loading}
            className="mac-button gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 mt-4">
          <Button className="mac-button"
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className="gap-1 text-xs"
          >
            <Filter className="h-3 w-3" />
            All
          </Button>
          <Button className="mac-button"
            variant={filter === "negative" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("negative")}
            className="gap-1 text-xs"
          >
            <ThumbsDown className="h-3 w-3" />
            Needs Fix
          </Button>
          <Button className="mac-button"
            variant={filter === "corrected" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("corrected")}
            className="gap-1 text-xs"
          >
            <Edit3 className="h-3 w-3" />
            Corrected
          </Button>
          <Button className="mac-button"
            variant={filter === "approved" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("approved")}
            className="gap-1 text-xs"
          >
            <CheckCircle className="h-3 w-3" />
            Approved
          </Button>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="bg-card/30 rounded-lg p-2 text-center">
            <p className="text-lg font-normal text-foreground">{events.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="bg-card/30 rounded-lg p-2 text-center">
            <p className="text-lg font-normal text-green-400">
              {events.filter(e => e.thumbs_up === true || (e.rating && e.rating >= 4)).length}
            </p>
            <p className="text-xs text-muted-foreground">Positive</p>
          </div>
          <div className="bg-card/30 rounded-lg p-2 text-center">
            <p className="text-lg font-normal text-orange-400">
              {events.filter(e => e.thumbs_up === false || (e.rating && e.rating < 3)).length}
            </p>
            <p className="text-xs text-muted-foreground">Negative</p>
          </div>
          <div className="bg-card/30 rounded-lg p-2 text-center">
            <p className="text-lg font-normal text-cyan-400">
              {events.filter(e => e.suggested_correction).length}
            </p>
            <p className="text-xs text-muted-foreground">Corrected</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full pr-4">
          {loading && events.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mb-4 text-muted" />
              <p className="text-lg">No feedback events found</p>
              <p className="text-sm">Feedback from chat sessions will appear here</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedEvents).map(([date, dateEvents]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px bg-muted flex-1" />
                    <span className="text-xs text-muted-foreground font-normal">{date}</span>
                    <div className="h-px bg-muted flex-1" />
                  </div>

                  <div className="space-y-3">
                    {dateEvents.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "bg-card/30 border border-border rounded-lg p-3 border-l-4",
                          getEventColor(event)
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">{getEventIcon(event)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <code className="text-[10px] text-muted-foreground font-mono">
                                {event.id.substring(0, 8)}...
                              </code>
                              {event.rating && (
                                <Badge variant="outline" className="text-[10px] h-4">
                                  {event.rating}/5
                                </Badge>
                              )}
                              {event.severity && (
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-[10px] h-4",
                                    event.severity === "critical" && "border-red-500/50 text-red-400",
                                    event.severity === "major" && "border-orange-500/50 text-orange-400"
                                  )}
                                >
                                  {event.severity}
                                </Badge>
                              )}
                              {event.status && event.status !== "pending" && (
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-[10px] h-4",
                                    event.status === "approved" && "border-green-500/50 text-green-400",
                                    event.status === "rejected" && "border-red-500/50 text-red-400"
                                  )}
                                >
                                  {event.status}
                                </Badge>
                              )}
                              {event.model_used && (
                                <Badge variant="outline" className="text-[10px] h-4 border-primary-400/50 text-primary-400">
                                  {event.model_used}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground ml-auto">
                                {formatTimeAgo(event.created_at)}
                              </span>
                            </div>

                            <p className="text-sm text-foreground mt-2 line-clamp-2">
                              {event.query}
                            </p>

                            {event.suggested_correction && (
                              <div className="mt-2 p-2 bg-cyan-500/10 rounded border border-cyan-500/20">
                                <div className="flex items-center gap-1 text-xs text-cyan-400 mb-1">
                                  <Edit3 className="h-3 w-3" />
                                  Correction Applied
                                </div>
                                <p className="text-xs text-foreground line-clamp-2">
                                  {event.suggested_correction}
                                </p>
                              </div>
                            )}

                            {event.curator_notes && (
                              <p className="text-xs text-muted-foreground mt-2 italic">
                                "{event.curator_notes}"
                              </p>
                            )}

                            {event.reviewed_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Reviewed: {formatDate(event.reviewed_at)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

