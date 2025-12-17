import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// T011: GET single historical test by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("bb_case")
      .select("*")
      .eq("id", parseInt(id))
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Test not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch test", details: error.message },
        { status: 500 }
      );
    }

    // Transform to match interface
    const desc = (data.expected_result || "").toLowerCase();
    let category = "General";
    if (desc.includes("distribution")) category = "Distribution";
    else if (desc.includes("audio") || desc.includes("media")) category = "Media";
    else if (desc.includes("user") || desc.includes("admin")) category = "User Admin";
    else if (desc.includes("search")) category = "Search";

    const test = {
      id: data.id,
      original_id: data.original_id,
      test_name: data.name || data.expected_result || "Unnamed Test",
      description: data.expected_result || "",
      preconditions: data.preconditions || "",
      test_script: data.script || "",
      app_under_test: data.app_under_test || "Unknown",
      tags: data.tags || "",
      category,
      coverage: data.coverage || "0",
      client_priority: data.client_priority || 0,
      is_security: data.is_security,
      execution_count: data.execution_count || 0,
      pass_count: data.pass_count || 0,
      fail_count: data.fail_count || 0,
      first_executed_at: data.first_executed_at,
      last_executed_at: data.last_executed_at,
      jira_ticket_count: data.jira_ticket_count || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      review_flag: data.review_flag,
      flag_reason: data.flag_reason,
      reviewed_flag: data.reviewed_flag,
    };

    return NextResponse.json({ test });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
