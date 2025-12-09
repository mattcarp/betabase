"use client";

/**
 * Q8 Button - "Curate" Feedback Button
 *
 * A clever button that appears on AI-generated content (infographics, text responses)
 * allowing Curators to flag content for review/feedback.
 *
 * Q8 = "Curate" (phonetically similar)
 *
 * Part of the HITL (Human-in-the-Loop) feedback cycle:
 * Chat -> Q8 -> Curate Tab -> Self-Healing Tests -> Better Chat
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

export interface Q8FeedbackContext {
  type: "infographic" | "text_response" | "source_citation";
  question: string;
  answer: string;
  infographicData?: {
    imageData: string;
    mimeType: string;
    type: string;
  };
  sourceIds?: string[];
  messageId?: string;
  timestamp: string;
}

interface Q8ButtonProps {
  context: Q8FeedbackContext;
  className?: string;
  onFeedbackSubmit?: (context: Q8FeedbackContext) => void;
}

// Store pending feedback in localStorage for the Curate tab to pick up
function storeFeedbackForCuration(context: Q8FeedbackContext) {
  const feedbackQueue = JSON.parse(localStorage.getItem("q8_feedback_queue") || "[]");

  const feedbackItem = {
    id: `q8-${Date.now()}`,
    ...context,
    submittedAt: new Date().toISOString(),
    status: "pending",
  };

  feedbackQueue.push(feedbackItem);
  localStorage.setItem("q8_feedback_queue", JSON.stringify(feedbackQueue));

  // Dispatch custom event so Curate tab can update in real-time
  window.dispatchEvent(new CustomEvent("q8-feedback-added", { detail: feedbackItem }));

  return feedbackItem;
}

export function Q8Button({ context, className, onFeedbackSubmit }: Q8ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    setShowConfirm(true);

    // Store feedback and navigate to Curate tab
    const feedbackItem = storeFeedbackForCuration(context);
    onFeedbackSubmit?.(context);

    // Reset animation after delay
    setTimeout(() => {
      setIsClicked(false);
      setShowConfirm(false);
    }, 2000);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            className={cn(
              "relative flex items-center justify-center",
              "w-8 h-8 rounded-full",
              "bg-gradient-to-br from-purple-500/20 to-blue-500/20",
              "border border-purple-500/30",
              "text-purple-400 text-xs font-semibold",
              "hover:from-purple-500/40 hover:to-blue-500/40",
              "hover:border-purple-400/50",
              "hover:text-purple-300",
              "transition-all duration-200",
              "cursor-pointer",
              "backdrop-blur-sm",
              isClicked && "scale-90",
              className
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {showConfirm ? (
                <motion.span
                  key="check"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="text-green-400"
                >
                  ok
                </motion.span>
              ) : (
                <motion.span
                  key="q8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Q8
                </motion.span>
              )}
            </AnimatePresence>

            {/* Pulse animation on hover */}
            {isHovered && !showConfirm && (
              <motion.div
                className="absolute inset-0 rounded-full bg-purple-500/20"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[200px]">
          <p className="text-xs">
            <strong>Curate this content</strong>
            <br />
            Send to Curate tab for review and feedback
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Hook to get pending Q8 feedback items
 */
export function useQ8FeedbackQueue() {
  const [queue, setQueue] = useState<
    (Q8FeedbackContext & { id: string; submittedAt: string; status: string })[]
  >([]);

  const loadQueue = () => {
    const stored = JSON.parse(localStorage.getItem("q8_feedback_queue") || "[]");
    setQueue(stored);
  };

  const removeFromQueue = (id: string) => {
    const updated = queue.filter((item) => item.id !== id);
    localStorage.setItem("q8_feedback_queue", JSON.stringify(updated));
    setQueue(updated);
  };

  const clearQueue = () => {
    localStorage.setItem("q8_feedback_queue", "[]");
    setQueue([]);
  };

  return {
    queue,
    loadQueue,
    removeFromQueue,
    clearQueue,
  };
}
