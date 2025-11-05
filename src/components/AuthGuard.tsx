"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cognitoAuth } from "../services/cognitoAuth";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDevelopment, setIsDevelopment] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // SECURITY: Allow bypass on localhost for development only
        const isLocalhost = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        
        setIsDevelopment(isLocalhost);
        
        if (isLocalhost) {
          console.log("[AuthGuard] Development mode - bypassing auth check");
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
        
        // PRODUCTION: Strict authentication required
        console.log("[AuthGuard] Production mode - enforcing authentication");
        const isAuth = await cognitoAuth.isAuthenticated();
        
        if (!isAuth) {
          // Not authenticated - redirect to login
          console.warn("[AuthGuard] Unauthorized access attempt, redirecting to login");
          window.location.href = "/emergency-login.html";
          return;
        }
        
        setIsAuthenticated(true);
      } catch (error) {
        console.error("[AuthGuard] Authentication check failed:", error);
        window.location.href = "/emergency-login.html";
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">
          <div className="text-2xl mb-2">🔒 Verifying authentication...</div>
          <div className="text-gray-400">Please wait</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">
          <div className="text-2xl mb-2">🚫 Unauthorized</div>
          <div className="text-gray-400">Redirecting to login...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

