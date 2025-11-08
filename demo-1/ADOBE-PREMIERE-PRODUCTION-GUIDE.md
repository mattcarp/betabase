# 🎬 Adobe Premiere Production Guide
## SIAM Chat→Curate→Fix Demo

**Duration**: 7 minutes | **Format**: 1920x1080, 30fps | **Output**: MP4 for web

---

## 📁 Project Setup

### 1. Create New Project
```
File → New → Project
Name: "SIAM-Demo-Chat-Curate-Fix"
Location: /Users/matt/Documents/projects/siam/demo-1/premiere/
```

### 2. Import Assets

**Organize bins**:
```
📁 Project
  📁 01-Talking-Head
    - intro-raw.mov
    - transition-raw.mov
    - outro-raw.mov
  📁 02-Screen-Recordings
    - chat-tab-demo.mov
    - curate-tab-demo.mov
    - fix-tab-demo.mov
  📁 03-Manus-Slides
    - slide-01-title.mp4
    - slide-02-context-overlay.mov
    - slide-03-rlhf-diagram.mp4
    - slide-04-langgraph-hitl.mp4
    - slide-05-hitl-indicator.mov
    - slide-06-summary.mp4
    - slide-07-end-card.mp4
  📁 04-B-Roll
    - animated-erd.mp4
    - code-scroll.mp4 (optional)
  📁 05-Audio
    - voiceover-intro.wav
    - voiceover-transition.wav
    - voiceover-outro.wav
    - music-subtle-ambient.mp3 (optional)
  📁 06-Graphics
    - lower-third-name.png
    - text-overlays (create in Premiere)
```

---

## 🎞️ Sequence Settings

### Create Main Sequence:
```
Sequence → Sequence Settings
Name: "SIAM Demo MASTER"
Preset: HD 1080p 30fps
Video:
  - Frame Size: 1920x1080
  - Frame Rate: 30fps
  - Pixel Aspect Ratio: Square (1.0)
Audio:
  - Sample Rate: 48kHz
  - Display Format: Audio Samples
```

---

## 📐 Timeline Structure (Layer Hierarchy)

### Video Tracks (top to bottom):
```
V7: Text overlays (titles, captions, emphasis)
V6: Lower thirds (your name, contact)
V5: Overlay slides (context, HITL indicator)
V4: B-roll (ERD animation, code scrolls)
V3: Manus slides (full screen)
V2: Screen recordings (Chat, Curate, Fix)
V1: Talking head footage (intro, transition, outro)
```

### Audio Tracks:
```
A1: Talking head audio (camera mic)
A2: Voiceover audio (Shure SM-B)
A3: Screen recording audio (if any)
A4: Background music (optional, subtle)
```

**Why this structure?**
- Higher tracks overlay lower tracks
- Easy to toggle visibility for editing
- Logical grouping by content type

---

## ⏱️ Complete Timeline Breakdown

### [00:00 - 00:05] BLACK LEADER
- **V1**: Black video
- **Purpose**: Professional start, gives viewers time to settle

### [00:05 - 00:10] TITLE CARD
- **V3**: Slide 01 (Title card with animation)
- **A4**: Music fade in (if using)
- **Transition**: Fade from black (1s)

### [00:10 - 00:50] TALKING HEAD INTRO
- **V1**: Talking head footage (intro)
- **V6**: Lower third (name/title) - appears at 00:12, stays 5s
- **A2**: Voiceover audio
- **B-roll insert at 00:40**: Animated ERD (3s) - fade in/out
- **Notes**: 
  - Color grade for consistency
  - Remove background noise
  - Normalize audio to -3dB

### [00:50 - 00:55] TRANSITION TO CHAT
- **V3**: Slide 02 preview (context hierarchy)
- **V4**: Animated ERD pulsating (5s)
- **Transition**: Cross dissolve (1s)
- **Audio**: Voiceover continues

