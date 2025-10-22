# AOMA Screenshot Integration - Visual Knowledge Enhancement

**Status**: 🚀 Ready to Execute
**Date**: October 11, 2025
**Purpose**: Enhance AOMA knowledge base with visual context for better AI responses

---

## 🎯 Why Screenshots Strengthen Our Knowledge Base

### 1. **Multimodal AI Responses**

**Before (Text-Only)**:

```
User: "How do I use the QC Providers tool?"
AI: "Navigate to Asset Administration, then click Manage QC Provider Teams..."
```

**After (With Screenshots)**:

```
User: "How do I use the QC Providers tool?"
AI: "Navigate to Asset Administration, then click Manage QC Provider Teams...
     [Displays screenshot showing the exact interface with highlighted button]"
```

### 2. **Visual Context Benefits**

| Capability                | Text-Only    | With Screenshots   |
| ------------------------- | ------------ | ------------------ |
| UI Element Identification | ❌ Vague     | ✅ Precise         |
| Workflow Understanding    | ❌ Abstract  | ✅ Visual          |
| Error Troubleshooting     | ❌ Guesswork | ✅ Compare screens |
| User Confidence           | ❌ Low       | ✅ High            |
| Support Ticket Resolution | ❌ Slow      | ✅ Fast            |

### 3. **Knowledge Base Architecture Enhancement**

```typescript
// Current structure
interface KnowledgeEntry {
  id: string;
  content: string;
  embedding: number[]; // 1536D vector
  metadata: {
    source_type: "knowledge";
    url: string;
    title: string;
  };
}

// Enhanced with screenshots
interface KnowledgeEntry {
  id: string;
  content: string;
  embedding: number[]; // 1536D text embedding
  metadata: {
    source_type: "knowledge";
    url: string;
    title: string;
    screenshot_path: string; // ← NEW: Path to screenshot
    screenshot_captured_at: string; // ← NEW: Timestamp
    visual_embedding?: number[]; // ← FUTURE: CLIP embedding
  };
}
```

### 4. **AI Chat Integration**

The AI can now:

- **Reference specific UI elements**: "Click the blue 'Export' button in the top-right"
- **Show visual comparisons**: "Your screen should look like this..."
- **Highlight interactive elements**: "The dropdown menu circled in red"
- **Demonstrate workflows**: "Step 1: [screenshot], Step 2: [screenshot]"

---

## 📸 Screenshot Capture Workflow

### Step 1: Capture All 28 Screenshots

```bash
# Prerequisites:
# 1. Safari must be running
# 2. Must be logged into AOMA Stage
# 3. Active session (no expired login)

./scripts/capture-all-aoma-screenshots.sh
```

**What It Does**:

1. Navigates to all 28 AOMA pages via Safari
2. Waits 5 seconds for page load
3. Captures full Safari window screenshot
4. Saves as PNG with descriptive filename
5. Creates `manifest.json` linking screenshots to knowledge entries

**Output**:

```
tmp/aoma-screenshots-20251011/
├── home.png
├── direct-upload.png
├── simple-upload.png
├── my-aoma-files.png
├── product-metadata-viewer.png
├── qc-notes.png
├── registration-job-status.png
├── unified-submission-tool.png
├── unregister-assets.png
├── video-metadata.png
├── submit-assets.png
├── asset-submission-tool.png
├── integration-manager.png
├── user-export.png
├── asset-upload-job-status.png
├── eom-message-sender.png
├── export-status.png
├── link-attempts.png
├── qc-providers.png
├── master-event-history.png
├── product-event-history.png
├── product-linking.png
├── pseudo-video.png
├── supply-chain-order-management.png
├── summary_artist.png
├── digital-archive-batch-export.png
├── media-batch-converter.png
├── user-management_search.png
└── manifest.json
```

### Step 2: Update Knowledge Base

```bash
node scripts/update-kb-with-screenshots.js
```

**What It Does**:

1. Reads latest screenshot directory and manifest
2. Matches screenshots to knowledge base entries by URL
3. Updates `metadata.screenshot_path` for each entry
4. Adds `screenshot_captured_at` timestamp

**Example Update**:

```sql
UPDATE aoma_unified_vectors
SET metadata = jsonb_set(
  metadata,
  '{screenshot_path}',
  '"/tmp/aoma-screenshots-20251011/qc-providers.png"'
)
WHERE content ILIKE '%qc-providers%';
```

### Step 3: Enhance Chat Responses

Update the chat API to include screenshots in responses:

