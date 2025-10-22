import { useState, useEffect, useCallback } from "react";

export interface SiamSettings {
  // Theme and appearance
  theme: "light" | "dark" | "matrix" | "cyberpunk" | "minimal";
  colorScheme: "default" | "high-contrast" | "colorblind-friendly";
  fontSize: "small" | "medium" | "large";
  animationsEnabled: boolean;
  windowOpacity: number; // 0-100, for Electron window transparency

  // Audio settings
  audioDeviceId?: string;
  audioGain: number; // 0-100
  noiseReduction: boolean;
  audioVisualizationEnabled: boolean;

  // Recording settings
  autoStartRecording: boolean;
  maxRecordingDuration: number; // minutes, 0 = unlimited
  autoSaveTranscriptions: boolean;
  transcriptionLanguage: string;

  // UI Layout
  panelSizes: {
    left: number;
    middle: number;
    right: number;
  };
  showPerformanceStats: boolean;
  showStatusBar: boolean;
  compactMode: boolean;

  // Keyboard shortcuts
  shortcuts: {
    toggleRecording: string;
    toggleTranscription: string;
    clearTranscription: string;
    saveSession: string;
    toggleFullscreen: string;
    showHelp: string;
    exportData: string;
    quickSearch: string;
    toggleSettings: string;
  };

  // Data and privacy
  localStorageOnly: boolean;
  maxSessionHistory: number;
  autoDeleteOldSessions: boolean;
  sessionRetentionDays: number;
}

const defaultSettings: SiamSettings = {
  theme: "light",
  colorScheme: "default",
  fontSize: "medium",
  animationsEnabled: true,
  windowOpacity: 100,

  audioDeviceId: undefined,
  audioGain: 75,
  noiseReduction: true,
  audioVisualizationEnabled: true,

  autoStartRecording: false,
  maxRecordingDuration: 0,
  autoSaveTranscriptions: true,
  transcriptionLanguage: "en-US",

  panelSizes: {
    left: 25,
    middle: 50,
    right: 25,
  },
  showPerformanceStats: true,
  showStatusBar: true,
  compactMode: false,

  shortcuts: {
    toggleRecording: "Space",
    toggleTranscription: "Tab",
    clearTranscription: "Ctrl+L",
    saveSession: "Ctrl+S",
    toggleFullscreen: "F11",
    showHelp: "F1",
    exportData: "Ctrl+E",
    quickSearch: "Ctrl+F",
    toggleSettings: "Ctrl+,",
  },

  localStorageOnly: true,
  maxSessionHistory: 100,
  autoDeleteOldSessions: true,
  sessionRetentionDays: 30,
};

const SETTINGS_STORAGE_KEY = "siam-settings";

export function useSettings() {
  const [settings, setSettings] = useState<SiamSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window === "undefined") return; // Skip on server-side
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        // Merge with defaults to handle new settings that might not exist in stored data
        setSettings((prev) => ({ ...prev, ...parsedSettings }));
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError("Failed to load settings. Using defaults.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save settings to localStorage whenever they change
  const saveSettings = useCallback(
    (newSettings: Partial<SiamSettings>) => {
      try {
        const updatedSettings = { ...settings, ...newSettings };
        setSettings(updatedSettings);
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
        setError(null);
      } catch (err) {
        console.error("Failed to save settings:", err);
        setError("Failed to save settings.");
      }
    },
    [settings, isLoading]
  );

  // Reset to defaults
  const resetSettings = useCallback(() => {
    try {
      setSettings(defaultSettings);
      if (typeof window !== "undefined") {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaultSettings));
      }
      setError(null);
    } catch (err) {
      console.error("Failed to reset settings:", err);
      setError("Failed to reset settings.");
    }
  }, []);

  // Export settings as JSON
  const exportSettings = useCallback(() => {
    try {
      const settingsJson = JSON.stringify(settings, null, 2);
      const blob = new Blob([settingsJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `siam-settings-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export settings:", err);
      setError("Failed to export settings.");
    }
  }, [settings]);

  // Import settings from JSON
  const importSettings = useCallback(
    (file: File) => {
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const importedSettings = JSON.parse(content);
            // Validate the imported settings structure
            if (typeof importedSettings === "object" && importedSettings !== null) {
              const mergedSettings = {
                ...defaultSettings,
                ...importedSettings,
              };
              saveSettings(mergedSettings);
              resolve();
            } else {
              reject(new Error("Invalid settings file format"));
            }
          } catch (err) {
            reject(new Error("Failed to parse settings file"));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read settings file"));
        reader.readAsText(file);
      });
    },
    [saveSettings]
  );

  return {
    settings,
    isLoading,
    error,
    saveSettings,
    resetSettings,
    exportSettings,
    importSettings,
    defaultSettings,
  };
}
