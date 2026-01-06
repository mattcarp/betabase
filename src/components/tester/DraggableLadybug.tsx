"use client";

import React, { useState } from "react";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";
import { Bug, Disc } from "lucide-react";
import { useTesterStore } from "../../lib/use-tester-store";
// feedback-dialog import will be added later

export const DraggableLadybug = ({ onOpenFeedback }: { onOpenFeedback: () => void }) => {
  const { isTesterModeEnabled, ladybugPosition, setLadybugPosition } = useTesterStore();
  const [isDragging, setIsDragging] = useState(false);

  if (!isTesterModeEnabled) return null;

  const handleDrag = (e: DraggableEvent, data: DraggableData) => {
    setIsDragging(true);
  };

  const handleStop = (e: DraggableEvent, data: DraggableData) => {
    setLadybugPosition({ x: data.x, y: data.y });
    setTimeout(() => setIsDragging(false), 100); // Small delay to prevent click triggering after drag
  };

  return (
    <Draggable
      position={ladybugPosition}
      onDrag={handleDrag}
      onStop={handleStop}
       // Bounds "parent" or specfic coordinates could be used, but "body" might be safer or just unbounded.
       // unbounded allows dragging anywhere.
    >
      <div 
        className="fixed z-[9999] cursor-grab active:cursor-grabbing group"
        style={{ touchAction: 'none' }} // Prevent scrolling on mobile while dragging
      >
        <div 
            className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50 hover:scale-110 transition-transform duration-200 border-2 border-white/20 backdrop-blur-sm"
            onClick={(e) => {
                if (!isDragging) {
                    onOpenFeedback();
                }
            }}
        >
          <Bug className="h-6 w-6 text-white group-hover:rotate-12 transition-transform duration-300" />
           {/* Antennae - cosmetic */}
           <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-12 border-2 border-white/0 group-hover:border-white/0 transition-all pointer-events-none" />
        </div>
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none">
            Report Issue
        </div>
      </div>
    </Draggable>
  );
};
