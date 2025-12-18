import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, DEFAULT_APP_CONTEXT } from "@/lib/supabase";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceType = searchParams.get("type");
    const dryRun = searchParams.get("dryRun") !== "false";

    if (!sourceType) {
      return NextResponse.json({ error: "Missing 'type' parameter" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase not available" }, { status: 500 });
    }

    // First count how many we'll delete
    const { count, error: countError } = await supabaseAdmin
      .from("siam_vectors")
      .select("*", { count: "exact", head: true })
      .eq("organization", DEFAULT_APP_CONTEXT.organization)
      .eq("division", DEFAULT_APP_CONTEXT.division)
      .eq("app_under_test", DEFAULT_APP_CONTEXT.app_under_test)
      .eq("source_type", sourceType);

    if (countError) throw countError;

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        sourceType,
        wouldDelete: count,
        message: `Would delete ${count} documents. Set dryRun=false to proceed.`
      });
    }

    // Actually delete
    const { error: deleteError } = await supabaseAdmin
      .from("siam_vectors")
      .delete()
      .eq("organization", DEFAULT_APP_CONTEXT.organization)
      .eq("division", DEFAULT_APP_CONTEXT.division)
      .eq("app_under_test", DEFAULT_APP_CONTEXT.app_under_test)
      .eq("source_type", sourceType);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      sourceType,
      deleted: count,
      message: `Successfully deleted ${count} ${sourceType} documents`
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}


