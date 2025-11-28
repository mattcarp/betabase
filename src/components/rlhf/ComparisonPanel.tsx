/**
 * ComparisonPanel - Side-by-Side Response Comparison for DPO
 *
 * Implements preference data collection following DPO best practices:
 * - Shows two responses side by side
 * - User selects preferred response (A, B, or tie)
 * - Captures reasoning for preference
 * - Supports keyboard shortcuts for fast annotation
 *
 * @see https://arxiv.org/abs/2305.18290 (DPO Paper)
 */

"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle,
  XCircle,
  Equal,
  ArrowLeft,
  ArrowRight,
  Keyboard,
  MessageSquare,
  Sparkles,
  Loader2,
  SkipForward,
} from "lucide-react";
import { Response } from "@/components/ai-elements/response";

export interface ComparisonData {
  id: string;
  query: string;
  responseA: string;
  responseB: string;
  modelA?: string;
  modelB?: string;
  contextMetadata?: {
    ragSourcesA?: number;
    ragSourcesB?: number;
    latencyMsA?: number;
    latencyMsB?: number;
  };
}

interface ComparisonPanelProps {
  comparison: ComparisonData;
  onPreference: (
    preference: "A" | "B" | "tie",
    reason: string | null
  ) => Promise<void>;
  onSkip?: () => void;
  showKeyboardHints?: boolean;
  className?: string;
  queuePosition?: { current: number; total: number };
}

