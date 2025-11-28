import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

// Allow up to 30 seconds for image generation
export const maxDuration = 30;

// Input validation
const DiagramRequestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  context: z.string().max(5000).optional(),
  type: z.enum(["explainer", "workflow"]).default("explainer"),
});

export async function POST(req: Request) {
  try {
    console.log("[API] ========== POST /api/diagram REQUEST START ==========");

    // Check if auth is bypassed for development
    const bypassAuth =
      process.env.NEXT_PUBLIC_BYPASS_AUTH === "true" || process.env.NODE_ENV === "development";

    if (!bypassAuth) {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return new Response(
          JSON.stringify({ error: "Service configuration error" }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
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

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return new Response(JSON.stringify({ error: "Authentication required" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Validate API key
    if (!process.env.GOOGLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Google AI API key not configured" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
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

    const { prompt, context, type } = validation.data;

    // Initialize Gemini provider
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // Build diagram generation prompt based on type
    // Using Excalidraw-style hand-drawn aesthetic
    const excalidrawStyle = `
Style: Hand-drawn Excalidraw aesthetic
- Sketch-like, slightly imperfect lines that feel organic and approachable
- Hand-drawn looking boxes, arrows, and connectors with subtle wobble
- Rounded corners on rectangles, organic shapes
- Cross-hatching or subtle shading for depth
- Font: hand-written style, slightly uneven but legible
- Colors: Muted, pastel-like palette on dark background
  - Primary accent: Yellow (#FACC15) - Nano Banana Yellow
  - Secondary: Soft purple (#A855F7)
  - Tertiary: Soft cyan (#22D3EE)
  - Background: Dark (#1e1e2e)
  - Text: White or light gray
- NO rigid, corporate-looking diagrams
- Think whiteboard sketch by a smart engineer`;

    const diagramPrompt = type === "workflow"
      ? `Create a hand-drawn workflow diagram showing the step-by-step process for: ${prompt}

         ${context ? `Context: ${context}` : ""}

         ${excalidrawStyle}

         Workflow-specific:
         - Show clear flow direction with hand-drawn arrows
         - Use numbered steps or sequential layout
         - Highlight decision points with diamond shapes
         - Show success path in yellow, error paths in soft red`
      : `Create a hand-drawn explainer diagram visualizing: ${prompt}

         ${context ? `Context: ${context}` : ""}

         ${excalidrawStyle}

         Explainer-specific:
         - Show relationships between concepts with connecting lines
         - Use simple icons or shapes to represent ideas
         - Group related concepts together
         - Add brief annotations where helpful`;

    console.log(`[API] Generating ${type} diagram with Nano Banana Pro`);
    console.log(`[API] Prompt: ${prompt.substring(0, 100)}...`);

    // Generate diagram using Nano Banana Pro (gemini-3-pro-image-preview)
    const result = await generateText({
      model: google("gemini-3-pro-image-preview"),
      providerOptions: {
        google: { responseModalities: ["TEXT", "IMAGE"] },
      },
      prompt: diagramPrompt,
    });

    // Extract generated image - AI SDK returns files with base64Data and mediaType (not base64 and mimeType)
    const imageFile = result.files?.find((file: any) =>
      (file.mediaType || file.mimeType)?.startsWith("image/")
    );

    if (!imageFile) {
      console.error("[API] No image generated by Nano Banana Pro");
      console.error("[API] result.files:", result.files);
      return new Response(
        JSON.stringify({
          error: "Failed to generate diagram",
          text: result.text || "No response from model",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle both property naming conventions (base64Data/mediaType vs base64/mimeType)
    const imageBase64 = (imageFile as any).base64Data || (imageFile as any).base64;
    const imageMimeType = (imageFile as any).mediaType || (imageFile as any).mimeType;

    console.log(`[API] Diagram generated successfully: ${imageMimeType}`);

    // Return the generated image
    return new Response(
      JSON.stringify({
        success: true,
        image: {
          base64: imageBase64,
          mimeType: imageMimeType,
        },
        text: result.text || "",
        type,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("[API] Diagram generation error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        error: "Failed to generate diagram",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
