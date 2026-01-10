# Feature Specification: Role-Based Contextual Chat System

**Feature Branch**: `FEAT-018-role-based-chat`
**Created**: 2025-01-10
**Status**: Draft
**Input**: Transform the static 4-tab interface into a role-gated contextual chat system where user-enabled roles determine which tabs appear and each tab provides specialized AI conversation context.

## Overview

The settings menu (gear icon, upper right) contains three toggleable roles:
1. **Tech Support Staff** (base role, default ON) - Unlocks Chat tab
2. **Tester** (additive) - Unlocks Test tab with test-oriented chat
3. **Programmer** (additive) - Unlocks Fix tab with code-focused chat

Roles are **additive**: users can enable all three simultaneously. Each tab maintains its own conversation context with specialized system prompts and data sources.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Role-Based Tab Visibility (Priority: P1)

As a user, I want tabs to appear/disappear based on my enabled roles, so I only see interfaces relevant to my current work context.

**Why this priority**: Core feature - without this, the entire role system doesn't function. Must work before any other features.

**Independent Test**: Can be fully tested by toggling roles in settings and observing tab bar changes. Delivers immediate value by decluttering the UI.

**Acceptance Scenarios**:

1. **Given** only Tech Support Staff is enabled, **When** I view the tab bar, **Then** I see only the Chat tab
2. **Given** Tech Support Staff + Tester are enabled, **When** I view the tab bar, **Then** I see Chat and Test tabs
3. **Given** Tech Support Staff + Programmer are enabled, **When** I view the tab bar, **Then** I see Chat and Fix tabs
4. **Given** all three roles are enabled, **When** I view the tab bar, **Then** I see Chat, Test, and Fix tabs
5. **Given** only Tester + Programmer are enabled (no Tech Support), **When** I view the tab bar, **Then** I see only Test and Fix tabs (no Chat)

---

### User Story 2 - Tech Support Staff Role & Settings Menu (Priority: P1)

As a user, I want to see Tech Support Staff as the first role option in settings, so I understand it's the base role that controls the main Chat tab.

**Why this priority**: Foundation for role system - settings menu must show all three roles correctly.

**Independent Test**: Can be tested by opening settings menu and verifying three toggles appear in correct order with correct labels.

**Acceptance Scenarios**:

1. **Given** I click the gear icon, **When** the settings dropdown opens, **Then** I see three role toggles in order: Tech Support Staff, Tester, Programmer
2. **Given** I am a new user, **When** I first open the app, **Then** Tech Support Staff is ON by default, Tester and Programmer are OFF
3. **Given** Tech Support Staff is enabled, **When** I view the toggle, **Then** it shows a green accent color (matching design system)
4. **Given** I toggle Tech Support Staff OFF, **When** I view the tab bar, **Then** the Chat tab disappears

---

### User Story 3 - Test Tab Chat Panel (Priority: P2)

As a Tester, I want a chat interface in the Test tab that understands testing context, so I can ask questions about tests, find existing tests, and generate Playwright code.

**Why this priority**: Major new component - adds significant value for testers but depends on P1 role gating being complete.

**Independent Test**: Can be tested by enabling Tester role, navigating to Test tab, and asking test-related questions. Chat should return relevant test data from betabase.

**Acceptance Scenarios**:

1. **Given** Tester role is enabled and I'm on the Test tab, **When** I click the Chat sub-tab, **Then** I see the TesterChatPanel with test-focused suggestions
2. **Given** I'm in the tester chat, **When** I ask "Find tests related to user authentication", **Then** the system queries betabase and returns relevant test scenarios
3. **Given** I'm in the tester chat, **When** I ask "Generate a Playwright test for login", **Then** the system generates valid Playwright code in an artifact
4. **Given** I'm in the tester chat, **When** I ask "Show flaky tests", **Then** the system queries test analytics and shows tests with high failure rates

---

### User Story 4 - Tech Support Chat Context (Priority: P2)

As Tech Support Staff, I want the Chat tab to use a support-focused system prompt, so responses are appropriate for non-technical users asking product questions.

**Why this priority**: Completes the role-specific context for the base role. Important but Chat tab already works - this enhances it.

**Independent Test**: Can be tested by asking product questions in Chat tab and verifying responses use non-technical language and suggest escalation to other roles when appropriate.

**Acceptance Scenarios**:

1. **Given** I'm in the Chat tab as Tech Support Staff, **When** I ask "How do I upload a file?", **Then** the response uses clear, non-technical language with step-by-step guidance
2. **Given** I ask a technical code question in the Chat tab, **When** the system responds, **Then** it suggests enabling Programmer mode for detailed code assistance
3. **Given** I ask about test failures in the Chat tab, **When** the system responds, **Then** it suggests enabling Tester mode for detailed test analysis

---

### User Story 5 - Conversation Context Isolation (Priority: P3)

