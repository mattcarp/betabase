import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Apply Self-Healing Fix to Test File
 *
 * Supports two modes:
 * 1. From healing attempt: Provide attemptId to auto-resolve the fix details
 * 2. Direct replacement: Provide file, originalCode, fixedCode
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attemptId, testFile, originalCode, fixedCode, file, replacements } = body;

    let targetFile = testFile || file;
    let searchCode = originalCode;
    let replaceCode = fixedCode;

    // Mode 1: From healing attempt ID - fetch details from database
    if (attemptId && !targetFile && supabaseAdmin) {
      const { data: attempt } = await supabaseAdmin
        .from("self_healing_attempts")
        .select("test_file, code_before, code_after, original_selector, suggested_selector")
        .eq("id", attemptId)
        .single();

      if (attempt) {
        targetFile = attempt.test_file;
        searchCode = attempt.code_before || `await page.locator('${attempt.original_selector}')`;
        replaceCode = attempt.code_after || `await page.locator('${attempt.suggested_selector}')`;
      }
    }

    // Mode 2: Legacy replacements array format
    if (replacements && Array.isArray(replacements) && file) {
      targetFile = file;
    }

    if (!targetFile) {
      return NextResponse.json(
        { error: "Missing required field: testFile or file" },
        { status: 400 }
      );
    }

    // Security check: Only allow access to test files within the project
    const projectRoot = process.cwd();
    const resolvedPath = path.resolve(projectRoot, targetFile);

    if (!resolvedPath.startsWith(projectRoot)) {
      return NextResponse.json(
        { error: "Access denied: File outside project root" },
        { status: 403 }
      );
    }

    // Only allow test file modifications for safety
    if (!targetFile.includes("test") && !targetFile.includes("spec")) {
      return NextResponse.json(
        { error: "Security: Only test/spec files can be modified via self-healing" },
        { status: 403 }
      );
    }

    // Check if file exists
    try {
      await fs.access(resolvedPath);
    } catch {
      return NextResponse.json({ error: `File not found: ${targetFile}` }, { status: 404 });
    }

    // Read current file content
    let content = await fs.readFile(resolvedPath, "utf-8");
    let modified = false;

    // Apply direct replacement (from healing attempt)
    if (searchCode && replaceCode) {
      if (content.includes(searchCode)) {
        content = content.replace(searchCode, replaceCode);
        modified = true;
      } else {
        // Try fuzzy match - find similar line and replace
        const lines = content.split("\n");
        const searchTrimmed = searchCode.trim();

        for (let i = 0; i < lines.length; i++) {
          const lineTrimmed = lines[i].trim();
          // Check if line contains the selector being replaced
          if (
            lineTrimmed.includes(searchTrimmed) ||
            (searchCode.includes("locator") && lineTrimmed.includes("locator"))
          ) {
            lines[i] = lines[i].replace(lineTrimmed, replaceCode.trim());
            modified = true;
            break;
          }
        }

        if (modified) {
          content = lines.join("\n");
        }
      }
    }

    // Apply legacy replacements array
    if (replacements && Array.isArray(replacements)) {
      for (const rep of replacements) {
        if (rep.search && rep.replace !== undefined) {
          if (content.includes(rep.search)) {
            content = content.replace(rep.search, rep.replace);
            modified = true;
          }
        }
      }
    }

    if (!modified) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not find code to replace in file",
          searchedFor: searchCode?.substring(0, 100),
          file: targetFile,
        },
        { status: 422 }
      );
    }

    // Write the modified content
    await fs.writeFile(resolvedPath, content, "utf-8");

    // Update the healing attempt status if we have an ID
    if (attemptId && supabaseAdmin) {
      await supabaseAdmin
        .from("self_healing_attempts")
        .update({
          status: "approved",
          healed_at: new Date().toISOString(),
          reviewed_by: "self-healing-api",
        })
        .eq("id", attemptId);
    }

    return NextResponse.json({
      success: true,
      message: "Fix applied successfully",
      file: targetFile,
      attemptId,
    });
  } catch (error) {
    console.error("Apply fix error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
