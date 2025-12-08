/**
 * Inngest API Route
 *
 * DISABLED: Inngest integration is currently disabled.
 * This stub route prevents build errors.
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "disabled",
    message: "Inngest integration is currently disabled",
  });
}

export async function POST() {
  return NextResponse.json({
    status: "disabled",
    message: "Inngest integration is currently disabled",
  });
}

export async function PUT() {
  return NextResponse.json({
    status: "disabled",
    message: "Inngest integration is currently disabled",
  });
}
