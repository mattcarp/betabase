"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { ScrollArea } from "./scroll-area";
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Eye,
  FileText,
  Lightbulb,
  Sparkles,
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

// Demo feedback items for showcase (actual feedback, not questions!)
const DEMO_FEEDBACK_QUEUE: QueueItem[] = [
  {
    id: "demo-feedback-1",
    type: "correction",
    title: "What are the steps to link a product to a master in AOMA?",
    description: "Response missing 2024 spec updates - new validation step not mentioned",
    source: "Session 8f4a2c1b",
    timestamp: new Date(Date.now() - 1800000), // 30 mins ago
    priority: "high",
    confidence: 65,
    status: "pending",
    metadata: {
      query: "What are the steps to link a product to a master in AOMA?",
      response: "To link a product to a master in AOMA, follow these steps: 1. Navigate to the Product Linking section, 2. Select the product from the catalog...",
      feedbackType: "thumbs_down",
      thumbsUp: false,
      rating: 2,
      categories: ["accuracy", "completeness"],
      severity: "major",
    },
  },
  {
    id: "demo-feedback-2",
    type: "low-confidence",
    title: "How do I upload and archive digital assets in AOMA?",
    description: "Answer was inaccurate - mentioned FTP instead of Aspera for large files",
    source: "Session 3d9e7f21",
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    priority: "high",
    confidence: 58,
    status: "pending",
    metadata: {
      query: "How do I upload and archive digital assets in AOMA from preparation to storage?",
      response: "For uploading large assets, you can use the FTP upload method which supports files up to 10GB...",
      feedbackType: "thumbs_down",
      thumbsUp: false,
      rating: 1,
      categories: ["accuracy"],
      severity: "critical",
    },
  },
  {
    id: "demo-feedback-3",
    type: "correction",
    title: "What are the permission levels in AOMA and what can each role do?",
    description: "Incomplete - didn't explain territory-specific access controls",
    source: "Session 6c2b9a14",
    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    priority: "medium",
    confidence: 72,
    status: "pending",
    metadata: {
      query: "What are the permission levels in AOMA and what can each role do?",
      response: "AOMA has four permission levels: Viewer, Editor, Admin, and Global Admin. Viewers can read-only access...",
      feedbackType: "thumbs_down",
      thumbsUp: false,
      rating: 3,
      categories: ["completeness"],
      severity: "minor",
    },
  },
  {
    id: "demo-feedback-4",
    type: "response-review",
    title: "How does AOMA use AWS S3 storage tiers for long-term archiving?",
    description: "Response was confusing - mixed up Glacier and Deep Archive pricing",
    source: "Session 1a5f8c29",
    timestamp: new Date(Date.now() - 10800000), // 3 hours ago
    priority: "medium",
    confidence: 68,
    status: "pending",
    metadata: {
      query: "How does AOMA use AWS S3 storage tiers for long-term archiving?",
      response: "AOMA uses AWS S3 Glacier for long-term archiving with costs around $0.004 per GB...",
      feedbackType: "thumbs_down",
      thumbsUp: false,
      rating: 2,
      categories: ["accuracy", "clarity"],
      severity: "minor",
    },
  },
  {
    id: "demo-feedback-5",
    type: "correction",
    title: "What new UST features are being planned for the 2026 releases?",
    description: "Outdated information - mentioned features that were already released in Q4 2025",
    source: "Session 9b3e2d77",
    timestamp: new Date(Date.now() - 14400000), // 4 hours ago
    priority: "low",
    confidence: 75,
    status: "pending",
    metadata: {
      query: "What new UST features are being planned for the 2026 releases?",
      response: "The 2026 roadmap includes multi-track FLAC support, which will enable...",
      feedbackType: "thumbs_down",
      thumbsUp: false,
      rating: 3,
      categories: ["accuracy", "freshness"],
      severity: "suggestion",
    },
  },
];

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
  const title = query.length > 50 ? query.substring(0, 50) : query;

  // Create description
  let description = feedback.feedback_text || "User feedback requires review";
  if (feedback.thumbs_up === false) {
    description = "User marked response as not helpful";
  } else if (feedback.suggested_correction) {
    description = `Correction: ${feedback.suggested_correction.substring(0, 100)}`;
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
  const [editingResponse, setEditingResponse] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>("");

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
      
      // If empty, use demo data for showcase
      if (mappedItems.length === 0) {
        setItems(DEMO_FEEDBACK_QUEUE);
      } else {
        setItems(mappedItems);
      }
    } catch (error) {
      // Network failures - use demo data for showcase
      console.warn("Error loading curator queue, using demo data:", error);
      setItems(DEMO_FEEDBACK_QUEUE);
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

  const handleEditResponse = (item: QueueItem) => {
    setEditingResponse(item.id);
    setEditedText(item.metadata?.response || "");
  };

  const handleSaveEdit = async (itemId: string) => {
    setActionLoading(itemId);
    try {
      const response = await fetch(`/api/rlhf/feedback/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corrected_response: editedText,
          curator_notes: "Response edited by curator",
        }),
      });

      if (!response.ok) throw new Error("Failed to save edit");

      // Update local state
      setItems(items.map(item =>
        item.id === itemId
          ? { ...item, metadata: { ...item.metadata, response: editedText } }
          : item
      ));
      if (selectedItem?.id === itemId) {
        setSelectedItem({
          ...selectedItem,
          metadata: { ...selectedItem.metadata, response: editedText }
        });
      }
      setEditingResponse(null);
      toast.success("Response updated");
    } catch (error) {
      console.error("Error saving edit:", error);
      toast.error("Failed to save edit");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingResponse(null);
    setEditedText("");
  };

  const handleSkip = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
    if (selectedItem?.id === itemId) setSelectedItem(null);
    toast.success("Item skipped");
  };

  const getTypeIcon = (type: QueueItem["type"]) => {
    switch (type) {
      case "response-review":
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case "low-confidence":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case "correction":
        return <FileText className="h-4 w-4 text-primary-600" />;
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
            className="bg-muted/10 text-muted-foreground border-border text-xs"
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
        <CardHeader className="mac-card pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-normal flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--mac-primary-blue-400)]" />
              Curator Queue
              <Badge variant="secondary" className="ml-2">
                {loading ? "..." : filteredItems.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost"
                size="sm"
                className="mac-button mac-button-outline text-xs h-7"
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
                      ? "bg-[var(--mac-primary-blue-400)]/10 border-[var(--mac-primary-blue-400)]/30"
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
                      <span className="font-normal text-sm">{item.title}</span>
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
        <CardHeader className="mac-card pb-3">
          <CardTitle className="text-base font-normal flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Review Details
          </CardTitle>
        </CardHeader>
        <CardContent className="mac-card">
          {selectedItem ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getTypeIcon(selectedItem.type)}
                    <h3 className="mac-title">{selectedItem.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                </div>
                {getPriorityBadge(selectedItem.priority)}
              </div>

              {/* Content */}
              {selectedItem.metadata?.query && (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <p className="text-xs font-normal text-muted-foreground mb-2">Original Query</p>
                    <p className="text-sm">{selectedItem.metadata.query}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <p className="text-xs font-normal text-blue-600 mb-2">AI Response</p>
                    {editingResponse === selectedItem.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          className="w-full h-32 p-2 text-sm bg-background border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(selectedItem.id)}
                            disabled={actionLoading === selectedItem.id}
                          >
                            {actionLoading === selectedItem.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : null}
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm">{selectedItem.metadata.response}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedItem.metadata?.documentName && (
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-xs font-normal text-muted-foreground mb-2">Document</p>
                  <p className="text-sm font-mono">{selectedItem.metadata.documentName}</p>
                </div>
              )}

              {/* Confidence Score */}
              {selectedItem.confidence && (
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-normal">Confidence Score</span>
                    <span
                      className={cn(
                        "text-lg font-normal",
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
                <Button className="flex-1 gap-2"
                  variant="default" className="mac-button mac-button-primary"
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
                <Button className="flex-1 gap-2"
                  variant="outline" className="mac-button mac-button-outline"
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
                <Button variant="outline"
                  className="mac-button mac-button-outline gap-2"
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
                    <Button variant="ghost" className="mac-button mac-button-outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onItemSelect?.(selectedItem)}>
                      View full context
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditResponse(selectedItem)}>
                      Edit response
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info("Add note feature coming soon")}>
                      Add note
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-rose-600"
                      onClick={() => handleSkip(selectedItem.id)}
                    >
                      Skip
                    </DropdownMenuItem>
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
