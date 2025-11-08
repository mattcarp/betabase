/**
 * RLHF Feedback Tab Component
 * 
 * Beautiful, state-of-the-art feedback collection interface
 * Part of the Advanced RLHF RAG Implementation - Phase 5
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { ScrollArea } from "./scroll-area";
import { Textarea } from "./textarea";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
      <Card className="border-zinc-800/50 bg-zinc-950/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-zinc-500">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
                {item.feedbackSubmitted && (
                  <Badge variant="outline" className="text-green-400 border-green-400/30">
                    <Check className="h-3 w-3 mr-1" />
                    Feedback Submitted
                  </Badge>
                )}
              </div>
              <CardTitle className="text-base font-medium text-zinc-100">
                {item.query}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Response Preview */}
          <div className="relative">
            <div className={cn(
              "text-sm text-zinc-300 transition-all",
              !expanded && "line-clamp-3"
            )}>
              {item.response}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-xs text-purple-400 hover:text-purple-300"
            >
              {expanded ? "Show less" : "Show more"}
            </Button>
          </div>

          {/* Quick Actions */}
          {!item.feedbackSubmitted && (
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/50">
              <span className="text-xs text-zinc-500 mr-2">Quick feedback:</span>
              <Button
                size="sm"
                variant={feedbackType === "thumbs_up" ? "default" : "outline"}
                onClick={() => handleQuickFeedback("thumbs_up")}
                disabled={submitting}
                className="h-8"
              >
                <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                Helpful
              </Button>
              <Button
                size="sm"
                variant={feedbackType === "thumbs_down" ? "destructive" : "outline"}
                onClick={() => handleQuickFeedback("thumbs_down")}
                disabled={submitting}
                className="h-8"
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
                    className="ml-2 h-7 text-xs"
                  >
                    Submit
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Retrieved Documents */}
          {expanded && item.retrievedDocs.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-zinc-800/50">
              <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                Retrieved Documents ({item.retrievedDocs.length})
              </h4>
              <div className="space-y-2">
                {item.retrievedDocs.map((doc, idx) => (
                  <div
                    key={doc.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30"
                  >
                    <div className="flex flex-col gap-1">
                      <Badge variant="secondary" className="text-xs">
                        #{idx + 1}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {(doc.similarity * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {doc.source_type}
                        </Badge>
                        {doc.rerankScore !== undefined && (
                          <span className="text-xs text-zinc-500">
                            Rank: {(doc.rerankScore * 100).toFixed(0)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2">
                        {doc.content}
                      </p>
                    </div>
                    {!item.feedbackSubmitted && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={docRelevance[doc.id] === true ? "default" : "ghost"}
                          onClick={() => toggleDocRelevance(doc.id, true)}
                          className="h-8 w-8 p-0"
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
            <div className="space-y-2 pt-4 border-t border-zinc-800/50">
              <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-purple-400" />
                Detailed Feedback
              </h4>
              <Textarea
                placeholder="Provide specific corrections or suggestions..."
                value={correction}
                onChange={(e) => setCorrection(e.target.value)}
                className="min-h-[100px] bg-zinc-900/50 border-zinc-800"
              />
              <Button
                onClick={handleDetailedFeedback}
                disabled={submitting || !correction.trim()}
                className="w-full"
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
  const [stats, setStats] = useState({ pending: 0, submitted: 0, avgRating: 0 });
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadFeedbackQueue();
  }, []);

  const loadFeedbackQueue = async () => {
    setLoading(true);
    
    try {
      // Load pending feedback (rating < 3 or thumbs_up is false/null)
      const { data, error } = await supabase
        .from('rlhf_feedback')
        .select('*')
        .or('rating.lt.3,rating.is.null,thumbs_up.is.false,thumbs_up.is.null')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Failed to load feedback:', error);
        toast.error('Failed to load feedback queue');
        setLoading(false);
        return;
      }
      
      // Transform to FeedbackItem format
      const items: FeedbackItem[] = (data || []).map(row => ({
        id: row.id,
        sessionId: row.conversation_id,
        query: row.user_query || 'N/A',
        response: row.ai_response || 'N/A',
        retrievedDocs: row.documents_marked || [],
        timestamp: row.created_at,
        feedbackSubmitted: row.rating !== null && row.rating >= 3
      }));
      
      setFeedbackQueue(items);
      
      // Update stats
      const { count: totalCount } = await supabase
        .from('rlhf_feedback')
        .select('*', { count: 'exact', head: true });
      
      const { count: submittedCount } = await supabase
        .from('rlhf_feedback')
        .select('*', { count: 'exact', head: true })
        .not('rating', 'is', null);
      
      // Calculate average rating
      const { data: ratingData } = await supabase
        .from('rlhf_feedback')
        .select('rating')
        .not('rating', 'is', null);
      
      const avgRating = ratingData && ratingData.length > 0
        ? ratingData.reduce((sum, row) => sum + (row.rating || 0), 0) / ratingData.length
        : 0;
      
      setStats({
        pending: (totalCount || 0) - (submittedCount || 0),
        submitted: submittedCount || 0,
        avgRating: avgRating
      });
      
    } catch (error) {
      console.error('Failed to load feedback:', error);
      toast.error('Failed to load feedback queue');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (feedback: any) => {
    console.log("Submitting feedback:", feedback);
    
    try {
      // Update feedback with curator corrections
      const { error } = await supabase
        .from('rlhf_feedback')
        .update({
          rating: feedback.value?.score || (feedback.type === 'thumbs_up' ? 5 : 1),
          thumbs_up: feedback.type === 'thumbs_up',
          feedback_text: feedback.correction || null,
          documents_marked: feedback.docRelevance ? 
            Object.keys(feedback.docRelevance)
              .filter(docId => feedback.docRelevance[docId])
              .map(docId => ({ id: docId, relevant: true })) : 
            null,
          updated_at: new Date().toISOString()
        })
        .eq('id', feedback.itemId);
      
      if (error) {
        console.error('Failed to save feedback:', error);
        throw error;
      }
      
      // Update local state
      setFeedbackQueue(prev =>
        prev.map(item =>
          item.id === feedback.itemId
            ? { ...item, feedbackSubmitted: true }
            : item
        )
      );
      
      // Reload queue to update stats
      await loadFeedbackQueue();
      
      toast.success('Feedback saved successfully! 💜');
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Failed to save feedback');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">Loading feedback queue...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-zinc-800/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-400" />
              RLHF Feedback Queue
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Help improve AI responses by providing feedback
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-sm bg-purple-500/10 border-purple-500/30">
              {stats.pending} pending
            </Badge>
            <Badge variant="outline" className="text-sm bg-green-500/10 border-green-500/30">
              {stats.submitted} reviewed
            </Badge>
            <Badge variant="outline" className="text-sm bg-blue-500/10 border-blue-500/30">
              ⭐ {stats.avgRating.toFixed(1)} avg
            </Badge>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <AnimatePresence>
          {feedbackQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p>No feedback items in queue</p>
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

