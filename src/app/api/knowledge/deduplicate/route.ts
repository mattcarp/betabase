/**
 * Supabase Knowledge Base Deduplication API
 * 
 * Finds and removes duplicate documents from the siam_vectors table
 * using content similarity and source_id matching.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { DEFAULT_APP_CONTEXT } from "@/lib/supabase";

interface DuplicateGroup {
  keep: {
    id: string;
    source_id: string;
    content_preview: string;
    created_at: string;
  };
  duplicates: Array<{
    id: string;
    source_id: string;
    content_preview: string;
    created_at: string;
    similarity?: number;
  }>;
  reason: string;
}

// POST: Find and optionally remove duplicates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dryRun = true, // Default to dry run for safety
      keepNewest = true,
      contentSimilarityThreshold = 0.95, // 95% content similarity
      organization = DEFAULT_APP_CONTEXT.organization,
      division = DEFAULT_APP_CONTEXT.division,
      app_under_test = DEFAULT_APP_CONTEXT.app_under_test,
      sourceType, // Optional: filter by source type
    } = body;

    console.log("[DEDUPLICATE] Starting deduplication process");
    console.log("[DEDUPLICATE] Settings:", {
      dryRun,
      keepNewest,
      contentSimilarityThreshold,
      organization,
      division,
      app_under_test,
      sourceType,
    });

    // Build query
    let query = supabaseAdmin
      .from("siam_vectors")
      .select("id, source_id, content, source_type, metadata, created_at")
      .eq("organization", organization)
      .eq("division", division)
      .eq("app_under_test", app_under_test);

    if (sourceType) {
      query = query.eq("source_type", sourceType);
    }

    const { data: vectors, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch vectors: ${error.message}`);
    }

    if (!vectors || vectors.length < 2) {
      return NextResponse.json({
        totalDuplicates: 0,
        duplicateGroups: 0,
        removed: 0,
        message: "Not enough documents to check for duplicates",
      });
    }

    console.log(`[DEDUPLICATE] Analyzing ${vectors.length} documents`);

    // Find duplicates by exact source_id match and content similarity
    const duplicateGroups: DuplicateGroup[] = [];
    const processedIds = new Set<string>();

    // Group 1: Find exact source_id duplicates (excluding timestamp prefix)
    const sourceIdGroups = new Map<string, typeof vectors>();
    
    for (const vec of vectors) {
      // Normalize source_id by removing upload timestamp prefix
      const normalizedSourceId = vec.source_id
        .replace(/^upload-\d+-/, '') // Remove upload-timestamp- prefix
        .toLowerCase();
      
      const group = sourceIdGroups.get(normalizedSourceId) || [];
      group.push(vec);
      sourceIdGroups.set(normalizedSourceId, group);
    }

    // Find groups with duplicates
    for (const [sourceId, group] of sourceIdGroups) {
      if (group.length > 1) {
        // Sort by date
        group.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        const keepIndex = keepNewest ? group.length - 1 : 0;
        const keepDoc = group[keepIndex];
        const removeDocs = group.filter((_, i) => i !== keepIndex);

        duplicateGroups.push({
          keep: {
            id: keepDoc.id,
            source_id: keepDoc.source_id,
            content_preview: keepDoc.content.substring(0, 100) + "...",
            created_at: keepDoc.created_at,
          },
          duplicates: removeDocs.map(d => ({
            id: d.id,
            source_id: d.source_id,
            content_preview: d.content.substring(0, 100) + "...",
            created_at: d.created_at,
          })),
          reason: `Duplicate source file: ${sourceId}`,
        });

        // Mark all as processed
        group.forEach(d => processedIds.add(d.id));
      }
    }

    // Group 2: Find near-duplicate content (very similar content)
    const unprocessed = vectors.filter(v => !processedIds.has(v.id));
    
    for (let i = 0; i < unprocessed.length; i++) {
      const doc1 = unprocessed[i];
      if (processedIds.has(doc1.id)) continue;

      const similarDocs: Array<typeof doc1 & { similarity: number }> = [];

      for (let j = i + 1; j < unprocessed.length; j++) {
        const doc2 = unprocessed[j];
        if (processedIds.has(doc2.id)) continue;

        // Quick length-based filter (documents must be within 20% length)
        const lenRatio = Math.min(doc1.content.length, doc2.content.length) / 
                        Math.max(doc1.content.length, doc2.content.length);
        
        if (lenRatio < 0.8) continue;

        // Calculate content similarity using character overlap
        const similarity = calculateContentSimilarity(doc1.content, doc2.content);
        
        if (similarity >= contentSimilarityThreshold) {
          similarDocs.push({ ...doc2, similarity });
          processedIds.add(doc2.id);
        }
      }

      if (similarDocs.length > 0) {
        const allDocs = [doc1, ...similarDocs];
        allDocs.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        const keepIndex = keepNewest ? allDocs.length - 1 : 0;
        const keepDoc = allDocs[keepIndex];
        const removeDocs = allDocs.filter((_, i) => i !== keepIndex);

        duplicateGroups.push({
          keep: {
            id: keepDoc.id,
            source_id: keepDoc.source_id,
            content_preview: keepDoc.content.substring(0, 100) + "...",
            created_at: keepDoc.created_at,
          },
          duplicates: removeDocs.map(d => ({
            id: d.id,
            source_id: d.source_id,
            content_preview: d.content.substring(0, 100) + "...",
            created_at: d.created_at,
            similarity: 'similarity' in d ? (d as any).similarity : undefined,
          })),
          reason: `Near-duplicate content (${Math.round((similarDocs[0]?.similarity || 1) * 100)}% similar)`,
        });

        processedIds.add(doc1.id);
      }
    }

    const totalDuplicates = duplicateGroups.reduce(
      (sum, g) => sum + g.duplicates.length, 0
    );

    console.log(`[DEDUPLICATE] Found ${totalDuplicates} duplicates in ${duplicateGroups.length} groups`);

    // Dry run - just report
    if (dryRun) {
      return NextResponse.json({
        totalDuplicates,
        duplicateGroups: duplicateGroups.length,
        removed: 0,
        dryRun: true,
        groups: duplicateGroups,
        message: `Found ${totalDuplicates} duplicate(s) in ${duplicateGroups.length} group(s). Set dryRun=false to remove.`,
      });
    }

    // Actually remove duplicates
    let removedCount = 0;
    const removalResults: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const group of duplicateGroups) {
      for (const dup of group.duplicates) {
        try {
          const { error: deleteError } = await supabaseAdmin
            .from("siam_vectors")
            .delete()
            .eq("id", dup.id);

          if (deleteError) {
            throw deleteError;
          }

          removalResults.push({ id: dup.id, success: true });
          removedCount++;
          console.log(`[DEDUPLICATE] Deleted: ${dup.source_id}`);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Unknown error";
          console.error(`[DEDUPLICATE] Failed to delete ${dup.id}:`, errorMsg);
          removalResults.push({ id: dup.id, success: false, error: errorMsg });
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalDuplicates,
      duplicateGroups: duplicateGroups.length,
      removed: removedCount,
      details: removalResults,
      message: `Removed ${removedCount} duplicate(s) from ${duplicateGroups.length} group(s)`,
    });
  } catch (error) {
    console.error("[DEDUPLICATE] Error:", error);
    return NextResponse.json(
      {
        error: "Deduplication failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET: Quick check for duplicates (dry run)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const organization = searchParams.get("organization") || DEFAULT_APP_CONTEXT.organization;
  const division = searchParams.get("division") || DEFAULT_APP_CONTEXT.division;
  const app_under_test = searchParams.get("app_under_test") || DEFAULT_APP_CONTEXT.app_under_test;
  const sourceType = searchParams.get("sourceType") || undefined;

  // Create a mock request body for the POST handler
  const mockBody = {
    dryRun: true,
    organization,
    division,
    app_under_test,
    sourceType,
  };

  // Call the POST handler internally
  const postRequest = new NextRequest(request.url, {
    method: "POST",
    body: JSON.stringify(mockBody),
    headers: { "Content-Type": "application/json" },
  });

  return POST(postRequest);
}

/**
 * Calculate content similarity using character n-gram overlap
 * This is faster than full text comparison for large documents
 */
function calculateContentSimilarity(text1: string, text2: string): number {
  // Normalize texts
  const norm1 = text1.toLowerCase().replace(/\s+/g, ' ').trim();
  const norm2 = text2.toLowerCase().replace(/\s+/g, ' ').trim();

  // Quick exact match check
  if (norm1 === norm2) return 1.0;

  // Use word-level similarity for faster comparison
  const words1 = new Set(norm1.split(' ').filter(w => w.length > 2));
  const words2 = new Set(norm2.split(' ').filter(w => w.length > 2));

  if (words1.size === 0 && words2.size === 0) return 1.0;
  if (words1.size === 0 || words2.size === 0) return 0.0;

  let intersection = 0;
  for (const word of words1) {
    if (words2.has(word)) intersection++;
  }

  // Jaccard similarity
  const union = words1.size + words2.size - intersection;
  return intersection / union;
}




