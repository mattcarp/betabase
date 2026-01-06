/**
 * MAC Design System - Data Storytelling Theme for Recharts
 * 
 * Implements the muted, sophisticated color palette and minimal styling
 * from the MAC Data Storytelling principles.
 * 
 * @see docs/MAC-DATA-STORYTELLING-SECTION.md
 */

export const MAC_CHART_COLORS = {
  // Muted professional colors (not bright/garish)
  coral: '#d97752',
  coralDim: '#b86543',
  teal: '#3ba99c',
  tealDim: '#2d8a7f',
  purple: '#26c6da',
  purpleDim: '#00bcd4',
  
  // Neutral hierarchy
  zinc100: '#fafafa',
  zinc300: '#d4d4d4',
  zinc400: '#a3a3a3',
  zinc500: '#737373',
  zinc600: '#525252',
  zinc800: '#27272a',
  
  // Backgrounds
  bgPure: '#000000',
  bgElevated: '#0a0a0a',
  
  // Semantic (use sparingly)
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
} as const;

/**
 * Global Recharts theme configuration for MAC Design System
 * Use this for all charts across the application
 */
export const MAC_RECHARTS_THEME = {
  background: 'transparent',
  
  // Minimal grid - subtle, sparse, horizontal only
  cartesianGrid: {
    stroke: 'rgba(255, 255, 255, 0.05)',
    strokeDasharray: '3 3',
    vertical: false,  // Remove vertical gridlines for cleaner look
  },
  
  // Minimal X axis
  xAxis: {
    stroke: 'rgba(255, 255, 255, 0.2)',
    tick: { 
      fill: MAC_CHART_COLORS.zinc600, 
      fontSize: 10,
      fontWeight: 400,
    },
    axisLine: { strokeWidth: 1 },
    tickLine: false,  // Remove tick marks
  },
  
  // Minimal Y axis
  yAxis: {
    stroke: 'rgba(255, 255, 255, 0.2)',
    tick: { 
      fill: MAC_CHART_COLORS.zinc600, 
      fontSize: 10,
      fontWeight: 400,
    },
    axisLine: { strokeWidth: 1 },
    tickLine: false,  // Remove tick marks
  },
  
  // Clean tooltip (dark with subtle border)
  tooltip: {
    contentStyle: {
      background: 'rgba(0, 0, 0, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '6px',
      padding: '8px 12px',
      backdropFilter: 'blur(10px)',
    },
    itemStyle: { 
      color: MAC_CHART_COLORS.zinc100, 
      fontSize: 14,
      fontWeight: 300,
    },
    labelStyle: { 
      color: MAC_CHART_COLORS.zinc400, 
      fontSize: 12,
      fontWeight: 400,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    },
    cursor: {
      stroke: MAC_CHART_COLORS.zinc600,
      strokeWidth: 1,
      strokeDasharray: '3 3',
    },
  },
  
  // Minimal legend
  legend: {
    wrapperStyle: { 
      paddingTop: '20px',
      fontSize: '12px',
      color: MAC_CHART_COLORS.zinc400,
    },
    iconType: 'circle' as const,
  },
} as const;

/**
 * Pre-configured chart colors for different data series
 * Use these instead of bright primary colors
 */
export const CHART_SERIES_COLORS = {
  // For 2-color charts (most common)
  dual: [MAC_CHART_COLORS.coral, MAC_CHART_COLORS.teal],
  
  // For 3-color charts
  triple: [MAC_CHART_COLORS.coral, MAC_CHART_COLORS.teal, MAC_CHART_COLORS.purple],
  
  // Monochrome (purple shades)
  mono: [MAC_CHART_COLORS.purple, MAC_CHART_COLORS.purpleDim, MAC_CHART_COLORS.zinc600],
  
  // Semantic (success/warning/error)
  semantic: [MAC_CHART_COLORS.success, MAC_CHART_COLORS.warning, MAC_CHART_COLORS.error],
} as const;

/**
 * Helper to get chart color by index
 * Automatically cycles through the dual palette
 */
export function getChartColor(index: number, palette: 'dual' | 'triple' | 'mono' | 'semantic' = 'dual'): string {
  const colors = CHART_SERIES_COLORS[palette];
  return colors[index % colors.length];
}

/**
 * Gradient definitions for sophisticated chart fills
 */
export const CHART_GRADIENTS = {
  coral: {
    id: 'coralGradient',
    stops: [
      { offset: '0%', color: MAC_CHART_COLORS.coral, opacity: 0.4 },
      { offset: '100%', color: MAC_CHART_COLORS.coral, opacity: 0.1 },
    ],
  },
  teal: {
    id: 'tealGradient',
    stops: [
      { offset: '0%', color: MAC_CHART_COLORS.teal, opacity: 0.4 },
      { offset: '100%', color: MAC_CHART_COLORS.teal, opacity: 0.1 },
    ],
  },
  purple: {
    id: 'purpleGradient',
    stops: [
      { offset: '0%', color: MAC_CHART_COLORS.purple, opacity: 0.4 },
      { offset: '100%', color: MAC_CHART_COLORS.purple, opacity: 0.1 },
    ],
  },
} as const;

