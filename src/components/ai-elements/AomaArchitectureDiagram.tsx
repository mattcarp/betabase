"use client";

import { MermaidDiagram } from "./mermaid-diagram";

const aomaDiagramCode = `
graph TD
    %% Styling
    classDef frontend fill:#8b5cf6,stroke:#7c3aed,color:#fff
    classDef backend fill:#ec4899,stroke:#db2777,color:#fff
    classDef data fill:#10b981,stroke:#059669,color:#fff
    classDef auth fill:#f59e0b,stroke:#d97706,color:#fff
    classDef user fill:#3b82f6,stroke:#2563eb,color:#fff

    User((User)):::user
    
    subgraph "Frontend Layer"
        NextJS[Next.js 14 App]:::frontend
        Vercel[Vercel Hosting]:::frontend
    end
    
    subgraph "Auth Layer"
        Cognito[AWS Cognito]:::auth
        MagicLink[Magic Link Flow]:::auth
    end
    
    subgraph "Backend Layer"
        Supabase[Supabase]:::backend
        PG[PostgreSQL]:::backend
        Vector[pgvector]:::backend
        Python[Python Microservice]:::backend
    end
    
    subgraph "Data Sources"
        Jira[Jira]:::data
        GitHub[GitHub]:::data
        Wiki[Internal Wiki]:::data
    end

    User --> NextJS
    NextJS --> Cognito
    Cognito --> MagicLink
    NextJS --> Supabase
    Supabase --> PG
    Supabase --> Vector
    NextJS --> Python
    Python --> Jira
    Python --> GitHub
    Python --> Wiki
    Vector -.-> Python
`;

export function AomaArchitectureDiagram() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-white">AOMA System Architecture</h2>
      <MermaidDiagram code={aomaDiagramCode} />
    </div>
  );
}
