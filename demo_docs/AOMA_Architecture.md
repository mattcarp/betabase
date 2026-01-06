# AOMA System Architecture

**System:** AOMA (Asset & Offering Management Application)
**Type:** Multi-Tenant Distributed System

## Architecture Overview
AOMA uses a hub-and-spoke model where the Unified Session Manager (USM) acts as the central orchestrator. It integrates with external providers for authentication, storage, and workflow management.

### Key Components
1.  **API Gateway:** Entry point for all client requests, handling routing and authentication.
2.  **Unified Session Manager (USM):** The core "brain" of AOMA, managing user sessions and orchestration.
3.  **Agent Swarm:** specialized microservices/agents that perform specific tasks (e.g., metadata validation, rights checking).
4.  **Supabase Vector:** Stores embeddings for semantic search and RAG capabilities.
5.  **Redis Cache:** High-speed caching for session data and frequently accessed metadata.

## Integration Points
*   **JIRA API:** For ticket synchronization and status updates.
*   **GitHub API:** For code retrieval and commit history.
*   **Google Drive:** For indexing unstructured documents.

## Diagram
```mermaid
flowchart TD
    classDef core fill:#1a1a1a,stroke:#a855f7,stroke-width:2px,color:white;
    classDef ext fill:#0f172a,stroke:#3b82f6,stroke-width:1px,color:white;
    classDef db fill:#1e1e1e,stroke:#22c55e,stroke-width:2px,color:white;

    User((User)) -->|Auth| Gateway[API Gateway]:::core
    Gateway -->|Route| USM[Unified Session Manager]:::core
    
    subgraph "AOMA Core"
        USM -->|Orchestrate| Agents[Agent Swarm]:::core
        Agents -->|Query| VectorDB[(Supabase Vector)]:::db
        Agents -->|Cache| Redis[(Redis Cache)]:::db
    end
    
    subgraph "Integrations"
        USM -->|Sync| JIRA[JIRA API]:::ext
        USM -->|Fetch| Git[GitHub API]:::ext
        USM -->|Index| Drive[Google Drive]:::ext
    end
    
    VectorDB -.->|Context| USM
```
