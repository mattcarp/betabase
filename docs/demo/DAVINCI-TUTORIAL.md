# DaVinci Resolve Tutorial: Producing the SIAM Demo

This guide will help you produce a professional-grade demo video using DaVinci Resolve Desktop, featuring a "talking head" vignette and the "Nano Banana 2" diagrams.

## 1. Preparation & Setup

### A. Gather Your Assets
Ensure you have the following in a dedicated folder (e.g., `siam-demo-assets`):
1.  **Generated Diagrams** (I've placed these in `/Users/matt/Documents/projects/siam/demo-assets`):
    - `siam_multitenant_erd.png`
    - `siam_architecture_diagram_v2.png`
    - `rlhf_virtuous_cycle.png`
    - `automated_testing_pipeline.png`
2.  **Screen Recording**: Your walkthrough of the app.
3.  **Webcam Footage**: A separate video file of you reading the script (if not recorded simultaneously).

### B. Recording Best Practices
- **Resolution**: Record your screen in **1080p or 4K**.
- **Clean Desktop**: Hide desktop icons and turn off notifications.
- **Separate Tracks**: If using DaVinci Resolve's recorder, check "Record webcam and screen separately" to get two distinct video tracks. This is crucial for the vignette effect.

## 2. Editing Workflow in DaVinci Resolve

### Step 1: The Base Layer (Screen Recording)
1.  Open DaVinci Resolve and create a **New Project**.
2.  **Import** all your assets (screen recording, webcam footage, diagrams).
3.  Drag your **Screen Recording** onto the main timeline (Track 1).
4.  **Trim** the start/end to keep it tight.

### Step 2: The "Talking Head" Vignette (Picture-in-Picture)
1.  Drag your **Webcam Footage** onto the timeline *above* the screen recording (Track 2).
2.  Select the webcam clip.
3.  Go to the **Video** tab in the right panel > **Mask**.
4.  Select the **Circle** mask.
5.  **Resize** the circle to frame your face perfectly.
6.  Go to the **Basic** tab (next to Mask).
7.  **Scale** the entire clip down (e.g., to 25%).
8.  **Position** it in the bottom-right or bottom-left corner.
    - *Pro Tip*: Add a subtle **Shadow** or **Stroke** (in the Canvas or Basic settings) to make it pop off the background.

### Step 3: Inserting the "Nano Banana 2" Diagrams
1.  Locate the moments in your script where you reference a diagram (e.g., "Let's look at the data model...").
2.  Drag the corresponding **PNG image** onto the timeline (Track 3, above your face).
3.  **Duration**: Keep it on screen for 5-8 seconds.
4.  **Transition**: Add a "Dissolve" or "Fade In" animation to the image clip for a smooth entry.
5.  **Motion**: Add a subtle "Zoom In" effect (Keyframes: Scale 100% -> 105%) to keep the static image dynamic.

### Step 4: Syncing Audio
1.  If your audio is attached to the webcam video, you're good.
2.  If you recorded a separate voiceover, drag the audio file to the **Audio Track** below the video.
3.  **Match the visual cues**: Ensure the screen recording clicks happen exactly when you describe them. You may need to use the **Freeze Frame** tool or **Speed** adjustments on the screen recording track to align with your pacing.

## 3. Export Settings
- **Resolution**: 1080p or 4K
- **Frame Rate**: 30fps or 60fps (match your recording)
- **Bitrate**: High (Recommended)
- **Format**: MP4 (H.264)

## 4. Cheat Sheet: Keyboard Shortcuts
- **Split Clip**: `Cmd + B` (Mac)
- **Undo**: `Cmd + Z`
- **Zoom Timeline**: `Cmd + +` / `Cmd + -`
