import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      value,
      maxAge = 86400,
      httpOnly = true,
      secure = true,
      sameSite = "strict",
      path = "/",
    } = await request.json();

    const cookieStore = await cookies();

    cookieStore.set({
      name,
      value,
      maxAge,
      httpOnly,
      secure: process.env.NODE_ENV === "production" ? secure : false, // Allow HTTP in dev
      sameSite,
      path,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set cookie error:", error);
    return NextResponse.json({ error: "Failed to set cookie" }, { status: 500 });
  }
}
