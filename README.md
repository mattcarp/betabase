# SIAM - Smart In A Meeting

Professional meeting intelligence platform with AI-powered assistance.

## 🚀 Quick Start

### Production URL

- Main App: https://siam-app.onrender.com
- Login: https://siam-app.onrender.com/emergency-login.html

### Local Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test
pnpm test:e2e
```

## 🔐 Authentication

SIAM uses magic link authentication:

1. Navigate to `/emergency-login.html`
2. Enter your authorized email
3. Check email for 6-digit code
4. Enter code to authenticate

### Authorized Emails

- matt@mattcarpenter.com
- fiona@fionaburgess.com
- Any @sonymusic.com email

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: AWS Cognito + Magic Links
- **AI Models**: Google Gemini 2.5 Pro (primary), OpenAI (embeddings & fallback)
- **Backend**: Railway (aoma-mesh-mcp server)
- **Database**: Supabase (vector store for RAG)
- **Deployment**: Render.com

### Project Structure

```
siam/
├── app/              # Next.js app router pages
├── src/
│   ├── components/   # React components
│   │   └── ui/rlhf-tabs/  # RLHF feedback UI
│   ├── hooks/        # Custom React hooks (usePermissions)
│   ├── lib/          # Utility functions
│   ├── services/     # API services
│   │   ├── reranking.ts              # Re-ranking module
│   │   ├── agenticRAG/               # Agentic RAG framework
│   │   ├── contextAwareRetrieval.ts  # Context-aware retrieval
│   │   └── unifiedRAGOrchestrator.ts # Unified RAG orchestrator
│   └── App.tsx       # Main app component
├── public/           # Static assets
├── tests/            # E2E tests (Playwright)
└── docs/             # Documentation (including RLHF guides)
```

## 🧠 **RLHF System (NEW!)**

SIAM now features a state-of-the-art **Reinforced Learning from Human Feedback (RLHF)** system with three advanced RAG strategies:

### **Three RAG Strategies**

1. **Re-ranking Module** - Two-stage retrieval with cross-encoder precision filtering
2. **Agentic RAG** - Multi-step reasoning with tool utilization and self-correction
3. **Context-Aware Retrieval** - Session state management with reinforcement bias

### **Features**

- ✅ **Beautiful Mac-Inspired UI** - Glassmorphism design with purple accents
- ✅ **Quick Feedback** - Thumbs up/down buttons for rapid feedback
- ✅ **Star Ratings** - 5-star rating system for detailed feedback
- ✅ **Stats Dashboard** - Real-time feedback metrics (Pending, Submitted, Avg Rating)
- ✅ **Permission System** - RBAC with curator, admin, and viewer roles
- ✅ **Cognito Integration** - Seamless auth with existing system
- ✅ **100% Test Coverage** - 21 E2E tests with visual verification

### **Access RLHF**

1. Navigate to the **Curate** tab
2. Click the **🧠 RLHF** tab (purple accent)
3. Requires curator or admin role
4. Provide feedback on AI responses to improve system quality

### **For Developers**

See comprehensive documentation:
- `docs/RLHF-ACHIEVEMENT-SUMMARY.md` - Complete implementation details
- `RLHF-INTEGRATION-SUCCESS.md` - Integration guide
- `OPTION-B-PRODUCTION-SETUP.md` - Production deployment
- `PASTE-INTO-SUPABASE.sql` - Database schema migration

**Test Coverage:** 21 E2E tests, 100% pass rate, visual verification with screenshots

## 🛠️ Development

### Environment Variables

Create `.env.local`:

```env
# AI Models
GOOGLE_API_KEY=your_google_ai_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Authentication
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-pool-id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id
NEXT_PUBLIC_AWS_REGION=us-east-2
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id

# Backend
NEXT_PUBLIC_AOMA_ENDPOINT=https://luminous-dedication-production.up.railway.app

# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Server-side secrets (Infisical)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> 💡 All sensitive values are managed through Infisical. Use `infisical run --env=development -- <command>` (see `INFISICAL_SETUP_REPORT.md`) to inject secrets when running local scripts or servers.

### Common Commands

```bash
# Build for production
pnpm build

# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Format code
pnpm format
```

## 🐛 Troubleshooting

### Hydration Errors

If you encounter React hydration errors:

1. Ensure all state initialization is consistent between server/client
2. Use `dynamic` imports with `ssr: false` for client-only components
3. Avoid using browser APIs in initial render

### Authentication Issues

1. Check localStorage for `siam_user` key
2. Verify email is in authorized list
3. Check browser console for API errors

## 📝 Recent Updates

- **Aug 15, 2025**: Fixed hydration errors, deployed to Render
- **Aug 14, 2025**: Migrated from Railway to Render
- **Aug 13, 2025**: Implemented magic link authentication

## 🤝 Contributing

1. Create feature branch from `main`
2. Make changes and test locally
3. Run tests: `pnpm test && pnpm test:e2e`
4. Push and create PR

## 📄 License

Proprietary - Sony Music Entertainment

---

Built with ❤️ by Matt Carpenter & Fiona Burgess

<!-- Fiona credit block -->

![Fiona context](./siam-current-preview.png)

_Fiona’s note: a little context from the launch that inspired the tag she loved._
