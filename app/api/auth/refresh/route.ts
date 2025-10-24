import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const REGION = "us-east-2";
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "5c6ll37299p351to549lkg3o0d";

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });

export async function POST(_request: NextRequest) {
  try {
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
      // Create response with updated tokens in secure httpOnly cookies
      const jsonResponse = NextResponse.json({ success: true });

      jsonResponse.cookies.set({
        name: "cognito_access_token",
        value: response.AuthenticationResult.AccessToken || "",
        maxAge: 86400,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      if (response.AuthenticationResult.IdToken) {
        jsonResponse.cookies.set({
          name: "cognito_id_token",
          value: response.AuthenticationResult.IdToken,
          maxAge: 86400,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
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
