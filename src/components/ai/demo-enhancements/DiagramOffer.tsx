"use client";

import React, { useState, useEffect, useRef } from "react";

export interface DiagramOfferProps {
  shouldOffer?: boolean;
  onAccept?: () => void;
  onDismiss?: () => void;
  isGenerating?: boolean;
  isReady?: boolean;
}

/**
 * DiagramOffer - A subtle inline hint for diagram generation
 * 
 * Design principles:
 * - One line, italic, muted gray
 * - Only appears when content warrants visualization
 * - Non-intrusive, non-blocking
 * - Diagram builds in background while user reads
 */
export function DiagramOffer({
  shouldOffer,
  onAccept,
  onDismiss,
  isGenerating,
  isReady,
}: DiagramOfferProps) {
  const [dismissed, setDismissed] = useState(false);

  console.log("🎨 DiagramOffer render:", { shouldOffer, dismissed, isGenerating, isReady });

  if (!shouldOffer || dismissed) {
    console.log("🎨 DiagramOffer: Not rendering (shouldOffer:", shouldOffer, ", dismissed:", dismissed, ")");
    return null;
  }

  console.log("🎨 DiagramOffer: Rendering offer UI");

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    onDismiss?.();
  };

  const handleAccept = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("🎨 DiagramOffer: Accept button clicked, isGenerating:", isGenerating);
    if (!isGenerating && onAccept) {
      console.log("🎨 DiagramOffer: Calling onAccept handler");
      onAccept();
    }
  };

  return (
    <div className="mt-3 flex items-center gap-3">
      <button
        onClick={handleAccept}
        disabled={isGenerating}
        className="text-xs italic text-muted-foreground hover:text-muted-foreground/80 transition-colors cursor-pointer disabled:cursor-wait"
      >
        {isGenerating ? (
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-1 h-1 rounded-full bg-muted animate-pulse" />
            preparing diagram...
          </span>
        ) : isReady ? (
          "diagram ready — click to view"
        ) : (
          "would you like a diagram of this?"
        )}
      </button>
      {!isGenerating && (
        <button
          onClick={handleDismiss}
          className="text-[10px] text-muted hover:text-muted-foreground transition-colors"
          aria-label="Dismiss diagram offer"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// Keywords that suggest content would benefit from visualization
const DIAGRAM_KEYWORDS = [
  "workflow",
  "process",
  "steps",
  "architecture",
  "flow",
  "pipeline",
  "sequence",
  "diagram",
  "structure",
  "hierarchy",
  "relationship",
  "components",
  "layers",
  "stages",
  "phases",
  "system",
  "integration",
  "data flow",
  "state machine",
  "decision tree",
  "orchestration",
  "microservice",
  "api",
  "endpoint",
  "schema",
  "erd",
  "entity",
  "multi-tenant",
];

// Patterns that strongly suggest diagrammable content
const DIAGRAM_PATTERNS = [
  /\d+\.\s+\w+/gm,           // Numbered lists (1. First, 2. Second)
  /step\s+\d+/gi,            // "Step 1", "Step 2"
  /→|->|➜|⟶/g,              // Arrows indicating flow
  /then\s+.+\s+then/gi,      // Sequential language
  /first.+second.+third/gi,  // Ordinal sequences
  /input.+process.+output/gi, // I/P/O patterns
];

/**
 * Analyzes content to determine if a diagram would be helpful
 * Returns true only for content that genuinely benefits from visualization
 */
export function shouldOfferDiagram(content: string): boolean {
  // For demo: lower threshold to show the feature (original was 200 chars, 3 keywords)
  if (!content || content.length < 100) return false;
  
  const lowerContent = content.toLowerCase();
  
  // 🐛 FIX: Don't offer diagrams for "I don't know" responses!
  const isUnknownResponse = 
    lowerContent.includes("i don't have any information") ||
    lowerContent.includes("i don't have information") ||
    lowerContent.includes("i don't have specific details") ||
    lowerContent.includes("i've looked through") ||
    lowerContent.includes("turns out i don't have") ||
    lowerContent.includes("i don't have data") ||
    lowerContent.includes("i can't say for sure") ||
    lowerContent.includes("no information") ||
    lowerContent.includes("not in my knowledge base") ||
    lowerContent.includes("i don't know") ||
    lowerContent.includes("couldn't find");
  
  if (isUnknownResponse) {
    console.log("🚫 Skipping diagram offer - detected 'I don't know' response");
    return false;
  }
  
  // Check for diagram keywords
  const keywordMatches = DIAGRAM_KEYWORDS.filter(kw => 
    lowerContent.includes(kw)
  ).length;
  
  // Check for diagram patterns
  const patternMatches = DIAGRAM_PATTERNS.filter(pattern =>
    pattern.test(content)
  ).length;
  
  // For demo: lower thresholds (original: 3+ keywords, 2+ patterns, or 2+1 combo)
  // Now: 1+ keyword or 1+ pattern
  return keywordMatches >= 1 || patternMatches >= 1;
}

export interface UseDiagramOfferOptions {
  content?: string;
  onStreamStart?: () => void;
}

/**
 * Hook for managing diagram offer state with background generation
 * 
 * Usage:
 * - Call startBackgroundGeneration() when response streaming starts
 * - Diagram generates in background while user reads
 * - When user clicks, diagram is already ready (or nearly ready)
 */
export function useDiagramOffer(options: UseDiagramOfferOptions = {}) {
  const [status, setStatus] = useState<"idle" | "generating" | "ready" | "viewing" | "dismissed">("idle");
  const [shouldShow, setShouldShow] = useState(false);
  const generationStarted = useRef(false);
  const diagramData = useRef<string | null>(null);

  // Determine if we should offer based on content
  useEffect(() => {
    if (options.content && !generationStarted.current) {
      const should = shouldOfferDiagram(options.content);
      setShouldShow(should);
      
      // Auto-start background generation if warranted
      if (should) {
        startBackgroundGeneration();
      }
    }
  }, [options.content]);

  const startBackgroundGeneration = async () => {
    if (generationStarted.current || status !== "idle") return;
    
    generationStarted.current = true;
    setStatus("generating");
    
    // Nano Banana diagram generation
    // This runs in background while user reads the response
    console.log("🎨 Background: Starting diagram generation...");

    try {
      // Simulate async generation - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Nano Banana diagram generation
      diagramData.current = "graph TD; A-->B; B-->C;"; // Placeholder
      
      console.log("🎨 Background: Diagram ready");
      setStatus("ready");
    } catch (error) {
      console.error("🎨 Background: Diagram generation failed", error);
      setStatus("idle");
      generationStarted.current = false;
    }
  };

  const showDiagram = () => {
    // Allow viewing from any state except dismissed
    if (status !== "dismissed") {
      console.log("🎨 User requested diagram view, current status:", status);
      setStatus("viewing");
      console.log("🎨 Status set to viewing");
    }
  };

  const dismissOffer = () => {
    setShouldShow(false);
    setStatus("dismissed");
  };

  const reset = () => {
    setStatus("idle");
    setShouldShow(false);
    generationStarted.current = false;
    diagramData.current = null;
  };

  return {
    // Display state
    shouldOffer: shouldShow && status !== "dismissed" && status !== "viewing",
    isGenerating: status === "generating",
    isReady: status === "ready",
    isViewing: status === "viewing",
    status,
    
    // Diagram data
    diagramData: diagramData.current,
    
    // Actions
    startBackgroundGeneration,
    showDiagram,
    dismissOffer,
    reset,
    
    // Legacy compatibility
    offerDiagram: showDiagram,
  };
}

export default DiagramOffer;
