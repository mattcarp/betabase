/**
 * Infographic Generation Service - Nano Banana Pro Integration
 *
 * Uses Google's Nano Banana Pro (Gemini 3 Pro Image) to generate
 * beautiful infographics for RAG responses.
 *
 * Key features:
 * - Workflow diagrams for "How do I..." questions
 * - Process flows for step-by-step explanations
 * - Comparison charts for "What's the difference..." questions
 * - Educational explainers for complex topics
 *
 * The service runs in parallel with text generation:
 * 1. User asks question
 * 2. Text streams immediately (Gemini 2.5 Flash)
 * 3. Infographic generates in background (Nano Banana Pro)
 * 4. Infographic appears when ready (user can dismiss if not interested)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Types
export interface InfographicRequest {
  question: string;
  answer: string; // The RAG answer to visualize
  type: InfographicType;
  aspectRatio?: AspectRatio;
  resolution?: Resolution;
}

export interface InfographicResult {
  success: boolean;
  imageData?: string; // Base64 encoded PNG
  mimeType?: string;
  error?: string;
  generationTimeMs?: number;
  prompt?: string; // The prompt used (for debugging)
}

export type InfographicType =
  | "workflow" // Step-by-step process
  | "comparison" // Side-by-side comparison
  | "hierarchy" // Tree/org chart structure
  | "explainer" // Educational infographic
  | "timeline" // Sequential events
  | "checklist"; // List with checkboxes

export type AspectRatio =
  | "1:1"
  | "2:3"
  | "3:2"
  | "3:4"
  | "4:3"
  | "4:5"
  | "5:4"
  | "9:16"
  | "16:9"
  | "21:9";

export type Resolution = "1K" | "2K" | "4K";

// Detection patterns for different infographic types
// CONSERVATIVE: Only trigger for queries that clearly benefit from visualization
// Avoid false positives - better to skip an infographic than show an irrelevant one
const INFOGRAPHIC_PATTERNS: Record<InfographicType, RegExp[]> = {
  workflow: [
    // Only match explicit multi-step process requests
    /step.by.step.*(process|guide|instructions)/i,
    /workflow\s+(for|to|diagram)/i,
    /process\s+flow/i,
    /how\s+does\s+.+\s+process\s+/i, // "How does AOMA process assets"
    /walk\s+me\s+through/i,
    /end.to.end\s+(process|flow)/i,
  ],
  comparison: [
    // Only match explicit comparisons between named items
    /difference\s+between\s+\w+\s+and\s+\w+/i, // "difference between X and Y"
    /compare\s+\w+\s+(to|with|and|vs)/i, // "compare X to Y"
    /\w+\s+vs\.?\s+\w+/i, // "X vs Y"
    /pros\s+and\s+cons\s+of/i,
    /which\s+is\s+better.+or\s+/i, // "which is better X or Y"
  ],
  hierarchy: [
    // Only match explicit structure/organization requests
    /organizational?\s+structure/i,
    /hierarchy\s+of/i,
    /levels\s+of\s+\w+\s+in/i,
    /storage\s+tiers/i,
    /asset\s+type\s+hierarchy/i,
  ],
  explainer: [
    // VERY restrictive - only complex architectural concepts
    /architecture\s+of/i,
    /system\s+design/i,
    /how\s+.+\s+works\s+together/i,
    /relationship\s+between\s+.+\s+and\s+/i,
    /explain\s+the\s+.+\s+architecture/i,
  ],
  timeline: [
    // Only match explicit timeline/roadmap requests
    /timeline\s+(of|for)/i,
    /roadmap\s+(for|to)/i,
    /release\s+schedule/i,
    /planned\s+releases/i,
    /version\s+history/i,
    /evolution\s+of\s+\w+\s+over/i,
  ],
  checklist: [
    // Only match explicit checklist/requirements requests
    /checklist\s+(for|to)/i,
    /prerequisites\s+(for|to)/i,
    /requirements\s+(for|to)\s+(set|deploy|install|configure)/i,
    /what\s+do\s+i\s+need\s+to\s+(set\s+up|install|configure|deploy)/i,
  ],
};

/**
 * Detect if a question would benefit from an infographic
 */
export function detectInfographicType(question: string): InfographicType | null {
  for (const [type, patterns] of Object.entries(INFOGRAPHIC_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(question)) {
        return type as InfographicType;
      }
    }
  }
  return null;
}

/**
 * Generate an infographic prompt based on the question and answer
 */
