"use client";

/**
 * InfographicDisplay Component
 *
 * Displays Nano Banana Pro generated infographics alongside chat responses.
 * Features:
 * - Collapsible/dismissible (user can hide if not interested)
 * - Loading state while generating
 * - Graceful error handling
 * - Full-screen view option
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import {
  ChevronDown,
  ChevronUp,
  Maximize2,
  X,
  Loader2,
  Image as ImageIcon,
  Download,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Q8Button, Q8FeedbackContext } from "../ui/Q8Button";

export interface InfographicData {
  imageData: string; // Base64 encoded
  mimeType: string;
  type: string; // workflow, comparison, etc.
  generationTimeMs: number;
}

interface InfographicDisplayProps {
  infographic: InfographicData | null;
  isLoading: boolean;
  error?: string | null;
  onDismiss?: () => void;
  className?: string;
  /** Question that generated this infographic (for Q8 curation) */
  question?: string;
  /** Answer text associated with this infographic (for Q8 curation) */
  answer?: string;
  /** Message ID for tracking (for Q8 curation) */
  messageId?: string;
  /** Whether to show the Q8 curation button (requires Curator permission) */
  showQ8Button?: boolean;
}

export function InfographicDisplay({
  infographic,
  isLoading,
  error,
  onDismiss,
  className,
  question,
  answer,
  messageId,
  showQ8Button = true, // Show by default (assume Curator permission for demo)
}: InfographicDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Build Q8 feedback context for curation
  const q8Context: Q8FeedbackContext | null =
    infographic && question
      ? {
          type: "infographic",
          question,
          answer: answer || "",
          infographicData: {
            imageData: infographic.imageData,
            mimeType: infographic.mimeType,
            type: infographic.type,
          },
          messageId,
          timestamp: new Date().toISOString(),
        }
      : null;

  // Don't render anything if no infographic and not loading
  if (!infographic && !isLoading && !error) {
    return null;
  }

  const handleDownload = () => {
    if (!infographic) return;

    const link = document.createElement("a");
    link.href = `data:${infographic.mimeType};base64,${infographic.imageData}`;
    link.download = `aoma-infographic-${infographic.type}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fullscreen modal
  if (isFullscreen && infographic) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        onClick={() => setIsFullscreen(false)}
      >
        <Button
          variant="ghost"
          size="icon"
          className="mac-button absolute top-4 right-4 text-white hover:bg-white/10"
          onClick={() => setIsFullscreen(false)}
        >
          <X className="h-6 w-6" />
        </Button>
        <img
          src={`data:${infographic.mimeType};base64,${infographic.imageData}`}
          alt={`${infographic.type} infographic`}
          className="max-w-full max-h-full object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "mt-4 border border-border/50 rounded-lg overflow-hidden bg-muted/30",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border/50">
        <button
          className="mac-button flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <ImageIcon className="h-4 w-4" />
          <span>
            {isLoading
              ? "Generating infographic..."
              : infographic
                ? `${infographic.type.charAt(0).toUpperCase() + infographic.type.slice(1)} Infographic`
                : "Infographic"}
          </span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        <div className="flex items-center gap-1">
          {infographic && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="mac-button h-7 w-7"
                onClick={handleDownload}
                title="Download infographic"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="mac-button h-7 w-7"
                onClick={() => setIsFullscreen(true)}
                title="View fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </>
          )}
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="mac-button h-7 w-7"
              onClick={onDismiss}
              title="Dismiss infographic"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3">
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <span className="text-sm">Creating visual summary...</span>
                  <span className="text-xs mt-1">This may take 15-30 seconds</span>
                </div>
              )}

              {error && <div className="text-sm text-destructive py-4 text-center">{error}</div>}

              {infographic && !isLoading && (
                <div className="space-y-2">
                  {/* Image container with Q8 button overlay */}
                  <div className="relative group">
                    <img
                      src={`data:${infographic.mimeType};base64,${infographic.imageData}`}
                      alt={`${infographic.type} infographic`}
                      className="w-full rounded-md cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => setIsFullscreen(true)}
                    />
                    {/* Q8 Curate button - lower right corner */}
                    {showQ8Button && q8Context && (
                      <div className="absolute bottom-3 right-3 opacity-70 group-hover:opacity-100 transition-opacity">
                        <Q8Button context={q8Context} />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Generated in {(infographic.generationTimeMs / 1000).toFixed(1)}s</span>
                    <span>Click to enlarge</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Hook for managing infographic generation
 */
export function useInfographic() {
  const [infographic, setInfographic] = useState<InfographicData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInfographic = async (question: string, answer: string) => {
    setIsLoading(true);
    setError(null);
    setInfographic(null);

    try {
      const response = await fetch("/api/infographic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer }),
      });

      const data = await response.json();

      if (data.generated && data.imageData) {
        setInfographic({
          imageData: data.imageData,
          mimeType: data.mimeType || "image/png",
          type: data.type || "infographic",
          generationTimeMs: data.generationTimeMs || 0,
        });
      } else if (data.error) {
        // Don't show error for "not worthy" responses
        if (!data.reason?.includes("does not appear to benefit")) {
          setError(data.error);
        }
      }
    } catch (err) {
      console.error("[Infographic] Generation error:", err);
      setError("Failed to generate infographic");
    } finally {
      setIsLoading(false);
    }
  };

  const dismiss = () => {
    setInfographic(null);
    setError(null);
  };

  return {
    infographic,
    isLoading,
    error,
    generateInfographic,
    dismiss,
  };
}
