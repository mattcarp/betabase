import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, DEFAULT_APP_CONTEXT } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceType = searchParams.get("type") || "jira";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase not available" }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("siam_vectors")
      .select("id, source_id, source_type, content, metadata, created_at")
      .eq("organization", DEFAULT_APP_CONTEXT.organization)
      .eq("division", DEFAULT_APP_CONTEXT.division)
      .eq("app_under_test", DEFAULT_APP_CONTEXT.app_under_test)
      .eq("source_type", sourceType)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      sourceType,
      count: data?.length || 0,
      samples: data?.map(row => ({
        source_id: row.source_id,
        content: row.content,
        contentLength: row.content?.length || 0,
        embeddingSource: row.metadata?.embedding_source || "unknown",
        created_at: row.created_at
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