export function ComparisonPanel({
  comparison,
  onPreference,
  onSkip,
  showKeyboardHints = true,
  className,
  queuePosition,
}: ComparisonPanelProps) {
  const [selectedPreference, setSelectedPreference] = useState<
    "A" | "B" | "tie" | null
  >(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hoveredSide, setHoveredSide] = useState<"A" | "B" | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in textarea
      if (e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          setSelectedPreference("A");
          break;
        case "ArrowRight":
        case "b":
        case "B":
          setSelectedPreference("B");
          break;
        case "t":
        case "T":
        case "=":
          setSelectedPreference("tie");
          break;
        case "Enter":
          if (selectedPreference && !isSubmitting) {
            handleSubmit();
          }
          break;
        case "s":
        case "S":
          if (onSkip) {
            onSkip();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPreference, isSubmitting, onSkip]);

  const handleSubmit = useCallback(async () => {
    if (!selectedPreference) return;

    setIsSubmitting(true);
    try {
      await onPreference(selectedPreference, reason || null);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedPreference(null);
        setReason("");
      }, 800);
    } catch (error) {
      console.error("Failed to submit preference:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedPreference, reason, onPreference]);

  const renderResponseCard = (
    side: "A" | "B",
    content: string,
    model?: string,
    metadata?: { sources?: number; latencyMs?: number }
  ) => {
    const isSelected = selectedPreference === side;
    const isHovered = hoveredSide === side;
    const isOtherSelected =
      selectedPreference !== null && selectedPreference !== side;

    return (
      <motion.div
        className="flex-1"
        animate={{
          scale: isSelected ? 1.02 : isOtherSelected ? 0.98 : 1,
          opacity: isOtherSelected && selectedPreference !== "tie" ? 0.6 : 1,
        }}
        transition={{ duration: 0.2 }}
        onMouseEnter={() => setHoveredSide(side)}
        onMouseLeave={() => setHoveredSide(null)}
      >
        <Card
          onClick={() => setSelectedPreference(side)}
          className={cn(
            "cursor-pointer transition-all h-full",
            "bg-zinc-900/50 border-2",
            isSelected
              ? "border-purple-500 ring-2 ring-purple-500/20"
              : isHovered
                ? "border-zinc-600"
                : "border-zinc-800",
            isSelected && "shadow-lg shadow-purple-500/10"
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-lg font-bold",
                    isSelected
                      ? "bg-purple-500/20 text-purple-400 border-purple-500/50"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  )}
                >
                  {side}
                </Badge>
                {model && (
                  <span className="text-xs text-zinc-500 font-normal">
                    {model}
                  </span>
                )}
              </CardTitle>

              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <CheckCircle className="h-6 w-6 text-purple-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {metadata && (
              <div className="flex gap-3 text-xs text-zinc-500 mt-2">
                {metadata.sources !== undefined && (
                  <span>{metadata.sources} sources</span>
                )}
                {metadata.latencyMs !== undefined && (
                  <span>{metadata.latencyMs}ms</span>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="pt-0">
            <div
              className={cn(
                "prose prose-sm prose-invert max-w-none",
                "max-h-[400px] overflow-y-auto",
                "text-zinc-300"
              )}
            >
              <Response>{content}</Response>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16"
      >
        <CheckCircle className="h-16 w-16 text-green-400 mb-4" />
        <h3 className="text-xl font-medium text-zinc-100">
          Preference Recorded!
        </h3>
        <p className="text-sm text-zinc-400 mt-2">Loading next comparison...</p>
      </motion.div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Queue Position */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <h2 className="text-lg font-medium text-zinc-100">
            Compare Responses
          </h2>
          {queuePosition && (
            <Badge variant="outline" className="text-zinc-400 border-zinc-700">
              {queuePosition.current} of {queuePosition.total}
            </Badge>
          )}
        </div>

        {showKeyboardHints && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="text-zinc-500">
                  <Keyboard className="h-4 w-4 mr-1" />
                  Shortcuts
                </Button>
              </TooltipTrigger>
              <TooltipContent className="w-64">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Select A</span>
                    <kbd className="px-2 py-0.5 bg-zinc-700 rounded">
                      A / Left Arrow
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Select B</span>
                    <kbd className="px-2 py-0.5 bg-zinc-700 rounded">
                      B / Right Arrow
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Tie</span>
                    <kbd className="px-2 py-0.5 bg-zinc-700 rounded">T / =</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Submit</span>
                    <kbd className="px-2 py-0.5 bg-zinc-700 rounded">Enter</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Skip</span>
                    <kbd className="px-2 py-0.5 bg-zinc-700 rounded">S</kbd>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Query Display */}
      <Card className="bg-zinc-800/30 border-zinc-700/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <span className="text-xs text-zinc-500 font-medium block mb-1">
                USER QUERY
              </span>
              <p className="text-zinc-200">{comparison.query}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Response Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderResponseCard(
          "A",
          comparison.responseA,
          comparison.modelA,
          comparison.contextMetadata
            ? {
                sources: comparison.contextMetadata.ragSourcesA,
                latencyMs: comparison.contextMetadata.latencyMsA,
              }
            : undefined
        )}

        {/* VS Divider (visible on desktop) */}
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-zinc-900 border border-zinc-700 rounded-full p-2">
            <span className="text-zinc-500 font-medium text-sm">VS</span>
          </div>
        </div>

        {renderResponseCard(
          "B",
          comparison.responseB,
          comparison.modelB,
          comparison.contextMetadata
            ? {
                sources: comparison.contextMetadata.ragSourcesB,
                latencyMs: comparison.contextMetadata.latencyMsB,
              }
            : undefined
        )}
      </div>

      {/* Preference Selection */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant={selectedPreference === "A" ? "default" : "outline"}
            onClick={() => setSelectedPreference("A")}
            className={cn(
              "min-w-[120px]",
              selectedPreference === "A"
                ? "bg-purple-600 hover:bg-purple-500"
                : "border-zinc-700"
            )}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Prefer A
          </Button>

          <Button
            variant={selectedPreference === "tie" ? "default" : "outline"}
            onClick={() => setSelectedPreference("tie")}
            className={cn(
              "min-w-[100px]",
              selectedPreference === "tie"
                ? "bg-zinc-600 hover:bg-zinc-500"
                : "border-zinc-700"
            )}
          >
            <Equal className="h-4 w-4 mr-2" />
            Tie
          </Button>

          <Button
            variant={selectedPreference === "B" ? "default" : "outline"}
            onClick={() => setSelectedPreference("B")}
            className={cn(
              "min-w-[120px]",
              selectedPreference === "B"
                ? "bg-purple-600 hover:bg-purple-500"
                : "border-zinc-700"
            )}
          >
            Prefer B
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Reason Input */}
        <AnimatePresence>
          {selectedPreference && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full max-w-2xl"
            >
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Why do you prefer ${
                  selectedPreference === "tie"
                    ? "neither (tie)"
                    : `Response ${selectedPreference}`
                }? (optional but helpful)`}
                className="bg-zinc-800/50 border-zinc-700 text-zinc-200 placeholder:text-zinc-500"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {onSkip && (
            <Button
              variant="ghost"
              onClick={onSkip}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Skip
            </Button>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!selectedPreference || isSubmitting}
            className="min-w-[150px] bg-green-600 hover:bg-green-500"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Submit Preference
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ComparisonPanel;
