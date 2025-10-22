# Annotation Tools for Test Dashboard

A comprehensive annotation system for the SIAM test dashboard, allowing users to annotate test traces with highlights, notes, screenshots, and issue flags.

## Features

### 🎨 Highlighter Tool
- Draw freehand highlights on the screen
- Multiple colors available (yellow, green, blue, red, purple)
- Adjustable brush width (3px, 5px, 8px, 12px)
- Clear all highlights with one click
- Paths persist across sessions

### 📝 Sticky Notes
- Click anywhere to place a sticky note
- Quick text editing
- Open detailed markdown editor for rich formatting
- Draggable and repositionable
- Edit or delete individual notes

### 📸 Screenshot Tool
- Quick capture entire viewport
- Click and drag to crop specific areas
- Preview before saving
- Download screenshots locally
- Saved with crop metadata

### 🚩 Flag Issues
- Mark bugs and issues on the screen
- Four severity levels: Low, Medium, High, Critical
- Add title and description
- Visual indicators with color coding
- Hover to see details

## Components

### Core Components

#### `AnnotationManager`
Main orchestrator component that provides annotation functionality.

```tsx
import { AnnotationManager } from "@/components/test-dashboard/AnnotationManager";

<AnnotationManager
  timestamp={currentTimestamp}
  totalSteps={traceSteps.length}
  currentStep={currentStepIndex}
  onExportAnnotations={() => {/* custom export logic */}}
  onImportAnnotations={() => {/* custom import logic */}}
/>
```

#### `AnnotationToolbar`
Floating toolbar with tool selection buttons.

```tsx
import { AnnotationToolbar } from "@/components/test-dashboard/AnnotationToolbar";

<AnnotationToolbar
  onExport={handleExport}
  onImport={handleImport}
/>
```

#### `AnnotationPins`
Timeline visualization of annotations.

```tsx
import { AnnotationPins } from "@/components/test-dashboard/AnnotationPins";

<AnnotationPins
  currentStep={currentStep}
  totalSteps={totalSteps}
  onPinClick={(annotation) => console.log(annotation)}
/>
```

### Individual Tool Components

- `HighlighterCanvas` - Drawing canvas for highlights
- `StickyNoteLayer` - Sticky note placement and management
- `ScreenshotCapture` - Screenshot capture with cropping
- `FlagIssueLayer` - Issue flagging with severity levels
- `MarkdownNoteEditor` - Rich text editor for detailed notes

## Usage in TraceViewer

The annotation tools are integrated into the TraceViewer component:

```tsx
import { AnnotationProvider } from "@/contexts/AnnotationContext";
import { AnnotationManager, AnnotationPins } from "@/components/test-dashboard/AnnotationManager";

function TraceViewer() {
  const [annotationsEnabled, setAnnotationsEnabled] = useState(false);

  return (
    <AnnotationProvider>
      {/* Your trace viewer UI */}

      {/* Toggle button */}
      <Button onClick={() => setAnnotationsEnabled(!annotationsEnabled)}>
        Annotations
      </Button>

      {/* Annotation pins on timeline */}
      {annotationsEnabled && (
        <AnnotationPins
          currentStep={currentStep}
          totalSteps={totalSteps}
          onPinClick={handlePinClick}
        />
      )}

      {/* Annotation tools overlay */}
      {annotationsEnabled && (
        <AnnotationManager
          timestamp={currentTimestamp}
          totalSteps={totalSteps}
          currentStep={currentStep}
        />
      )}
    </AnnotationProvider>
  );
}
```

## Data Model

### Annotation Structure

```typescript
interface Annotation {
  id: string;
  timestamp: number;
  pageState: {
    url: string;
    scrollPosition: { x: number; y: number };
    viewportSize: { width: number; height: number };
  };
  createdAt: Date;
  updatedAt?: Date;
  data: AnnotationData;
}

type AnnotationData =
  | HighlightAnnotation
  | NoteAnnotation
  | ScreenshotAnnotation
  | FlagAnnotation;
```

### Annotation Types

- **Highlight**: Drawing paths with color and width
- **Note**: Text/markdown content at a position
- **Screenshot**: Image data with optional crop area
- **Flag**: Issue report with severity and description

## Persistence

Annotations are automatically saved to `localStorage` under the key `siam-annotation-session`:

```typescript
interface AnnotationSession {
  sessionId: string;
  annotations: Annotation[];
  createdAt: Date;
  lastModified: Date;
}
```

## Context API

Use the `useAnnotations` hook to access annotation state:

```tsx
import { useAnnotations } from "@/contexts/AnnotationContext";

function MyComponent() {
  const {
    annotations,
    currentTool,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    setCurrentTool,
    clearAnnotations,
    saveSession,
    loadSession,
  } = useAnnotations();

  // Your logic here
}
```

## Keyboard Shortcuts (Future Enhancement)

Planned keyboard shortcuts:

- `H` - Toggle highlighter
- `N` - Toggle notes
- `S` - Quick screenshot
- `F` - Toggle flag mode
- `Esc` - Deselect current tool
- `Ctrl+Z` - Undo last annotation
- `Ctrl+E` - Export annotations
- `Delete` - Delete selected annotation

## Export/Import

### Export Format

Annotations are exported as JSON:

```json
{
  "sessionId": "session-1234567890",
  "annotations": [...],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "lastModified": "2024-01-15T11:45:00.000Z"
}
```

### Usage

```tsx
// Export
const handleExport = () => {
  const { annotations } = useAnnotations();
  const json = JSON.stringify(annotations, null, 2);
  // Download or send to server
};

// Import
const handleImport = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = JSON.parse(e.target.result);
    // Validate and merge with existing annotations
  };
  reader.readAsText(file);
};
```

## Styling

All components use the MAC Design System:

- Colors from `--mac-*` CSS variables
- Consistent spacing with 8px grid
- Glassmorphism effects with `backdrop-blur`
- Smooth transitions and animations

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Canvas drawing requires HTML5 Canvas API support.

## Performance Considerations

- Annotations are rendered on-demand
- Canvas is cleared and redrawn efficiently
- localStorage is used for persistence (10MB limit)
- Consider IndexedDB for large annotation sets

## Future Enhancements

- [ ] Video playback annotations
- [ ] Collaborative annotations (real-time)
- [ ] Annotation templates
- [ ] Export to PDF with annotations
- [ ] Integration with issue tracking (Jira, GitHub)
- [ ] Voice annotations
- [ ] Annotation search and filtering
- [ ] Annotation analytics and insights

## Testing

Run tests for annotation components:

```bash
npm run test:annotations
```

## Contributing

When adding new annotation types:

1. Add type to `src/types/annotations.ts`
2. Create component in `src/components/test-dashboard/`
3. Register in `AnnotationManager.tsx`
4. Add icon to toolbar
5. Update this README

## License

Part of the SIAM project - proprietary software.
