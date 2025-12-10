import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Real-time Supabase statistics endpoint
// Returns actual document counts from siam_vector_stats view AND betabase tables

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch real stats from the siam_vector_stats view
    const { data: vectorStats, error: statsError } = await supabase
      .from("siam_vector_stats")
      .select("*");

    if (statsError) {
      console.error("Error fetching vector stats:", statsError);
      return NextResponse.json(
        { error: "Failed to fetch vector statistics", details: statsError.message },
        { status: 500 }
      );
    }

    // Fetch real self-healing stats
    const { data: selfHealingStats, error: healingError } = await supabase
      .rpc("get_self_healing_stats");

    // Fetch betabase table counts (real QA test data)
    const betabaseTables = ['bb_case', 'bb_deployment', 'bb_round', 'bb_variation', 'bb_user', 'bb_application'];
    const betabaseStats: { table: string; count: number }[] = [];
    
    for (const table of betabaseTables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error && count !== null) {
        betabaseStats.push({ table, count });
      }
    }

    // Fetch application names for context
    const { data: applications } = await supabase
      .from("bb_application")
      .select("name");

    // Calculate totals
    const totalDocuments = vectorStats?.reduce((sum, stat) => sum + (stat.document_count || 0), 0) || 0;
    const totalTestCases = betabaseStats.find(s => s.table === 'bb_case')?.count || 0;
    
    // Format for frontend consumption
    const formattedStats = {
      vectorStats: vectorStats || [],
      totalDocuments,
      selfHealingStats: selfHealingStats || null,
      // Betabase (real QA test data)
      betabaseStats,
      totalTestCases,
      applications: applications?.map(a => a.name) || [],
      queriedAt: new Date().toISOString(),
      source: "supabase-realtime",
    };

    return NextResponse.json(formattedStats);
  } catch (error) {
    console.error("Vector stats API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
