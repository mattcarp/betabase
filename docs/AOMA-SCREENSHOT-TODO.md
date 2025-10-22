# AOMA Screenshot Collection - TODO & Progress

**Date Started**: October 11, 2025
**Status**: 🔄 In Progress (10/28 pages captured)
**Session**: Manual navigation with authenticated Safari

---

## 📊 Progress Summary

### ✅ Successfully Captured (10 pages)

1. ✅ **home.png** (395K) - AOMA Homepage
2. ✅ **aoma-ui_direct-upload.png** (398K) - Direct Upload
3. ✅ **aoma-ui_simple-upload.png** (407K) - Simple Upload
4. ✅ **aoma-ui_my-aoma-files.png** (393K) - My AOMA Files
5. ✅ **aoma-ui_product-metadata-viewer.png** (146K) - Product Metadata Viewer
6. ✅ **aoma-ui_qc-notes.png** (397K) - QC Notes
7. ✅ **aoma-ui_registration-job-status.png** (278K) - Registration Job Status
8. ✅ **aoma-ui_unified-submission-tool.png** (218K) - Unified Submission Tool
9. ✅ **aoma-ui_unregister-assets.png** (263K) - Unregister Assets
10. ✅ **aoma-ui_qc-providers.png** (355K) - QC Providers (NEW!)

**Total Size**: ~3.1MB
**Location**: `tmp/aoma-screenshots-20251011/`

---

## 📋 Menu Structure (Discovered via Manual Navigation)

### 🔧 Engineering Menu

Available pages (from screenshot):

- ✅ Archive Submission Tool
- Asset Naming Utility
- ✅ Asset Submission Tool (LFV)
- CD Text
- Delete / Reset Master ID
- ✅ Direct Upload (captured)
- Manage Master Security Groups
- Master - Create
- Master - Modify
- Migrate Assets
- Mobile Audio Editor
- Package Printing Specs
- ✅ Product Metadata Viewer (captured)
- QC Metadata
- ✅ QC Notes (captured)
- Register Assets
- ✅ Simple Upload (captured)
- ✅ Unified Submission Tool (captured)
- ✅ Un-Register Assets (captured)

### 📝 Asset Administration Menu

Available pages (from screenshot):

- ✅ 3rd Party Integration Manager
- ✅ Archive Export Status
- ✅ Asset Upload Job Status (NEW!)
- ✅ EOM Message Sender (NEW!)
- Export Destination Manager
- ✅ Export Status (NEW!)
- Export Status A3
- GRAS Message Sender
- ✅ Link Attempt Status (NEW!)
- ✅ Manage QC Provider Teams (captured as qc-providers)
- ✅ Manage Supply Chain Order (NEW!)
- ✅ Master Event History (NEW!)
- Master Status
- Metadata Import (GRAS)
- Mobile Audio Manager
- ✅ Product Event History (NEW!)
- ✅ Product Linking (NEW!)
- Product Linking A3
- Product Status
- ✅ Pseudo Video (NEW!)
- ✅ Registration Job Status (captured)
- ✅ Supply Chain Order Management (AOMA 3) (NEW!)

### ☁️ General Menu

