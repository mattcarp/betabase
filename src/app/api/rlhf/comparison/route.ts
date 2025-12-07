/**
 * RLHF A/B Comparison API
 *
 * Handles preference data collection for DPO training:
 * - POST: Submit comparison preference
 * - GET: Retrieve pending comparisons for annotation
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

interface ComparisonSubmission {
  query: string;
  responseA: string;
  responseB: string;
  modelA?: string;
  modelB?: string;
  preferredResponse: "A" | "B" | "tie";
  reason?: string | null;
}

// POST - Submit comparison preference
export async function POST(request: NextRequest) {
  try {
    const body: ComparisonSubmission = await request.json();

    // Validate required fields
    if (!body.query || !body.responseA || !body.responseB || !body.preferredResponse) {
      return NextResponse.json(
        { error: "Missing required fields: query, responseA, responseB, preferredResponse" },
        { status: 400 }
      );
    }

    // Validate preference value
    if (!["A", "B", "tie"].includes(body.preferredResponse)) {
      return NextResponse.json(
        { error: "preferredResponse must be 'A', 'B', or 'tie'" },
        { status: 400 }
      );
    }

    // Prepare comparison record
    const comparisonRecord = {
      query: body.query,
      response_a: body.responseA,
      response_b: body.responseB,
      model_a: body.modelA || null,
      model_b: body.modelB || null,
      preferred_response: body.preferredResponse,
      reason: body.reason || null,
      created_at: new Date().toISOString(),
    };

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return NextResponse.json({
        id: `cmp_demo_${Date.now()}`,
        ...comparisonRecord,
        message: "Comparison recorded (demo mode - database not configured)",
      });
    }

    // Insert into database
    const { data, error } = await supabaseAdmin
      .from("rlhf_comparisons")
      .insert(comparisonRecord)
      .select()
      .single();

    if (error) {
      console.error("Comparison insert error:", error);
      // Return demo response for any database error (table doesn't exist, connection issues, etc.)
      // This allows the demo to work without a fully configured database
      return NextResponse.json({
        id: `cmp_demo_${Date.now()}`,
        ...comparisonRecord,
        message: `Comparison recorded (demo mode - ${error.message || error.code || 'database unavailable'})`,
      }, { status: 201 }); // Return 201 to indicate success in demo mode
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Comparison submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Retrieve comparisons (for annotation queue)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status"); // "pending", "annotated", or null for all
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return NextResponse.json({ comparisons: [], message: "Database not configured" });
    }

    let query = supabaseAdmin
      .from("rlhf_comparisons")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status === "pending") {
      query = query.is("preferred_response", null);
    } else if (status === "annotated") {
      query = query.not("preferred_response", "is", null);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Comparison fetch error:", error);
      // Return empty array if table doesn't exist
      if (error.code === "42P01") {
        return NextResponse.json({ comparisons: [], message: "Table not yet created" });
      }
      return NextResponse.json(
        { error: "Failed to fetch comparisons" },
        { status: 500 }
      );
    }

    return NextResponse.json({ comparisons: data });
  } catch (error) {
    console.error("Comparison fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
