# Session Playback Viewer

A comprehensive session playback and replay component for visualizing test execution with interactive annotations, overlays, and video export capabilities.

## Features

### Core Functionality

- **Interactive Timeline**: Navigate through session steps with visual indicators
- **Playback Controls**: Play/pause, speed adjustment (0.5x, 1x, 2x), step forward/backward
- **Timeline Scrubber**: Jump to any point in the session with a slider
- **Device Switching**: Toggle between desktop and mobile viewport simulations
- **Fullscreen Mode**: View playback in fullscreen for better visibility

### Advanced Features

#### 1. Interaction Overlays

Visual effects that show user interactions during playback:

- **Click Ripple Effect**: Animated ripples at click locations
- **Input Highlights**: Glowing borders around input fields being filled
- **Hover Indicators**: Circular glow for hover interactions

#### 2. Annotation System

Add and display contextual notes during playback:

- **Bug Annotations**: Mark issues found during testing (red indicator)
- **Improvement Suggestions**: Note potential enhancements (blue indicator)
- **General Notes**: Add any observations (yellow indicator)
- **Timeline Integration**: Annotations appear inline with their corresponding steps
- **Author Attribution**: Track who added each annotation

#### 3. Interaction Details Panel

Three-tab panel showing detailed information:

- **Interactions Tab**: List of all interactions for the current step
  - Type (click, input, hover)
  - Position (x, y coordinates)
  - Selector (CSS selector)
  - Value (for input interactions)
  - Duration
- **Console Tab**: Console logs with timestamps and severity levels
- **Network Tab**: Network request details (method, status, duration, size)

#### 4. Export as Video

Convert session playback to video format:

- **Multiple Formats**: WebM (default), MP4 support
- **Quality Settings**: Low (1 Mbps), Medium (2.5 Mbps), High (5 Mbps)
- **FPS Configuration**: Set frames per second (default: 30fps)
- **Progress Tracking**: Real-time export progress with phases:
  - Preparing
  - Recording
  - Encoding
  - Complete
- **Automatic Download**: Video automatically downloads when export completes

## Usage

### Basic Usage

```tsx
import { SessionPlaybackViewer } from "@/components/test-dashboard/SessionPlaybackViewer";

function MyComponent() {
  return <SessionPlaybackViewer />;
}
```

### Integration with Test Dashboard

The component is already integrated into the Test Dashboard:

1. Navigate to the Test Dashboard
2. Click on the "Session Playback" tab
3. Use playback controls to navigate through the session

### Custom Session Data

To use with your own session data, modify the `sessionSteps` array:

```typescript
const sessionSteps: SessionStep[] = [
  {
    id: "1",
    type: "navigation",
    timestamp: 0,
    description: "Navigate to /login",
    url: "https://app.example.com/login",
    status: "success",
    duration: 1234,
    interactions: [],
  },
  // ... more steps
];
```

### Adding Annotations

Annotations are defined separately and linked to steps by `stepId`:

```typescript
const annotations: SessionAnnotation[] = [
  {
    id: "ann-1",
    stepId: "3",
    timestamp: 2000,
    text: "Email validation should be case-insensitive",
    author: "QA Team",
    type: "improvement",
  },
];
```

### Interaction Overlays

Each step can have multiple interaction overlays:

```typescript
interactions: [
  {
    id: "int-1",
    type: "click",
    x: 200,
    y: 150,
    timestamp: 2000,
    duration: 100,
    selector: '[data-testid="email"]',
  },
];
```

## Data Structures

### SessionStep

```typescript
interface SessionStep {
  id: string;
  type: "navigation" | "click" | "input" | "assertion" | "screenshot" | "network";
  timestamp: number;
  description: string;
  selector?: string;
  value?: string;
  url?: string;
  status?: "success" | "failure" | "warning";
  duration?: number;
  screenshot?: string;
  networkData?: {
    method: string;
    url: string;
    status: number;
    duration: number;
    size: string;
  };
  interactions?: InteractionOverlay[];
}
```

### SessionAnnotation

```typescript
interface SessionAnnotation {
  id: string;
  stepId: string;
  timestamp: number;
  text: string;
  author: string;
  type: "note" | "bug" | "improvement";
}
```

### InteractionOverlay

```typescript
interface InteractionOverlay {
  id: string;
  type: "click" | "input" | "hover";
  x: number;
  y: number;
  timestamp: number;
  duration: number;
  selector?: string;
  value?: string;
}
```

## Video Export

### Using the Video Exporter

```typescript
import { SessionVideoExporter } from "@/utils/sessionVideoExporter";

const exporter = new SessionVideoExporter();
const viewportElement = document.getElementById("viewport");

const videoBlob = await exporter.exportSession(
  viewportElement,
  {
    format: "webm",
    quality: "medium",
    fps: 30,
    includeAudio: false,
  },
  (progress) => {
    console.log(`${progress.phase}: ${progress.progress}%`);
  }
);

// Download the video
SessionVideoExporter.downloadVideo(videoBlob, "my-session.webm");
```

### Export Options

