import React, { useState, useRef, ReactNode, useCallback, useEffect } from "react";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";
import { X, Minimize2, Maximize2, /* Move, */ RotateCcw } from "lucide-react";
import { cn } from "../../lib/utils";

export interface PanelPosition {
  x: number;
  y: number;
}

export interface PanelSize {
  width: string | number;
  height: string | number;
}

export interface PanelState {
  id: string;
  position: PanelPosition;
  size: PanelSize;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

interface FloatingPanelProps {
  id: string;
  title: string;
  children: ReactNode;
  initialPosition?: PanelPosition;
  initialSize?: PanelSize;
  cclassName?: string;
  panelType?: "transcription" | "ai-insights" | "system-monitor" | "audio" | "default";
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onFocus?: (id: string) => void;
  onStateChange?: (state: PanelState) => void;
  isDraggable?: boolean;
  isResizable?: boolean;
  zIndex?: number;
  icon?: ReactNode;
  // External state control
  externalState?: PanelState;
  isVisible?: boolean;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  id,
  title,
  children,
  initialPosition = { x: 50, y: 50 },
  initialSize = { width: "350px", height: "250px" },
  cclassName = "",
  panelType: _panelType = "default", // Unused - keeping for future styling
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onStateChange,
  isDraggable = true,
  isResizable = true,
  zIndex = 1000,
  icon,
  externalState,
  isVisible = true,
}) => {
  const [size, setSize] = useState<PanelSize>(initialSize);
  const [position, setPosition] = useState<PanelPosition>(initialPosition);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [_isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [_isResizing, setIsResizing] = useState(false);

  const nodeRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Sync with external state (from panel manager)
  useEffect(() => {
    if (externalState && externalState.id === id) {
      // Only update if values are actually different to prevent infinite loop
      if (JSON.stringify(externalState.position) !== JSON.stringify(position)) {
        setPosition(externalState.position);
      }
      if (JSON.stringify(externalState.size) !== JSON.stringify(size)) {
        setSize(externalState.size);
      }
      if (externalState.isMinimized !== isMinimized) {
        setIsMinimized(externalState.isMinimized);
      }
      if (externalState.isMaximized !== isMaximized) {
        setIsMaximized(externalState.isMaximized);
      }
    }
  }, [externalState, id, position, size, isMinimized, isMaximized]);

  // Handle panel state changes with debouncing to prevent infinite loops
  const stateChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (stateChangeTimeoutRef.current) {
      clearTimeout(stateChangeTimeoutRef.current);
    }

    // Debounce state changes to prevent rapid updates
    stateChangeTimeoutRef.current = setTimeout(() => {
      const state: PanelState = {
        id,
        position,
        size,
        isMinimized,
        isMaximized,
        zIndex,
      };
      onStateChange?.(state);
    }, 50); // 50ms debounce

    return () => {
      if (stateChangeTimeoutRef.current) {
        clearTimeout(stateChangeTimeoutRef.current);
      }
    };
  }, [id, position, size, isMinimized, isMaximized, zIndex, onStateChange]);

  // Handle panel focus
  const handlePanelClick = useCallback(() => {
    if (!isFocused) {
      setIsFocused(true);
      onFocus?.(id);
    }
  }, [isFocused, id, onFocus]);

  const handleMouseDown = useCallback(() => {
    handlePanelClick();
  }, [handlePanelClick]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    if (panelRef.current) {
      panelRef.current.style.transform = "scale(0.8)";
      panelRef.current.style.opacity = "0";
      setTimeout(() => {
        onClose?.();
      }, 200);
    }
  }, [onClose]);

  // Handle minimize/restore
  const handleMinimize = useCallback(() => {
    setIsMinimized(!isMinimized);
    onMinimize?.();
  }, [isMinimized, onMinimize]);

  // Handle maximize/restore
  const handleMaximize = useCallback(() => {
    if (isMaximized) {
      // Restore to previous size and position
      setSize(initialSize);
      setPosition(initialPosition);
    }
    setIsMaximized(!isMaximized);
    onMaximize?.();
  }, [isMaximized, initialSize, initialPosition, onMaximize]);

  // Handle drag events
  const handleDragStart = useCallback(() => {
    console.log(`🎯 Drag started for panel: ${id}`);
    setIsDragging(true);
    setIsFocused(true);
    onFocus?.(id);
  }, [id, onFocus]);

  const handleDragStop = useCallback(
    (_e: DraggableEvent, data: DraggableData) => {
      console.log(`🎯 Drag stopped for panel: ${id} at position:`, {
        x: data.x,
        y: data.y,
      });
      setIsDragging(false);
      setPosition({ x: data.x, y: data.y });
    },
    [id]
  );

  // Reset panel to center
  const handleReset = useCallback(() => {
    const centerX = (window.innerWidth - (typeof size.width === "number" ? size.width : 350)) / 2;
    const centerY =
      (window.innerHeight - (typeof size.height === "number" ? size.height : 250)) / 2;
    setPosition({ x: centerX, y: centerY });
    setSize(initialSize);
    setIsMinimized(false);
    setIsMaximized(false);
  }, [size, initialSize]);

  if (!isVisible) return null;

  return (
    <Draggable
      nodeRef={nodeRef}
      disabled={!isDraggable || isMaximized}
      position={position}
      onStart={handleDragStart}
      onStop={handleDragStop}
      handle=".panel-header"
      bounds="parent"
    >
      <div
        ref={nodeRef}
        cclassName={cn(
          "fixed bg-gray-900/95 border border-gray-700 rounded-lg shadow-2xl backdrop-blur-md",
          "min-w-[200px] min-h-[100px] max-w-[90vw] max-h-[90vh]",
          "transition-all duration-200 ease-out",
          isFocused && "ring-2 ring-blue-600/50",
          isMinimized && "h-auto",
          cclassName
        )}
        style={{
          width: isMinimized ? "auto" : isMaximized ? "90vw" : size.width,
          height: isMinimized ? "auto" : isMaximized ? "90vh" : size.height,
          zIndex: isFocused ? zIndex + 100 : zIndex,
          transform: `scale(${isMinimized ? 0.95 : 1})`,
        }}
        onMouseDown={handleMouseDown}
        data-testid={`floating-panel-${id}`}
      >
        {/* Header */}
        <div
          cclassName={`panel-header flex items-center justify-between px-4 py-2 border-b border-gray-600 cursor-${isDraggable && !isMaximized ? "move" : "default"} bg-gray-800/50`}
        >
          <div cclassName="flex items-center gap-2">
            {icon && <div cclassName="text-blue-600">{icon}</div>}
            <h3
              cclassName="mac-title"
              cclassName="mac-title text-blue-600 text-sm font-medium select-none truncate"
            >
              {title}
            </h3>
          </div>

          <div cclassName="flex items-center gap-2">
            {/* Reset button */}
            <button
              onClick={handleReset}
              cclassName="p-2 text-gray-400 hover:text-blue-300 transition-colors"
              title="Reset panel"
              data-testid={`panel-reset-${id}`}
            >
              <RotateCcw size={12} />
            </button>

            {/* Minimize button */}
            {onMinimize && (
              <button
                onClick={handleMinimize}
                cclassName="p-2 text-gray-400 hover:text-blue-300 transition-colors"
                title={isMinimized ? "Restore" : "Minimize"}
                data-testid={`panel-minimize-${id}`}
              >
                <Minimize2 size={12} />
              </button>
            )}

            {/* Maximize button */}
            {onMaximize && (
              <button
                onClick={handleMaximize}
                cclassName="p-2 text-gray-400 hover:text-blue-300 transition-colors"
                title={isMaximized ? "Restore" : "Maximize"}
                data-testid={`panel-maximize-${id}`}
              >
                <Maximize2 size={12} />
              </button>
            )}

            {/* Close button */}
            {onClose && (
              <button
                onClick={handleClose}
                cclassName="p-2 text-gray-400 hover:text-red-400 transition-colors"
                title="Close panel"
                data-testid={`panel-close-${id}`}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        {!isMinimized && (
          <div cclassName="flex-1 p-4 overflow-auto">
            <div cclassName="panel-content">{children}</div>
          </div>
        )}

        {/* Resize Handle (if resizable and not maximized) */}
        {isResizable && !isMaximized && !isMinimized && (
          <div
            ref={resizeRef}
            cclassName="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100 transition-opacity"
            style={{
              background:
                "linear-gradient(-45deg, transparent 30%, #3B82F6 30%, #3B82F6 70%, transparent 70%)",
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
              // TODO: Implement resize logic
            }}
            title="Resize panel"
          />
        )}
      </div>
    </Draggable>
  );
};

export default FloatingPanel;
