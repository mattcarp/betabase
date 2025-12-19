/**
 * RLHF Curation Card - Proper workflow for curators
 *
 * Shows: User Question → AI's Response (potentially wrong) → Correction Interface
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Button } from "../button";
import { Badge } from "../badge";
import { Textarea } from "../textarea";
import {
  AlertCircle,
  Check,
  X,
  Sparkles,
  Edit3,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";

interface RetrievedDoc {
  id: string;
  content: string;
  source_type: string;
  similarity: number;
}

interface CurationItem {
  id: string;
  userQuestion: string;
  aiResponse: string;
  retrievedDocs: RetrievedDoc[];
  status: "pending" | "approved" | "rejected" | "corrected";
  priority: number;
  severity: "minor" | "moderate" | "critical";
  timestamp: string;
  ragMetadata?: {
    strategy: string;
    confidence: number;
  };
}

interface CurationCardProps {
  item: CurationItem;
  onApprove: (itemId: string) => Promise<void>;
  onReject: (itemId: string) => Promise<void>;
  onCorrect: (itemId: string, correctResponse: string, docRelevance: Record<string, boolean>) => Promise<void>;
}

export function RLHFCurationCard({ item, onApprove, onReject, onCorrect }: CurationCardProps) {
  const [correctionText, setCorrectionText] = useState("");
  const [docRelevance, setDocRelevance] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);

  const getSeverityColor = () => {
    switch (item.severity) {
      case "critical":
        return "var(--mac-error-red)";
      case "moderate":
        return "var(--mac-warning-yellow)";
      case "minor":
        return "var(--mac-primary-blue-400)";
    }
  };

  const getSeverityLabel = () => {
    switch (item.severity) {
      case "critical":
        return "Critical";
      case "moderate":
        return "Moderate";
      case "minor":
        return "Minor";
    }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await onApprove(item.id);
      toast.success("Response approved!");
    } catch (error) {
      toast.error("Failed to approve");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);
    try {
      await onReject(item.id);
      toast.success("Response rejected");
    } catch (error) {
      toast.error("Failed to reject");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCorrect = async () => {
    if (!correctionText.trim()) {
      toast.error("Please provide the correct answer");
      return;
    }
    setSubmitting(true);
    try {
      await onCorrect(item.id, correctionText, docRelevance);
      toast.success("Correction submitted!");
      setCorrectionText("");
      setShowCorrection(false);
    } catch (error) {
      toast.error("Failed to submit correction");
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

  if (item.status !== "pending") {
    return null; // Only show pending items
  }

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
          "border-l-4",
          "border-[var(--mac-utility-border)]"
        )}
        style={{ borderLeftColor: getSeverityColor() }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="text-xs font-light"
                  style={{
                    borderColor: getSeverityColor(),
                    color: getSeverityColor(),
                    backgroundColor: `${getSeverityColor()}15`,
                  }}
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {getSeverityLabel()} Priority
                </Badge>
                <span className="text-xs text-[var(--mac-text-muted)] font-light">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
                {item.ragMetadata && (
                  <Badge variant="outline" className="text-xs font-light">
                    {(item.ragMetadata.confidence * 100).toFixed(0)}% confidence
                  </Badge>
                )}
              </div>
              <CardTitle className="text-base font-light text-[var(--mac-text-primary)]">
                User Question
              </CardTitle>
              <p className="text-sm text-[var(--mac-text-primary)] mt-2 font-light leading-relaxed">
                "{item.userQuestion}"
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* AI's Response (potentially wrong) */}
          <div className="rounded-lg border border-[var(--mac-utility-border)] bg-[var(--mac-surface-background)]/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-[var(--mac-accent-purple-400)]" />
              <h4 className="text-sm font-light text-[var(--mac-text-primary)]">
                AI's Response
              </h4>
              <Badge variant="outline" className="text-xs font-light text-[var(--mac-warning-yellow)] border-[var(--mac-warning-yellow)]/30">
                Needs Review
              </Badge>
            </div>
            <p className="text-sm text-[var(--mac-text-secondary)] font-light leading-relaxed">
              {item.aiResponse}
            </p>
          </div>

          {/* Retrieved Documents */}
          {item.retrievedDocs.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-light text-[var(--mac-text-primary)] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--mac-primary-blue-400)]" />
                Retrieved Documents ({item.retrievedDocs.length})
              </h4>
              <div className="space-y-2">
                {item.retrievedDocs.map((doc, idx) => (
                  <div
                    key={doc.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg",
                      "border border-[var(--mac-utility-border)]",
                      "bg-[var(--mac-surface-background)]/30"
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
                      </div>
                      <p className="text-xs text-[var(--mac-text-secondary)] line-clamp-2 font-light">
                        {doc.content}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleDocRelevance(doc.id, true)}
                        className={cn(
                          "h-8 w-8 p-0 border transition-all",
                          docRelevance[doc.id] === true
                            ? "bg-[var(--mac-success-green)]/20 border-[var(--mac-success-green)]/40 text-[var(--mac-success-green)]"
                            : "border-[var(--mac-utility-border)] text-[var(--mac-text-muted)] hover:border-[var(--mac-success-green)]/40"
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
                            : "border-[var(--mac-utility-border)] text-[var(--mac-text-muted)] hover:border-[var(--mac-error-red)]/40"
                        )}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Correction Interface */}
          {showCorrection && (
            <div className="space-y-3 pt-4 border-t border-[var(--mac-utility-border)]">
              <h4 className="text-sm font-light text-[var(--mac-text-primary)] flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-[var(--mac-accent-purple-400)]" />
                What SHOULD the correct answer be?
              </h4>
              <Textarea
                placeholder="Type the correct answer here..."
                value={correctionText}
                onChange={(e) => setCorrectionText(e.target.value)}
                className={cn(
                  "min-h-[150px]",
                  "bg-[var(--mac-surface-elevated)]",
                  "border-[var(--mac-utility-border)]",
                  "text-[var(--mac-text-primary)]",
                  "placeholder:text-[var(--mac-text-muted)]",
                  "focus:border-[var(--mac-primary-blue-400)]",
                  "focus:ring-1 focus:ring-[var(--mac-primary-blue-400)]/20",
                  "font-light"
                )}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-4 border-t border-[var(--mac-utility-border)]">
            {!showCorrection ? (
              <>
                <Button
                  onClick={handleApprove}
                  disabled={submitting}
                  className={cn(
                    "font-light",
                    "bg-[var(--mac-success-green)]/20 border border-[var(--mac-success-green)]/40 text-[var(--mac-success-green)]",
                    "hover:bg-[var(--mac-success-green)]/30"
                  )}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Approve Response
                </Button>
                <Button
                  onClick={() => setShowCorrection(true)}
                  disabled={submitting}
                  className={cn(
                    "font-light",
                    "bg-[var(--mac-primary-blue-400)] hover:bg-[var(--mac-primary-blue-600)]"
                  )}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Provide Correction
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={submitting}
                  variant="ghost"
                  className={cn(
                    "font-light border border-[var(--mac-error-red)]/40 text-[var(--mac-error-red)]",
                    "hover:bg-[var(--mac-error-red)]/10"
                  )}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleCorrect}
                  disabled={submitting || !correctionText.trim()}
                  className={cn(
                    "font-light",
                    "bg-[var(--mac-primary-blue-400)] hover:bg-[var(--mac-primary-blue-600)]"
                  )}
                >
                  Submit Correction
                </Button>
                <Button
                  onClick={() => {
                    setShowCorrection(false);
                    setCorrectionText("");
                  }}
                  disabled={submitting}
                  variant="ghost"
                  className="font-light"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}



