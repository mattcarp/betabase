# CLAUDE.md - SIAM Development Guide

## 🚀 Quick Reference for Claude/AI Assistants

This file contains essential commands, scripts, and known issues for the SIAM project.

## 🚀 DEPLOYMENT - Rock-Solid Production Deploy

**NEW**: Automated deployment with comprehensive monitoring and verification!

### Quick Deploy (Slash Command Available: `/deploy`)

```bash
./scripts/deploy-with-monitoring.sh  # Full deployment with monitoring
```

This handles EVERYTHING:
- Git branch management (merges to main)
- Version bumping (triggers Render deploy)
- Render MCP monitoring
- GitHub Actions tracking
- Health checks and verification
- Console error detection
- Full logging and error recovery

### Alternative Deploy Methods

```bash
./scripts/deploy.sh                  # Basic deployment
python3 ./scripts/monitor-deployment.py  # Monitor existing deployment
```

## 🔥 YOLO MODE - FUCK APPROVALS, SHIP CODE NOW!

**YOLO MODE**: Because YOU ONLY LIVE ONCE! Why ask permission when you could be building awesome shit?

### Quick Usage (DO IT NOW!):

```bash
./scripts/yolo-mode.sh on   # 🔥 ACTIVATE BEAST MODE - YOLO!
./scripts/yolo-mode.sh off  # 🛡️  Return to pussy mode (why would you?)
./scripts/yolo-mode.sh      # 📊 Check if you're being awesome
```

### What YOLO Mode REALLY Does:

- **NO FUCKING APPROVALS** - Claude just executes without asking!
- **300+ operations pre-approved** - Because YOLO, bitches!
- **All file operations enabled** - Just fucking do it!
- **Build/test/deploy instantly** - Ship that shit NOW!
- **Install ALL the packages** - npm install the whole internet!
- **MCP tools UNLEASHED** - Full kraken mode activated!
- **Web scraping madness** - Scrape everything, ask questions never!
- **REMEMBER: YOU ONLY LIVE ONCE!** 🔥🔥🔥

### When to Use YOLO Mode:

- When you want to BUILD FAST and BREAK THINGS
- When approval prompts make you want to punch your screen
- When you trust Claude not to rm -rf your life
- When you need to ship code YESTERDAY
- ALWAYS - because YOU ONLY LIVE ONCE!

### "Safety" (LOL):

- OK fine, `rm -rf /` is still blocked (party pooper)
- Your boring settings are backed up (in case you chicken out)
- Toggle on/off instantly (but why would you turn it off?)
- No restart needed - instant YOLO activation!
- **MOTTO: Better to ask forgiveness than permission!**

## 🎨 MAC Design System Integration

**CENTRALIZED DESIGN SYSTEM**: All MAC design files are now centralized in `~/Documents/projects/mc-design-system/`

### Design System References
The following files are symlinked from the central mc-design-system repository:
- **CSS Reference**: `src/styles/mac-design-system.css` → `~/Documents/projects/mc-design-system/tokens/mac-design-system.css`
- **Design Principles**: `context/mac-design-principles.md` → `~/Documents/projects/mc-design-system/docs/mac-design-principles.md`
- **Design Review Tool**: `design-review-automation.js` → `~/Documents/projects/mc-design-system/tools/design-review-automation.js`
- **Fiona Agent**: `~/Documents/projects/mc-design-system/agents/fiona-design-review.md`

### Design Review Commands
```bash
# Run comprehensive design review
node ~/Documents/projects/mc-design-system/tools/design-review-automation.js

# Use slash command for full 8-phase review
/design-review
```

### When Making UI Changes
1. **Reference MAC tokens**: Always use `--mac-*` CSS variables
2. **Follow typography weights**: Only use 100, 200, 300, 400
3. **Maintain spacing grid**: 8px base unit
4. **Use MAC components**: Prefer `.mac-*` classes
5. **Validate with Fiona**: Run design review before committing

### Design System Development
- **Central repo**: `~/Documents/projects/mc-design-system/`
- **Edit once, update everywhere**: Changes to design system files automatically reflect in all projects
- **Development-only**: These are guides and validators, not production dependencies

