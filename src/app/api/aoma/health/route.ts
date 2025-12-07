import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "service_unavailable",
      endpoint: "railway",
      message: "Railway health checks are disabled; chat uses Supabase instead.",
    },
    { status: 503 }
  );
}






