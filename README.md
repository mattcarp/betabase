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
- **Backend**: Railway (aoma-mesh-mcp server)
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
NEXT_PUBLIC_AOMA_ENDPOINT=https://luminous-dedication-production.up.railway.app
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
