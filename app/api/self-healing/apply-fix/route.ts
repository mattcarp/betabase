import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// POST - Apply a fix to a test file
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file, patch, replacements } = body;

    if (!file) {
      return NextResponse.json(
        { error: "Missing required field: file" },
        { status: 400 }
      );
    }

    // Security check: Only allow access to files within the project
    const projectRoot = process.cwd();
    const resolvedPath = path.resolve(projectRoot, file);

    if (!resolvedPath.startsWith(projectRoot)) {
      return NextResponse.json(
        { error: "Access denied: File outside project root" },
        { status: 403 }
      );
    }

    // Check if file exists
    try {
      await fs.access(resolvedPath);
    } catch {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Apply replacements
    if (replacements && Array.isArray(replacements)) {
      let content = await fs.readFile(resolvedPath, "utf-8");
      
      for (const rep of replacements) {
        if (rep.search && rep.replace !== undefined) {
            // Simple string replace for now, can be enhanced to regex
             content = content.replace(rep.search, rep.replace);
        }
      }

      await fs.writeFile(resolvedPath, content, "utf-8");
      
      return NextResponse.json({ 
        success: true, 
        message: "Fix applied successfully",
        file: file
      });
    }

    // TODO: Implement patch application if we switch to diff format later
    
    return NextResponse.json(
      { error: "No valid replacements provided" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Apply fix error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
