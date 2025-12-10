"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
// import { Sparkles, Network, X, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { cn } from "../../../lib/utils";

export interface DiagramOfferProps {
  shouldOffer?: boolean;
  onAccept?: () => void;
  onDismiss?: () => void;
  isGenerating?: boolean;
}

export function DiagramOffer({
  shouldOffer: propShouldOffer,
  onAccept: propOnAccept,
  onDismiss: propOnDismiss,
  isGenerating: propIsGenerating,
}: DiagramOfferProps) {
  const hookState = useDiagramOffer();

  const shouldOffer = propShouldOffer !== undefined ? propShouldOffer : hookState.shouldOffer;
  const offerDiagram = propOnAccept || hookState.offerDiagram;
  const dismissOffer = propOnDismiss || hookState.dismissOffer;
  const isGenerating = propIsGenerating !== undefined ? propIsGenerating : hookState.isGenerating;

  if (!shouldOffer) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="fixed bottom-6 right-6 z-50 max-w-sm w-full"
      >
        <Card className="mac-card overflow-hidden border-blue-500/20 shadow-2xl shadow-blue-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />

          <div className="p-5 relative">
            <button
              onClick={dismissOffer}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <div className="h-4 w-4 text-muted-foreground">✕</div>
              {/* <X className="h-4 w-4" /> */}
            </button>

            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                <div className="h-5 w-5 text-blue-200 mt-1">🕸️</div>
          {/* <Network className="h-5 w-5 text-blue-200 mt-1" /> */}
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Start Diagram Mode?
                    <div className="h-3 w-3 animate-pulse">✨</div>
                    {/* <Sparkles className="h-3 w-3 text-yellow-500 animate-pulse" /> */}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    I can visualize this complex workflow for you using an interactive Mermaid
                    diagram.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:shadow-blue-500/25 text-xs"
                    onClick={offerDiagram}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <div className="mr-2 h-3 w-3 animate-spin">⚙️</div>
                        {/* <Loader2 className="mr-2 h-3 w-3 animate-spin" /> */}
                        Generating...
                      </>
                    ) : (
                      <>
                        <div className="h-4 w-4 mr-2">✨</div>
                        {/* <Sparkles className="h-4 w-4 mr-2" /> */}
                        Show Diagram
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs hover:bg-white/5"
                    onClick={dismissOffer}
                    disabled={isGenerating}
                  >
                    No thanks
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook that manages the logic for when to show the offer
export function useDiagramOffer() {
  const [status, setStatus] = useState<"idle" | "generating" | "ready" | "viewing">("idle");
  const [isVisible, setIsVisible] = useState(false);

  // Auto-show for demo purposes (remove in prod or tie to AI logic)
  React.useEffect(() => {
    // Check if we already dismissed it this session
    const dismissed = sessionStorage.getItem("diagram_offer_dismissed");
    if (!dismissed) {
      // In a real app, this would be triggered by the AI response analysis
      // For demo, we rely on manual triggers or specific timeouts
    }
  }, []);

  const startBackgroundGeneration = async () => {
    if (status !== "idle") return;
    
    console.log("🎨 Imagen: Starting background diagram generation...");
    setStatus("generating");
    
    // Simulate generation time (faster than reading text)
    // In real app, this calls /api/generate-image with Gemini/Imagen
    await new Promise((resolve) => setTimeout(resolve, 3500));
    
    console.log("🎨 Imagen: Diagram ready in background");
    setStatus("ready");
    setIsVisible(true); // Now we offer it, knowing it's ready/nearly ready
  };

  const offerDiagram = async () => {
    if (status === "ready") {
        // Instant reveal
        setStatus("viewing");
        setIsVisible(false);
        console.log("🎨 Imagen: Showing pre-generated diagram");
    } else {
        // Fallback if they clicked before ready (shouldn't happen with our flow, but safe to handle)
        setIsVisible(false);
        await startBackgroundGeneration();
        setStatus("viewing");
    }
  };

  const dismissOffer = () => {
    setIsVisible(false);
    sessionStorage.setItem("diagram_offer_dismissed", "true");
  };

  return {
    shouldOffer: isVisible,
    offerDiagram,
    dismissOffer,
    startBackgroundGeneration,
    status,
    isGenerating: status === "generating",
  };
}

export default DiagramOffer;