function buildInfographicPrompt(
  question: string,
  answer: string,
  type: InfographicType
): string {
  const baseStyle = `
Create a STUNNING, HIGH-END infographic that looks like it was designed by a top-tier design agency.

VISUAL STYLE:
- Premium, sophisticated aesthetic with depth and dimension
- Rich gradient backgrounds (dark blues to teals, or deep purples to magentas)
- Glassmorphism effects with subtle transparency and blur
- Soft glowing accents and subtle shadows for depth
- Modern sans-serif typography with excellent hierarchy
- Smooth, elegant icons and illustrations
- Professional color palette: deep navy (#1a1a2e), electric teal (#00d4ff), soft purple (#7c3aed)

DESIGN PRINCIPLES:
- Clean whitespace and breathing room
- Perfect alignment and visual balance
- Subtle gradients and color transitions
- Modern, minimalist icons (not clipart)
- Text should be crisp, readable, and beautifully typeset
- Include subtle decorative elements (dots, lines, geometric shapes)

Do NOT include watermarks, logos, or stock photo elements.
`;

  const typePrompts: Record<InfographicType, string> = {
    workflow: `
${baseStyle}
Create a PREMIUM WORKFLOW DIAGRAM showing the step-by-step process.
- Elegant numbered steps with glowing connectors
- Each step in a beautiful card with soft shadows
- Smooth curved flow arrows with gradient colors
- Modern icons for each step
- Visual progression from start (lighter) to finish (darker/richer)
- Add subtle background patterns or geometric decorations
`,
    comparison: `
${baseStyle}
Create a SOPHISTICATED COMPARISON CHART showing the differences.
- Sleek column layout with glassmorphism cards
- Beautiful gradient headers for each option
- Elegant checkmarks and indicators (not basic shapes)
- Color-coded features with subtle highlighting
- Clean dividing lines with soft glows
- Make it look like a premium product comparison
`,
    hierarchy: `
${baseStyle}
Create an ELEGANT HIERARCHY DIAGRAM showing the structure.
- Modern tree layout with curved connecting lines
- Each node as a beautiful card with depth
- Gradient color progression from top to bottom
- Sophisticated icons representing each type
- Subtle animations implied through design (flow lines, etc.)
- Professional organizational chart aesthetic
`,
    explainer: `
${baseStyle}
Create a BEAUTIFUL EDUCATIONAL INFOGRAPHIC explaining the concept.
- Magazine-quality layout with visual sections
- Hero graphics and illustrations
- Pull quotes and highlighted key facts
- Modern iconography throughout
- Rich visual storytelling
- Looks like it belongs in a premium annual report
`,
    timeline: `
${baseStyle}
Create a STUNNING TIMELINE showing the sequence of events.
- Elegant horizontal or diagonal timeline with glow effects
- Beautiful milestone markers with depth
- Gradient progression through time
- Modern date badges and event cards
- Subtle connecting elements and decorations
- Premium event announcement aesthetic
`,
    checklist: `
${baseStyle}
Create a PREMIUM CHECKLIST infographic.
- Elegant checkbox designs with soft shadows
- Grouped sections with beautiful headers
- Modern icons for each category
- Color-coded priority or category indicators
- Clean card-based layout
- Looks like a high-end onboarding guide
`,
  };

  // Truncate answer to avoid token limits (keep first 2000 chars)
  const truncatedAnswer = answer.length > 2000 ? answer.substring(0, 2000) + "..." : answer;

  return `
${typePrompts[type]}

QUESTION: ${question}

INFORMATION TO VISUALIZE:
${truncatedAnswer}

Generate a single, clear infographic that helps users understand this information at a glance.
Aspect ratio: 16:9 (landscape, suitable for embedding in chat)
`;
}

/**
 * Initialize the Gemini client for Nano Banana Pro
 */
function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("[Infographic] Missing Gemini API key");
    return null;
  }

  return new GoogleGenerativeAI(apiKey);
}

/**
 * Generate an infographic using Nano Banana Pro
 */
export async function generateInfographic(
  request: InfographicRequest
): Promise<InfographicResult> {
  const startTime = Date.now();

  try {
    const client = getGeminiClient();
    if (!client) {
      return { success: false, error: "Gemini client not initialized" };
    }

    // Use Nano Banana Pro (Gemini 3 Pro Image)
    const model = client.getGenerativeModel({
      model: "gemini-3-pro-image-preview",
      generationConfig: {
        // @ts-expect-error - responseModalities is valid but not in types yet
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    const prompt = buildInfographicPrompt(request.question, request.answer, request.type);

    console.log(`[Infographic] Generating ${request.type} infographic...`);

    const result = await model.generateContent(prompt);
    const response = result.response;

    // Extract image from response parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      // @ts-expect-error - inlineData exists on image parts
      if (part.inlineData) {
        // @ts-expect-error - accessing inlineData properties
        const { data, mimeType } = part.inlineData;

        return {
          success: true,
          imageData: data,
          mimeType: mimeType || "image/png",
          generationTimeMs: Date.now() - startTime,
          prompt,
        };
      }
    }

    // No image in response
    return {
      success: false,
      error: "No image generated in response",
      generationTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error("[Infographic] Generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      generationTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Check if infographic generation is available
 */
export function isInfographicAvailable(): boolean {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  return !!apiKey;
}

// Singleton service class
class InfographicService {
  private static instance: InfographicService;

  private constructor() {}

  static getInstance(): InfographicService {
    if (!InfographicService.instance) {
      InfographicService.instance = new InfographicService();
    }
    return InfographicService.instance;
  }

  /**
   * Determine if a question should get an infographic
   */
  shouldGenerateInfographic(question: string): { should: boolean; type: InfographicType | null } {
    const type = detectInfographicType(question);
    return {
      should: type !== null,
      type,
    };
  }

  /**
   * Generate infographic (call this in parallel with text generation)
   */
  async generate(request: InfographicRequest): Promise<InfographicResult> {
    return generateInfographic(request);
  }

  /**
   * Check availability
   */
  isAvailable(): boolean {
    return isInfographicAvailable();
  }
}

export const infographicService = InfographicService.getInstance();
