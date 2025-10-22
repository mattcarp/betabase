"use client";

import React, { useState, useEffect } from "react";
import { cn } from "../src/lib/utils";
import dynamic from "next/dynamic";
import { useSettings } from "../src/hooks/useSettings";

// Dynamic import for SettingsPanel (863 lines, only shown when settings open)
const SettingsPanel = dynamic(
  () => import("../src/components/SettingsPanel").then(mod => ({ default: mod.SettingsPanel })),
  {
    loading: () => <div className="fixed inset-0 z-50 bg-black/50" />,
    ssr: false,
  }
);
// Use MagicLinkLoginForm for authentication (MAGIC LINKS ONLY - NO PASSWORDS)
import { MagicLinkLoginForm as LoginForm } from "../src/components/auth/MagicLinkLoginForm";
import { getBuildInfo, getFormattedBuildTime } from "../src/utils/buildInfo";
import { debugLog, debugError } from "../src/utils/logger";
import { cognitoAuth } from "../src/services/cognitoAuth";
// import { Toaster } from "../src/components/ui/sonner";

// YOLO ARCHITECTURE FIX: Migrated from src/App.tsx to proper App Router!
const ChatPage = React.lazy(
  () => import("../src/components/ui/pages/ChatPage").catch((error) => {
    console.error("Failed to load ChatPage:", error);
    // Return a fallback component
    return {
      default: () => (
        <div className="h-full w-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">Failed to load chat interface</p>
            <p className="text-white mb-4">Error: {error.message}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      ),
    };
  }),
);

export default function Home() {
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  // Always start with false to match server/client
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { settings, isLoading: settingsLoading } = useSettings();

  // Build-time version info
  const buildInfo = getBuildInfo();

  // Startup console log with version info
  useEffect(() => {
    setIsMounted(true);
    if (buildInfo?.buildTime && buildInfo?.versionString) {
      const formattedBuildTime = getFormattedBuildTime(buildInfo.buildTime);
      console.log(
        `🚀 SIAM version ${buildInfo.versionString} - Built ${formattedBuildTime}\nBut seriously, `,
      );
    }
  }, [buildInfo?.versionString, buildInfo?.buildTime]);

  // Check for secure cookie-based authentication on mount
  useEffect(() => {
    // IMMEDIATE auth bypass for development
    if (process.env.NEXT_PUBLIC_BYPASS_AUTH === "true") {
      console.log("[BYPASS AUTH] Authentication bypassed - dev mode");
      setIsAuthenticated(true);
      setIsCheckingAuth(false);
      return;
    }

    const checkSecureAuth = async () => {
      debugLog("[SECURE AUTH] Checking authentication via secure cookies...");

      // Set a timeout to ensure we don't get stuck
      const timeout = setTimeout(() => {
        debugLog("[SECURE AUTH] Auth check timeout - proceeding without auth");
        setIsCheckingAuth(false);
      }, 2000); // 2 second timeout

      try {
        // Check if user is authenticated via secure httpOnly cookies
        const isAuth = await cognitoAuth.isAuthenticated();

        if (isAuth) {
          setIsAuthenticated(true);
          debugLog("[SECURE AUTH] Authentication verified via secure cookies");
        } else {
          debugLog("[SECURE AUTH] No valid authentication found");
        }
      } catch (error) {
        debugError("[SECURE AUTH] Error checking authentication:", error);
      } finally {
        clearTimeout(timeout);
        debugLog("[SECURE AUTH] Auth check complete");
        setIsCheckingAuth(false);
      }
    };

    debugLog("[SECURE AUTH] Starting secure authentication check...");
    checkSecureAuth();
  }, []);

  // Apply settings-based theming
  useEffect(() => {
    if (settingsLoading || !settings) return;

    document.documentElement.setAttribute("data-theme", settings.theme);
    document.documentElement.setAttribute(
      "data-color-scheme",
      settings.colorScheme,
    );
    document.documentElement.setAttribute("data-font-size", settings.fontSize);

    if (!settings.animationsEnabled) {
      document.documentElement.style.setProperty("--animation-duration", "0s");
      document.documentElement.style.setProperty("--transition-duration", "0s");
    } else {
      document.documentElement.style.removeProperty("--animation-duration");
      document.documentElement.style.removeProperty("--transition-duration");
    }
  }, [settings, settingsLoading]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // Secure logout using httpOnly cookies
  const handleLogout = async () => {
    try {
      await cognitoAuth.signOut();
      setIsAuthenticated(false);
    } catch (error) {
      debugError("Logout error:", error);
      // Still set as unauthenticated on error
      setIsAuthenticated(false);
    }
  };

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // FIONA P0 FIX: Show magic link login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // Wrap with ThemeProvider only after mount to avoid hydration issues
  const content = (
    <div
      className={cn("h-screen w-screen text-white font-sans")}
      data-testid="app-container"
    >
      {/* Main Content - Full Screen Chat Interface */}
      <main className="h-screen w-screen">
        <React.Suspense
          fallback={
            <div className="h-full w-screen flex items-center justify-center">
              <div className="text-white">Loading SIAM Interface...</div>
            </div>
          }
        >
          {loadError ? (
            <div className="h-full w-screen flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-500 mb-4">Failed to load application</p>
                <p className="text-white mb-4">{loadError}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Reload
                </button>
              </div>
            </div>
          ) : (
            <ChatPage onLogout={handleLogout} />
          )}
        </React.Suspense>
      </main>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        onLogout={handleLogout}
      />
    </div>
  );

  return (
    <>
      {content}
      {/* <Toaster /> */}
    </>
  );
}
