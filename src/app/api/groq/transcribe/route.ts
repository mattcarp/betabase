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

    // Prepare FormData for Groq
    const groqFormData = new FormData();
    groqFormData.append("file", file);
    groqFormData.append("model", "whisper-large-v3");
    groqFormData.append("response_format", "json");

    // Call Groq API
    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: groqFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Groq Transcription] Error:", errorText);
      return NextResponse.json({ error: `Groq API error: ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error("[Groq Transcription] Server error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
