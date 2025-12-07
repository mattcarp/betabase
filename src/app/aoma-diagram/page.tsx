"use client";

import { AomaArchitectureDiagram } from "@/components/ai-elements/AomaArchitectureDiagram";

export default function AomaDiagramPreviewPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Northstar Demo: AOMA Architecture</h1>
          <p className="text-slate-400">
            Generated from system knowledge (Supabase vectors & codebase analysis)
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
          <AomaArchitectureDiagram />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-400">
          <div className="p-4 bg-slate-900/30 rounded-lg border border-slate-800/50">
            <strong className="text-purple-400 block mb-1">Frontend</strong>
            Next.js 14 App Router hosted on Vercel, using Tailwind CSS and Shadcn UI.
          </div>
          <div className="p-4 bg-slate-900/30 rounded-lg border border-slate-800/50">
            <strong className="text-pink-400 block mb-1">Backend</strong>
            Supabase (PostgreSQL + pgvector) for data & embeddings, with Python microservices.
          </div>
          <div className="p-4 bg-slate-900/30 rounded-lg border border-slate-800/50">
            <strong className="text-emerald-400 block mb-1">Data Sources</strong>
            Aggregates data from Jira, GitHub, and internal Wikis via AOMA-MESH-MCP.
          </div>
        </div>
      </div>
    </div>
  );
}
