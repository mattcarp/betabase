"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { ScrollArea } from "./scroll-area";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Flag,
  ArrowRight,
  Eye,
  FileText,
  Lightbulb,
  Sparkles,
  Filter,
  MoreVertical,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

interface QueueItem {
  id: string;
  type: "response-review" | "low-confidence" | "correction" | "document-relevance";
  title: string;
  description: string;
  source: string;
  timestamp: Date;
  priority: "high" | "medium" | "low";
  confidence?: number;
  status?: string;
  metadata?: {
    query?: string;
    response?: string;
    documentName?: string;
    feedbackType?: string;
    thumbsUp?: boolean;
    rating?: number;
    categories?: string[];
    severity?: string;
  };
}

interface CuratorQueueProps {
  className?: string;
  onItemSelect?: (item: QueueItem) => void;
}

// Map database feedback to queue items
function mapFeedbackToQueueItem(feedback: any): QueueItem {
  // Determine type based on feedback characteristics
  let type: QueueItem["type"] = "response-review";
  if (feedback.thumbs_up === false || (feedback.rating && feedback.rating <= 2)) {
    type = "correction";
  } else if (feedback.severity === "critical" || feedback.severity === "major") {
    type = "low-confidence";
  }

  // Determine priority based on severity or thumbs down
  let priority: QueueItem["priority"] = "medium";
  if (feedback.severity === "critical" || feedback.thumbs_up === false) {
    priority = "high";
  } else if (feedback.severity === "minor" || feedback.severity === "suggestion") {
    priority = "low";
  }

  // Create a descriptive title
  const query = feedback.user_query || feedback.query || "No query provided";
  const title = query.length > 50 ? query.substring(0, 47) + "..." : query;

  // Create description
  let description = feedback.feedback_text || "User feedback requires review";
  if (feedback.thumbs_up === false) {
    description = "User marked response as not helpful";
  } else if (feedback.suggested_correction) {
    description = `Correction: ${feedback.suggested_correction.substring(0, 100)}...`;
  }

  return {
    id: feedback.id,
    type,
    title,
    description,
    source: `Session ${feedback.session_id?.substring(0, 8) || "unknown"}`,
    timestamp: new Date(feedback.created_at),
    priority,
    confidence: feedback.rating ? feedback.rating * 20 : undefined,
    status: feedback.status,
    metadata: {
      query: feedback.user_query || feedback.query,
      response: feedback.ai_response || feedback.response,
      feedbackType: feedback.feedback_type,
      thumbsUp: feedback.thumbs_up,
      rating: feedback.rating,
      categories: feedback.categories,
      severity: feedback.severity,
    },
  };
}

