# Visual Regression Testing Tool

Comprehensive visual regression testing system for SIAM with side-by-side screenshot comparison, diff highlighting, and approval workflow.

## 🎯 Features

### Core Functionality

- **Side-by-Side Image Comparison**: Interactive slider to compare baseline and current screenshots
- **Diff Highlighting**: Color-coded visual differences (red=removed, green=added, yellow=changed)
- **Pixel Difference Calculation**: Precise percentage and pixel count of visual changes
- **Approval Workflow**: Approve, reject, or update baseline screenshots
- **Comment Threads**: Collaborate on visual changes with threaded comments
- **Gallery View**: Browse all visual comparisons with filtering and search
- **Multiple View Modes**: Grid and list views for different workflows
- **Export Functionality**: Export comparison data as JSON for reporting

### Advanced Features

- **Keyboard Navigation**: Arrow keys to control comparison slider
- **Touch Support**: Mobile-friendly touch gestures for slider
- **Diff Overlay Mode**: Toggle between side-by-side and overlay comparison
- **Region Detection**: Automatic detection of changed regions
- **Status Tracking**: Pending, approved, rejected, and baseline-updated states
- **History Tracking**: View historical comparisons for a test
- **Batch Operations**: Bulk approve/reject multiple comparisons

## 📂 Project Structure

```
src/
├── components/
│   └── visual-regression/
│       ├── ImageComparisonSlider.tsx    # Side-by-side comparison with slider
│       ├── VisualRegressionComparison.tsx # Complete comparison UI
│       ├── VisualRegressionGallery.tsx   # Gallery view of all comparisons
│       └── index.ts                      # Exports
├── services/
│   └── visualRegressionService.ts        # API client service
└── types/
    └── visual-regression.ts              # TypeScript definitions

app/
├── api/
│   └── visual-regression/
│       ├── route.ts                      # Main API endpoint
│       └── comparison/
│           └── [id]/
│               ├── route.ts              # Get/delete comparison
│               ├── approve/route.ts      # Approve comparison
│               ├── reject/route.ts       # Reject comparison
│               ├── comment/route.ts      # Add comment
│               └── update-baseline/route.ts # Update baseline
└── visual-regression-demo/
    └── page.tsx                          # Demo page
```

## 🚀 Quick Start

### 1. View Demo

Visit the demo page to see the tool in action:

```
http://localhost:3000/visual-regression-demo
```

### 2. Integration with Test Results

The visual regression tool is integrated into the Test Dashboard:

```typescript
import { TestResultsViewer } from "@/components/test-dashboard/TestResultsViewer";

// The viewer automatically displays visual regression comparisons
// when a test result includes visualComparison data
<TestResultsViewer />
```

### 3. Using Components Directly

```typescript
import {
  VisualRegressionComparison,
  VisualRegressionGallery,
  ImageComparisonSlider,
} from "@/components/visual-regression";
import { visualRegressionService } from "@/services/visualRegressionService";

// Gallery view
<VisualRegressionGallery
  testResult={testResult}
  onSelectComparison={(comparison) => console.log(comparison)}
  onRefresh={async () => await fetchResults()}
  onExport={() => exportData()}
/>

// Single comparison
<VisualRegressionComparison
  comparison={comparison}
  onApprove={async (id, comment) => {
    await visualRegressionService.approveComparison(id, comment);
  }}
  onReject={async (id, reason) => {
    await visualRegressionService.rejectComparison(id, reason);
  }}
  onUpdateBaseline={async (id) => {
    await visualRegressionService.updateBaseline(id);
  }}
  onAddComment={async (id, comment) => {
    await visualRegressionService.addComment(id, comment);
  }}
/>

// Image slider only
<ImageComparisonSlider
  baselineUrl="/screenshots/baseline.png"
  currentUrl="/screenshots/current.png"
  diffUrl="/screenshots/diff.png"
  pixelDifference={2.5}
  width={1920}
  height={1080}
/>
```

## 🔧 API Reference

### Visual Regression Service