### [00:55 - 02:25] CHAT TAB DEMO
- **V2**: Screen recording (Chat tab)
- **V5**: Slide 02 overlay (context indicator, top-right)
- **A2**: Voiceover narration
- **Text overlays**:
  - 01:15 - "SONY MUSIC / PDE / AOMA" (3s, top-right)
  - 01:30 - "~50 pages proprietary docs" (3s, center-bottom)
  - 01:50 - "SOURCE CITATIONS" (2s, highlight area)
- **Zoom effects**:
  - 01:50 - Zoom to 110% on citations (hold 3s)
- **Cursor highlight**: Add glow effect throughout

### [02:25 - 02:35] RLHF TRANSITION
- **V3**: Slide 03 (RLHF workflow diagram)
- **Transition**: Cross dissolve (1s)
- **Audio**: Voiceover explains feedback loop

### [02:35 - 04:05] CURATE TAB DEMO
- **V2**: Screen recording (Curate tab)
- **A2**: Voiceover narration
- **Text overlays**:
  - 02:50 - "REINFORCEMENT LEARNING FROM HUMAN FEEDBACK" (4s, center-top)
  - 03:20 - "Feedback improves future answers" (3s, center-bottom)
- **Zoom effects**:
  - 03:00 - Zoom to 115% on feedback form (hold 5s)
- **Highlight box**: Draw attention to feedback text field

### [04:05 - 04:35] HITL TRANSITION (TALKING HEAD)
- **V1**: Talking head footage (transition)
- **V3**: Slide 04 (LangGraph HITL concept) - overlay at 50% opacity
- **A2**: Voiceover audio
- **Graphics**: LangGraph diagram fades in over shoulder (04:15)
- **Notes**: Energetic delivery here - building excitement

### [04:35 - 06:35] FIX TAB DEMO
- **V2**: Screen recording (Fix tab)
- **V5**: Slide 05 overlay (HITL indicator banner, top)
- **A2**: Voiceover narration
- **Text overlays**:
  - 04:50 - "🚨 HIGH RISK QUERY" (3s, center-top, red)
  - 05:20 - "⏸️ BREAKPOINT TRIGGERED" (3s, center, orange)
  - 05:40 - "✋ HUMAN VERIFICATION REQUIRED" (3s, center-bottom, red)
  - 06:10 - "✅ MODIFIED & APPROVED" (2s, center, green)
- **Zoom effects**:
  - 05:20 - Zoom to 120% on LangGraph reasoning (hold 8s)
  - 05:50 - Zoom to 115% on Approve/Modify/Reject buttons (hold 5s)
- **Highlight effects**: Pulse red outline around risk indicators
- **Pacing**: Slow down editing here - most technical part

### [06:35 - 06:50] SUMMARY SLIDE
- **V3**: Slide 06 (Summary card)
- **V4**: B-roll montage (ERD, code snippets) at 30% opacity behind
- **Transition**: Fade (1s)
- **Audio**: Voiceover continues

### [06:50 - 07:15] TALKING HEAD OUTRO
- **V1**: Talking head footage (outro)
- **V6**: Lower third (contact info) - appears at 06:55
- **A2**: Voiceover audio
- **B-roll inserts**:
  - 06:58 - Animated ERD (5s)
  - 07:05 - Multi-tenant diagram (3s)
- **Notes**: Relaxed, confident delivery

### [07:15 - 07:20] END CARD
- **V3**: Slide 07 (Questions? Contact info)
- **A4**: Music fade out (if using)
- **Transition**: Fade (1s)

### [07:20 - 07:25] BLACK LEADER
- **V1**: Black video
- **A4**: Music fully faded out
- **Purpose**: Professional ending, breathing room

---

## 🎨 Color Grading

### Talking Head Footage:
**Lumetri Color Panel**:
1. **Basic Correction**:
   - Temperature: Adjust for natural skin tone (5500K typical)
   - Tint: Fine-tune to remove color casts
   - Exposure: Brighten if needed (+0.2 to +0.5)
   - Contrast: Slight increase (+10 to +15)
   - Saturation: Slight boost (+5 to +10)

