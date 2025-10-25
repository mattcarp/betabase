import { NextRequest, NextResponse } from "next/server";
import { getElevenLabsApiKey } from "../../../../src/config/apiKeys";

/**
 * Secure Server-Side Endpoint for ElevenLabs Conversation Token
 *
 * This endpoint generates a WebRTC conversation token for ElevenLabs
 * Conversational AI. The API key is NEVER exposed to the client.
 *
 * Security: API key stays server-side only
 * Connection: WebRTC (optimized for real-time audio streaming)
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

    console.log(`🔐 Requesting WebRTC conversation token for agent: ${agentId}`);

    // Request WebRTC conversation token from ElevenLabs API
    // FIXED: Use /token endpoint (WebRTC) instead of /get_signed_url (WebSocket)
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
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
      console.error("❌ Failed to get conversation token:", errorText);
      return NextResponse.json(
        {
          error: "Failed to get conversation token",
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    console.log("✅ WebRTC conversation token generated successfully");

    // Return WebRTC token to client
    return NextResponse.json({
      conversationToken: data.token,
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
