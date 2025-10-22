# SIAM Cinematic UI Design System

## Overview

This design system establishes a comprehensive visual language for SIAM's futuristic interface, drawing inspiration from iconic sci-fi properties while maintaining modern accessibility and usability standards.

## Design Philosophy

### Core Principles

1. **Immersive Transparency**: Embrace semi-transparent overlays that create depth
2. **Intelligent Minimalism**: Show only what users need, when they need it
3. **Responsive Luminosity**: Interface elements that react and glow with purpose
4. **Seamless Interaction**: Fluid animations that feel natural and responsive
5. **Professional Aesthetics**: Beautiful interfaces that enhance productivity

### Inspiration Sources

- **Minority Report**: Clean HUD interfaces with contextual overlays
- **Iron Man**: Circular HUDs with radial progress indicators
- **Blade Runner**: Neon glows and atmospheric depth
- **Apple Vision Pro**: Modern glassmorphism and spatial UI
- **Cyberpunk 2077**: Digital rain effects and cyberpunk typography

## Typography System

### Font Families

```css
--font-primary: "Inter", "SF Pro Display", system-ui, sans-serif;
--font-mono: "JetBrains Mono", "SF Mono", "Monaco", monospace;
--font-display: "Orbitron", "Inter", sans-serif; /* For headings/HUD elements */
```

### Type Scale

```css
--text-xs: 0.75rem; /* 12px - Small labels */
--text-sm: 0.875rem; /* 14px - Body text */
--text-base: 1rem; /* 16px - Default */
--text-lg: 1.125rem; /* 18px - Large body */
--text-xl: 1.25rem; /* 20px - Small headings */
--text-2xl: 1.5rem; /* 24px - Medium headings */
--text-3xl: 1.875rem; /* 30px - Large headings */
--text-4xl: 2.25rem; /* 36px - Display text */
```

### Typography Effects

- **Glow Text**: Subtle text-shadow for emphasis
- **Mono Spacing**: For data displays and code
- **Letter Spacing**: Increased tracking for futuristic feel

## Color System

### Primary Palette (Cyan/Blue Theme)

```css
--primary-50: #f0f9ff; /* Very light cyan */
--primary-100: #e0f2fe; /* Light cyan */
--primary-200: #bae6fd; /* Lighter cyan */
--primary-300: #7dd3fc; /* Light cyan */
--primary-400: #38bdf8; /* Medium cyan */
--primary-500: #0ea5e9; /* Primary cyan */
--primary-600: #0284c7; /* Dark cyan */
--primary-700: #0369a1; /* Darker cyan */
--primary-800: #075985; /* Very dark cyan */
--primary-900: #0c4a6e; /* Deepest cyan */
```

### Accent Colors

```css
--accent-green: #10b981; /* Success/Matrix green */
--accent-orange: #f59e0b; /* Warning/Amber */
--accent-red: #ef4444; /* Error/Alert */
--accent-purple: #8b5cf6; /* Special/Magic */
--accent-pink: #ec4899; /* Highlight/Attention */
```

### Neutral Palette (Dark Theme)

```css
--neutral-50: #fafafa; /* Almost white */
--neutral-100: #f5f5f5; /* Very light gray */
--neutral-200: #e5e5e5; /* Light gray */
--neutral-300: #d4d4d4; /* Medium light gray */
--neutral-400: #a3a3a3; /* Medium gray */
--neutral-500: #737373; /* Gray */
--neutral-600: #525252; /* Medium dark gray */
--neutral-700: #404040; /* Dark gray */
--neutral-800: #262626; /* Very dark gray */
--neutral-900: #171717; /* Almost black */
--neutral-950: #0a0a0a; /* Deep black */
```

### Glassmorphism Colors

```css
--glass-light: rgba(255, 255, 255, 0.1);
--glass-medium: rgba(255, 255, 255, 0.05);
--glass-dark: rgba(0, 0, 0, 0.1);
--glass-primary: rgba(14, 165, 233, 0.1); /* Primary with transparency */
--glass-accent: rgba(16, 185, 129, 0.1); /* Green with transparency */
```

## Effects System

### Glassmorphism

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}

