import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, DEFAULT_APP_CONTEXT } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pattern = searchParams.get("pattern") || "";
    const organization = searchParams.get("organization") || DEFAULT_APP_CONTEXT.organization;
    const division = searchParams.get("division") || DEFAULT_APP_CONTEXT.division;
    const app_under_test = searchParams.get("app_under_test") || DEFAULT_APP_CONTEXT.app_under_test;

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase not available" }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("siam_vectors")
      .select("id, source_id, source_type")
      .eq("organization", organization)
      .eq("division", division)
      .eq("app_under_test", app_under_test)
      .eq("source_type", "knowledge")
      .ilike("source_id", `%${pattern}%`)
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ results: data, count: data?.length || 0 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
