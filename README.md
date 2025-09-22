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

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: AWS Cognito + Magic Links
- **Backend**: Render (aoma-mesh-mcp server)
- **Deployment**: Render.com

### Project Structure

```
siam/
├── app/              # Next.js app router pages
├── src/
│   ├── components/   # React components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions
│   ├── services/     # API services
│   └── App.tsx       # Main app component
├── public/           # Static assets
└── tests/            # E2E tests (Playwright)
```

## 🛠️ Development

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-pool-id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id
NEXT_PUBLIC_AWS_REGION=us-east-2
NEXT_PUBLIC_AOMA_ENDPOINT=https://aoma-mesh-mcp.onrender.com
# Sony Music JIRA UI automation (no API token)
JIRA_BASE_URL=https://jira.smedigitalapps.com/jira
JIRA_USERNAME=your.sony.username@sonymusic.com
JIRA_PASSWORD=your-strong-password
# Optional: OpenAI for embeddings
# OPENAI_API_KEY=sk-...

# Git Indexer configuration
# GIT_FRONTEND_REPO_PATH=/absolute/path/to/frontend
# GIT_BACKEND_REPO_PATH=/absolute/path/to/backend
# GIT_ADDITIONAL_REPOS=/abs/path/one,/abs/path/two
# GIT_MAX_COMMITS=500
# GIT_SINCE="6 months ago"
# GIT_BRANCH=HEAD
# GIT_SKIP_EXISTING=false
# GIT_FILE_EXTENSIONS=.ts,.js,.tsx,.jsx,.md,.json,.yml,.yaml
# GIT_EXCLUDE_PATTERNS=node_modules,dist,build,.git,.next
# GIT_INCLUDE_README=true
# VECTOR_BATCH_SIZE=5
# VECTOR_FILE_BATCH_SIZE=100
# VECTOR_FILE_CONCURRENCY=4
# GIT_GLOBAL_CONCURRENCY=2
# GIT_INDEX_API_KEY=optional-secret-to-protect-API
```

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

## 🧩 Confluence Crawling (Docs Import)

To ingest Confluence documentation into `aoma_unified_vectors`:

```bash
# Configure environment (see .env.example for keys under the Confluence section)
export CONFLUENCE_BASE_URL="https://your-org.atlassian.net"
export CONFLUENCE_API_TOKEN="<token>"
export CONFLUENCE_USERNAME="you@your-org.com"
export CONFLUENCE_SPACES="AOMA,TECH,API,USM"

# Trigger crawl (auth is validated before crawl)
./scripts/crawl-confluence-docs.sh

# Validate ingestion and run smoke semantic queries
./scripts/validate-confluence-knowledge.sh
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
