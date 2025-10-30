/**
 * Secure cookie utilities for authentication tokens
 * YOLO mode - replace localStorage with httpOnly cookies
 */

export interface CookieOptions {
  name: string;
  value: string;
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  path?: string;
}

/**
 * Set a secure httpOnly cookie via API endpoint
 */
export async function setSecureCookie(options: CookieOptions): Promise<void> {
  const response = await fetch("/api/auth/set-cookie", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    throw new Error("Failed to set secure cookie");
  }
}

/**
 * Clear a secure cookie via API endpoint
 */
export async function clearSecureCookie(name: string): Promise<void> {
  const response = await fetch("/api/auth/clear-cookie", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error("Failed to clear secure cookie");
  }
}

/**
 * Get cookie value from client side (for non-sensitive data only)
 */
export function getClientCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split("=");
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Set client-side cookie (for non-sensitive data only)
 */
export function setClientCookie(name: string, value: string, maxAge: number = 86400): void {
  if (typeof document === "undefined") return;

  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; samesite=strict`;
}
