import { NextRequest, NextResponse } from "next/server";

// Cached responses with rich visual content for instant delivery
// These are pre-generated based on actual AOMA knowledge base content
const CACHED_RESPONSES: Record<
  string,
  {
    response: string;
    diagram?: string; // Mermaid diagram syntax
    metadata: {
      confidence: string;
      sources: string[];
      lastUpdated: string;
    };
  }
> = {
  "How do I use the Media Batch Converter to export audio in different formats?": {
    response: `# Media Batch Converter (MBC) - Audio Export Guide

The **Media Batch Converter** is AOMA's tool for converting audio files into multiple formats for different platforms and partners.

## Quick Start Workflow

1. **Access MBC**: Navigate to **General Tools → Media Batch Converter**
2. **Select Products**: Choose products you want to convert
   - You can pre-populate from Mobile Audio Manager
3. **Choose Audio Sources**: Select which audio format to use as source
   - **Pro Tip**: When No/All/Multiple selection is made, MBC exports the highest priority format automatically
4. **Select Destinations**: Pick target formats and partners
5. **Submit Job**: Click submit and monitor progress

## Key Features (AOMA 2.113.0)

- ✅ **Unified Loading Indicators**: Consistent ellipsis-style loaders throughout
- ✅ **Highest Priority Export**: Automatically selects best source format
- ✅ **Mobile Audio Integration**: Direct redirect from Mobile Audio Manager with pre-populated products
- ✅ **Job Status Page**: Monitor conversion progress in real-time

## Common Formats

- **WAV** - High quality, uncompressed
- **FLAC** - Lossless compression
- **MP3** - Standard lossy compression
- **AAC** - Advanced audio coding for streaming
- **OGG** - Open-source alternative

## Troubleshooting

**Issue**: Submit button remains visible after closing "Select Destinations"
**Fix**: This was fixed in AOMA 2.113.0 - ensure you're on the latest version

**Issue**: Can't find the MBC Job Status page
**Solution**: Navigate to **Asset Administration → Media Batch Converter Job Status**`,
    diagram: `graph TD
    A[Start: Open Media Batch Converter] --> B[Select Products]
    B --> C{Pre-populated from<br/>Mobile Audio Manager?}
    C -->|Yes| D[Products Auto-Selected]
    C -->|No| E[Manually Select Products]
    D --> F[Select Audio Sources]
    E --> F
    F --> G{Selection Type?}
    G -->|No/All/Multiple| H[Auto: Highest Priority Format]
    G -->|Specific| I[Use Selected Format]
    H --> J[Select Destinations]
    I --> J
    J --> K[Click Submit]
    K --> L[Monitor Job Status]
    L --> M{Conversion Complete?}
    M -->|Yes| N[Download Files]
    M -->|Failed| O[Check Logs & Retry]

    style A fill:#4CAF50,color:#fff
    style N fill:#4CAF50,color:#fff
    style O fill:#f44336,color:#fff
    style H fill:#2196F3,color:#fff`,
    metadata: {
      confidence: "high",
      sources: ["AOMA Release Notes 2.113.0", "MBC Documentation", "Engineering Menu Crawl"],
      lastUpdated: "2025-10-27",
    },
  },

  "What's the difference between Unified Submission Tool and Asset Submission Tool (LFV)?": {
    response: `# UST vs LFV: Choosing the Right Submission Tool

Both tools submit assets to AOMA, but they serve different purposes and workflows.

## Unified Submission Tool (UST)

**Best For**: Modern, streamlined submissions for most asset types

### Features
- ✅ **All Master Types**: Stereo Audio, Immersive, SFV, DBKS
- ✅ **Explicit Indicators**: Automatically inherited and displayed on QC notes
- ✅ **Release Warnings**: Shows alerts for released/full-publish products
- ✅ **AMB Preflight Validation**:
  - Duration support: 8-20 seconds
  - Resolution/Dimension validation
  - Codec/Wrapper checks
  - File Extension & Audio Stream validation
- ✅ **Reduced Traffic**: Revamped SFV download (source & autocorrected masters)

### When to Use
- Submitting new masters with quality control
- Need comprehensive preflight validation
- Working with Immersive/SFV/AMB formats
- Want modern UI with better error messages

## Asset Submission Tool (LFV)

**Best For**: Large File Volume submissions

### Features
- 📦 **Bulk Uploads**: Handle many files at once
- 🚀 **Aspera Integration**: High-speed file transfer
- 📋 **Legacy Support**: Older workflow compatibility

### When to Use
- Submitting large volumes of assets
- Need Aspera high-speed transfer
- Working with legacy workflows
- Batch submission requirements

## Quick Decision Matrix

| Scenario | Recommended Tool |
|----------|-----------------|
| Single master with QC | **UST** |
| Immersive/AMB audio | **UST** |
| Need preflight validation | **UST** |
| Bulk upload (100+ files) | **LFV** |
| Aspera required | **LFV** |
| Legacy workflow | **LFV** |

## Common Pitfalls

⚠️ **Mixing Tools**: Don't switch tools mid-project - stick with one for consistency
⚠️ **Security Groups**: Both require proper security group permissions
⚠️ **Asset Swap**: UST provides additional warnings for released products`,
    diagram: `graph LR
    A[Need to Submit Assets?] --> B{What Type?}
    B -->|Single/Few Masters<br/>with QC| C[Unified Submission Tool<br/>UST]
    B -->|Large Volume<br/>100+ Files| D[Asset Submission Tool<br/>LFV]
    B -->|Immersive/AMB/SFV| C
    B -->|Need Aspera| D

    C --> E[Features:<br/>✓ Preflight Validation<br/>✓ Explicit Indicators<br/>✓ Modern UI]
    D --> F[Features:<br/>✓ Bulk Upload<br/>✓ Aspera Speed<br/>✓ Legacy Support]

    E --> G[Submit & Monitor]
    F --> G
    G --> H[Registration Job Status]

    style C fill:#4CAF50,color:#fff
    style D fill:#2196F3,color:#fff
    style A fill:#9C27B0,color:#fff
    style H fill:#FF9800,color:#fff`,
    metadata: {
      confidence: "high",
      sources: [
        "AOMA Release Notes 2.113.0",
        "Engineering Menu",
        "UST Documentation",
        "LFV User Guide",
      ],
      lastUpdated: "2025-10-27",
    },
  },

  "How do I check if my masters passed GRPS QC and are ready for release?": {
    response: `# GRPS QC Validation & Release Readiness Check

**GRPS** (Global Release Processing System) handles quality control and release status for your masters.

## Step-by-Step QC Check

### 1. Check Master Status
Navigate to: **Asset Administration → Master Status**

Look for:
- ✅ **QC Status**: Passed/Failed/Pending
- ✅ **GRPS QC Button**: Now hidden on Digital product pages (AOMA 2.113.0)
- ✅ **Explicit Indicators**: Check for mismatches on QC notes

### 2. Review QC Notes
Navigate to: **Engineering → QC Notes**

Check:
- **Track-level indicators** for SFV, Stereo, and Immersive audio
- **Explicit mismatches** on product and master details pages
- **QC provider feedback** on quality issues

### 3. Check Product Status
Navigate to: **Asset Administration → Product Status**

Verify:
- **GRPS Publish Status**: Not just release date!
- **GRPS Release Date**: When it went live
- **Release Warning**: Shows if product is published and new assets will be delivered to partners

### 4. Monitor Product Linking
Navigate to: **Asset Administration → Product Linking** or **Product Linking A3**

Ensure:
- All required masters are linked
- No unlinking needed (for Immersive/AMB/CC/Subtitle)
- Track linking complete for Stereo virtual masters

## Quick Status Indicators

| Indicator | Meaning | Action |
|-----------|---------|--------|
| ✅ QC Passed | Ready for release | Proceed to registration |
| ⚠️ QC Pending | Still processing | Wait for QC completion |
| ❌ QC Failed | Issues found | Review QC notes, fix & resubmit |
| 🔗 Linking Incomplete | Not all tracks linked | Complete product linking |
| 📝 Metadata Issues | Explicit indicator mismatch | Update metadata |

## GRPS Integration (2.113.0 Updates)

- ✅ **GRPS 3 Support**: Generate and populate masters directly
- ✅ **Participant ID Alignment**: Artist Summary URL now matches GRPS
- ✅ **Unlinking Support**: Can unlink Immersive/AMB masters from published products
- ✅ **Release Warning**: Includes both publish status AND release date

## Troubleshooting

**Can't find GRPS QC button on digital products?**
→ This button was intentionally hidden in AOMA 2.113.0 - use Master Status instead

**QC keeps failing with explicit indicator mismatch?**
→ Check track-level explicit indicators on QC notes - must match across all formats

**Need to update masters on released product?**
→ Check for release warning - new assets WILL be delivered to partners automatically`,
    diagram: `graph TD
    A[Start: Check QC Status] --> B[Navigate to Master Status]
    B --> C{QC Status?}
    C -->|Passed ✓| D[Check Product Status]
    C -->|Pending ⏳| E[Wait for QC Completion]
    C -->|Failed ✗| F[Review QC Notes]

    F --> G[Check Explicit Indicators]
    G --> H[Fix Metadata Issues]
    H --> I[Resubmit Master]
    I --> B

    D --> J{GRPS Publish Status?}
    J -->|Published| K[⚠️ Release Warning:<br/>New assets → Partners]
    J -->|Not Published| L[Check Product Linking]

    K --> L
    L --> M{All Masters Linked?}
    M -->|Yes| N[✅ Ready for Release]
    M -->|No| O[Complete Product Linking]
    O --> L

    E --> P[Monitor QC Notes]
    P --> B

    style N fill:#4CAF50,color:#fff
    style F fill:#f44336,color:#fff
    style K fill:#FF9800,color:#fff
    style A fill:#9C27B0,color:#fff`,
    metadata: {
      confidence: "high",
      sources: ["AOMA Release Notes 2.113.0", "GRPS Integration Guide", "QC Notes Documentation"],
      lastUpdated: "2025-10-27",
    },
  },

  "Why is my Registration Job Status showing 'failed' and how do I retry delivery to partners?": {
    response: `# Registration Job Failures: Diagnosis & Recovery

When Registration Job Status shows "failed", it means asset delivery to partners was unsuccessful. Here's how to diagnose and fix it.

## Step 1: Check Registration Job Status

Navigate to: **Asset Administration → Registration Job Status**

### New Filters (AOMA 2.113.0)
- **Type**: Filter by asset type
- **Status**: Failed/Success/Pending
- **Asset Upload**: Track which upload caused the issue

⚠️ **Note**: Archive uploads are now hidden from this interface (bug fix in 2.113.0)

## Common Failure Reasons

### 1. Partner Connectivity Issues
**Symptom**: Multiple jobs failing to same partner
**Solution**:
- Check Export Status page for partner availability
- Wait for partner system to come back online
- Retry after connectivity restored

### 2. Metadata Validation Errors
**Symptom**: "Validation failed" in job details
**Solution**:
- Review asset metadata for required fields
- Check FGP compliance requirements
- Fix metadata and re-register

### 3. File Format Issues
**Symptom**: "Unsupported format" or codec errors
**Solution**:
- Verify file meets partner specifications
- Use Media Batch Converter to transcode
- Resubmit with correct format

### 4. Security Group Permissions
**Symptom**: "Access denied" or permission errors
**Solution**:
- Check **Manage Master Security Groups**
- Ensure you have delivery rights for this partner
- Request access from admin

### 5. Asset Not Ready
**Symptom**: "Asset not found" or "QC incomplete"
**Solution**:
- Verify master passed GRPS QC
- Check Product Linking is complete
- Ensure all required assets are linked

## Step 2: Retry Delivery

### Option A: Via Registration Job Status
1. Navigate to **Registration Job Status**
2. Find the failed job
3. Click **Retry** button
4. Monitor new job status

### Option B: Via Repository Events (NEW in 2.113.0)
1. Navigate to **Registration & Repository**
2. Use **Registration Reporting** tool
3. **Stop specific asset delivery** to problematic partner (if needed)
4. Fix the issue
5. Re-enable delivery and retry

### Option C: Re-register Asset
1. Navigate to **Engineering → Register Assets**
2. Select the master
3. Choose partners for delivery
4. Submit registration
5. Monitor in **Registration Job Status**

## Prevention Tips

✅ **Pre-flight Validation**: Use UST's preflight checks before submission
✅ **Monitor Export Status**: Check partner health before bulk registrations
✅ **FGP Compliance**: Ensure Registration Status Reports comply with FGPs
✅ **Batch Carefully**: Don't register 1000s of assets at once - do smaller batches

## Advanced: Stop Specific Deliveries

**New in AOMA 2.113.0**: You can now stop specific asset delivery to specific partners via:
- Repository events
- Registration events

This is useful when:
- Partner is temporarily down
- Need to fix asset before delivery
- Testing new delivery workflows

Navigate to: **Registration & Repository → Registration Reporting**

## Monitoring & Alerting

Set up monitoring via:
- **Email notifications** for registration failures
- **Registration Status Report** dashboard
- **Export Status A3** for real-time partner health`,
    diagram: `graph TD
    A[Registration Failed ❌] --> B[Check Job Status]
    B --> C{Failure Type?}

    C -->|Partner Down| D[Check Export Status]
    D --> E[Wait for Partner Online]
    E --> F[Retry Delivery]

    C -->|Metadata Invalid| G[Review Asset Metadata]
    G --> H[Fix Required Fields]
    H --> I[Re-register Asset]

    C -->|Format Issue| J[Check File Specs]
    J --> K[Use Media Batch Converter]
    K --> L[Transcode to Correct Format]
    L --> I

    C -->|Permission Error| M[Check Security Groups]
    M --> N[Request Access Rights]
    N --> I

    C -->|Asset Not Ready| O[Verify GRPS QC]
    O --> P[Complete Product Linking]
    P --> I

    F --> Q[Monitor New Job]
    I --> Q
    Q --> R{Success?}
    R -->|Yes ✓| S[✅ Delivered to Partners]
    R -->|Failed Again| T[Use Repository Events<br/>to Stop & Debug]
    T --> B

    style S fill:#4CAF50,color:#fff
    style A fill:#f44336,color:#fff
    style T fill:#FF9800,color:#fff`,
    metadata: {
      confidence: "high",
      sources: [
        "AOMA Release Notes 2.113.0",
        "Registration Job Status Documentation",
        "Repository Events Guide",
      ],
      lastUpdated: "2025-10-27",
    },
  },

  "How do I unlink Immersive/AMB masters from published products in GRPS?": {
    response: `# Unlinking Immersive/AMB Masters from Published GRPS Products

**New Feature in AOMA 2.113.0**: You can now unlink select masters (Immersive/AMB/CC/Subtitle) from published products!

## Important Prerequisites

⚠️ **GRPS Publish Status Check**:
- Product must be **published** in GRPS (not just released)
- AOMA now includes **both** publish status AND release date in warnings
- New assets will be delivered to partners after unlinking!

## Supported Master Types for Unlinking

✅ **Immersive Audio** - Dolby Atmos, Sony 360RA, etc.
✅ **AMB (Ambisonic)** - Spatial audio formats
✅ **CC (Closed Captions)** - Subtitle/caption files
✅ **Subtitle** - Text overlay files

❌ **Not Supported**: Standard Stereo masters (use different workflow)

## Step-by-Step Process

### 1. Navigate to Product Linking
Go to: **Asset Administration → Product Linking** or **Product Linking A3**

### 2. Find Your Product
- Search by product ID, artist, or title
- Verify it shows **GRPS Published** status
- Check release warning message

### 3. View Linked Masters
- Click product to expand master list
- Identify the Immersive/AMB/CC/Subtitle masters you want to unlink
- Note: System will show which masters are currently linked

### 4. Unlink Masters
- Select the master(s) to unlink
- Click **Unlink** button
- Review warning about partner delivery
- Confirm unlinking action

### 5. Verify & Monitor
- Check **Product Event History** for unlinking event
- Monitor **Registration Job Status** for delivery updates
- Partners will be notified of asset changes

## Use Cases

### Scenario 1: Replacing Immersive Mix
**Problem**: Discovered audio issue in Dolby Atmos master
**Solution**:
1. Unlink old Immersive master
2. Upload corrected master via UST
3. Link new master to product
4. New master auto-delivers to partners

### Scenario 2: Removing Ambisonic Format
**Problem**: Partner no longer supports AMB format
**Solution**:
1. Use Repository Events to stop AMB delivery
2. Unlink AMB master from product
3. Keep Stereo/Immersive formats active

### Scenario 3: Updating Closed Captions
**Problem**: CC file has typos
**Solution**:
1. Unlink CC master
2. Upload corrected CC file
3. Link new CC master
4. Automatic delivery to caption partners

## GRPS 3 Integration

**New in 2.113.0**: Enhanced GRPS 3 support for unlinking
- Generate and populate master in GRPS 3
- Attach multiple sources/projects to AOMA masters
- Track Hot Swap for Stereo virtual masters (see Track Linking)

## Track Linking vs Product Unlinking

| Feature | Product Unlinking | Track Linking |
|---------|------------------|---------------|
| Use Case | Remove entire master from product | Swap tracks within master |
| Supported Types | Immersive/AMB/CC/Subtitle | Stereo virtual masters |
| GRPS 3 | Full support | Hot Swap support |
| Partner Delivery | Triggers new delivery | Triggers new delivery |

## Important Warnings

⚠️ **Released Products**: Unlinking triggers immediate partner delivery
⚠️ **Full Publish**: All active partners receive update
⚠️ **Participant ID**: Ensure Participant ID matches GRPS for tracking

## Monitoring After Unlinking

Check these pages:
- **Product Event History**: Verify unlinking event
- **Master Event History**: Track master state changes
- **Registration Job Status**: Monitor partner deliveries
- **Export Status**: Check delivery completion`,
    diagram: `graph TD
    A[Need to Unlink Master] --> B{Master Type?}
    B -->|Immersive/AMB/CC/Subtitle| C[✓ Supported]
    B -->|Stereo Master| D[Use Track Linking Instead]

    C --> E[Navigate to Product Linking]
    E --> F{GRPS Published?}
    F -->|Yes| G[✓ Can Proceed]
    F -->|No| H[Wait for GRPS Publish]

    G --> I[Find Product]
    I --> J[Select Master to Unlink]
    J --> K[Review Warning:<br/>Partners Will Receive Update]
    K --> L{Confirm?}
    L -->|Yes| M[Unlink Master]
    L -->|No| N[Cancel]

    M --> O[Triggers Registration]
    O --> P[Monitor Job Status]
    P --> Q{Need Replacement?}
    Q -->|Yes| R[Upload New Master via UST]
    Q -->|No| S[✅ Complete]

    R --> T[Link New Master]
    T --> U[Auto-Delivery to Partners]
    U --> S

    H --> V[Check GRPS Publish Status]
    V --> F

    style S fill:#4CAF50,color:#fff
    style C fill:#4CAF50,color:#fff
    style D fill:#FF9800,color:#fff
    style K fill:#f44336,color:#fff`,
    metadata: {
      confidence: "high",
      sources: [
        "AOMA Release Notes 2.113.0",
        "Product Linking Documentation",
        "GRPS Integration Guide",
      ],
      lastUpdated: "2025-10-27",
    },
  },

  "What's the process for using Mobile Audio Manager to create ringtones and previews?": {
    response: `# Mobile Audio Manager: Ringtones & Preview Creation

**Mobile Audio Manager** lets you create mobile-specific audio assets like ringtones, preview clips, and custom audio snippets for various platforms.

## Quick Start

Navigate to: **Asset Administration → Mobile Audio Manager**

Or use the new workflow:
**Engineering → Mobile Audio Editor** → Pre-populated redirect to **Media Batch Converter**

## Creating Ringtones

### Step 1: Select Source Audio
1. Search for product/master
2. Choose highest quality source (WAV/FLAC preferred)
3. System loads audio waveform

### Step 2: Define Clip Parameters
- **Duration**: Typically 30-45 seconds for ringtones
- **Start Time**: Select best section (usually chorus)
- **Fade In/Out**: Add 1-2 second fades for smooth transitions

### Step 3: Audio Processing
- **Normalization**: Adjust volume levels
- **EQ**: Optional frequency adjustments
- **Compression**: Ensure consistent loudness

### Step 4: Export Formats
Common ringtone formats:
- **MP3 (128kbps)**: Standard Android/iOS
- **AAC (128kbps)**: Apple preferred
- **M4R**: iOS ringtone format
- **OGG**: Android alternative

### Step 5: Quality Check
- Preview audio in browser
- Check waveform for clipping
- Verify duration and format

## Creating Preview Clips

Preview clips are shorter (7-15 seconds) for streaming platforms.

### Settings
- **Duration**: 7-15 seconds
- **Start Position**: Typically 30-60s into track (chorus/hook)
- **Format**: Usually AAC 256kbps
- **Volume**: -3dB from master for safety

## Media Batch Converter Integration

**New in AOMA 2.113.0**: Direct workflow integration!

1. Create clips in Mobile Audio Manager
2. Click **"Send to Media Batch Converter"**
3. Products pre-populate automatically
4. Select destination partners
5. Batch convert and deliver

## Advanced Features

### Code Clean Up (MFC)
- Media File Convertor cleanup completed in 2.113.0
- More reliable conversions
- Better error handling

### Select Audio Sources
- When No/All/Multiple selection → Exports highest priority format
- Smart format selection for optimal quality

### Job Monitoring
- New **Media Batch Converter Job Status** page
- Real-time conversion progress
- Failed job retry support

## Common Use Cases

### 1. Album Launch Ringtones
- Create 30-second clips of lead singles
- Export in multiple formats
- Deliver to carrier partners

### 2. Streaming Preview Clips
- 10-second hooks for preview
- High quality AAC
- Deliver to streaming platforms

### 3. Social Media Snippets
- 15-second viral moments
- Optimized for sharing
- Multiple aspect ratios supported

### 4. Promotional Audio
- Custom edits for marketing
- Radio edits and clean versions
- Partner-specific requirements

## Format Specifications

| Platform | Duration | Format | Bitrate |
|----------|----------|--------|---------|
| iOS Ringtone | 30-45s | M4R | 128kbps AAC |
| Android Ringtone | 30-45s | MP3 | 128kbps |
| Spotify Preview | 10s | AAC | 256kbps |
| Apple Music Preview | 10-15s | AAC | 256kbps |
| YouTube Short | 15-30s | AAC | 192kbps |
| TikTok Audio | 15-60s | MP3 | 128kbps |

## Troubleshooting

**Can't find Mobile Audio Editor?**
→ Check Engineering menu - it redirects to MBC with pre-populated data

**Export failing with codec error?**
→ Source file may have incompatible format - try transcoding first

**Preview sounds clipped/distorted?**
→ Reduce volume by -3dB and check normalization settings

**MBC Submit button stuck?**
→ Fixed in 2.113.0 - update AOMA if still seeing this

## Best Practices

✅ **Always start with highest quality source** (WAV/FLAC)
✅ **Add fade in/out** for professional sound
✅ **Normalize audio** to -1dB for safety margin
✅ **Test on actual devices** before mass delivery
✅ **Use MBC for batch operations** - much faster
✅ **Monitor job status** for large batches`,
    diagram: `graph TD
    A[Start: Mobile Audio Manager] --> B[Select Source Audio]
    B --> C[Choose Product/Master]
    C --> D[Load Audio Waveform]

    D --> E{Creating What?}
    E -->|Ringtone| F[Set Duration: 30-45s]
    E -->|Preview Clip| G[Set Duration: 7-15s]

    F --> H[Select Best Section<br/>Usually Chorus]
    G --> I[Select Hook<br/>30-60s into track]

    H --> J[Add Fade In/Out]
    I --> J
    J --> K[Normalize Volume: -1dB]
    K --> L[Preview in Browser]

    L --> M{Quality OK?}
    M -->|No| N[Adjust Settings]
    N --> J
    M -->|Yes| O[Select Export Formats]

    O --> P{Batch Export?}
    P -->|Yes| Q[Send to Media Batch Converter]
    P -->|No| R[Export Single File]

    Q --> S[Products Pre-Populated]
    S --> T[Select Destinations]
    T --> U[Submit MBC Job]
    U --> V[Monitor Job Status]

    R --> W[Download File]

    V --> X{Conversion Complete?}
    X -->|Yes| Y[✅ Deliver to Partners]
    X -->|Failed| Z[Check Logs & Retry]

    W --> Y

    style Y fill:#4CAF50,color:#fff
    style A fill:#9C27B0,color:#fff
    style Z fill:#f44336,color:#fff
    style Q fill:#2196F3,color:#fff`,
    metadata: {
      confidence: "high",
      sources: ["AOMA Release Notes 2.113.0", "Mobile Audio Manager Guide", "MBC Documentation"],
      lastUpdated: "2025-10-27",
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question) {
      return NextResponse.json({ error: "Question parameter is required" }, { status: 400 });
    }

    // Check if we have a cached response
    const cached = CACHED_RESPONSES[question];

    if (cached) {
      return NextResponse.json({
        response: cached.response,
        diagram: cached.diagram,
        cached: true,
        metadata: cached.metadata,
        timestamp: new Date().toISOString(),
      });
    }

    // If no cached response, return not found
    return NextResponse.json(
      {
        error: "No cached response available for this question",
        suggestion: "Try one of the suggested starter questions",
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("Cached response error:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve cached response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