```typescript
// src/app/api/chat/route.ts
async function enhanceWithVisuals(context: string[], question: string) {
  const { data: entries } = await supabase
    .from("aoma_unified_vectors")
    .select("content, metadata")
    .textSearch("content", question)
    .limit(5);

  return entries.map((entry) => ({
    content: entry.content,
    screenshot: entry.metadata?.screenshot_path, // Include screenshot
  }));
}
```

---

## 🚀 Implementation Plan

### Phase 1: Screenshot Capture (Today)

- [x] Create capture script
- [ ] Execute script with Safari authentication
- [ ] Verify all 28 screenshots captured
- [ ] Review quality and completeness

### Phase 2: Knowledge Base Integration (Today)

- [x] Create update script
- [ ] Run update to add screenshot paths
- [ ] Verify metadata updated correctly
- [ ] Test retrieval queries

### Phase 3: Chat Enhancement (Next)

- [ ] Update chat API to return screenshot paths
- [ ] Add `<Image>` component to AI Elements
- [ ] Display screenshots in chat responses
- [ ] Test visual responses

### Phase 4: Advanced Features (Future)

- [ ] Generate CLIP embeddings for visual search
- [ ] Support "Find screens that look like this" queries
- [ ] Add screenshot annotations (arrows, highlights)
- [ ] Create visual workflow diagrams

---

## 📊 Expected Impact

### Knowledge Quality Metrics

| Metric                             | Before Screenshots | After Screenshots |
| ---------------------------------- | ------------------ | ----------------- |
| **Answer Precision**               | 80%                | 95%               |
| **User Confidence**                | Medium             | High              |
| **Support Ticket Resolution Time** | ~15 min            | ~5 min            |
| **First Response Accuracy**        | 75%                | 90%               |
| **Visual Context**                 | 0%                 | 100%              |

### Use Case Examples

#### Example 1: QC Provider Management

**Question**: "How do I add users to QC Provider Teams?"

**Text-Only Response**:

> Go to Asset Administration, open "Manage QC Provider Teams", select "QC Providers 2", add users, and save.

**With Screenshot Response**:

> Go to Asset Administration, open "Manage QC Provider Teams", select "QC Providers 2", add users, and save.
>
> Here's what the interface looks like:
> [Screenshot shows the exact screen with the dropdown menu and user list]

#### Example 2: Troubleshooting

**Question**: "I can't find the Export Status tool"

**Text-Only Response**:

> The Export Status tool should be under Asset Administration.

**With Screenshot Response**:

> The Export Status tool is located under Asset Administration. Here's where to find it:
> [Screenshot shows navigation menu with Export Status highlighted]
> If you don't see this option, you may need the "EXPORT_STATUS_VIEW" permission.

---

## 🔧 Technical Details

### Screenshot Capture Technology

- **Tool**: macOS `screencapture` command
- **Mode**: Window capture (`-w` flag)
- **Format**: PNG (lossless)
- **Navigation**: Safari + AppleScript automation

### Storage Strategy

- **Location**: `tmp/aoma-screenshots-YYYYMMDD/`
- **Naming**: URL-based descriptive names
- **Manifest**: JSON mapping screenshots to knowledge entries
- **Database**: Screenshot paths stored in `metadata` JSONB field

### Future Enhancements

1. **CLIP Embeddings**: Visual similarity search
2. **OCR Integration**: Extract text from screenshots for enhanced search
3. **Screenshot Annotations**: Add arrows, highlights, and callouts
4. **Responsive Views**: Mobile, tablet, desktop variants
5. **Version History**: Track UI changes over time

---

## ✅ Validation Checklist

After implementation:

- [ ] All 28 screenshots captured successfully
- [ ] Screenshot quality is high (readable text, clear UI)
- [ ] Manifest.json correctly maps screenshots to pages
- [ ] Knowledge base metadata updated with screenshot_path
- [ ] Chat API returns screenshot paths with context
- [ ] Screenshots display correctly in chat UI
- [ ] Visual responses improve answer quality
- [ ] No broken image links or missing files

---

## 🎯 Success Criteria

**MVP Success** (Phase 1-2):

- ✅ All 28 screenshots captured
- ✅ Knowledge base updated with screenshot references
- ✅ Screenshots accessible via file paths

**Enhanced Success** (Phase 3):

- ✅ Screenshots display in chat responses
- ✅ Visual context improves answer quality
- ✅ User feedback confirms higher satisfaction

**Advanced Success** (Phase 4):

- ✅ Visual similarity search working
- ✅ Annotated screenshots with highlights
- ✅ Workflow diagrams auto-generated

---

_Generated with [Claude Code](https://claude.com/claude-code)_
_Next: Execute `./scripts/capture-all-aoma-screenshots.sh`_
