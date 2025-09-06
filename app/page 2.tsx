"use client";

import React, { useState, useEffect } from "react";
import { cn } from "../src/lib/utils";
import { SettingsPanel } from "../src/components/SettingsPanel";
import { useSettings } from "../src/hooks/useSettings";
// Use MagicLinkLoginForm for authentication (MAGIC LINKS ONLY - NO PASSWORDS)
import { MagicLinkLoginForm as LoginForm } from "../src/components/auth/MagicLinkLoginForm";
import { getBuildInfo, getFormattedBuildTime } from "../src/utils/buildInfo";
import "../src/styles/motiff-glassmorphism.css";
import "../src/styles/mac-design-system.css";
import { debugLog, debugError } from "../src/utils/logger";
import { cognitoAuth } from "../src/services/cognitoAuth";
import { Toaster } from "../src/components/ui/sonner";

// YOLO ARCHITECTURE FIX: Migrated from src/App.tsx to proper App Router!
const ChatPage = React.lazy(
  () => import("../src/components/ui/pages/ChatPage"),
);

export default function Home() {
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  // Always start with false to match server/client
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { settings, isLoading: settingsLoading } = useSettings();

  // Build-time version info
  const buildInfo = getBuildInfo();

  // Startup console log with version info
  useEffect(() => {
    const formattedBuildTime = getFormattedBuildTime(buildInfo.buildTime);
    console.log(
      `🚀 SIAM version ${buildInfo.versionString} - Built ${formattedBuildTime}\nBut seriously, `,
    );
  }, [buildInfo.versionString, buildInfo.buildTime]);

  // Check for secure cookie-based authentication on mount
  useEffect(() => {
    const checkSecureAuth = async () => {
      // Check if authentication bypass is enabled
      const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";
      debugLog(
        "[ENV DEBUG] NEXT_PUBLIC_BYPASS_AUTH:",
        process.env.NEXT_PUBLIC_BYPASS_AUTH,
        "bypassAuth:",
        bypassAuth,
      );

      if (bypassAuth) {
        debugLog(
          "[BYPASS AUTH] Authentication bypassed via environment variable",
        );
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
        return;
      }

      debugLog("[SECURE AUTH] Checking authentication via secure cookies...");

      // Set a timeout to ensure we don't get stuck
      const timeout = setTimeout(() => {
        debugLog("[SECURE AUTH] Auth check timeout - proceeding without auth");
        setIsCheckingAuth(false);
      }, 5000); // 5 second timeout for API call

      try {
        setIsCheckingAuth(true);

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
    if (settingsLoading) return;

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

  return (
    <>
      <div
        className={cn("h-screen w-screen text-white font-sans")}
        data-testid="app-container"
      >
        {/* Main Content - Full Screen Chat Interface */}
        <main className="h-screen w-screen">
          <React.Suspense
            fallback={
              <div className="h-full w-screen flex items-center justify-center">
                <div className="text-white">Loading...</div>
              </div>
            }
          >
            <ChatPage onLogout={handleLogout} />
          </React.Suspense>
        </main>

        {/* Settings Panel */}
        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setSettingsOpen(false)}
          onLogout={handleLogout}
        />
      </div>

      <Toaster />
    </>
  );
}