## 🧪 CRITICAL: ALWAYS TEST THE UI

**MANDATORY**: You MUST test UI changes using your testing MCP servers:

- playwright-mcp
- browserbase
- browser-tools

## Don't forget to make use of firecrawl-mcp when useful. it can help you crawl sitss, test, and recard LLM-friendly markdown

### Testing Checklist (DO THIS ALWAYS):

1. **Navigate to the page**: `playwright_navigate url="http://localhost:3000"`
2. **Check console errors**: `playwright_console_logs type="error"`
3. **Take screenshots**: `playwright_screenshot name="test-result"`
4. **Test interactions**: Click buttons, fill forms, verify responses
5. **Check connections**: Verify all API connections are working

### Auth Toggle for Testing:

```bash
# Disable auth for development/localhost
NEXT_PUBLIC_BYPASS_AUTH=true npm run dev

# Enable auth for testing auth flow
npm run dev  # Without bypass flag
```

**REMEMBER**: Never assume it works - ALWAYS TEST!

## 📝 Git Commit Guidelines

**NEVER** add "Co-Authored-By: Claude" to commit messages - it's unnecessary and slows down work.

### Useful Git Aliases

**`git acm "message"`** - Add all changes and commit with message:

```bash
git acm "Your commit message"
# Equivalent to: git add . && git commit -m "Your commit message"
```

**IMPORTANT**: When user runs `git acm` without a message, Claude should:

1. Analyze recent changes with `git status` and `git diff`
2. Create an appropriate commit message based on the changes
3. Execute `git acm "generated message"`

## 🧪 Test Dashboard - Knowledge Sharing Philosophy

**IMPORTANT**: The Test Dashboard doesn't just run tests - it creates a shared knowledge ecosystem between QA and Customer Support teams!

### How It Works:

- **Failed tests automatically become support knowledge** - When a test fails, the error details are stored in a searchable knowledge base
- **Support tickets inform test creation** - Common support issues guide what tests to write
- **Firecrawl analyzes the AUT** - Deep analysis of the application informs both testing strategies AND customer documentation
- **Vector embeddings enable similarity search** - "Find tests that failed like this support ticket"

### Why This Matters:

Testing isn't just about finding bugs - it's about understanding how the application works and fails. By sharing this knowledge with support teams, we:

- Reduce support ticket resolution time
- Prevent known issues from reaching production
- Create better documentation from real test scenarios
- Build a feedback loop between QA and Support

### Implementation:

- Test failures sync to `test_knowledge_base` table
- Support can search test failures for solutions
- Firecrawl discoveries become documentation
- All knowledge is vector-embedded for semantic search

## 🎯 IMPORTANT: Vercel AI SDK v5 Migration

**We are gradually migrating from direct OpenAI API to Vercel AI SDK v5**

### Key Points:

- **ALWAYS use** `toUIMessageStreamResponse()` NOT `toDataStreamResponse()`
- **Use** `convertToModelMessages` for UI message format conversion
- **Import from** `"ai"` package and `"@ai-sdk/openai"`, not direct OpenAI SDK
- **Benefits**: Better streaming, error handling, and multi-provider support

### Correct Pattern:

```typescript
import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";

const result = streamText({
  model: openai(model || "gpt-4o-mini"),
  messages: convertToModelMessages(uiMessages),
  temperature: 0.7,
  maxTokens: 4000,
});

return result.toUIMessageStreamResponse(); // ✅ Correct for v5
// NOT: result.toDataStreamResponse() ❌ Wrong
```

### Documentation:

Use `mcp__context7__get-library-docs` with `/vercel/ai` for latest patterns

## 🎨 UI Components - CRITICAL

### shadcn/ui Components

**IMPORTANT**: This project uses shadcn/ui components. ALWAYS check if a component exists before creating it.

**Available shadcn components**:

