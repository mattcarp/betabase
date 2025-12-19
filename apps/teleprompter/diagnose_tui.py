import asyncio
import os
from prompter import PrompterApp
from textual.widgets import Static

async def diagnose_app():
    print("Starting TUI Diagnostic Test...")
    
    # Force headless mode for testing
    os.environ["TEXTUAL"] = ""
    
    app = PrompterApp()
    
    try:
        async with app.run_test() as pilot:
            print(f"App Started. Initial Screen: {app.screen}")
            
            # Check if #header exists
            try:
                header = app.query_one("#header")
                print(f"SUCCESS: Found #header with size {header.size}")
            except Exception as e:
                print(f"FAILED: Header not found: {e}")

            # Check if #bullet-content exists
            try:
                content = app.query_one("#bullet-content")
                print(f"SUCCESS: Found #bullet-content with size {content.size}")
                # Is it visible?
                if content.size.width == 0 or content.size.height == 0:
                    print("CRITICAL: Widget has zero size! CSS is likely collapsing it.")
            except Exception as e:
                print(f"FAILED: Bullet content not found: {e}")

            # Try to click through splash screen
            print("Simulating key press to dismiss splash screen...")
            await pilot.press("space")
            await pilot.pause()
            print(f"Screen after press: {app.screen}")
            
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(diagnose_app())

from prompter import PrompterApp
from textual.widgets import Static

async def diagnose_app():
    print("Starting TUI Diagnostic Test...")
    
    # Force headless mode for testing
    os.environ["TEXTUAL"] = ""
    
    app = PrompterApp()
    
    try:
        async with app.run_test() as pilot:
            print(f"App Started. Initial Screen: {app.screen}")
            
            # Check if #header exists
            try:
                header = app.query_one("#header")
                print(f"SUCCESS: Found #header with size {header.size}")
            except Exception as e:
                print(f"FAILED: Header not found: {e}")

            # Check if #bullet-content exists
            try:
                content = app.query_one("#bullet-content")
                print(f"SUCCESS: Found #bullet-content with size {content.size}")
                # Is it visible?
                if content.size.width == 0 or content.size.height == 0:
                    print("CRITICAL: Widget has zero size! CSS is likely collapsing it.")
            except Exception as e:
                print(f"FAILED: Bullet content not found: {e}")

            # Try to click through splash screen
            print("Simulating key press to dismiss splash screen...")
            await pilot.press("space")
            await pilot.pause()
            print(f"Screen after press: {app.screen}")
            
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(diagnose_app())
