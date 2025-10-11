# Knowledge Curation UX Comprehensive Improvement Plan

**Date**: 2025-10-11
**Status**: Analysis Complete - Ready for Implementation
**Philosophy**: "This app is nothing unless we can subtly curate the knowledge we put into it."

---

## Executive Summary

The Curate Tab is functional but needs significant UX polish and innovative features to become a world-class knowledge management interface. Current score: **8.8/10** → Target: **9.8/10**

**Critical Issues Found**:
1. FileUpload component NOT using MAC design tokens
2. API endpoint mismatch (using `/api/assistant-v5` instead of `/api/vector-store/files`)
3. Missing innovative knowledge curation features
4. Upload tab needs glassmorphism and MAC styling
5. No knowledge quality indicators or usage analytics

---

## Phase 1: Functional Analysis

### Files Tab ✅ WORKING
- **Load**: 184 files loading successfully
- **Search**: Input visible and functional
- **Select**: Checkboxes with "Select all" working
- **Delete**: Confirmation dialog implemented
- **Deduplicate**: Button present
- **Visual**: MAC compliant with recent improvements

### Upload Tab ⚠️ NEEDS IMPROVEMENT
**Current Implementation** (`file-upload.tsx`):
- ✅ Drag & drop zone
- ✅ File validation (20MB max)
- ✅ Upload queue with progress
- ✅ Multiple file support
- ❌ NOT using MAC design tokens
- ❌ Wrong API endpoint
- ❌ Generic colors (blue/green/red instead of MAC vars)
- ❌ Missing glassmorphism
- ❌ No MAC typography

### Info Tab ✅ WORKING
- Clean card layout
- Assistant ID, file count, size
- Supported file types grid
- MAC compliant styling

---

## Phase 2: Critical Issues & Fixes

### Issue 1: FileUpload Component NOT MAC Compliant

**Current Code Problems** (lines 284-340):
```tsx
//