- accordion, alert, alert-dialog, aspect-ratio, avatar
- badge, breadcrumb, button
- calendar, card, carousel, checkbox, collapsible, combobox, command, context-menu
- dialog, drawer, dropdown-menu
- form
- hover-card
- input, input-otp
- label
- menubar
- navigation-menu
- pagination, popover, progress
- radio-group, resizable
- scroll-area, select, separator, sheet, skeleton, slider, sonner, switch
- table, tabs, textarea, toast, toggle, toggle-group, tooltip

**To add a shadcn component**:

```bash
npx shadcn@latest add [component-name]
# Example: npx shadcn@latest add skeleton
```

**Check if component exists**:

```bash
ls src/components/ui/ | grep [component-name]
```

### AI Elements Components

Custom AI-specific components in `src/components/ai-elements/`:

- actions, branch, code-block, conversation
- image, inline-citation, loader, message
- prompt-input, reasoning, response, source
- suggestion, task, tool, web-preview

**Rule**: Use AI elements for AI-specific UI needs, shadcn for general UI components.

## 🤖 Agent Usage Preferences

### Fiona Agent

**IMPORTANT**: Always use `fiona-enhanced` agent, never the basic `fiona` agent.

- The basic `fiona` agent is deprecated and should be ignored
- `fiona-enhanced` has all capabilities plus browser testing, TestSprite, Browserbase, and HITL features
- When referring to "Fiona" in any context, always use the enhanced version

### 🔒 Semgrep Security Integration with Fiona

**MANDATORY**: When running the Fiona agent for code analysis, ALWAYS include Semgrep security scanning:

```bash
# When invoking Fiona for any analysis, include this security check
# Fiona should automatically run: semgrep_scan on the codebase
```

**Fiona's Security Scanning Workflow**:
1. **Initial Analysis**: Run `semgrep_scan` to detect security vulnerabilities
2. **Focus Areas**: 
   - Exposed API keys and credentials
   - Authentication bypass mechanisms  
   - Client-side security vulnerabilities
   - SQL injection and XSS risks
   - Insecure configurations
3. **Report Format**: Include security findings in priority order (Critical → High → Medium → Low)
4. **Remediation**: Provide specific fixes for each vulnerability found

**Integration Instructions for Fiona Agent**:
When Fiona is invoked with `subagent_type: fiona` or `fiona-enhanced`, she should:
1. First run Semgrep security analysis using the MCP tool
2. Include security findings in her comprehensive report
3. Prioritize security issues as CRITICAL in her recommendations
4. Cross-reference findings with her architectural analysis

**Available Semgrep MCP Tools**:
- `mcp__semgrep__security_check` - General vulnerability scan
- `mcp__semgrep__semgrep_scan` - Scan with specific configuration
- `mcp__semgrep__semgrep_scan_with_custom_rule` - Custom security rules
- `mcp__semgrep__get_abstract_syntax_tree` - AST analysis
- `mcp__semgrep__supported_languages` - Check language support

### 🎨 MAC Design System Validation with Fiona

**MANDATORY**: When Fiona analyzes UI/UX, she MUST validate MAC Design System compliance by referencing:

```bash
# MAC Design System Source Document
src/styles/mac-design-system.css
```

**Fiona's Design System Validation Workflow**:

When Fiona is invoked, she should:
1. **Read the MAC Design System file**: Load `src/styles/mac-design-system.css`
2. **Extract design tokens**: Parse CSS variables and class definitions
3. **Validate against standards**: Check components for `.mac-*` class usage
4. **Verify compliance**: Ensure colors, typography, and animations match the design system
5. **Report violations**: Flag any design system violations as HIGH priority
6. **Suggest alternatives**: Provide MAC Design System compliant solutions

**Key Validation Areas** (from mac-design-system.css):
- Color token compliance (CSS variables)
- Typography weights (100-400 only)
- Component patterns (.mac-* classes)
- Animation timings and easing functions
- Glassmorphism and visual effects

**Integration with Testing Tools**:
- TestSprite: Visual regression for MAC components
- Playwright: Verify MAC class presence
- Browserbase: Test MAC animations and interactions

**Note**: Always reference the source file for the latest design standards rather than maintaining duplicate specifications.

