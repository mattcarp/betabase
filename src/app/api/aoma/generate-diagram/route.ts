import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from 'zod/v3';

// Allow up to 30 seconds for diagram generation
export const maxDuration = 30;

// Input validation
const DiagramRequestSchema = z.object({
  content: z.string().min(1).max(10000),
  diagramType: z.enum([
    "flowchart", 
    "sequence", 
    "classDiagram", 
    "stateDiagram", 
    "erDiagram",
    "journey",
    "gantt",
    "auto"
  ]).default("auto"),
  context: z.string().max(5000).optional(),
});

// Mermaid generation prompt - specialized for AOMA/digital asset workflows
const MERMAID_SYSTEM_PROMPT = `You are an expert at creating Mermaid.js diagrams. Your diagrams are:
- Clear and well-organized with logical flow
- Use appropriate diagram types (flowchart, sequence, state, etc.)
- Include helpful labels and descriptions
- Use appropriate styling with subgraphs for grouping
- Include emoji icons for visual clarity (📋, 📝, ⬆️, ⚙️, 💾, ✅, ❌, etc.)

IMPORTANT RULES:
1. Output ONLY valid Mermaid syntax - no markdown code blocks, no explanation
2. Use flowchart TD (top-down) or LR (left-right) for process flows
3. CRITICAL: Always use double quotes around labels containing emojis, spaces, or special characters (e.g., NodeID["Label 🚀"] or subgraph "Group Name").
4. CRITICAL: Subgraphs do NOT use square brackets [ ] for titles. Use quotes: subgraph "Title Name".
5. CRITICAL: NEVER use HTML tags like <br/>, <b>, <i>, etc. in labels. Use plain text only. For line breaks, you may use literal \\n but prefer keeping labels single-line.
6. Style subgraphs with fill and stroke colors for visual distinction
7. Use meaningful node IDs (not just A, B, C)
8. Include decision points with clear yes/no or pass/fail paths
9. End with style declarations for a polished dark-theme appearance
10. Keep labels concise - if a label is getting too long, split into multiple connected nodes instead`;

export async function POST(req: Request) {
  try {
    console.log("[API] ========== POST /api/aoma/generate-diagram REQUEST START ==========");

    // Check if auth is bypassed for development
    const bypassAuth =
      process.env.NEXT_PUBLIC_BYPASS_AUTH === "true" || process.env.NODE_ENV === "development";

    if (!bypassAuth) {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return new Response(JSON.stringify({ error: "Service configuration error" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }

      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch {
                // Ignore in Server Component
              }
            },
          },
        }
      );

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        return new Response(JSON.stringify({ error: "Authentication required" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Validate API key
    if (!process.env.GOOGLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Google AI API key not configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request
    const body = await req.json();
    const validation = DiagramRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request", details: validation.error.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { content, diagramType, context } = validation.data;

    // Initialize Gemini provider
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // Build the prompt for Mermaid generation
    const userPrompt = `Based on this content, create a clear Mermaid.js diagram:

CONTENT:
${content}

${context ? `ADDITIONAL CONTEXT:\n${context}` : ""}

${diagramType !== "auto" ? `DIAGRAM TYPE: ${diagramType}` : "Choose the most appropriate diagram type for this content."}

Create a comprehensive, well-styled Mermaid diagram that visualizes this information clearly.
Remember: Output ONLY valid Mermaid syntax, no code blocks or explanations.`;

    console.log(`[API] Generating Mermaid diagram with Gemini 3 Pro`);
    console.log(`[API] Content preview: ${content.substring(0, 100)}...`);
    console.log(`[API] Diagram type: ${diagramType}`);

    // Generate Mermaid code using Gemini 3 Pro (text model, not image)
    const result = await generateText({
      model: google("gemini-3-flash-preview"),
      system: MERMAID_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.3, // Lower temperature for more consistent diagram syntax
      maxTokens: 2000,
    });

    // Extract and clean the Mermaid code
    let mermaidCode = result.text.trim();
    
    // Remove any accidental markdown code blocks
    if (mermaidCode.startsWith("```mermaid")) {
      mermaidCode = mermaidCode.replace(/^```mermaid\n?/, "").replace(/\n?```$/, "");
    }
    if (mermaidCode.startsWith("```")) {
      mermaidCode = mermaidCode.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }
    
    // 🐛 FIX: Remove HTML tags that Mermaid doesn't support
    // Replace <br/>, <br>, <b>, <i>, etc. with plain text equivalents
    mermaidCode = mermaidCode
      .replace(/<br\s*\/?>/gi, ' ')  // <br/> → space
      .replace(/<b>(.*?)<\/b>/gi, '$1')  // <b>text</b> → text
      .replace(/<i>(.*?)<\/i>/gi, '$1')  // <i>text</i> → text
      .replace(/<strong>(.*?)<\/strong>/gi, '$1')
      .replace(/<em>(.*?)<\/em>/gi, '$1')
      .replace(/<[^>]+>/g, '');  // Remove any other HTML tags
    
    console.log("[API] Sanitized HTML tags from Mermaid code");

    // Validate that we got valid-looking Mermaid syntax
    const validDiagramStarters = [
      "flowchart", "graph", "sequenceDiagram", "classDiagram", 
      "stateDiagram", "erDiagram", "journey", "gantt", "pie", "mindmap"
    ];
    const startsWithValid = validDiagramStarters.some(starter => 
      mermaidCode.toLowerCase().startsWith(starter.toLowerCase())
    );

    if (!startsWithValid) {
      console.warn("[API] Generated content doesn't look like valid Mermaid, attempting recovery");
      // Try to extract Mermaid from the response if it's embedded
      const mermaidMatch = mermaidCode.match(/(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|mindmap)[\s\S]*/i);
      if (mermaidMatch) {
        mermaidCode = mermaidMatch[0];
      } else {
        console.error("[API] Could not extract valid Mermaid syntax");
        return new Response(
          JSON.stringify({
            error: "Failed to generate valid Mermaid diagram",
            rawOutput: result.text.substring(0, 500),
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`[API] Mermaid diagram generated successfully (${mermaidCode.length} chars)`);
    console.log(`[API] Diagram preview: ${mermaidCode.substring(0, 200)}...`);

    // Return the Mermaid code
    return new Response(
      JSON.stringify({
        success: true,
        mermaidCode,
        diagramType: diagramType === "auto" 
          ? mermaidCode.split(/\s+/)[0].toLowerCase() 
          : diagramType,
        tokensUsed: result.usage?.totalTokens || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[API] Mermaid diagram generation error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        error: "Failed to generate Mermaid diagram",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ready",
      endpoint: "/api/aoma/generate-diagram",
      description: "Generates Mermaid.js diagrams from content using Gemini 3 Pro",
      supportedTypes: ["flowchart", "sequence", "classDiagram", "stateDiagram", "erDiagram", "journey", "gantt", "auto"],
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

