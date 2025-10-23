import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Get Assistant ID from environment variable (if needed)
// const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID || "asst_VvOHL1c4S6YapYKun4mY29fM";

interface DuplicateGroup {
  files: Array<{
    id: string;
    filename: string;
    bytes: number;
    created_at: number;
  }>;
  similarity: number;
}

// Calculate text similarity using Levenshtein distance
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const costs: number[] = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[shorter.length] = lastValue;
    }
  }

  const distance = costs[shorter.length];
  return (longer.length - distance) / longer.length;
}

// Enhanced filename similarity check
function areFilenamesSimilar(
  filename1: string,
  filename2: string,
  threshold: number = 0.85
): boolean {
  // Normalize filenames (lowercase, remove extensions)
  const normalize = (name: string) => {
    return name.toLowerCase().replace(/\.[^/.]+$/, "");
  };

  const name1 = normalize(filename1);
  const name2 = normalize(filename2);

  // Exact match after normalization
  if (name1 === name2) {
    return true;
  }

  // Check similarity score
  const similarity = calculateSimilarity(name1, name2);
  return similarity >= threshold;
}

// Check if files are exact duplicates by size
function areExactDuplicates(bytes1: number, bytes2: number): boolean {
  return bytes1 === bytes2;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dryRun = false, semanticThreshold = 0.85, keepNewest = true } = body;

    console.log("[DEDUPLICATE] Starting deduplication process");
    console.log("[DEDUPLICATE] Settings:", {
      dryRun,
      semanticThreshold,
      keepNewest,
    });

    // Get all files from the assistant
    const allFiles = await openai.files.list({ purpose: "assistants" });
    const files = allFiles.data;

    console.log(`[DEDUPLICATE] Analyzing ${files.length} files`);

    if (files.length < 2) {
      return NextResponse.json({
        totalDuplicates: 0,
        duplicateGroups: 0,
        removed: 0,
        message: "Not enough files to check for duplicates",
      });
    }

    // Find duplicate groups
    const duplicateGroups: DuplicateGroup[] = [];
    const processedIndices = new Set<number>();

    for (let i = 0; i < files.length; i++) {
      if (processedIndices.has(i)) continue;

      const file1 = files[i];
      const group: DuplicateGroup = {
        files: [
          {
            id: file1.id,
            filename: file1.filename,
            bytes: file1.bytes,
            created_at: file1.created_at,
          },
        ],
        similarity: 1.0,
      };

      for (let j = i + 1; j < files.length; j++) {
        if (processedIndices.has(j)) continue;

        const file2 = files[j];

        // Check for exact duplicates (same size)
        const isExactDuplicate = areExactDuplicates(file1.bytes, file2.bytes);

        // Check for similar filenames
        const isSimilarName = areFilenamesSimilar(
          file1.filename,
          file2.filename,
          semanticThreshold
        );

        // Calculate overall similarity
        const similarity = calculateSimilarity(file1.filename, file2.filename);

        if (isExactDuplicate || (isSimilarName && similarity >= semanticThreshold)) {
          group.files.push({
            id: file2.id,
            filename: file2.filename,
            bytes: file2.bytes,
            created_at: file2.created_at,
          });
          group.similarity = Math.min(group.similarity, similarity);
          processedIndices.add(j);
        }
      }

      // Only keep groups with actual duplicates
      if (group.files.length > 1) {
        duplicateGroups.push(group);
        processedIndices.add(i);
      }
    }

    console.log(`[DEDUPLICATE] Found ${duplicateGroups.length} duplicate groups`);

    // Count total duplicates (excluding one file to keep per group)
    const totalDuplicates = duplicateGroups.reduce(
      (sum, group) => sum + (group.files.length - 1),
      0
    );

    // Dry run - just report what would be deleted
    if (dryRun) {
      return NextResponse.json({
        totalDuplicates,
        duplicateGroups: duplicateGroups.length,
        removed: 0,
        dryRun: true,
        groups: duplicateGroups.map((group) => ({
          keepFile: keepNewest ? group.files[group.files.length - 1] : group.files[0],
          removeFiles: keepNewest ? group.files.slice(0, -1) : group.files.slice(1),
          similarity: group.similarity,
        })),
      });
    }

    // Actually remove duplicates
    let removedCount = 0;
    const removalResults: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const group of duplicateGroups) {
      // Sort by creation date to determine which to keep
      const sortedFiles = [...group.files].sort((a, b) => a.created_at - b.created_at);

      // Keep newest or oldest based on preference
      const filesToRemove = keepNewest ? sortedFiles.slice(0, -1) : sortedFiles.slice(1);

      console.log(`[DEDUPLICATE] Removing ${filesToRemove.length} duplicates from group`);

      for (const file of filesToRemove) {
        try {
          await openai.files.delete(file.id);
          removalResults.push({ id: file.id, success: true });
          removedCount++;
          console.log(`[DEDUPLICATE] Deleted duplicate: ${file.filename}`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          console.error(`[DEDUPLICATE] Failed to delete ${file.filename}:`, errorMsg);
          removalResults.push({ id: file.id, success: false, error: errorMsg });
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalDuplicates,
      duplicateGroups: duplicateGroups.length,
      removed: removedCount,
      details: removalResults,
      message: `Successfully removed ${removedCount} duplicate file(s) from ${duplicateGroups.length} group(s)`,
    });
  } catch (error) {
    console.error("[DEDUPLICATE] Error during deduplication:", error);
    return NextResponse.json(
      {
        error: "Failed to deduplicate files",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
