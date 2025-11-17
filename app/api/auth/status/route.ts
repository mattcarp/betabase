import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken, verifyIdToken } from "@/server/auth/cognitoVerifier";

const isProduction = process.env.NODE_ENV === "production";
const AUTH_COOKIE_NAMES = [
  "cognito_access_token",
  "cognito_refresh_token",
  "cognito_id_token",
  "cognito_user",
];

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

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();

    const accessToken = cookieStore.get("cognito_access_token")?.value;
    const refreshToken = cookieStore.get("cognito_refresh_token")?.value;
    const idToken = cookieStore.get("cognito_id_token")?.value;

    if (!accessToken || !refreshToken || !idToken) {
      return NextResponse.json({ isAuthenticated: false, user: null }, { status: 401 });
    }

    try {
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
        throw new Error("Missing email claim in token");
      }

      return NextResponse.json({
        isAuthenticated: true,
        user: {
          username,
          email,
        },
      });
    } catch (verificationError) {
      console.error("Auth token verification failed:", verificationError);
      const response = NextResponse.json({ isAuthenticated: false, user: null }, { status: 401 });
      clearAuthCookies(response);
      return response;
    }
  } catch (error) {
    console.error("Auth status error:", error);
    return NextResponse.json({ error: "Failed to get auth status" }, { status: 500 });
  }
}
