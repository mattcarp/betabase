---
title: MusicBrainz Metadata Panel (SSR)
status: BACKLOG
priority: LOW
type: FEATURE
---

# Feature Spec: MusicBrainz Metadata Panel (SSR)

## Objective
Implement a new "MusicBrainz Search" feature for the chatbot. This feature renders a high-fidelity, server-side rendered (SSR) metadata panel for music results.

## Context
- **App**: Next.js (App Router).
- **Interface**: Chatbot (conversational UI).
- **Goal**: When a user asks about a song or album, fetch data from MusicBrainz and display a "Beautiful" card inline.

## Technical Requirements

### 1. MusicBrainz API Client (Server-Side Only)
- **Location**: `lib/musicbrainz.ts`
- **Source**: MusicBrainz API (musicbrainz.org)
- **Constraints**:
    - Implement strict rate limiting (max 1 request/second).
    - Include a proper `User-Agent` header (e.g., `BetabaseBot/1.0 ( contact@example.com )`).
    - Fetch metadata (Artist, Title, Year).
    - Resolve Cover Art using the **Cover Art Archive API**.

### 2. React Server Component (The Panel)
- **Component**: `components/chat/MusicCard.tsx`
- **Rendering**: Server Component (RSC).
- **Props**: Accepts search result data.
- **Design**: 
    - **Style**: Modern "glassmorphism" or clean card aesthetic.
    - **Library**: Tailwind CSS (Project Standard).
    - **Content**: Album Art (prominent), Track Title, Artist, Release Year, "View on MusicBrainz" button.
- **UX**: Use React Suspense to show a skeleton state while fetching.

### 3. Integration
- **Framework**: Vercel AI SDK (`@ai-sdk/react`).
- **Mechanism**: Expose as a `tool` (via `streamUI` or `renderObject`) that the AI can call during streaming.

## Process & "Thinking" Instructions
1.  **Analyze**: Review MusicBrainz API docs for search and cover art endpoints.
2.  **Plan**: Design handling for "No Cover Art" (fallback image or abstract CSS pattern).
3.  **Implement**:
    - `lib/musicbrainz.ts` (Client)
    - `components/chat/MusicCard.tsx` (UI)
4.  **Verify**:
    - Trigger search for "Daft Punk" via chat.
    - Verify strict rate limiting logs.
    - Capture screenshot of the rendered card.

## Environment & Configuration
- **UI Library**: Tailwind CSS (Confirmed).
- **Chat Framework**: Vercel AI SDK / `useChat` (Confirmed).
- **Cover Art Strategy**: Explicit fetch from Cover Art Archive API (as requested), with fallback.

## Deliverables
- [ ] `lib/musicbrainz.ts`
- [ ] `components/chat/MusicCard.tsx`
- [ ] Browser screenshot Artifact.
