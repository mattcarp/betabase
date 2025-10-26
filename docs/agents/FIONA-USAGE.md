# Fiona Agent Usage

Complete guide to using the Fiona enhanced agent for SIAM development.

## Agent Selection

**IMPORTANT**: Always use `fiona-enhanced` agent, never basic `fiona` (deprecated).

## Fiona Enhanced Capabilities

- Browser testing (Playwright MCP)
- TestSprite integration
- Browserbase cloud testing
- HITL (Human-in-the-Loop) features
- Semgrep security scanning
- MAC Design System validation
- 8-phase design review methodology

## Invoking Fiona

```bash
# Use Task tool with fiona subagent type
@fiona "Analyze the authentication system"

# Specific tasks
@fiona "Perform comprehensive design review"
@fiona "Run security scan and report vulnerabilities"
@fiona "Validate MAC Design System compliance"
```

## Security Scanning with Fiona

**MANDATORY**: When running Fiona for code analysis, ALWAYS include Semgrep security scanning.

### Security Scanning Workflow

1. **Initial Analysis**: Run `semgrep_scan` to detect vulnerabilities
2. **Focus Areas**:
   - Exposed API keys and credentials
   - Authentication bypass mechanisms
   - Client-side security vulnerabilities
   - SQL injection and XSS risks
   - Insecure configurations
3. **Report Format**: Security findings in priority order (Critical → High → Medium → Low)
4. **Remediation**: Specific fixes for each vulnerability

### Available Semgrep Tools

- `mcp__semgrep__security_check` - General vulnerability scan
- `mcp__semgrep__semgrep_scan` - Scan with specific configuration
- `mcp__semgrep__semgrep_scan_with_custom_rule` - Custom security rules

## MAC Design System Validation

**MANDATORY**: When Fiona analyzes UI/UX, she MUST validate MAC Design System compliance.

### Design Validation Workflow

1. **Read MAC Design System**: Load `src/styles/mac-design-system.css`
2. **Extract design tokens**: Parse CSS variables and class definitions
3. **Validate against standards**: Check `.mac-*` class usage
4. **Verify compliance**: Colors, typography, animations
5. **Report violations**: Flag as HIGH priority
6. **Suggest alternatives**: MAC-compliant solutions

### Key Validation Areas

- Color token compliance (CSS variables)
- Typography weights (100-400 only)
- Component patterns (`.mac-*` classes)
- Animation timings and easing
- Glassmorphism and visual effects

## Visual UI/UX Scoring

Fiona performs comprehensive visual scoring using Playwright screenshots.

### Screenshot Sections

```javascript
const sections = [
  { name: "login", url: "/", selector: ".mac-card" },
  { name: "dashboard", url: "/dashboard", selector: ".mac-professional" },
  { name: "chat-interface", url: "/chat", selector: ".mac-glass" },
  { name: "hud-view", url: "/hud", selector: ".mac-floating-orb" },
  // Additional sections...
];
```

### UI/UX Scoring Criteria (1-10 scale)

1. **Visual Hierarchy** (15%) - Focal points, prioritization
2. **Color & Contrast** (15%) - MAC compliance, WCAG ratios
3. **Typography** (10%) - Readability, hierarchy
4. **Spacing & Layout** (15%) - Padding, alignment, whitespace
5. **Interactive Elements** (10%) - Button visibility, affordance
6. **Visual Consistency** (10%) - Component uniformity
7. **Accessibility** (10%) - Focus indicators, keyboard nav
8. **Performance Perception** (5%) - Loading states, skeletons
9. **Emotional Design** (5%) - Professional aesthetic
10. **Mobile Responsiveness** (5%) - Viewport optimization

## Reference

- **Design Review**: See [../design/DESIGN-REVIEW.md](../design/DESIGN-REVIEW.md)
- **MAC Design System**: See [../design/MAC-DESIGN-SYSTEM.md](../design/MAC-DESIGN-SYSTEM.md)
- **Agent Workflows**: See [AGENT-WORKFLOWS.md](AGENT-WORKFLOWS.md)

---

*For quick reference, see [QUICK-START.md](../QUICK-START.md)*
