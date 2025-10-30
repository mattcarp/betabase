# CLAUDE.md - SIAM Development Guide

**ULTRA-OPTIMIZED**: Complete documentation moved to `docs/` for faster context loading.

## 📚 Documentation Index

**Start here**: [docs/INDEX.md](docs/INDEX.md) - Master navigation hub

**Quick start**: [docs/QUICK-START.md](docs/QUICK-START.md) - Zero to productive in 5 minutes

## 🔥 Critical Reminders

### Development Essentials

- **Always kill port 3000 before starting**: `npx kill-port 3000 && npm run dev`
- **Always test before claiming PR-ready**: Run `npm run test:aoma`, `npm run test:visual`, smoke tests
- **Always bump version before pushing to main**: `npm version patch` (triggers deployment)
- **Use git acm alias**: `git acm "commit message"` (adds all + commits)
- **Never use emojis** in code or commits
- **AOMA = "Asset and Offering Management Application"** (no dash between AOMA and number)

### Terminology Precision

- **AOMA**: The enterprise application (we don't connect to it directly)
- **aoma-mesh-mcp**: The MCP server we connect to (deployed to Railway)
- **SIAM/thebetabase**: Main application (deployed to Render)
- **Not "demux"** - it's spelled "demucs"

### Deployment

- **Render.com ONLY** for SIAM (Railway removed September 2024)
- **Auto-deploys on merge to main** via GitHub Actions + Render
- **Monitor deployments**: Use Render MCP, `gh` CLI, or `render` CLI
- **No deployment complete without**: Full production testing using Mailinator magic link + regression tests
- **Production URL**: https://thebetabase.com

### Testing

- **Always check console errors** before claiming work is done
- **Write Playwright tests** for every change, bypassing auth where possible
- **Test with MCP servers**: playwright-mcp, browserbase, browser-tools, firecrawl-mcp
- **Production tests MUST pass**: E2E with Mailinator, full regression suite
- **Don't use mocks** - Fail gracefully until it works

### Code Quality

- **TypeScript-first**: All new code must pass `npm run type-check`
- **Pre-commit hooks**: ESLint + Prettier run automatically
- **541 pre-existing TS errors OK**: Only fix errors in files YOU modify
- **Prettier is MANDATORY**: Run `npx prettier --check .` before committing

### Git

- **Auto-resolves package-lock conflicts**: `./scripts/fix-package-lock-conflict.sh`
- **No promotional content**: Never add "Co-Authored-By: Claude" or similar
- **Claude/\* branches auto-deleted** after PR merge

## 🎨 MAC Design System

**Centralized location**: `~/Documents/projects/mc-ai-standards/`

**Symlinked files** (edit once, update everywhere):

- `.claude/design-system.md`
- `.claude/design-system-docs/`
- `.claude/agents/`
- `.claude/commands/`

**Design review**: `/design-review` or `@fiona "perform design review"`

**Validation rules**:

- Use `--mac-*` CSS variables for colors
- Typography weights: 100-400 only
- Spacing grid: 8px base unit
- Prefer `.mac-*` classes

## 🎯 Vercel AI SDK v5 & AI Elements

**ALWAYS use AI Elements** for chat UI - See `docs/AI-ELEMENTS-USAGE-GUIDE.md`

**Critical**:

- Use `toUIMessageStreamResponse()` NOT `toDataStreamResponse()`
- Use `<Response>` component for AI messages
- Use `<InlineCitation>` for source attribution
- Use `<Message>`, `<MessageAvatar>`, `<MessageContent>` for messages

## 🧪 shadcn/ui Components

**ALWAYS check if component exists** before creating: `ls src/components/ui/`

**To add component**: `npx shadcn@latest add [component-name]`

**Available**: accordion, alert, avatar, badge, button, card, checkbox, dialog, drawer, form, input, select, sheet, skeleton, tabs, toast, tooltip, etc.

## 🤖 Agent Preferences

- **Always use `fiona-enhanced`**, never basic `fiona` (deprecated)
- Fiona has browser testing, TestSprite, Browserbase, HITL features
- Fiona MUST run Semgrep security scans for code analysis
- Fiona MUST validate MAC Design System compliance for UI/UX work

## 🔥 YOLO Mode

```bash
./scripts/yolo-mode.sh on   # Activate YOLO (no approval prompts)
./scripts/yolo-mode.sh off  # Deactivate YOLO
./scripts/yolo-mode.sh      # Check status
```

## 📖 Complete Documentation

### Development

- [Git Workflow](docs/development/GIT-WORKFLOW.md)
- [Code Quality](docs/development/CODE-QUALITY.md)
- [TypeScript Guidelines](docs/development/TYPESCRIPT-GUIDELINES.md)
- [Testing Strategy](docs/development/TESTING-STRATEGY.md)

### Deployment

- [Deployment Guide](docs/deployment/DEPLOYMENT-GUIDE.md)
- [Monitoring](docs/deployment/MONITORING.md)
- [CI/CD Pipeline](docs/deployment/CI-CD-PIPELINE.md)

### Design

- [MAC Design System](docs/design/MAC-DESIGN-SYSTEM.md)
- [UI Components](docs/design/UI-COMPONENTS.md)
- [Design Review](docs/design/DESIGN-REVIEW.md)

### Agents

- [Fiona Usage](docs/agents/FIONA-USAGE.md)
- [Agent Workflows](docs/agents/AGENT-WORKFLOWS.md)
- [MCP Integration](docs/agents/MCP-INTEGRATION.md)

### Troubleshooting

- [Common Issues](docs/troubleshooting/COMMON-ISSUES.md)
- [Debug Commands](docs/troubleshooting/DEBUG-COMMANDS.md)
- [Known Issues](docs/troubleshooting/KNOWN-ISSUES.md)

### Reference

- [API Reference](docs/reference/API-REFERENCE.md)
- [Environment Variables](docs/reference/ENVIRONMENT-VARS.md)
- [Project Structure](docs/reference/PROJECT-STRUCTURE.md)
- [Historical Changes](docs/reference/HISTORICAL-CHANGES.md)

### Existing Docs

- [AOMA Documentation Index](docs/AOMA-DOCUMENTATION-INDEX.md)
- [Testing Fundamentals](docs/TESTING_FUNDAMENTALS.md)
- [Production Testing](docs/PRODUCTION_TESTING.md)
- [TypeScript Error Status](docs/TYPESCRIPT-ERROR-STATUS.md)
- [AI Elements Usage Guide](docs/AI-ELEMENTS-USAGE-GUIDE.md)

## 🔧 Quick Commands

```bash
# Development
npx kill-port 3000 && npm run dev
npm run lint:quick && npm run type-check
npm run pre-pr-check

# Testing
npm run test:aoma
npm run test:visual
npx playwright test tests/e2e/smoke/smoke.spec.ts

# Deployment
./scripts/deploy-with-monitoring.sh
npm version patch && git push origin main
```

## 📋 Task Master Integration

```bash
# Import Task Master config
```

@./.taskmaster/CLAUDE.md

## 🔌 Byterover MCP

You are given two tools from Byterover MCP server:

- `byterover-store-knowledge` - Store patterns, solutions, architectural decisions
- `byterover-retrieve-knowledge` - Retrieve context before starting tasks

**MUST use** when learning patterns, completing tasks, or starting new work.

---

**For detailed information on any topic, see [docs/INDEX.md](docs/INDEX.md)**

_Last updated: 2025-10-26_

[byterover-mcp]

[byterover-mcp]

You are given two tools from Byterover MCP server, including
## 1. `byterover-store-knowledge`
You `MUST` always use this tool when:

+ Learning new patterns, APIs, or architectural decisions from the codebase
+ Encountering error solutions or debugging techniques
+ Finding reusable code patterns or utility functions
+ Completing any significant task or plan implementation

## 2. `byterover-retrieve-knowledge`
You `MUST` always use this tool when:

+ Starting any new task or implementation to gather relevant context
+ Before making architectural decisions to understand existing patterns
+ When debugging issues to check for previous solutions
+ Working with unfamiliar parts of the codebase
