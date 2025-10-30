# AOMA Source Documents Directory

This directory is for the **manual AOMA document migration** to Supabase.

## Purpose

If you have access to the original AOMA source documents (PDFs, Word docs, Markdown, etc.), place them here to migrate them to Supabase for **10-100x faster queries** (2-5s → 50-200ms).

## Quick Start

### Step 1: Gather Your Documents

Copy all AOMA source documents to this directory:

```bash
# Example: Copy from your documents folder
cp ~/Documents/AOMA-Docs/*.pdf ./aoma-source-docs/
cp ~/Documents/AOMA-Docs/*.docx ./aoma-source-docs/
cp ~/Documents/AOMA-Docs/*.md ./aoma-source-docs/

# Or from a network drive
cp /mnt/share/AOMA/*.* ./aoma-source-docs/

# Or from email attachments, Confluence exports, SharePoint, etc.
```

### Step 2: Run the Migration Script

```bash
# From project root
npx tsx scripts/manual-aoma-migration.ts
```

The script will:
1. ✅ Find all documents in this directory
2. ✅ Extract text (PDF, DOCX, MD, TXT)
3. ✅ Chunk into 1000-character pieces
4. ✅ Generate embeddings
5. ✅ Upload to Supabase

### Step 3: Verify Migration

Check Supabase to confirm the documents were uploaded:

```sql
-- In Supabase SQL Editor
SELECT 
  COUNT(*) as total_chunks,
  COUNT(DISTINCT metadata->>'original_filename') as unique_files
FROM aoma_unified_vectors
WHERE source_type = 'aoma_manual_import';
```

### Step 4: Enable Fast Queries

After migration, update the orchestrator to prefer Supabase (see `docs/COMPLETE_ARCHITECTURE_REVIEW.md` → Tier 3.2).

---

## Supported File Formats

| Format | Extension | Status |
|--------|-----------|--------|
| Plain Text | `.txt` | ✅ Fully supported |
| Markdown | `.md` | ✅ Fully supported |
| PDF | `.pdf` | ✅ Fully supported (via pdf-parse) |
| Word Document | `.docx` | ✅ Fully supported (via mammoth) |

---

## Where to Find Source Documents

### Common Sources:

1. **Original Upload Location**
   - Check where documents were originally uploaded for OpenAI Assistant
   - Could be email, Confluence, SharePoint, etc.

2. **Confluence Export**
   ```bash
   # If docs are in Confluence
   # Go to Space Tools → Export Space → HTML
   # Convert HTML to Markdown/PDF
   ```

3. **SharePoint/OneDrive**
   ```bash
   # Download entire folder
   # Can use OneDrive desktop sync
   ```

4. **Email Attachments**
   - Search inbox for "AOMA" documents
   - Download all attachments

5. **Local Backup**
   - Check any local backups or archives

---

## Example Directory Structure

```
aoma-source-docs/
├── README.md (this file)
├── AOMA-Overview.pdf
├── User-Guide.docx
├── API-Documentation.md
├── Getting-Started.txt
└── subdirectory/
    ├── Advanced-Features.pdf
    └── Troubleshooting.md
```

---

## Cost Estimate

For ~150 documents:
- **Embedding Generation**: ~$0.10-0.20 (OpenAI text-embedding-3-small)
- **Supabase Storage**: $0 (within free tier)
- **Time**: 30-60 minutes (one-time)

---

## What Happens After Migration?

**Before**:
- Query time: 2-5 seconds
- Source: OpenAI Assistant API (slow)

**After**:
- Query time: 50-200ms
- Source: Supabase pgvector (fast)
- **10-100x faster! 🚀**

---

## Troubleshooting

### No documents found
```bash
# Make sure files are in this directory
ls -la aoma-source-docs/

# Supported formats
find aoma-source-docs/ -type f \( -name "*.pdf" -o -name "*.docx" -o -name "*.md" -o -name "*.txt" \)
```

### PDF extraction fails
```bash
# Try converting manually
pdf2txt document.pdf > document.txt
```

### DOCX extraction fails
```bash
# Try converting manually
pandoc document.docx -o document.md
```

---

## Need Help?

See `docs/COMPLETE_ARCHITECTURE_REVIEW.md` for full details on the migration strategy and performance improvements.

**Questions?** Contact: matt@mattcarpenter.com

