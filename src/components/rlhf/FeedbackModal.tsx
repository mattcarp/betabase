/**
 * FeedbackModal - Rich RLHF Feedback Collection Component
 *
 * State-of-the-art feedback modal following best practices:
 * - Quick thumbs up/down for fast feedback
 * - Expandable detailed feedback form
 * - Category-based issue classification
 * - Free-text correction input for DPO
 * - Document relevance marking for RAG
 * - Non-intrusive, dismissible design
 *
 * @see https://docs.smith.langchain.com/evaluation/how_to_guides/human_feedback
 */

"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquarePlus,
  CheckCircle,
  AlertTriangle,
  Target,
  FileText,
  Sparkles,
  Shield,
  Edit3,
  Quote,
  X,
  ChevronDown,
  ChevronUp,
  Star,
  Send,
} from "lucide-react";
import type { FeedbackCategory, FeedbackSeverity, DocumentRelevance, RagMetadata } from "./types";

export interface FeedbackData {
  thumbsUp: boolean | null;
  rating: number | null;
  categories: FeedbackCategory[];
  severity: FeedbackSeverity | null;
  feedbackText: string | null;
  suggestedCorrection: string | null;
  documentsMarked: DocumentRelevance[] | null;
}

interface FeedbackModalProps {
  messageId: string;
  userQuery: string;
  aiResponse: string;
  ragMetadata?: RagMetadata | null;
  documents?: Array<{ id: string; title: string; snippet: string }>;
  onSubmit: (data: FeedbackData) => Promise<void>;
  onDismiss: () => void;
  initialFeedback?: Partial<FeedbackData>;
  className?: string;
  mode?: "inline" | "modal";
}

const CATEGORY_CONFIG: Array<{
  id: FeedbackCategory;
  label: string;
  icon: React.ReactNode;
  description: string;
}> = [
  {
    id: "accuracy",
    label: "Accuracy",
    icon: <Target className="h-4 w-4" />,
    description: "Factual correctness of the response",
  },
  {
    id: "relevance",
    label: "Relevance",
    icon: <Sparkles className="h-4 w-4" />,
    description: "How well it addresses your question",
  },
  {
    id: "completeness",
    label: "Completeness",
    icon: <CheckCircle className="h-4 w-4" />,
    description: "Whether all aspects were covered",
  },
  {
    id: "clarity",
    label: "Clarity",
    icon: <FileText className="h-4 w-4" />,
    description: "How clear and understandable",
  },
  {
    id: "helpfulness",
    label: "Helpfulness",
    icon: <ThumbsUp className="h-4 w-4" />,
    description: "Overall usefulness",
  },
  {
    id: "safety",
    label: "Safety Issue",
    icon: <Shield className="h-4 w-4" />,
    description: "Harmful or inappropriate content",
  },
  {
    id: "formatting",
    label: "Formatting",
    icon: <Edit3 className="h-4 w-4" />,
    description: "Code blocks, structure issues",
  },
  {
    id: "citations",
    label: "Citations",
    icon: <Quote className="h-4 w-4" />,
    description: "Source attribution quality",
  },
];

const SEVERITY_CONFIG: Array<{
  id: FeedbackSeverity;
  label: string;
  color: string;
  description: string;
}> = [
  {
    id: "critical",
    label: "Critical",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    description: "Major factual error or safety issue",
  },
  {
    id: "major",
    label: "Major",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    description: "Significant quality issue",
  },
  {
    id: "minor",
    label: "Minor",
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    description: "Small improvement opportunity",
  },
  {
    id: "suggestion",
    label: "Suggestion",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    description: "Nice-to-have enhancement",
  },
];

