import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface HistoricalTest {
  id: number;
  original_id: number;
  test_name: string;
  description: string;
  preconditions: string;
  test_script: string;
  app_under_test: string;
  tags: string;
  category: string;
  coverage: string;
  client_priority: number;
  is_security: boolean | null;
  execution_count: number;
  pass_count: number;
  fail_count: number;
  first_executed_at: string | null;
  last_executed_at: string | null;
  jira_ticket_count: number;
  created_at: string;
  updated_at: string;
  base_confidence: number;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);

    // Pagination (support up to 100 for initial cache)
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // Cap at 100
    const offset = (page - 1) * limit;

    // Filters
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const app = searchParams.get("app");
    const minConfidence = parseFloat(searchParams.get("minConfidence") || "0");
    const hasExecutions = searchParams.get("hasExecutions");

    // Sorting
    const sortBy = searchParams.get("sortBy") || "updated_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build query - using bb_case directly until view is created
    let query = supabase
      .from("bb_case")
      .select("*", { count: "exact" });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,expected_result.ilike.%${search}%`);
    }

    if (app) {
      query = query.eq("app_under_test", app);
    }

    if (hasExecutions === "true") {
      query = query.gt("execution_count", 0);
    } else if (hasExecutions === "false") {
      query = query.eq("execution_count", 0);
    }

    // Apply sorting
    const ascending = sortOrder === "asc";
    query = query.order(sortBy, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching historical tests:", error);
      return NextResponse.json(
        { error: "Failed to fetch historical tests", details: error.message },
        { status: 500 }
      );
    }

    // Transform data to match HistoricalTest interface
    const tests: HistoricalTest[] = (data || []).map((row: any) => {
      // Calculate base confidence
      let confidence = 0.3;
      if (row.execution_count > 0) {
        const passRate = row.pass_count / Math.max(row.execution_count, 1);
        if (passRate > 0.8 && row.last_executed_at) {
          const lastExec = new Date(row.last_executed_at);
          const daysSince = (Date.now() - lastExec.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSince < 90) confidence = 0.9;
          else if (daysSince < 180) confidence = 0.75;
          else confidence = 0.6;
        } else {
          confidence = 0.5;
        }
      }

      // Derive category
      const desc = (row.expected_result || "").toLowerCase();
      let derivedCategory = "General";
      if (desc.includes("distribution")) derivedCategory = "Distribution";
      else if (desc.includes("audio") || desc.includes("media")) derivedCategory = "Media";
      else if (desc.includes("user") || desc.includes("admin")) derivedCategory = "User Admin";
      else if (desc.includes("search")) derivedCategory = "Search";
      else if (desc.includes("upload") || desc.includes("import")) derivedCategory = "Upload/Import";
      else if (desc.includes("export") || desc.includes("download")) derivedCategory = "Export/Download";
      else if (desc.includes("campaign")) derivedCategory = "Campaign";
      else if (desc.includes("permission") || desc.includes("role")) derivedCategory = "Permissions";

      return {
        id: row.id,
        original_id: row.original_id,
        test_name: row.name || row.expected_result || "Unnamed Test",
        description: row.expected_result || "",
        preconditions: row.preconditions || "",
        test_script: row.script || "",
        app_under_test: row.app_under_test || "Unknown",
        tags: row.tags || "",
        category: derivedCategory,
        coverage: row.coverage || "0",
        client_priority: row.client_priority || 0,
        is_security: row.is_security,
        execution_count: row.execution_count || 0,
        pass_count: row.pass_count || 0,
        fail_count: row.fail_count || 0,
        first_executed_at: row.first_executed_at,
        last_executed_at: row.last_executed_at,
        jira_ticket_count: row.jira_ticket_count || 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
        base_confidence: confidence,
      };
    });

    // Filter by confidence if needed (post-query since it's computed)
    const filteredTests = minConfidence > 0
      ? tests.filter(t => t.base_confidence >= minConfidence)
      : tests;

    // Get category breakdown for filters
    const categories = [...new Set(tests.map(t => t.category))].sort();

    // Get app breakdown for filters
    const apps = [...new Set(tests.map(t => t.app_under_test))].sort();

    return NextResponse.json({
      tests: filteredTests,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: offset + limit < (count || 0),
      },
      filters: {
        categories,
        apps,
      },
    });
  } catch (error) {
    console.error("Error in historical tests API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