2. **Creative Look**:
   - LUT: "Rec709 to sRGB" or custom tech-demo LUT
   - Adjust: Intensity 50-70%
   - Shadows: Lift slightly for less harsh contrast

3. **HSL Secondary** (optional):
   - Boost skin tone warmth slightly
   - Reduce blue/cyan in background

### Screen Recordings:
**Keep natural** - minimal grading needed:
1. **Basic Correction only**:
   - Contrast: +5 to +10 (make UI pop)
   - Saturation: +5 (make colors vivid)
   - Sharpening: Slight increase (+10 to +20)

2. **Optional**: Add subtle vignette to focus attention on center content

### Color Consistency:
- Apply "Adjustment Layer" over entire timeline
- Add "Curves" adjustment for overall tone
- Ensure white balance matches across all segments

---

## 🎤 Audio Editing

### Step 1: Normalize All Clips
- Right-click audio → Audio Gain → Normalize Max Peak to -3dB
- This ensures consistent loudness

### Step 2: Clean Up Talking Head/Voiceover Audio
**Use Essential Sound Panel**:
1. **Dialogue preset**:
   - Clarity: +3 to +5
   - Dynamics: Compression +3 to +5
   - EQ: Slight boost at 2-4kHz for presence
   - DeNoise: 30-50% (remove hum, hiss)
   - DeReverb: 10-20% (tighten sound)

2. **Manual cleanup**:
   - Cut out: Mouth clicks, breaths (use Ripple Delete)
   - Smooth cuts: Add 3-frame audio crossfades
   - Remove: Long pauses (tighten pacing)

### Step 3: Screen Recording Audio (if any)
- Usually mute this track unless capturing system sounds intentionally
- If keeping: Duck volume to -20dB, only for context

### Step 4: Background Music (optional)
**If adding ambient music**:
1. **Import**: Subtle electronic/ambient track
2. **Place on A4**: Beneath all other audio
3. **Volume**: -24dB to -28dB (barely noticeable)
4. **Fade**: 
   - Fade in: 00:05 to 00:10 (2s)
   - Fade out: 07:15 to 07:20 (3s)
5. **Ducking**: Use "Side-Chain Compression" to auto-duck when you're speaking
   - Threshold: -20dB
   - Ratio: 4:1
   - Attack: 10ms
   - Release: 500ms

### Step 5: Audio Transitions
- **Between segments**: Add 3-frame crossfade (smooths cuts)
- **Between voiceover clips**: 5-frame crossfade (seamless)
- **No abrupt cuts**: Always gentle fade/crossfade

### Step 6: Final Master
**On master audio track**:
1. **Limiter**: 
   - Threshold: -2dB
   - Prevents clipping/distortion
2. **EQ**: 
   - High-pass filter at 80Hz (remove rumble)
   - Slight boost at 10kHz (air/brightness)

---

## ✂️ Editing Techniques

### Cutting Techniques:

1. **J-Cuts & L-Cuts**:
   - **J-Cut**: Audio starts before video (anticipation)
   - **L-Cut**: Audio continues after video (smooth transition)
   - Use between talking head and screen recordings

2. **Jump Cuts** (for talking head):
   - Cut out: "um", "uh", long pauses
   - Keep natural: Don't make it feel robotic
   - Rule: If pause > 2 seconds, consider cutting

3. **Match Cuts**:
   - When switching from talking head to screen, match on action
   - Example: Hand gesture pointing → cursor clicking

### Zoom/Crop Effects:

**Create smooth zooms** for emphasis:
1. **Add keyframes**:
   - Select clip → Effect Controls → Scale
   - Add keyframe at start: 100%
   - Add keyframe at end: 110-120%
   - Duration: 1-2 seconds
2. **Easing**: 
   - Right-click keyframe → Temporal Interpolation → Ease In/Out
   - Smooth, not abrupt

**Example usage**:
- Zoom to citations in Chat demo (01:50)
- Zoom to LangGraph reasoning in Fix demo (05:20)

### Cursor Highlighting:

