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
// Updated to match premium suggested questions
const INFOGRAPHIC_PATTERNS: Record<InfographicType, RegExp[]> = {
  workflow: [
    /how do i/i,
    /how to/i,
    /steps to/i,
    /process for/i,
    /procedure for/i,
    /guide to/i,
    /how does.*use/i, // Matches "How does AOMA use AWS S3..."
    /upload and archive/i, // Matches digital archive workflow
  ],
  comparison: [
    /difference between/i,
    /compare/i,
    /vs\.?$/i,
    /versus/i,
    /which is better/i,
    /pros and cons/i,
  ],
  hierarchy: [
    /types of/i,
    /categories of/i,
    /different kinds/i,
    /asset types/i,
    /structure of/i,
    /storage tiers/i, // Matches AWS S3 storage tiers
  ],
  explainer: [
    /what is/i,
    /explain/i,
    /overview of/i,
    /introduction to/i,
    /understand/i,
  ],
  timeline: [
    /history of/i,
    /timeline/i,
    /evolution of/i,
    /when did/i,
    /release notes/i,
    /new features/i,
    /what's new/i,
    /latest updates/i,
    /recent changes/i,
    /being planned/i, // Matches "What new UST features are being planned..."
    /roadmap/i,
    /2026 releases/i,
  ],
  checklist: [
    /requirements for/i,
    /checklist/i,
    /what do i need/i,
    /permissions/i,
    /permission levels/i, // Matches "What are the permission levels..."
    /prerequisites/i,
    /what can each role/i, // Matches "what can each role do"
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
