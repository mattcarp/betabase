import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, verifyIdToken } from "@/server/auth/cognitoVerifier";

const isProduction = process.env.NODE_ENV === "production";
const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24; // 24 hours
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const AUTH_COOKIE_NAMES = [
  "cognito_access_token",
  "cognito_refresh_token",
  "cognito_id_token",
  "cognito_user",
];

type SessionRequestPayload = {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
};

function clearAuthCookies(response: NextResponse) {
  AUTH_COOKIE_NAMES.forEach((name) => {
    response.cookies.set({
      name,
      value: "",
      maxAge: 0,
      httpOnly: true,
      sameSite: "strict",
      secure: isProduction,
      path: "/",
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SessionRequestPayload;
    const { accessToken, refreshToken, idToken } = body;

    if (!accessToken || !refreshToken || !idToken) {
      return NextResponse.json({ error: "Missing authentication tokens" }, { status: 400 });
    }

    const [accessClaims, idClaims] = await Promise.all([
      verifyAccessToken(accessToken),
      verifyIdToken(idToken),
    ]);

    const username =
      (idClaims["cognito:username"] as string) ||
      (accessClaims.username as string) ||
      (idClaims.sub as string) ||
      "unknown";
    const email = (idClaims.email as string) || (accessClaims.email as string);

    if (!email) {
      throw new Error("Missing email claim in verified token");
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: "cognito_access_token",
      value: accessToken,
      maxAge: ACCESS_TOKEN_MAX_AGE,
      httpOnly: true,
      sameSite: "strict",
      secure: isProduction,
      path: "/",
    });

    response.cookies.set({
      name: "cognito_refresh_token",
      value: refreshToken,
      maxAge: REFRESH_TOKEN_MAX_AGE,
      httpOnly: true,
      sameSite: "strict",
      secure: isProduction,
      path: "/",
    });

    response.cookies.set({
      name: "cognito_id_token",
      value: idToken,
      maxAge: ACCESS_TOKEN_MAX_AGE,
      httpOnly: true,
      sameSite: "strict",
      secure: isProduction,
      path: "/",
    });

    response.cookies.set({
      name: "cognito_user",
      value: JSON.stringify({ username, email }),
      maxAge: ACCESS_TOKEN_MAX_AGE,
      httpOnly: true,
      sameSite: "strict",
      secure: isProduction,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Failed to persist session:", error);
    return NextResponse.json({ error: "Invalid authentication session" }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearAuthCookies(response);
  return response;
}

