/**
 * Enhanced JARVIS HUD Interface - Usage Example
 *
 * This example demonstrates how to integrate the enhanced HUD interface
 * into your application with full customization and accessibility support.
 */

import React, { useState, useEffect } from "react";
import { EnhancedHUDInterface } from "../src/components/ui/EnhancedHUDInterface";
import "../src/styles/jarvis-theme-variations.css";

export default function EnhancedHUDExample() {
  // Simulated live transcription
  const [transcription, setTranscription] = useState("Waiting for audio input...");

  // Simulated AI insights
  const [insights, setInsights] = useState<string[]>([
    "Meeting started at 2:30 PM",
    "3 participants detected",
    "Main topic: Project planning",
  ]);

  // Simulated audio level
  const [audioLevel, setAudioLevel] = useState(0);

  // Simulate real-time audio input
  useEffect(() => {
    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 0.8 + 0.1);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Simulate transcription updates
  useEffect(() => {
    const messages = [
      "Let's discuss the quarterly objectives...",
      "We need to prioritize the user experience improvements",
      "The deadline for the first milestone is next Friday",
      "Team feedback has been very positive so far",
      "Let's schedule a follow-up meeting for next week",
    ];

    let messageIndex = 0;
    const interval = setInterval(() => {
      setTranscription(messages[messageIndex]);
      messageIndex = (messageIndex + 1) % messages.length;

      // Update insights based on transcription
      setInsights((prev) => {
        const newInsight = `Keyword detected: ${messages[messageIndex].split(" ")[0]}`;
        return [...prev.slice(-2), newInsight];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Handle audio source changes
  const handleAudioSourceChange = (sourceId: string) => {
    console.log("Audio source changed to:", sourceId);

    // In a real application, you would:
    // 1. Update the Web Audio API or Electron audio settings
    // 2. Reconnect to the new audio source
    // 3. Update the transcription service

    // Example Electron integration:
    if (typeof window !== "undefined" && "electronAPI" in window) {
      // @ts-ignore
      window.electronAPI.setAudioSource(sourceId).then(() => {
        console.log("Audio source updated in Electron");
      });
    }
  };

  return (
    <div className="w-full h-screen">
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Main HUD Interface */}
      <main id="main-content">
        <EnhancedHUDInterface
          transcription={transcription}
          insights={insights}
          audioLevel={audioLevel}
          onAudioSourceChange={handleAudioSourceChange}
        />
      </main>
    </div>
  );
}

/**
 * KEYBOARD SHORTCUTS QUICK REFERENCE
 *
 * Panel Management:
 * - Ctrl+1-9: Toggle specific panels
 * - Ctrl+Shift+R: Reset all panels
 * - Ctrl+Shift+M: Minimize all panels
 *
 * Navigation:
 * - Tab: Focus next panel
 * - Shift+Tab: Focus previous panel
 * - Ctrl+Tab: Cycle through panels
 *
 * Customization:
 * - Ctrl+Shift+C: Open customization
 * - Ctrl+Shift+T: Cycle themes
 * - Ctrl+↑/↓: Adjust blur
 * - Ctrl+←/→: Adjust opacity
 *
 * Audio:
 * - Ctrl+Shift+A: Open audio selector
 * - Alt+↑/↓: Select audio source
 *
 * Help:
 * - F1: Open help overlay
 * - Ctrl+Shift+H: Open help overlay
 *
 * General:
 * - F11: Toggle fullscreen
 * - F5: Refresh HUD
 */

/**
 * ACCESSIBILITY FEATURES
 *
 * 1. Keyboard Navigation
 *    - All features accessible via keyboard
 *    - Logical tab order
 *    - Focus indicators visible
 *
 * 2. Screen Reader Support
 *    - ARIA labels on all interactive elements
 *    - Live regions for dynamic content
 *    - Semantic HTML structure
 *
 * 3. Visual Accessibility
 *    - High contrast mode available
 *    - Adjustable opacity and blur
 *    - Respects prefers-reduced-motion
 *
 * 4. Customization
 *    - Multiple theme options
 *    - Adjustable animation speeds
 *    - Customizable visual effects
 */

/**
 * INTEGRATION WITH WEB AUDIO API
 *
 * Example of connecting to Web Audio API for real audio level monitoring:
 */
export function useWebAudioLevel() {
  const [audioLevel, setAudioLevel] = useState(0);
  const [_audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    // Create audio context
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioContext(context);

    // Get user media
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;

        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
          requestAnimationFrame(updateLevel);
        };

        updateLevel();
      })
      .catch((err) => {
        console.error("Error accessing microphone:", err);
      });

    return () => {
      if (context) {
        context.close();
      }
    };
  }, []);

  return audioLevel;
}

/**
 * INTEGRATION WITH ELECTRON
 *
 * Example Electron main process code for global shortcuts:
 */

/*
// In Electron main.js

const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Register global shortcuts
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  globalShortcut.register('CommandOrControl+Shift+H', () => {
    mainWindow.minimize();
  });

  mainWindow.loadURL('http://localhost:3000');
});

// Handle audio source changes
ipcMain.handle('set-audio-source', async (event, sourceId) => {
  // Set system audio source
  console.log('Setting audio source to:', sourceId);
  return { success: true };
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
*/

/**
 * PRELOAD SCRIPT FOR ELECTRON
 */

/*
// In Electron preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setAudioSource: (sourceId) => ipcRenderer.invoke('set-audio-source', sourceId),
  setWindowFocus: () => ipcRenderer.invoke('set-window-focus'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
});
*/

/**
 * TESTING THE ENHANCED HUD
 *
 * 1. Visual Testing:
 *    - Open in browser at http://localhost:3000
 *    - Test all keyboard shortcuts
 *    - Try different themes and settings
 *    - Verify panel dragging works
 *
 * 2. Accessibility Testing:
 *    - Use screen reader (NVDA/JAWS)
 *    - Navigate with keyboard only
 *    - Check focus indicators
 *    - Test with high contrast mode
 *
 * 3. Performance Testing:
 *    - Monitor CPU usage
 *    - Check animation smoothness
 *    - Test with multiple panels
 *    - Verify no memory leaks
 *
 * 4. Electron Testing:
 *    - Build Electron app
 *    - Test global shortcuts
 *    - Verify window management
 *    - Test audio device detection
 */
