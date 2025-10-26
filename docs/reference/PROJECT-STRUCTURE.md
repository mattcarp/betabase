# Project Structure

Directory layout and file organization for SIAM.

## Main Structure

```
/siam
├── app/              # Next.js App Router
│   ├── api/         # API routes
│   └── page.tsx     # Main page
├── src/
│   ├── components/  # React components
│   ├── services/    # Services (Cognito, etc)
│   └── utils/       # Utilities
├── docs/            # Documentation (NEW!)
├── tests/           # Playwright tests
├── scripts/         # Build and utility scripts
├── Dockerfile       # Render deployment
└── next.config.js   # Next.js config
```

---

_For quick reference, see [QUICK-START.md](../QUICK-START.md)_
