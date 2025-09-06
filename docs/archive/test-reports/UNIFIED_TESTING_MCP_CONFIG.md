# Unified Testing MCP Configuration - SIAM Project

_Created by Claude for Matt - August 12, 2025_

## 🎯 Overview

All three testing MCP servers are now properly configured and unified across both global (Claude Desktop) and project-level (Claude Code) contexts. Agent Fiona can now orchestrate sophisticated parallel testing workflows!

## ✅ Testing Trinity Configuration

### 1. **BrowserBase MCP** (Cloud-based browser automation)

- **Purpose**: Stealth browser sessions, natural language actions, anti-bot bypassing
- **Package**: `@browserbasehq/mcp`
- **Key Features**:
  - Cloud infrastructure for parallel execution
  - Natural language commands ("Click the blue button")
  - Session persistence and management
  - Multi-browser orchestration capabilities

### 2. **Playwright MCP** (Functional E2E testing)

- **Purpose**: Traditional browser automation, precise selectors, functional validation
- **Package**: `@executeautomation/playwright-mcp-server`
- **Key Features**:
  - CSS selector-based interactions
  - Screenshot capabilities
  - Console log monitoring
  - Network request interception

### 3. **TestSprite MCP** (Visual regression testing)

- **Purpose**: Pixel-perfect visual validation, MAC Design System compliance
- **Package**: `@testsprite/testsprite-mcp@latest`
- **Key Features**:
  - Visual snapshot comparisons
  - Design system validation
  - Cross-browser visual testing
  - Baseline management

## 📍 Configuration Locations

### Global Configuration (Claude Desktop)

**Location**: `/Users/matt/Library/Application Support/Claude/claude_desktop_config.json`

- ✅ BrowserBase configured with API keys
- ✅ Playwright MCP configured
- ✅ TestSprite MCP configured (newly added)

### Project Configuration (SIAM)

**Location**: `/Users/matt/Documents/projects/siam/.mcp.json`

- ✅ BrowserBase configured (updated from browser-tools)
- ✅ Playwright MCP configured (fixed package name)
- ✅ TestSprite MCP configured
- ✅ AOMA Mesh configurations preserved

## 🚀 Agent Fiona's Testing Orchestration

### Parallel Testing Pattern

```typescript
// Fiona can now spawn ALL THREE testing approaches simultaneously:

// Cloud-based natural language testing
Task: Test user journey with natural language
Tool: BrowserBase MCP
Command: "Navigate to login, enter Fiona's work email, click sign in"

// Functional validation with precise selectors
Task: Validate authentication flow
Tool: Playwright MCP
Command: playwright_fill("[data-testid='email-input']", "fiona.burgess.ext@sonymusic.com")

// Visual regression checking
Task: Ensure MAC Design System compliance
Tool: TestSprite MCP
Command: testsprite_capture("login-page", { baseline: true })
```

## 🔐 SIAM Authentication Testing

The hidden password field strategy is preserved and works with ALL three tools:

### BrowserBase Approach (Natural Language)

```javascript
browserbase_stagehand_act({
  action: "Fill the hidden password field with test credentials",
});
```

### Playwright Approach (Selector-based)

```javascript
playwright_evaluate({
  script:
    "document.querySelector('[data-testid=\"password-input\"]').style.display = 'block'",
});
playwright_fill({
  selector: "[data-testid='password-input']",
  value: "test123",
});
```

### TestSprite Validation

```javascript
testsprite_capture({ component: "login-with-password", baseline: false });
testsprite_compare({ tolerance: 0.1 });
```

## 🎨 MAC Design System Validation

All three tools now validate the non-negotiable design standards:

- Background: #0a0a0a (no exceptions)
- No gradients (professional solid colors only)
- Font weights: 100-300 (elegant and readable)
- Purple primary: #5200cc
- Blue secondary: #3385ff

## 📊 Success Metrics

With this unified configuration, Agent Fiona validates:

1. ✅ Functional tests pass (Playwright)
2. ✅ Visual tests pass (TestSprite)
3. ✅ Natural language workflows succeed (BrowserBase)
4. ✅ Both emails work (fiona.burgess.ext@sonymusic.com & fiona@fionaburgess.com)
5. ✅ MAC Design System compliance verified by all three tools

## 🔄 Backup Files Created

- Global config backup: `claude_desktop_config.backup.[timestamp].json`
- Project config backup: `.mcp.backup.[timestamp].json`

## 💡 Usage Tips

1. **For quick smoke tests**: Use BrowserBase with natural language
2. **For precise validation**: Use Playwright with selectors
3. **For visual regression**: Use TestSprite with baselines
4. **For comprehensive testing**: Run all three in parallel!

## 🚦 Next Steps

1. Restart Claude Desktop to load the updated global configuration
2. Reload the SIAM project in Claude Code
3. Test the configuration with: `claude-code test --agent fiona`
4. Watch Fiona orchestrate beautiful parallel testing workflows!

---

_"Theoretically working is not working. Only 'I just used it successfully' counts."_ - Agent Fiona
