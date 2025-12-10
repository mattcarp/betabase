"use client";

import React, { useState } from "react";
import { Button } from "../../ui/button";

export interface DiagramOfferProps {
  shouldOffer?: boolean;
  onAccept?: () => void;
  onDismiss?: () => void;
  isGenerating?: boolean;
}

export function DiagramOffer({
  shouldOffer,
  onAccept,
  onDismiss,
  isGenerating,
}: DiagramOfferProps) {
  
  if (!shouldOffer) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full">
        <div className="mac-card overflow-hidden border-blue-500/20 shadow-2xl shadow-blue-500/10 bg-black/80 backdrop-blur-md rounded-xl text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />

          <div className="p-5 relative">
            <button
              onClick={onDismiss}
              className="absolute top-3 right-3 text-muted-foreground hover:text-white transition-colors"
            >
              <div className="h-4 w-4 text-xs flex items-center justify-center">✕</div>
            </button>

            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                <div className="h-5 w-5 text-xl flex items-center justify-center">🕸️</div>
              </div>

              <div className="space-y-3 flex-1">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    Start Diagram Mode?
                    <div className="h-3 w-3 animate-pulse">✨</div>
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed mt-1">
                    I can visualize this complex workflow for you using an interactive Mermaid diagram.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:shadow-blue-500/25 text-xs border-0"
                    onClick={onAccept}
                    disabled={isGenerating}
                  >
                        {isGenerating ? (
                           <>
                             <div className="h-3 w-3 animate-spin mr-2">⚙️</div>
                             Generating...
                           </>
                        ) : (
                           <>
                             <div className="h-4 w-4 mr-2 flex items-center">✨</div>
                             Show Diagram
                           </>
                        )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs hover:bg-white/10 text-gray-300"
                    onClick={onDismiss}
                  >
                    No thanks
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}

export function useDiagramOffer() {
  const [status, setStatus] = useState<"idle" | "generating" | "ready" | "viewing">("idle");
  const [isVisible, setIsVisible] = useState(false);

  const startBackgroundGeneration = async () => {
    console.log("🎨 Imagen: Starting background diagram generation...");
    setStatus("generating");
    await new Promise((resolve) => setTimeout(resolve, 3500));
    console.log("🎨 Imagen: Diagram ready in background");
    setStatus("ready");
    setIsVisible(true);
  };

  const offerDiagram = async () => {
    console.log("🎨 Imagen: Showing pre-generated diagram");
    setStatus("viewing");
  };

  const dismissOffer = () => {
    setIsVisible(false);
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
