/**
 * AOMA Streaming API Route
 * Provides Server-Sent Events (SSE) for real-time progress updates
 */

import { NextRequest } from "next/server";
import { aomaOrchestrator } from "../../../src/services/aomaOrchestrator";
import { AOMAProgressUpdate } from "../../../src/services/aomaProgressStream";

export async function POST(request: NextRequest) {
  const { query } = await request.json();
  
  if (!query) {
    return new Response(JSON.stringify({ error: "Query is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Create a TransformStream for SSE
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  // Set up SSE headers
  const response = new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });

  // Execute orchestration with progress callback
  (async () => {
    try {
      // Buffer to collect all progress updates
      const progressBuffer: AOMAProgressUpdate[] = [];
      
      // Progress callback to send SSE updates
      const progressCallback = (update: AOMAProgressUpdate) => {
        progressBuffer.push(update);
        
        // Send progress update as SSE
        const data = JSON.stringify({
          type: "progress",
          update,
          timestamp: Date.now()
        });
        
        writer.write(encoder.encode(`data: ${data}\n\n`));
      };
      
      // Execute the query with progress tracking
      const result = await aomaOrchestrator.executeOrchestration(query, progressCallback);
      
      // Send final result with sources
      const finalData = JSON.stringify({
        type: "complete",
        result,
        sources: result._sources || [],
        progressSummary: progressBuffer,
        timestamp: Date.now()
      });
      
      await writer.write(encoder.encode(`data: ${finalData}\n\n`));
      await writer.write(encoder.encode(`data: [DONE]\n\n`));
      
    } catch (error) {
      // Send error as SSE
      const errorData = JSON.stringify({
        type: "error",
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: Date.now()
      });
      
      await writer.write(encoder.encode(`data: ${errorData}\n\n`));
    } finally {
      await writer.close();
    }
  })();

  return response;
}

// Standard non-streaming endpoint for compatibility
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  
  if (!query) {
    return new Response(JSON.stringify({ error: "Query is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Execute without progress tracking for simple GET requests
    const result = await aomaOrchestrator.executeOrchestration(query);
    
    return new Response(JSON.stringify({
      success: true,
      result,
      sources: result._sources || [],
      timestamp: Date.now()
    }), {
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}