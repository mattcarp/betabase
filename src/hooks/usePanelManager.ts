import { useState, useCallback, useRef, useEffect } from "react";
import { PanelState, PanelPosition, PanelSize } from "../components/ui/FloatingPanel";

export interface PanelConfig {
  id: string;
  title: string;
  type: "transcription" | "ai-insights" | "system-monitor" | "audio" | "default";
  initialPosition?: PanelPosition;
  initialSize?: PanelSize;
  icon?: React.ReactNode;
  isVisible?: boolean;
  isPersistent?: boolean; // Persists across sessions
}

export interface PanelManagerState {
  panels: Map<string, PanelState>;
  focusedPanel: string | null;
  nextZIndex: number;
}

const DEFAULT_POSITIONS: PanelPosition[] = [
  { x: 100, y: 100 },
  { x: 400, y: 150 },
  { x: 200, y: 300 },
  { x: 500, y: 250 },
  { x: 150, y: 400 },
];

export const usePanelManager = () => {
  const [state, setState] = useState<PanelManagerState>({
    panels: new Map(),
    focusedPanel: null,
    nextZIndex: 1000,
  });

  const [visiblePanels, setVisiblePanels] = useState<Set<string>>(new Set());
  const positionIndexRef = useRef(0);

  // Add a new panel
  const addPanel = useCallback((config: PanelConfig) => {
    const position =
      config.initialPosition ||
      DEFAULT_POSITIONS[positionIndexRef.current % DEFAULT_POSITIONS.length];
    positionIndexRef.current += 1;

    setState((prev) => {
      const newPanel: PanelState = {
        id: config.id,
        position: position || { x: 100, y: 100 },
        size: config.initialSize || { width: "350px", height: "250px" },
        isMinimized: false,
        isMaximized: false,
        zIndex: prev.nextZIndex,
      };

      return {
        ...prev,
        panels: new Map(prev.panels).set(config.id, newPanel),
        nextZIndex: prev.nextZIndex + 1,
        focusedPanel: config.id,
      };
    });

    // Always make panels visible by default
    setVisiblePanels((prev) => new Set(prev).add(config.id));
  }, []);

  // Remove a panel
  const removePanel = useCallback((panelId: string) => {
    setState((prev) => {
      const newPanels = new Map(prev.panels);
      newPanels.delete(panelId);

      return {
        ...prev,
        panels: newPanels,
        focusedPanel: prev.focusedPanel === panelId ? null : prev.focusedPanel,
      };
    });

    setVisiblePanels((prev) => {
      const newVisible = new Set(prev);
      newVisible.delete(panelId);
      return newVisible;
    });
  }, []);

  // Show a panel
  const showPanel = useCallback((panelId: string) => {
    setVisiblePanels((prev) => new Set(prev).add(panelId));
  }, []);

  // Hide a panel
  const hidePanel = useCallback((panelId: string) => {
    setVisiblePanels((prev) => {
      const newVisible = new Set(prev);
      newVisible.delete(panelId);
      return newVisible;
    });
  }, []);

  // Toggle panel visibility
  const togglePanel = useCallback(
    (panelId: string) => {
      if (visiblePanels.has(panelId)) {
        hidePanel(panelId);
      } else {
        showPanel(panelId);
      }
    },
    [visiblePanels, hidePanel, showPanel]
  );

  // Focus a panel (brings to front)
  const focusPanel = useCallback((panelId: string) => {
    setState((prev) => {
      const panel = prev.panels.get(panelId);
      if (!panel) return prev;

      const updatedPanel = { ...panel, zIndex: prev.nextZIndex };
      const newPanels = new Map(prev.panels).set(panelId, updatedPanel);

      return {
        ...prev,
        panels: newPanels,
        nextZIndex: prev.nextZIndex + 1,
        focusedPanel: panelId,
      };
    });
  }, []);

  // Update panel state
  const updatePanelState = useCallback((panelId: string, newState: Partial<PanelState>) => {
    setState((prev) => {
      const currentPanel = prev.panels.get(panelId);
      if (!currentPanel) return prev;

      const updatedPanel = { ...currentPanel, ...newState };
      const newPanels = new Map(prev.panels).set(panelId, updatedPanel);

      return {
        ...prev,
        panels: newPanels,
      };
    });
  }, []);

  // Minimize all panels
  const minimizeAll = useCallback(() => {
    setState((prev) => {
      const newPanels = new Map();
      prev.panels.forEach((panel, id) => {
        newPanels.set(id, { ...panel, isMinimized: true, isMaximized: false });
      });
      return { ...prev, panels: newPanels };
    });
  }, []);

  // Restore all panels
  const restoreAll = useCallback(() => {
    setState((prev) => {
      const newPanels = new Map();
      prev.panels.forEach((panel, id) => {
        newPanels.set(id, { ...panel, isMinimized: false, isMaximized: false });
      });
      return { ...prev, panels: newPanels };
    });
  }, []);

  // Cascade panels (arrange in a cascading pattern)
  const cascadePanels = useCallback(() => {
    let index = 0;
    setState((prev) => {
      const newPanels = new Map();
      prev.panels.forEach((panel, id) => {
        const offset = index * 30;
        newPanels.set(id, {
          ...panel,
          position: { x: 100 + offset, y: 100 + offset },
          isMinimized: false,
          isMaximized: false,
        });
        index++;
      });
      return { ...prev, panels: newPanels };
    });
  }, []);

  // Tile panels (arrange in a grid)
  const tilePanels = useCallback(() => {
    const panelArray = Array.from(state.panels.entries());
    const cols = Math.ceil(Math.sqrt(panelArray.length));
    const panelWidth = Math.floor((window.innerWidth - 100) / cols);
    const panelHeight = Math.floor(
      (window.innerHeight - 200) / Math.ceil(panelArray.length / cols)
    );

    setState((prev) => {
      const newPanels = new Map();
      panelArray.forEach(([id, panel], index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        newPanels.set(id, {
          ...panel,
          position: { x: 50 + col * panelWidth, y: 100 + row * panelHeight },
          size: { width: panelWidth - 20, height: panelHeight - 20 },
          isMinimized: false,
          isMaximized: false,
        });
      });
      return { ...prev, panels: newPanels };
    });
  }, [state.panels]);

  // Get panel configuration helpers
  const isPanelVisible = useCallback(
    (panelId: string) => {
      return visiblePanels.has(panelId);
    },
    [visiblePanels]
  );

  const getPanelState = useCallback(
    (panelId: string) => {
      return state.panels.get(panelId);
    },
    [state.panels]
  );

  const getAllPanels = useCallback(() => {
    return Array.from(state.panels.entries());
  }, [state.panels]);

  const getVisiblePanels = useCallback(() => {
    return Array.from(state.panels.entries()).filter(([id]) => visiblePanels.has(id));
  }, [state.panels, visiblePanels]);

  useEffect(() => {
    const handleResize = () => {
      setState((prev) => {
        const newPanels = new Map();
        prev.panels.forEach((panel, id) => {
          const newPosition = { ...panel.position };
          if (panel.position.x > window.innerWidth - 200) {
            newPosition.x = window.innerWidth - 200;
          }
          if (panel.position.y > window.innerHeight - 100) {
            newPosition.y = window.innerHeight - 100;
          }
          newPanels.set(id, { ...panel, position: newPosition });
        });
        return { ...prev, panels: newPanels };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    // State
    panels: state.panels,
    visiblePanels,
    focusedPanel: state.focusedPanel,

    // Panel management
    addPanel,
    removePanel,
    showPanel,
    hidePanel,
    togglePanel,
    focusPanel,
    updatePanelState,

    // Bulk operations
    minimizeAll,
    restoreAll,
    cascadePanels,
    tilePanels,

    // Helpers
    isPanelVisible,
    getPanelState,
    getAllPanels,
    getVisiblePanels,
  };
};

export default usePanelManager;
