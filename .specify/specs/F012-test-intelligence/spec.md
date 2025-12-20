# Spec: Advanced Test Intelligence & Critique Interface (F012)

**Status**: 🚧 Draft (Retrospective Documentation)
**Owner**: Coding Agent
**Feature Link**: F012 in features.json

## 1. Overview
The Test tab overhaul transforms the Historical Test Explorer into a professional intelligence vault. It focuses on automation readiness, dual-mode usability, and human-in-the-loop refinement.

## 2. Requirements (Spec-Kit)
- **REQ-F012-01**: Automation Confidence Scoring (0-100%) based on script depth and metadata.
- **REQ-F012-02**: Dual-Mode Artifact View (toggle between Human-Readable and Automated Code).
- **REQ-F012-03**: HITL Critique Panel for script refinement.
- **REQ-F012-04**: Self-Healing loop triggered by human feedback.
- **REQ-F012-05**: Tufte-inspired UI polish (high density, professional palette).

## 3. Design
### 3.1 Confidence Heuristic
- **Base**: 50
- **Depth**: +20 if keywords like `expect`, `assert` found.
- **Context**: +15 if preconditions > 50 chars.
- **Stability**: +10 if pass rate > 80% and count > 5.
- **Visual Penalty**: -15 for purely layout-based tests.

### 3.2 UI Architecture
- **Sidebar**: Added "Conf." column with vertical sparkline.
- **Artifact**: Added mode toggle (Human/Code) and Critique button.
- **Critique Panel**: Overlay with textarea and "Apply & Rebuild" action.

## 4. API Integration
- **Endpoint**: `/api/tests/generate-playwright`
- **Payload**: `{ testId, additionalInstructions }`

