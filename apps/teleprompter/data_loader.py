import re
import json
import os

def parse_bullets(filepath):
    if not os.path.exists(filepath):
        print(f"Error: {filepath} not found.")
        return None

    with open(filepath, 'r') as f:
        content = f.read()

    # Find the Timing Breakdown table to get durations
    timing_map = {}
    table_match = re.search(r"## TIMING BREAKDOWN.*?\|(.*?)\|", content, re.DOTALL)
    # Extract durations from the table rows
    rows = re.findall(r"\| (.*?) \| (.*?)s \| (.*?) \|", content)
    for row in rows:
        name = row[0].strip().lower()
        duration = int(row[1].strip())
        timing_map[name] = duration

    # Define our target segments
    segments = []
    
    # 1. Hook
    hook_match = re.search(r"## SEGMENT 1: HOOK.*?(?=## SEGMENT 2)", content, re.DOTALL)
    if hook_match:
        bullets = re.findall(r"[-•] (.*)", hook_match.group(0))
        segments.append({
            "id": 1,
            "title": "HOOK",
            "duration": timing_map.get("hook", 30),
            "bullets": [f"• {b}" for b in bullets]
        })

    # 2. Core Demos (break down into sub-demos)
    demos_match = re.search(r"## SEGMENT 2: CORE DEMOS.*?(?=## SEGMENT 3)", content, re.DOTALL)
    if demos_match:
        demo_blocks = re.split(r"### (DEMO \d+.*)", demos_match.group(0))
        for i in range(1, len(demo_blocks), 2):
            title = demo_blocks[i].split('(')[0].strip()
            # Duration is in the title usually (45 sec)
            dur_match = re.search(r"\((\d+) sec\)", demo_blocks[i])
            duration = int(dur_match.group(1)) if dur_match else 45
            
            block_content = demo_blocks[i+1]
            bullets = []
            for line in block_content.split('\n'):
                line = line.strip()
                if line.startswith('- ') or line.startswith('• '):
                    bullets.append(f"• {line[2:]}")
                elif line.startswith('**Query'):
                    bullets.append(f"[cyan]{line}[/]")
            
            segments.append({
                "id": len(segments) + 1,
                "title": title,
                "duration": duration,
                "bullets": bullets
            })

    # 3. Strategy
    strat_match = re.search(r"## SEGMENT 3: THE STRATEGY.*?(?=## SEGMENT 4)", content, re.DOTALL)
    if strat_match:
        bullets = []
        # Get everything from "SLM + Fine-Tuning" down
        for line in strat_match.group(0).split('\n'):
            line = line.strip()
            if line.startswith('- ') or line.startswith('• '):
                bullets.append(f"• {line[2:]}")
            elif line.startswith('### '):
                bullets.append(f"[bold white]{line[4:]}[/]")
        
        segments.append({
            "id": len(segments) + 1,
            "title": "THE STRATEGY",
            "duration": timing_map.get("strategy", 45),
            "bullets": bullets
        })

    # 4. Close
    close_match = re.search(r"## SEGMENT 4: CLOSE.*?(?=## TIMING)", content, re.DOTALL)
    if close_match:
        bullets = re.findall(r"[-•] (.*)", close_match.group(0))
        segments.append({
            "id": len(segments) + 1,
            "title": "CLOSE",
            "duration": timing_map.get("close", 15),
            "bullets": [f"• {b}" for b in bullets]
        })

    return segments

if __name__ == "__main__":
    guide_path = "../../docs/DEMO-4-MINUTE-BULLETS.md"
    script_data = parse_bullets(guide_path)
    
    if script_data:
        with open("script_data.json", "w") as f:
            json.dump(script_data, f, indent=4)
        print(f"Successfully ingested {len(script_data)} segments from {guide_path}")
