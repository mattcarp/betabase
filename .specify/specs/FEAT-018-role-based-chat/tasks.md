# FEAT-018: Task Breakdown

## Phase 1: Role Infrastructure & Settings

### P1-001: Audit Existing Role Stores
- **Status**: pending
- **Estimate**: 30min
- **Description**: Review `use-tester-store.ts` and `use-programmer-store.ts` to confirm defaults and persistence
- **Acceptance**:
  - Both default to `false` for new users
  - localStorage keys are distinct and non-conflicting
  - Persistence verified across page refresh
  - No store needed for Tech Support Staff (always on by design)

### P1-002: Update Settings Menu with Role Display
- **Status**: pending
- **Estimate**: 1hr
- **Description**: Modify `src/components/ui/settings-menu.tsx` to show Tech Support Staff as always-on, with Tester/Programmer toggles
- **Acceptance**:
  - Tech Support Staff shown as label (no toggle) - always active
  - Tester toggle below with icon
  - Programmer toggle below with icon
  - Green accent when enabled (matching design system)
  - Toggles wire correctly to respective stores
- **Files**: `src/components/ui/settings-menu.tsx`

### P1-003: Create useRoleTabs Hook
- **Status**: pending
- **Estimate**: 30min
- **Description**: Create `src/lib/use-role-tabs.ts` to derive visible tabs from roles
- **Acceptance**:
  - Chat tab always included (Tech Support Staff always on)
  - Test tab included when Tester enabled
  - Fix tab included when Programmer enabled
  - Reactive to role store changes
- **Files**: `src/lib/use-role-tabs.ts`

### P1-004: Write Unit Tests for Role Infrastructure
- **Status**: pending
- **Estimate**: 45min
- **Description**: Unit tests for role stores and useRoleTabs hook
- **Acceptance**:
  - Test default values for new users
  - Test persistence across mock reload
  - Test all 4 role combinations for tab derivation (Chat always present)
  - Tests pass in CI

---

## Phase 2: Tab System Refactor

### P2-001: Refactor ChatPage Tab Rendering
- **Status**: pending
- **Estimate**: 2hr
- **Description**: Update `src/components/ui/pages/ChatPage.tsx` to use dynamic role-gated tabs
- **Acceptance**:
  - Tabs render based on `useRoleTabs()` output
  - Existing tab styling preserved
  - No regressions in tab navigation
  - Hash routing still works
- **Files**: `src/components/ui/pages/ChatPage.tsx`

### P2-002: Write E2E Tests for Tab Visibility
- **Status**: pending
- **Estimate**: 1hr
- **Description**: Playwright tests for role-based tab visibility
- **Acceptance**:
  - Test: Chat tab always visible
  - Test: Toggle Tester ON → Test tab appears
  - Test: Toggle Tester OFF → Test tab disappears
  - Test: Toggle Programmer ON → Fix tab appears
  - Test: Toggle Programmer OFF → Fix tab disappears
- **Files**: `tests/e2e/features/role-based-tabs.spec.ts`

---

## Phase 3: Context-Specific Chat Panels

### P3-001: Add Tech Support System Prompt
- **Status**: pending
- **Estimate**: 1hr
- **Description**: Create Tech Support-specific system prompt in chat panel
- **Acceptance**:
  - Non-technical, friendly language guidelines
  - Suggests escalation to Tester/Programmer when appropriate
  - Product knowledge focus (betabase documentation)
  - Integrated into existing ai-sdk-chat-panel
- **Files**: `src/components/ai/ai-sdk-chat-panel.tsx`, `src/lib/prompts/tech-support-prompt.ts`

### P3-002: Create TesterChatPanel Component
- **Status**: pending
- **Estimate**: 2hr
- **Description**: New `src/components/tester/TesterChatPanel.tsx` mirroring FixitChatPanel
- **Acceptance**:
  - Test-focused system prompt
  - Chat input with suggestions
  - Response rendering with artifacts
  - Loading/error states
- **Files**: `src/components/tester/TesterChatPanel.tsx`

### P3-003: Create Tester Chat API Endpoint
- **Status**: pending
- **Estimate**: 2hr
- **Description**: New `src/app/api/tester/chat/route.ts` for test-focused AI chat
- **Acceptance**:
  - Queries betabase: `historical_tests_view`, `rlhf_generated_tests`
  - RAG retrieval for relevant test scenarios
  - Can generate Playwright code artifacts
  - Proper error handling and streaming
