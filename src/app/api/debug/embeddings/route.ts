import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, DEFAULT_APP_CONTEXT } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceType = searchParams.get("sourceType") || "git";
    
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase not available" }, { status: 500 });
    }

    // Check a sample of vectors for embedding column usage
    const { data, error } = await supabaseAdmin
      .from("siam_vectors")
      .select("id, source_id, metadata")
      .eq("organization", DEFAULT_APP_CONTEXT.organization)
      .eq("source_type", sourceType)
      .limit(10);

    if (error) throw error;

    // Check which embedding column has data
    const { data: embeddingCheck, error: embErr } = await supabaseAdmin.rpc(
      "check_embedding_columns",
      { p_source_type: sourceType, p_limit: 100 }
    );

    // Fallback: direct column check
    const { data: sampleWithEmbeddings, error: sampleErr } = await supabaseAdmin
      .from("siam_vectors")
      .select("id, source_id, metadata")
      .eq("organization", DEFAULT_APP_CONTEXT.organization)
      .eq("source_type", sourceType)
      .not("embedding_gemini", "is", null)
      .limit(5);

    const { data: sampleWithOpenAI, error: openaiErr } = await supabaseAdmin
      .from("siam_vectors")
      .select("id, source_id, metadata")
      .eq("organization", DEFAULT_APP_CONTEXT.organization)
      .eq("source_type", sourceType)
      .not("embedding", "is", null)
      .limit(5);

    return NextResponse.json({
      sourceType,
      totalSampled: data?.length || 0,
      hasGeminiEmbeddings: (sampleWithEmbeddings?.length || 0) > 0,
      geminiCount: sampleWithEmbeddings?.length || 0,
      hasOpenAIEmbeddings: (sampleWithOpenAI?.length || 0) > 0,
      openaiCount: sampleWithOpenAI?.length || 0,
      sampleMetadata: data?.slice(0, 3).map(d => ({
        source_id: d.source_id,
        embedding_source: d.metadata?.embedding_source
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