```typescript
import { visualRegressionService } from "@/services/visualRegressionService";

// Get test comparisons
const testResult = await visualRegressionService.getTestComparisons(testId);

// Get single comparison
const comparison = await visualRegressionService.getComparison(comparisonId);

// Approve comparison
const updated = await visualRegressionService.approveComparison(comparisonId, "Looks good!");

// Reject comparison
const rejected = await visualRegressionService.rejectComparison(
  comparisonId,
  "Button spacing is off"
);

// Update baseline
const baselineUpdated = await visualRegressionService.updateBaseline(comparisonId);

// Add comment
const commented = await visualRegressionService.addComment(
  comparisonId,
  "Check the header color",
  { x: 100, y: 50 } // Optional coordinates
);

// Generate diff
const diffData = await visualRegressionService.generateDiff(baselineUrl, currentUrl);

// Upload screenshot
const uploadedScreenshot = await visualRegressionService.uploadScreenshot(file, {
  testId: "test-123",
  testName: "Login Page",
  type: "baseline",
});

// Batch operations
const approved = await visualRegressionService.batchApprove(
  ["comp-1", "comp-2", "comp-3"],
  "All approved"
);

// Get history
const history = await visualRegressionService.getComparisonHistory("Login Page Test", 10);

// Export
const blob = await visualRegressionService.exportComparisons(testId);

// Statistics
const stats = await visualRegressionService.getStatistics();
```

### REST API Endpoints

#### Get Test Comparisons

```http
GET /api/visual-regression/test/:testId
```

Returns all visual comparisons for a test.

#### Get Single Comparison

```http
GET /api/visual-regression/comparison/:id
```

Returns a specific comparison.

#### Approve Comparison

```http
POST /api/visual-regression/comparison/:id/approve
Content-Type: application/json

{
  "comment": "Optional approval comment",
  "approvedBy": "user@example.com",
  "approvedAt": "2025-10-22T00:00:00Z"
}
```

#### Reject Comparison

```http
POST /api/visual-regression/comparison/:id/reject
Content-Type: application/json

{
  "reason": "Required rejection reason",
  "rejectedBy": "user@example.com",
  "rejectedAt": "2025-10-22T00:00:00Z"
}
```

#### Update Baseline

```http
POST /api/visual-regression/comparison/:id/update-baseline
Content-Type: application/json

{
  "updatedBy": "user@example.com",
  "updatedAt": "2025-10-22T00:00:00Z"
}
```

#### Add Comment

```http
POST /api/visual-regression/comparison/:id/comment
Content-Type: application/json

{
  "comment": "Comment text",
  "author": "user@example.com",
  "coordinates": { "x": 100, "y": 200 },
  "createdAt": "2025-10-22T00:00:00Z"
}
```

## 📊 Data Types

### VisualRegressionComparison

```typescript
interface VisualRegressionComparison {
  id: string;
  testResultId: string;
  testName: string;
  baseline: ScreenshotData;
  current: ScreenshotData;
  diff?: DiffData;
  status: ComparisonStatus; // "pending" | "approved" | "rejected" | "baseline-updated"
  approvedBy?: string;
  approvedAt?: Date;
  comments: ComparisonComment[];
  metadata?: {
    browser?: string;
    viewport?: { width: number; height: number };
    timestamp: Date;
  };
}
```

### ScreenshotData

```typescript
interface ScreenshotData {
  url: string;
  width: number;
  height: number;
  capturedAt: Date;
  checksum?: string;
}
```

### DiffData

```typescript
interface DiffData {
  diffImageUrl: string;
  pixelDifference: number; // Percentage 0-100
  pixelCount: number;
  totalPixels: number;
  regions: DiffRegion[];
}
```

### DiffRegion

```typescript
interface DiffRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "added" | "removed" | "changed";
}
```

## 🎨 Customization

### Styling

All components use Tailwind CSS and shadcn/ui components. Customize by:

1. Updating the `cn()` utility class names
2. Modifying component props
3. Overriding CSS variables in your theme

### Custom Diff Colors

The diff overlay uses standard colors:

- **Red**: Removed elements
- **Green**: Added elements
- **Yellow**: Changed elements

