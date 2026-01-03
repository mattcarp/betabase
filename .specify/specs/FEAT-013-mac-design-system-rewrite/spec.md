# Feature Specification: MAC Design System Rewrite

**Feature Branch**: `FEAT-013-mac-design-system-rewrite`
**Created**: 2026-01-03
**Status**: Complete
**Input**: User description: "Rewrite MAC design system to recreate the teal-themed design from about a year ago, with better fonts and response formatting"

## User Scenarios & Testing

### User Story 1 - Teal Color Theme (Priority: P1)

User wants the application to use a teal color palette instead of the current blue/purple scheme, matching the visual style from approximately one year ago.

**Why this priority**: The color theme is the most visible change and the primary user request.

**Independent Test**: Can be verified by viewing any page and confirming all accent colors are teal (#26c6da, #00bcd4) instead of blue/purple.

**Acceptance Scenarios**:

1. **Given** the application is loaded, **When** I view any page, **Then** all accent colors should be teal
2. **Given** I view a response with headings, **When** the response renders, **Then** headings should be teal colored
3. **Given** I hover over buttons or interactive elements, **When** the hover effect activates, **Then** the glow/shadow should be teal

---

### User Story 2 - Inter Font Typography (Priority: P2)

User wants the Inter font to be the primary typeface for all text in the application.

**Why this priority**: Typography is a key element of the design system but secondary to color.

**Independent Test**: Can be verified by inspecting any text element and confirming the font-family is Inter.

**Acceptance Scenarios**:

1. **Given** the application is loaded, **When** I inspect any text, **Then** the font-family should include Inter
2. **Given** the application loads, **When** fonts render, **Then** Inter should load without FOUT (Flash of Unstyled Text)

---

### User Story 3 - Teal Inline Code Highlighting (Priority: P3)

User wants inline code in responses to have teal-themed highlighting that stands out better.

**Why this priority**: Improves readability of technical content in responses.

**Independent Test**: Can be verified by viewing a response with inline `code` and confirming teal background/border.

**Acceptance Scenarios**:

1. **Given** a response contains inline code, **When** rendered, **Then** inline code should have teal-tinted background and border
2. **Given** inline code is present, **When** I view it, **Then** the text color should be lighter teal for contrast

---

### User Story 4 - Catppuccin Mocha Code Blocks (Priority: P3)

User wants code blocks to use the Catppuccin Mocha syntax highlighting theme.

**Why this priority**: Improves code readability and matches modern aesthetic preferences.

**Independent Test**: Can be verified by viewing a code block and confirming Catppuccin Mocha colors.

**Acceptance Scenarios**:

1. **Given** a response contains a code block, **When** rendered, **Then** syntax highlighting should use Catppuccin Mocha theme

---

### Edge Cases

- What happens when dark mode is toggled? (All teal colors should remain consistent)
- How does system handle missing font files? (Fallback to system fonts gracefully)

## Requirements

### Functional Requirements

- **FR-001**: System MUST use teal (#26c6da) as the primary accent color
- **FR-002**: System MUST use teal (#00bcd4) as the secondary accent color
- **FR-003**: System MUST load Inter font with weights 100-700
- **FR-004**: AI response headings MUST be colored teal
- **FR-005**: Inline code MUST have teal-themed styling (background, border, text)
- **FR-006**: Code blocks MUST use Catppuccin Mocha syntax highlighting theme
- **FR-007**: All glow/shadow effects MUST use teal color

### Key Entities

- **Color Tokens**: Centralized in `/src/styles/tokens/colors.css`
- **Typography Tokens**: Centralized in `/src/styles/tokens/typography.css`

## Success Criteria

### Measurable Outcomes

- **SC-001**: All accent colors in the UI are teal (verified by visual inspection)
- **SC-002**: Inter font loads on all pages (verified by browser dev tools)
- **SC-003**: Response headings are teal (verified by viewing AI responses)
- **SC-004**: Code blocks use Catppuccin Mocha theme (verified by viewing code in responses)
- **SC-005**: No hardcoded blue/purple colors remain in updated components