### 🎨 NEW: Comprehensive Design Review System with Fiona

**ENHANCED CAPABILITY**: Fiona now includes world-class 8-phase design review methodology inspired by Stripe, Airbnb, and Linear!

#### Quick Design Review Commands

```bash
# Slash command for comprehensive review
/design-review

# Agent invocation for specific review
@design-review-fiona "Review the dashboard components"

# Fiona enhanced with design review
@fiona "Please perform a design review"
```

#### 8-Phase Design Review Process

Fiona now executes systematic design reviews following Silicon Valley standards:

1. **Phase 0: Preparation** - Environment setup, git analysis, Playwright initialization
2. **Phase 1: Interaction Testing** - User flows, interactive states, destructive actions
3. **Phase 2: Responsiveness** - Mobile (375px), Tablet (768px), Desktop (1440px)
4. **Phase 3: Visual Polish** - MAC Design System compliance validation
5. **Phase 4: Accessibility** - WCAG 2.1 AA compliance testing
6. **Phase 5: Robustness** - Edge cases, error states, content overflow
7. **Phase 6: Code Health** - Component reuse, design token usage
8. **Phase 7: Content & Console** - Grammar, console errors, warnings

#### Triage Matrix for Issues

All issues are categorized by priority:
- **[Blocker]** - Critical failures requiring immediate fix
- **[High-Priority]** - Significant issues to fix before merge
- **[Medium-Priority]** - Improvements for follow-up
- **[Nitpick]** - Minor aesthetic details (prefixed with "Nit:")

#### Design Review Principles

1. **Live Environment First** - Always test interactive experience before static analysis
2. **Problems Over Prescriptions** - Describe issues, not solutions
3. **Evidence-Based** - Screenshot for every issue
4. **Positive Acknowledgment** - Start with what works well

#### MAC Design Principles Reference

Complete design checklist available at: `context/mac-design-principles.md`

Key validation areas:
- Color token compliance (--mac-* variables)
- Typography weights (100-400 only)
- Spacing grid (8px base unit)
- Component patterns (.mac-* classes)
- Animation timings (150-300ms)

### 📸 UI/UX Visual Scoring System with Fiona

**MANDATORY**: Fiona MUST perform comprehensive visual UI/UX scoring using Playwright screenshots:

**Screenshot Capture Workflow**:
```javascript
// Fiona should use Playwright MCP to capture all app sections
const sections = [
  { name: 'login', url: '/', selector: '.mac-card' },
  { name: 'dashboard', url: '/dashboard', selector: '.mac-professional' },
  { name: 'chat-interface', url: '/chat', selector: '.mac-glass' },
  { name: 'hud-view', url: '/hud', selector: '.mac-floating-orb' },
  { name: 'test-dashboard', url: '/test', selector: '.mac-surface-elevated' },
  { name: 'fix-interface', url: '/fix', selector: '.mac-button' },
  { name: 'curate-view', url: '/curate', selector: '.mac-input' },
  { name: 'settings', url: '/settings', selector: '.mac-card-elevated' }
];
```

**UI/UX Scoring Criteria (1-10 scale)**:

Fiona should evaluate each screenshot against these criteria:

1. **Visual Hierarchy (Weight: 15%)**
   - Clear focal points
   - Proper content prioritization
   - Effective use of size and spacing

2. **Color & Contrast (Weight: 15%)**
   - MAC Design System compliance
   - WCAG AA/AAA contrast ratios
   - Consistent color usage

3. **Typography (Weight: 10%)**
   - Readability and legibility
   - Font weight hierarchy (100-400)
   - Appropriate text sizing

4. **Spacing & Layout (Weight: 15%)**
   - Consistent padding/margins
   - Proper alignment
   - Effective use of whitespace

5. **Interactive Elements (Weight: 10%)**
   - Button visibility and affordance
   - Clear clickable areas
   - Hover state indicators

6. **Visual Consistency (Weight: 10%)**
   - Component uniformity
   - Pattern repetition
   - Design system adherence

