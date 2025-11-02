import { NextResponse } from "next/server";
import { getElevenLabsApiKey } from "@/config/apiKeys";

/**
 * ElevenLabs Health Check API
 * Checks if the ElevenLabs service is available and the API key is valid
 */
export async function GET() {
  try {
    const apiKey = getElevenLabsApiKey();
    
    if (!apiKey) {
      return NextResponse.json(
        {
          status: "error",
          message: "ElevenLabs API key not configured",
          service: "ElevenLabs",
        },
        { status: 503 }
      );
    }

    // Test ElevenLabs API with a quick user info request
    const response = await fetch("https://api.elevenlabs.io/v1/user", {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
      },
      // Add timeout
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          status: "error",
          message: `ElevenLabs API returned ${response.status}`,
          service: "ElevenLabs",
        },
        { status: 503 }
      );
    }

    const userData = await response.json();

    return NextResponse.json({
      status: "ok",
      message: "ElevenLabs service is operational",
      service: "ElevenLabs",
      details: {
        characterCount: userData.subscription?.character_count,
        characterLimit: userData.subscription?.character_limit,
        canExtendCharacterLimit: userData.subscription?.can_extend_character_limit,
      },
    });
  } catch (error: any) {
    console.error("ElevenLabs health check failed:", error);
    
    let message = "Service unavailable";
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      message = "Service timeout";
    } else if (error.message) {
      message = error.message;
    }

    return NextResponse.json(
      {
        status: "error",
        message,
        service: "ElevenLabs",
      },
      { status: 503 }
    );
  }
}

