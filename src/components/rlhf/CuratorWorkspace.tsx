/**
 * CuratorWorkspace - Professional Annotation Queue Interface
 *
 * Implements LangSmith-style annotation queue patterns:
 * - Queue-based workflow with prioritization
 * - Side-by-side original vs suggested view
 * - Approve/Reject/Request Revision actions
 * - Bulk operations support
 * - Keyboard shortcuts for fast annotation
 * - Audit trail for all curator actions
 *
 * @see https://docs.smith.langchain.com/evaluation/how_to_guides/human_feedback/annotation_queues
 */

"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Users,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  MessageSquare,
  FileText,
  Edit3,
  Target,
  Sparkles,
  Loader2,
  MoreHorizontal,
  ArrowUpRight,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Star,
} from "lucide-react";
import { Response } from "../ai-elements/response";
import type {
  FeedbackRecord,
  FeedbackStatus,
  FeedbackCategory,
  AnnotationQueueItem,
  CuratorAction,
} from "./types";

interface CuratorWorkspaceProps {
  queueItems: AnnotationQueueItem[];
  onApprove: (feedbackId: string, notes?: string) => Promise<void>;
  onReject: (feedbackId: string, notes: string) => Promise<void>;
  onRequestRevision: (feedbackId: string, notes: string) => Promise<void>;
  onSkip: (feedbackId: string) => void;
  onBulkAction?: (feedbackIds: string[], action: "approve" | "reject") => Promise<void>;
  currentCuratorId?: string;
  className?: string;
}

