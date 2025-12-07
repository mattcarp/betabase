import { NextRequest, NextResponse } from "next/server";
import { getElevenLabsApiKey } from "@/config/serverSecrets";

interface TextToSpeechPayload {
  voiceId: string;
  text: string;
  modelId?: string;
  voiceSettings?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = await getElevenLabsApiKey();
    const body = (await request.json()) as TextToSpeechPayload;

    if (!body.voiceId || !body.text) {
      return NextResponse.json({ error: "voiceId and text are required" }, { status: 400 });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${body.voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: body.text,
          model_id: body.modelId ?? "eleven_multilingual_v2",
          voice_settings: body.voiceSettings ?? {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0,
            use_speaker_boost: true,
          },
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs TTS error:", errorText);
      return NextResponse.json(
        { error: "Failed to synthesize speech", details: errorText },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Text-to-speech request failed:", error);
    return NextResponse.json(
      {
        error: "Text-to-speech request failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}







