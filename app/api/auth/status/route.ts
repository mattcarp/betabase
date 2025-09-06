import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    const accessToken = cookieStore.get("cognito_access_token");
    const refreshToken = cookieStore.get("cognito_refresh_token");
    const idToken = cookieStore.get("cognito_id_token");
    const userInfo = cookieStore.get("cognito_user");

    const isAuthenticated = !!(
      accessToken?.value &&
      refreshToken?.value &&
      idToken?.value
    );

    if (isAuthenticated && userInfo?.value) {
      try {
        const user = JSON.parse(userInfo.value);
        return NextResponse.json({
          isAuthenticated: true,
          user: {
            username: user.username,
            email: user.email,
            // Don't return tokens to client
          },
        });
      } catch (e) {
        // If user info is corrupted, consider user not authenticated
        return NextResponse.json({ isAuthenticated: false, user: null });
      }
    }

    return NextResponse.json({ isAuthenticated: false, user: null });
  } catch (error) {
    console.error("Auth status error:", error);
    return NextResponse.json(
      { error: "Failed to get auth status" },
      { status: 500 },
    );
  }
}
