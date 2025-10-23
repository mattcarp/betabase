import { useHotkeys } from "react-hotkeys-hook";
import { useCallback } from "react";

export interface HUDShortcutsConfig {
  // Panel Management
  onTogglePanel?: (panelId: string) => void;
  onResetPanels?: () => void;
  onMinimizeAllPanels?: () => void;
  onMaximizePanel?: (panelId: string) => void;

  // Navigation
  onFocusNextPanel?: () => void;
  onFocusPreviousPanel?: () => void;
  onCyclePanels?: () => void;

  // Customization
  onToggleCustomization?: () => void;
  onToggleTheme?: () => void;
  onIncreaseBlur?: () => void;
  onDecreaseBlur?: () => void;
  onIncreaseOpacity?: () => void;
  onDecreaseOpacity?: () => void;

  // Audio
  onToggleAudioSource?: () => void;
  onSelectNextAudioSource?: () => void;
  onSelectPreviousAudioSource?: () => void;

  // Help & Accessibility
  onToggleHelp?: () => void;
  onToggleAccessibility?: () => void;
  onToggleHighContrast?: () => void;

  // General
  onToggleFullscreen?: () => void;
  onRefresh?: () => void;
}

export const useHUDShortcuts = (config: HUDShortcutsConfig) => {
  const {
    onTogglePanel,
    onResetPanels,
    onMinimizeAllPanels,
    onMaximizePanel,
    onFocusNextPanel,
    onFocusPreviousPanel,
    onCyclePanels,
    onToggleCustomization,
    onToggleTheme,
    onIncreaseBlur,
    onDecreaseBlur,
    onIncreaseOpacity,
    onDecreaseOpacity,
    onToggleAudioSource,
    onSelectNextAudioSource,
    onSelectPreviousAudioSource,
    onToggleHelp,
    onToggleAccessibility,
    onToggleHighContrast,
    onToggleFullscreen,
    onRefresh,
  } = config;

  // Panel Management Shortcuts
  useHotkeys(
    "ctrl+shift+r",
    (e) => {
      e.preventDefault();
      onResetPanels?.();
    },
    {
      enableOnFormTags: false,
      description: "Reset all panels to default positions",
    }
  );

  useHotkeys(
    "ctrl+shift+m",
    (e) => {
      e.preventDefault();
      onMinimizeAllPanels?.();
    },
    {
      enableOnFormTags: false,
      description: "Minimize all panels",
    }
  );

  // Panel Navigation Shortcuts
  useHotkeys(
    "tab",
    (e) => {
      e.preventDefault();
      onFocusNextPanel?.();
    },
    {
      enableOnFormTags: false,
      description: "Focus next panel",
    }
  );

  useHotkeys(
    "shift+tab",
    (e) => {
      e.preventDefault();
      onFocusPreviousPanel?.();
    },
    {
      enableOnFormTags: false,
      description: "Focus previous panel",
    }
  );

  useHotkeys(
    "ctrl+tab",
    (e) => {
      e.preventDefault();
      onCyclePanels?.();
    },
    {
      enableOnFormTags: false,
      description: "Cycle through panels",
    }
  );

  // Customization Shortcuts
  useHotkeys(
    "ctrl+shift+c",
    (e) => {
      e.preventDefault();
      onToggleCustomization?.();
    },
    {
      enableOnFormTags: false,
      description: "Toggle customization panel",
    }
  );

  useHotkeys(
    "ctrl+shift+t",
    (e) => {
      e.preventDefault();
      onToggleTheme?.();
    },
    {
      enableOnFormTags: false,
      description: "Cycle through themes",
    }
  );

  useHotkeys(
    "ctrl+up",
    (e) => {
      e.preventDefault();
      onIncreaseBlur?.();
    },
    {
      enableOnFormTags: false,
      description: "Increase blur effect",
    }
  );

  useHotkeys(
    "ctrl+down",
    (e) => {
      e.preventDefault();
      onDecreaseBlur?.();
    },
    {
      enableOnFormTags: false,
      description: "Decrease blur effect",
    }
  );

  useHotkeys(
    "ctrl+right",
    (e) => {
      e.preventDefault();
      onIncreaseOpacity?.();
    },
    {
      enableOnFormTags: false,
      description: "Increase panel opacity",
    }
  );

  useHotkeys(
    "ctrl+left",
    (e) => {
      e.preventDefault();
      onDecreaseOpacity?.();
    },
    {
      enableOnFormTags: false,
      description: "Decrease panel opacity",
    }
  );

  // Audio Source Shortcuts
  useHotkeys(
    "ctrl+shift+a",
    (e) => {
      e.preventDefault();
      onToggleAudioSource?.();
    },
    {
      enableOnFormTags: false,
      description: "Toggle audio source selector",
    }
  );

  useHotkeys(
    "alt+up",
    (e) => {
      e.preventDefault();
      onSelectNextAudioSource?.();
    },
    {
      enableOnFormTags: false,
      description: "Select next audio source",
    }
  );

  useHotkeys(
    "alt+down",
    (e) => {
      e.preventDefault();
      onSelectPreviousAudioSource?.();
    },
    {
      enableOnFormTags: false,
      description: "Select previous audio source",
    }
  );

  // Help & Accessibility Shortcuts
  useHotkeys(
    "f1",
    (e) => {
      e.preventDefault();
      onToggleHelp?.();
    },
    {
      enableOnFormTags: true,
      description: "Toggle help overlay",
    }
  );

  useHotkeys(
    "ctrl+shift+h",
    (e) => {
      e.preventDefault();
      onToggleHelp?.();
    },
    {
      enableOnFormTags: false,
      description: "Toggle help overlay (alternative)",
    }
  );

  useHotkeys(
    "ctrl+shift+x",
    (e) => {
      e.preventDefault();
      onToggleAccessibility?.();
    },
    {
      enableOnFormTags: false,
      description: "Toggle accessibility features",
    }
  );

  useHotkeys(
    "ctrl+shift+k",
    (e) => {
      e.preventDefault();
      onToggleHighContrast?.();
    },
    {
      enableOnFormTags: false,
      description: "Toggle high contrast mode",
    }
  );

  // General Shortcuts
  useHotkeys(
    "f11",
    (e) => {
      e.preventDefault();
      onToggleFullscreen?.();
    },
    {
      enableOnFormTags: true,
      description: "Toggle fullscreen",
    }
  );

  useHotkeys(
    "f5",
    (e) => {
      e.preventDefault();
      onRefresh?.();
    },
    {
      enableOnFormTags: false,
      description: "Refresh HUD",
    }
  );

  // Individual Panel Shortcuts (1-9)
  // Note: Must call hooks outside of loops per Rules of Hooks
  useHotkeys("ctrl+1", (e) => { e.preventDefault(); onTogglePanel?.("panel-1"); }, { enableOnFormTags: false, description: "Toggle panel 1" });
  useHotkeys("ctrl+2", (e) => { e.preventDefault(); onTogglePanel?.("panel-2"); }, { enableOnFormTags: false, description: "Toggle panel 2" });
  useHotkeys("ctrl+3", (e) => { e.preventDefault(); onTogglePanel?.("panel-3"); }, { enableOnFormTags: false, description: "Toggle panel 3" });
  useHotkeys("ctrl+4", (e) => { e.preventDefault(); onTogglePanel?.("panel-4"); }, { enableOnFormTags: false, description: "Toggle panel 4" });
  useHotkeys("ctrl+5", (e) => { e.preventDefault(); onTogglePanel?.("panel-5"); }, { enableOnFormTags: false, description: "Toggle panel 5" });
  useHotkeys("ctrl+6", (e) => { e.preventDefault(); onTogglePanel?.("panel-6"); }, { enableOnFormTags: false, description: "Toggle panel 6" });
  useHotkeys("ctrl+7", (e) => { e.preventDefault(); onTogglePanel?.("panel-7"); }, { enableOnFormTags: false, description: "Toggle panel 7" });
  useHotkeys("ctrl+8", (e) => { e.preventDefault(); onTogglePanel?.("panel-8"); }, { enableOnFormTags: false, description: "Toggle panel 8" });
  useHotkeys("ctrl+9", (e) => { e.preventDefault(); onTogglePanel?.("panel-9"); }, { enableOnFormTags: false, description: "Toggle panel 9" });

  // Return shortcuts list for display
  const shortcuts = [
    {
      category: "Panel Management",
      shortcuts: [
        { key: "Ctrl+Shift+R", description: "Reset all panels" },
        { key: "Ctrl+Shift+M", description: "Minimize all panels" },
        { key: "Ctrl+1-9", description: "Toggle specific panel" },
      ],
    },
    {
      category: "Navigation",
      shortcuts: [
        { key: "Tab", description: "Focus next panel" },
        { key: "Shift+Tab", description: "Focus previous panel" },
        { key: "Ctrl+Tab", description: "Cycle through panels" },
      ],
    },
    {
      category: "Customization",
      shortcuts: [
        { key: "Ctrl+Shift+C", description: "Toggle customization" },
        { key: "Ctrl+Shift+T", description: "Cycle themes" },
        { key: "Ctrl+↑/↓", description: "Adjust blur" },
        { key: "Ctrl+←/→", description: "Adjust opacity" },
      ],
    },
    {
      category: "Audio",
      shortcuts: [
        { key: "Ctrl+Shift+A", description: "Toggle audio source selector" },
        { key: "Alt+↑/↓", description: "Select audio source" },
      ],
    },
    {
      category: "Help & Accessibility",
      shortcuts: [
        { key: "F1 / Ctrl+Shift+H", description: "Toggle help" },
        { key: "Ctrl+Shift+X", description: "Toggle accessibility" },
        { key: "Ctrl+Shift+K", description: "Toggle high contrast" },
      ],
    },
    {
      category: "General",
      shortcuts: [
        { key: "F11", description: "Toggle fullscreen" },
        { key: "F5", description: "Refresh HUD" },
      ],
    },
  ];

  return { shortcuts };
};

export default useHUDShortcuts;
