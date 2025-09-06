# 📝 Product Requirements Document (PRD)

## 🎯 Overview

**Project Name:** Siam (Smart In A Meeting)

**Objective:**  
Develop a lightweight, visually engaging terminal emulator in **Rust**, exclusively designed to run the `siam` Python application. This emulator will provide a seamless user experience with custom window features, without supporting general-purpose terminal functionalities.

---

## 🖼️ Key Features

- **Dedicated Execution Environment**
  - Runs only the `siam` Python app.
  - Locks out access to shell commands.

- **Customizable Transparency**
  - Adjustable transparency using `winit` and `wgpu`.

- **Preset Window Sizes**
  - Multiple screen dimensions (e.g. 800×600, 1024×768).
  - Uses `set_inner_size()` from `winit`.

- **Dynamic Resizing**
  - Resize between presets during runtime.

- **Minimalist Futuristic UI**
  - Matrix-style digital rain or waveform animations.

- **Cross-Platform Compatibility**
  - Focus on macOS first, scalable to Linux & Windows.

---

## 🛠️ Technical Specifications

- Language: Rust
- Windowing: `winit`
- Graphics: `wgpu`
- Optional UI: `egui` or `iced`
- Audio Routing: BlackHole, PulseAudio, VAC
- Python Integration: Spawn + monitor `siam` Python script
- Communication: `Arc<Mutex<_>>`, channels or async tasks

---

## 🧪 Development Milestones

1. **Prototype**
   - Transparent window, simple render loop

2. **Subprocess Integration**
   - Run Python backend, stream stdout

3. **UI Enhancements**
   - Render digital rain, waveforms

4. **Threading and Channels**
   - Safe concurrency between audio, subprocess, UI

5. **Testing & Optimization**
   - Cross-platform QA, frame tuning

6. **Distribution**
   - Build macOS binary
   - Optionally target Windows/Linux

---

## 🧩 Potential Challenges

- Transparency quirks across OSes
- Audio/video rendering sync
- Subprocess stability & control
- Multi-platform build variance

---

## 🧵 Rust Thread Safety Advantages for This Project

Your app is a **concurrent symphony** of processes:

### 1. Subprocess Thread (Python)

- Runs `siam` using `Command::new()`
- Streams real-time stdout to UI

```rust
use std::process::{Command, Stdio};
use std::thread;

thread::spawn(move || {
    let _child = Command::new("python3")
        .arg("integrated_pipeline.py")
        .stdout(Stdio::piped())
        .spawn()
        .expect("Failed to launch subprocess");
});
```

---

### 2. Audio Input Thread

- Captures mic input via `cpal`
- Sends data to a processing thread or renderer
- Shared buffer uses `Arc<Mutex<Vec<_>>>` or channels

---

### 3. System Audio Capture Thread

- Runs in parallel (e.g., BlackHole)
- Feeds audio to analyzer/visualizer

---

### 4. UI Rendering Thread

- Continuously renders digital rain / waveforms
- Updates via thread-safe channels (e.g., `crossbeam`)

---

### Why Rust Works So Well Here

- **No data races** — borrow checker enforces correctness
- **Memory safety without GC** — zero jitter, real-time capable
- **Threads that won’t kill each other** — `Send` and `Sync` traits enforce discipline
- **Scoped threads or async tasks** — ergonomic & predictable

---

## ❤️ Final Thoughts

Rust gives you **performance, safety, and control**—everything you want in a custom terminal emulator for real-time transcription and display. Combine it with your sci-fi UI dreams and _siam_ becomes not just smart... but unforgettable.

Let’s go, hotshot.
