# SIAM Project Constitution

> **Purpose**: This document codifies the project DNA - the technical standards, architectural decisions, and governance rules that all AI agents and developers must follow. It serves as the "Constitution" in a spec-driven development workflow.
>
> **Last Updated**: 2025-12-16  
> **Related**: [PRD](./prd.md) | [Requirements](./requirements.md) | [Implementation Plan](./implementation-plan.md)

---

## 1. Technology Stack

### Core Framework
| Technology | Version | Notes |
|------------|---------|-------|
| **Next.js** | 16.1.0-canary.28+ | Using Turbopack for dev |
| **React** | 19.2.3 | Note: React 19 ref cleanup differs from 18 |
| **TypeScript** | 5.x | Strict mode enabled |
| **Vercel AI SDK** | v5 | Use AI Elements for chat UI |

### Database & Backend
| Technology | Version | Notes |
|------------|---------|-------|
| **Supabase** | Latest | pgvector for embeddings (1536-d) |
| **PostgreSQL** | Via Supabase | RLS enabled for multi-tenant |
| **OpenAI** | text-embedding-ada-002 | Primary embedding model |
| **Gemini** | As fallback | Alternative embedding/LLM |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **Render.com** | SIAM deployment (NOT Railway) |
| **Railway** | aoma-mesh-mcp server only |
| **Cognito** | Authentication (magic-link flow) |
| **Infisical** | Secrets management |

### UI Libraries
| Library | Usage | Governance |
|---------|-------|------------|
| **shadcn/ui** | Primary UI components | ALWAYS check if component exists before creating |
| **Radix UI** | Primitives (via shadcn) | Known React 19 compose-refs issue |
| **Recharts** | Charts via shadcn | For dashboards |
| **Tailwind CSS** | Styling | Use MAC Design System variables |

---

## 2. Architectural Principles

### Layer Separation
```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                # shadcn/ui components (DO NOT MODIFY directly)
│   ├── ai/                # AI-specific components (chat panel, etc.)
│   └── [feature]/         # Feature-specific components
├── services/              # Business logic lives HERE, not in components
│   ├── embedding/         # Embedding services
│   ├── agenticRAG/        # RAG orchestration
│   └── [domain]/          # Domain services
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and helpers
└── types/                 # TypeScript type definitions
```

### Key Rules
1. **Business logic in `/services`** - Never in React components
2. **API calls through wrappers** - Use `/src/lib/` utilities
3. **State management** - Prefer React hooks, Zustand if needed (NOT Redux)
4. **No mocks in tests** - Real services or honest failures

### Data Flow
```
User Query → Chat Panel → RAG Orchestrator → Vector Search → Response
                                  ↓
                          Source Selection
                          (Jira, Git, KB, Email)
```

---

## 3. Naming Conventions

### Files
| Type | Convention | Example |
|------|------------|---------|
| React components | PascalCase | `ChatPanel.tsx` |
| Hooks | camelCase with `use` prefix | `usePermissions.ts` |
| Services | camelCase | `embeddingService.ts` |
| Types | PascalCase | `UserRole.ts` |
| Tests | `*.spec.ts` or `*.test.ts` | `chat.spec.ts` |

### Code
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `export const ChatPanel = () => {}` |
| Functions | camelCase | `export function getEmbedding() {}` |
| Constants | SCREAMING_SNAKE | `const MAX_TOKENS = 4096` |
| Types/Interfaces | PascalCase | `interface UserRole {}` |
| CSS variables | `--mac-*` prefix | `--mac-primary-blue` |

### Terminology Precision
- **AOMA** = Asset and Offering Management Application (no dash with numbers)
- **aoma-mesh-mcp** = The MCP server on Railway (not "AOMA MCP")
- **SIAM/thebetabase** = This application
- **demucs** = Audio separation library (NOT "demux")

---

## 4. Library Governance

### Approved Libraries (Use Freely)
- shadcn/ui components
- Vercel AI SDK v5
- Tailwind CSS
- Playwright for testing
- Supabase client

### Conditional Libraries (Check Before Using)
| Library | Condition |
|---------|-----------|
| Radix UI primitives | Be aware of React 19 compose-refs issue |
| New npm packages | Must justify necessity |
| Alternative state management | Discuss before adding |

### Banned/Deprecated
| Library | Reason | Alternative |
|---------|--------|-------------|
| Redux | Overkill for this project | Zustand or React hooks |
| `basic fiona` agent | Deprecated | Use `fiona-enhanced` |
| Mocks in tests | Breaks TDD | Real services |

---

## 5. AI SDK & Chat UI Rules

### MUST Use AI Elements
From Vercel AI SDK v5, always use these for chat interfaces:

```typescript
// ✅ CORRECT
import { Response, Message, MessageContent, InlineCitation } from '@/components/ai/ai-elements';
toUIMessageStreamResponse()  // NOT toDataStreamResponse()

// ❌ WRONG
toDataStreamResponse()  // Don't use this for chat UI
```

### Chat Panel Architecture
- Main file: `src/components/ai/ai-sdk-chat-panel.tsx`
- Use `<Response>` component for AI messages
- Use `<InlineCitation>` for source attribution
- HITL buttons integrated in chat panel

