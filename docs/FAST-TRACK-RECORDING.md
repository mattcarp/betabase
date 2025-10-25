# FAST TRACK: Get Recording Done Today

## Current Time Check
You're in Gozo, Malta. Sundown is ~6-7 PM. Let's GO!

---

## RIGHT NOW (5 minutes): Test Playwright Script

```bash
cd ~/Documents/projects/siam

# Test run to see if it works
npx playwright test tests/demo/demo-fast.spec.ts --headed --project=chromium
```

**What you'll see:**
- Browser opens
- Goes to thebetabase.com
- Tries to log in (you might need to handle magic link)
- Types queries slowly
- Pauses for your narration (watch console logs)

**If it breaks:**
- Authentication: Manually log in first, then comment out auth code
- Wrong selectors: We'll fix them (but try first!)
- Too fast/slow: Edit `DEMO_CONFIG` pause durations in the file

---

## PLAN A: Basic Recording (30 minutes total)

**Skip diagrams for now** - Just record the demo!

### Step 1: Prepare (5 min)
```bash
# Terminal 1: Start any MCP servers you have
# (if you don't have them running, skip this - demo works without)

# Terminal 2: Keep this open showing the Playwright console logs
```

### Step 2: Test Playwright (5 min)
```bash
# Run once to verify it works
npx playwright test tests/demo/demo-fast.spec.ts --headed

# If timing feels wrong, edit the file:
# - DEMO_CONFIG.shortPause (currently 2s)
# - DEMO_CONFIG.mediumPause (currently 4s)
# - DEMO_CONFIG.longPause (currently 6s)
```

### Step 3: Record (20 min)
1. **Open Descript**
   - New Recording
   - Screen + Camera
   - Camera in bottom-right corner

2. **Start Recording in Descript**

3. **Run Playwright:**
   ```bash
   npx playwright test tests/demo/demo-fast.spec.ts --headed
   ```

4. **Narrate naturally** over the automation:
   - Watch the console logs - they tell you what to say
   - Playwright types and clicks automatically
   - You just talk over it
   - If you mess up, keep going - fix in Descript

5. **Stop when done** (~15 minutes of recording)

### Step 4: Quick Edit in Descript (10 min)
1. Remove filler words (automatic button)
2. Delete big mistakes from transcript
3. Resize camera if needed
4. Export → 1080p → Done!

**Total: 40 minutes** from test to finished video

---

## PLAN B: Super Minimal (15 minutes)

**Just record your screen manually, no Playwright**

1. Open Descript → Screen Recording
2. Log into thebetabase.com
3. Type queries yourself:
   - "What is AOMA?"
   - "Show me JIRA tickets for AOMA"
   - "Compare AOMA2 vs AOMA3"
   - "Does AOMA have blockchain?" (trick question)
4. Narrate as you go
5. Quick edit in Descript
6. Export

**Pros:** Faster, no setup
**Cons:** Manual typing might have typos, less impressive

---

## RECOMMENDATION

**Go with PLAN A using Playwright:**
- It's cooler (shows testing sophistication)
- More reproducible
- No typos
- Your colleagues will be impressed
- Only 40 minutes total

---

## Quick Checklist

- [ ] Test Playwright script (5 min)
- [ ] Adjust timing if needed (DEMO_CONFIG)
- [ ] Close notifications, unnecessary windows
- [ ] Terminal showing logs visible
- [ ] Descript ready
- [ ] Coffee/water nearby
- [ ] Press record and GO!

---

## Emergency Fallback

If Playwright breaks and you can't fix it in 10 minutes:
- Switch to manual typing (PLAN B)
- Still record with Descript
- Edit out mistakes afterward
- DONE IS BETTER THAN PERFECT

---

## After Recording

Save to:
`~/Documents/projects/siam/recordings/demo-v1.mp4`

Send to colleagues. Done.

---

Allez! The sun is moving, mon ami. Let's test that Playwright script RIGHT NOW.