.glass-panel-strong {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

### Glow Effects

```css
.glow-primary {
  box-shadow: 0 0 20px rgba(14, 165, 233, 0.5);
}

.glow-accent {
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
}

.text-glow-primary {
  text-shadow: 0 0 10px rgba(14, 165, 233, 0.7);
}

.text-glow-accent {
  text-shadow: 0 0 10px rgba(16, 185, 129, 0.7);
}
```

### Animations

```css
@keyframes pulse-glow {
  0%,
  100% {
    box-shadow: 0 0 20px rgba(14, 165, 233, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(14, 165, 233, 0.6);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}
```

## Component Library

### HUD Panel

```css
.hud-panel {
  background: var(--glass-light);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(14, 165, 233, 0.3);
  border-radius: 8px;
  padding: 1rem;
  position: relative;
  overflow: hidden;
}

.hud-panel::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(14, 165, 233, 0.5), transparent);
}
```

### Circular HUD

```css
.circular-hud {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%);
  border: 2px solid rgba(14, 165, 233, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.circular-hud::before {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  padding: 2px;
  background: conic-gradient(from 0deg, transparent, rgba(14, 165, 233, 0.5), transparent);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
}
```

### Floating Panel

```css
.floating-panel {
  background: rgba(23, 23, 23, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(14, 165, 233, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(14, 165, 233, 0.1);
  transition: all 0.3s ease;
}

.floating-panel:hover {
  border-color: rgba(14, 165, 233, 0.4);
  box-shadow:
    0 12px 48px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(14, 165, 233, 0.2);
}
```

### Data Stream

```css
.data-stream {
  position: relative;
  overflow: hidden;
  background: linear-gradient(90deg, transparent 0%, rgba(14, 165, 233, 0.1) 50%, transparent 100%);
  height: 2px;
  margin: 0.5rem 0;
}

.data-stream::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(14, 165, 233, 0.8), transparent);
  animation: data-flow 2s linear infinite;
}

@keyframes data-flow {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}
```

### Progress Indicators

```css
.radial-progress {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    rgba(14, 165, 233, 0.8) 0deg,
    rgba(14, 165, 233, 0.8) var(--progress, 0deg),
    rgba(255, 255, 255, 0.1) var(--progress, 0deg),
    rgba(255, 255, 255, 0.1) 360deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.radial-progress::before {
  content: "";
  position: absolute;
  inset: 4px;
  border-radius: inherit;
  background: var(--neutral-900);
}
```

## Layout System

### Grid Structure

```css
.hud-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem;
  padding: 1rem;
  min-height: 100vh;
}

.hud-sidebar {
  grid-column: span 3;
}

.hud-main {
  grid-column: span 6;
}

.hud-auxiliary {
  grid-column: span 3;
}
```

### Responsive Breakpoints

```css
/* Mobile First Approach */
@media (max-width: 768px) {
  .hud-grid {
    grid-template-columns: 1fr;
  }

  .hud-sidebar,
  .hud-main,
  .hud-auxiliary {
    grid-column: span 1;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .hud-sidebar {
    grid-column: span 4;
  }

  .hud-main {
    grid-column: span 8;
  }

  .hud-auxiliary {
    grid-column: span 12;
  }
}
```

## Accessibility Guidelines

### Color Contrast

- Ensure minimum 4.5:1 contrast ratio for normal text
- Ensure minimum 3:1 contrast ratio for large text
- Provide alternative indicators beyond color

### Motion & Animation

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Focus States

```css
.focusable:focus-visible {
  outline: 2px solid rgba(14, 165, 233, 0.8);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.2);
}
```

## Implementation Guidelines

### CSS Custom Properties

Define all design tokens as CSS custom properties for consistency and theme switching:

```css
:root {
  /* Colors */
  --primary: #0ea5e9;
  --accent: #10b981;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 50%;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.2);
}
```

### Performance Considerations

- Use `transform` and `opacity` for animations
- Implement `will-change` property sparingly
- Optimize backdrop-filter usage
- Use CSS containment for isolated components

### Dark Theme Implementation

```css
[data-theme="dark"] {
  --bg-primary: var(--neutral-900);
  --bg-secondary: var(--neutral-800);
  --text-primary: var(--neutral-100);
  --text-secondary: var(--neutral-300);
}

[data-theme="light"] {
  --bg-primary: var(--neutral-50);
  --bg-secondary: var(--neutral-100);
  --text-primary: var(--neutral-900);
  --text-secondary: var(--neutral-700);
}
```

## Component Examples

### Header with Glow

```jsx
const HUDHeader = () => (
  <header className="glass-panel border-b border-primary-500/20">
    <div className="flex items-center justify-between p-4">
      <h1 className="text-2xl font-display text-glow-primary">SIAM</h1>
      <div className="flex items-center space-x-4">
        <div className="radial-progress" style={{ "--progress": "180deg" }}>
          <span className="text-sm font-mono">75%</span>
        </div>
      </div>
    </div>
  </header>
);
```

### Floating Information Panel

```jsx
const InfoPanel = ({ children, title }) => (
  <div className="floating-panel animate-fade-in">
    <div className="flex items-center mb-4">
      <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse-glow mr-3" />
      <h3 className="text-lg font-display text-primary-300">{title}</h3>
    </div>
    <div className="space-y-2">{children}</div>
    <div className="data-stream mt-4" />
  </div>
);
```

This design system provides a comprehensive foundation for creating immersive, accessible, and beautiful interfaces that capture the essence of futuristic sci-fi while maintaining modern usability standards.
