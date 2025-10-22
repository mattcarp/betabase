# Session Timeline Component

## Overview

The **SessionTimeline** component is an expandable timeline sidebar that displays all captured user interactions during test sessions in chronological order. It provides real-time visibility into test execution flow with filtering, searching, and detailed interaction views.

## Features

- ✅ **Chronological Timeline**: All interactions displayed in order of occurrence
- ✅ **Rich Interaction Details**: Each entry shows icon, timestamp, element description, and optional thumbnail
- ✅ **Interactive Selection**: Click any interaction to highlight it in the main view
- ✅ **Advanced Filtering**: Filter by interaction type (clicks, typing, navigation, errors, etc.)
- ✅ **Search Capability**: Real-time text search across all interaction fields
- ✅ **Collapsible View**: Expand/collapse all entries or the entire sidebar
- ✅ **Draggable Width**: Resize the timeline from 240px to 600px
- ✅ **Real-time Updates**: Automatically updates as new interactions are captured
- ✅ **MAC Design System**: Styled with professional MAC design tokens

## Installation

The component is located at:

```
src/components/test-dashboard/SessionTimeline.tsx
```

Type definitions:

```
src/types/session-timeline.ts
```

## Usage

### Basic Example

```tsx
import SessionTimeline from "@/components/test-dashboard/SessionTimeline";
import { SessionInteraction } from "@/types/session-timeline";

function MyTestDashboard() {
  const [interactions, setInteractions] = useState<SessionInteraction[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleInteractionClick = (interaction: SessionInteraction) => {
    setSelectedId(interaction.id);
    console.log("Selected:", interaction);
  };

  return (
    <div className="flex h-screen">
      <SessionTimeline
        interactions={interactions}
        currentInteractionId={selectedId}
        onInteractionClick={handleInteractionClick}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      {/* Main content */}
    </div>
  );
}
```

### Full Example with Real-time Capture

See `src/components/test-dashboard/SessionTimelineExample.tsx` for a complete working example with:

- Real-time interaction generation
- Recording start/stop controls
- Interaction detail view
- All interaction types demonstrated

## Props

### `SessionTimelineProps`

| Prop                   | Type                                        | Default      | Description                          |
| ---------------------- | ------------------------------------------- | ------------ | ------------------------------------ |
| `interactions`         | `SessionInteraction[]`                      | **Required** | Array of captured interactions       |
| `currentInteractionId` | `string?`                                   | `undefined`  | ID of currently selected interaction |
| `onInteractionClick`   | `(interaction: SessionInteraction) => void` | `undefined`  | Callback when interaction is clicked |
| `onFilterChange`       | `(filter: SessionTimelineFilter) => void`   | `undefined`  | Callback when filters change         |
| `className`            | `string`                                    | `undefined`  | Additional CSS classes               |
| `defaultWidth`         | `number`                                    | `320`        | Initial width in pixels              |
| `minWidth`             | `number`                                    | `240`        | Minimum resizable width              |
| `maxWidth`             | `number`                                    | `600`        | Maximum resizable width              |
| `isCollapsed`          | `boolean`                                   | `false`      | Whether sidebar is collapsed         |
| `onToggleCollapse`     | `() => void`                                | `undefined`  | Callback to toggle collapse state    |

## Data Types

### `SessionInteraction`

The main data structure for captured interactions:

```typescript
interface SessionInteraction {
  id: string; // Unique identifier
  type: InteractionType; // Type of interaction
  timestamp: number; // Unix timestamp in milliseconds
  description: string; // Human-readable description
  elementDescription?: string; // CSS selector or element description
  selector?: string; // CSS/XPath selector
  value?: string; // Input value or text
  url?: string; // URL for navigation events
  status: InteractionStatus; // Success, error, warning, info
  duration?: number; // Duration in milliseconds
  thumbnail?: string; // Base64 or URL to screenshot
  metadata?: object; // Additional metadata
  networkData?: object; // Network request details
  error?: object; // Error details if applicable
}
```

### `InteractionType`

Supported interaction types:

- `"click"` - Mouse click events
- `"type"` - Keyboard input
- `"navigate"` - Page navigation
- `"scroll"` - Scroll events
- `"hover"` - Mouse hover
- `"select"` - Dropdown/select changes
- `"submit"` - Form submissions
- `"error"` - Error occurrences
- `"assertion"` - Test assertions
- `"screenshot"` - Screenshot captures
- `"network"` - Network requests

### `InteractionStatus`

Status indicators:

- `"success"` - Operation completed successfully (green)
- `"error"` - Operation failed (red)
- `"warning"` - Operation completed with warnings (amber)
- `"info"` - Informational event (blue)

## Filtering

### Filter by Type

```tsx
const handleFilterChange = (filter: SessionTimelineFilter) => {
  console.log("Active filters:", filter);
  // filter.types: ["click", "type"] - Only show clicks and typing
  // filter.statuses: ["error"] - Only show errors
  // filter.searchQuery: "button" - Text search
};
```

### Search

The search bar filters interactions by:

- Description text
- Element description
- CSS selector
- Value/input text

## Integration with Test Dashboard

The SessionTimeline is integrated into the main TestDashboard at:

```
src/components/test-dashboard/TestDashboard.tsx
```

It automatically captures interactions during test execution:

