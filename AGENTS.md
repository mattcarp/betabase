# Siam Project AGENTS.md

# Project-specific overrides and additions to global AGENTS.md

## Project Overview

Siam is an AI SDK implementation project focused on creating intelligent, interactive experiences with a strong emphasis on minimalist design and information architecture.

## Tech Stack (Project Specific)

### Core Technologies

- **Next.js 14+** with App Router
- **Vercel AI SDK** for LLM interactions
- **shadcn/ui** for component library
- **Tailwind CSS** for styling
- **TypeScript** with strict mode

### Key Dependencies

```json
{
  "ai": "latest",
  "@ai-sdk/openai": "latest",
  "shadcn/ui": "components",
  "tailwind": "latest",
  "framer-motion": "for animations"
}
```

## Project Structure

```
siam/
├── app/              # Next.js app router
├── components/       # React components
│   ├── ui/          # shadcn/ui components
│   └── features/    # Feature-specific components
├── lib/             # Utility functions
├── hooks/           # Custom React hooks
└── .claude/         # Claude Code context
```

## Design System

### Color Palette

- Follow shadcn/ui theming system
- Support dark/light mode by default
- Use CSS variables for consistency

### Component Guidelines

- Start with shadcn/ui components
- Extend only when necessary
- Maintain consistent spacing using Tailwind classes

### Animation Principles

- Subtle and purposeful
- 200-300ms for micro-interactions
- Use Framer Motion for complex animations
- CSS transitions for simple state changes

## AI SDK Patterns

### Streaming Responses

```typescript
// Always use streaming for better UX
const { messages, input, handleSubmit } = useChat({
  api: "/api/chat",
  onError: (error) => console.error(error),
});
```

### Tool Calling

- Define tools with clear schemas
- Handle tool responses gracefully
- Provide loading states during execution

### Error Handling

- User-friendly error messages
- Retry logic for transient failures
- Graceful degradation

## Development Workflow

### Local Development

```bash
pnpm dev         # Start dev server on port 3000
pnpm build       # Production build
pnpm lint        # Run ESLint
pnpm typecheck   # TypeScript validation
```

### Component Development

1. Start with shadcn/ui base
2. Extend with project styles
3. Add to Storybook if complex
4. Document props with JSDoc

## API Design

### Route Handlers

- Use Next.js route handlers (app/api)
- Implement rate limiting
- Add proper error responses
- Stream when possible

### Data Fetching

- Server Components by default
- Use Suspense for loading states
- Implement proper caching strategies

## Performance Requirements

- Lighthouse score > 90 for all metrics
- First Contentful Paint < 1s
- Time to Interactive < 2s
- Bundle size monitoring

## Testing Strategy

### Unit Tests

- Test utilities and hooks
- Mock external dependencies
- Focus on business logic

### Integration Tests

- Test API routes
- Test component interactions
- Verify AI SDK integrations

### E2E Tests

- Critical user journeys
- Cross-browser testing
- Mobile responsiveness

## Deployment

- Vercel for hosting
- Preview deployments for PRs
- Environment variables in Vercel dashboard
- Edge runtime where beneficial

## Current Focus Areas

1. Implementing core AI chat interface
2. Building reusable UI components
3. Optimizing streaming performance
4. Adding comprehensive error handling

## Important URLs

- AI SDK Docs: https://ai-sdk.dev/elements/overview
- shadcn/ui: https://ui.shadcn.com/docs
- Project Repository: [Add your GitHub URL]

---

_This file extends ~/.dotfiles/AGENTS.md with project-specific guidelines._
