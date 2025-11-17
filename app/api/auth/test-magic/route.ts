import { NextRequest, NextResponse } from "next/server";

const isDevEnvironment = process.env.NODE_ENV !== "production";

function notFoundResponse() {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

export async function GET() {
  if (!isDevEnvironment) {
    return notFoundResponse();
  }

  return NextResponse.json({
    status: "ok",
    message: "Magic link test endpoint is available in development only",
    accepts: ["POST with JSON body"],
    example: { action: "send", email: "user@example.com" },
  });
}

export async function POST(request: NextRequest) {
  if (!isDevEnvironment) {
    return notFoundResponse();
  }

  try {
    const contentType = request.headers.get("content-type");
    let email = "";

    if (contentType?.includes("application/json")) {
      const body = await request.json();
      email = body.email;
    } else {
      const formData = await request.formData();
      email = formData.get("email") as string;
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log(`[TEST] Magic link requested for: ${email}`);

    return NextResponse.json({
      success: true,
      message: `Magic link sent to ${email}`,
      devCode: "123456",
      note: "This is a test endpoint - no actual email sent",
    });
  } catch (error) {
    console.error("Magic link error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
