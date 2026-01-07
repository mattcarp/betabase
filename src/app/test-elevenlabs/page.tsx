"use client";

import React from "react";
import ConversationalAI from "@/components/ConversationalAI";

export default function TestElevenLabsPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="mac-heading text-3xl font-light mb-2">Voice AI Testing Interface</h1>
          <p className="mac-body text-muted-foreground">
            Test the integrated voice conversation system with knowledge base access
          </p>
          <div className="mt-4 p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm text-green-400">System Ready</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Agent ID: {process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "Not configured"}
            </p>
          </div>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-card px-6 py-3 border-b border-border">
            <h2 className="mac-heading text-lg font-light">Conversational AI Interface</h2>
          </div>
          <div className="p-6 bg-background">
            <ConversationalAI
              agentId={
                process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "agent_01jz1ar6k2e8tvst14g6cbgc7m"
              }
              onTranscriptionUpdate={(text) => {
                console.log("[Test Page] Transcription:", text);
              }}
              onConversationStateChange={(state) => {
                console.log("[Test Page] Conversation state:", state);
              }}
            />
          </div>
        </div>

        <div className="mt-8 p-6 bg-card rounded-lg border border-border">
          <h3 className="mac-title text-lg font-light mb-4">Testing Instructions</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">1.</span>
              <span>Click "Start Conversation" to begin voice interaction</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">2.</span>
              <span>Speak your question - try asking about AOMA or the knowledge base content</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">3.</span>
              <span>
                The AI will respond with voice and access the knowledge base through the MCP server
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">4.</span>
              <span>View real-time transcription and conversation status below the controls</span>
            </li>
          </ol>
        </div>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-300">
            <strong>Integration Status:</strong> The ElevenLabs agent is connected to the MCP server
            (uR5cKaU7GOZQyS04RVXP) which provides access to the AOMA knowledge base through AWS
            Lambda and Supabase vector database.
          </p>
        </div>
      </div>
    </div>
  );
}