```typescript
interface ExportOptions {
  format: "webm" | "mp4"; // Video format
  quality: "low" | "medium" | "high"; // Video quality
  fps: number; // Frames per second
  includeAudio: boolean; // Include audio track (future feature)
}
```

### Estimated File Sizes

- **Low Quality (1 Mbps)**: ~7.5 MB per minute
- **Medium Quality (2.5 Mbps)**: ~18.75 MB per minute
- **High Quality (5 Mbps)**: ~37.5 MB per minute

## Styling

The component uses MAC Design System classes and custom animations:

- **MAC Classes**: `.mac-professional`, `.mac-title`, `.mac-body`, `.mac-card`
- **Custom CSS**: `/src/styles/session-playback.css`
- **Animations**:
  - Ripple effect for clicks
  - Input highlight glow
  - Hover glow effect
  - Timeline pulse
  - Progress shimmer
  - Export progress indicator

### Custom CSS Classes

```css
.session-playback-ripple /* Click ripple animation */
.session-playback-input-highlight /* Input field highlight */
.session-playback-hover-glow /* Hover glow effect */
.session-playback-cursor-trail /* Cursor trail effect */
.session-playback-step-enter /* Step transition */
.session-playback-annotation /* Annotation slide-in */
.session-playback-timeline-active /* Active timeline pulse */
```

## Accessibility

- **Reduced Motion Support**: All animations respect `prefers-reduced-motion` setting
- **Keyboard Navigation**: Fully navigable with keyboard
- **Focus Indicators**: Clear focus states for all interactive elements
- **Screen Reader Support**: Semantic HTML and ARIA labels

## Browser Compatibility

### Supported Browsers

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (WebM format may require conversion)

### Video Export Compatibility

- **WebM**: Supported in Chrome, Firefox, Edge
- **MP4**: Limited browser support for direct recording (may require server-side conversion)

## Performance Considerations

### Optimizations

- Lazy loading of interaction overlays
- Debounced timeline scrubbing
- Efficient animation cleanup
- Memory management for video export

### Recommendations

- **Session Length**: Best performance with sessions under 5 minutes
- **Interaction Count**: Optimize for < 100 interactions per step
- **Video Export**: Use "medium" quality for balance between file size and quality

## Future Enhancements

### Planned Features

1. **Real Browser Recording**: Integration with Playwright/Puppeteer for actual browser capture
2. **Audio Commentary**: Add voice-over during export
3. **Annotation Editing**: Add/edit annotations directly in the UI
4. **Session Comparison**: Side-by-side comparison of multiple sessions
5. **Cloud Storage**: Upload sessions to cloud storage
6. **Collaboration**: Real-time collaborative viewing and annotation
7. **AI Analysis**: Automatic anomaly detection and annotation suggestions

### Integration Points

- **Playwright**: Capture actual test execution
- **Supabase**: Store session data and annotations
- **Cloud Storage**: AWS S3, Google Cloud Storage for video files
- **WebRTC**: Real-time collaborative viewing

## Troubleshooting

### Common Issues

#### Video Export Fails

- **Solution**: Check browser console for errors
- **Fallback**: Try using a different quality setting
- **Note**: Some browsers may not support MediaRecorder API

#### Playback Not Smooth

- **Solution**: Reduce playback speed
- **Check**: System resources (CPU/memory)
- **Optimize**: Reduce number of interaction overlays

#### Fullscreen Not Working

- **Solution**: Ensure user gesture triggered the fullscreen request
- **Check**: Browser permissions for fullscreen
- **Note**: Some embedded contexts may block fullscreen

## Examples

### Example 1: Basic Login Flow

```typescript
const loginSession: SessionStep[] = [
  {
    id: "1",
    type: "navigation",
    timestamp: 0,
    description: "Navigate to login page",
    url: "/login",
    status: "success",
  },
  {
    id: "2",
    type: "input",
    timestamp: 1000,
    description: "Enter email",
    selector: "#email",
    value: "user@example.com",
    status: "success",
    interactions: [
      {
        id: "i1",
        type: "click",
        x: 200,
        y: 150,
        timestamp: 1000,
        duration: 50,
      },
      {
        id: "i2",
        type: "input",
        x: 200,
        y: 150,
        timestamp: 1100,
        duration: 500,
        value: "user@example.com",
      },
    ],
  },
];
```

### Example 2: API Request Flow

```typescript
const apiSession: SessionStep[] = [
  {
    id: "1",
    type: "network",
    timestamp: 0,
    description: "Fetch user data",
    status: "success",
    networkData: {
      method: "GET",
      url: "/api/user/123",
      status: 200,
      duration: 245,
      size: "1.2 KB",
    },
  },
];
```

## Contributing

To contribute enhancements to the Session Playback Viewer:

1. Follow the MAC Design System guidelines
2. Add tests for new features
3. Update this README with new functionality
4. Ensure accessibility compliance
5. Test across multiple browsers

## License

Part of the SIAM project. See project LICENSE for details.

## Support

For issues or questions:

- Check the troubleshooting section
- Review the examples
- Open an issue in the project repository
- Contact the SIAM development team

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Author**: SIAM Development Team