**Make cursor more visible**:
1. **Install**: Cursor Highlight plugin (or create manually)
2. **Manual method**:
   - Draw circle shape in Graphics workspace
   - Animate: Scale pulse effect (100% → 110% → 100%, 1s loop)
   - Track cursor: Manually keyframe position (tedious but precise)
3. **Auto-track**: 
   - Use "Track Motion" in Effect Controls
   - Sometimes requires manual correction

---

## 🎯 Text Overlays & Graphics

### Lower Third (Your Name):

**Create in Essential Graphics**:
1. **Template**: "Lower Third - Minimal"
2. **Customize**:
   - Name: "Matt Carpenter"
   - Title: "Software Engineer" or "Demo Creator"
   - Colors: Match style guide (blue/purple)
   - Position: Bottom-left, safe margins
3. **Animation**: 
   - Fade in: 0.5s
   - Hold: 5s
   - Fade out: 0.5s
4. **Timing**: 
   - Intro: 00:12 - 00:17
   - Outro: 06:55 - 07:00

### Text Overlays (Emphasis/Context):

**Style guide for all text**:
- **Font**: Inter Bold
- **Size**: 48pt (main), 32pt (subtext)
- **Color**: White (#ffffff) or accent color
- **Background**: Semi-transparent rectangle (#1a1a1a, 70% opacity)
- **Stroke**: 2px black (for readability)
- **Position**: Safe margins (80px from edges)

**Creating text overlays**:
1. **Graphics workspace**: Graphics → New Layer → Text
2. **Type**: Text content
3. **Style**: Apply font, size, color
4. **Background**: Add rectangle shape behind text
5. **Animation**: 
   - Fade in: 0.3s
   - Hold: 2-3s (long enough to read 2x)
   - Fade out: 0.2s

**Overlay timing examples**:
- "SONY MUSIC / PDE / AOMA" (01:15, 3s, top-right)
- "🚨 HIGH RISK QUERY" (04:50, 3s, center-top, red)
- "✋ HUMAN VERIFICATION REQUIRED" (05:40, 3s, center-bottom, red)
- "✅ MODIFIED & APPROVED" (06:10, 2s, center, green)

### Captions (Optional but Recommended):

**Auto-generate with Premiere**:
1. **Window** → Text → Transcribe Sequence
2. **Settings**:
   - Language: English
   - Quality: High
   - Include: Punctuation
3. **Review**: Check accuracy, fix errors
4. **Style**:
   - Font: Inter Regular, 32pt
   - Position: Bottom-center
   - Background: Semi-transparent black
5. **Export**: Burn into video or separate SRT file

**Why captions?**:
- Accessibility
- Watch without sound (social media)
- Professional polish

---

## 🎞️ Transitions

### Transition Principles:
- **Default**: Cut (no transition)
- **Between sections**: Cross dissolve (1s)
- **Talking head ↔ Screen**: J-cut or L-cut (audio leads/trails)
- **B-roll inserts**: Fade (0.5s)
- **Avoid**: Wipes, page turns, fancy effects (distracting)

### When to Use Transitions:

**Cross Dissolve (1s)**:
- Title card → Talking head
- Talking head → Manus slide
- Manus slide → Screen recording
- Screen recording → Manus slide
- Summary slide → Outro
- Outro → End card

**Fade (0.5s)**:
- B-roll inserts (ERD animation, diagrams)
- Text overlays appearing/disappearing
- Audio fade in/out

**Cut (no transition)**:
- Within screen recordings (action to action)
- Within talking head (jump cuts)
- Between similar content (screen A → screen B)

---

## 🎬 Export Settings

### For Web/YouTube/Vimeo:

**Sequence** → Export → Media (Cmd+M)

**Format**: H.264
**Preset**: YouTube 1080p Full HD

**Video Tab**:
- Width: 1920
- Height: 1080
- Frame Rate: 30fps
- Field Order: Progressive
- Profile: High
- Level: 4.2
- **Bitrate Settings**:
  - Bitrate Encoding: CBR (Constant Bitrate)
  - Target Bitrate: 12 Mbps
  - Maximum Bitrate: 15 Mbps

**Audio Tab**:
- Format: AAC
- Sample Rate: 48kHz
- Channels: Stereo
- Bitrate: 320 kbps

**Effects**:
- ✅ Use Maximum Render Quality
- ✅ Use Frame Blending (if needed)

**Output Name**: `SIAM-Demo-Chat-Curate-Fix-FINAL.mp4`

**Estimated File Size**: ~650 MB for 7 minutes

### For Internal Review (Faster Export):

Same settings but:
- Target Bitrate: 8 Mbps
- Estimated size: ~420 MB

---

## ✅ Pre-Export Checklist

**Before hitting Export**:

### Visual:
- [ ] Watch full timeline start-to-finish (no playback issues)
- [ ] All transitions smooth
- [ ] No jarring cuts
- [ ] Text overlays readable (test on phone screen size)
- [ ] Color grading consistent
- [ ] No black frames (unless intentional)
- [ ] B-roll inserts enhance, not distract
- [ ] Lower thirds visible but not obtrusive
- [ ] Cursor highlighted in screen recordings

### Audio:
- [ ] No audio clipping (peaks don't exceed -3dB)
- [ ] Volume consistent across segments
- [ ] No sudden loud/quiet parts
- [ ] Background music subtle (if used)
- [ ] Voiceover clear and present
- [ ] No mouth clicks, pops, or breaths
- [ ] Audio synced with video (no drift)
- [ ] Final limiter preventing distortion

### Content:
- [ ] Timing: 7:00 target (6:45 to 7:15 acceptable)
- [ ] Script followed accurately
- [ ] All key points covered
- [ ] Demos work as expected
- [ ] No errors in screen recordings
- [ ] Contact info correct in end card

### Technical:
- [ ] Sequence settings correct (1920x1080, 30fps)
- [ ] Export settings optimized (H.264, 12Mbps)
- [ ] Filename correct and descriptive
- [ ] Save location correct (`/demo-1/premiere/exports/`)
- [ ] Project file saved (backup!)

---

## 🚨 Common Issues & Fixes

### Video Issues:

**Problem**: Choppy playback during editing
- **Fix**: Lower playback resolution (1/4 or 1/2)
- **Fix**: Render preview (Sequence → Render Effects)
- **Fix**: Create proxies for large files

**Problem**: Color looks washed out after export
- **Fix**: Check "Use Maximum Render Quality"
- **Fix**: Ensure "Rec.709" color space throughout

**Problem**: Text overlays blurry
- **Fix**: Create graphics at sequence resolution (1920x1080)
- **Fix**: Enable "Maximum Render Quality"

**Problem**: Zoom looks pixelated
- **Fix**: Zoom less (max 120%)
- **Fix**: Use higher resolution source footage

### Audio Issues:

**Problem**: Audio out of sync
- **Fix**: Check all clips have same sample rate (48kHz)
- **Fix**: Disable audio effects temporarily, re-enable one by one

**Problem**: Background noise/hum
- **Fix**: Use Essential Sound → DeNoise (50-80%)
- **Fix**: Use high-pass filter (80Hz)

**Problem**: Voiceover sounds thin
- **Fix**: Boost presence (2-4kHz, +3dB)
- **Fix**: Add slight compression

**Problem**: Clipping/distortion
- **Fix**: Normalize to -6dB instead of -3dB
- **Fix**: Add limiter to master (-2dB threshold)

### Export Issues:

**Problem**: Export takes forever
- **Fix**: Close other applications
- **Fix**: Use hardware encoding (if available)
- **Fix**: Export overnight

**Problem**: File size too large
- **Fix**: Lower bitrate to 8-10 Mbps
- **Fix**: Check for unnecessary high-res files

**Problem**: YouTube compression looks bad
- **Fix**: Export at higher bitrate (15 Mbps)
- **Fix**: Upload as 4K (upscale to 3840x2160) - YouTube gives higher bitrate

---

## 📊 Keyboard Shortcuts (Time Savers)

### Essential:
- `Spacebar`: Play/Pause
- `J` / `K` / `L`: Reverse / Stop / Forward (press multiple times for speed)
- `I`: Mark In point
- `O`: Mark Out point
- `Cmd+K`: Add Edit (cut/razor)
- `Cmd+Shift+D`: Apply default transition
- `Cmd+M`: Export Media
- `Cmd+S`: Save project (do this often!)

### Advanced:
- `C`: Razor tool
- `V`: Selection tool
- `Cmd+Z`: Undo
- `Cmd+Shift+Z`: Redo
- `Cmd+K` then `Cmd+D`: Add default transition at playhead
- `Q`: Ripple Trim Previous Edit to Playhead
- `W`: Ripple Trim Next Edit to Playhead

### Audio:
- `G`: Audio Gain dialog
- `S`: Solo track
- `M`: Mute track
- `Shift+E`: Enable/Disable clip

---

## 💡 Pro Tips for Premiere

1. **Save versions**: "SIAM-Demo-v1.prproj", "v2", etc. (before major changes)
2. **Auto-save**: Preferences → Auto-Save every 5 minutes
3. **Render previews**: For complex sections, render to speed up playback
4. **Use markers**: Add comments on timeline (M key)
5. **Color label clips**: Talking head (green), Screen (blue), B-roll (purple)
6. **Nest sequences**: For complex segments, nest them (right-click → Nest)
7. **Duplicate sequence**: Before major edits, duplicate your working sequence
8. **Review on target device**: Export draft, watch on phone/laptop/TV

---

## 📦 Final Deliverables

After export, you should have:

```
/demo-1/premiere/
  /exports/
    - SIAM-Demo-Chat-Curate-Fix-FINAL.mp4 (main deliverable)
    - SIAM-Demo-Review-Draft.mp4 (internal review version)
  /project-files/
    - SIAM-Demo-Chat-Curate-Fix.prproj (Premiere project)
  /auto-saves/
    - (Premiere auto-saves)
```

---

## 🎯 Success Criteria

**Your demo is ready to share when**:

✅ **Visual Quality**:
- Clean, professional look
- Consistent color grading
- No distracting elements
- Text readable on all devices

✅ **Audio Quality**:
- Clear voiceover, no background noise
- Consistent volume
- No clipping or distortion
- Music subtle (if used)

✅ **Content**:
- Story flows logically (Chat → Curate → Fix)
- Technical concepts explained clearly
- Demos work as expected
- Timing tight (7 minutes ± 15 seconds)

✅ **Technical**:
- Exports without errors
- File size reasonable (<700 MB)
- Plays on web/mobile/desktop
- No sync issues

✅ **Colleague-Ready**:
- Technical enough for engineers
- Clear enough for non-engineers
- Questions answered proactively
- Contact info for follow-up

---

## ⏰ Production Timeline

**Realistic time estimates**:

| Task | Duration | Notes |
|------|----------|-------|
| Import & organize assets | 15 min | Good organization saves time later |
| Rough cut (assemble timeline) | 1 hour | Get all clips in order |
| Fine-tune edits | 1.5 hours | Trim, transitions, pacing |
| Color grading | 45 min | Talking head + screen consistency |
| Audio editing | 1 hour | Clean, mix, master |
| Add text overlays | 45 min | All emphasis text, lower thirds |
| Add B-roll | 30 min | ERD animations, transitions |
| Review & notes | 30 min | Watch full timeline, take notes |
| Revisions | 1 hour | Fix issues from review |
| Final review | 15 min | One last watch |
| Export | 30 min | Let it render |
| **TOTAL** | **~8 hours** | **Realistic for high quality** |

**Can be faster** (~5 hours) if:
- Fewer revisions needed
- Fewer text overlays
- Skip color grading (keep natural)
- Skip background music

---

**You've got all the tools you need to make this demo SHINE!** 🎬✨

**Next step**: Record your footage, import into Premiere, and start editing!

