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
  Brain,
  Sparkles,
  AlertCircle,
  TrendingUp,
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
  userMarkedRelevant?: boolean | null;
}

interface FeedbackItem {
  id: string;
  sessionId: string;
  query: string;
  response: string;
  retrievedDocs: RetrievedDoc[];
  timestamp: string;
  feedbackSubmitted?: boolean;
}

interface FeedbackCardProps {
  item: FeedbackItem;
  onSubmitFeedback: (feedback: any) => void;
}

function FeedbackCard({ item, onSubmitFeedback }: FeedbackCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [feedbackType, setFeedbackType] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [correction, setCorrection] = useState("");
  const [docRelevance, setDocRelevance] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleQuickFeedback = async (type: "thumbs_up" | "thumbs_down") => {
    setFeedbackType(type);
    setSubmitting(true);
    
    try {
      await onSubmitFeedback({
        type,
        itemId: item.id,
        docRelevance,
      });
      toast.success("Thank you for your feedback!");
    } catch (error) {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRatingFeedback = async () => {
    if (rating === 0) return;
    
    setFeedbackType("rating");
    setSubmitting(true);
    
    try {
      await onSubmitFeedback({
        type: "rating",
        itemId: item.id,
        value: { score: rating },
        docRelevance,
      });
      toast.success("Rating submitted!");
    } catch (error) {
      toast.error("Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDetailedFeedback = async () => {
    if (!correction.trim()) return;
    
    setFeedbackType("detailed");
    setSubmitting(true);
    
    try {
      await onSubmitFeedback({
        type: "correction",
        itemId: item.id,
        value: { correction },
        docRelevance,
      });
      toast.success("Detailed feedback submitted!");
      setCorrection("");
    } catch (error) {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDocRelevance = (docId: string, relevant: boolean) => {
    setDocRelevance(prev => ({
      ...prev,
      [docId]: prev[docId] === relevant ? null : relevant,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-4"
    >
      <Card className={cn(
        "mac-card-elevated",
        "border-[var(--mac-utility-border)]",
        "bg-[var(--mac-surface-elevated)]"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-[var(--mac-text-muted)] font-light">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
                {item.feedbackSubmitted && (
                  <Badge variant="outline" className={cn(
                    "text-green-400 border-green-400/30 font-light",
                    "bg-green-400/10"
                  )}>
                    <Check className="h-3 w-3 mr-1" />
                    Submitted
                  </Badge>
                )}
              </div>
              <CardTitle className="text-base font-medium text-[var(--mac-text-primary)]">
                {item.query}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Response Preview */}
          <div className="relative">
            <div className={cn(
              "text-sm text-[var(--mac-text-secondary)] transition-all font-light",
              !expanded && "line-clamp-3"
            )}>
              {item.response}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-xs text-purple-400 hover:text-purple-300 font-light"
            >
              {expanded ? "Show less" : "Show more"}
            </Button>
          </div>

          {/* Quick Actions */}
          {!item.feedbackSubmitted && (
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--mac-utility-border)]">
              <span className="text-xs text-[var(--mac-text-muted)] mr-2 font-light">Quick feedback:</span>
              <Button
                size="sm"
                variant={feedbackType === "thumbs_up" ? "default" : "outline"}
                onClick={() => handleQuickFeedback("thumbs_up")}
                disabled={submitting}
                className={cn(
                  "h-8 font-light",
                  feedbackType === "thumbs_up" && "bg-green-500 hover:bg-green-600"
                )}
              >
                <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                Helpful
              </Button>
              <Button
                size="sm"
                variant={feedbackType === "thumbs_down" ? "destructive" : "outline"}
                onClick={() => handleQuickFeedback("thumbs_down")}
                disabled={submitting}
                className="h-8 font-light"
              >
                <ThumbsDown className="h-3.5 w-3.5 mr-1" />
                Not Helpful
              </Button>
              
              {/* Star Rating */}
              <div className="flex items-center gap-1 ml-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "h-4 w-4 transition-colors",
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-zinc-600 hover:text-zinc-400"
                      )}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <Button
                    size="sm"
                    onClick={handleRatingFeedback}
                    disabled={submitting}
                    className="ml-2 h-7 text-xs font-light"
                  >
                    Submit
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Retrieved Documents */}
          {expanded && item.retrievedDocs.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-[var(--mac-utility-border)]">
              <h4 className="text-sm font-medium text-[var(--mac-text-primary)] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
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
                          variant={docRelevance[doc.id] === true ? "default" : "ghost"}
                          onClick={() => toggleDocRelevance(doc.id, true)}
                          className={cn(
                            "h-8 w-8 p-0",
                            docRelevance[doc.id] === true && "bg-green-500 hover:bg-green-600"
                          )}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={docRelevance[doc.id] === false ? "destructive" : "ghost"}
                          onClick={() => toggleDocRelevance(doc.id, false)}
                          className="h-8 w-8 p-0"
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
            <div className="space-y-2 pt-4 border-t border-[var(--mac-utility-border)]">
              <h4 className="text-sm font-medium text-[var(--mac-text-primary)] flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-purple-400" />
                Detailed Feedback
              </h4>
              <Textarea
                placeholder="Provide specific corrections or suggestions..."
                value={correction}
                onChange={(e) => setCorrection(e.target.value)}
                className={cn(
                  "min-h-[100px]",
                  "bg-[var(--mac-surface-background)]/50",
                  "border-[var(--mac-utility-border)]",
                  "text-[var(--mac-text-primary)]",
                  "font-light"
                )}
              />
              <Button
                onClick={handleDetailedFeedback}
                disabled={submitting || !correction.trim()}
                className="w-full font-light"
              >
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

  useEffect(() => {
    loadFeedbackQueue();
  }, []);

  const loadFeedbackQueue = async () => {
    setLoading(true);
    
    try {
      // In production, fetch from Supabase rlhf_feedback table
      // For now, mock data
      const mockData: FeedbackItem[] = [
        {
          id: "1",
          sessionId: "session-1",
          query: "How do I configure the AOMA data pipeline for real-time processing?",
          response: "To configure the AOMA data pipeline for real-time processing, you'll need to adjust several key settings in the configuration file. First, enable the streaming mode by setting 'streaming.enabled' to true. Then configure the batch size and processing interval according to your throughput requirements...",
          retrievedDocs: [
            {
              id: "doc-1",
              content: "The AOMA data pipeline supports real-time processing through streaming ingestion. Configure it in config.yaml under the streaming section...",
              source_type: "knowledge",
              similarity: 0.92,
              rerankScore: 0.95,
            },
            {
              id: "doc-2",
              content: "Configuration guide for AOMA pipeline settings and parameters. See the streaming configuration section for real-time options...",
              source_type: "knowledge",
              similarity: 0.88,
              rerankScore: 0.89,
            },
          ],
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
      
      setFeedbackQueue(mockData);
      
      // Calculate stats
      const pending = mockData.filter(i => !i.feedbackSubmitted).length;
      const submitted = mockData.filter(i => i.feedbackSubmitted).length;
      
      setStats({
        pending,
        submitted,
        avgRating: 0,
      });
    } catch (error) {
      console.error("Failed to load feedback queue:", error);
      toast.error("Failed to load feedback queue");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (feedback: any) => {
    console.log("Submitting feedback:", feedback);
    
    // Update local state
    setFeedbackQueue(prev =>
      prev.map(item =>
        item.id === feedback.itemId
          ? { ...item, feedbackSubmitted: true }
          : item
      )
    );
    
    // Update stats
    setStats(prev => ({
      ...prev,
      pending: prev.pending - 1,
      submitted: prev.submitted + 1,
    }));
    
    // In production, save to Supabase rlhf_feedback table
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--mac-text-muted)] font-light">Loading feedback queue...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={cn(
          "mac-card-elevated",
          "border-[var(--mac-utility-border)]"
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--mac-text-muted)] font-light">Pending</p>
                <p className="text-2xl font-bold text-[var(--mac-text-primary)]">{stats.pending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={cn(
          "mac-card-elevated",
          "border-[var(--mac-utility-border)]"
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--mac-text-muted)] font-light">Submitted</p>
                <p className="text-2xl font-bold text-[var(--mac-text-primary)]">{stats.submitted}</p>
              </div>
              <Check className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={cn(
          "mac-card-elevated",
          "border-[var(--mac-utility-border)]"
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--mac-text-muted)] font-light">Avg Rating</p>
                <p className="text-2xl font-bold text-[var(--mac-text-primary)]">
                  {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A"}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Queue */}
      <ScrollArea className="flex-1">
        <AnimatePresence>
          {feedbackQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-[var(--mac-text-muted)]">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p className="font-light">No feedback items in queue</p>
            </div>
          ) : (
            feedbackQueue.map(item => (
              <FeedbackCard
                key={item.id}
                item={item}
                onSubmitFeedback={handleSubmitFeedback}
              />
            ))
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}