7. **Accessibility (Weight: 10%)**
   - Focus indicators
   - Alt text presence
   - Keyboard navigation support

8. **Performance Perception (Weight: 5%)**
   - Loading states
   - Skeleton screens
   - Progressive enhancement

9. **Emotional Design (Weight: 5%)**
   - Professional aesthetic
   - Trust indicators
   - Delightful interactions

10. **Mobile Responsiveness (Weight: 5%)**
    - Viewport optimization
    - Touch target sizes
    - Responsive layouts

**Scoring Output Format**:
```markdown
## UI/UX Visual Analysis Report

### Overall Score: [X.X/10]

#### Section Scores:
- Login Page: 8.5/10
- Dashboard: 7.2/10
- Chat Interface: 9.1/10
[etc...]

#### Top Issues (Priority Order):
1. **[Section]**: [Specific issue] - Suggested fix: [MAC-compliant solution]
2. **[Section]**: [Specific issue] - Suggested fix: [MAC-compliant solution]

#### Specific Improvements:
- **Login Page**: Add shimmer effect to submit button (use .mac-shimmer class)
- **Dashboard**: Increase contrast on secondary text (use --mac-text-secondary)
- **Chat Interface**: Add floating orbs for visual interest (implement .mac-floating-orb)
```

**Automated Improvement Suggestions**:

Fiona should provide specific, actionable improvements:
- Reference exact MAC Design System classes to use
- Suggest specific CSS variable changes
- Recommend component replacements from the design system
- Provide accessibility enhancement tips
- Suggest animation improvements with timing values

**Integration with MCP Tools**:
- Use `mcp__playwright-mcp__playwright_navigate` for navigation
- Use `mcp__playwright-mcp__playwright_screenshot` for captures
- Use `mcp__playwright-mcp__playwright_evaluate` for CSS analysis
- Cross-reference with `src/styles/mac-design-system.css` for compliance

## 📋 Essential Monitoring Scripts

### Render Deployment Monitor

```bash
# Monitor deployment via Render MCP
# Use Render MCP tools to check deployment status

# Quick permission check after Dockerfile changes
./monitor-permissions.sh

# Browser console check with Playwright
node check-site-console.js
```

### Check Render Status

```bash
# Use Render MCP or CLI
render services list
render logs <service-name> --tail 50
# Auto-deploys on git push to main
```

## 🔧 Common Fixes

### 1. Docker Permission Errors (EACCES)

**Problem**: `Error: EACCES: permission denied, mkdir '/app/.next'`

**Solution**: In Dockerfile, create directories BEFORE switching to nextjs user:

```dockerfile
# CRITICAL: Create directories with correct permissions
RUN mkdir -p .next && chown -R nextjs:nodejs .next
RUN touch next-env.d.ts && chown nextjs:nodejs next-env.d.ts
USER nextjs  # Switch user AFTER creating directories
```

### 2. Build Timestamp Not Updating

**Problem**: Build time shows old timestamp instead of current build time

**Files to check**:

- `/scripts/generate-build-info.js` - Should generate timestamp
- `Dockerfile` - Should run the script during build
- `/src/utils/buildInfo.ts` - Should read the timestamp

**Quick fix**:

```bash
# Force regenerate build info
node scripts/generate-build-info.js
cat .env.production.local  # Should show NEXT_PUBLIC_BUILD_TIME
```

### 3. Environment Variables Not Loading

**Problem**: `process.env.NEXT_PUBLIC_*` returns undefined

**Solution**: Use fallback values in code:

```javascript
const CLIENT_ID =
  process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "5c6ll37299p351to549lkg3o0d";
```

### 4. Vite Confusion

**Status**: REMOVED - This is a pure Next.js app, no Vite

- All VITE\_ prefixes have been removed
- Use only NEXT*PUBLIC* for client-side env vars

## 🏗️ Build & Deploy

### Local Development

```bash
cd ~/Documents/projects/siam
npm run dev  # Runs on http://localhost:3000
```

### Render Deployment

