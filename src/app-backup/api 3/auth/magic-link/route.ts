import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/services/emailService";
import { cognitoAuth } from "@/services/cognitoAuth";

// Allowed emails list
const ALLOWED_EMAILS = [
  "matt@mattcarpenter.com",
  "fiona@fionaburgess.com",
  "fiona.burgess.ext@sonymusic.com",
  "claude@test.siam.ai",
];

function isEmailAllowed(email: string): boolean {
  const emailLower = email.toLowerCase();
  return (
    emailLower.endsWith("@sonymusic.com") || ALLOWED_EMAILS.includes(emailLower)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, code } = body;

    switch (action) {
      case "send":
        // Validate email is allowed
        if (!isEmailAllowed(email)) {
          return NextResponse.json(
            { error: "Email not authorized" },
            { status: 403 },
          );
        }

        // Send magic link
        const verificationCode = await emailService.sendMagicLink(email);

        // In dev mode, return the code for testing
        if (process.env.NODE_ENV === "development") {
          return NextResponse.json({
            success: true,
            message: "Magic link sent",
            devCode: verificationCode, // Only in dev!
          });
        }

        return NextResponse.json({
          success: true,
          message: "Magic link sent to your email",
        });

      case "verify":
        // Verify the code
        const isValid = emailService.verifyCode(email, code);

        if (!isValid) {
          return NextResponse.json(
            { error: "Invalid or expired code" },
            { status: 401 },
          );
        }

        // Create a session token
        const mockUser = {
          username: email,
          email: email,
          accessToken: `real-token-${Date.now()}`,
          refreshToken: `real-refresh-${Date.now()}`,
          idToken: `real-id-${Date.now()}`,
        };

        return NextResponse.json({
          success: true,
          user: mockUser,
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[MAGIC LINK] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
