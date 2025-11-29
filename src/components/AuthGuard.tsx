"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cognitoAuth } from "../services/cognitoAuth";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const isDev = process.env.NODE_ENV === "development";
  const isBypass = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(isDev || isBypass);
  const [isLoading, setIsLoading] = useState(!isDev && !isBypass);
  const [isDevelopment, setIsDevelopment] = useState(isDev);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      // If already authenticated (e.g. via NODE_ENV check), skip
      if (isAuthenticated) return;

      // IMMEDIATE BYPASS for localhost or explicit bypass
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'undefined';
      const bypassEnv = process.env.NEXT_PUBLIC_BYPASS_AUTH;
      console.log(`[AuthGuard] Checking bypass. Hostname: ${hostname}, Env: ${bypassEnv}`);

      if (
        (typeof window !== 'undefined' && (hostname === 'localhost' || hostname === '127.0.0.1')) ||
        bypassEnv === 'true'
      ) {
        console.log("[AuthGuard] Auth bypass detected (Localhost or Env Var) - bypassing auth immediately");
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      try {
        // PRODUCTION: Strict authentication required
        console.log("[AuthGuard] Production mode - enforcing authentication");
        const isAuth = await cognitoAuth.isAuthenticated();
        
        if (!isAuth) {
          // Not authenticated - redirect to login
          console.warn("[AuthGuard] Unauthorized access attempt, redirecting to login");
          router.push("/login");
          return;
        }
        
        setIsAuthenticated(true);
      } catch (error) {
        console.error("[AuthGuard] Authentication check failed:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--mac-surface-bg)] flex items-center justify-center">
        <div className="text-[var(--mac-text-primary)]">
          <div className="text-2xl mb-2">🔒 Verifying authentication...</div>
          <div className="text-[var(--mac-text-secondary)]">Please wait</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--mac-surface-bg)] flex items-center justify-center">
        <div className="text-[var(--mac-text-primary)]">
          <div className="text-2xl mb-2">🚫 Unauthorized</div>
          <div className="text-[var(--mac-text-secondary)]">Redirecting to login...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