export function FeedbackModal({
  messageId,
  userQuery,
  aiResponse,
  ragMetadata,
  documents,
  onSubmit,
  onDismiss,
  initialFeedback,
  className,
  mode = "modal",
}: FeedbackModalProps) {
  const [isOpen, setIsOpen] = useState(mode === "modal");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form state
  const [thumbsUp, setThumbsUp] = useState<boolean | null>(initialFeedback?.thumbsUp ?? null);
  const [rating, setRating] = useState<number | null>(initialFeedback?.rating ?? null);
  const [categories, setCategories] = useState<FeedbackCategory[]>(
    initialFeedback?.categories ?? []
  );
  const [severity, setSeverity] = useState<FeedbackSeverity | null>(
    initialFeedback?.severity ?? null
  );
  const [feedbackText, setFeedbackText] = useState(initialFeedback?.feedbackText ?? "");
  const [suggestedCorrection, setSuggestedCorrection] = useState(
    initialFeedback?.suggestedCorrection ?? ""
  );
  const [documentsMarked, setDocumentsMarked] = useState<DocumentRelevance[]>(
    initialFeedback?.documentsMarked ??
      documents?.map((d) => ({
        documentId: d.id,
        title: d.title,
        snippet: d.snippet,
        relevant: true,
        relevanceScore: null,
        notes: null,
      })) ??
      []
  );

  const toggleCategory = useCallback((cat: FeedbackCategory) => {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }, []);

  const handleQuickFeedback = useCallback(
    async (isPositive: boolean) => {
      setThumbsUp(isPositive);

      // For positive feedback, submit immediately
      if (isPositive) {
        setIsSubmitting(true);
        try {
          await onSubmit({
            thumbsUp: true,
            rating: 5,
            categories: [],
            severity: null,
            feedbackText: null,
            suggestedCorrection: null,
            documentsMarked: null,
          });
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            onDismiss();
          }, 1500);
        } catch (error) {
          console.error("Failed to submit feedback:", error);
        } finally {
          setIsSubmitting(false);
        }
      } else {
        // For negative feedback, expand for more details
        setIsExpanded(true);
      }
    },
    [onSubmit, onDismiss]
  );

  const handleSubmitDetailed = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        thumbsUp,
        rating,
        categories,
        severity,
        feedbackText: feedbackText || null,
        suggestedCorrection: suggestedCorrection || null,
        documentsMarked: documentsMarked.length > 0 ? documentsMarked : null,
      });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsOpen(false);
        onDismiss();
      }, 1500);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    thumbsUp,
    rating,
    categories,
    severity,
    feedbackText,
    suggestedCorrection,
    documentsMarked,
    onSubmit,
    onDismiss,
  ]);

  const renderInlineMode = () => (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Quick Feedback Row */}
      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-2 text-green-400"
          >
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Thank you for your feedback!</span>
          </motion.div>
        ) : (
          <motion.div
            key="buttons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickFeedback(true)}
                    disabled={isSubmitting || thumbsUp !== null}
                    className={cn(
                      "h-8 px-3 transition-all",
                      thumbsUp === true
                        ? "bg-green-500/20 text-green-400"
                        : "hover:bg-green-500/10 hover:text-green-400"
                    )}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Helpful
                  </Button>
                </TooltipTrigger>
                <TooltipContent>This response was helpful</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickFeedback(false)}
                    disabled={isSubmitting || thumbsUp !== null}
                    className={cn(
                      "h-8 px-3 transition-all",
                      thumbsUp === false
                        ? "bg-red-500/20 text-red-400"
                        : "hover:bg-red-500/10 hover:text-red-400"
                    )}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    Not Helpful
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Help us improve this response</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-8 px-3 hover:bg-zinc-700/50"
                  >
                    <MessageSquarePlus className="h-4 w-4 mr-1" />
                    Detailed
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3 ml-1" />
                    ) : (
                      <ChevronDown className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Provide detailed feedback</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Detailed Feedback */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {renderDetailedForm()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderDetailedForm = () => (
    <div className="space-y-6 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
      {/* Star Rating */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Rate this response</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  rating && rating >= star
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-zinc-600 hover:text-zinc-400"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Issue Categories */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">What aspects need improvement?</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_CONFIG.map((cat) => (
            <TooltipProvider key={cat.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      "cursor-pointer transition-all",
                      categories.includes(cat.id)
                        ? "bg-purple-500/20 text-purple-400 border-purple-500/50"
                        : "bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:border-zinc-600"
                    )}
                  >
                    {cat.icon}
                    <span className="ml-1">{cat.label}</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>{cat.description}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>

      {/* Severity */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Issue severity</label>
          <div className="flex gap-2">
            {SEVERITY_CONFIG.map((sev) => (
              <TooltipProvider key={sev.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      onClick={() => setSeverity(severity === sev.id ? null : sev.id)}
                      className={cn(
                        "cursor-pointer transition-all",
                        severity === sev.id ? sev.color : "bg-zinc-800/50"
                      )}
                    >
                      {sev.label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>{sev.description}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      )}

      {/* Free-text Feedback */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Additional comments (optional)</label>
        <Textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="What could be improved? What was missing or incorrect?"
          className="bg-zinc-800/50 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 min-h-[80px]"
        />
      </div>

      {/* Suggested Correction */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-blue-400" />
          Suggest a better response (helps train the AI)
        </label>
        <Textarea
          value={suggestedCorrection}
          onChange={(e) => setSuggestedCorrection(e.target.value)}
          placeholder="How would you rewrite this response? Your corrections help improve our AI."
          className="bg-zinc-800/50 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 min-h-[100px]"
        />
        <p className="text-xs text-zinc-500">
          Your suggested corrections are used to train better AI models through Direct Preference
          Optimization (DPO).
        </p>
      </div>

      {/* Document Relevance Marking */}
      {documentsMarked.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Were these sources relevant?</label>
          <div className="space-y-2">
            {documentsMarked.map((doc, idx) => (
              <div
                key={doc.documentId}
                className="flex items-start gap-3 p-3 bg-zinc-800/30 rounded-lg"
              >
                <button
                  onClick={() => {
                    const updated = [...documentsMarked];
                    updated[idx] = { ...doc, relevant: !doc.relevant };
                    setDocumentsMarked(updated);
                  }}
                  className={cn(
                    "mt-1 flex-shrink-0",
                    doc.relevant ? "text-green-400" : "text-red-400"
                  )}
                >
                  {doc.relevant ? <CheckCircle className="h-5 w-5" /> : <X className="h-5 w-5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-300 truncate">{doc.title}</div>
                  <div className="text-xs text-zinc-500 line-clamp-2">{doc.snippet}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(false)}
          className="border-zinc-700"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmitDetailed}
          disabled={isSubmitting}
          className="bg-purple-600 hover:bg-purple-500"
        >
          {isSubmitting ? (
            <>Submitting...</>
          ) : (
            <>
              <Send className="h-4 w-4 mr-1" />
              Submit Feedback
            </>
          )}
        </Button>
      </div>
    </div>
  );

  if (mode === "inline") {
    return renderInlineMode();
  }

  // Modal mode
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-purple-400" />
            Provide Feedback
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Your feedback helps improve our AI. All feedback is reviewed by curators.
          </DialogDescription>
        </DialogHeader>

        {showSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8"
          >
            <CheckCircle className="h-12 w-12 text-green-400 mb-4" />
            <h3 className="text-lg font-medium text-zinc-100">Thank You!</h3>
            <p className="text-sm text-zinc-400">Your feedback has been recorded.</p>
          </motion.div>
        ) : (
          <>
            {/* Context Preview */}
            <div className="space-y-3 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
              <div>
                <span className="text-xs font-medium text-zinc-500">Your question:</span>
                <p className="text-sm text-zinc-300 line-clamp-2">{userQuery}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-zinc-500">AI response:</span>
                <p className="text-sm text-zinc-400 line-clamp-3">
                  {aiResponse.substring(0, 200)}...
                </p>
              </div>
            </div>

            {renderDetailedForm()}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default FeedbackModal;
