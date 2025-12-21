/**
 * RLHF Feedback Tab - For Curate Panel
 *
 * Beautiful feedback collection interface with document relevance marking
 * Permission-gated for curators only
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Button } from "../button";
import { Badge } from "../badge";
import { ScrollArea } from "../scroll-area";
import { Textarea } from "../textarea";
import {
  ThumbsUp,
  ThumbsDown,
  Star,
  Edit3,
  Check,
  X,
  Lightbulb,
  Sparkles,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";

interface RetrievedDoc {
  id: string;
  content: string;
  source_type: string;
  similarity: number;
  rerankScore?: number;
}

interface FeedbackItem {
  id: string;
  sessionId: string;
  query: string;
  response: string;
  retrievedDocs: RetrievedDoc[];
  feedbackSubmitted: boolean;
  timestamp: string;
  rating?: number;
  feedbackType?: string;
}

interface CurationCardProps {
  item: FeedbackItem;
  onSubmitFeedback: (feedback: {
    type: string;
    itemId: string;
    value?: { score?: number; correction?: string };
    docRelevance?: Record<string, boolean>;
  }) => Promise<void>;
}

function CurationCard({ item, onSubmitFeedback }: CurationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [feedbackType, setFeedbackType] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [correction, setCorrection] = useState("");
  const [docRelevance, setDocRelevance] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleQuickFeedback = async (type: "thumbs_up" | "thumbs_down") => {
    setSubmitting(true);
    setFeedbackType(type);
    try {
      await onSubmitFeedback({
        type,
        itemId: item.id,
      });
      toast.success(type === "thumbs_up" ? "Marked as helpful!" : "Marked as not helpful");
    } catch {
      toast.error("Failed to submit feedback");
      setFeedbackType(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRatingFeedback = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await onSubmitFeedback({
        type: "rating",
        itemId: item.id,
        value: { score: rating },
      });
      toast.success("Rating submitted!");
    } catch {
      toast.error("Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDetailedFeedback = async () => {
    if (!correction.trim()) {
      toast.error("Please provide feedback details");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmitFeedback({
        type: "correction",
        itemId: item.id,
        value: { correction },
        docRelevance,
      });
      toast.success("Feedback submitted!");
      setCorrection("");
    } catch {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDocRelevance = (docId: string, relevant: boolean) => {
    setDocRelevance((prev) => ({
      ...prev,
      [docId]: prev[docId] === relevant ? undefined : relevant,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-4"
    >
      <Card
        className={cn(
          "mac-card-elevated",
          "border-[var(--mac-utility-border)]",
          "bg-[var(--mac-surface-elevated)]"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-[var(--mac-accent-purple-400)]" />
                <span className="text-xs text-[var(--mac-text-muted)] font-light">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
                {item.feedbackSubmitted && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-green-400 border-green-400/30 font-light",
                      "bg-green-400/10"
                    )}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Submitted
                  </Badge>
                )}
              </div>
              <CardTitle className="text-base font-light text-[var(--mac-text-primary)]">
                {item.query}
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Response Preview */}
          <div className="relative">
            <div
              className={cn(
                "text-sm text-[var(--mac-text-secondary)] transition-all font-light",
                !expanded && "line-clamp-3"
              )}
            >
              {item.response}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-xs text-[var(--mac-primary-blue-400)] hover:text-[var(--mac-primary-blue-600)] font-light"
            >
              {expanded ? "Show less" : "Show more"}
            </Button>
          </div>

          {/* Quick Actions */}
          {!item.feedbackSubmitted && (
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--mac-utility-border)]">
              <span className="text-xs text-[var(--mac-text-muted)] mr-2 font-light">
                Quick feedback:
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleQuickFeedback("thumbs_up")}
                disabled={submitting}
                className={cn(
                  "h-8 font-light border transition-all",
                  feedbackType === "thumbs_up"
                    ? "bg-[var(--mac-success-green)]/20 border-[var(--mac-success-green)]/40 text-[var(--mac-success-green)]"
                    : "border-[var(--mac-utility-border)] text-[var(--mac-text-secondary)] hover:border-[var(--mac-success-green)]/40 hover:bg-[var(--mac-success-green)]/10"
                )}
              >
                <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                Helpful
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleQuickFeedback("thumbs_down")}
                disabled={submitting}
                className={cn(
                  "h-8 font-light border transition-all",
                  feedbackType === "thumbs_down"
                    ? "bg-[var(--mac-error-red)]/20 border-[var(--mac-error-red)]/40 text-[var(--mac-error-red)]"
                    : "border-[var(--mac-utility-border)] text-[var(--mac-text-secondary)] hover:border-[var(--mac-error-red)]/40 hover:bg-[var(--mac-error-red)]/10"
                )}
              >
                <ThumbsDown className="h-3.5 w-3.5 mr-1" />
                Not Helpful
              </Button>

              {/* Star Rating */}
              <div className="flex items-center gap-1 ml-2 border-l border-[var(--mac-utility-border)] pl-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                    disabled={submitting}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4 transition-colors",
                        star <= rating
                          ? "fill-[var(--mac-warning-yellow)] text-[var(--mac-warning-yellow)]"
                          : "text-[var(--mac-text-muted)] hover:text-[var(--mac-text-secondary)]"
                      )}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <Button
                    size="sm"
                    onClick={handleRatingFeedback}
                    disabled={submitting}
                    className={cn(
                      "ml-2 h-7 text-xs font-light",
                      "bg-[var(--mac-primary-blue-400)] hover:bg-[var(--mac-primary-blue-600)]"
                    )}
                  >
                    {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Submit"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Retrieved Documents */}
          {expanded && item.retrievedDocs.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-[var(--mac-utility-border)]">
              <h4 className="text-sm font-light text-[var(--mac-text-primary)] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--mac-accent-purple-400)]" />
                Retrieved Documents ({item.retrievedDocs.length})
              </h4>
              <div className="space-y-2">
                {item.retrievedDocs.map((doc, idx) => (
                  <div
                    key={doc.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg",
                      "border border-[var(--mac-utility-border)]",
                      "bg-[var(--mac-surface-background)]/30",
                      "transition-all duration-200",
                      "hover:bg-[var(--mac-state-hover)]"
                    )}
                  >
                    <div className="flex flex-col gap-1">
                      <Badge variant="secondary" className="text-xs font-light">
                        #{idx + 1}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-light">
                        {(doc.similarity * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs font-light">
                          {doc.source_type}
                        </Badge>
                        {doc.rerankScore !== undefined && (
                          <span className="text-xs text-[var(--mac-text-muted)] font-light">
                            Rank: {(doc.rerankScore * 100).toFixed(0)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--mac-text-secondary)] line-clamp-2 font-light">
                        {doc.content}
                      </p>
                    </div>
                    {!item.feedbackSubmitted && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleDocRelevance(doc.id, true)}
                          className={cn(
                            "h-8 w-8 p-0 border transition-all",
                            docRelevance[doc.id] === true
                              ? "bg-[var(--mac-success-green)]/20 border-[var(--mac-success-green)]/40 text-[var(--mac-success-green)]"
                              : "border-[var(--mac-utility-border)] text-[var(--mac-text-muted)] hover:border-[var(--mac-success-green)]/40 hover:bg-[var(--mac-success-green)]/10"
                          )}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleDocRelevance(doc.id, false)}
                          className={cn(
                            "h-8 w-8 p-0 border transition-all",
                            docRelevance[doc.id] === false
                              ? "bg-[var(--mac-error-red)]/20 border-[var(--mac-error-red)]/40 text-[var(--mac-error-red)]"
                              : "border-[var(--mac-utility-border)] text-[var(--mac-text-muted)] hover:border-[var(--mac-error-red)]/40 hover:bg-[var(--mac-error-red)]/10"
                          )}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Feedback */}
          {expanded && !item.feedbackSubmitted && (
            <div className="space-y-3 pt-4 border-t border-[var(--mac-utility-border)]">
              <h4 className="text-sm font-light text-[var(--mac-text-primary)] flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-[var(--mac-accent-purple-400)]" />
                Detailed Feedback
              </h4>
              <Textarea
                placeholder="Provide specific corrections or suggestions..."
                value={correction}
                onChange={(e) => setCorrection(e.target.value)}
                className={cn(
                  "min-h-[100px]",
                  "bg-[var(--mac-surface-elevated)]",
                  "border-[var(--mac-utility-border)]",
                  "text-[var(--mac-text-primary)]",
                  "placeholder:text-[var(--mac-text-muted)]",
                  "focus:border-[var(--mac-primary-blue-400)]",
                  "focus:ring-1 focus:ring-[var(--mac-primary-blue-400)]/20",
                  "font-light"
                )}
              />
              <Button
                onClick={handleDetailedFeedback}
                disabled={submitting || !correction.trim()}
                className={cn(
                  "w-full font-light",
                  "bg-[var(--mac-primary-blue-400)] hover:bg-[var(--mac-primary-blue-600)]",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Submit Detailed Feedback
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function RLHFFeedbackTab() {
  const [feedbackQueue, setFeedbackQueue] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    submitted: 0,
    avgRating: 0,
  });
  const [showExplanation, setShowExplanation] = useState(true);

  useEffect(() => {
    loadFeedbackQueue();
  }, []);

  const loadFeedbackQueue = async () => {
    setLoading(true);

    try {
      // Fetch real feedback from API with stats
      const response = await fetch("/api/rlhf/feedback?limit=50&stats=true");

      if (!response.ok) {
        throw new Error("Failed to fetch feedback queue");
      }

      const data = await response.json();
      const feedback = data.feedback || [];
      const apiStats = data.stats || {};

      // Map database records to FeedbackItem format
      const feedbackItems: FeedbackItem[] = feedback.map(
        (f: {
          id: string;
          session_id?: string;
          query?: string;
          user_query?: string;
          response?: string;
          retrieved_contexts?: Array<{
            content?: string;
            content_preview?: string;
            source?: string;
            source_type?: string;
            score?: number;
            similarity?: number;
          }>;
          created_at: string;
          status?: string;
          feedback_type?: string;
          feedback_value?: { score?: number };
          rating?: number;
        }) => ({
          id: f.id,
          sessionId: f.session_id || "unknown",
          query: f.query || f.user_query || "No query recorded",
          response: f.response || "No response recorded",
          retrievedDocs: (f.retrieved_contexts || []).map((ctx, idx) => ({
            id: `doc-${f.id}-${idx}`,
            content: ctx.content || ctx.content_preview || "",
            source_type: ctx.source_type || ctx.source || "knowledge",
            similarity: ctx.similarity || ctx.score || 0.8,
            rerankScore: ctx.score ? ctx.score * 1.05 : undefined,
          })),
          timestamp: f.created_at,
          feedbackSubmitted: f.status === "approved" || f.status === "rejected",
          rating: f.rating || f.feedback_value?.score,
          feedbackType: f.feedback_type,
        })
      );

      setFeedbackQueue(feedbackItems);

      // Calculate stats from API response
      const pending = feedbackItems.filter((i) => !i.feedbackSubmitted).length;
      const submitted = feedbackItems.filter((i) => i.feedbackSubmitted).length;

      setStats({
        pending,
        submitted,
        avgRating: parseFloat(apiStats.avgRating) || 0,
      });
    } catch (error) {
      console.error("Failed to load feedback queue:", error);
      toast.error("Failed to load feedback queue");
      // Set empty state on error
      setFeedbackQueue([]);
      setStats({ pending: 0, submitted: 0, avgRating: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (feedback: {
    type: string;
    itemId: string;
    value?: { score?: number; correction?: string };
    docRelevance?: Record<string, boolean>;
  }) => {
    console.log("Submitting feedback:", feedback);

    try {
      // Update feedback record via API
      const updatePayload: Record<string, unknown> = {
        status: feedback.type === "thumbs_up" ? "approved" : "reviewing",
        feedback_type: feedback.type,
      };

      // Add thumbs_up based on feedback type
      if (feedback.type === "thumbs_up") {
        updatePayload.thumbs_up = true;
      } else if (feedback.type === "thumbs_down") {
        updatePayload.thumbs_up = false;
      }

      // Add rating if provided
      if (feedback.value?.score) {
        updatePayload.rating = feedback.value.score;
      }

      // Add correction if provided
      if (feedback.value?.correction) {
        updatePayload.suggested_correction = feedback.value.correction;
        updatePayload.feedback_text = feedback.value.correction;
      }

      // Add document relevance if provided
      if (feedback.docRelevance && Object.keys(feedback.docRelevance).length > 0) {
        updatePayload.documents_marked = Object.entries(feedback.docRelevance).map(
          ([docId, relevant]) => ({
            documentId: docId,
            relevant,
          })
        );
      }

      const response = await fetch(`/api/rlhf/feedback/${feedback.itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        throw new Error("Failed to update feedback");
      }

      // Update local state on success
      setFeedbackQueue((prev) =>
        prev.map((item) =>
          item.id === feedback.itemId ? { ...item, feedbackSubmitted: true } : item
        )
      );

      // Update stats
      setStats((prev) => ({
        ...prev,
        pending: prev.pending - 1,
        submitted: prev.submitted + 1,
      }));
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      throw error; // Re-throw to let caller handle toast
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--mac-primary-blue-400)]" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Explanatory Header */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative"
          >
            <Card
              className={cn(
                "mac-card-elevated border-[var(--mac-primary-blue-400)]/20",
                "bg-gradient-to-r from-[var(--mac-primary-blue-400)]/5 to-[var(--mac-accent-purple-400)]/5"
              )}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[var(--mac-primary-blue-400)]/10 flex items-center justify-center">
                      <Lightbulb className="h-5 w-5 text-[var(--mac-primary-blue-400)]" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-light text-[var(--mac-text-primary)]">
                        Human Feedback Training System
                      </CardTitle>
                      <p className="text-xs text-[var(--mac-text-muted)] font-light mt-1">
                        RLHF: Reinforcement Learning from Human Feedback
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowExplanation(false)}
                    className="h-8 w-8 p-0 text-[var(--mac-text-muted)] hover:text-[var(--mac-text-primary)]"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-[var(--mac-text-secondary)] font-light leading-relaxed">
                  This system improves AI response quality through your expert feedback. Review
                  AI-generated answers from the chat interface, rate their accuracy, and mark
                  which retrieved documents were actually helpful.
                </p>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="flex items-start gap-2">
                    <div className="h-6 w-6 rounded bg-[var(--mac-primary-blue-400)]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-light text-[var(--mac-primary-blue-400)]">
                        1
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-light text-[var(--mac-text-primary)]">
                        Rate Responses
                      </p>
                      <p className="text-xs text-[var(--mac-text-muted)] font-light">
                        Thumbs up/down or 5-star rating
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-6 w-6 rounded bg-[var(--mac-accent-purple-400)]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-light text-[var(--mac-accent-purple-400)]">
                        2
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-light text-[var(--mac-text-primary)]">
                        Mark Documents
                      </p>
                      <p className="text-xs text-[var(--mac-text-muted)] font-light">
                        Identify helpful sources
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-6 w-6 rounded bg-[var(--mac-success-green)]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-light text-[var(--mac-success-green)]">
                        3
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-light text-[var(--mac-text-primary)]">
                        Provide Corrections
                      </p>
                      <p className="text-xs text-[var(--mac-text-muted)] font-light">
                        Suggest improvements
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={cn("mac-card-elevated", "border-[var(--mac-utility-border)]")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--mac-text-muted)] font-light">Pending</p>
                <p className="text-2xl font-light text-[var(--mac-text-primary)]">{stats.pending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-[var(--mac-warning-yellow)]" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn("mac-card-elevated", "border-[var(--mac-utility-border)]")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--mac-text-muted)] font-light">Submitted</p>
                <p className="text-2xl font-light text-[var(--mac-text-primary)]">
                  {stats.submitted}
                </p>
              </div>
              <Check className="h-8 w-8 text-[var(--mac-success-green)]" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn("mac-card-elevated", "border-[var(--mac-utility-border)]")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--mac-text-muted)] font-light">Avg Rating</p>
                <p className="text-2xl font-light text-[var(--mac-text-primary)]">
                  {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A"}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-[var(--mac-accent-purple-400)]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={loadFeedbackQueue}
          disabled={loading}
          className="text-xs"
        >
          <RefreshCw className={cn("h-3 w-3 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Feedback Queue */}
      <ScrollArea className="flex-1">
        <AnimatePresence>
          {feedbackQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-[var(--mac-text-muted)]">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p className="font-light">No feedback items in queue</p>
              <p className="text-xs mt-1">Chat with the AI to generate feedback items</p>
            </div>
          ) : (
            feedbackQueue.map((item) => (
              <CurationCard key={item.id} item={item} onSubmitFeedback={handleSubmitFeedback} />
            ))
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}
