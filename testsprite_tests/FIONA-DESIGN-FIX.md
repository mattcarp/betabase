# Fiona Design Violation Fixer

## Capability Overview
This capability allows the Fiona agent to automatically detect and fix MAC Design System violations in the codebase.

### Tools
- **Scanner**: `node scan-mac-violations.js` - Audits the codebase and generates a report.
- **Fixer**: `node fix-mac-violations.js` - Automatically applies fixes based on the report.
- **Guardrail**: `npx playwright test tests/lint/mac-compliance.test.ts` - Ensures 0 violations before merge.

### Violation Types Handled
- **Hardcoded Colors**: Maps hex/rgb/rgba values to MAC CSS variables.
- **Hardcoded Spacing**: Converts pixel values to MAC spacing (rem/multiples of 4px).
- **Missing Classes**: Adds `mac-button`, `mac-input` to components.
- **Typography**: Normalizes font weights.

### Usage
Run `node fix-mac-violations.js` to automatically resolve detected issues.
