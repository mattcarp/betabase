import { useEffect, useCallback } from "react";
import useNotifications from "./useNotifications";

// Electron IPC for global shortcuts and window management
declare global {
  interface Window {
    electronAPI: {
      registerGlobalShortcut: (accelerator: string, id: string) => Promise<boolean>;
      unregisterGlobalShortcut: (accelerator: string) => Promise<boolean>;
      unregisterAllGlobalShortcuts: () => Promise<boolean>;
      setWindowFocus: () => Promise<void>;
      minimizeWindow: () => Promise<void>;
    };
  }
}

// Check if we're running in Electron
const isElectronAvailable = typeof window !== "undefined" && "electronAPI" in window;

export interface ShortcutConfig {
  key: string;
  webKey?: string; // Alternative key combination for web mode
  description: string;
  action: () => void | Promise<void>;
  enabled?: boolean;
}

interface UseGlobalShortcutsProps {
  onStartRecording?: () => void | Promise<void>;
  onStopRecording?: () => void | Promise<void>;
  onToggleRecording?: () => void | Promise<void>;
  onShowApp?: () => void | Promise<void>;
  onHideApp?: () => void | Promise<void>;
  onInitializePanels?: () => void;
  onMinimizeAllPanels?: () => void;
  onRestoreAllPanels?: () => void;
  isRecording?: boolean;
}

