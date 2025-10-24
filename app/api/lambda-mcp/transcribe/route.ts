/**
 * Lambda MCP Transcription API Route
 * Server-side endpoint for processing audio through Lambda MCP pipeline
 */

import { NextRequest, NextResponse } from "next/server";
import { lambdaMcpTranscriptionPipeline } from "@/services/lambdaMcpTranscriptionPipeline";

export async function POST(request: NextRequest) {
  try {
    console.log("🎤 Lambda MCP Transcription API: Received request");

    // Parse multipart form data
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    // const options = formData.get("options") ? JSON.parse(formData.get("options") as string) : {};

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    console.log(
      `📦 Audio file received: ${audioFile.name} (${(audioFile.size / 1024).toFixed(1)}KB)`
    );

    // Convert File to ArrayBuffer
    const audioBuffer = await audioFile.arrayBuffer();

    // Process through Lambda MCP pipeline
    console.log("🚀 Processing audio through Lambda MCP pipeline...");

    const result = await lambdaMcpTranscriptionPipeline.processAudio(audioBuffer);

    if (!result.transcription.success) {
      console.error("❌ Transcription failed:", result.transcription.error);
      return NextResponse.json(
        {
          error: "Transcription failed",
          details: result.transcription.error,
          processingMode: result.processingMode,
          fallbackUsed: result.fallbackUsed,
        },
        { status: 500 }
      );
    }

    console.log(`✅ Transcription successful (${result.processingMode} mode)`);

    // Return successful response
    return NextResponse.json({
      success: true,
      transcription: {
        text: result.transcription.text,
        confidence: result.transcription.confidence,
        language: result.transcription.language,
      },
      voiceIsolation: {
        applied: result.voiceIsolation.success,
      },
      contentAnalysis: {
        isExplicit: result.contentAnalysis.isExplicit,
        explicitScore: result.contentAnalysis.explicitScore,
        contentType: result.contentAnalysis.contentType,
        sentiment: result.contentAnalysis.sentiment,
        keywords: result.contentAnalysis.keywords,
      },
      metadata: {
        processingMode: result.processingMode,
        lambdaAttempted: result.lambdaAttempted,
        lambdaSuccess: result.lambdaSuccess,
        fallbackUsed: result.fallbackUsed,
        processingTime: result.totalProcessingTime,
        metrics: result.metrics,
      },
    });
  } catch (error) {
    console.error("❌ Lambda MCP Transcription API error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Health check endpoint
    const healthCheck = await lambdaMcpTranscriptionPipeline.healthCheck();
    const stats = lambdaMcpTranscriptionPipeline.getStats();

    return NextResponse.json({
      status: "healthy",
      lambdaMcp: {
        healthy: healthCheck.healthy,
        latency: healthCheck.latency,
        error: healthCheck.error,
      },
      statistics: stats,
      config: {
        useLambdaMcp: lambdaMcpTranscriptionPipeline.getConfig().useLambdaMcp,
        fallbackToLocal: lambdaMcpTranscriptionPipeline.getConfig().fallbackToLocal,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Health check error:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

export async function OPTIONS(_request: NextRequest) {
  // CORS handling
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
