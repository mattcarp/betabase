import { CognitoJwtVerifier } from "aws-jwt-verify";
import type {
  CognitoAccessTokenPayload,
  CognitoIdTokenPayload,
} from "aws-jwt-verify/cognito-verifier";

type CognitoConfig = {
  userPoolId: string;
  clientId: string;
};

let cachedConfig: CognitoConfig | null = null;
let accessTokenVerifier: ReturnType<typeof CognitoJwtVerifier.create<CognitoAccessTokenPayload>> | null =
  null;
let idTokenVerifier: ReturnType<typeof CognitoJwtVerifier.create<CognitoIdTokenPayload>> | null = null;

function resolveConfig(): CognitoConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const userPoolId =
    process.env.COGNITO_USER_POOL_ID ?? process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID ?? process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

  if (!userPoolId || !clientId) {
    throw new Error(
      "[Auth] Missing Cognito configuration. Set COGNITO_USER_POOL_ID / COGNITO_CLIENT_ID (or NEXT_PUBLIC_ equivalents for client flows)."
    );
  }

  cachedConfig = { userPoolId, clientId };
  return cachedConfig;
}

function getAccessTokenVerifier() {
  if (!accessTokenVerifier) {
    const { userPoolId, clientId } = resolveConfig();
    accessTokenVerifier = CognitoJwtVerifier.create<CognitoAccessTokenPayload>({
      userPoolId,
      tokenUse: "access",
      clientId,
    });
  }
  return accessTokenVerifier;
}

function getIdTokenVerifier() {
  if (!idTokenVerifier) {
    const { userPoolId, clientId } = resolveConfig();
    idTokenVerifier = CognitoJwtVerifier.create<CognitoIdTokenPayload>({
      userPoolId,
      tokenUse: "id",
      clientId,
    });
  }
  return idTokenVerifier;
}

export async function verifyAccessToken(token: string): Promise<CognitoAccessTokenPayload> {
  if (!token) {
    throw new Error("Access token is required for verification");
  }
  return getAccessTokenVerifier().verify(token);
}

export async function verifyIdToken(token: string): Promise<CognitoIdTokenPayload> {
  if (!token) {
    throw new Error("ID token is required for verification");
  }
  return getIdTokenVerifier().verify(token);
}

export function assertCognitoConfig(): void {
  resolveConfig();
}