```bash
# Deploy to Render
git add -A && git commit -m "Your message" && git push origin main

# Render auto-deploys on push to main
# Monitor deployment via Render MCP tools
```

## 🚨 RAILWAY PURGE - SEPTEMBER 2024

**IMPORTANT**: Railway.com has been completely removed from this project. All deployments now use Render.com exclusively.

### What Was Removed:
- 27 Railway-specific files (.sh scripts, configs, logs)
- .railway directory
- All Railway URLs in source code
- Railway references in Playwright tests

### New Render-Only Setup:

#### Production URL:
- Main app: `https://siam.onrender.com`
- AOMA MCP: `https://aoma-mesh-mcp.onrender.com`

#### Helper Scripts:
```bash
# Check Render deployment status
./check-render-status.sh

# Run Playwright tests against Render
./run-render-tests.sh        # Default Chrome tests
./run-render-tests.sh smoke   # Smoke tests only
./run-render-tests.sh auth    # Auth flow tests
./run-render-tests.sh all     # Full test suite
```

#### Playwright Configurations:
- `playwright.config.ts` - Default config (points to Render)
- `playwright.config.render.ts` - Explicit Render production testing
- `playwright.config.local.ts` - Local development testing

### Environment Variables (Render)

Must be set in Render dashboard:

- `NODE_ENV=development` (for debugging)
- `NEXT_PUBLIC_DEBUG_MODE=true` (for debug logs)
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-2_A0veaJRLo`
- `NEXT_PUBLIC_COGNITO_CLIENT_ID=5c6ll37299p351to549lkg3o0d`

## 🐛 Known Issues

### 1. React Hydration Error (Error 306)

- Occurs when server/client render differently
- Fixed by adding `"use client"` directive and mounted state check
- File: `/src/components/auth/MagicLinkLoginForm.tsx`

### 2. Health Check Timeout

- Render health check at `/api/health`
- Configure timeout in Render dashboard settings
- Next.js dev mode takes time to compile

### 3. Sharp Warning

- pnpm security warning about build scripts
- Sharp is for image processing (not used with `images.unoptimized: true`)
- Can be safely ignored in dev

## 🧪 Production Testing Documentation

**COMPREHENSIVE GUIDE**: See `docs/PRODUCTION_TESTING.md` for complete testing strategies, especially:
- Production deployment verification
- Authentication flow testing  
- Web component conflict prevention
- Browser console monitoring
- CI/CD integration

### Critical Production Fix (September 2024)
**CustomElementGuard**: Prevents third-party web component registration conflicts that can break authentication.
Always test production after deployment to verify no external script conflicts.

## 📝 Testing Authentication

### Mailinator Testing Setup

**Test Email Configuration:**

The application uses Mailinator for testing magic link authentication:

- **Test Email**: `siam-test-x7j9k2p4@mailinator.com`
- **Public Inbox**: https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-test-x7j9k2p4
- **No API key required** for basic testing
- Verification codes can be retrieved from the public inbox

**Run Authentication Tests:**

```bash
# Main authentication flow test
npm run test:e2e tests/auth/magic-link-auth.spec.ts

# Test user authentication
npm run test:e2e tests/auth/test-user-auth.spec.ts
```

### Test Credentials

```
Allowed emails:
- matt@mattcarpenter.com
- fiona.burgess.ext@sonymusic.com
- fiona@fionaburgess.com
- claude@test.siam.ai
- *@sonymusic.com
- siam-test-x7j9k2p4@mailinator.com (test email)
```

### Test Auth Flow

```javascript
// Use Playwright to test
node check-site-console.js

// Or use playwright-mcp in Claude:
playwright_navigate url="https://iamsiam.ai"
playwright_fill selector="input[type='email']" value="matt@mattcarpenter.com"
playwright_click selector="button:has-text('Send Magic Link')"
playwright_console_logs limit=20
```

## 🔍 Debug Commands

### Check Logs

```bash
# Render logs (via MCP or CLI)
render logs <service-name> | grep -E "EACCES|Error|AUTH|COGNITO"

# Local process logs
tail -f server.log
tail -f dev.log

