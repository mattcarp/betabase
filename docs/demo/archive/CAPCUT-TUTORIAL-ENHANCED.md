# CapCut Tutorial - SIAM Demo Video

## Overview
Create a 5-6 minute demo video showcasing SIAM's three North Star features using CapCut.

**Target Duration**: 5:00-6:00  
**Resolution**: 1920x1080 (1080p)  
**Frame Rate**: 30fps  
**Export Format**: MP4 (H.264)

---

## Pre-Recording Setup

### 1. Screen Recording
- **Tool**: QuickTime Player (Mac) or OBS Studio
- **Resolution**: 1920x1080
- **Area**: Full screen or browser window only
- **Audio**: System audio + microphone

### 2. Browser Setup
- Open `http://localhost:3000` in Chrome
- Zoom level: 100%
- Hide bookmarks bar (Cmd+Shift+B)
- Close unnecessary tabs
- Have demo queries ready in a text file on second monitor

### 3. Assets Needed
- Screen recording of chat demo
- RLHF virtuous cycle diagram: `rlhf_virtuous_cycle_v2.png`
- Webcam recording (optional, for picture-in-picture)

---

## Scene Breakdown

### Scene 1: Title Card (0:00-0:05)
**Duration**: 5 seconds

**Content**:
- Title: "The Beta Base"
- Subtitle: "Enterprise AI Testing Platform"
- Background: Dark gradient (#0a0a0a to #1a1a1a)

**CapCut Steps**:
1. Add Text → Title
2. Font: Inter Bold, 72pt
3. Color: White with purple glow
4. Animation: Fade in (0.5s)

---

### Scene 2: Chat Demo - Architecture Diagram (0:05-1:30)
**Duration**: 85 seconds

**Content**:
- Screen recording of typing query about AOMA
- AI response with Mermaid diagram of AOMA
- Zoom in on diagram
- Show export functionality

**Voiceover Script**:
> "We start by asking The Beta Base to visualize the architecture of AOMA. The system generates a Mermaid diagram using the 'Nano Banana 2' theme, showing the multi-tenant system and integration points. The diagram is interactive and supports PNG export."

**CapCut Steps**:
1. Import screen recording
2. Trim to start at query typing
3. Add zoom effect on diagram (2x zoom, 2s duration)
4. Add cursor highlight (optional)
5. Sync voiceover

**Visual Cues**:
- 0:05 - Start typing query
- 0:15 - Response begins streaming
- 0:25 - Diagram renders
- 0:30 - Zoom in on diagram
- 0:45 - Show zoom/pan controls
- 0:50 - Click "Export PNG"

---

### Scene 3: RLHF Explanation (1:30-2:15)
**Duration**: 45 seconds

**Content**:
- Screen recording of RLHF query
- AI response explaining feedback loop
- Transition to Curate tab

**Voiceover Script**:
> "The system uses Reinforcement Learning from Human Feedback. Correcting the model's understanding of AOMA updates the knowledge base in real-time, improving future retrieval accuracy."

**CapCut Steps**:
1. Continue screen recording
2. Add text overlay: "RLHF Feedback Loop"
3. Highlight key phrases in response

---

### Scene 4: Curate Tab Demo (2:15-3:45)
**Duration**: 90 seconds

**Content**:
- Navigate to Curate tab
- Show feedback queue (AOMA questions)
- Submit feedback (thumbs up/down)
- Show feedback saved confirmation

**Voiceover Script**:
> "The Curate tab allows the team to review retrieval performance. Submitting feedback writes a validation signal to the database, which triggers a re-weighting of the embeddings for that context."

**CapCut Steps**:
1. Add transition effect (slide left)
2. Zoom in on feedback queue (1.5x)
3. Highlight cursor on thumbs up button
4. Add success animation overlay (green checkmark)

**Visual Cues**:
- 2:15 - Click "Curate" tab
- 2:25 - Show feedback queue
- 2:40 - Select first item
- 2:50 - Click "Thumbs Up"
- 3:00 - Show toast notification

---

### Scene 5: TestSprite Demo (3:45-4:45)
**Duration**: 60 seconds

**Content**:
- Screen recording of TestSprite query
- Sequence diagram showing self-healing workflow
- Explain automated test fixing

**Voiceover Script**:
> "TestSprite is the platform's AI agent. When a UI change in AOMA breaks a test, it analyzes the DOM drift and automatically generates a fix, maintaining the release pipeline."

**CapCut Steps**:
1. Continue screen recording
2. Zoom in on sequence diagram
3. Add text overlays for each step
4. Highlight "Self-Healing" concept

---

### Scene 6: Outro (4:45-5:00)
**Duration**: 15 seconds

**Content**:
- Recap of three pillars
- Call to action

**Voiceover Script**:
> "The Beta Base provides architecture visualization, RLHF feedback loops, and automated self-healing tests for the AOMA application."

**CapCut Steps**:
1. Add text overlay with three pillars
2. Fade to black
3. End card with contact info (optional)

---

## CapCut Editing Workflow

### Step 1: Import Media
1. Open CapCut
2. Create New Project → "SIAM Demo Final"
3. Import all assets:
   - Screen recording(s)
   - Voiceover audio (if recorded separately)

### Step 2: Rough Cut
1. Drag screen recording to timeline
2. Trim to remove dead space
3. Split clips at scene transitions (use 'S' key)
4. Arrange in order

### Step 3: Add Voiceover
1. Record voiceover (or import audio file)
2. Drag to audio track
3. Sync with video clips
4. Adjust volume levels (voiceover: -3dB, system audio: -12dB)

### Step 4: Add Visual Effects
1. **Zoom Effects**: Select clip → Effects → Zoom In
2. **Transitions**: Between scenes → Transitions → Slide
3. **Text Overlays**: Text → Add Text → Position and style
4. **Cursor Highlight**: Effects → Cursor Ring (if available)

### Step 5: Color Grading (Optional)
1. Select all video clips
2. Adjustments → Brightness: +5, Contrast: +10
3. Add slight vignette for focus

### Step 6: Audio Polish
1. Add background music (subtle, low volume: -20dB)
2. Apply noise reduction to voiceover
3. Add fade in/out to music

---

## Export Settings

### CapCut Export Configuration
1. Click "Export" (top right)
2. **Resolution**: 1080p (1920x1080)
3. **Frame Rate**: 30fps
4. **Format**: MP4
5. **Quality**: High (or Best if file size allows)
6. **Codec**: H.264
7. **Bitrate**: 10-15 Mbps

### File Naming
`SIAM_Demo_RLHF_v1_YYYYMMDD.mp4`

---

## Tips for Success

### Recording Tips
- **Practice first**: Do a dry run without recording
- **Slow down**: Type slower than normal for clarity
- **Pause**: Leave 2-3 seconds between actions for editing
- **Retakes**: If you mess up, just pause, then restart that section

### Editing Tips
- **Keyboard shortcuts**: Learn 'S' (split), 'C' (cut), 'V' (paste)
- **Zoom timeline**: Use trackpad pinch or Cmd+/- for precision
- **Save often**: CapCut auto-saves, but manually save too (Cmd+S)
- **Preview**: Watch full video before exporting

### Voiceover Tips
- **Script**: Write it out, practice reading
- **Pacing**: Speak slightly slower than conversation
- **Energy**: Be enthusiastic but not over-the-top
- **Retakes**: Record each scene separately for easier editing

---

## Troubleshooting

**Video is choppy**:
- Reduce preview quality in CapCut (Settings → Preview Quality → Low)
- Close other apps
- Export and review final video (preview may lag)

**Audio out of sync**:
- Right-click audio track → Detach Audio
- Manually align with video
- Use waveform to match

**File size too large**:
- Reduce bitrate to 8 Mbps
- Use H.265 codec (smaller files, slower export)
- Trim unnecessary footage

---

## Quick Reference Card

| Scene | Duration | Key Action | Voiceover Focus |
|-------|----------|------------|-----------------|
| 1 | 0:00-0:05 | Title card | Intro |
| 2 | 0:05-1:30 | Architecture diagram | Mermaid + groovy styling |
| 3 | 1:30-2:15 | RLHF explanation | Feedback loop concept |
| 4 | 2:15-3:45 | Curate tab demo | Feedback submission |
| 5 | 3:45-4:45 | TestSprite demo | Self-healing tests |
| 6 | 4:45-5:00 | Outro | Recap |

**Total**: 5:00 (with buffer for natural pacing)
