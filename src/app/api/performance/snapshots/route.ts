import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ensureSnapshotAlerts } from "@/services/systemMetricsCollector";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = parseInt(searchParams.get("limit") || "50", 10);
    const offsetParam = parseInt(searchParams.get("offset") || "0", 10);
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";
    const summary = searchParams.get("summary") === "true";

    const limit = Math.min(Math.max(limitParam, 1), 500);
    const offset = Math.max(offsetParam, 0);
    const to = offset + limit - 1;

    const selectColumns = summary ? "id, created_at" : "id, metrics, created_at";

    const { data, error } = await supabaseAdmin
      .from("system_metrics_snapshots")
      .select(selectColumns)
      .order("created_at", { ascending: order === "asc" })
      .range(offset, to);

    if (error) {
      throw error;
    }

    const snapshots = summary
      ? (data ?? [])
      : (data ?? []).map((row) => ({
          ...row,
          metrics: ensureSnapshotAlerts(row.metrics),
        }));

    return NextResponse.json({
      snapshots,
      pagination: {
        limit,
        offset,
        order,
        returned: snapshots.length,
      },
    });
  } catch (error) {
    console.error("Failed to fetch performance snapshots:", error);
    return NextResponse.json({ error: "Unable to fetch snapshots" }, { status: 500 });
  }
}
