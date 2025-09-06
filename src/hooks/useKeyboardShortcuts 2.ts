import { useHotkeys } from "react-hotkeys-hook";

interface KeyboardShortcutsConfig {
  onToggleRecording?: () => void;
  onToggleTranscription?: () => void;
  onClearTranscription?: () => void;
  onSaveSession?: () => void;
  onToggleFullscreen?: () => void;
  onShowHelp?: () => void;
  onExportData?: () => void;
  onQuickSearch?: () => void;
  onToggleSettings?: () => void;
}

export const useKeyboardShortcuts = (config: KeyboardShortcutsConfig) => {
  const {
    onToggleRecording,
    onToggleTranscription,
    onClearTranscription,
    onSaveSession,
    onToggleFullscreen,
    onShowHelp,
    onExportData,
    onQuickSearch,
    onToggleSettings,
  } = config;

  // Recording controls
  useHotkeys(
    "space",
    (e) => {
      e.preventDefault();
      onToggleRecording?.();
    },
    {
      enableOnFormTags: false,
      description: "Toggle recording (Space)",
    },
  );

  useHotkeys(
    "shift+space",
    (e) => {
      e.preventDefault();
      onToggleTranscription?.();
    },
    {
      enableOnFormTags: false,
      description: "Toggle transcription (Shift+Space)",
    },
  );

  // Session management
  useHotkeys(
    "ctrl+s",
    (e) => {
      e.preventDefault();
      onSaveSession?.();
    },
    {
      enableOnFormTags: true,
      description: "Save session (Ctrl+S)",
    },
  );

  useHotkeys(
    "ctrl+e",
    (e) => {
      e.preventDefault();
      onExportData?.();
    },
    {
      enableOnFormTags: false,
      description: "Export data (Ctrl+E)",
    },
  );

  useHotkeys(
    "ctrl+shift+c",
    (e) => {
      e.preventDefault();
      onClearTranscription?.();
    },
    {
      enableOnFormTags: false,
      description: "Clear transcription (Ctrl+Shift+C)",
    },
  );

  // UI controls
  useHotkeys(
    "f11",
    (e) => {
      e.preventDefault();
      onToggleFullscreen?.();
    },
    {
      enableOnFormTags: true,
      description: "Toggle fullscreen (F11)",
    },
  );

  useHotkeys(
    "ctrl+shift+h",
    (e) => {
      e.preventDefault();
      onShowHelp?.();
    },
    {
      enableOnFormTags: false,
      description: "Show help (Ctrl+Shift+H)",
    },
  );

  useHotkeys(
    "ctrl+k",
    (e) => {
      e.preventDefault();
      onQuickSearch?.();
    },
    {
      enableOnFormTags: false,
      description: "Quick search (Ctrl+K)",
    },
  );

  useHotkeys(
    "ctrl+comma",
    (e) => {
      e.preventDefault();
      onToggleSettings?.();
    },
    {
      enableOnFormTags: false,
      description: "Toggle settings (Ctrl+,)",
    },
  );

  // Return available shortcuts for display
  const shortcuts = [
    { key: "Space", description: "Toggle recording" },
    { key: "Shift+Space", description: "Toggle transcription" },
    { key: "Ctrl+S", description: "Save session" },
    { key: "Ctrl+E", description: "Export data" },
    { key: "Ctrl+Shift+C", description: "Clear transcription" },
    { key: "F11", description: "Toggle fullscreen" },
    { key: "Ctrl+Shift+H", description: "Show help" },
    { key: "Ctrl+K", description: "Quick search" },
    { key: "Ctrl+,", description: "Settings" },
  ];

  return { shortcuts };
};

export default useKeyboardShortcuts;
