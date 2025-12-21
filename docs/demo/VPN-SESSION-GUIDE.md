# VPN Session Guide - North Star Demo Recording

**Purpose:** Everything you need to capture real AOMA data for the demo
**Date:** Tonight (December 2, 2025)
**Machine:** Any machine with VPN access to AOMA

---

## Quick Start Checklist

### Before You Start
- [ ] Clone/pull the latest from GitHub: `git pull origin main`
- [ ] Install dependencies: `npm install`
- [ ] Start dev server: `npx kill-port 3000 && npm run dev`
- [ ] Verify server: http://localhost:3000

### What to Capture Tonight

1. **AOMA Login Page Screenshot** - DevTools showing the login button selector
2. **Real DOM HTML** - Copy the actual HTML around the login button
3. **Three Selector Change Scenarios** - We'll simulate these with real HTML

---

## Step 1: Get Real AOMA Login Button Selectors

Once on VPN, navigate to AOMA login page and:

### Open DevTools (F12 or Cmd+Option+I)
1. Right-click the **Login button** > Inspect
2. Note the actual selector (likely `data-testid`, `id`, or `class`)
3. Copy the surrounding HTML (parent container + button)

### Save This Information

Create a file or note with:
```
ACTUAL AOMA LOGIN BUTTON:
- Selector: [paste actual selector here]
- Parent container class: [paste here]
- Button text: [paste here]
- Any aria-labels: [paste here]

ACTUAL HTML (copy ~20 lines around the button):
[paste HTML here]
```

---

## Step 2: Update Demo Scenarios with Real Data

Edit this file with real AOMA HTML:
```
app/api/self-healing/demo/route.ts
```

### Lines to Update (36-140)

Replace the mock `domBefore` and `domAfter` fields in `AOMA_LOGIN_SCENARIOS` with real HTML.

**Tier 1 Example** (line 44-51):
```typescript
domBefore: `[PASTE REAL AOMA HTML HERE]`,
domAfter: `[PASTE SAME HTML WITH CHANGED data-testid]`,
```

**Tier 2 Example** (line 73-93):
```typescript
domBefore: `[PASTE REAL AOMA HTML]`,
domAfter: `[PASTE HTML WITH BUTTON IN NEW CONTAINER]`,
```

**Tier 3 Example** (line 107-134):
```typescript
domBefore: `[PASTE REAL AOMA HTML]`,
domAfter: `[PASTE HTML WITH BUTTON RELOCATED TO SIDEBAR]`,
```

---

## Step 3: Test the Updated Scenarios

### Quick API Test
```bash
# Test Tier 1 (should return 96% confidence, auto-heal)
curl -X POST http://localhost:3000/api/self-healing/demo \
  -H "Content-Type: application/json" \
  -d '{"tier": 1, "useRealAI": false}'

# Test Tier 2 (should return ~78% confidence, review queue)
curl -X POST http://localhost:3000/api/self-healing/demo \
  -H "Content-Type: application/json" \
  -d '{"tier": 2, "useRealAI": false}'

# Test Tier 3 (should return ~42% confidence, architect review)
curl -X POST http://localhost:3000/api/self-healing/demo \
  -H "Content-Type: application/json" \
  -d '{"tier": 3, "useRealAI": false}'
```

### Test with Real AI (Gemini 3 Pro)
```bash
curl -X POST http://localhost:3000/api/self-healing/demo \
  -H "Content-Type: application/json" \
  -d '{"tier": 1, "useRealAI": true}'
```

### Run Playwright Rehearsal
```bash
npx playwright test tests/demo/self-healing-rehearsal.spec.ts --reporter=list
```

Expected: All 7 tests pass

---

## Step 4: Capture Screenshots for DaVinci Resolve

### Screenshots to Take

| Screenshot | Description | Save As |
|------------|-------------|---------|
| AOMA Login Page | Full page with login form visible | `aoma-login-full.png` |
| DevTools Selector | Element inspector showing button selector | `aoma-devtools-selector.png` |
| Tier 1 Result | Terminal showing 96% confidence auto-heal | `tier1-auto-heal.png` |
| Tier 2 Result | Terminal showing 78% confidence review queue | `tier2-review-queue.png` |
| Tier 3 Result | Terminal showing 42% confidence architect review | `tier3-architect.png` |

Save screenshots to: `docs/demo/assets/`

---

## Step 5: Push Changes Back to GitHub

After capturing real data:

```bash
# Stage all changes
git add .

# Commit with descriptive message
git acm "Add real AOMA selectors to self-healing demo scenarios"

# Bump version (triggers deployment)
npm version patch

# Push to main
git push origin main
```

---

## Files You'll Be Editing

| File | Purpose |
|------|---------|
| `app/api/self-healing/demo/route.ts` | Update DOM examples with real AOMA HTML |
| `docs/demo/assets/` | Save screenshots here |
| `docs/demo/REAL-AOMA-DATA.md` | (Create this) Document the actual selectors |

---

## Demo Script Reference

The full 5-minute DaVinci Resolve script is in:
```
docs/demo/CAPCUT-DEMO-GUIDE.md
```

Key sections:
- **Lines 283-386**: Scene-by-scene script with timestamps
- **Lines 119-280**: Code sections to highlight
- **Lines 9-115**: Nano Banana Pro diagram prompts

---

## Three-Tier System Reference

| Tier | Confidence | Color | Action | Example |
|------|------------|-------|--------|---------|
| **1** | >90% | Green | Auto-heal | ID rename: `button` -> `login-button` |
| **2** | 60-90% | Yellow | QA Review Queue | Button moved into new container |
| **3** | <60% | Red | Architect Review | Button relocated to sidebar |

---

## Troubleshooting

### Dev server won't start
```bash
npx kill-port 3000
rm -rf .next
npm run dev
```

### API returns 500
Check that `GOOGLE_GENERATIVE_AI_API_KEY` is in `.env.local`

### Playwright tests fail
```bash
npx playwright install chromium
```

### Need to see all demo scenarios
```bash
curl http://localhost:3000/api/self-healing/demo | jq '.scenarios'
```

---

## Contact/Resume Point

When you return to the main machine:

1. `git pull origin main` to get your changes
2. Run `npx playwright test tests/demo/self-healing-rehearsal.spec.ts` to verify
3. Open `docs/demo/CAPCUT-DEMO-GUIDE.md` for the full recording script
4. Screenshots will be in `docs/demo/assets/`

---

## Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/self-healing/demo` | GET | List all demo scenarios |
| `/api/self-healing/demo` | POST | Trigger a specific tier scenario |
| `/api/rlhf/queue` | GET | View curator annotation queue |

---

*Last updated: December 2, 2025*