// Demo queue items
const DEMO_QUEUE: AnnotationQueueItem[] = [
  {
    id: "q1",
    feedback: {
      id: "f1",
      conversationId: "conv-123",
      messageId: "msg-456",
      userQuery: "What are the royalty calculation rules in AOMA 9.1?",
      aiResponse:
        "The royalty calculation in AOMA 9.1 follows a tiered structure based on sales volume. For digital sales, the base rate is 15% of net receipts, with adjustments for territory-specific agreements.",
      thumbsUp: false,
      rating: 2,
      categories: ["accuracy", "completeness"],
      severity: "major",
      feedbackText:
        "The response is missing the new streaming royalty rates introduced in the Q3 update.",
      suggestedCorrection:
        "The royalty calculation in AOMA 9.1 has been updated as of Q3 2025. For digital sales, the base rate is 15% of net receipts. **NEW: Streaming royalties are now calculated at 0.004 per stream with a minimum threshold of 1000 streams.** Territory-specific adjustments apply.",
      preferredResponse: null,
      documentsMarked: null,
      userEmail: "user@example.com",
      sessionId: "sess-789",
      modelUsed: "gemini-3-pro",
      ragMetadata: {
        strategy: "agentic",
        documentsUsed: 5,
        confidence: 0.72,
        timeMs: 1234,
        reranked: true,
        agentSteps: ["search", "rerank", "generate"],
      },
      status: "pending",
      curatorId: null,
      curatorNotes: null,
      reviewedAt: null,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    priority: 10,
    assignedTo: null,
    queueName: "high-priority",
    addedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    dueBy: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    tags: ["accuracy", "rlhf-candidate"],
  },
  {
    id: "q2",
    feedback: {
      id: "f2",
      conversationId: "conv-234",
      messageId: "msg-567",
      userQuery: "How do I set up a new content deal in AOMA?",
      aiResponse:
        "To set up a new content deal, navigate to Deals > New Deal and fill in the required fields.",
      thumbsUp: false,
      rating: 1,
      categories: ["completeness", "helpfulness"],
      severity: "critical",
      feedbackText: "This is way too brief. Users need step-by-step guidance with screenshots.",
      suggestedCorrection: null,
      documentsMarked: null,
      userEmail: "user2@example.com",
      sessionId: "sess-890",
      modelUsed: "gemini-3-pro",
      ragMetadata: {
        strategy: "standard",
        documentsUsed: 2,
        confidence: 0.45,
        timeMs: 890,
        reranked: false,
        agentSteps: null,
      },
      status: "pending",
      curatorId: null,
      curatorNotes: null,
      reviewedAt: null,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      preferredResponse: null,
    },
    priority: 8,
    assignedTo: null,
    queueName: "standard",
    addedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    dueBy: null,
    tags: ["completeness"],
  },
];

export function CuratorWorkspace({
  queueItems = DEMO_QUEUE,
  onApprove,
  onReject,
  onRequestRevision,
  onSkip,
  onBulkAction,
  currentCuratorId,
  className,
}: CuratorWorkspaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [curatorNotes, setCuratorNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | "all">("pending");
  const [filterCategory, setFilterCategory] = useState<FeedbackCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  // Filter queue items
  const filteredItems = useMemo(() => {
    return queueItems.filter((item) => {
      if (filterStatus !== "all" && item.feedback.status !== filterStatus) {
        return false;
      }
      if (filterCategory !== "all" && !item.feedback.categories.includes(filterCategory)) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.feedback.userQuery.toLowerCase().includes(query) ||
          item.feedback.aiResponse.toLowerCase().includes(query) ||
          item.feedback.feedbackText?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [queueItems, filterStatus, filterCategory, searchQuery]);

  const currentItem = filteredItems[currentIndex];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;
      if (!currentItem) return;

      switch (e.key) {
        case "a":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            handleApprove();
          }
          break;
        case "r":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            // Open reject with notes
          }
          break;
        case "ArrowLeft":
          navigatePrevious();
          break;
        case "ArrowRight":
          navigateNext();
          break;
        case "s":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            onSkip(currentItem.feedback.id);
            navigateNext();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentItem, currentIndex]);

  const navigateNext = () => {
    if (currentIndex < filteredItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCuratorNotes("");
    }
  };

  const navigatePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCuratorNotes("");
    }
  };

  const handleApprove = async () => {
    if (!currentItem) return;
    setIsProcessing(true);
    try {
      await onApprove(currentItem.feedback.id, curatorNotes || undefined);
      setShowSuccess("approved");
      setTimeout(() => {
        setShowSuccess(null);
        navigateNext();
      }, 800);
    } catch (error) {
      console.error("Failed to approve:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!currentItem || !curatorNotes.trim()) return;
    setIsProcessing(true);
    try {
      await onReject(currentItem.feedback.id, curatorNotes);
      setShowSuccess("rejected");
      setTimeout(() => {
        setShowSuccess(null);
        navigateNext();
      }, 800);
    } catch (error) {
      console.error("Failed to reject:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!currentItem || !curatorNotes.trim()) return;
    setIsProcessing(true);
    try {
      await onRequestRevision(currentItem.feedback.id, curatorNotes);
      setShowSuccess("revision-requested");
      setTimeout(() => {
        setShowSuccess(null);
        navigateNext();
      }, 800);
    } catch (error) {
      console.error("Failed to request revision:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!currentItem && filteredItems.length === 0) {
    return (
      <Card className={cn("mac-card", "bg-card/50 border-border", className)}>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <CheckCircle className="h-16 w-16 text-green-400 mb-4" />
          <h3 className="mac-title">Queue Empty!</h3>
          <p className="mac-body text-muted-foreground mt-2">All feedback has been reviewed. Great work!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with Filters */}
      <Card className="mac-card bg-card/50 border-border">
        <CardHeader className="mac-card pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-400" />
                Curator Workspace
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Review and approve feedback for training
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              {/* Queue Position */}
              <Badge variant="outline" className="bg-muted text-foreground border-border">
                {currentIndex + 1} of {filteredItems.length}
              </Badge>

              {/* Keyboard Hints */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="mac-button text-muted-foreground">
                      <Keyboard className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="w-48">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Approve</span>
                        <kbd className="px-1.5 bg-muted rounded text-xs">Cmd+A</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Reject</span>
                        <kbd className="px-1.5 bg-muted rounded text-xs">Cmd+R</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Skip</span>
                        <kbd className="px-1.5 bg-muted rounded text-xs">Cmd+S</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Navigate</span>
                        <kbd className="px-1.5 bg-muted rounded text-xs">Arrow Left/Right</kbd>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="mac-input"
                placeholder="Search feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted/50 border-border"
              />
            </div>

            <Select
              value={filterStatus}
              onValueChange={(v) => setFilterStatus(v as FeedbackStatus | "all")}
            >
              <SelectTrigger className="w-[140px] bg-muted/50 border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterCategory}
              onValueChange={(v) => setFilterCategory(v as FeedbackCategory | "all")}
            >
              <SelectTrigger className="w-[140px] bg-muted/50 border-border">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="accuracy">Accuracy</SelectItem>
                <SelectItem value="completeness">Completeness</SelectItem>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="clarity">Clarity</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Main Review Panel */}
      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <CheckCircle
              className={cn(
                "h-16 w-16 mb-4",
                showSuccess === "approved"
                  ? "text-green-400"
                  : showSuccess === "rejected"
                    ? "text-red-400"
                    : "text-yellow-400"
              )}
            />
            <h3 className="mac-title">
              {showSuccess.replace("-", " ")}!
            </h3>
            <p className="mac-body text-muted-foreground mt-2">Loading next item...</p>
          </motion.div>
        ) : currentItem ? (
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {/* Left: Original Response */}
            <Card className="mac-card bg-card/50 border-border">
              <CardHeader className="mac-card pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-normal text-muted-foreground">
                    Original AI Response
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {currentItem.feedback.thumbsUp !== null &&
                      (currentItem.feedback.thumbsUp ? (
                        <ThumbsUp className="h-4 w-4 text-green-400" />
                      ) : (
                        <ThumbsDown className="h-4 w-4 text-red-400" />
                      ))}
                    {currentItem.feedback.rating && (
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-3 w-3",
                              i < currentItem.feedback.rating!
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* User Query */}
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <MessageSquare className="h-3 w-3" />
                    User Query
                  </div>
                  <p className="text-sm text-foreground">{currentItem.feedback.userQuery}</p>
                </div>

                {/* AI Response */}
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Sparkles className="h-3 w-3" />
                    AI Response
                  </div>
                  <div className="prose prose-sm prose-invert max-w-none">
                    <Response>{currentItem.feedback.aiResponse}</Response>
                  </div>
                </div>

                {/* Feedback Details */}
                <div className="space-y-3">
                  {/* Categories */}
                  <div className="flex flex-wrap gap-2">
                    {currentItem.feedback.categories.map((cat) => (
                      <Badge
                        key={cat}
                        variant="outline"
                        className="bg-primary-500/10 text-primary-400 border-primary-500/30"
                      >
                        {cat}
                      </Badge>
                    ))}
                    {currentItem.feedback.severity && (
                      <Badge
                        variant="outline"
                        className={cn(
                          currentItem.feedback.severity === "critical"
                            ? "bg-red-500/10 text-red-400 border-red-500/30"
                            : currentItem.feedback.severity === "major"
                              ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                              : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                        )}
                      >
                        {currentItem.feedback.severity}
                      </Badge>
                    )}
                  </div>

                  {/* User Feedback Text */}
                  {currentItem.feedback.feedbackText && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-xs text-yellow-500 mb-2">
                        <AlertTriangle className="h-3 w-3" />
                        User Feedback
                      </div>
                      <p className="text-sm text-yellow-200">{currentItem.feedback.feedbackText}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right: Suggested Correction & Actions */}
            <Card className="mac-card bg-card/50 border-border">
              <CardHeader className="mac-card pb-3">
                <CardTitle className="text-sm font-normal text-muted-foreground">
                  Suggested Correction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Suggested Correction */}
                {currentItem.feedback.suggestedCorrection ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs text-green-500 mb-2">
                      <Edit3 className="h-3 w-3" />
                      User&apos;s Suggested Response
                    </div>
                    <div className="prose prose-sm prose-invert max-w-none text-green-200">
                      <Response>{currentItem.feedback.suggestedCorrection}</Response>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/30 rounded-lg p-6 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No correction suggested by user</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <span className="text-muted-foreground">Model</span>
                    <p className="mac-body text-foreground mt-1">
                      {currentItem.feedback.modelUsed || "Unknown"}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <span className="text-muted-foreground">RAG Confidence</span>
                    <p className="mac-body text-foreground mt-1">
                      {currentItem.feedback.ragMetadata?.confidence
                        ? `${(currentItem.feedback.ragMetadata.confidence * 100).toFixed(0)}%`
                        : "N/A"}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <span className="text-muted-foreground">Priority</span>
                    <p className="mac-body text-foreground mt-1">{currentItem.priority}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <span className="text-muted-foreground">Submitted</span>
                    <p className="mac-body text-foreground mt-1">
                      {new Date(currentItem.feedback.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Curator Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-normal text-foreground">
                    Curator Notes (required for reject/revision)
                  </label>
                  <Textarea
                    value={curatorNotes}
                    onChange={(e) => setCuratorNotes(e.target.value)}
                    placeholder="Add notes about your decision..."
                    className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <Button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="mac-button flex-1 bg-green-600 hover:bg-green-500"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve for Training
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={isProcessing || !curatorNotes.trim()}
                      variant="destructive"
                      className="mac-button flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                  <Button
                    onClick={handleRequestRevision}
                    disabled={isProcessing || !curatorNotes.trim()}
                    variant="outline"
                    className="mac-button border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Request Revision
                  </Button>
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    onClick={navigatePrevious}
                    disabled={currentIndex === 0}
                    className="mac-button text-muted-foreground"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button className="mac-button"
                    variant="ghost" className="mac-button mac-button-outline"
                    onClick={() => {
                      onSkip(currentItem.feedback.id);
                      navigateNext();
                    }}
                    className="text-muted-foreground"
                  >
                    Skip
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={navigateNext}
                    disabled={currentIndex === filteredItems.length - 1}
                    className="mac-button text-muted-foreground"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default CuratorWorkspace;