(Not yet mapped - dropdown didn't expand in screenshots)

### 👥 User Management Menu

(Not yet mapped - dropdown didn't expand in screenshots)

---

## 🎯 TODO: Pages to Capture (18 remaining)

### Priority 1: NEW Pages from Knowledge Base (High Value)

These are the 18 NEW pages added to our knowledge base that need screenshots:

1. ⏳ **EOM Message Sender** - Asset Administration → EOM Message Sender
2. ⏳ **Export Status** - Asset Administration → Export Status
3. ⏳ **Link Attempt Status** - Asset Administration → Link Attempt Status
4. ⏳ **Asset Upload Job Status** - Asset Administration → Asset Upload Job Status
5. ⏳ **Master Event History** - Asset Administration → Master Event History
6. ⏳ **Product Event History** - Asset Administration → Product Event History
7. ⏳ **Product Linking** - Asset Administration → Product Linking
8. ⏳ **Pseudo Video** - Asset Administration → Pseudo Video
9. ⏳ **Supply Chain Order Management** - Asset Administration → Supply Chain Order Management (AOMA 3)
10. ⏳ **3rd Party Integration Manager** - Asset Administration → 3rd Party Integration Manager
11. ⏳ **Archive Submission Tool** - Engineering → Archive Submission Tool
12. ⏳ **Asset Submission Tool (LFV)** - Engineering → Asset Submission Tool (LFV)
13. ⏳ **Media Batch Converter** - (Need to find location)
14. ⏳ **Digital Archive Batch Export** - (Need to find location)
15. ⏳ **Artist Search / Summary Artist** - (Need to find location)
16. ⏳ **User Management Search** - User Management → (submenu TBD)
17. ⏳ **User Export** - (Need to find location)
18. ⏳ **Submit Assets** - (Need to find location)

### Priority 2: Permission-Restricted (May Not Be Accessible)

- ⚠️ **Video Metadata** - Not found in Engineering menu (permission issue)

---

## 🔍 Next Steps for Future Session

### Step 1: Complete Menu Mapping

- [ ] Capture full General menu dropdown
- [ ] Capture full User Management menu dropdown
- [ ] Identify locations of missing pages (Media Batch Converter, Digital Archive Batch Export, etc.)

### Step 2: Systematic Screenshot Capture

Using the menu screenshots as a guide:

**Engineering Menu Pages (5 remaining):**

1. [ ] Archive Submission Tool
2. [ ] Asset Submission Tool (LFV)
3. [ ] Asset Naming Utility
4. [ ] QC Metadata
5. [ ] Register Assets

**Asset Administration Menu Pages (13 remaining):**

1. [ ] EOM Message Sender
2. [ ] Export Status
3. [ ] Link Attempt Status
4. [ ] Asset Upload Job Status
5. [ ] Master Event History
6. [ ] Product Event History
7. [ ] Product Linking
8. [ ] Pseudo Video
9. [ ] Supply Chain Order Management (AOMA 3)
10. [ ] 3rd Party Integration Manager
11. [ ] Archive Export Status
12. [ ] Master Status
13. [ ] Mobile Audio Manager

**Unknown Location (need to find):**

1. [ ] Media Batch Converter
2. [ ] Digital Archive Batch Export
3. [ ] Artist Search / Summary Artist
4. [ ] User Management Search
5. [ ] User Export
6. [ ] Submit Assets

### Step 3: Knowledge Base Integration

- [ ] Run `node scripts/update-kb-with-screenshots.js` to link screenshots to vector DB
- [ ] Update chat API to return screenshot paths with responses
- [ ] Test visual responses in chat interface

---

## 📝 Manual Navigation Workflow (Proven Method)

Since automated navigation is unreliable, use this manual process:

1. **Claude announces next page** - "Navigate to: [Menu] → [Page Name]"
2. **User manually navigates** - Click through menu in Safari
3. **User signals ready** - "you're there!" or "ready!"
4. **Claude captures screenshot** - `screencapture -w -x -o [filename]`
5. **Repeat** - Move to next page

**Works best with:**

- Safari already logged into AOMA Stage
- Active session (no expired login)
- User manually clicking through menus
- Claude capturing on user signal

---

## 🔧 Technical Details

### Screenshot Command

```bash
screencapture -w -x -o tmp/aoma-screenshots-20251011/[filename].png
```

Flags:

- `-w` = Window mode (captures Safari window only)
- `-x` = No sound
- `-o` = No shadow

### File Naming Convention

- Homepage: `home.png`
- Pages: `aoma-ui_[page-name].png`
- Menus: `menu_[menu-name].png`

### Storage Location

```
tmp/aoma-screenshots-20251011/
├── home.png
├── aoma-ui_*.png (page screenshots)
└── menu_*.png (menu screenshots)
```

---

## 📊 Knowledge Base Coverage

### Original 10 Pages

- ✅ 9/10 captured (90%)
- ⚠️ 1/10 missing (Video Metadata - permission restricted)

### NEW 18 Pages

- ✅ 1/18 captured (QC Providers)
- ⏳ 17/18 remaining

### Overall Progress

- **Total**: 10/28 pages (36%)
- **Remaining**: 18/28 pages (64%)

---

## 🎯 Success Criteria

**Phase 1: Complete Screenshot Collection**

- [ ] All accessible pages captured (target: 25-28 pages)
- [ ] All menu structures documented
- [ ] Permission restrictions identified

**Phase 2: Knowledge Base Integration**

- [ ] Screenshots linked to vector DB entries
- [ ] Manifest.json created mapping screenshots to pages
- [ ] Chat API updated to return screenshot paths

**Phase 3: Visual Chat Responses**

- [ ] Screenshots display in chat UI
- [ ] Visual context improves answer quality
- [ ] User feedback confirms enhancement

---

## 📸 Menu Screenshots Reference

Saved menu screenshots (from user):

1. ✅ **Engineering Menu** - Shows 18 available pages
2. ✅ **Asset Administration Menu** - Shows 22 available pages
3. ⏳ **General Menu** - Not yet captured (dropdown didn't expand)
4. ⏳ **User Management Menu** - Not yet captured (dropdown didn't expand)

These menu screenshots will guide future automated navigation scripts.

---

## 💡 Lessons Learned

### What Works ✅

- Manual navigation by user
- Claude capturing on signal
- Saving menu structure screenshots first
- Working through one menu section at a time

### What Doesn't Work ❌

- Automated Safari navigation (pages don't load correctly)
- Automated screencapture with -w flag (menu closes too fast)
- Trying to capture dropdowns with automation

### Improvements for Next Session

- Start with complete menu mapping
- Use menu screenshots to plan systematic capture
- Work through one menu dropdown at a time
- Track progress in real-time

---

_Last Updated: October 11, 2025_
_Next Session: Resume with Asset Administration menu pages_
_Target: Complete all 18 NEW page screenshots_