- **Files**: `src/app/api/tester/chat/route.ts`

### P3-004: Wire TesterChatPanel to Test Dashboard
- **Status**: pending
- **Estimate**: 1hr
- **Description**: Add Chat sub-tab to TestDashboard component
- **Acceptance**:
  - Chat appears as sub-tab in Test tab
  - Existing test dashboard tabs preserved
  - Smooth navigation between sub-tabs
  - TesterChatPanel renders correctly
- **Files**: `src/components/test-dashboard/TestDashboard.tsx`

### P3-005: Write Integration Tests for Tester Chat
- **Status**: pending
- **Estimate**: 1.5hr
- **Description**: Integration tests for TesterChatPanel and API
- **Acceptance**:
  - Test: Query "find auth tests" returns relevant results
  - Test: "Generate Playwright test" produces valid code
  - Test: Error handling when betabase unavailable
  - Mocked API responses for unit tests

---

## Phase 4: Conversation Context Isolation

### P4-001: Extend Conversation Store Schema
- **Status**: pending
- **Estimate**: 1hr
- **Description**: Add `context` field to conversation-store
- **Acceptance**:
  - New field: `context: 'chat' | 'test' | 'fix'`
  - TypeScript types updated
  - Migration: existing conversations default to 'chat'
  - Supabase schema updated if using DB persistence
- **Files**: `src/lib/conversation-store.ts`

### P4-002: Auto-Tag New Conversations by Context
- **Status**: pending
- **Estimate**: 45min
- **Description**: Tag conversations based on originating tab
- **Acceptance**:
  - Conversations created in Chat tab → context: 'chat'
  - Conversations created in Test tab → context: 'test'
  - Conversations created in Fix tab → context: 'fix'
  - Context persists with conversation
- **Files**: `src/lib/conversation-store.ts`, `src/components/ai/ai-sdk-chat-panel.tsx`

### P4-003: Filter Sidebar by Tab Context
- **Status**: pending
- **Estimate**: 1.5hr
- **Description**: Update app-sidebar to filter conversations by current context
- **Acceptance**:
  - Sidebar shows only conversations matching current tab
  - Chat tab → shows 'chat' context conversations
  - Test tab → shows 'test' context conversations
  - Fix tab → shows 'fix' context conversations
- **Files**: `src/components/ui/app-sidebar.tsx`

### P4-004: Preserve Context State on Tab Switch
- **Status**: pending
- **Estimate**: 1hr
- **Description**: Remember and restore last conversation per context
- **Acceptance**:
  - Switching away from tab remembers active conversation
  - Switching back restores that conversation
  - Works across page refresh (localStorage)
  - No data loss on rapid switching

### P4-005: Write E2E Tests for Context Isolation
- **Status**: pending
- **Estimate**: 1.5hr
- **Description**: Playwright tests for conversation context isolation
- **Acceptance**:
  - Test: Create conversation in Test tab, not visible in Chat sidebar
  - Test: Conversations persist to correct context after refresh
  - Test: Switching tabs preserves conversation state
- **Files**: `tests/e2e/features/conversation-context.spec.ts`

### P4-006: Migration Script for Existing Conversations
- **Status**: pending
- **Estimate**: 30min
- **Description**: One-time migration to tag existing conversations as 'chat'
- **Acceptance**:
  - Safe to run multiple times (idempotent)
  - All existing conversations get context: 'chat'
  - No data loss
  - Logging for audit

---

## Summary

| Phase | Tasks | Est. Total |
|-------|-------|------------|
| Phase 1: Role Infrastructure | 4 | ~2.75hr |
| Phase 2: Tab System Refactor | 2 | ~3hr |
| Phase 3: Context Chat Panels | 5 | ~7.5hr |
| Phase 4: Conversation Isolation | 6 | ~6.25hr |
| **Total** | **17** | **~19.5hr** |

## Dependencies

```
P1-001 ──┬── P1-003 ── P2-001 ──┬── P2-002
P1-002 ──┘            │         └── P2-003
         P1-004 ──────┘
         
P3-001 (independent)
P3-002 ── P3-003 ── P3-004

P4-001 ── P4-002 ──┬── P4-003
                   └── P4-004
```
