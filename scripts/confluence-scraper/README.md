# Confluence Knowledge Scraper

Extracts text content from AOMA, USM, and GMP Confluence spaces as Markdown files.

## What It Scrapes

- **AOMA Space** - Asset and Offering Management Application docs
- **USM Space**
- **GMP Space** - Global Media Production docs - Unified Session Manager docs

## What It Extracts

✅ **TEXT CONTENT ONLY:**
- Page titles and headings
- Paragraphs and lists
- Tables (as Markdown)
- Code blocks
- Technical documentation

❌ **NOT Extracted:**
- Screenshots or images
- Confluence UI elements
- DOM structure
- Navigation menus
- Comments

## Directory Structure

```
scraped_content/
├── AOMA/
│   ├── aoma-overview.md
│   ├── aoma-user-guide.md
│   └── ...
└── USM/
    ├── usm-home.md
    ├── usm-api-reference.md
    └── ...
```

## Usage

```bash
cd /Users/mcarpent/Documents/projects/siam/scripts/confluence-scraper

# Run login + scrape
python3 login.py
```

This will:
1. Open browser and login (you solve CAPTCHA once)
2. Auto-run `scrape_wiki.py` 
3. Scrape both AOMA, USM, and GMP spaces
4. Save content to `scraped_content/AOMA/` and `scraped_content/USM/`

## After Scraping

Import to Supabase:
```bash
cd /Users/mcarpent/Documents/projects/siam
node scripts/import-confluence-scraped.js
```

This generates embeddings and stores in `wiki_documents` table.

