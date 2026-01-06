"use client";

/**
 * ClientRoot - Bulletproof client-side root wrapper
 *
 * This component is designed to NEVER crash during webpack HMR.
 * It contains all provider logic inline to eliminate import chains
 * that can cause "Cannot read properties of undefined (reading 'call')" errors.
 *
 * DO NOT import other components here - keep everything inline.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  Component,
  type ReactNode,
  type ErrorInfo,
} from "react";

// ============================================================================
// ERROR BOUNDARY - Catches any rendering errors
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class RootErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ClientRoot] Error caught:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Still render children - app works without theming
      console.warn("[ClientRoot] Rendering without providers due to error");
      return this.props.children;
    }
    return this.props.children;
  }
}

// ============================================================================
// THEME CONTEXT - Inline to avoid import issues
// ============================================================================

type ThemeName = "light" | "mac" | "jarvis" | "aoma";

interface ThemeContextValue {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  isTransitioning: boolean;
  availableThemes: Array<{
    id: ThemeName;
    name: string;
    description: string;
  }>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const AVAILABLE_THEMES = [
  { id: "light" as ThemeName, name: "Light Mode", description: "Clean light theme" },
  { id: "mac" as ThemeName, name: "MAC Dark", description: "Professional dark theme (default)" },
  { id: "jarvis" as ThemeName, name: "JARVIS HUD", description: "Glassmorphic HUD interface" },
  { id: "aoma" as ThemeName, name: "AOMA", description: "Corporate theme" },
];

const THEME_STORAGE_KEY = "siam-theme-preference";
const THEME_TRANSITION_DURATION = 1500;

function InlineThemeProvider({
  children,
  defaultTheme = "mac",
}: {
  children: ReactNode;
  defaultTheme?: ThemeName;
}) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(defaultTheme);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const applyThemeToDOM = useCallback((theme: ThemeName, withTransition: boolean = true) => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const body = document.body;

    if (withTransition) {
      root.classList.add("theme-transitioning");
      setIsTransitioning(true);
    }

    root.setAttribute("data-theme", theme);

    if (theme === "light") {
      body.classList.remove("dark");
    } else {
      body.classList.add("dark");
    }

    // Load theme-specific CSS
    const existingStylesheets = document.querySelectorAll("link[data-theme-stylesheet]");
    existingStylesheets.forEach((sheet) => sheet.remove());

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

    if (withTransition) {
      setTimeout(() => {
        root.classList.remove("theme-transitioning");
        setIsTransitioning(false);
      }, THEME_TRANSITION_DURATION);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null;
        if (savedTheme && ["light", "mac", "jarvis", "aoma"].includes(savedTheme)) {
          setCurrentTheme(savedTheme);
          applyThemeToDOM(savedTheme, false);
        } else {
          applyThemeToDOM(defaultTheme, false);
        }
      } catch {
        applyThemeToDOM(defaultTheme, false);
      }
    }
  }, [defaultTheme, applyThemeToDOM]);

  const setTheme = useCallback(
    (theme: ThemeName) => {
      if (theme === currentTheme) return;

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch {
          // localStorage might be disabled
        }
      }

      setCurrentTheme(theme);
      applyThemeToDOM(theme, true);

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

// ============================================================================
// EXPORTED HOOK - For theme access
// ============================================================================

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return safe defaults if used outside provider
    return {
      currentTheme: "mac",
      setTheme: () => {},
      isTransitioning: false,
      availableThemes: AVAILABLE_THEMES,
    };
  }
  return context;
}

// ============================================================================
// MAIN EXPORT - ClientRoot
// ============================================================================

interface ClientRootProps {
  children: ReactNode;
}

export function ClientRoot({ children }: ClientRootProps) {
  // Guard against undefined children
  if (typeof children === "undefined") {
    console.error("[ClientRoot] Received undefined children");
    return null;
  }

  return (
    <RootErrorBoundary>
      <InlineThemeProvider defaultTheme="mac">{children}</InlineThemeProvider>
    </RootErrorBoundary>
  );
}

export default ClientRoot;
