import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table") || "bb_case";

    // Get sample data to understand schema
    const { data: sampleData, error: sampleError } = await supabase
      .from(table)
      .select("*")
      .limit(3);

    if (sampleError) {
      return NextResponse.json(
        { error: `Failed to query ${table}`, details: sampleError.message },
        { status: 500 }
      );
    }

    // Get count
    const { count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    // Infer schema from sample data
    const schema = sampleData && sampleData.length > 0
      ? Object.keys(sampleData[0]).map(key => ({
          column: key,
          sampleValue: sampleData[0][key],
          type: typeof sampleData[0][key],
        }))
      : [];

    return NextResponse.json({
      table,
      count,
      schema,
      sampleData,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to query schema", details: String(error) },
      { status: 500 }
    );
  }
}

