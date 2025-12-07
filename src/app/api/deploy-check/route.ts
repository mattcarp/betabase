import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "SIAM_DEPLOYED",
    timestamp: new Date().toISOString(),
    message: "SIAM is successfully deployed!",
    version: "0.1.0",
  });
}
