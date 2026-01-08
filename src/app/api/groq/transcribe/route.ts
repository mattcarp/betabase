import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }

    // Log file details for debugging
    console.log("[Groq Transcription] File details:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Check if file has content
    if (file.size === 0) {
      return NextResponse.json({ error: "Audio file is empty" }, { status: 400 });
    }

    // Prepare FormData for Groq
    // Groq supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
    const groqFormData = new FormData();
    groqFormData.append("file", file, file.name);
    groqFormData.append("model", "whisper-large-v3");
    groqFormData.append("response_format", "json");
    groqFormData.append("language", "en"); // Explicitly set language for better results

    // Call Groq API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    console.log("[Groq Transcription] Calling Groq API...");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: groqFormData,
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);
    console.log("[Groq Transcription] Groq API responded:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Groq Transcription] Error:", response.status, response.statusText, errorText);
      // Parse error for more details
      let errorDetail = response.statusText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.error?.message || errorJson.message || errorText;
      } catch {
        errorDetail = errorText || response.statusText;
      }
      return NextResponse.json({ error: `Groq API error: ${errorDetail}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error("[Groq Transcription] Server error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return NextResponse.json({ error: "Request timed out - please try again" }, { status: 504 });
      }
      if (error.message.includes("ETIMEDOUT") || error.message.includes("fetch failed")) {
        return NextResponse.json({ error: "Could not connect to Groq API - please try again" }, { status: 503 });
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