As a user with multiple roles, I want each tab to maintain separate conversation histories, so my test discussions don't mix with my code debugging discussions.

**Why this priority**: Enhancement that improves UX but system is usable without it (users can manually manage context).

**Independent Test**: Can be tested by having conversations in each tab and verifying the sidebar shows only conversations relevant to the current tab.

**Acceptance Scenarios**:

1. **Given** I create a conversation in the Test tab, **When** I switch to the Fix tab, **Then** that conversation does not appear in the sidebar
2. **Given** I have conversations in multiple tabs, **When** I view a tab's sidebar, **Then** I only see conversations created in that tab's context
3. **Given** I switch between tabs, **When** I return to a tab, **Then** my previous conversation in that context is preserved

---

### Edge Cases

- What happens when NO roles are enabled? (Force Tech Support ON, or show empty state with prompt to enable a role?)
- What happens when user navigates to `/#test` via URL but Tester role is disabled? (Redirect to first available tab)
- What happens to existing conversations after upgrade? (Tag as 'chat' context by default)
- What happens when user disables a role while on that tab? (Switch to next available tab)

## Requirements *(mandatory)*

### Functional Requirements

**Role Infrastructure**
- **FR-001**: System MUST provide three toggleable roles in settings: Tech Support Staff, Tester, Programmer
- **FR-002**: System MUST persist role settings across browser sessions via localStorage
- **FR-003**: Tech Support Staff MUST default to ON for new users
- **FR-004**: Tester and Programmer MUST default to OFF for new users

**Tab Visibility**
- **FR-005**: System MUST show Chat tab only when Tech Support Staff role is enabled
- **FR-006**: System MUST show Test tab only when Tester role is enabled
- **FR-007**: System MUST show Fix tab only when Programmer role is enabled
- **FR-008**: System MUST allow multiple roles to be enabled simultaneously (additive model)
- **FR-009**: System MUST handle the case where no roles are enabled gracefully

**Chat Contexts**
- **FR-010**: Each tab with a chat interface MUST use a role-specific system prompt
- **FR-011**: Tech Support Staff chat MUST use non-technical language and suggest escalation to other roles
- **FR-012**: Tester chat MUST have access to betabase test data (8,449+ test scenarios)
- **FR-013**: Tester chat MUST be able to generate Playwright test code artifacts
- **FR-014**: Programmer chat MUST have access to Git, JIRA, Confluence, and knowledge base (already implemented)

**Conversation Management**
- **FR-015**: System MUST tag new conversations with their originating tab context
- **FR-016**: System MUST filter sidebar conversations by current tab context
- **FR-017**: System MUST preserve existing conversations during migration (default to 'chat' context)

### Key Entities

- **Role**: User-toggleable persona that gates access to specific tabs and chat contexts
  - Properties: id, name, icon, isEnabled, accentColor
  - Relationships: One-to-one with Tab

- **Tab**: Navigation destination with specialized content
  - Properties: id, label, icon, requiredRole, chatComponent
  - Relationships: Many conversations belong to one tab context

- **Conversation**: Chat history with AI
  - Properties: id, title, messages[], context (chat|test|fix), createdAt, updatedAt
  - Relationships: Belongs to one tab context

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can toggle any role and see corresponding tab appear/disappear within 100ms
- **SC-002**: New users see only the Chat tab on first visit (Tech Support Staff default)
- **SC-003**: Tester chat returns relevant test data for 90% of test-related queries
- **SC-004**: Users can generate valid Playwright code from natural language descriptions
- **SC-005**: Conversation context isolation prevents cross-tab conversation leakage (0 incidents in testing)
- **SC-006**: Role settings persist correctly across browser sessions (100% reliability)

## Technical Context (for implementation reference)

### Files to Create
- `src/lib/use-tech-support-store.ts` - Zustand store for Tech Support role
- `src/components/tester/TesterChatPanel.tsx` - Test-oriented chat component
- `src/app/api/tester/chat/route.ts` - API endpoint for tester chat

### Files to Modify
- `src/components/ui/settings-menu.tsx` - Add Tech Support Staff toggle
- `src/components/ui/pages/ChatPage.tsx` - Wire role stores to tab visibility
- `src/components/test-dashboard/TestDashboard.tsx` - Add Chat sub-tab
- `src/components/ai/ai-sdk-chat-panel.tsx` - Add Tech Support system prompt
- `src/lib/conversation-store.ts` - Add context field
- `src/components/ui/app-sidebar.tsx` - Filter conversations by context

### Existing Infrastructure to Leverage
- `src/components/fixit/FixitChatPanel.tsx` - Template for TesterChatPanel
- `src/lib/use-tester-store.ts` - Existing Tester role store (needs wiring to tabs)
- `src/lib/use-programmer-store.ts` - Existing Programmer role store (needs wiring to tabs)
- Betabase tables: `historical_tests_view`, `rlhf_generated_tests`, `self_healing_attempts`
