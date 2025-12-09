/**
 * Zeitgeist Questions Service
 *
 * Generates dynamic suggested questions based on recent activity in the knowledge base.
 * Runs as a daily cron job, analyzes new content, and caches the top 6 questions.
 *
 * Why "Zeitgeist"? It captures the "spirit of the time" - what's trending,
 * what's new, what users are likely asking about RIGHT NOW.
 */

import { createClient } from "@supabase/supabase-js";

// Types
export interface ZeitgeistQuestion {
  id: string;
  question: string;
  category: "recent_issue" | "trending_topic" | "new_feature" | "common_problem" | "documentation";
  relevanceScore: number;
  sourceIds: string[]; // The vectors that inspired this question
  generatedAt: string;
  expiresAt: string;
}

export interface ZeitgeistAnalysis {
  recentJiraTickets: number;
  recentEmails: number;
  recentDocuments: number;
  topTopics: string[];
  generatedQuestions: ZeitgeistQuestion[];
}

// Initialize Supabase client
function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials");
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Get recent vectors from the last N hours
 */
async function getRecentVectors(hoursAgo: number = 48): Promise<any[]> {
  const supabase = getSupabase();
  const cutoffDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("siam_vectors")
    .select("id, source_type, source_id, content, metadata, created_at")
    .eq("organization", "sony-music")
    .eq("app_under_test", "aoma")
    .gte("created_at", cutoffDate)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[Zeitgeist] Error fetching recent vectors:", error);
    return [];
  }

  return data || [];
}

/**
 * Get top vectors by source type for variety
 */
async function getTopicSamples(): Promise<any[]> {
  const supabase = getSupabase();

  // Get a mix of different source types
  const sourceTypes = ["jira", "knowledge", "email", "pdf"];
  const samples: any[] = [];

  for (const sourceType of sourceTypes) {
    const { data } = await supabase
      .from("siam_vectors")
      .select("id, source_type, source_id, content, metadata")
      .eq("organization", "sony-music")
      .eq("source_type", sourceType)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      samples.push(...data);
    }
  }

  return samples;
}

/**
 * Use LLM to generate zeitgeist questions from recent content
 */
async function generateQuestionsFromContent(vectors: any[]): Promise<ZeitgeistQuestion[]> {
  if (vectors.length === 0) {
    return getDefaultQuestions();
  }

  // Prepare content summary for LLM
  const contentSummary = vectors.slice(0, 30).map((v, i) => {
    const preview = (v.content || "").substring(0, 300);
    const title = v.metadata?.title || v.source_id || "Unknown";
    return `[${i + 1}] ${v.source_type}: ${title}\n${preview}...`;
  }).join("\n\n");

  // Use Groq for speed (or fall back to Gemini)
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are an expert at analyzing enterprise knowledge bases and generating helpful questions.
Given recent content from AOMA (Asset and Offering Management Application) at Sony Music, generate 6 questions that users would likely ask.

Rules:
- Questions should be practical and actionable
- Mix of "How do I..." and "What is..." questions
- Cover different topics (not all about the same thing)
- Questions should be answerable by the knowledge base
- Return ONLY valid JSON array, no markdown

Example output:
[
  {"question": "How do I link a product to a master in AOMA?", "category": "common_problem", "relevanceScore": 0.95},
  {"question": "What new features are in the latest release?", "category": "new_feature", "relevanceScore": 0.9}
]`
          },
          {
            role: "user",
            content: `Here's the recent content from our knowledge base:\n\n${contentSummary}\n\nGenerate 6 suggested questions.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error("[Zeitgeist] Groq API error:", response.status);
      return getDefaultQuestions();
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("[Zeitgeist] Could not parse JSON from LLM response");
      return getDefaultQuestions();
    }

    const questions = JSON.parse(jsonMatch[0]);
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    return questions.slice(0, 6).map((q: any, i: number) => ({
      id: `zeitgeist-${now.getTime()}-${i}`,
      question: q.question,
      category: q.category || "trending_topic",
      relevanceScore: q.relevanceScore || 0.8,
      sourceIds: vectors.slice(0, 5).map((v: any) => v.id),
      generatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    }));
  } catch (error) {
    console.error("[Zeitgeist] Error generating questions:", error);
    return getDefaultQuestions();
  }
}

/**
 * Default questions if generation fails
 * These are optimized for:
 * 1. High vector search similarity (tested 59-75%)
 * 2. Good Mermaid diagram potential
 * 3. Real user value
 */
