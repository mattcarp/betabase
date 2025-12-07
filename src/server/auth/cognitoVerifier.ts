/**
 * Cognito Token Verifier Stub
 * TODO: Implement actual verification logic when needed
 */

interface TokenPayload {
  sub: string;
  email?: string;
  exp: number;
  iat: number;
}

export async function verifyAccessToken(
  token: string
): Promise<TokenPayload | null> {
  console.warn("verifyAccessToken: Using stub implementation");
  // Stub - always return null (token invalid)
  return null;
}

export async function verifyIdToken(
  token: string
): Promise<TokenPayload | null> {
  console.warn("verifyIdToken: Using stub implementation");
  // Stub - always return null (token invalid)
  return null;
}
