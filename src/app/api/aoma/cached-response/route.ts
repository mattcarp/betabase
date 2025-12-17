import { NextRequest, NextResponse } from "next/server";

// Premium cached responses with rich visual content for instant delivery
// These showcase deep AOMA knowledge and trigger infographic generation
// Updated: December 2025 with latest release notes and corpus data
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
  "What are the different asset types in AOMA and how do they relate to each other?": {
    response: `# AOMA Asset Types & Their Relationships

AOMA organizes content into a structured hierarchy that flows from raw assets to market-ready products.

## Core Asset Types

### 1. Digital Media Assets
The foundational building blocks of AOMA:

- **Audio Masters** - The primary content type
  - Stereo Audio (standard 2-channel)
  - Immersive Audio (Dolby Atmos, Sony 360RA)
  - Ambisonic (AMB) - Spatial audio formats
  - DBKS - Dolby Booklet Service files
  
- **Video Assets**
  - Music videos
  - Visualizers
  - Live performances

- **Graphic Assets**
  - Album artwork
  - Promotional images
  - Cover variants

- **Supplementary Files**
  - Subtitles (SRT, VTT)
  - Closed Captions (CC)
  - Lyrics files
  - SFV (Simple File Verification)

### 2. Products (Offerings)
How assets are packaged for the market:

- **Albums** - Full-length releases
- **Singles** - Individual track releases
- **EPs** - Extended plays
- **Compilations** - Collections from multiple sources

## The Relationship Flow

**Assets → Registration → Linking → Products → Distribution**

1. **Asset Registration**: Raw files enter AOMA
   - Metadata extraction and validation
   - AOMA ID assignment
   - Format verification

2. **Master Linking**: Assets connect to products
   - Track-to-product association
   - Format mapping (stereo, immersive)
   - ISRC/UPC alignment

3. **Product Creation**: Packaged for release
   - Metadata consolidation
   - Artwork attachment
   - Partner configuration

4. **Distribution**: Delivery to partners
   - DSP-specific formatting
   - Quality control
   - Registration job processing

## Key Concepts

| Concept | Description |
|---------|-------------|
| **AOMA ID** | Unique identifier assigned at registration |
| **ISRC** | International Standard Recording Code |
| **UPC** | Universal Product Code for releases |
| **GRPS** | Global Release Processing System |

## Multi-Format Support

A single track can have multiple master types:
- Stereo version for standard streaming
- Immersive version for Dolby Atmos platforms
- Preview clips for store previews
- Ringtone edits for carrier partners

All linked to the same product for unified management.`,
    diagram: `graph TD
    subgraph Assets [Digital Media Assets]
        Audio[Audio Masters]
        Video[Video Assets]
        Graphics[Graphic Assets]
        Supplements[Supplementary Files]
    end

    subgraph AudioTypes [Audio Master Types]
        Stereo[Stereo Audio]
        Immersive[Immersive - Dolby Atmos]
        AMB[Ambisonic Audio]
        DBKS[DBKS Files]
    end

    subgraph Products [Products - Offerings]
        Albums[Albums]
        Singles[Singles]
        EPs[EPs]
        Compilations[Compilations]
    end

    subgraph Distribution [Distribution Layer]
        DSPs[Digital Service Providers]
        Carriers[Mobile Carriers]
        Partners[Retail Partners]
    end

    Audio --> AudioTypes
    AudioTypes --> Registration[Asset Registration]
    Video --> Registration
    Graphics --> Registration
    Supplements --> Registration

    Registration --> Linking[Master Linking]
    Linking --> Products
    Products --> QC[GRPS Quality Control]
    QC --> Distribution`,
    metadata: {
      confidence: "high",
      sources: ["AOMA Architecture Guide", "Asset Registration Documentation", "AOMA Corpus December 2025"],
      lastUpdated: "2025-12-17",
    },
  },

  "How does AOMA use AWS S3 storage tiers for long-term archiving?": {
    response: `# AOMA AWS S3 Storage Architecture

AOMA leverages a tiered AWS S3 storage strategy to balance accessibility with cost-effectiveness for long-term archiving of audio, video, and graphic assets.

## Storage Tier Hierarchy

### Tier 1: Standard S3
**For active, frequently accessed assets**

- Recent uploads awaiting processing
- Assets in active QC workflows
- Content scheduled for imminent release
- **Access time**: Milliseconds
- **Use case**: Daily operations

### Tier 2: S3 Infrequent Access (S3 IA)
**For less frequently accessed content**

- Completed releases past initial promotion period
- Catalog content with occasional access needs
- Backup copies of active masters
- **Access time**: Milliseconds (with retrieval fee)
- **Use case**: Monthly access patterns

### Tier 3: S3 Glacier
**For archival storage with rare access**

- Completed project archives
- Historical releases
- Compliance and legal retention
- **Access time**: Minutes to hours
- **Use case**: Quarterly or annual access

### Tier 4: S3 Glacier Deep Archive
**For cold storage of pre-production assets**

- All pre-production audio assets
- Original source files
- Uncompressed masters
- Long-term preservation copies
- **Access time**: 12-48 hours
- **Use case**: Rarely accessed, compliance-driven

## Automatic Lifecycle Management

AOMA implements intelligent lifecycle policies:

| Asset State | Initial Tier | After 30 Days | After 90 Days | After 1 Year |
|-------------|--------------|---------------|---------------|--------------|
| Active Master | Standard S3 | S3 IA | Glacier | Deep Archive |
| Pre-Production | Standard S3 | - | - | Deep Archive |
| Archive Only | - | - | Glacier | Deep Archive |

## Cost Optimization

The tiered approach delivers significant savings:

- **Standard S3**: ~$0.023/GB/month
- **S3 IA**: ~$0.0125/GB/month (46% savings)
- **Glacier**: ~$0.004/GB/month (83% savings)
- **Deep Archive**: ~$0.00099/GB/month (96% savings)

## Asset Type Storage Patterns

### Audio Masters
- WAV/FLAC originals → Deep Archive after processing
- MP3/AAC derivatives → Glacier after 90 days
- Active delivery formats → Standard S3

### Video Assets
- ProRes/DNxHD masters → Glacier immediately
- Delivery formats → S3 IA after 30 days

### Graphic Assets
- High-res originals → Glacier after 60 days
- Web-optimized → Standard S3 for active products

## Retrieval Best Practices

When retrieving from cold storage:

1. **Plan ahead** - Deep Archive retrieval takes 12-48 hours
2. **Batch requests** - Group related assets for efficiency
3. **Use expedited** - Available for urgent Glacier retrievals (additional cost)
4. **Cache locally** - Avoid repeated retrievals of same assets`,
    diagram: `graph TD
    subgraph Upload [Asset Upload]
        NewAsset[New Asset Uploaded]
    end

    subgraph StandardTier [Tier 1: Standard S3]
        Active[Active Assets]
        Processing[Processing Queue]
        RecentReleases[Recent Releases]
    end

    subgraph IATier [Tier 2: S3 Infrequent Access]
        Catalog[Catalog Content]
        CompletedReleases[Completed Releases]
        Backups[Backup Copies]
    end

    subgraph GlacierTier [Tier 3: S3 Glacier]
        Archives[Project Archives]
        Historical[Historical Releases]
        Compliance[Compliance Retention]
    end

    subgraph DeepTier [Tier 4: Glacier Deep Archive]
        PreProd[Pre-Production Assets]
        OriginalMasters[Original Masters]
        LongTerm[Long-Term Preservation]
    end

    NewAsset --> Active
    Active -->|30 days| Catalog
    Catalog -->|90 days| Archives
    Archives -->|1 year| LongTerm
    
    Processing --> Active
    RecentReleases -->|30 days| CompletedReleases
    CompletedReleases -->|90 days| Historical
    Historical -->|1 year| LongTerm

    Backups -->|90 days| Compliance
    Compliance -->|1 year| LongTerm`,
    metadata: {
      confidence: "high",
      sources: ["AOMA Digital Archive Guide", "AWS Storage Configuration", "Pre-Production Archive Documentation"],
      lastUpdated: "2025-12-17",
    },
  },

  "What's the difference between asset registration and master linking in AOMA?": {
    response: `# Asset Registration vs. Master Linking

Think of it this way: **Registration creates the inventory. Linking puts it on the shelf for sale.**

## Asset Registration

**The entry point for content into AOMA**

### What Happens During Registration

1. **File Upload** - Source files enter the system
2. **Validation** - Format and quality checks
3. **Metadata Extraction** - Automatic data parsing
4. **AOMA ID Assignment** - Unique identifier created
5. **QC Queuing** - Sent for quality control

### Key Characteristics

| Aspect | Registration |
|--------|--------------|
| **Purpose** | Bring content into AOMA |
| **Timing** | First step in workflow |
| **Input** | Raw source files |
| **Output** | Registered asset with AOMA ID |
| **Tools** | UST (Unified Submission Tool), LFV |

### What You Define

- Basic metadata (title, artist, ISRC)
- File format specifications
- Quality parameters
- Security group assignments

## Master Linking

**Connecting registered assets to products for distribution**

### What Happens During Linking

1. **Product Selection** - Choose target release
2. **Track Mapping** - Assign assets to positions
3. **Format Association** - Link stereo, immersive, etc.
4. **Metadata Inheritance** - Product metadata flows to assets
5. **Distribution Enablement** - Ready for partner delivery

### Key Characteristics

| Aspect | Master Linking |
|--------|----------------|
| **Purpose** | Connect assets to products |
| **Timing** | After registration, before release |
| **Input** | Registered asset + Product |
| **Output** | Linked product ready for delivery |
| **Tools** | Product Linking, Product Linking A3 |

### What You Define

- Track order and positions
- Product-specific metadata
- Partner delivery configuration
- Format priorities per partner

## Side-by-Side Comparison

| Feature | Registration | Linking |
|---------|--------------|---------|
| Creates AOMA ID | Yes | No |
| Requires source file | Yes | No |
| Connects to product | No | Yes |
| Enables partner delivery | No | Yes |
| Can exist standalone | Yes | No (needs registered asset) |
| Modifies asset metadata | Yes | Inherits product metadata |
| QC validation | Initial | Product-level |

## Common Scenarios

### Scenario 1: New Single Release
1. **Register** the master audio file → Gets AOMA ID
2. **Link** the master to the single product → Enables delivery

### Scenario 2: Album with Multiple Formats
1. **Register** stereo masters for all tracks
2. **Register** immersive masters for select tracks
3. **Link** all masters to album product
4. System handles multi-format delivery automatically

### Scenario 3: Replacing a Master
1. **Register** new corrected master → New AOMA ID
2. **Unlink** old master from product
3. **Link** new master to product
4. Partners receive updated content

## Important Notes

- An asset can be registered but never linked (orphaned)
- An asset can be linked to multiple products
- Unlinking doesn't delete the registered asset
- Re-linking is possible after unlinking`,
    diagram: `graph LR
    subgraph Registration [Asset Registration]
        SourceFile[Source File]
        Upload[Upload to AOMA]
        Validate[Validation]
        Extract[Metadata Extraction]
        AssignID[Assign AOMA ID]
        QC[QC Queue]
    end

    subgraph Linking [Master Linking]
        SelectProduct[Select Product]
        MapTracks[Map to Tracks]
        AssocFormats[Associate Formats]
        InheritMeta[Inherit Metadata]
        EnableDist[Enable Distribution]
    end

    subgraph Output [Result]
        RegisteredAsset[Registered Asset]
        LinkedProduct[Linked Product]
        PartnerDelivery[Partner Delivery]
    end

    SourceFile --> Upload
    Upload --> Validate
    Validate --> Extract
    Extract --> AssignID
    AssignID --> QC
    QC --> RegisteredAsset

    RegisteredAsset --> SelectProduct
    SelectProduct --> MapTracks
    MapTracks --> AssocFormats
    AssocFormats --> InheritMeta
    InheritMeta --> EnableDist
    EnableDist --> LinkedProduct
    LinkedProduct --> PartnerDelivery`,
    metadata: {
      confidence: "high",
      sources: ["AOMA Registration Guide", "Product Linking Documentation", "UST User Manual"],
      lastUpdated: "2025-12-17",
    },
  },

  "What are the permission levels in AOMA and what can each role do?": {
    response: `# AOMA Permission Levels & Role Capabilities

AOMA uses a tiered permission structure separating general management access from specific file handling capabilities.

## Core Access Roles

### Viewer
**Read-only access to the system**

- View asset metadata and status
- View product information
- View reports and dashboards
- Browse catalog content
- **Cannot**: Edit, upload, delete, or approve anything

### Editor
**Can modify metadata and initiate workflows**

- All Viewer capabilities, plus:
- Edit asset metadata
- Update product information
- Initiate registration workflows
- Request QC reviews
- **Cannot**: Delete assets, manage users, or approve releases

### Admin
**Full system access including user management**

- All Editor capabilities, plus:
- Create and manage users
- Assign permissions and roles
- Delete assets and products
- Approve critical workflows
- Configure system settings
- Manage security groups

## Specialized Roles

### Label Admin
**Content management for specific labels**

- Manage assets within assigned label(s)
- Approve releases for their labels
- Configure label-specific settings
- View cross-label reports (limited)
- **Scope**: Restricted to assigned labels only

### QC Reviewer
**Quality control approval authority**

- Review submitted masters for quality
- Approve or reject QC submissions
- Add QC notes and feedback
- Escalate quality issues
- **Cannot**: Upload or modify assets directly

## Technical Permission Roles

These control specific file operations:

### Uploader
**Permission to submit files to AOMA**

| Capability | Allowed |
|------------|---------|
| Upload audio masters | ✅ |
| Upload video assets | ✅ |
| Upload graphic assets | ✅ |
| Upload supplementary files | ✅ |
| Delete uploaded files | ❌ |

### Engineer
**Technical workflow permissions**

| Capability | Allowed |
|------------|---------|
| Access Engineering menu | ✅ |
| Register assets | ✅ |
| Manage QC workflows | ✅ |
| Run batch operations | ✅ |
| Access technical reports | ✅ |

### Exporter
**Permission to download and export content**

| Capability | Allowed |
|------------|---------|
| Download masters | ✅ |
| Export to partners | ✅ |
| Generate delivery packages | ✅ |
| Access non-watermarked files | ✅ |
| Bulk export operations | ✅ |

## Permission Matrix

| Action | Viewer | Editor | Admin | Label Admin | QC Reviewer |
|--------|--------|--------|-------|-------------|-------------|
| View assets | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit metadata | ❌ | ✅ | ✅ | ✅ | ❌ |
| Upload files | ❌ | ✅* | ✅ | ✅* | ❌ |
| Delete assets | ❌ | ❌ | ✅ | ❌ | ❌ |
| Approve QC | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ | ❌ | ❌ |
| Export content | ❌ | ✅* | ✅ | ✅* | ❌ |

*Requires additional Uploader/Exporter role

## Security Groups

Permissions can be further scoped by:

- **Label** - Restrict to specific record labels
- **Territory** - Limit to geographic regions
- **Product Type** - Audio only, video only, etc.
- **Partner** - Specific DSP access

## Best Practices

1. **Principle of Least Privilege** - Assign minimum required permissions
2. **Separate Duties** - Upload and QC approval should be different people
3. **Regular Audits** - Review permissions quarterly
4. **Label Scoping** - Use Label Admin for multi-label organizations
5. **Technical Roles** - Combine with access roles as needed`,
    diagram: `graph TD
    subgraph AccessRoles [Core Access Roles]
        Viewer[Viewer - Read Only]
        Editor[Editor - Can Modify]
        Admin[Admin - Full Access]
    end

    subgraph SpecializedRoles [Specialized Roles]
        LabelAdmin[Label Admin]
        QCReviewer[QC Reviewer]
    end

    subgraph TechnicalRoles [Technical Permission Roles]
        Uploader[Uploader]
        Engineer[Engineer]
        Exporter[Exporter]
    end

    subgraph Capabilities [Key Capabilities]
        ViewContent[View Content]
        EditMeta[Edit Metadata]
        UploadFiles[Upload Files]
        DeleteAssets[Delete Assets]
        ApproveQC[Approve QC]
        ManageUsers[Manage Users]
        ExportContent[Export Content]
    end

    Viewer --> ViewContent
    Editor --> ViewContent
    Editor --> EditMeta
    Admin --> ViewContent
    Admin --> EditMeta
    Admin --> DeleteAssets
    Admin --> ManageUsers
    
    LabelAdmin --> EditMeta
    LabelAdmin --> ApproveQC
    QCReviewer --> ApproveQC

    Uploader --> UploadFiles
    Engineer --> UploadFiles
    Exporter --> ExportContent`,
    metadata: {
      confidence: "high",
      sources: ["AOMA Permission Guide", "Security Group Documentation", "Admin User Manual"],
      lastUpdated: "2025-12-17",
    },
  },

  "What new UST features are being planned for the 2026 releases?": {
    response: `# UST (Unified Submission Tool) Roadmap - 2026

Based on the latest AOMA release notes and development priorities, here's what's coming to UST.

## Confirmed Features in Development

### Subtitle Functionality Revamp
**Major enhancement to subtitle handling**

- Support for additional subtitle formats
- Improved validation for timing and encoding
- Better error messages for format mismatches
- Streamlined workflow for multi-language releases
- **Status**: In active development

### Enhanced Error Buttons
**New error handling for specific formats**

Error buttons being added for:
- **DBKS** (Dolby Booklet Service)
- **DVD DDP** (Disc Description Protocol)
- **VCA** (Video Content Assets)
- **Vinyl** - Physical format specifics
- **AMB** (Ambisonic) - Spatial audio errors

### Asset Swap Enhancements
**More flexibility for asset replacement**

- Ability to unlock QC notes for audio assets through asset swapping
- Streamlined replacement workflow
- Preserved QC history after swap
- Better audit trail for compliance

### Empty Master Deletion
**Cleanup feature for UST**

- Delete empty masters directly from UST interface
- Bulk cleanup capabilities
- Safety checks before deletion
- Audit logging for deleted items

## Features Under Review

These are being evaluated for potential inclusion:

### Scheduling Improvements
- Asset swap scheduling
- Timed deletions
- Release date coordination
- Partner-specific scheduling

### Batch Operations
- Multi-asset QC submission
- Bulk metadata updates
- Parallel processing improvements
- Progress tracking enhancements

## Recent Additions (AOMA 2.116.0)

These shipped in December 2025:

- ✅ Subtitle format support expansion
- ✅ Error button framework implementation
- ✅ UST interface refinements
- ✅ Improved validation feedback

## Timeline Expectations

| Feature | Expected Release |
|---------|------------------|
| Subtitle Revamp Phase 1 | Q1 2026 |
| Error Buttons - All Formats | Q1 2026 |
| Asset Swap QC Unlock | Q2 2026 |
| Empty Master Deletion | Q2 2026 |
| Scheduling Features | TBD |

## How This Impacts Workflows

### For Audio Engineers
- Faster error resolution with format-specific buttons
- More control over asset replacement
- Reduced manual cleanup tasks

### For QC Teams
- Better subtitle validation saves review time
- Asset swap QC unlock reduces bottlenecks
- Cleaner interface with empty master removal

### For Administrators
- Improved audit trails
- Better bulk operations
- Enhanced scheduling control

## Staying Updated

To track UST development:
1. Monitor AOMA Release Notes
2. Check Engineering menu announcements
3. Review UST changelog in Help menu
4. Attend monthly platform update meetings`,
    diagram: `graph LR
    subgraph Current [Current - 2.116.0]
        SubtitleSupport[Subtitle Support]
        ErrorFramework[Error Button Framework]
        UIRefinements[UI Refinements]
    end

    subgraph Q1_2026 [Q1 2026]
        SubtitleRevamp[Subtitle Revamp]
        AllErrorButtons[All Format Error Buttons]
        DBKSErrors[DBKS Errors]
        VinylErrors[Vinyl Errors]
    end

    subgraph Q2_2026 [Q2 2026]
        AssetSwapQC[Asset Swap QC Unlock]
        EmptyMasterDelete[Empty Master Deletion]
        BulkCleanup[Bulk Cleanup]
    end

    subgraph Future [Under Review]
        Scheduling[Scheduling Features]
        BatchOps[Enhanced Batch Ops]
        ParallelProcessing[Parallel Processing]
    end

    Current --> Q1_2026
    Q1_2026 --> Q2_2026
    Q2_2026 --> Future`,
    metadata: {
      confidence: "medium",
      sources: ["AOMA Release Notes 2.116.0", "AOMA Roadmap Document December 2025", "Development Priority List"],
      lastUpdated: "2025-12-17",
    },
  },

  "How do I upload and archive digital assets in AOMA from preparation to storage?": {
    response: `# Complete Digital Asset Upload & Archive Workflow

This guide walks you through the entire process from file preparation to long-term cloud storage.

## Phase 1: File Preparation

### Organize Your Content

**Folder Structure Requirements**:
- Create clear, hierarchical folders
- Use consistent naming conventions
- Separate by asset type (audio, video, graphics)

**Critical**: File names must NOT contain:
- Special characters (!@#$%^&*)
- Unicode characters
- Leading/trailing spaces
- Excessively long names (>100 chars)

### Verify File Formats

| Asset Type | Preferred Format | Acceptable |
|------------|-----------------|------------|
| Audio Master | WAV 24-bit/96kHz | FLAC, AIFF |
| Immersive Audio | ADM BWF | Dolby Atmos |
| Video | ProRes 422 HQ | DNxHD, H.264 |
| Graphics | TIFF 300dpi | PNG, PSD |
| Subtitles | SRT | VTT, TTML |

### Pre-Upload Checklist

- ✅ Files meet format specifications
- ✅ Metadata is prepared (ISRC, UPC, credits)
- ✅ Artwork meets resolution requirements
- ✅ File names are clean and descriptive
- ✅ You have required permissions in AOMA

## Phase 2: Upload & Registration

### Access the Upload Interface

Navigate to: **Engineering → Unified Submission Tool (UST)**

Or for large volumes: **Asset Submission Tool (LFV)**

### Upload Process

1. **Select Asset Type**
   - Stereo Audio, Immersive, Video, Graphics, etc.

2. **Upload Files**
   - Drag and drop or browse
   - System validates format automatically
   - Preflight checks run in real-time

3. **Enter Metadata**
   - Basic: Title, Artist, ISRC
   - Extended: Credits, Lyrics, Explicit indicator
   - Technical: Sample rate, bit depth, channels

4. **Security Group Assignment**
   - Select appropriate security groups
   - Determines who can access the asset

5. **Submit for Registration**
   - Review summary
   - Confirm submission
   - Receive registration confirmation

### Post-Upload Validation

The system automatically:
- Generates AOMA ID
- Extracts embedded metadata
- Creates preview waveforms (audio)
- Queues for quality control

## Phase 3: Quality Control

### Automatic QC Checks

- Format compliance verification
- Audio loudness standards (LUFS)
- Video technical parameters
- Metadata completeness

### Manual QC Review

Navigate to: **Engineering → QC Notes**

- Review flagged issues
- Approve or reject submissions
- Add QC notes for feedback

## Phase 4: Product Linking

Once QC passes:

1. Navigate to **Product Linking** or **Product Linking A3**
2. Search for target product (album, single)
3. Link registered assets to tracks
4. Configure format priorities
5. Save linking configuration

## Phase 5: Archival Storage

### Automatic Tier Assignment

AOMA's lifecycle management handles storage automatically:

**Immediate (Standard S3)**:
- Active assets in workflow
- Recently uploaded content

**After 30 Days (S3 IA)**:
- Completed releases
- Catalog content

**After 90 Days (Glacier)**:
- Historical releases
- Compliance archives

**After 1 Year (Deep Archive)**:
- Pre-production masters
- Long-term preservation

### Manual Archive Operations

Navigate to: **Asset Administration → Digital Archive**

Options:
- Force immediate archival
- Retrieve from cold storage
- Verify archive integrity
- Download archived content

## Monitoring Your Upload

### Track Progress

| Location | What to Check |
|----------|---------------|
| Registration Job Status | Upload processing state |
| Master Status | QC and linking status |
| Product Status | Overall release readiness |
| Export Status | Partner delivery status |

### Common Issues & Fixes

**Upload fails validation**:
→ Check file format and naming
→ Verify file isn't corrupted
→ Confirm format is supported

**QC keeps failing**:
→ Review QC notes for specific issues
→ Fix source file and re-upload
→ Contact QC team if unclear

**Can't find uploaded asset**:
→ Check Registration Job Status
→ Verify security group access
→ Search by AOMA ID or filename`,
    diagram: `graph TD
    subgraph Prep [Phase 1: Preparation]
        Organize[Organize Files]
        Verify[Verify Formats]
        Checklist[Pre-Upload Checklist]
    end

    subgraph Upload [Phase 2: Upload]
        SelectType[Select Asset Type]
        UploadFiles[Upload Files]
        EnterMeta[Enter Metadata]
        AssignSecurity[Assign Security Group]
        Submit[Submit Registration]
    end

    subgraph QC [Phase 3: Quality Control]
        AutoQC[Automatic QC Checks]
        ManualReview[Manual QC Review]
        QCApproval{QC Passed?}
    end

    subgraph Linking [Phase 4: Product Linking]
        SelectProduct[Select Product]
        LinkAssets[Link Assets to Tracks]
        ConfigFormats[Configure Formats]
    end

    subgraph Archive [Phase 5: Archival Storage]
        StandardS3[Standard S3 - Active]
        S3IA[S3 IA - 30 Days]
        Glacier[Glacier - 90 Days]
        DeepArchive[Deep Archive - 1 Year]
    end

    Organize --> Verify
    Verify --> Checklist
    Checklist --> SelectType
    SelectType --> UploadFiles
    UploadFiles --> EnterMeta
    EnterMeta --> AssignSecurity
    AssignSecurity --> Submit

    Submit --> AutoQC
    AutoQC --> ManualReview
    ManualReview --> QCApproval
    QCApproval -->|Yes| SelectProduct
    QCApproval -->|No| UploadFiles

    SelectProduct --> LinkAssets
    LinkAssets --> ConfigFormats
    ConfigFormats --> StandardS3

    StandardS3 --> S3IA
    S3IA --> Glacier
    Glacier --> DeepArchive`,
    metadata: {
      confidence: "high",
      sources: ["AOMA Digital Archive Guide", "UST Documentation", "Asset Registration Workflow", "AWS Storage Configuration"],
      lastUpdated: "2025-12-17",
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
