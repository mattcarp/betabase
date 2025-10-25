# Getting Started - Recording Workflow

## Step-by-Step Process

### Phase 1: Prepare (Do This First)

**1. Create Diagrams (30 min)**
- Open Excalidraw (https://excalidraw.com)
- Create 3 diagrams:
  - System architecture
  - MCP integration flow
  - Request/response pipeline
- Export as PNG, save to `docs/diagrams/`

**2. Customize Playwright Script (30 min)**
- Open `tests/demo/demo-recording.spec.ts`
- Update `data-testid` selectors to match your actual app
- Adjust pause durations (start with 3-5s, tune after first run)
- Test run each sequence separately to verify it works

**3. Test Playwright Script**
```bash
cd /Users/matt/Documents/projects/siam

# Run one test at a time to verify
npx playwright test tests/demo/demo-recording.spec.ts --headed --grep "Demo Sequence 1"
npx playwright test tests/demo/demo-recording.spec.ts --headed --grep "Demo Sequence 2"
# etc.

# If typing is too fast, add slowMo:
npx playwright test tests/demo/demo-recording.spec.ts --headed --slow-mo=50
```

**4. Prepare Your Environment**
- Close all unnecessary apps
- Turn off notifications (Do Not Disturb mode)
- Open in separate windows/spaces:
  - Terminal 1: MCP servers running
  - Terminal 2: MCP logs
  - VS Code: SIAM project
  - Chrome: Vitest UI (http://localhost:51204/__vitest__/)
  - Chrome: Playwright Report
  - Chrome: https://thebetabase.com (for Playwright to control)
  - Keynote/Excalidraw: Your diagrams

---

### Phase 2: Record (The Fun Part)

**Recording Order: Record Separately, Edit Together**

#### Recording 1: Opening + Diagrams (3-4 min)
1. Open Descript → New Recording → Screen + Camera
2. Select screen with your diagrams
3. Position camera in bottom-right corner (resize in Descript later)
4. Hit Record
5. Narrate through your architecture diagrams
6. Stop recording

#### Recording 2: MCP Servers Setup (2-3 min)
1. New Descript recording
2. Screen: Terminal windows side-by-side
3. Show MCP servers running, logs streaming
4. Quick VS Code peek at MCP config
5. Narrate: "These are the actual MCP servers..."
6. Stop recording

#### Recording 3: Playwright Web Demo (8-10 min)
**This is the key section**

1. Start MCP servers in terminals (if not running)
2. Start Playwright in headed mode:
   ```bash
   npx playwright test tests/demo/demo-recording.spec.ts --headed --grep "Demo Sequence 1"
   ```
3. Open Descript → New Recording → Screen + Camera
4. Position to capture browser window where Playwright will run
5. Hit Record in Descript
6. Run Playwright test (it will execute with pauses)
7. Narrate over the automation:
   - "Notice the streaming response starting..."
   - "Here you can see the source citations..."
   - "The response completes in under 2 seconds..."
8. Playwright pauses automatically - use that time to talk
9. Stop recording when test completes
10. Repeat for each demo sequence (or run all at once if comfortable)

**Pro tip:** Console logs from Playwright script tell you when to narrate

#### Recording 4: Testing Infrastructure (3-4 min)
1. New Descript recording
2. Screen: Vitest UI
3. Show 59 passing tests
4. Click around test results
5. Switch to Playwright HTML reporter
6. Show network tab with MCP calls
7. Narrate naturally while clicking
8. Stop recording

#### Recording 5: Code Deep Dive (3-4 min)
1. New Descript recording
2. Screen: VS Code
3. Show key files:
   - Anti-hallucination prompt code
   - MCP integration
   - Streaming handler
4. Don't explain line-by-line, just show and summarize
5. Stop recording

---

### Phase 3: Edit in Descript

**Import All Recordings**
1. Create new Descript project: "SIAM Technical Demo"
2. Import all 5 recordings
3. They'll appear as separate scenes

**Edit Each Scene**
1. **Remove filler words**: Click "Remove filler words" button (automatic)
2. **Edit transcript**: Delete "um", "uh", long pauses, mistakes
3. **Adjust camera**: Resize picture-in-picture if needed
4. **Trim dead time**: Cut beginning/ending silence

**Combine Scenes**
1. Arrange recordings in order
2. Add fade transitions between sections (optional)
3. Play through once to check flow
4. Speed up boring parts if needed (select → Change speed)

**Polish**
1. Add title slide at beginning (Descript has templates)
2. Add ending slide with contact info
3. Background music? (Optional - probably not needed for technical audience)
4. Check audio levels are consistent

**Export**
1. File → Publish
2. Choose: 1080p, H.264
3. Export to Desktop
4. Share with colleagues

---

### Timing Your Narration

**During Recording:**
- Don't rush - Playwright pauses are there for you
- Pause for emphasis - edit out extra silence later
- If you mess up, just keep going - fix in transcript editing

**During Editing:**
- Use Descript's transcript editing to remove mistakes
- Speed up sections where you talked too slowly
- Slow down sections where you rushed
- Final timing should feel natural, not scripted

---

### Troubleshooting

**Playwright doesn't find selectors?**
- Check your app's actual data-testid attributes
- Update selectors in demo-recording.spec.ts
- Run in headed mode to see what's happening

**Typing too fast/slow?**
- Adjust `delay` parameter in typeNaturally function
- Or add `slowMo` to playwright config

**Need more/less pause time?**
- Edit narratorPause durations
- Start longer, can always speed up in Descript

**MCP servers not responding?**
- Verify they're running before recording
- Check logs for errors
- Have fallback: skip MCP demo if broken

---

### Timeline

**Day 1 (Today/Tomorrow):**
- Create diagrams
- Customize Playwright script
- Test run everything

**Day 2 (Monday?):**
- Record all segments
- 30 minutes of recording = 2-3 hours with retakes

**Day 3:**
- Edit in Descript
- 1-2 hours of editing
- Export final video

**Total time investment: ~6 hours**

---

### Final Checklist Before Recording

- [ ] Diagrams created and look good
- [ ] Playwright script tested, selectors work
- [ ] MCP servers running, logs visible
- [ ] All windows arranged and ready
- [ ] Notifications turned off
- [ ] Camera positioned correctly
- [ ] Microphone tested (speak into Descript, check levels)
- [ ] Know your bullet points (not scripted, just prepared)
- [ ] Coffee/water nearby
- [ ] Ready to have fun with it

---

Allez, mon ami! You've got this. The hybrid approach gives you the best of both worlds - automation where it matters, authenticity where it counts.
