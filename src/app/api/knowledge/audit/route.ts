import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, DEFAULT_APP_CONTEXT } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase not available" }, { status: 500 });
    }

    // Sample from each source type to check embedding status
    const sourceTypes = ["git", "knowledge", "jira", "firecrawl"];
    const results: Record<string, any> = {};

    for (const st of sourceTypes) {
      const { data, error } = await supabaseAdmin
        .from("siam_vectors")
        .select("id, source_type, content, metadata")
        .eq("organization", DEFAULT_APP_CONTEXT.organization)
        .eq("division", DEFAULT_APP_CONTEXT.division)
        .eq("app_under_test", DEFAULT_APP_CONTEXT.app_under_test)
        .eq("source_type", st)
        .limit(20);

      if (error) {
        results[st] = { error: error.message };
        continue;
      }

      const embeddingSources: Record<string, number> = {};
      let totalContentLength = 0;

      for (const row of data || []) {
        const source = row.metadata?.embedding_source || "unknown";
        embeddingSources[source] = (embeddingSources[source] || 0) + 1;
        totalContentLength += row.content?.length || 0;
      }

      results[st] = {
        sampled: data?.length || 0,
        avgContentLength: data?.length ? Math.round(totalContentLength / data.length) : 0,
        embeddingSources,
        sampleContent: data?.[0]?.content?.substring(0, 100) + "..."
      };
    }

    return NextResponse.json({ audit: results });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