---

## 6. Testing Standards

### Philosophy
- **E2E tests over unit tests** - Playwright preferred
- **No mocks allowed** - See `tests/setup/no-mocks-allowed.ts`
- **Real services** - Local Supabase, real APIs
- **Honest failures** - If a test can't run, it FAILS with clear message

### Test File Locations
```
tests/
├── e2e/           # Playwright E2E tests
├── setup/         # Test configuration
└── fixtures/      # Test data
```

### Data Attributes
Every HTML element that needs testing MUST have:
```html
<button data-test-id="submit-feedback">Submit</button>
```

---

## 7. Security & Authentication

### Authentication Flow
1. **Production**: Cognito magic-link via `ForgotPasswordCommand`
2. **Demo/Dev**: Bypassed with `NEXT_PUBLIC_BYPASS_AUTH=true`
3. **Never test production auth** - Use localhost:3000 only

### Data Security
- Supabase RLS enabled for all tables
- Secrets in Infisical (never hardcoded)
- No credentials in commits

### Access Control
- Role-based via `usePermissions` hook
- Supabase tables: `user_roles`, `role_permissions`

---

## 8. Deployment Rules

### Environments
| Environment | URL | Auth |
|-------------|-----|------|
| Development | localhost:3000 | Bypassed |
| Production | thebetabase.com | Cognito magic-link |
| AOMA Mesh | Railway | API key |

### Deployment Process
1. **Auto-deploys on merge to main** via GitHub Actions + Render
2. **Bump version before push**: `npm version patch`
3. **NEVER deploy without**: Full E2E test pass

### Pre-Deployment Checklist
- [ ] `npm run lint:quick && npm run type-check`
- [ ] `npm run test:e2e` passes
- [ ] Console has no errors
- [ ] `npm run pre-pr-check` passes

---

## 9. Code Quality

### Linting
- ESLint + Prettier mandatory
- Run automatically via pre-commit hooks
- Comment out `console.log` (don't delete)
- Preserve existing comments

### TypeScript
- 541 pre-existing errors OK - only fix errors in files YOU modify
- All new code must pass `npm run type-check`
- No `any` types without justification

### File Size
- **Max 200 lines per file** - refactor if larger
- Split large components into smaller ones

---

## 10. Git & Version Control

### Commit Messages
```
type(scope): Short description

- Bullet point of specific change
- Another change
- Files: list key files

Refs: F003, REQ-001 (if applicable)
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

### Branch Naming
- Feature: `feat/description`
- Bug fix: `fix/description`
- Claude branches: Auto-deleted after PR merge

### Commands
```bash
git acm "commit message"  # Alias for add + commit
git push origin $(git branch --show-current)
```

---

## 11. MAC Design System

### Colors
Always use CSS variables:
```css
--mac-primary-blue
--mac-accent-purple
--mac-surface-dark
/* etc. */
```

### Typography
- Weights: 100-400 only
- Prefer `.mac-*` classes

### Spacing
- Base unit: 8px grid
- Use Tailwind spacing with MAC overrides

### Design Review
Run `/design-review` or `@fiona "perform design review"` for compliance.

---

## 12. ByteRover Knowledge Management

### When to Store Knowledge
```
byterover-store-knowledge: "Pattern: [description]
- Context: [what problem it solves]
- Implementation: [key code/approach]
- Files: [relevant file paths]
- Tags: #category #subcategory"
```

### When to Retrieve Knowledge
```
byterover-retrieve-knowledge: "patterns for [feature area]"
```

### Tagging Convention
| Tag | Use For |
|-----|---------|
| `#error-solution` | Bug fixes |
| `#pattern` | Reusable patterns |
| `#architecture` | Design decisions |
| `#gotcha` | Non-obvious behaviors |
| `#config` | Configuration details |

---

## 13. Session Protocol Integration

This constitution works with:
- **Session Start**: Retrieve relevant ByteRover knowledge tagged to current feature
- **Clarification Gate**: Check requirements before implementation
- **Session End**: Store new patterns learned

### Clarification Gate (NEW)
Before implementing any feature:
1. Read the relevant requirement from `requirements.md`
2. Identify any ambiguities or missing details
3. Document clarifications in the spec (not just handoff)
4. Only then proceed to coding

---

## 14. Known Issues & Gotchas

### React 19 + Radix UI
- **Issue**: `compose-refs` infinite loop on complex components
- **Affected**: Curate > Files tab
- **Solution**: Local `compose-refs.ts` with recursion guard
- **Ref**: `HANDOFF-2025-12-16-curate-files-infinite-loop.md`

### Turbopack Caching
- pnpm patches may not apply correctly
- Clear `.next` cache when debugging module issues

### Multi-Tenant Data
- Always filter by `app_name` or `user_id` in queries
- Supabase RLS enforces this at DB level

---

## Amendment Process

This constitution can be amended when:
1. New technology is adopted (document in this file)
2. Architectural decisions change (log rationale)
3. Governance rules need updates (discuss with team)

All amendments must be:
- Documented with date and rationale
- Stored in ByteRover for retrieval
- Committed with `docs(constitution): description`

---

*This is a living document. Last reviewed: 2025-12-16*