Modify in `ImageComparisonSlider.tsx` if needed.

## 🧪 Testing Integration

### Playwright Integration

```typescript
import { test, expect } from "@playwright/test";

test("capture visual regression screenshots", async ({ page }) => {
  await page.goto("/login");

  // Capture baseline (first run)
  await page.screenshot({
    path: "screenshots/baseline/login.png",
    fullPage: true,
  });

  // Capture current (subsequent runs)
  await page.screenshot({
    path: "screenshots/current/login.png",
    fullPage: true,
  });

  // Compare using Playwright's built-in visual comparison
  await expect(page).toHaveScreenshot("login.png", {
    maxDiffPixels: 100,
  });
});
```

### Automated Comparison

```typescript
import { visualRegressionService } from "@/services/visualRegressionService";

// After Playwright captures screenshots
const comparison = await visualRegressionService.generateDiff(
  "screenshots/baseline/login.png",
  "screenshots/current/login.png"
);

if (comparison.pixelDifference > 2.0) {
  console.log("Visual regression detected!");
  // Create comparison record for review
}
```

## 🗄️ Database Schema (TODO)

The following tables should be added to Supabase:

### visual_regression_comparisons

```sql
CREATE TABLE visual_regression_comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_result_id UUID REFERENCES test_results(id),
  test_name TEXT NOT NULL,
  baseline_url TEXT NOT NULL,
  baseline_width INTEGER NOT NULL,
  baseline_height INTEGER NOT NULL,
  baseline_captured_at TIMESTAMP NOT NULL,
  current_url TEXT NOT NULL,
  current_width INTEGER NOT NULL,
  current_height INTEGER NOT NULL,
  current_captured_at TIMESTAMP NOT NULL,
  diff_url TEXT,
  pixel_difference DECIMAL(5,2),
  pixel_count INTEGER,
  total_pixels INTEGER,
  diff_regions JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### visual_regression_comments

```sql
CREATE TABLE visual_regression_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comparison_id UUID REFERENCES visual_regression_comparisons(id),
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  x INTEGER,
  y INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📝 Best Practices

1. **Baseline Management**: Keep baselines in version control or cloud storage
2. **Threshold Setting**: Define acceptable pixel difference thresholds per test
3. **Review Process**: Establish a workflow for approving/rejecting changes
4. **Documentation**: Comment on non-obvious visual changes
5. **Automation**: Auto-approve minor changes below threshold
6. **Cleanup**: Archive old comparisons after approval/rejection
7. **Cross-Browser**: Test visual regression across different browsers
8. **Responsive**: Capture multiple viewport sizes

## 🚧 Future Enhancements

- [ ] Implement server-side diff generation using Sharp or Jimp
- [ ] Add baseline management UI (upload, delete, rollback)
- [ ] Implement batch operations UI
- [ ] Add historical comparison timeline view
- [ ] Integrate with CI/CD for automated visual testing
- [ ] Add Slack/email notifications for pending reviews
- [ ] Implement AI-powered diff analysis
- [ ] Add video comparison support
- [ ] Create browser extension for quick comparisons
- [ ] Add dark mode optimization for diff highlighting

## 📚 Resources

- **Demo**: `/visual-regression-demo`
- **Test Dashboard**: Integrated into Test Results Viewer
- **Playwright Visual Comparison**: https://playwright.dev/docs/test-snapshots
- **Image Diff Libraries**: pixelmatch, looks-same, resemblejs

## 🐛 Troubleshooting

### Images Not Loading

Check that screenshot URLs are accessible and CORS is configured correctly.

### Slider Not Working

Ensure the container has proper dimensions and the images are loaded.

### Diff Not Showing

Verify that the diff image URL is provided and the image exists.

### API Errors

Check browser console and network tab for detailed error messages.

## 📞 Support

For issues or questions:

1. Check this documentation
2. Review the demo page implementation
3. Inspect component source code
4. Check API endpoint responses
5. File an issue in the project repository

---

**Last Updated**: October 22, 2025
**Version**: 1.0.0
**Author**: SIAM Development Team
