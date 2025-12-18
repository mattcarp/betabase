# MAC Design System - Data Storytelling & Information Design

**Section III-B: Data Storytelling & Information Design**

_Inspired by Pitch & Slide, Linear, and Edward Tufte's principles of excellence in statistical graphics_

---

## Philosophy: Data with Purpose, Design with Restraint

Data visualization in the MAC Design System prioritizes **clarity over decoration**, **impact over complexity**, and **narrative over noise**. Every chart tells a story. Every metric drives a decision. Every pixel earns its place.

### Core Principles

- [ ] **Maximize Data-Ink Ratio**: Remove all non-essential visual elements (Tufte's First Principle)
- [ ] **Bold Without Brightness**: High contrast with muted, sophisticated colors
- [ ] **Typography as Hierarchy**: Big numbers tell the story, small text provides context
- [ ] **Geometric Simplicity**: Clean shapes, modular grids, intentional repetition
- [ ] **Dark by Default**: All data viz optimized for dark mode professional environments
- [ ] **Accessible Excellence**: WCAG AAA contrast for all critical data points

---

## I. Color Palette for Data Visualization

### Primary Data Colors (Muted Professional)

```css
/* Accent Colors - Bold But Not Bright */
--mac-data-coral: #d97752;        /* Primary accent - warm, professional */
--mac-data-coral-dim: #b86543;     /* For secondary data points */
--mac-data-teal: #3ba99c;          /* Cool accent - balance to coral */
--mac-data-teal-dim: #2d8a7f;      /* Subdued teal */
--mac-data-purple: #8b5cf6;        /* Tech accent - sparingly */
--mac-data-purple-dim: #7c3aed;    /* Deeper purple */

/* Neutral Data Colors - The Workhorses */
--mac-data-zinc-100: #fafafa;      /* Highest emphasis text */
--mac-data-zinc-300: #d4d4d4;      /* High emphasis */
--mac-data-zinc-400: #a3a3a3;      /* Medium emphasis (most labels) */
--mac-data-zinc-500: #737373;      /* Low emphasis */
--mac-data-zinc-600: #525252;      /* Minimal emphasis */
--mac-data-zinc-800: #27272a;      /* Subtle backgrounds */

/* Background Hierarchy for Data Cards */
--mac-data-bg-pure: #000000;       /* Hero chart backgrounds */
--mac-data-bg-elevated: #0a0a0a;   /* Card backgrounds */
--mac-data-bg-card: rgba(10, 10, 10, 0.6);  /* Glass effect cards */

/* Utility Colors - Semantic Meaning */
--mac-data-success: #22c55e;       /* Positive trends (use sparingly) */
--mac-data-warning: #f59e0b;       /* Caution indicators */
--mac-data-error: #ef4444;         /* Negative trends */
--mac-data-info: #3b82f6;          /* Informational highlights */
```

### Color Usage Guidelines

- [ ] **Maximum 3 colors per chart**: One primary, one secondary, one neutral
- [ ] **Never use pure primaries**: All colors must be muted/professional
- [ ] **Semantic consistency**: Red = negative, Green = positive, across all charts
- [ ] **Accessibility first**: All data colors must pass WCAG AAA (7:1 contrast) on black

### Color Combinations That Work

```css
/* Combination 1: Coral + Teal (Recommended) */
.mac-data-combo-warm {
  --primary: var(--mac-data-coral);
  --secondary: var(--mac-data-teal);
  --background: var(--mac-data-bg-pure);
}

/* Combination 2: Purple Monochrome (Analytics) */
.mac-data-combo-mono {
  --primary: var(--mac-data-purple);
  --secondary: var(--mac-data-purple-dim);
  --tertiary: var(--mac-data-zinc-600);
}

/* Combination 3: High Contrast (Executive) */
.mac-data-combo-executive {
  --primary: var(--mac-data-zinc-100);
  --accent: var(--mac-data-coral);
  --background: var(--mac-data-bg-pure);
}
```

---

## II. Typography Hierarchy for Data

### Number Display Standards

```css
/* Hero Numbers - The Headline */
.mac-data-hero-number {
  font-size: 96px;           /* 6rem */
  font-weight: 100;           /* Ultra-light for elegance */
  line-height: 1;
  letter-spacing: -0.03em;    /* Tighter for impact */
  color: var(--mac-data-zinc-100);
  font-variant-numeric: tabular-nums;  /* Aligned digits */
}

/* Large Stats - Dashboard KPIs */
.mac-data-stat-large {
  font-size: 60px;           /* 3.75rem */
  font-weight: 200;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--mac-data-zinc-100);
  font-variant-numeric: tabular-nums;
}

/* Medium Numbers - Chart Labels */
.mac-data-number-medium {
  font-size: 36px;           /* 2.25rem */
  font-weight: 300;
  line-height: 1.2;
  color: var(--mac-data-zinc-300);
  font-variant-numeric: tabular-nums;
}

/* Small Numbers - Data Points */
.mac-data-number-small {
  font-size: 20px;           /* 1.25rem */
  font-weight: 400;
  line-height: 1.4;
  color: var(--mac-data-zinc-400);
  font-variant-numeric: tabular-nums;
}
```

### Label & Context Text

```css
/* Category Labels - Always Uppercase */
.mac-data-label {
  font-size: 12px;           /* 0.75rem */
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--mac-data-zinc-400);
}

/* Supporting Text - Context */
.mac-data-context {
  font-size: 14px;           /* 0.875rem */
  font-weight: 300;
  line-height: 1.6;
  color: var(--mac-data-zinc-500);
}

/* Tiny Details - Axis Labels, Footnotes */
.mac-data-detail {
  font-size: 10px;           /* 0.625rem */
  font-weight: 400;
  color: var(--mac-data-zinc-600);
  font-variant-numeric: tabular-nums;
}
```

### Tabular Numbers (Critical)

- [ ] **Always use**: `font-variant-numeric: tabular-nums;`
- [ ] **Reason**: Ensures numbers align vertically in tables and charts
- [ ] **Apply to**: All numeric displays, percentages, currencies

---

## III. Chart Component Standards

### A. Minimal Bar Charts (Pitch & Slide Style)

```typescript
interface MinimalBarChartProps {
  data: Array<{ label: string; value: number }>;
  variant?: 'coral' | 'teal' | 'mono';
  showGrid?: boolean;  // Default: false
  showAxis?: boolean;  // Default: false
}

// Design Specifications:
// - Bar height: 32px minimum (touch-friendly)
// - Bar spacing: 8px between bars
// - Corner radius: 4px (subtle rounding)
// - Background: Transparent or --mac-data-zinc-800
// - Foreground: High contrast color from palette
// - No borders, no shadows
// - Optional: Show value labels at end of bars
```

**Visual Example:**
```
Marketing     ████████████████████████████  156
Engineering   ████████████████████  98
Design        ████████████  67
Legal         ██████  34
```

**Implementation Pattern:**
```tsx
<div className="mac-minimal-bar-chart">
  {data.map((item, i) => (
    <div key={i} className="mac-bar-row">
      <span className="mac-data-label">{item.label}</span>
      <div className="mac-bar-container">
        <div 
          className="mac-bar-fill"
          style={{ 
            width: `${(item.value / maxValue) * 100}%`,
            background: 'var(--mac-data-coral)'
          }}
        />
      </div>
      <span className="mac-data-number-small">{item.value}</span>
    </div>
  ))}
</div>
```

### B. Arc Gauges (Minimal Circular Progress)

```css
/* Arc Gauge Specifications */
.mac-arc-gauge {
  /* Size: 120px - 200px diameter */
  /* Stroke width: 8px - 12px */
  /* Background arc: var(--mac-data-zinc-800) */
  /* Foreground arc: var(--mac-data-coral) */
  /* Start angle: -90deg (top) */
  /* End angle: Based on percentage */
  /* Cap: round */
}

.mac-arc-label {
  /* Positioned in center */
  /* Font: mac-data-stat-large or mac-data-number-medium */
  /* Shows percentage or absolute value */
}
```

**Implementation Pattern:**
```tsx
<svg className="mac-arc-gauge" viewBox="0 0 160 160">
  {/* Background arc */}
  <circle
    cx="80"
    cy="80"
    r="70"
    fill="none"
    stroke="var(--mac-data-zinc-800)"
    strokeWidth="10"
    strokeDasharray="440"
    strokeDashoffset="110"  /* Creates 75% arc (270deg) */
    strokeLinecap="round"
  />
  {/* Foreground arc (data) */}
  <circle
    cx="80"
    cy="80"
    r="70"
    fill="none"
    stroke="var(--mac-data-coral)"
    strokeWidth="10"
    strokeDasharray="440"
    strokeDashoffset={`${110 + (330 * (1 - percentage))}`}
    strokeLinecap="round"
    className="transition-all duration-500"
  />
  {/* Center label */}
  <text x="80" y="85" className="mac-data-stat-large" textAnchor="middle">
    {value}%
  </text>
</svg>
```

### C. Geometric Number Grids (Pitch & Slide Signature)

```css
/* Number Grid Layout */
.mac-number-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 24px;
  padding: 48px;
}

.mac-grid-cell {
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--mac-data-bg-elevated);
  border: 1px solid var(--mac-data-zinc-800);
  border-radius: 8px;
}

.mac-grid-number {
  font-size: 72px;
  font-weight: 100;
  color: var(--mac-data-zinc-300);
}

/* Accent cell (highlighted) */
.mac-grid-cell--accent {
  background: var(--mac-data-coral);
  color: var(--mac-data-bg-pure);
}
```

**Visual Example:**
```
┌─────┬─────┬─────┬─────┐
│ 01  │ 03  │ 05  │ 07  │
├─────┼─────┼─────┼─────┤
│ 02  │ 04  │ 06  │ 09  │
└─────┴─────┴─────┴─────┘
```

### D. Minimal Line Charts (Tufte-Inspired)

```typescript
interface MinimalLineChartConfig {
  strokeWidth: 2;           // Thin, elegant line
  strokeColor: string;      // Single color
  fill: 'none';             // No area fill
  gridLines: false;         // No grid by default
  axisX: 'minimal';         // Thin line, opacity 0.2
  axisY: 'minimal';         // Thin line, opacity 0.2
  points: 'on-hover';       // Show dots only on hover
  tooltip: 'clean';         // White text, no background
}
```

**Recharts Implementation:**
```tsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
    {/* Minimal grid - subtle, sparse */}
    <CartesianGrid 
      strokeDasharray="3 3" 
      stroke="rgba(255, 255, 255, 0.05)" 
      vertical={false}  /* Horizontal lines only */
    />
    
    {/* Minimal axes */}
    <XAxis 
      dataKey="date" 
      stroke="rgba(255, 255, 255, 0.2)"
      tick={{ fill: 'var(--mac-data-zinc-600)', fontSize: 10 }}
      axisLine={{ strokeWidth: 1 }}
      tickLine={false}
    />
    <YAxis 
      stroke="rgba(255, 255, 255, 0.2)"
      tick={{ fill: 'var(--mac-data-zinc-600)', fontSize: 10 }}
      axisLine={{ strokeWidth: 1 }}
      tickLine={false}
    />
    
    {/* Clean tooltip */}
    <Tooltip 
      contentStyle={{ 
        background: 'rgba(0, 0, 0, 0.95)', 
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '6px',
        padding: '8px 12px'
      }}
      itemStyle={{ color: 'var(--mac-data-zinc-100)', fontSize: 14 }}
      labelStyle={{ color: 'var(--mac-data-zinc-400)', fontSize: 12 }}
    />
    
    {/* The line itself - star of the show */}
    <Line 
      type="monotone" 
      dataKey="value" 
      stroke="var(--mac-data-coral)" 
      strokeWidth={2}
      dot={false}  /* No dots by default */
      activeDot={{ r: 4, fill: 'var(--mac-data-coral)' }}  /* Show on hover */
    />
  </LineChart>
</ResponsiveContainer>
```

### E. Icon Repetition Patterns (People Icons, Dots)

```tsx
// For representing quantities visually (e.g., "1 out of 4 people")
interface IconRepeatProps {
  total: number;           // Total icons to show
  highlighted: number;     // How many to highlight
  icon: 'person' | 'dot' | 'square';
  columns?: number;        // Grid columns (default: auto)
}

// Visual Example:
// Showing "78.1k out of 95.3k users"
const ratio = 78100 / 95300; // ~82%
const totalIcons = 100;
const highlightedIcons = Math.round(totalIcons * ratio);

// Render:
// 🧍🧍🧍🧍🧍🧍🧍🧍🧍🧍 (10 per row)
// 🧍🧍🧍🧍🧍🧍🧍🧍🧍🧍
// 👤👤👤👤👤👤👤👤👤👤 (lighter for non-highlighted)
```

**CSS Implementation:**
```css
.mac-icon-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
  max-width: 400px;
}

.mac-icon-cell {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mac-icon-cell--highlighted {
  color: var(--mac-data-coral);
}

.mac-icon-cell--dim {
  color: var(--mac-data-zinc-600);
  opacity: 0.4;
}
```

---

## IV. Layout Patterns for Data

### A. KPI Card Grid (Dashboard Standard)

```css
.mac-kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
}

.mac-kpi-card {
  background: var(--mac-data-bg-card);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 24px;
  backdrop-filter: blur(10px);
}

.mac-kpi-label {
  /* Use mac-data-label class */
  margin-bottom: 8px;
}

.mac-kpi-value {
  /* Use mac-data-stat-large class */
  margin-bottom: 4px;
}

.mac-kpi-change {
  font-size: 14px;
  color: var(--mac-data-success);  /* or error for negative */
}
```

**Example Layout:**
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ TOTAL USERS  │ ACTIVE TODAY │ AVG SESSION  │ CONVERSION   │
│ 156,429      │ 12,847       │ 4.2 min      │ 3.8%         │
│ +12.3% ↑     │ +8.1% ↑      │ -0.4 min ↓   │ +0.2% ↑      │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### B. Chart + Context Layout (2-Column)

```css
.mac-chart-context-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
  align-items: start;
}

.mac-chart-area {
  /* Main chart takes 2/3 width */
  min-height: 400px;
}

.mac-context-sidebar {
  /* Supporting metrics, legend, notes take 1/3 */
  padding: 24px;
  background: var(--mac-data-bg-elevated);
  border-radius: 8px;
}
```

### C. Hero Stat Layout (Full Bleed Impact)

```css
.mac-hero-stat {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: var(--mac-data-bg-pure);
  padding: 96px 48px;
}

.mac-hero-stat__label {
  /* Use mac-data-label */
  margin-bottom: 16px;
}

.mac-hero-stat__number {
  /* Use mac-data-hero-number (96px) */
  margin-bottom: 24px;
}

.mac-hero-stat__context {
  /* Use mac-data-context */
  max-width: 600px;
}
```

---

## V. Animation & Interaction Standards

### Chart Entry Animations

```css
/* Staggered fade-in for chart elements */
@keyframes mac-chart-entry {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mac-chart-element {
  animation: mac-chart-entry 0.4s ease-out;
}

/* Stagger children */
.mac-chart-element:nth-child(1) { animation-delay: 0ms; }
.mac-chart-element:nth-child(2) { animation-delay: 50ms; }
.mac-chart-element:nth-child(3) { animation-delay: 100ms; }
/* ... and so on */
```

### Number Count-Up Animation

```typescript
// Animate numbers from 0 to target value
const useCountUp = (target: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / duration;
      
      if (progress < 1) {
        setCount(Math.floor(target * progress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration]);
  
  return count;
};
```

### Hover States for Charts

```css
/* Bar chart bars */
.mac-bar-fill {
  transition: all 150ms ease;
}

.mac-bar-fill:hover {
  filter: brightness(1.2);
  cursor: pointer;
}

/* Line chart points */
.recharts-line-dot {
  transition: r 150ms ease;
}

.recharts-line-dot:hover {
  r: 6 !important;  /* Enlarge on hover */
}
```

---

## VI. Accessibility Standards for Data

### Color Contrast Requirements

- [ ] **Hero numbers**: 7:1 minimum (WCAG AAA)
- [ ] **Chart labels**: 4.5:1 minimum (WCAG AA)
- [ ] **Data points**: 3:1 minimum against background
- [ ] **Never rely on color alone**: Use patterns, labels, or icons

### Screen Reader Support

```tsx
// Example: Accessible bar chart
<div 
  className="mac-bar-chart"
  role="img"
  aria-label="Monthly revenue chart showing growth from $12k to $45k"
>
  {data.map((item, i) => (
    <div 
      key={i}
      className="mac-bar-row"
      role="group"
      aria-label={`${item.month}: $${item.revenue}k`}
    >
      {/* Visual bar */}
      <div className="mac-bar-fill" aria-hidden="true" />
      {/* Screen reader text */}
      <span className="sr-only">{item.month}: ${item.revenue}k</span>
    </div>
  ))}
</div>
```

### Keyboard Navigation

- [ ] **Tab through data points**: All interactive chart elements must be keyboard accessible
- [ ] **Arrow keys for charts**: Allow arrow key navigation between data points
- [ ] **Escape to close**: Tooltips and overlays must close with Escape key
- [ ] **Focus indicators**: 2px outline at 3:1 contrast minimum

---

## VII. Data Storytelling Checklist

### Before Creating Any Visualization

- [ ] **What story am I telling?** Can I summarize it in one sentence?
- [ ] **Who is the audience?** Executive? Analyst? End user?
- [ ] **What action should they take?** Every chart should drive a decision
- [ ] **Is this the simplest possible representation?** Remove 50% of what you think you need

### Chart Selection Decision Tree

```
Is it a single number?
  → Use Hero Stat (96px font)

Is it comparing categories?
  → Use Minimal Bar Chart

Is it showing trend over time?
  → Use Minimal Line Chart

Is it showing progress/percentage?
  → Use Arc Gauge

Is it showing composition/parts of whole?
  → Use Stacked Bar (NOT pie chart)

Is it showing distribution?
  → Use Histogram or Dot Plot
```

### Common Mistakes to Avoid

- [ ] **DON'T**: Use 3D charts (ever)
- [ ] **DON'T**: Use pie charts (use bars instead)
- [ ] **DON'T**: Use bright neon colors
- [ ] **DON'T**: Add decorative backgrounds
- [ ] **DON'T**: Show more than 3 data series on one chart
- [ ] **DON'T**: Use chart titles (the surrounding context should explain)
- [ ] **DON'T**: Truncate Y-axis (always start at 0 for bars)

---

## VIII. Component Library Reference

### Recommended Recharts Configuration

```tsx
// Global Recharts theme for MAC Design System
export const MAC_RECHARTS_THEME = {
  background: 'transparent',
  
  cartesianGrid: {
    stroke: 'rgba(255, 255, 255, 0.05)',
    strokeDasharray: '3 3',
    vertical: false,  // Horizontal lines only
  },
  
  xAxis: {
    stroke: 'rgba(255, 255, 255, 0.2)',
    tick: { fill: 'var(--mac-data-zinc-600)', fontSize: 10 },
    axisLine: { strokeWidth: 1 },
    tickLine: false,
  },
  
  yAxis: {
    stroke: 'rgba(255, 255, 255, 0.2)',
    tick: { fill: 'var(--mac-data-zinc-600)', fontSize: 10 },
    axisLine: { strokeWidth: 1 },
    tickLine: false,
  },
  
  tooltip: {
    contentStyle: {
      background: 'rgba(0, 0, 0, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '6px',
      padding: '8px 12px',
    },
    itemStyle: { color: 'var(--mac-data-zinc-100)', fontSize: 14 },
    labelStyle: { color: 'var(--mac-data-zinc-400)', fontSize: 12 },
  },
  
  legend: {
    wrapperStyle: { paddingTop: '20px' },
    iconType: 'circle',
  },
};
```

### Using with Recharts

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { MAC_RECHARTS_THEME } from '@/lib/mac-theme';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid {...MAC_RECHARTS_THEME.cartesianGrid} />
    <XAxis {...MAC_RECHARTS_THEME.xAxis} dataKey="date" />
    <YAxis {...MAC_RECHARTS_THEME.yAxis} />
    <Tooltip {...MAC_RECHARTS_THEME.tooltip} />
    <Line 
      type="monotone" 
      dataKey="value" 
      stroke="var(--mac-data-coral)" 
      strokeWidth={2}
      dot={false}
      activeDot={{ r: 4 }}
    />
  </LineChart>
</ResponsiveContainer>
```

---

## IX. Real-World Examples from The Betabase

### Example 1: Knowledge Base Health Dashboard

**Before (Garish):**
- Bright blue bars (#3b82f6)
- Heavy gridlines
- Multiple competing colors
- Cluttered axis labels

**After (MAC Style):**
```tsx
<Card className="mac-card bg-black/40 border-white/10">
  <CardHeader>
    <CardTitle className="text-lg font-light text-zinc-300">
      Knowledge Coverage
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {sources.map(source => (
      <div key={source.name} className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="mac-data-label">{source.name}</span>
          <span className="mac-data-number-small">{source.count}</span>
        </div>
        {/* Minimal bar - no decoration */}
        <div className="h-1 bg-zinc-800 rounded-sm overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-coral-500 to-coral-400"
            style={{ width: `${source.percentage}%` }}
          />
        </div>
      </div>
    ))}
  </CardContent>
</Card>
```

### Example 2: Test Success Rate (Arc Gauge)

```tsx
<div className="flex flex-col items-center justify-center p-12">
  <span className="mac-data-label mb-4">TEST PASS RATE</span>
  <svg className="mac-arc-gauge" viewBox="0 0 200 200" width="200" height="200">
    {/* Background arc */}
    <circle
      cx="100" cy="100" r="80"
      fill="none"
      stroke="rgba(255, 255, 255, 0.1)"
      strokeWidth="12"
      strokeDasharray="502"
      strokeDashoffset="125"
      strokeLinecap="round"
    />
    {/* Data arc */}
    <circle
      cx="100" cy="100" r="80"
      fill="none"
      stroke="var(--mac-data-teal)"
      strokeWidth="12"
      strokeDasharray="502"
      strokeDashoffset={125 + (377 * (1 - 0.87))}  /* 87% */
      strokeLinecap="round"
      className="transition-all duration-1000 ease-out"
    />
    {/* Center value */}
    <text x="100" y="110" className="mac-data-stat-large" textAnchor="middle" fill="white">
      87%
    </text>
  </svg>
  <p className="mac-data-context mt-4 text-center max-w-xs">
    8,449 scenarios passed out of 9,712 total
  </p>
</div>
```

---

## X. Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Add CSS custom properties to global stylesheet
- [ ] Create MAC_RECHARTS_THEME configuration
- [ ] Build 3 core components: MinimalBar, ArcGauge, HeroStat
- [ ] Document usage examples

### Phase 2: Migration (Week 2)
- [ ] Audit existing charts (Curate tab, Performance page, RLHF)
- [ ] Replace Recharts default styling with MAC theme
- [ ] Update color variables to muted palette
- [ ] Remove unnecessary gridlines and decorations

### Phase 3: Enhancement (Week 3)
- [ ] Add count-up animations for hero numbers
- [ ] Implement staggered chart entry animations
- [ ] Add keyboard navigation to interactive charts
- [ ] Ensure WCAG AAA compliance

### Phase 4: Documentation (Week 4)
- [ ] Screenshot all chart types for design system docs
- [ ] Create Storybook/component gallery
- [ ] Write accessibility testing guide
- [ ] Publish internal design guidelines

---

## XI. Success Metrics

A MAC-compliant data visualization should achieve:

- **Visual Clarity**: User can understand the story in < 3 seconds
- **Accessibility**: WCAG AAA (7:1 contrast for critical data)
- **Performance**: Chart renders in < 100ms, animates at 60fps
- **Data-Ink Ratio**: > 80% of pixels represent actual data
- **Color Discipline**: ≤ 3 colors per chart
- **User Delight**: Subtle animation that feels premium, not gimmicky

---

## The MAC Data Storytelling Promise

Every data visualization in The Betabase will:

1. **Tell a clear story** - No chart without purpose
2. **Respect the user** - Professional, not playful
3. **Drive decisions** - Actionable, not decorative
4. **Scale gracefully** - From mobile to 4K displays
5. **Age beautifully** - Timeless design, not trendy
6. **Honor the craft** - Edward Tufte would approve

---

_"Above all else, show the data."_  
_— Edward Tufte, The Visual Display of Quantitative Information_

**MAC Data Storytelling** — Where Numbers Become Narratives


