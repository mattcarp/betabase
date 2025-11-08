#!/usr/bin/env python3
"""
Confluence Wiki Login Script

This script handles the authentication to the Confluence wiki, including CAPTCHA resolution,
and saves the authentication cookies for later use.
"""

from browser_use import Agent, Browser, BrowserConfig
from langchain_openai import ChatOpenAI
import asyncio
from dotenv import load_dotenv
import os
import pickle
import datetime
import time

# Load environment variables
load_dotenv()

# Configuration
WIKI_URL = "https://wiki.smedigitalapps.com/wiki/display/USM/Unified+Session+Manager+Home"
COOKIES_FILE = "wiki_cookies.pkl"
SCREENSHOTS_DIR = "screenshots"

# Create screenshots directory if it doesn't exist
if not os.path.exists(SCREENSHOTS_DIR):
    os.makedirs(SCREENSHOTS_DIR)

def log_with_timestamp(message):
    """Log a message with a timestamp."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

async def check_existing_cookies():
    """Check if cookies exist and are still valid."""
    if not os.path.exists(COOKIES_FILE):
        log_with_timestamp(f"No existing cookies found at {COOKIES_FILE}")
        return False
        
    try:
        # Create a temporary browser to test cookies
        tmp_browser = Browser(
            config=BrowserConfig(
                headless=True  # Use headless mode for faster checking
            )
        )
        
        log_with_timestamp("Testing existing cookies for validity...")
        
        # Load cookies
        with open(COOKIES_FILE, 'rb') as f:
            cookies = pickle.load(f)
        
        # Apply cookies to browser
        context = await tmp_browser.context
        await context.add_cookies(cookies)
        
        # Create a simple agent to check login status
        check_agent = Agent(
            task=f"""
            Navigate to {WIKI_URL} and tell me if you're logged in by checking 
            for login forms vs. confluence content elements.
            - If you see a login form, say "Not logged in"
            - If you see wiki content, say "Logged in"
            - If you're unsure, say "Status unclear"
            """,
            llm=ChatOpenAI(model="gpt-4o", temperature=0),
            browser=tmp_browser
        )
        
        # Run the check
        check_result = await check_agent.run()
        check_result = str(check_result)
        
        # Close the temporary browser
        await tmp_browser.close()
        
        if "Logged in" in check_result:
            log_with_timestamp("Existing cookies are valid - already logged in")
            return True
        else:
            log_with_timestamp("Existing cookies are invalid or expired")
            return False
            
    except Exception as e:
        log_with_timestamp(f"Error checking existing cookies: {e}")
        return False

async def main():
    # Get credentials from environment variables
    username = os.getenv("CONFLUENCE_USERNAME")
    password = os.getenv("CONFLUENCE_PASSWORD")
    
    if not username or not password:
        log_with_timestamp("Error: CONFLUENCE_USERNAME or CONFLUENCE_PASSWORD not found in .env file")
        return False
    
    log_with_timestamp(f"Starting login process for user: {username}")
    
    # Check if we already have valid cookies
    cookies_valid = await check_existing_cookies()
    if cookies_valid:
        log_with_timestamp("Using existing valid cookies - no need to log in again")
        return True
    
    # Create browser instance with visible window
    browser = Browser(
        config=BrowserConfig(
            headless=False  # Keep browser visible for CAPTCHA resolution
        )
    )
    
    # Create a simple agent just for logging in
    login_agent = Agent(
        task=f"""
        Your task is to log in to the Confluence wiki and save cookies for later use.
        Follow these precise steps:
        
        1. Navigate to {WIKI_URL}
        
        2. You'll see a login page with a THREE-STEP LOGIN PROCESS:
           
           STEP ONE - USERNAME SCREEN:
           a. Take a screenshot and save it as "{SCREENSHOTS_DIR}/login_screen_1.png"
           b. Enter "{username}" in the username field
           c. Click the "Next" button
           
           STEP TWO - PASSWORD SCREEN:
           a. Take a screenshot and save it as "{SCREENSHOTS_DIR}/login_screen_2.png"
           b. Enter "{password}" in the password field
           c. Click the "Log in" button
           
           STEP THREE - CAPTCHA SCREEN (if present):
           a. Take a screenshot and save it as "{SCREENSHOTS_DIR}/captcha_screen.png"
           b. If you see a password field again, re-enter "{password}" 
           c. Tell me: "CAPTCHA detected! Please solve the CAPTCHA manually and click the Log In button."
           d. Wait for me to tell you to continue after I solve the CAPTCHA
        
        3. After successful login:
           a. Take a screenshot of the logged-in home page as "{SCREENSHOTS_DIR}/login_successful.png"
           b. Tell me: "Login successful! Authentication cookies have been saved."
        
        4. If you encounter any error:
           a. Take a screenshot of the error page
           b. Tell me what went wrong
        """,
        llm=ChatOpenAI(model="gpt-4o", temperature=0),
        browser=browser
    )
    
    try:
        log_with_timestamp("Starting login agent...")
        
        # Run the login agent
        result = await login_agent.run()
        log_with_timestamp(f"Login agent result: {result}")
        
        # Check if CAPTCHA was detected in the agent's output
        result_text = str(result)  # Convert the result to a string
        
        if "CAPTCHA detected" in result_text:
            log_with_timestamp("\n" + "="*70)
            log_with_timestamp("CAPTCHA DETECTED - MANUAL INTERVENTION REQUIRED")
            log_with_timestamp("1. Please solve the CAPTCHA in the browser window")
            log_with_timestamp("2. Click the Log In button")
            log_with_timestamp("3. Wait for the page to load completely")
            log_with_timestamp("="*70 + "\n")
            
            # Wait for user to solve CAPTCHA
            user_input = ""
            while user_input.lower() != "continue":
                user_input = input("\nType 'continue' when you've solved the CAPTCHA and logged in: ").strip().lower()
            
            log_with_timestamp("Continuing after manual CAPTCHA resolution...")
            
            # Wait for page to load after CAPTCHA resolution
            await asyncio.sleep(5)
        
        # Save cookies for later use regardless of whether CAPTCHA was needed
        try:
            # Extract cookies from the browser context
            context = await browser.context
            cookies = await context.cookies()
            
            # Save cookies to file
            with open(COOKIES_FILE, 'wb') as f:
                pickle.dump(cookies, f)
            
            log_with_timestamp(f"Cookies saved to {COOKIES_FILE}")
            return True
        except Exception as e:
            log_with_timestamp(f"Error saving cookies: {e}")
            return False
            
    except Exception as e:
        log_with_timestamp(f"Error during login process: {e}")
        return False
    finally:
        try:
            log_with_timestamp("Closing browser...")
            await browser.close()
        except Exception as e:
            log_with_timestamp(f"Error closing browser: {e}")

if __name__ == "__main__":
    success = asyncio.run(main())
    if success:
        log_with_timestamp("Login process completed successfully. Cookies have been saved to wiki_cookies.pkl.")
        log_with_timestamp("Automatically starting content scraping...")
        
        # Automatically run the scrape.py script
        import subprocess
        try:
            log_with_timestamp("Launching scrape.py...")
            subprocess.run(["python3", "scrape.py"], check=True)
        except subprocess.CalledProcessError as e:
            log_with_timestamp(f"Error running scrape.py: {e}")
        except Exception as e:
            log_with_timestamp(f"Unexpected error launching scrape.py: {e}")
    else:
        log_with_timestamp("Login process failed. Please check the screenshots directory for debugging information.")
