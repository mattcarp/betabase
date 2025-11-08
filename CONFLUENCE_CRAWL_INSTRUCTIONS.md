# Confluence Crawl - Step-by-Step Instructions

## Current Status
- ✅ Baseline established: 393 records in `wiki_documents`
- ✅ Credentials configured
- 🔄 Ready to crawl using Python scraper

## Steps to Execute

### 1. Run the Python Confluence Scraper

Open a new terminal and run:

```bash
cd ~/Documents/projects/mc-confluence-scraper
python3 login.py
```

**What will happen:**
1. Browser opens to Confluence login page
2. Script enters your username
3. Script enters your password
4. **CAPTCHA appears** - YOU NEED TO SOLVE IT MANUALLY
5. After you solve CAPTCHA and click "Log In", the script continues
6. Cookies are saved to `wiki_cookies.pkl`
7. Script automatically runs `scrape.py`
8. Content is scraped and saved to `scraped_content/` directory

**Expected time:** 5-10 minutes depending on pages

### 2. Verify Scraped Content

After scraping completes:

```bash
cd ~/Documents/projects/mc-confluence-scraper
ls -la scraped_content/
```

You should see multiple `.md` files with Confluence page content.

### 3. Import to Supabase

Once scraping is complete, come back and tell Claude **"scraping complete"**.

I'll then:
1. Create an import script to load the scraped content
2. Generate embeddings for all pages
3. Store in Supabase `wiki_documents` table with deduplication
4. Verify the data
5. Test RAG integration
6. Update all documentation

## Troubleshooting

**If login.py fails:**
- Make sure you're in the `mc-confluence-scraper` directory
- Check that `.env` file has correct credentials
- Try `python3 -m pip install -r requirements.txt` if dependencies missing

**If CAPTCHA is difficult:**
- Take your time - the script waits up to 5 minutes
- Make sure to click "Log In" after solving CAPTCHA
- Type "continue" when prompted in the terminal

**If scraping fails:**
- Check `scraping.log` for errors
- Saved cookies in `wiki_cookies.pkl` can be reused
- Can re-run `python3 scrape.py` directly if cookies exist

## What Gets Scraped

Target spaces (configurable in the Python scripts):
- USM (Unified Session Manager)
- AOMA 
- TECH
- API
- RELEASE

The scraper:
- Follows all links in each space
- Extracts page title and content
- Saves as Markdown files
- Logs progress to `scraping.log`

## After Successful Scrape

Tell Claude: **"scraping complete"**

Then I'll import everything to Supabase and complete the documentation updates!


