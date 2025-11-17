import { NextResponse } from "next/server";
import { getElevenLabsApiKey } from "@/config/serverSecrets";

export async function GET() {
  try {
    const apiKey = await getElevenLabsApiKey();
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": apiKey,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs voices error:", errorText);
      return NextResponse.json(
        { error: "Unable to fetch voices", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      voices: data.voices ?? [],
    });
  } catch (error) {
    console.error("ElevenLabs voices request failed:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch voices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

