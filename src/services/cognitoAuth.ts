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

const USER_POOL_ID =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID : undefined;
const CLIENT_ID =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID : undefined;

const COGNITO_CONFIG_ERROR =
  "[COGNITO ERROR] Missing NEXT_PUBLIC_COGNITO_USER_POOL_ID or NEXT_PUBLIC_COGNITO_CLIENT_ID.";

const isCognitoConfigured = Boolean(USER_POOL_ID && CLIENT_ID);

if (!isCognitoConfigured) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(COGNITO_CONFIG_ERROR);
  } else {
    // eslint-disable-next-line no-console
    console.warn(`${COGNITO_CONFIG_ERROR} Authentication flows are disabled in this environment.`);
  }
}

// Initialize Cognito client
const cognitoClient = isCognitoConfigured
  ? new CognitoIdentityProviderClient({ region: REGION })
  : null;

function requireCognitoConfig() {
  if (!USER_POOL_ID || !CLIENT_ID || !cognitoClient) {
    throw new Error(COGNITO_CONFIG_ERROR);
  }
  return { userPoolId: USER_POOL_ID, clientId: CLIENT_ID, client: cognitoClient };
}

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
      const { clientId, client } = requireCognitoConfig();

      const command = new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const response = await client.send(command);

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
      const { clientId, client } = requireCognitoConfig();
      debugLog("[AUTH] Using ClientId:", clientId);

      const command = new ForgotPasswordCommand({
        ClientId: clientId,
        Username: email,
      });

      await client.send(command);
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
      const { clientId, client } = requireCognitoConfig();
      const command = new ConfirmForgotPasswordCommand({
        ClientId: clientId,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
      });

      await client.send(command);
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
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          idToken: user.idToken,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error ?? "Failed to persist authentication session");
      }
    } catch (e) {
      debugError("Failed to store tokens:", e);
      throw new Error("Failed to store authentication tokens securely");
    }
  }

  /**
   * Clear tokens from secure httpOnly cookies
   */
  private async clearTokens(): Promise<void> {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch (e) {
      debugError("Failed to clear tokens:", e);
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