# Browser console (via Playwright)
playwright_console_logs type="error" limit=50
```

### File Permissions Check

```bash
# In Docker container
docker exec -it <container> ls -la /app/
docker exec -it <container> whoami
```

## 📂 Project Structure

```
/siam
├── app/              # Next.js App Router
│   ├── api/         # API routes
│   │   └── health/  # Health check endpoint
│   └── page.tsx     # Main page
├── src/
│   ├── components/  # React components
│   ├── services/    # Services (Cognito, etc)
│   └── utils/       # Utilities
├── Dockerfile       # Render deployment
├── render.yaml      # Render config (if needed)
└── next.config.js   # Next.js config
```

## 🚨 CRITICAL REMINDERS

1. **ALWAYS check Render logs** when deployment fails:

   ```bash
   # Via Render MCP or CLI
   render logs <service-name> --tail 100
   ```

2. **Build timestamp MUST be generated at build time**, not import time
   - Check `scripts/generate-build-info.js`
   - Verify Dockerfile runs the script

3. **Permission errors = Docker user issue**
   - Files must be owned by nextjs:nodejs
   - Directories must be created BEFORE USER nextjs

4. **We're in DEV MODE on Render** for debugging
   - Full error messages
   - All debug logs enabled
   - No minification

## 📞 Quick Troubleshooting

If deployment fails:

1. Check Render dashboard or use MCP tools to monitor
2. Check for permission errors in logs
3. Verify health endpoint responds
4. Check browser console with Playwright
5. Screenshot current state

Last updated: August 26, 2025

## 🚀 Render MCP Server Integration

**HIGHLY RECOMMENDED**: We've integrated the Render MCP server for seamless deployment management directly from Claude Code.

### Quick Setup:

```bash
# Run the automated setup script
./scripts/setup-render-mcp.sh
```

### Manual Setup Steps:

1. **Get your Render API Key**:
   - Go to [Render Dashboard → Account Settings → API Keys](https://dashboard.render.com/settings#api-keys)
   - Create a new API key (name it "Claude Code MCP")
   - Copy the API key

2. **Set the environment variable**:
   ```bash
   # Add to your .env.local
   RENDER_API_KEY=your_render_api_key_here
   ```

3. **Restart Claude Code** to pick up the new MCP server

### Available Commands (Natural Language):

```bash
# Deployment Management
"List my Render services"
"Show deployment status for siam-app"  
"Check recent logs for my SIAM service"
"Why isn't iamsiam.ai responding?"

# Service Operations  
"Update environment variables for siam-app"
"Show metrics for the last 24 hours"
"What was the busiest traffic day this month?"

# Database Management
"Query the Supabase database for recent user signups"
"Show database connection metrics"
"Create a new database backup"

# Troubleshooting
"Pull error-level logs from the last hour"
"Check deployment history for siam-app"
"Show recent errors and their frequency"
```

### Integration Benefits:

- **No Dashboard Switching**: Manage deployments without leaving Claude Code
- **Natural Language Interface**: Use English instead of CLI commands
- **Real-time Monitoring**: Check metrics and logs instantly
- **Database Queries**: Query production data directly
- **Troubleshooting**: Get instant access to logs and error reports

### Example Usage:

```bash
# Instead of going to Render dashboard...
"Check if siam-app is healthy"
"Show me the latest deployment logs"
"Update the OPENAI_API_KEY environment variable"

# Database operations:
"Query users table for accounts created today"
"Show database performance metrics"

# Service management:
"Create a new static site for documentation"
"Deploy siam-app with the latest changes"
```

## Task Master AI Instructions

**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md

- when you deploy, it's a push to git remote main, and you should monitor logs via the render.com MCP, github CLI, and potentially the render.com CLI.
- **CRITICAL**: We use Render.com EXCLUSIVELY for all deployments (main app AND aoma-mesh-mcp server). Railway has been completely removed from the project. All Railway references have been purged as of September 2024.
- use AI Elements where appropriate, such as in conversations, code bloc, chat inputs, and inline citations: https://ai-sdk.dev/elements/overview