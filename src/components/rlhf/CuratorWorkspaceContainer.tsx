/**
 * CuratorWorkspaceContainer - API-Connected Wrapper
 *
 * Fetches annotation queue from /api/rlhf/queue and passes it to CuratorWorkspace.
 * Handles loading states, errors, and API interactions for curator actions.
 *
 * This container enables the CuratorWorkspace to work with real data from Supabase.
 */

"use client";

import React, { useState, useCallback, useEffect } from "react";
import { cn } from "../../lib/utils";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CuratorWorkspace } from "./CuratorWorkspace";
import type { AnnotationQueueItem } from "./types";

interface CuratorWorkspaceContainerProps {
  className?: string;
  currentCuratorId?: string;
}

interface QueueStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  revisionRequested?: number;
}

export function CuratorWorkspaceContainer({
  className,
  currentCuratorId,
}: CuratorWorkspaceContainerProps) {
  const [queue, setQueue] = useState<AnnotationQueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Fetch queue from API
  const fetchQueue = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/rlhf/queue?status=pending&limit=50");

      if (!response.ok) {
        throw new Error(`Failed to fetch queue: ${response.status}`);
      }

      const data = await response.json();
      setQueue(data.queue || []);
      setStats(data.stats || null);
      setIsDemoMode(!!data.message?.includes("Demo mode") || !!data.message?.includes("demo"));
    } catch (err) {
      console.error("Queue fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch queue");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Handle approve action
  const handleApprove = useCallback(
    async (feedbackId: string, notes?: string) => {
      try {
        const response = await fetch("/api/rlhf/queue", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feedbackId,
            status: "approved",
            curatorId: currentCuratorId,
            curatorNotes: notes,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to approve feedback");
        }

        // Refresh the queue
        await fetchQueue();
      } catch (err) {
        console.error("Approve error:", err);
        throw err;
      }
    },
    [currentCuratorId, fetchQueue]
  );

  // Handle reject action
  const handleReject = useCallback(
    async (feedbackId: string, notes: string) => {
      try {
        const response = await fetch("/api/rlhf/queue", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feedbackId,
            status: "rejected",
            curatorId: currentCuratorId,
            curatorNotes: notes,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to reject feedback");
        }

        // Refresh the queue
        await fetchQueue();
      } catch (err) {
        console.error("Reject error:", err);
        throw err;
      }
    },
    [currentCuratorId, fetchQueue]
  );

  // Handle request revision action
  const handleRequestRevision = useCallback(
    async (feedbackId: string, notes: string) => {
      try {
        const response = await fetch("/api/rlhf/queue", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feedbackId,
            status: "revision_requested",
            curatorId: currentCuratorId,
            curatorNotes: notes,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to request revision");
        }

        // Refresh the queue
        await fetchQueue();
      } catch (err) {
        console.error("Request revision error:", err);
        throw err;
      }
    },
    [currentCuratorId, fetchQueue]
  );

  // Handle skip action (no API call, just moves to next)
  const handleSkip = useCallback((feedbackId: string) => {
    // Skip is local - just moves to next item without API call
    console.log("Skipping feedback:", feedbackId);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn("mac-card", `bg-card/50 border-border ${className}`)}>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 text-primary-400 animate-spin mb-4" />
          <p className="mac-body text-muted-foreground">Loading annotation queue...</p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error && queue.length === 0) {
    return (
      <Card className={cn("mac-card", `bg-card/50 border-border ${className}`)}>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-10 w-10 text-red-400 mb-4" />
          <p className="mac-body text-foreground font-normal mb-2">Failed to load queue</p>
          <p className="text-muted-foreground text-sm mb-4">{error}</p>
          <Button variant="outline" onClick={fetchQueue} className="mac-button border-border text-foreground">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Status Bar */}
      {(isDemoMode || stats) && (
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-3">
            {isDemoMode && (
              <Badge
                variant="outline"
                className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
              >
                Demo Mode
              </Badge>
            )}
            {stats && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  <strong className="text-foreground">{stats.pending}</strong> pending
                </span>
                <span>
                  <strong className="text-green-400">{stats.approved}</strong> approved
                </span>
                <span>
                  <strong className="text-red-400">{stats.rejected}</strong> rejected
                </span>
              </div>
            )}
          </div>
          <Button variant="ghost"
            size="sm"
            onClick={fetchQueue}
            className="mac-button mac-button-outline text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      )}

      {/* Curator Workspace */}
      <CuratorWorkspace
        queueItems={queue}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestRevision={handleRequestRevision}
        onSkip={handleSkip}
        currentCuratorId={currentCuratorId}
      />
    </div>
  );
}

export default CuratorWorkspaceContainer;
