# Three-Pillar Production Readiness Checklist

**Target:** Ensure all three pillars work flawlessly on localhost:3000 for demo recording

---

## 🚨 BLOCKING ISSUE - MUST FIX FIRST

### @google/generative-ai Package Not Found

**Problem:**
- Package installed in package.json
- Exists in node_modules
- Turbopack can't resolve it

**Tried:**
- pnpm add @google/generative-ai
- Manual symlink creation
- rm -rf node_modules && pnpm install --force
- rm -rf .next cache clear

**Still Failing:**
- Module not found error persists
- Likely pnpm workspace configuration issue

**Next Steps to Try:**
1. Check if there's a monorepo/workspace setup interfering
2. Try: `npm install @google/generative-ai` (use npm instead of pnpm)
3. Check Next.js config for module resolution overrides
4. Verify no .pnpmfile.cjs or workspace config conflicts

---

## PILLAR 1: CHAT - Readiness

### What Works ✅
- ChatPage component exists
- 5 mode tabs (Chat/HUD/Test/Fix/Curate)
- AiSdkChatPanel integrated
- Conversation store working

### What Needs Verification ⚠️
- [ ] Query: "Show me the multi-tenant database architecture"
  - Should return Mermaid diagram
  - Must render < 3 seconds
- [ ] Query: "What are the steps to link a product to a master in AOMA?"
  - Should show inline citations
  - Must have source attribution
- [ ] 45,399 vectors badge visible in UI
- [ ] Mermaid diagrams zoom/pan work

### Blockers
- Can't test until @google/generative-ai resolves

---

## PILLAR 2: CURATE - Readiness

### What Works ✅
- CleanCurateTab component exists
- Thumbs up/down feedback UI
- Star rating (1-5)
- Feedback submission

### What Needs Verification ⚠️
- [ ] Navigate to Curate tab → loads without error
- [ ] Feedback queue populated (or shows empty state gracefully)
- [ ] Submit feedback → success toast appears
- [ ] Accuracy chart updates (or shows placeholder)
- [ ] No Supabase errors in console

### Components to Check
- `src/components/ui/CleanCurateTab.tsx`
- `src/components/ui/RLHFFeedbackTab.tsx`  
- `src/components/ui/RLHFCuratorDashboard.tsx`

### Blockers
- createClientComponentClient issues (may need to replace with direct supabase import)

---

## PILLAR 3: TEST - Readiness

### What Works ✅
- TestDashboard component exists
- Self-Healing tab implemented
- Mock data for 3 healing attempts
- Visual workflow UI
- Tier badges (green/yellow/red)

### What Needs Verification ⚠️
- [ ] Navigate to Test tab → loads without error
- [ ] Stats grid shows:
  - Total Tests: 1,247
  - Auto-Healed: 1,175
  - Success Rate: 94.2%
  - Avg Heal Time: 4.2s
- [ ] Self-Healing tab clickable
- [ ] Healing queue shows 3 mock items
- [ ] Click item → workflow visualization appears
- [ ] Code diff (before/after) displays correctly
- [ ] Approve/reject buttons visible

### Components to Check
- `src/components/test-dashboard/TestDashboard.tsx`
- `src/components/test-dashboard/SelfHealingTestViewer.tsx`
- `src/components/test-dashboard/RLHFTestSuite.tsx`

### Mock Data
- Should be hardcoded in SelfHealingTestViewer
- 3 items: 95% confidence, 78% confidence, 42% confidence

---

## UI/UX Requirements for Demo

### Must-Have
- [ ] No console errors visible (hide DevTools or fix errors)
- [ ] Smooth tab transitions (no loading spinners > 1s)
- [ ] Text readable at 1920x1080 (zoom if needed)
- [ ] Dark theme consistent across tabs
- [ ] Stats/metrics animate or appear smoothly

### Nice-to-Have
- [ ] Loading states graceful (not jarring)
- [ ] Toast notifications styled consistently
- [ ] Hover states on buttons/citations work
- [ ] Responsive at different zoom levels

---

## Demo-Specific Features to Verify

### Mermaid Diagrams
- [ ] Render without errors
- [ ] Interactive (zoom/pan)
- [ ] Professional theme applied
- [ ] Export button works (optional)

### Inline Citations
- [ ] Hover shows source preview
- [ ] Click expands full context
- [ ] Source title/URL visible
- [ ] Similarity score shown (optional)

### Feedback UI
- [ ] Modal/panel expands smoothly
- [ ] Form validation works
- [ ] Submit shows success state
- [ ] Can cancel/close gracefully

### Self-Healing Workflow
- [ ] 4-step visual clear
- [ ] Icons for each step
- [ ] Connecting lines/arrows
- [ ] Before/after code diff readable

---

## Performance Requirements

### Page Load
- **Target:** < 2s initial load
- **Measured:** Time from navigate to interactive

### Query Response
- **Target:** < 3s for cached queries
- **Measured:** Time from submit to first token

### Tab Navigation
- **Target:** < 1s transition
- **Measured:** Click to content visible

### Diagram Render
- **Target:** < 2s for Mermaid
- **Measured:** Diagram request to full render

---

## Pre-Recording Test Script

Run this sequence to verify everything works:

```bash
# 1. Start dev server
cd ~/Documents/projects/mc-thebetabase
pnpm dev

# 2. Open browser to localhost:3000
# (Check: no auth prompt, goes straight to Chat)

# 3. Test Chat Pillar
# Type: "Show me the multi-tenant database architecture"
# Verify: Mermaid diagram appears
# Verify: No errors in console

# 4. Test Curate Pillar
# Click: "Curate" button in header
# Verify: Tab loads, no errors
# Verify: Feedback UI visible

# 5. Test Test Pillar
# Click: "Test" button in header
# Verify: Dashboard loads with stats
# Click: "Self-Healing" tab
# Verify: Healing queue visible
# Click: First healing item
# Verify: Workflow visualization appears

# 6. Return to Chat
# Verify: Can switch back smoothly

# 7. Check Console
# F12 → Console tab
# Verify: No red errors
# Yellow warnings OK if they don't affect functionality
```

---

## Known Issues to Fix

### Critical (Blocks Demo)
1. **@google/generative-ai not resolving**
   - App won't load until fixed
   - See "BLOCKING ISSUE" section above

### Medium (Degrades Demo)
2. **createClientComponentClient errors**
   - May cause Curate tab to fail
   - Solution: Replace with direct supabase import

### Minor (Cosmetic)
3. **Console warnings**
   - Hide DevTools during recording
   - Or filter to only show errors

---

## Production Deployment Check

**Note:** Per memory, we do NOT test production for this demo
- Demo uses **localhost:3000 only**
- **Auth bypassed** in dev
- Production at siam-app.onrender.com (has auth enabled)

---

## Success Criteria

All three pillars must:
- [ ] Load without errors
- [ ] Render within 2 seconds
- [ ] Respond to user interaction
- [ ] Show correct data/mock data
- [ ] Transition smoothly

If any pillar fails this criteria → **STOP and fix before recording**

---

*Created: December 15, 2025*
*Status: BLOCKED on @google/generative-ai resolution*
