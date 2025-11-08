#!/usr/bin/env python3
"""
Confluence Wiki Content Extractor

Scrapes AOMA and USM Confluence spaces to extract knowledge content.
Saves text content as Markdown files (no screenshots, no DOM).
"""

from browser_use import Agent, Browser, BrowserConfig, Controller, ActionResult
from langchain_openai import ChatOpenAI
import asyncio
import os
import datetime
import time
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
SPACES_TO_SCRAPE = [
    {
        "name": "AOMA",
        "url": "https://wiki.smedigitalapps.com/wiki/display/AOMA",
        "start_page": "https://wiki.smedigitalapps.com/wiki/display/AOMA",
        "description": "Asset and Offering Management Application documentation"
    },
    {
        "name": "USM",
        "url": "https://wiki.smedigitalapps.com/wiki/display/USM/Unified+Session+Manager+Home",
        "start_page": "https://wiki.smedigitalapps.com/wiki/pages/viewpage.action?pageId=67863500",
        "description": "Unified Session Manager documentation"
    },
    {
        "name": "GMP",
        "url": "https://wiki.smedigitalapps.com/wiki/display/GMP",
        "start_page": "https://wiki.smedigitalapps.com/wiki/display/GMP",
        "description": "Global Media Production documentation"
    }
]

OUTPUT_DIR = "scraped_content"
SCREENSHOTS_DIR = "screenshots"
LOG_FILE = "scraping.log"
STATUS_FILE = "scraping_status.json"

# Create directories if they don't exist
for directory in [OUTPUT_DIR, SCREENSHOTS_DIR]:
    if not os.path.exists(directory):
        os.makedirs(directory)

# Create subdirectories for each space
for space in SPACES_TO_SCRAPE:
    space_dir = os.path.join(OUTPUT_DIR, space["name"])
    if not os.path.exists(space_dir):
        os.makedirs(space_dir)

def log_message(message):
    """Log message with timestamp to console and file"""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted = f"[{timestamp}] {message}"
    print(formatted)
    
    with open(LOG_FILE, "a") as log_file:
        log_file.write(formatted + "\n")

async def scrape_space(space_name, space_url, space_description, username, password):
    """Scrape a single Confluence space"""
    log_message(f"\n{'='*70}")
    log_message(f"Starting to scrape {space_name} space")
    log_message(f"URL: {space_url}")
    log_message(f"{'='*70}\n")
    
    space_output_dir = os.path.join(OUTPUT_DIR, space_name)
    
    # Create custom controller with actions for file saving
    controller = Controller()
    
    # Custom action to save content to a file
    @controller.action("Save content to file")
    def save_content_to_file(filename: str, content: str):
        try:
            # Ensure filename is safe and ends with .md
            safe_filename = filename.replace('/', '-').replace('\\', '-')
            if not safe_filename.endswith('.md'):
                safe_filename += '.md'
            
            filepath = os.path.join(space_output_dir, safe_filename)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            log_message(f"✅ Saved: {safe_filename} ({len(content)} chars)")
            return ActionResult(extracted_content=f"Successfully saved content to {safe_filename}")
        except Exception as e:
            log_message(f"❌ Error saving content: {e}")
            return ActionResult(extracted_content=f"Failed to save content: {e}")
    
    # Custom action to track scraped URLs
    @controller.action("Track scraped URL")
    def track_scraped_url(url: str, title: str, filename: str):
        try:
            # Load existing status
            status = {}
            if os.path.exists(STATUS_FILE):
                with open(STATUS_FILE, "r") as f:
                    status = json.load(f)
            
            # Initialize if needed
            if "scraped_urls" not in status:
                status["scraped_urls"] = {}
            if space_name not in status["scraped_urls"]:
                status["scraped_urls"][space_name] = []
            
            # Add to scraped URLs
            status["scraped_urls"][space_name].append({
                "url": url,
                "title": title,
                "filename": filename,
                "timestamp": datetime.datetime.now().isoformat()
            })
            
            # Save updated status
            with open(STATUS_FILE, "w") as f:
                json.dump(status, f, indent=2)
            
            return ActionResult(extracted_content=f"Successfully tracked URL: {url}")
        except Exception as e:
            log_message(f"⚠️  Error tracking URL: {e}")
            return ActionResult(extracted_content=f"Failed to track URL: {e}")
    
    # Create browser instance
    browser = Browser(
        config=BrowserConfig(
            headless=False  # Keep browser visible
        )
    )
    
    try:
        # Create agent with instructions for content extraction
        agent = Agent(
            task=f"""
            Your task is to extract ALL content from the {space_name} Confluence space.
            Description: {space_description}
            
            1. LOGIN PHASE (if not already logged in)
            --------------
            a. Navigate to {space_url}
            b. If you see a login page:
               i. Enter username "{username}" and click Next
               ii. Enter password "{password}" and click Login
               iii. If CAPTCHA appears, wait for manual resolution
            
            2. CONTENT EXTRACTION PHASE
            --------------------------
            You are extracting KNOWLEDGE CONTENT about {space_name}, not scraping the Confluence UI itself.
            
            For EACH documentation page in the {space_name} space:
            
            a. Extract the COMPLETE TEXT CONTENT including:
               - Page title
               - All headings and subheadings
               - All paragraphs and text
               - All lists (bulleted and numbered)
               - All tables (convert to Markdown table format)
               - All code blocks and examples
               - Any embedded content or notes
            
            b. DO NOT include:
               - Confluence UI elements
               - Navigation menus
               - Page metadata (except title)
               - Comments sections
               - Edit buttons or toolbars
            
            c. Format as clean Markdown:
               ```markdown
               # Page Title
               
               ## Section Heading
               Content text here...
               
               ### Subsection
               - List item 1
               - List item 2
               
               | Column 1 | Column 2 |
               |----------|----------|
               | Data     | Data     |
               ```
            
            d. Save the content using "Save content to file" action:
               - Filename format: "page-title-here.md" (lowercase, hyphens)
               - Example: "aoma-user-guide.md"
            
            e. Track using "Track scraped URL" action with:
               - Current page URL
               - Page title
               - Saved filename
            
            f. Find ALL links to other pages in the {space_name} space:
               - Left sidebar navigation
               - Page content links
               - "Child pages" sections
               - "Related pages" sections
               - Table of contents
            
            g. For each link found:
               - Navigate to that page
               - Extract its content (repeat this process)
               - Continue until all pages are scraped
            
            3. PRIORITY AREAS
            ---------------
            Pay special attention to these types of pages:
            - Getting Started / Overview pages
            - Architecture documentation
            - API documentation
            - User guides
            - Configuration guides
            - Technical specifications
            - Release notes
            - FAQs and troubleshooting
            
            4. EXTRACTION QUALITY
            -------------------
            - Be THOROUGH - capture ALL text content
            - Preserve heading hierarchy
            - Maintain list structure
            - Convert tables properly
            - Keep code blocks intact
            - Don't miss any sections
            
            START by navigating to {space_url} and begin extraction.
            Report progress regularly by saying which pages you've completed.
            """,
            llm=ChatOpenAI(model="gpt-4o", temperature=0),
            browser=browser,
            controller=controller
        )
        
        # Run the agent
        log_message(f"🤖 Starting extraction agent for {space_name}...")
        result = await agent.run()
        log_message(f"Agent completed: {result}")
        
        # Check results
        md_files = [f for f in os.listdir(space_output_dir) if f.endswith('.md')]
        if md_files:
            total_size = sum(os.path.getsize(os.path.join(space_output_dir, f)) for f in md_files)
            log_message(f"\n✅ {space_name} COMPLETE:")
            log_message(f"   Files: {len(md_files)}")
            log_message(f"   Total size: {total_size/1024:.1f} KB")
            return True
        else:
            log_message(f"\n❌ {space_name} FAILED: No files created")
            return False
    
    except Exception as e:
        log_message(f"❌ ERROR in {space_name}: {e}")
        return False
    
    finally:
        log_message(f"Closing browser for {space_name}...")
        await browser.close()