export const useGlobalShortcuts = ({
  onStartRecording,
  onStopRecording,
  onToggleRecording,
  onShowApp,
  onHideApp,
  onInitializePanels,
  onMinimizeAllPanels,
  onRestoreAllPanels,
  isRecording = false,
}: UseGlobalShortcutsProps = {}) => {
  const { success, error } = useNotifications();

  // Check if we're in Electron environment
  const isElectron = isElectronAvailable;

  // Default shortcuts configuration
  const defaultShortcuts: ShortcutConfig[] = [
    {
      key: "CommandOrControl+Shift+R",
      webKey: "Alt+KeyR", // Alternative for web
      description: "Start/Stop Recording",
      action:
        onToggleRecording ||
        (async () => {
          if (isRecording && onStopRecording) {
            await onStopRecording();
          } else if (!isRecording && onStartRecording) {
            await onStartRecording();
          }
        }),
      enabled: true,
    },
    {
      key: "CommandOrControl+Shift+S",
      webKey: "Alt+KeyS",
      description: "Show SIAM App",
      action:
        onShowApp ||
        (async () => {
          if (isElectron) {
            await window.electronAPI.setWindowFocus().catch(console.error);
          } else {
            // Web fallback: focus window
            window.focus();
          }
        }),
      enabled: true,
    },
    {
      key: "CommandOrControl+Shift+H",
      webKey: "Alt+KeyH",
      description: "Hide SIAM App",
      action:
        onHideApp ||
        (async () => {
          if (isElectron) {
            await window.electronAPI.minimizeWindow().catch(console.error);
          } else {
            // Web fallback: no action (can't minimize web page)
            console.log("Hide app shortcut triggered (web mode)");
          }
        }),
      enabled: true,
    },
    {
      key: "CommandOrControl+Shift+I",
      webKey: "Alt+KeyI",
      description: "Initialize Panels",
      action:
        onInitializePanels ||
        (() => {
          console.log("Initialize panels shortcut triggered");
        }),
      enabled: true,
    },
    {
      key: "CommandOrControl+Shift+M",
      webKey: "Alt+KeyM",
      description: "Minimize All Panels",
      action:
        onMinimizeAllPanels ||
        (() => {
          console.log("Minimize all panels shortcut triggered");
        }),
      enabled: true,
    },
    {
      key: "CommandOrControl+Shift+X",
      webKey: "Alt+KeyX",
      description: "Restore All Panels",
      action:
        onRestoreAllPanels ||
        (() => {
          console.log("Restore all panels shortcut triggered");
        }),
      enabled: true,
    },
  ];

  // Web keyboard event handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isElectron) {
        // Only handle shortcuts in web mode
        const isAlt = event.altKey;
        const isCtrl = event.ctrlKey || event.metaKey;

        for (const shortcut of defaultShortcuts) {
          if (!shortcut.enabled) continue;

          let shouldTrigger = false;

          // Check web key pattern (Alt + key)
          if (shortcut.webKey && isAlt && !isCtrl) {
            const keyCode = shortcut.webKey.split("+")[1];
            if (event.code === keyCode) {
              shouldTrigger = true;
            }
          }

          if (shouldTrigger) {
            event.preventDefault();
            console.log(`Web shortcut triggered: ${shortcut.webKey} - ${shortcut.description}`);

            try {
              const result = shortcut.action();
              if (result instanceof Promise) {
                result.catch((actionErr) => {
                  console.error(`Async error executing shortcut ${shortcut.key}:`, actionErr);
                  error(`Failed to execute: ${shortcut.description}`);
                });
              }
              success(`Executed: ${shortcut.description}`);
            } catch (err) {
              console.error(`Error executing shortcut ${shortcut.key}:`, err);
              error(`Failed to execute: ${shortcut.description}`);
            }

            break;
          }
        }
      }
    },
    [defaultShortcuts, success, error, isElectron]
  );

  // Register a single Electron shortcut with improved error handling
  const registerElectronShortcut = useCallback(
    async (shortcut: ShortcutConfig) => {
      if (!isElectron) {
        return false;
      }

      try {
        // Register with Electron
        const success = await window.electronAPI.registerGlobalShortcut(
          shortcut.key,
          `shortcut-${shortcut.key}`
        );

        if (success) {
          // Handle shortcut activation via a global event listener (would be set up in main process)
          console.log(`✅ Registered global shortcut: ${shortcut.key} - ${shortcut.description}`);
          return true;
        } else {
          throw new Error("Registration failed");
        }

        console.log(`✅ Registered global shortcut: ${shortcut.key} - ${shortcut.description}`);
        return true;
      } catch (err) {
        console.error(`❌ Failed to register shortcut ${shortcut.key}:`, err);
        console.warn(`Shortcut registration failed: ${shortcut.key}`);
        return false;
      }
    },
    [success, error, isElectron]
  );

  // Unregister a single Electron shortcut
  const unregisterElectronShortcut = useCallback(
    async (key: string) => {
      if (!isElectron) {
        return;
      }

      try {
        await window.electronAPI.unregisterGlobalShortcut(key);
        console.log(`✅ Unregistered global shortcut: ${key}`);
      } catch (err) {
        console.error(`❌ Failed to unregister shortcut ${key}:`, err);
      }
    },
    [isElectron]
  );

  // Register all shortcuts
  const registerAllShortcuts = useCallback(async () => {
    if (isElectron) {
      console.log("🔧 Registering global shortcuts...");

      for (const shortcut of defaultShortcuts) {
        if (shortcut.enabled) {
          await registerElectronShortcut(shortcut);
        }
      }
    } else {
      console.log("🔧 Setting up web keyboard shortcuts...");
      // Web shortcuts are handled via event listeners, not registration
      success("Keyboard shortcuts ready (web mode)");
    }
  }, [registerElectronShortcut, defaultShortcuts, success, isElectron]);

  // Unregister all shortcuts
  const unregisterAllShortcuts = useCallback(async () => {
    if (isElectron) {
      console.log("🧹 Unregistering global shortcuts...");

      try {
        await window.electronAPI.unregisterAllGlobalShortcuts();
        console.log("✅ All shortcuts unregistered");
      } catch (err) {
        console.error("❌ Failed to unregister shortcuts:", err);
      }
    } else {
      console.log("🧹 Removing web keyboard shortcuts...");
    }
  }, [isElectron]);

  // Get shortcut status
  const getShortcutStatus = useCallback(async () => {
    const status: Record<string, boolean> = {};

    // For both Electron and web mode, shortcuts are considered "available" if enabled
    for (const shortcut of defaultShortcuts) {
      status[shortcut.key] = shortcut.enabled || false;
    }

    return status;
  }, [defaultShortcuts]);

  // Setup shortcuts when dependencies change
  useEffect(() => {
    registerAllShortcuts();

    // Add web keyboard event listeners
    if (!isElectron) {
      document.addEventListener("keydown", handleKeyDown);
    }

    // Cleanup on unmount
    return () => {
      unregisterAllShortcuts();
      if (!isElectron) {
        document.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, []); // Remove dependencies to prevent infinite loop

  return {
    shortcuts: defaultShortcuts,
    isElectronMode: isElectron,
    registerShortcut: registerElectronShortcut,
    unregisterShortcut: unregisterElectronShortcut,
    registerAllShortcuts,
    unregisterAllShortcuts,
    getShortcutStatus,
  };
};

export default useGlobalShortcuts;
