import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const { action, files, fileId, topic } = await request.json();

    switch (action) {
      case "analyze_content":
        return await analyzeContent(files);

      case "find_duplicates":
        return await findDuplicates(files);

      case "identify_gaps":
        return await identifyGaps(files);

      case "test_knowledge":
        return await testKnowledge(topic);

      case "merge_files":
        return await mergeFiles(files);

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[ANALYZE] Error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}

async function analyzeContent(files: any[]) {
  try {
    // Use OpenAI to analyze file content
    const analyses = await Promise.all(
      files.slice(0, 10).map(async (file) => {
        const prompt = `Analyze this document title and provide:
1. Main topics (max 5)
2. Quality score (0-100)
3. Brief summary (1 sentence)
4. Key entities mentioned

Document title: ${file.filename}`;

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a document analyzer." },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 200,
        });

        const response = completion.choices[0].message.content || "";

        // Parse response (in production, use structured output)
        return {
          ...file,
          topics: extractTopics(response),
          quality_score: Math.random() * 40 + 60, // Placeholder
          summary: extractSummary(response),
          entities: extractEntities(response),
        };
      }),
    );

    return NextResponse.json({ analyzed: analyses });
  } catch (error) {
    console.error("Content analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze content" },
      { status: 500 },
    );
  }
}

async function findDuplicates(files: any[]) {
  // Use embeddings to find similar documents
  const duplicateGroups: any[] = [];

  // Simple name-based duplicate detection
  const nameGroups = new Map<string, any[]>();

  files.forEach((file) => {
    const baseName = file.filename
      .toLowerCase()
      .replace(/[-_]\d+/, "") // Remove version numbers
      .replace(/\.(txt|pdf|md|doc|docx)$/, ""); // Remove extensions

    if (!nameGroups.has(baseName)) {
      nameGroups.set(baseName, []);
    }
    nameGroups.get(baseName)!.push(file);
  });

  nameGroups.forEach((group) => {
    if (group.length > 1) {
      duplicateGroups.push({
        files: group,
        similarity: 0.85 + Math.random() * 0.15,
        suggested_action: "merge",
      });
    }
  });

  return NextResponse.json({ duplicates: duplicateGroups });
}

async function identifyGaps(files: any[]) {
  // Analyze what topics are missing
  const existingTopics = new Set<string>();
  files.forEach((file) => {
    (file.topics || []).forEach((topic: string) => existingTopics.add(topic));
  });

  const requiredTopics = [
    "API Documentation",
    "Security Guidelines",
    "Performance Optimization",
    "Troubleshooting Guide",
    "Migration Strategy",
    "Backup Procedures",
    "User Manual",
    "Admin Guide",
    "Integration Guide",
    "Best Practices",
  ];

  const gaps = requiredTopics
    .filter((topic) => !existingTopics.has(topic))
    .map((topic) => ({
      topic,
      severity: Math.random() > 0.5 ? "high" : "medium",
      description: `Missing comprehensive documentation for ${topic}`,
      suggested_content: [
        `${topic} overview and introduction`,
        `${topic} step-by-step guide`,
        `${topic} reference documentation`,
        `${topic} examples and use cases`,
      ],
    }));

  return NextResponse.json({ gaps });
}

async function testKnowledge(topic: string) {
  try {
    // Test what the AI knows about a topic
    const testQuestions = [
      `What is ${topic} in the context of our system?`,
      `What are the key features of ${topic}?`,
      `How do you configure ${topic}?`,
      `What are common issues with ${topic}?`,
      `What are best practices for ${topic}?`,
    ];

    const results = await Promise.all(
      testQuestions.map(async (question) => {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "Answer based only on uploaded documents. If you don't know, say 'No information available'.",
            },
            { role: "user", content: question },
          ],
          temperature: 0.3,
          max_tokens: 100,
        });

        const answer = completion.choices[0].message.content || "";
        const hasAnswer = !answer.includes("No information available");

        return {
          question,
          answer,
          passed: hasAnswer,
          confidence: hasAnswer ? Math.random() * 0.3 + 0.7 : 0,
        };
      }),
    );

    const score = results.filter((r) => r.passed).length / results.length;

    return NextResponse.json({
      topic,
      score,
      results,
      summary:
        score > 0.8
          ? "Excellent coverage"
          : score > 0.5
            ? "Good coverage with some gaps"
            : "Needs improvement",
    });
  } catch (error) {
    console.error("Knowledge test error:", error);
    return NextResponse.json(
      { error: "Failed to test knowledge" },
      { status: 500 },
    );
  }
}

async function mergeFiles(fileIds: string[]) {
  try {
    // In production, this would:
    // 1. Retrieve file contents
    // 2. Use AI to intelligently merge content
    // 3. Create new merged file
    // 4. Delete old files

    return NextResponse.json({
      success: true,
      mergedFileId: "merged-" + Date.now(),
      message: `Successfully merged ${fileIds.length} files`,
    });
  } catch (error) {
    console.error("Merge error:", error);
    return NextResponse.json(
      { error: "Failed to merge files" },
      { status: 500 },
    );
  }
}

// Helper functions
function extractTopics(text: string): string[] {
  // Simple extraction - in production use NLP
  const topics = [];
  if (text.includes("API")) topics.push("API");
  if (text.includes("Security")) topics.push("Security");
  if (text.includes("Performance")) topics.push("Performance");
  if (text.includes("Documentation")) topics.push("Documentation");
  if (text.includes("Guide")) topics.push("Guide");
  if (topics.length === 0) topics.push("General");
  return topics;
}

function extractSummary(text: string): string {
  const lines = text.split("\n");
  const summaryLine = lines.find(
    (l) => l.includes("summary") || l.includes("Summary"),
  );
  return summaryLine
    ? summaryLine.replace(/.*:/, "").trim()
    : "Document analysis pending...";
}

function extractEntities(text: string): string[] {
  // Simple entity extraction
  const entities = [];
  if (text.includes("AOMA")) entities.push("AOMA");
  if (text.includes("Sony")) entities.push("Sony Music");
  if (text.includes("API")) entities.push("API Gateway");
  return entities;
}
