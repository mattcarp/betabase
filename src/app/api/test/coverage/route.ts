import { NextRequest, NextResponse } from "next/server";

interface CoverageData {
  file: string;
  lines: {
    total: number;
    covered: number;
    percentage: number;
  };
  branches: {
    total: number;
    covered: number;
    percentage: number;
  };
  functions: {
    total: number;
    covered: number;
    percentage: number;
  };
  statements: {
    total: number;
    covered: number;
    percentage: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get("executionId");
    const file = searchParams.get("file");

    // Mock coverage data
    const mockCoverageData: CoverageData[] = [
      {
        file: "src/components/auth/MagicLinkLoginForm.tsx",
        lines: { total: 150, covered: 135, percentage: 90 },
        branches: { total: 40, covered: 32, percentage: 80 },
        functions: { total: 20, covered: 18, percentage: 90 },
        statements: { total: 160, covered: 144, percentage: 90 },
      },
      {
        file: "src/services/cognito.ts",
        lines: { total: 200, covered: 180, percentage: 90 },
        branches: { total: 50, covered: 45, percentage: 90 },
        functions: { total: 25, covered: 23, percentage: 92 },
        statements: { total: 210, covered: 189, percentage: 90 },
      },
      {
        file: "src/components/ui/pages/ChatPage.tsx",
        lines: { total: 300, covered: 240, percentage: 80 },
        branches: { total: 60, covered: 42, percentage: 70 },
        functions: { total: 35, covered: 28, percentage: 80 },
        statements: { total: 320, covered: 256, percentage: 80 },
      },
      {
        file: "src/utils/buildInfo.ts",
        lines: { total: 50, covered: 50, percentage: 100 },
        branches: { total: 10, covered: 10, percentage: 100 },
        functions: { total: 5, covered: 5, percentage: 100 },
        statements: { total: 55, covered: 55, percentage: 100 },
      },
      {
        file: "src/lib/utils.ts",
        lines: { total: 80, covered: 72, percentage: 90 },
        branches: { total: 20, covered: 18, percentage: 90 },
        functions: { total: 15, covered: 14, percentage: 93 },
        statements: { total: 85, covered: 77, percentage: 91 },
      },
    ];

    // Filter by file if provided
    const coverageData = file
      ? mockCoverageData.filter((c) => c.file === file)
      : mockCoverageData;

    // Calculate overall coverage
    const overallCoverage = {
      lines: {
        total: coverageData.reduce((sum, c) => sum + c.lines.total, 0),
        covered: coverageData.reduce((sum, c) => sum + c.lines.covered, 0),
        percentage: 0,
      },
      branches: {
        total: coverageData.reduce((sum, c) => sum + c.branches.total, 0),
        covered: coverageData.reduce((sum, c) => sum + c.branches.covered, 0),
        percentage: 0,
      },
      functions: {
        total: coverageData.reduce((sum, c) => sum + c.functions.total, 0),
        covered: coverageData.reduce((sum, c) => sum + c.functions.covered, 0),
        percentage: 0,
      },
      statements: {
        total: coverageData.reduce((sum, c) => sum + c.statements.total, 0),
        covered: coverageData.reduce((sum, c) => sum + c.statements.covered, 0),
        percentage: 0,
      },
    };

    // Calculate percentages
    overallCoverage.lines.percentage = Math.round(
      (overallCoverage.lines.covered / overallCoverage.lines.total) * 100
    );
    overallCoverage.branches.percentage = Math.round(
      (overallCoverage.branches.covered / overallCoverage.branches.total) * 100
    );
    overallCoverage.functions.percentage = Math.round(
      (overallCoverage.functions.covered / overallCoverage.functions.total) * 100
    );
    overallCoverage.statements.percentage = Math.round(
      (overallCoverage.statements.covered / overallCoverage.statements.total) * 100
    );

    // Mock trend data
    const trendData = [
      { date: "Mon", coverage: 82 },
      { date: "Tue", coverage: 83 },
      { date: "Wed", coverage: 85 },
      { date: "Thu", coverage: 84 },
      { date: "Fri", coverage: 86 },
      { date: "Sat", coverage: 87 },
      { date: "Sun", coverage: 88 },
    ];

    return NextResponse.json(
      {
        executionId,
        overall: overallCoverage,
        files: coverageData,
        trend: trendData,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching coverage data:", error);
    return NextResponse.json(
      { error: "Failed to fetch coverage data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { executionId, coverage } = body;

    // In production, this would save coverage data to database
    // For now, just return success
    return NextResponse.json(
      {
        message: "Coverage data saved successfully",
        executionId,
        filesProcessed: coverage?.length || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving coverage data:", error);
    return NextResponse.json(
      { error: "Failed to save coverage data" },
      { status: 500 }
    );
  }
}