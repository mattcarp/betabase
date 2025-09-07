# SIAM Architecture Overview
<!-- TAGS: architecture, infrastructure, mcp-servers, technical-depth, architecture-decision, production -->

**Last Updated**: August 20, 2025  
**Architecture**: Web Application (Next.js)

## Overview

SIAM (Secure Intelligence Authentication Manager) is a **pure web application** built with modern web technologies. It provides AI-powered chat capabilities with Sony Music's AOMA knowledge base integration.

## Core Architecture

### Technology Stack

- **Framework**: Next.js 15.4.6 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19.1.1
- **Styling**: Tailwind CSS + shadcn/ui components
- **AI Integration**: Vercel AI SDK v5
- **Authentication**: AWS Cognito + Magic Link

### Application Type

**SIAM is a web-only application**:

- ✅ Browser-based (Chrome, Safari, Firefox, Edge)
- ✅ Mobile-responsive web interface
- ❌ No desktop application (web-only)
- ❌ No native mobile apps

### Project Structure

This is a **single Next.js project** (not a monorepo):

```
/siam
├── app/                  # Next.js App Router pages
│   ├── api/             # API routes
│   └── (routes)/        # Application routes
├── src/
│   ├── components/      # React components
│   │   ├── ui/         # shadcn/ui components
│   │   └── ai-elements/# AI-specific UI components
│   ├── services/        # Business logic & integrations
│   ├── hooks/          # Custom React hooks
│   └── utils/          # Utility functions
├── public/             # Static assets
├── docs/               # Documentation
└── tests/              # Test files
```

## Key Services & Integrations

### 1. AOMA MCP Integration

- **Server**: AWS Lambda/Railway deployment
- **Endpoint**: https://luminous-dedication-production.up.railway.app
- **Features**: Knowledge base queries, document search
- **Optimization**: In-memory LRU cache with semantic matching

### 2. OpenAI Integration

- **Purpose**: Chat completions & assistant API
- **SDK**: Vercel AI SDK v5
- **Model**: GPT-4 variants
- **Vector Store**: OpenAI-attached for document storage

### 3. Authentication System

- **Provider**: AWS Cognito
- **Method**: Magic Link (passwordless)
- **Whitelist**: \*@sonymusic.com + specific emails

### 4. Real-time Features

- **Streaming**: Server-sent events for chat responses
- **WebSockets**: Not currently used (available for future features)

## Deployment Architecture

### Production Environment

- **Hosting**: Render.com
- **Domains**:
  - Primary: iamsiam.ai
  - Secondary: thebetabase.com
- **CDN**: Cloudflare
- **SSL**: Automatic via Render

### Infrastructure Services

- **Web Hosting**: Render (Next.js service)
- **MCP Server**: Railway (AOMA integration)
- **Database**: Supabase (vector storage)
- **Authentication**: AWS Cognito
- **Email**: Mailgun/SendGrid (magic links)

## Performance Optimizations

### AOMA Query Caching

- **Strategy**: LRU cache with 100 entry limit
- **TTL**: 1 hour (rapid), 30 mins (focused/comprehensive)
- **Hit Rate**: ~70-80% after warm-up
- **Response Time**: <2s (cached), 10-15s (fresh)

### Build Optimizations

- **Framework**: Next.js production build
- **Images**: Unoptimized (using external CDN)
- **Code Splitting**: Automatic via Next.js
- **Caching**: Browser cache + CDN cache

## Security Considerations

### Authentication

- Magic Link via email (no passwords stored)
- Session management via secure cookies
- CORS configured for API access

### API Security

- Environment variables for secrets
- Rate limiting on API routes
- Input validation and sanitization

## Development Workflow

### Local Development

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run test         # Run tests
npm run lint         # Lint code
```

### Deployment

- Push to `main` branch triggers automatic deployment
- Render handles build and deployment
- Zero-downtime deployments

## Future Considerations

### Potential Enhancements

- Progressive Web App (PWA) capabilities
- Offline support with service workers
- Real-time collaboration features
- Enhanced mobile experience

### Not Planned

- Desktop applications
- Native mobile apps
- Monorepo structure

## Conclusion

SIAM is a focused, web-only application that leverages modern web technologies to deliver a powerful AI-enhanced experience. The architecture prioritizes simplicity, performance, and maintainability while providing enterprise-grade features for Sony Music's needs.

---

_This document reflects the current web-only architecture of SIAM._