```typescript
// Capture interactions during test events
const captureInteraction = (interaction: Omit<SessionInteraction, "id" | "timestamp">) => {
  const newInteraction: SessionInteraction = {
    ...interaction,
    id: `interaction-${Date.now()}-${Math.random()}`,
    timestamp: Date.now(),
  };
  setSessionInteractions((prev) => [...prev, newInteraction]);
};

// Example: Capture test completion
captureInteraction({
  type: "assertion",
  description: "Login test completed successfully",
  status: "success",
  duration: 1234,
});
```

## Styling

The component uses the MAC Design System with CSS variables:

```css
/* MAC Design System Variables */
--mac-primary-blue-400: #4a9eff;
--mac-surface-elevated: #141414;
--mac-text-primary: #ffffff;
--mac-utility-border: rgba(255, 255, 255, 0.08);

/* Timeline-specific */
--timeline-width-default: 320px;
--timeline-width-min: 240px;
--timeline-width-max: 600px;
--timeline-width-collapsed: 48px;
```

### Custom Styling

Apply custom classes via the `className` prop:

```tsx
<SessionTimeline
  className="custom-timeline shadow-xl"
  // ...other props
/>
```

## Keyboard Shortcuts

| Key             | Action                               |
| --------------- | ------------------------------------ |
| `/`             | Focus search bar                     |
| `Escape`        | Clear search                         |
| `Arrow Up/Down` | Navigate interactions (when focused) |
| `Enter`         | Select highlighted interaction       |

## Performance

The component is optimized for large datasets:

- **Virtual scrolling** via shadcn ScrollArea
- **Efficient filtering** with memoized calculations
- **Debounced search** to prevent excessive re-renders
- **Lazy thumbnail loading** for images

## Best Practices

### 1. Capture Meaningful Interactions

```typescript
// ✅ Good - Descriptive and actionable
captureInteraction({
  type: "click",
  description: "Clicked 'Submit Order' button",
  elementDescription: "button.submit-order-btn",
  selector: '[data-testid="submit-order"]',
  status: "success",
});

// ❌ Bad - Too generic
captureInteraction({
  type: "click",
  description: "Click",
  status: "success",
});
```

### 2. Include Screenshots for Key Actions

```typescript
captureInteraction({
  type: "screenshot",
  description: "Dashboard after login",
  thumbnail: screenshotDataUrl, // Base64 data URL
  status: "success",
});
```

### 3. Capture Network Requests

```typescript
captureInteraction({
  type: "network",
  description: "User authentication API call",
  networkData: {
    method: "POST",
    url: "/api/auth/login",
    statusCode: 200,
    duration: 450,
    size: "2.3 KB",
  },
  status: "success",
});
```

### 4. Always Capture Errors

```typescript
captureInteraction({
  type: "error",
  description: "Failed to load user profile",
  status: "error",
  error: {
    message: "Network request failed",
    stack: error.stack,
  },
});
```

## Troubleshooting

### Timeline not showing interactions

**Issue**: Timeline appears empty even though tests are running.

**Solution**: Ensure you're calling `captureInteraction()` during test events:

```typescript
// Add to your test event handler
handleStreamEvent = (event) => {
  // ... existing code

  captureInteraction({
    type: "assertion",
    description: event.test?.title || "Test event",
    status: event.test?.status === "passed" ? "success" : "error",
  });
};
```

### Dragging not working

**Issue**: Cannot resize the timeline by dragging.

**Solution**: Ensure the parent container has proper layout:

```tsx
<div className="flex h-screen">
  {" "}
  {/* Must be flex container */}
  <SessionTimeline {...props} />
  <div className="flex-1">
    {" "}
    {/* Main content must be flex-1 */}
    {/* content */}
  </div>
</div>
```

### Performance issues with many interactions

**Issue**: Timeline becomes slow with 1000+ interactions.

**Solution**: Implement pagination or limit displayed interactions:

```typescript
const recentInteractions = interactions.slice(-500); // Last 500 only

<SessionTimeline interactions={recentInteractions} />
```

## Future Enhancements

Planned features for future versions:

- [ ] Export timeline to JSON/CSV
- [ ] Playback mode with time scrubbing
- [ ] Group interactions by test case
- [ ] Comparison view for multiple test runs
- [ ] Integration with Playwright trace viewer
- [ ] AI-powered interaction analysis
- [ ] Custom interaction types via plugins

## Related Components

- **TraceViewer** (`src/components/test-dashboard/TraceViewer.tsx`) - Detailed trace playback
- **TestExecutionPanel** (`src/components/test-dashboard/TestExecutionPanel.tsx`) - Test runner controls
- **TestResultsViewer** (`src/components/test-dashboard/TestResultsViewer.tsx`) - Test results display

## Contributing

When modifying the SessionTimeline component:

1. Update type definitions in `src/types/session-timeline.ts`
2. Maintain MAC Design System compliance
3. Add new interaction types to the icon mapping
4. Update this documentation
5. Test with the example component

## Support

For issues or questions about the SessionTimeline component:

- Check the example component: `SessionTimelineExample.tsx`
- Review the TestDashboard integration
- See MAC Design System docs: `.claude/design-system.md`
- Reference Playwright trace types for inspiration

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Author**: SIAM Development Team
