# The Betabase Documentation Index

**Ultimate Performance Documentation Structure** - Optimized for fast navigation and context loading.

## Quick Navigation

### For New Developers

- **[Quick Start Guide](QUICK-START.md)** - Zero to productive in 5 minutes

### By Category

#### Development

- **[Git Workflow](development/GIT-WORKFLOW.md)** - Git strategies, commit guidelines, merge conflict resolution
- **[Testing Strategy](development/TESTING-STRATEGY.md)** - Complete testing guide (AOMA, visual, E2E, production)
- **[TypeScript Guidelines](development/TYPESCRIPT-GUIDELINES.md)** - Type-checking, common errors, standards
- **[Code Quality](development/CODE-QUALITY.md)** - Linting, formatting, pre-commit hooks, quality gates

#### Deployment

- **[Deployment Guide](deployment/DEPLOYMENT-GUIDE.md)** - Full deployment process (Render, CI/CD, automation)
- **[Monitoring](deployment/MONITORING.md)** - Health checks, logs, metrics, performance
- **[CI/CD Pipeline](deployment/CI-CD-PIPELINE.md)** - GitHub Actions, automated testing, PR workflow

#### Design

- **[MAC Design System](design/MAC-DESIGN-SYSTEM.md)** - Design tokens, components, compliance validation
- **[UI Components](design/UI-COMPONENTS.md)** - shadcn/ui, AI Elements, component usage
- **[Design Review](design/DESIGN-REVIEW.md)** - 8-phase review process, visual scoring, Fiona workflow
- **[Gold Standards](design/gold-standards/)** - Reference designs for dashboards, charts, and visualizations
  - **[Curate Mode Dashboard](design/gold-standards/CURATE-MODE-GOLD-STANDARD.md)** - THE gold standard for all dashboard/analytics UI

#### Agents

- **[Fiona Usage](agents/FIONA-USAGE.md)** - Enhanced Fiona agent capabilities, workflows, HITL
- **[Agent Workflows](agents/AGENT-WORKFLOWS.md)** - Multi-agent patterns, orchestration, best practices
- **[MCP Integration](agents/MCP-INTEGRATION.md)** - MCP servers, tools, configuration

#### Troubleshooting

- **[Common Issues](troubleshooting/COMMON-ISSUES.md)** - Frequent problems and solutions
- **[Debug Commands](troubleshooting/DEBUG-COMMANDS.md)** - Essential debugging commands and tools
- **[Known Issues](troubleshooting/KNOWN-ISSUES.md)** - Current limitations, workarounds, future fixes

#### Reference

- **[API Reference](reference/API-REFERENCE.md)** - API endpoints, authentication, usage
- **[Environment Variables](reference/ENVIRONMENT-VARS.md)** - Complete env var reference
- **[Project Structure](reference/PROJECT-STRUCTURE.md)** - Directory layout, file organization
- **[Historical Changes](reference/HISTORICAL-CHANGES.md)** - Migration notes, deprecated features

#### Demo & Screencast

- **[Screencast Script](demo/SCREENCAST-SCRIPT.md)** - Master script for all demo segments
- **[Pillar 3: Test Demo](PILLAR-3-TEST-DEMO-SCRIPT.md)** - Detailed Test tab narration (60-90 sec)

## Existing Documentation

### Already Created

- **[AOMA Documentation Index](AOMA-DOCUMENTATION-INDEX.md)** - AOMA integration, authentication, crawling
- **[Testing Fundamentals](TESTING_FUNDAMENTALS.md)** - Comprehensive testing overview
- **[Production Testing](PRODUCTION_TESTING.md)** - Production deployment verification
- **[TypeScript Error Status](TYPESCRIPT-ERROR-STATUS.md)** - Current error breakdown and cleanup plan
- **[AI Elements Usage Guide](AI-ELEMENTS-USAGE-GUIDE.md)** - Vercel AI SDK v5 patterns

## Search by Task

| What I Need To Do         | Where To Look                                                 |
| ------------------------- | ------------------------------------------------------------- |
| Fix merge conflict        | [Git Workflow](development/GIT-WORKFLOW.md)                   |
| Run tests before PR       | [Testing Strategy](development/TESTING-STRATEGY.md)           |
| Deploy to production      | [Deployment Guide](deployment/DEPLOYMENT-GUIDE.md)            |
| Check design compliance   | [Design Review](design/DESIGN-REVIEW.md)                      |
| Debug build failure       | [Debug Commands](troubleshooting/DEBUG-COMMANDS.md)           |
| Set up environment        | [Quick Start](QUICK-START.md)                                 |
| Use Fiona agent           | [Fiona Usage](agents/FIONA-USAGE.md)                          |
| Fix TypeScript errors     | [TypeScript Guidelines](development/TYPESCRIPT-GUIDELINES.md) |
| Monitor deployment        | [Monitoring](deployment/MONITORING.md)                        |
| Understand project layout | [Project Structure](reference/PROJECT-STRUCTURE.md)           |
| Design a dashboard/chart  | [Curate Mode Gold Standard](design/gold-standards/CURATE-MODE-GOLD-STANDARD.md) |
| Create demo/screencast    | [Screencast Script](demo/SCREENCAST-SCRIPT.md)                |

## Documentation Principles

1. **Single Source of Truth** - No duplicate content across files
2. **Categorization by Concern** - Development, deployment, design, agents, troubleshooting
3. **Shallow Hierarchy** - Maximum 2 levels deep for fast access
4. **Cross-Linking** - Related topics link to each other
5. **Quick Reference First** - Commands and examples before explanation
6. **Performance Optimized** - CLAUDE.md stays under 200 lines

## Contributing to Docs

When adding documentation:

1. Determine the correct category (development/deployment/design/agents/troubleshooting/reference)
2. Add to existing file if topic fits, create new file if needed
3. Update this INDEX.md with link
4. Add cross-references from related documents
5. Keep CLAUDE.md minimal - add detailed content here instead

---

_Last updated: 2025-12-21_
