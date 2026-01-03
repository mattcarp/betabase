/**
 * Client-safe auth service that doesn't import AWS SDK.
 * Use this in client components instead of cognitoAuth.
 * For server-side AWS SDK operations, use cognitoAuth.ts directly in API routes.
 */

import { debugLog, debugError } from "../utils/logger";

export interface CognitoUser {
  username: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  idToken: string;
}

class CognitoAuthClientService {
  private static instance: CognitoAuthClientService;
  private currentUser: CognitoUser | null = null;

  private constructor() {}

  static getInstance(): CognitoAuthClientService {
    if (!CognitoAuthClientService.instance) {
      CognitoAuthClientService.instance = new CognitoAuthClientService();
    }
    return CognitoAuthClientService.instance;
  }

  /**
   * Send magic link - calls API route which handles AWS SDK
   */
  async sendMagicLink(email: string): Promise<boolean> {
    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "send" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send magic link");
      }

      debugLog(`[AUTH] Magic link sent to ${email}`);
      return true;
    } catch (error) {
      debugError("Send magic link error:", error);
      throw error;
    }
  }

  /**
   * Verify magic link - calls API route which handles AWS SDK
   */
  async verifyMagicLink(email: string, code: string): Promise<CognitoUser> {
    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, action: "verify" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Verification failed");
      }

      const { user } = await response.json();
      this.currentUser = user;
      return user;
    } catch (error) {
      debugError("Verify magic link error:", error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      this.currentUser = null;
      debugLog("[AUTH] User signed out");
    } catch (error) {
      debugError("Sign out error:", error);
      this.currentUser = null;
    }
  }

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<CognitoUser | null> {
    if (!this.currentUser) {
      try {
        const response = await fetch("/api/auth/status");
        if (response.ok) {
          const { isAuthenticated, user } = await response.json();
          if (isAuthenticated && user) {
            this.currentUser = {
              username: user.username,
              email: user.email,
              accessToken: "",
              refreshToken: "",
              idToken: "",
            };
          }
        }
      } catch (e) {
        debugError("Failed to get auth status:", e);
      }
    }
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<void> {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      debugLog("[AUTH] Token refreshed successfully");
    } catch (error) {
      debugError("Token refresh error:", error);
      this.currentUser = null;
      throw error;
    }
  }
}

export const cognitoAuthClient = CognitoAuthClientService.getInstance();
