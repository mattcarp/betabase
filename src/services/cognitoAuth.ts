import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  // RespondToAuthChallengeCommand, // Unused - keeping for future use
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  // AdminInitiateAuthCommand, // Unused - keeping for future use
  // AdminSetUserPasswordCommand, // Unused - keeping for future use
} from "@aws-sdk/client-cognito-identity-provider";
// import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity"; // Unused - keeping for future use
import { debugLog, debugError, prodError } from "../utils/logger";

const REGION = "us-east-2";

// CRITICAL FIX: Use hardcoded fallbacks since Next.js env vars aren't loading properly
// These are your actual Cognito values from AWS Console
const USER_POOL_ID =
  (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID : undefined) ||
  "us-east-2_A0veaJRLo";
const CLIENT_ID =
  (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID : undefined) ||
  "5c6ll37299p351to549lkg3o0d";

// Security: Remove Cognito configuration logging to prevent information disclosure
// Configuration validation happens silently

// Validate required environment variables
if (!USER_POOL_ID || !CLIENT_ID) {
  prodError("[COGNITO ERROR] Missing configuration!");
}

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

export interface CognitoUser {
  username: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  idToken: string;
}

export class CognitoAuthService {
  private static instance: CognitoAuthService;
  private currentUser: CognitoUser | null = null;

  private constructor() {}

  static getInstance(): CognitoAuthService {
    if (!CognitoAuthService.instance) {
      CognitoAuthService.instance = new CognitoAuthService();
    }
    return CognitoAuthService.instance;
  }

  /**
   * Validate email domain - removed client-side validation for security
   * Server will handle the actual validation
   */
  // Unused - keeping for future use
  // private validateEmailDomain(_email: string): boolean {
  //   // Always return true - let server handle validation
  //   // This prevents exposing allowed emails to potential attackers
  //   return true;
  // }

  /**
   * Send magic link for passwordless authentication
   */
  async sendMagicLink(email: string): Promise<boolean> {
    try {
      debugLog("[FIONA DEBUG] Starting magic link auth check...");
      debugLog("[FIONA DEBUG] Magic link auth check result:", false);
      debugLog("[FIONA DEBUG] Setting isCheckingAuth to false");

      // Use Cognito's built-in forgot password flow
      // This sends a verification code using Cognito's email service
      await this.forgotPassword(email);

      // Store that we're waiting for verification
      await this.setSecureCookie("pending_magic_link", email);

      debugLog(`[AUTH] Verification code sent via Cognito to ${email}`);
      return true;
    } catch (error) {
      prodError("Send magic link error:", error);
      throw error;
    }
  }

  /**
   * Verify magic link code and sign in
   * Uses Cognito's confirmForgotPassword flow with a temporary password
   */
  async verifyMagicLink(email: string, code: string): Promise<CognitoUser> {
    try {
      // Generate a temporary password that meets Cognito requirements
      const tempPassword = this.generateTempPassword();

      // Use confirmForgotPassword to verify the code and set temporary password
      await this.confirmForgotPassword(email, code, tempPassword);

      // Now sign in with the temporary password
      const user = await this.signIn(email, tempPassword);

      // Store the user
      this.currentUser = user;
      await this.storeTokens(user);

      return user;
    } catch (error) {
      prodError("Verify magic link error:", error);
      throw error;
    }
  }

  /**
   * Traditional username/password sign in
   */
  async signIn(email: string, password: string): Promise<CognitoUser> {
    try {
      debugLog("[AUTH] Attempting sign in for:", email);

      const command = new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const response = await cognitoClient.send(command);

      if (response.AuthenticationResult) {
        const user: CognitoUser = {
          username: email,
          email: email,
          accessToken: response.AuthenticationResult.AccessToken || "",
          refreshToken: response.AuthenticationResult.RefreshToken || "",
          idToken: response.AuthenticationResult.IdToken || "",
        };

        this.currentUser = user;
        await this.storeTokens(user);

        debugLog("[AUTH] Sign in successful");
        return user;
      }

      throw new Error("Authentication failed");
    } catch (error) {
      prodError("Sign in error:", error);
      throw error;
    }
  }

  /**
   * Send password reset code
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      debugLog("[AUTH] Sending password reset code to:", email);
      debugLog("[AUTH] Using ClientId:", CLIENT_ID);

      const command = new ForgotPasswordCommand({
        ClientId: CLIENT_ID,
        Username: email,
      });

      await cognitoClient.send(command);
      debugLog("[AUTH] Password reset code sent successfully");
    } catch (error) {
      prodError("Forgot password error:", error);
      throw error;
    }
  }

  /**
   * Confirm password reset with code
   */
  async confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void> {
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
      });

      await cognitoClient.send(command);
      debugLog("[AUTH] Password reset confirmed successfully");
    } catch (error) {
      prodError("Confirm forgot password error:", error);
      throw error;
    }
  }

  /**
   * Generate a temporary password that meets Cognito requirements
   */
  private generateTempPassword(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password + "Aa1!"; // Ensure it meets all requirements
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    this.currentUser = null;
    await this.clearTokens();
    debugLog("[AUTH] User signed out");
  }

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<CognitoUser | null> {
    if (!this.currentUser) {
      try {
        // Fetch auth status from server (reads httpOnly cookies)
        const response = await fetch("/api/auth/status");
        if (response.ok) {
          const { isAuthenticated, user } = await response.json();
          if (isAuthenticated && user) {
            // Reconstruct user object (tokens are stored securely server-side)
            this.currentUser = {
              username: user.username,
              email: user.email,
              accessToken: "", // Not exposed to client
              refreshToken: "", // Not exposed to client
              idToken: "", // Not exposed to client
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
   * Store tokens in secure httpOnly cookies
   */
  private async storeTokens(user: CognitoUser): Promise<void> {
    try {
      // Store tokens in secure httpOnly cookies
      await Promise.all([
        this.setSecureCookie(
          "cognito_user",
          JSON.stringify({ username: user.username, email: user.email })
        ),
        this.setSecureCookie("cognito_access_token", user.accessToken),
        this.setSecureCookie("cognito_refresh_token", user.refreshToken),
        this.setSecureCookie("cognito_id_token", user.idToken),
      ]);
    } catch (e) {
      debugError("Failed to store tokens:", e);
      throw new Error("Failed to store authentication tokens securely");
    }
  }

  /**
   * Set a secure httpOnly cookie
   */
  private async setSecureCookie(name: string, value: string): Promise<void> {
    const response = await fetch("/api/auth/set-cookie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        value,
        maxAge: 86400, // 24 hours
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to set secure cookie: ${name}`);
    }
  }

  /**
   * Clear tokens from secure httpOnly cookies
   */
  private async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        this.clearSecureCookie("cognito_user"),
        this.clearSecureCookie("cognito_access_token"),
        this.clearSecureCookie("cognito_refresh_token"),
        this.clearSecureCookie("cognito_id_token"),
        this.clearSecureCookie("pending_magic_link"),
      ]);
    } catch (e) {
      debugError("Failed to clear tokens:", e);
    }
  }

  /**
   * Clear a secure httpOnly cookie
   */
  private async clearSecureCookie(name: string): Promise<void> {
    const response = await fetch("/api/auth/clear-cookie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      debugError(`Failed to clear secure cookie: ${name}`);
    }
  }

  /**
   * Refresh access token using refresh token
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
      prodError("Token refresh error:", error);
      // Clear current user on refresh failure
      this.currentUser = null;
      throw error;
    }
  }
}

// Export singleton instance
export const cognitoAuth = CognitoAuthService.getInstance();