export const CuratorQueue: React.FC<CuratorQueueProps> = ({ className, onItemSelect }) => {
  const [filter, setFilter] = useState<"all" | "high" | "pending">("all");
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch feedback from the API
  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/rlhf/feedback?status=pending&limit=50");
      if (!response.ok) {
        throw new Error("Failed to fetch feedback queue");
      }
      const data = await response.json();
      const mappedItems = (data.feedback || []).map(mapFeedbackToQueueItem);
      setItems(mappedItems);
    } catch (error) {
      // Network failures are expected during rapid navigation/tests - fail silently
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        // Silently ignore aborted requests
      } else {
        console.warn("Error loading curator queue:", error);
        toast.error("Failed to load queue - using cached data");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "high") return item.priority === "high";
    return true;
  });

  const handleApprove = async (itemId: string) => {
    setActionLoading(itemId);
    try {
      const response = await fetch(`/api/rlhf/feedback/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "approved",
          curator_notes: "Approved by curator",
          reviewed_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to approve");

      setItems(items.filter((item) => item.id !== itemId));
      if (selectedItem?.id === itemId) setSelectedItem(null);
      toast.success("Feedback approved and added to training data");
    } catch (error) {
      console.error("Error approving feedback:", error);
      toast.error("Failed to approve feedback");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (itemId: string) => {
    setActionLoading(itemId);
    try {
      const response = await fetch(`/api/rlhf/feedback/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          curator_notes: "Rejected by curator",
          reviewed_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to reject");

      setItems(items.filter((item) => item.id !== itemId));
      if (selectedItem?.id === itemId) setSelectedItem(null);
      toast.success("Feedback rejected");
    } catch (error) {
      console.error("Error rejecting feedback:", error);
      toast.error("Failed to reject feedback");
    } finally {
      setActionLoading(null);
    }
  };

  const handleFlag = async (itemId: string) => {
    setActionLoading(itemId);
    try {
      const response = await fetch(`/api/rlhf/feedback/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "needs_revision",
          severity: "critical",
          curator_notes: "Escalated for senior review",
        }),
      });

      if (!response.ok) throw new Error("Failed to escalate");

      toast.success("Escalated for senior review");
      await loadQueue(); // Refresh to show updated status
    } catch (error) {
      console.error("Error escalating feedback:", error);
      toast.error("Failed to escalate feedback");
    } finally {
      setActionLoading(null);
    }
  };

  const getTypeIcon = (type: QueueItem["type"]) => {
    switch (type) {
      case "response-review":
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case "low-confidence":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case "correction":
        return <FileText className="h-4 w-4 text-purple-600" />;
      case "document-relevance":
        return <Lightbulb className="h-4 w-4 text-emerald-600" />;
    }
  };

  const getPriorityBadge = (priority: QueueItem["priority"]) => {
    switch (priority) {
      case "high":
        return (
          <Badge
            variant="outline"
            className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-xs"
          >
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs"
          >
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge
            variant="outline"
            className="bg-slate-500/10 text-slate-600 border-slate-500/20 text-xs"
          >
            Low
          </Badge>
        );
    }
  };

  const formatTimeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "< 1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  return (
    <div className={cn("grid grid-cols-5 gap-4 h-full", className)}>
      {/* Queue List */}
      <Card className="col-span-2 mac-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              Curator Queue
              <Badge variant="secondary" className="ml-2">
                {loading ? "..." : filteredItems.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => loadQueue()}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant={filter === "all" ? "secondary" : "ghost"}
                size="sm"
                className="text-xs h-7"
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button
                variant={filter === "high" ? "secondary" : "ghost"}
                size="sm"
                className="text-xs h-7"
                onClick={() => setFilter("high")}
              >
                High Priority
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="space-y-1 p-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    selectedItem?.id === item.id
                      ? "bg-purple-500/10 border-purple-500/30"
                      : "hover:bg-muted/50 border-transparent"
                  )}
                  onClick={() => {
                    setSelectedItem(item);
                    onItemSelect?.(item);
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      <span className="font-medium text-sm">{item.title}</span>
                    </div>
                    {getPriorityBadge(item.priority)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.source}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>
                  {item.confidence && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Confidence</span>
                        <span
                          className={cn(
                            item.confidence < 70 ? "text-amber-600" : "text-emerald-600"
                          )}
                        >
                          {item.confidence}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            item.confidence < 70 ? "bg-amber-500" : "bg-emerald-500"
                          )}
                          style={{ width: `${item.confidence}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Queue is empty</p>
                  <p className="text-xs">All items have been reviewed</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Item Details */}
      <Card className="col-span-3 mac-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Review Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedItem ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getTypeIcon(selectedItem.type)}
                    <h3 className="font-medium">{selectedItem.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                </div>
                {getPriorityBadge(selectedItem.priority)}
              </div>

              {/* Content */}
              {selectedItem.metadata?.query && (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Original Query</p>
                    <p className="text-sm">{selectedItem.metadata.query}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <p className="text-xs font-medium text-blue-600 mb-2">AI Response</p>
                    <p className="text-sm">{selectedItem.metadata.response}</p>
                  </div>
                </div>
              )}

              {selectedItem.metadata?.documentName && (
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Document</p>
                  <p className="text-sm font-mono">{selectedItem.metadata.documentName}</p>
                </div>
              )}

              {/* Confidence Score */}
              {selectedItem.confidence && (
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Confidence Score</span>
                    <span
                      className={cn(
                        "text-lg font-medium",
                        selectedItem.confidence < 70 ? "text-amber-600" : "text-emerald-600"
                      )}
                    >
                      {selectedItem.confidence}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        selectedItem.confidence < 70 ? "bg-amber-500" : "bg-emerald-500"
                      )}
                      style={{ width: `${selectedItem.confidence}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedItem.confidence < 70
                      ? "Low confidence - requires human review before use"
                      : "Acceptable confidence - review for quality assurance"}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  className="flex-1 gap-2"
                  variant="default"
                  onClick={() => handleApprove(selectedItem.id)}
                  disabled={actionLoading === selectedItem.id}
                >
                  {actionLoading === selectedItem.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ThumbsUp className="h-4 w-4" />
                  )}
                  Approve
                </Button>
                <Button
                  className="flex-1 gap-2"
                  variant="outline"
                  onClick={() => handleReject(selectedItem.id)}
                  disabled={actionLoading === selectedItem.id}
                >
                  {actionLoading === selectedItem.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ThumbsDown className="h-4 w-4" />
                  )}
                  Reject
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleFlag(selectedItem.id)}
                  disabled={actionLoading === selectedItem.id}
                >
                  {actionLoading === selectedItem.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Flag className="h-4 w-4" />
                  )}
                  Escalate
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View full context</DropdownMenuItem>
                    <DropdownMenuItem>Edit response</DropdownMenuItem>
                    <DropdownMenuItem>Add note</DropdownMenuItem>
                    <DropdownMenuItem className="text-rose-600">Skip</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">Select an item to review</p>
              <p className="text-xs">Click on any queue item to see details</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CuratorQueue;