async def main():
    # Get credentials from environment variables
    username = os.getenv("CONFLUENCE_USERNAME")
    password = os.getenv("CONFLUENCE_PASSWORD")
    
    if not username or not password:
        log_message("❌ ERROR: CONFLUENCE_USERNAME and CONFLUENCE_PASSWORD must be set in .env file")
        return False

    log_message(f"🚀 Starting Confluence knowledge extraction")
    log_message(f"   User: {username}")
    log_message(f"   Spaces: {', '.join([s['name'] for s in SPACES_TO_SCRAPE])}")
    
    results = {}
    
    # Scrape each space
    for space in SPACES_TO_SCRAPE:
        success = await scrape_space(
            space["name"],
            space["url"],
            space["description"],
            username,
            password
        )
        results[space["name"]] = success
        
        # Brief pause between spaces
        if space != SPACES_TO_SCRAPE[-1]:
            log_message("\n⏸️  Pausing 5 seconds before next space...\n")
            await asyncio.sleep(5)
    
    # Final summary
    log_message("\n" + "="*70)
    log_message("📊 FINAL SUMMARY")
    log_message("="*70)
    
    for space_name, success in results.items():
        space_dir = os.path.join(OUTPUT_DIR, space_name)
        md_files = [f for f in os.listdir(space_dir) if f.endswith('.md')] if os.path.exists(space_dir) else []
        total_size = sum(os.path.getsize(os.path.join(space_dir, f)) for f in md_files) if md_files else 0
        
        status = "✅ SUCCESS" if success else "❌ FAILED"
        log_message(f"{space_name}: {status}")
        log_message(f"  Files: {len(md_files)}")
        log_message(f"  Size: {total_size/1024:.1f} KB")
    
    log_message("="*70)
    log_message(f"\n📁 Content saved to: {OUTPUT_DIR}/")
    
    return all(results.values())

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        if success:
            log_message("\n🎉 Wiki content extraction completed successfully!")
        else:
            log_message("\n⚠️  Wiki content extraction completed with errors!")
    except KeyboardInterrupt:
        log_message("\n⏹️  Process interrupted by user.")
    except Exception as e:
        log_message(f"\n❌ Unhandled exception: {e}")
