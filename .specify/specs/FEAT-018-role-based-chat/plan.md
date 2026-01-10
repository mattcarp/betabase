# FEAT-018: Implementation Plan

## Phase 1: Role Infrastructure & Settings

### 1.1 Verify Existing Role Stores
- Confirm `use-tester-store.ts` defaults to OFF
- Confirm `use-programmer-store.ts` defaults to OFF
- Ensure localStorage keys don't conflict
- Verify persistence across sessions
- Note: No store needed for Tech Support Staff (always on)

### 1.2 Update Settings Menu
- Modify `src/components/ui/settings-menu.tsx`
- Display Tech Support Staff as always-on label (no toggle)
- Add Tester toggle below
- Add Programmer toggle below
- Green accent color for enabled toggles
- Icon differentiation for each role

### 1.3 Role-Based Tab Visibility Logic
- Create `src/lib/use-role-tabs.ts` hook
- Chat tab always visible (Tech Support Staff always on)
- Tester enabled → Test tab visible
- Programmer enabled → Fix tab visible
- Simpler logic: no "no roles" edge case to handle

## Phase 2: Tab System Refactor

### 2.1 Refactor ChatPage Tab Rendering
- Update `src/components/ui/pages/ChatPage.tsx`
- Replace static 4-tab array with dynamic role-gated tabs
- Wire `useRoleTabs()` hook
- Maintain existing tab styling and behavior

### 2.2 Tab Transition Animations
- Smooth appearance/disappearance of tabs
- No jarring layout shifts
- Maintain user's position when possible

## Phase 3: Context-Specific Chat Panels

### 3.1 Tech Support System Prompt
- Update `src/components/ai/ai-sdk-chat-panel.tsx`
- Add Tech Support-specific system prompt
- Non-technical language guidelines
- Escalation suggestions to Tester/Programmer roles
- Product knowledge focus

### 3.2 Create TesterChatPanel Component
- New `src/components/tester/TesterChatPanel.tsx`
- Mirror structure of `FixitChatPanel.tsx`
- Test-focused system prompt
- Access to betabase test data (8,449+ scenarios)
- Playwright code generation capability

### 3.3 Create Tester Chat API Endpoint
- New `src/app/api/tester/chat/route.ts`
- Query betabase tables: `historical_tests_view`, `rlhf_generated_tests`
- RAG integration for test discovery
- Artifact generation for Playwright code

### 3.4 Wire Test Tab Chat Sub-Tab
- Update `src/components/test-dashboard/TestDashboard.tsx`
- Add Chat as sub-tab alongside existing test views
- Route to TesterChatPanel
- Maintain existing test dashboard functionality

## Phase 4: Conversation Context Isolation

### 4.1 Extend Conversation Schema
- Update `src/lib/conversation-store.ts`
- Add `context` field: 'chat' | 'test' | 'fix'
- Migration strategy for existing conversations
- Default existing to 'chat' context

### 4.2 Tag New Conversations
- Auto-tag based on originating tab
- Chat tab → 'chat' context
- Test tab → 'test' context
- Fix tab → 'fix' context
- Persist context in Supabase

### 4.3 Filter Sidebar by Context
- Update `src/components/ui/app-sidebar.tsx`
- Query conversations filtered by current tab context
- Show only relevant conversation history
- Maintain global "All Conversations" option (optional)

### 4.4 Context Switch Preservation
- Remember last conversation per context
- Return to correct conversation when switching tabs
- Don't lose unsaved state

## Testing Strategy

### Unit Tests
- Role store toggling and persistence
- Tab visibility derivation logic
- Context tagging functions
- System prompt selection

### Integration Tests
- Settings menu role toggle → tab visibility
- TesterChatPanel betabase queries
- Conversation context filtering

### E2E Tests (Playwright)
- Toggle roles, verify tabs appear/disappear
- Create conversation in Test tab, verify not in Chat sidebar
- Navigate to disabled tab URL, verify redirect
- New user default state (Tech Support ON, others OFF)

## Rollout Plan

1. **Phase 1**: Role infrastructure behind feature flag
2. **Phase 2**: Tab visibility tied to roles
3. **Phase 3**: Context-specific chat panels
4. **Phase 4**: Conversation isolation, full release

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Existing conversations orphaned | Default to 'chat' context on migration |
| Users confused by missing tabs | Clear settings UI, helpful empty states |
| Tester chat slow (large betabase) | Pagination, caching, optimized RAG queries |
| Role state desync across tabs | Single source of truth in Zustand stores |
| Breaking existing Fix tab | Preserve FixitChatPanel as-is, only wire visibility |
