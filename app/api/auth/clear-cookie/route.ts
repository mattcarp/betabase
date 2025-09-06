import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    const cookieStore = await cookies();
    cookieStore.delete(name);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear cookie error:", error);
    return NextResponse.json(
      { error: "Failed to clear cookie" },
      { status: 500 },
    );
  }
}
