import { NextRequest, NextResponse } from "next/server";
import { getElevenLabsApiKey } from "@/config/apiKeys";

/**
 * Secure Server-Side Endpoint for ElevenLabs Conversation Token
 *
 * This endpoint generates a signed URL for WebSocket connections to ElevenLabs
 * Conversational AI. The API key is NEVER exposed to the client.
 *
 * Security: API key stays server-side only
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId } = body;

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 });
    }

    // Get API key from server-side configuration (never exposed to client)
    const apiKey = getElevenLabsApiKey();

    if (!apiKey) {
      console.error("❌ ElevenLabs API key not configured");
      return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 });
    }

    console.log(`🔐 Requesting signed URL for agent: ${agentId}`);

    // Request signed URL from ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Failed to get signed URL:", errorText);
      return NextResponse.json(
        {
          error: "Failed to get conversation token",
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    console.log("✅ Signed URL generated successfully");

    // Return signed URL to client
    return NextResponse.json({
      signedUrl: data.signed_url,
      expiresAt: data.expires_at,
    });
  } catch (error) {
    console.error("❌ Conversation token error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
