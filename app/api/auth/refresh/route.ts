import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const REGION = "us-east-2";
const CLIENT_ID = process.env.COGNITO_CLIENT_ID ?? process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
const isProduction = process.env.NODE_ENV === "production";
const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24; // 24 hours

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

export async function POST(_request: NextRequest) {
  try {
    if (!CLIENT_ID) {
      console.error("[Auth] Missing Cognito client id for token refresh");
      return NextResponse.json({ error: "Auth provider not configured" }, { status: 500 });
    }

    const cookieStore = await cookies();

    const refreshToken = cookieStore.get("cognito_refresh_token");
    if (!refreshToken?.value) {
      return NextResponse.json({ error: "No refresh token available" }, { status: 401 });
    }

    const command = new InitiateAuthCommand({
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken.value,
      },
    });

    const response = await cognitoClient.send(command);

    if (response.AuthenticationResult) {
      const jsonResponse = NextResponse.json({ success: true });

      jsonResponse.cookies.set({
        name: "cognito_access_token",
        value: response.AuthenticationResult.AccessToken || "",
        maxAge: ACCESS_TOKEN_MAX_AGE,
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
        path: "/",
      });

      if (response.AuthenticationResult.IdToken) {
        jsonResponse.cookies.set({
          name: "cognito_id_token",
          value: response.AuthenticationResult.IdToken,
          maxAge: ACCESS_TOKEN_MAX_AGE,
          httpOnly: true,
          secure: isProduction,
          sameSite: "strict",
          path: "/",
        });
      }

      return jsonResponse;
    }

    return NextResponse.json({ error: "Token refresh failed" }, { status: 401 });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json({ error: "Token refresh failed" }, { status: 500 });
  }
}
