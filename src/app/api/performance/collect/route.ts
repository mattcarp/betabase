import { NextResponse } from "next/server";
import {
  collectPerformanceSnapshot,
  persistPerformanceSnapshot,
} from "@/services/systemMetricsCollector";

export async function POST() {
  try {
    const snapshot = await collectPerformanceSnapshot(60);
    await persistPerformanceSnapshot(snapshot);
    return NextResponse.json({ success: true, snapshot });
  } catch (error) {
    console.error("Failed to collect performance snapshot:", error);
    return NextResponse.json({ error: "Collection failed" }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
