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

  if (!shouldOffer || dismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="mt-3 flex items-center gap-3">
      <button
        onClick={isGenerating ? undefined : onAccept}
        disabled={isGenerating}
        className="text-xs italic text-zinc-500 hover:text-zinc-400 transition-colors cursor-pointer disabled:cursor-wait"
      >
        {isGenerating ? (
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-1 h-1 rounded-full bg-zinc-500 animate-pulse" />
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
          className="text-[10px] text-zinc-600 hover:text-zinc-500 transition-colors"
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
  if (!content || content.length < 200) return false;
  
  const lowerContent = content.toLowerCase();
  
  // Check for diagram keywords
  const keywordMatches = DIAGRAM_KEYWORDS.filter(kw => 
    lowerContent.includes(kw)
  ).length;
  
  // Check for diagram patterns
  const patternMatches = DIAGRAM_PATTERNS.filter(pattern =>
    pattern.test(content)
  ).length;
  
  // Require either 3+ keywords or 2+ patterns or combination
  return keywordMatches >= 3 || patternMatches >= 2 || (keywordMatches >= 2 && patternMatches >= 1);
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
    
    // TODO: Replace with actual Mermaid diagram generation
    // This runs in background while user reads the response
    console.log("🎨 Background: Starting diagram generation...");
    
    try {
      // Simulate async generation - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2500));
      
      // In real implementation, generate Mermaid diagram here
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
    if (status === "ready" || status === "generating") {
      console.log("🎨 User requested diagram view");
      setStatus("viewing");
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
