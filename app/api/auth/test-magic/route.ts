import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Magic link endpoint is working",
    accepts: ["POST with JSON body"],
    example: { action: "send", email: "user@example.com" },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Handle both JSON and form data
    const contentType = request.headers.get("content-type");
    let email = "";
    let action = "send";

    if (contentType?.includes("application/json")) {
      const body = await request.json();
      email = body.email;
      action = body.action || "send";
    } else {
      // Handle form data
      const formData = await request.formData();
      email = formData.get("email") as string;
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // For testing, always return success with a dev code
    console.log(`[TEST] Magic link requested for: ${email}`);

    return NextResponse.json({
      success: true,
      message: `Magic link sent to ${email}`,
      devCode: "123456", // Always show dev code for testing
      note: "This is a test endpoint - no actual email sent",
    });
  } catch (error) {
    console.error("Magic link error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
