# Test Dashboard Mockups

This directory contains design mockups and wireframes for the SIAM Unified Test Dashboard.

## Mockup Organization

```
mockups/
├── wireframes/           # Low-fidelity wireframes
│   ├── dashboard-overview.png
│   ├── execution-panel.png
│   ├── trace-viewer.png
│   └── flaky-explorer.png
├── high-fidelity/       # Detailed UI designs
│   ├── dark-theme-full.png
│   ├── components/
│   └── interactions/
├── user-flows/          # User journey diagrams
│   ├── test-execution-flow.png
│   ├── debugging-flow.png
│   └── ai-generation-flow.png
└── prototypes/          # Interactive prototypes
    └── figma-links.md
```

## Design Principles

### Visual Hierarchy

- **Primary Focus:** Test execution status and results
- **Secondary:** Analytics and trends
- **Tertiary:** Configuration and settings

### Color System

```scss
// Test Status Colors
$passed: #10b981; // Emerald green
$failed: #ef4444; // Red
$running: #3b82f6; // Blue
$skipped: #6b7280; // Gray
$flaky: #f59e0b; // Amber

// Coverage Indicators
$high-coverage: #10b981; // >80%
$medium-coverage: #f59e0b; // 50-80%
$low-coverage: #ef4444; // <50%

// Background & Surfaces
$background: #0f1419;
$surface: #1a1f2e;
$surface-hover: #232936;
$border: rgba(255, 255, 255, 0.1);
```

### Typography Scale

```scss
// Headings
$h1: 2.5rem; // Dashboard title
$h2: 1.875rem; // Section headers
$h3: 1.5rem; // Panel titles
$h4: 1.25rem; // Card headers

// Body Text
$body-lg: 1.125rem; // Important metrics
$body: 1rem; // Default text
$body-sm: 0.875rem; // Secondary info
$caption: 0.75rem; // Timestamps, labels
```

### Spacing System

```scss
// Base unit: 4px
$space-xs: 0.25rem; // 4px
$space-sm: 0.5rem; // 8px
$space-md: 1rem; // 16px
$space-lg: 1.5rem; // 24px
$space-xl: 2rem; // 32px
$space-2xl: 3rem; // 48px
```

## Component Library

### Cards

- **Test Result Card:** Status indicator, name, duration, actions
- **Metric Card:** Large number, trend indicator, sparkline
- **Summary Card:** Multiple metrics in grid layout

### Charts

- **Line Chart:** Test trends over time
- **Bar Chart:** Test duration comparison
- **Pie Chart:** Coverage distribution
- **Heatmap:** Test execution matrix

### Tables

- **Test List:** Sortable, filterable, with inline actions
- **Flaky Tests:** Flakiness percentage, history, quarantine toggle
- **Coverage Report:** Expandable rows, progress indicators

### Forms

- **Test Filter:** Multi-select dropdowns, date range picker
- **Run Configuration:** Environment selection, parallel execution settings
- **AI Prompt:** Natural language input with suggestions

## Interaction Patterns

### Loading States

1. **Skeleton screens** for initial load
2. **Progress bars** for long-running operations
3. **Shimmer effects** for data updates
4. **Spinners** for quick actions

### Transitions

```scss
// Smooth transitions for all interactions
transition: all 0.2s ease;

// Hover effects
&:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

// Active states
&:active {
  transform: translateY(0);
}
```

### Feedback

- **Success:** Green toast notification, checkmark animation
- **Error:** Red alert with details, shake animation
- **Warning:** Amber banner with action button
- **Info:** Blue inline message

## Responsive Design

### Breakpoints

```scss
$mobile: 480px;
$tablet: 768px;
$desktop: 1024px;
$wide: 1440px;
$ultrawide: 1920px;
```

### Layout Adaptations

- **Mobile:** Single column, collapsible panels
- **Tablet:** Two-column layout, modal overlays
- **Desktop:** Three-column layout with sidebars
- **Wide:** Additional detail panels, expanded charts

## Accessibility

### WCAG 2.1 AA Compliance

- **Color contrast:** Minimum 4.5:1 for normal text
- **Focus indicators:** Visible keyboard navigation
- **Screen reader support:** ARIA labels and descriptions
- **Keyboard shortcuts:** Full keyboard navigation

### Semantic HTML

```html
<nav role="navigation" aria-label="Test suites">
  <main role="main" aria-label="Test results">
    <aside role="complementary" aria-label="AI assistant"></aside>
  </main>
</nav>
```

## Animation Guidelines

### Performance

- Use CSS transforms over position changes
- Leverage GPU acceleration with `will-change`
- Limit to 60fps animations
- Reduce motion for accessibility preference

### Micro-interactions

```scss
// Button hover
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
}

// Test running indicator
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// Success checkmark
@keyframes check {
  0% {
    stroke-dashoffset: 100;
  }
  100% {
    stroke-dashoffset: 0;
  }
}
```

## Dark Theme Optimizations

### Glassmorphism Effects

```scss
.glass-panel {
  background: rgba(26, 31, 46, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
}
```

### Depth Layers

1. **Background:** Base layer
2. **Surface:** Content containers
3. **Overlay:** Modals and dropdowns
4. **Tooltip:** Highest elevation

## Icon System

Using Lucide React icons for consistency:

- **Test States:** Play, Pause, Stop, Check, X, AlertCircle
- **Actions:** Plus, Edit, Trash, Download, Share, Filter
- **Navigation:** ChevronLeft, ChevronRight, Menu, Search
- **Features:** Zap (AI), Database, Globe, Lock, Settings

## Mockup Tools

### Recommended Software

- **Figma:** High-fidelity designs and prototypes
- **Excalidraw:** Quick wireframes and diagrams
- **Storybook:** Component documentation
- **Framer:** Interactive prototypes

### Export Settings

- **Format:** PNG for static, SVG for icons
- **Resolution:** 2x for Retina displays
- **Color Space:** sRGB
- **Optimization:** TinyPNG for compression

---

**Note:** All mockups should follow the established design system and maintain consistency with the existing SIAM application interface.