function getDefaultQuestions(): ZeitgeistQuestion[] {
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return [
    {
      id: "default-1",
      question: "What are the steps to link a product to a master in AOMA?",
      category: "common_problem",
      relevanceScore: 0.69, // Tested: 68.6%
      sourceIds: [],
      generatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    },
    {
      id: "default-2",
      question: "What new features are in AOMA 2.116.0?",
      category: "new_feature",
      relevanceScore: 0.66, // Tested: 65.7% - Shows recency!
      sourceIds: [],
      generatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    },
    {
      id: "default-3",
      question: "What is the quality check process for videos submitted to AOMA?",
      category: "documentation",
      relevanceScore: 0.59, // Tested: 58.6%
      sourceIds: [],
      generatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    },
    {
      id: "default-4",
      question: "What permissions do I need for the Unified Submission Tool?",
      category: "common_problem",
      relevanceScore: 0.49, // Tested: 49.1%
      sourceIds: [],
      generatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    },
    {
      id: "default-5",
      question: "What's the difference between Full Master, Side, and Track Linking?",
      category: "documentation",
      relevanceScore: 0.43, // Tested: 43.1% - Great for comparison diagram
      sourceIds: [],
      generatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    },
    {
      id: "default-6",
      question: "What are the different asset types in AOMA?",
      category: "documentation",
      relevanceScore: 0.59, // Tested: 58.6% - Great for hierarchy diagram
      sourceIds: [],
      generatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    },
  ];
}

/**
 * Save zeitgeist questions to Supabase cache
 */
async function saveToCache(questions: ZeitgeistQuestion[]): Promise<void> {
  const supabase = getSupabase();

  // Upsert to a simple key-value cache table
  const { error } = await supabase
    .from("app_cache")
    .upsert({
      key: "zeitgeist_questions",
      value: JSON.stringify(questions),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "key"
    });

  if (error) {
    console.error("[Zeitgeist] Error saving to cache:", error);
  }
}

/**
 * Load zeitgeist questions from cache
 */
export async function getZeitgeistQuestions(): Promise<ZeitgeistQuestion[]> {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("app_cache")
      .select("value, updated_at")
      .eq("key", "zeitgeist_questions")
      .single();

    if (error || !data) {
      console.log("[Zeitgeist] No cached questions, returning defaults");
      return getDefaultQuestions();
    }

    const questions = JSON.parse(data.value) as ZeitgeistQuestion[];

    // Check if expired (older than 25 hours to allow for cron timing)
    const updatedAt = new Date(data.updated_at);
    const hoursOld = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60);

    if (hoursOld > 25) {
      console.log("[Zeitgeist] Cache expired, returning defaults");
      return getDefaultQuestions();
    }

    return questions;
  } catch (error) {
    console.error("[Zeitgeist] Error loading from cache:", error);
    return getDefaultQuestions();
  }
}

/**
 * Main function: Generate and cache zeitgeist questions
 * Called by daily cron job
 */
export async function refreshZeitgeistQuestions(): Promise<ZeitgeistAnalysis> {
  console.log("[Zeitgeist] Starting daily refresh...");

  // Get recent vectors
  const recentVectors = await getRecentVectors(48);
  const samples = await getTopicSamples();

  // Combine and deduplicate
  const allVectors = [...recentVectors, ...samples];
  const uniqueVectors = Array.from(
    new Map(allVectors.map(v => [v.id, v])).values()
  );

  // Count by type
  const jiraCount = uniqueVectors.filter(v => v.source_type === "jira").length;
  const emailCount = uniqueVectors.filter(v => v.source_type === "email").length;
  const docCount = uniqueVectors.filter(v => ["knowledge", "pdf"].includes(v.source_type)).length;

  console.log(`[Zeitgeist] Found ${uniqueVectors.length} vectors (${jiraCount} Jira, ${emailCount} email, ${docCount} docs)`);

  // Generate questions
  const questions = await generateQuestionsFromContent(uniqueVectors);

  // Save to cache
  await saveToCache(questions);

  console.log("[Zeitgeist] Refresh complete. Generated questions:");
  questions.forEach((q, i) => console.log(`  ${i + 1}. ${q.question}`));

  return {
    recentJiraTickets: jiraCount,
    recentEmails: emailCount,
    recentDocuments: docCount,
    topTopics: questions.map(q => q.category),
    generatedQuestions: questions,
  };
}

// Singleton for easy import
class ZeitgeistService {
  private static instance: ZeitgeistService;

  private constructor() {}

  static getInstance(): ZeitgeistService {
    if (!ZeitgeistService.instance) {
      ZeitgeistService.instance = new ZeitgeistService();
    }
    return ZeitgeistService.instance;
  }

  async getQuestions(): Promise<ZeitgeistQuestion[]> {
    return getZeitgeistQuestions();
  }

  async refresh(): Promise<ZeitgeistAnalysis> {
    return refreshZeitgeistQuestions();
  }
}

export const zeitgeistService = ZeitgeistService.getInstance();
