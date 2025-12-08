"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import {
  XCircle,
  AlertTriangle,
  Bug,
  Wrench,
  RefreshCw,
  MessageSquare,
  ArrowRight,
  Lightbulb,
  Brain,
} from "lucide-react";
import { cn } from "../../lib/utils";

export type RejectionReason =
  | "app_broke"
  | "wrong_selector"
  | "intentional_change"
  | "test_needs_redesign"
  | "false_positive"
  | "other";

export interface FeedbackData {
  attemptId: string;
  reason: RejectionReason;
  notes: string;
  shouldEscalateAsBug: boolean;
  suggestedAction?: string;
}

interface SelfHealingFeedbackCaptureProps {
  attemptId: string;
  testName: string;
  originalSelector: string;
  suggestedSelector: string;
  confidence: number;
  onSubmit: (feedback: FeedbackData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const rejectionReasons: {
  value: RejectionReason;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  escalateByDefault?: boolean;
}[] = [
  {
    value: "app_broke",
    label: "App/Element Broken",
    description: "The selector was correct, but the app element is broken or missing",
    icon: <Bug className="h-5 w-5" />,
    color: "text-red-400 bg-red-500/10 border-red-500/20 hover:bg-red-500/20",
    escalateByDefault: true,
  },
  {
    value: "wrong_selector",
    label: "AI Suggested Wrong Fix",
    description: "The AI's suggested selector replacement is incorrect",
    icon: <Brain className="h-5 w-5" />,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20",
  },
  {
    value: "intentional_change",
    label: "Intentional App Change",
    description: "This change was intentional; the test needs to be redesigned",
    icon: <RefreshCw className="h-5 w-5" />,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20",
  },
  {
    value: "test_needs_redesign",
    label: "Test Design Issue",
    description: "The test itself is fragile and needs a better approach",
    icon: <Wrench className="h-5 w-5" />,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20",
  },
  {
    value: "false_positive",
    label: "False Positive",
    description: "The test is actually passing; this was a detection error",
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "text-orange-400 bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20",
  },
  {
    value: "other",
    label: "Other Reason",
    description: "Something else - please provide details",
    icon: <MessageSquare className="h-5 w-5" />,
    color: "text-gray-400 bg-gray-500/10 border-gray-500/20 hover:bg-gray-500/20",
  },
];

export const SelfHealingFeedbackCapture: React.FC<SelfHealingFeedbackCaptureProps> = ({
  attemptId,
  testName,
  originalSelector,
  suggestedSelector,
  confidence,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [selectedReason, setSelectedReason] = useState<RejectionReason | null>(null);
  const [notes, setNotes] = useState("");
  const [shouldEscalate, setShouldEscalate] = useState(false);

  const selectedReasonData = rejectionReasons.find((r) => r.value === selectedReason);

  const handleReasonSelect = (reason: RejectionReason) => {
    setSelectedReason(reason);
    const reasonData = rejectionReasons.find((r) => r.value === reason);
    if (reasonData?.escalateByDefault) {
      setShouldEscalate(true);
    }
  };

  const handleSubmit = () => {
    if (!selectedReason) return;

    onSubmit({
      attemptId,
      reason: selectedReason,
      notes,
      shouldEscalateAsBug: shouldEscalate,
    });
  };

  return (
    <Card className="border-red-500/20 bg-red-500/5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 font-light text-lg">
          <XCircle className="h-5 w-5 text-red-400" />
          <span>Why are you rejecting this healing?</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Your feedback helps improve future healing accuracy
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Context Summary */}
        <div className="p-3 rounded-lg bg-black/30 border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white font-light">{testName}</span>
            <Badge variant="outline" className="text-xs text-white/60">
              {(confidence * 100).toFixed(0)}% confidence
            </Badge>
          </div>
          <div className="font-mono text-xs space-y-1">
            <div className="text-red-400/70 line-through truncate">{originalSelector}</div>
            <div className="text-green-400 truncate">{suggestedSelector}</div>
          </div>
        </div>

        {/* Reason Selection */}
        <div className="grid grid-cols-2 gap-3">
          {rejectionReasons.map((reason) => (
            <button
              key={reason.value}
              onClick={() => handleReasonSelect(reason.value)}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                selectedReason === reason.value
                  ? cn(reason.color, "ring-2 ring-offset-2 ring-offset-black")
                  : "border-white/10 bg-black/20 hover:bg-black/30 text-white/80"
              )}
            >
              <div className={cn(selectedReason === reason.value ? "" : "text-muted-foreground")}>
                {reason.icon}
              </div>
              <div>
                <h4 className="text-sm font-light">{reason.label}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{reason.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Additional Notes */}
        {selectedReason && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="text-sm text-muted-foreground">
              Additional notes (optional but helpful)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                selectedReason === "wrong_selector"
                  ? "What should the correct selector be?"
                  : selectedReason === "app_broke"
                    ? "Describe what's broken in the app..."
                    : selectedReason === "test_needs_redesign"
                      ? "What's wrong with the test design?"
                      : "Any additional context..."
              }
              className="bg-black/40 border-white/10 text-white placeholder:text-muted-foreground/50"
              rows={3}
            />
          </div>
        )}

        {/* Bug Escalation Option */}
        {selectedReason === "app_broke" && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <Bug className="h-5 w-5 text-red-400 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-light text-white">Create Bug Report</h4>
                  <button
                    onClick={() => setShouldEscalate(!shouldEscalate)}
                    className={cn(
                      "relative w-10 h-5 rounded-full transition-colors",
                      shouldEscalate ? "bg-red-500" : "bg-white/20"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                        shouldEscalate ? "translate-x-5" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This will create a bug ticket for the development team to investigate
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Learning Impact Info */}
        {selectedReason && (
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 animate-in fade-in duration-200">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-purple-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-light text-white">How this feedback helps</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedReasonData?.value === "wrong_selector" && (
                    <>
                      This feedback will lower confidence for similar selector pattern matches and
                      help the AI learn better heuristics.
                    </>
                  )}
                  {selectedReasonData?.value === "app_broke" && (
                    <>
                      We&apos;ll track this as an app issue, not a test issue, preventing incorrect
                      future healing attempts.
                    </>
                  )}
                  {selectedReasonData?.value === "intentional_change" && (
                    <>
                      This helps distinguish between bugs and intentional changes, improving
                      detection accuracy.
                    </>
                  )}
                  {selectedReasonData?.value === "test_needs_redesign" && (
                    <>
                      We&apos;ll flag this test for review and suggest more resilient selector
                      strategies.
                    </>
                  )}
                  {selectedReasonData?.value === "false_positive" && (
                    <>
                      This helps calibrate our failure detection to reduce noise and false alarms.
                    </>
                  )}
                  {selectedReasonData?.value === "other" && (
                    <>Your notes will be reviewed by our team to improve the system.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
          >
            {isSubmitting ? (
              <>Processing...</>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SelfHealingFeedbackCapture;
