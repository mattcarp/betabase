"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { MessageSquarePlus, CheckCircle, ArrowRight } from "lucide-react";

interface FeedbackSegueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToCurationQueue: () => void;
  onGoToIntegration?: () => void;
  userQuery: string;
  aiResponse: string;
  onSubmitFeedback: (feedbackText: string) => Promise<void>;
}

export function FeedbackSegueDialog({
  isOpen,
  onClose,
  onGoToCurationQueue,
  onGoToIntegration,
  userQuery,
  aiResponse,
  onSubmitFeedback,
}: FeedbackSegueDialogProps) {
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (action: "close" | "integration" | "curation") => {
    if (feedbackText.trim()) {
      setIsSubmitting(true);
      try {
        await onSubmitFeedback(feedbackText);
      } catch (error) {
        console.error("Error submitting feedback:", error);
      } finally {
        setIsSubmitting(false);
      }
    }

    // Execute the action
    if (action === "curation") {
      onGoToCurationQueue();
    } else if (action === "integration" && onGoToIntegration) {
      onGoToIntegration();
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-mac-accent-purple-400" />
            Thank You for Your Feedback
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Your input helps us improve The Betabase for everyone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Context Preview */}
          <div className="space-y-3 p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
            <div>
              <span className="text-xs font-medium text-zinc-500">Your question:</span>
              <p className="text-sm text-zinc-300 line-clamp-2 mt-1">{userQuery}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-zinc-500">AI response:</span>
              <p className="text-sm text-zinc-400 line-clamp-3 mt-1">
                {aiResponse.substring(0, 200)}...
              </p>
            </div>
          </div>

          {/* Feedback Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              What was the issue with this response?
            </label>
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="e.g., The response was inaccurate, missing key information, or not helpful..."
              className="min-h-[100px] bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              data-test-id="feedback-textarea"
            />
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-mac-accent-purple-400 flex items-center gap-1.5"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Your feedback will be added to the curation queue and integrated into the system in
              the future.
            </motion.p>
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => handleSubmit("close")}
            disabled={isSubmitting}
            className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            data-test-id="feedback-close-btn"
          >
            Close
          </Button>
          {onGoToIntegration && (
            <Button
              variant="outline"
              onClick={() => handleSubmit("integration")}
              disabled={isSubmitting}
              className="flex-1 border-mac-primary-blue-400/30 text-mac-primary-blue-400 hover:bg-mac-primary-blue-400/10"
              data-test-id="feedback-integration-btn"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Go to Integration
            </Button>
          )}
          <Button
            onClick={() => handleSubmit("curation")}
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-mac-primary-blue-400 to-mac-accent-purple-400 hover:from-mac-primary-blue-500 hover:to-mac-accent-purple-500 text-white"
            data-test-id="feedback-curation-btn"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Go to Curation Queue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


