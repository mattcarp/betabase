"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

/**
 * Available theme options
 */
export type ThemeName = "light" | "mac" | "jarvis" | "aoma";

/**
 * Theme context value interface
 */
interface ThemeContextValue {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  isTransitioning: boolean;
  availableThemes: Array<{
    id: ThemeName;
    name: string;
    description: string;
    preview?: string;
  }>;
}

/**
 * Theme context
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Available themes configuration
 */
const AVAILABLE_THEMES = [
  {
    id: "light" as ThemeName,
    name: "Light Mode",
    description: "Clean light theme for daytime use",
    preview: "/themes/previews/light/preview.png",
  },
  {
    id: "mac" as ThemeName,
    name: "MAC Dark",
    description: "Professional dark theme with teal accents (default)",
    preview: "/themes/previews/mac/preview.png",
  },
  {
    id: "jarvis" as ThemeName,
    name: "JARVIS HUD",
    description: "Glassmorphic HUD-style interface with cyan accents",
    preview: "/themes/previews/jarvis/preview.png",
  },
  {
    id: "aoma" as ThemeName,
    name: "AOMA",
    description: "Corporate theme inspired by Sony Music's AOMA3 interface",
    preview: "/themes/previews/aoma/preview.png",
  },
];

/**
 * Local storage key for theme persistence
 */
const THEME_STORAGE_KEY = "siam-theme-preference";

/**
 * Theme transition duration in milliseconds (2 seconds max as per requirements)
 */
const THEME_TRANSITION_DURATION = 1500;

/**
 * Theme Provider Props
 */
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
}

/**
 * Theme Provider Component
 * Manages theme state and applies theme changes with smooth transitions
 */
export function ThemeProvider({ children, defaultTheme = "mac" }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(defaultTheme);
  const [isTransitioning, setIsTransitioning] = useState(false);

  /**
   * Load theme preference from localStorage on mount
   */
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null;
      if (savedTheme && ["light", "mac", "jarvis", "aoma"].includes(savedTheme)) {
        setCurrentTheme(savedTheme);
        applyThemeToDOM(savedTheme, false);
      } else {
        applyThemeToDOM(defaultTheme, false);
      }
    }
  }, [defaultTheme]);

  /**
   * Apply theme to DOM with optional transition
   */
  const applyThemeToDOM = useCallback((theme: ThemeName, withTransition: boolean = true) => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const body = document.body;

    // Add transition class if requested
    if (withTransition) {
      root.classList.add("theme-transitioning");
      setIsTransitioning(true);
    }

    // Set theme data attribute
    root.setAttribute("data-theme", theme);

    // Toggle dark class on body for light/dark mode
    if (theme === "light") {
      body.classList.remove("dark");
    } else {
      body.classList.add("dark");
    }

    // Load theme-specific CSS if needed
    loadThemeStylesheet(theme);

    // Remove transition class after animation completes
    if (withTransition) {
      setTimeout(() => {
        root.classList.remove("theme-transitioning");
        setIsTransitioning(false);
      }, THEME_TRANSITION_DURATION);
    }
  }, []);

  /**
   * Load theme-specific stylesheet dynamically
   */
  const loadThemeStylesheet = useCallback((theme: ThemeName) => {
    // Remove existing theme stylesheets
    const existingStylesheets = document.querySelectorAll("link[data-theme-stylesheet]");
    existingStylesheets.forEach((sheet) => sheet.remove());

    // Only load additional stylesheet for non-default themes
    if (theme === "jarvis") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/styles/jarvis-theme.css";
      link.setAttribute("data-theme-stylesheet", "jarvis");
      document.head.appendChild(link);
    } else if (theme === "aoma") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/styles/themes/aoma-theme.css";
      link.setAttribute("data-theme-stylesheet", "aoma");
      document.head.appendChild(link);
    }
  }, []);

  /**
   * Change theme with transition animation
   */
  const setTheme = useCallback(
    (theme: ThemeName) => {
      if (theme === currentTheme) return;

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      }

      // Apply theme with transition
      setCurrentTheme(theme);
      applyThemeToDOM(theme, true);

      // Emit custom event for theme change (for ElevenLabs integration)
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("theme-changed", {
            detail: { theme, previousTheme: currentTheme },
          })
        );
      }
    },
    [currentTheme, applyThemeToDOM]
  );

  const value: ThemeContextValue = {
    currentTheme,
    setTheme,
    isTransitioning,
    availableThemes: AVAILABLE_THEMES,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to use theme context
 * @throws Error if used outside ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Hook to listen for voice-controlled theme changes
 * Usage: useVoiceThemeControl((theme) => setTheme(theme))
 */
export function useVoiceThemeControl(onThemeChange: (theme: ThemeName) => void): void {
  useEffect(() => {
    const handleVoiceThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ theme: ThemeName }>;
      if (customEvent.detail?.theme) {
        onThemeChange(customEvent.detail.theme);
      }
    };

    window.addEventListener("voice-theme-change", handleVoiceThemeChange);

    return () => {
      window.removeEventListener("voice-theme-change", handleVoiceThemeChange);
    };
  }, [onThemeChange]);
}
